"""
Facturación — Mrs Pets staging.

* Numeración correlativa por serie con bloqueo transaccional.
* Cálculo fiscal: subtotal -> descuento -> base imponible -> IVA -> IGTF.
* Total en letras en español venezolano, congelado al emitir.
* PDF (carta y ticket 80mm) con ReportLab.
"""
import io
import logging
from datetime import datetime, timezone

from db import get_conn, q, execute, IS_POSTGRES

log = logging.getLogger("mrspets.facturacion")


# =====================================================================
# TOTAL EN LETRAS — español venezolano
# =====================================================================
UNIDADES = ["", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE",
            "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS",
            "DIECISIETE", "DIECIOCHO", "DIECINUEVE", "VEINTE"]
DECENAS = ["", "", "VEINTI", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA",
           "SETENTA", "OCHENTA", "NOVENTA"]
CENTENAS = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS",
            "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"]


def _centenas(n: int) -> str:
    """0..999 en letras."""
    if n == 0:
        return ""
    if n == 100:
        return "CIEN"
    partes = []
    c, resto = divmod(n, 100)
    if c:
        partes.append(CENTENAS[c])
    if resto:
        if resto <= 20:
            partes.append(UNIDADES[resto])
        elif resto < 30:
            partes.append("VEINTI" + UNIDADES[resto - 20].lower().upper()
                          if resto > 20 else "VEINTE")
        else:
            d, u = divmod(resto, 10)
            if u:
                partes.append(f"{DECENAS[d]} Y {UNIDADES[u]}")
            else:
                partes.append(DECENAS[d])
    return " ".join(p for p in partes if p)


def _miles(n: int) -> str:
    """0..999999 en letras."""
    if n == 0:
        return ""
    miles, resto = divmod(n, 1000)
    partes = []
    if miles:
        if miles == 1:
            partes.append("MIL")
        else:
            partes.append(f"{_centenas(miles)} MIL")
    if resto:
        partes.append(_centenas(resto))
    return " ".join(p for p in partes if p)


def numero_a_letras(n: int) -> str:
    """Entero positivo en letras (hasta billones)."""
    if n == 0:
        return "CERO"
    if n < 0:
        return "MENOS " + numero_a_letras(-n)

    partes = []
    billones, resto = divmod(n, 10**12)
    millones, resto = divmod(resto, 10**6)
    miles, unidades = divmod(resto, 1000)

    if billones:
        partes.append("UN BILLÓN" if billones == 1 else f"{_miles(billones)} BILLONES")
    if millones:
        partes.append("UN MILLÓN" if millones == 1 else f"{_miles(millones)} MILLONES")
    if miles:
        partes.append("MIL" if miles == 1 else f"{_miles(miles)} MIL")
    if unidades:
        partes.append(_centenas(unidades))
    return " ".join(p for p in partes if p)


def total_en_letras(monto: float, moneda: str = "USD") -> str:
    """
    'OCHENTA Y NUEVE DÓLARES CON 25/100'
    'UN MILLÓN DOSCIENTOS ... BOLÍVARES CON 05/100'
    """
    monto = round(float(monto or 0), 2)
    entero = int(monto)
    centavos = int(round((monto - entero) * 100))
    if centavos == 100:
        entero += 1
        centavos = 0

    letras = numero_a_letras(entero)

    if moneda == "USD":
        singular, plural = "DÓLAR", "DÓLARES"
    elif moneda == "VES":
        singular, plural = "BOLÍVAR", "BOLÍVARES"
    else:
        singular, plural = moneda, moneda

    # "UN MILLÓN DE BOLÍVARES" cuando el número termina en millón exacto
    if entero == 1:
        nombre = singular
    elif entero % 10**6 == 0 and entero >= 10**6:
        nombre = f"DE {plural}"
    else:
        nombre = plural

    return f"{letras} {nombre} CON {centavos:02d}/100"


# =====================================================================
# CÁLCULO FISCAL
# =====================================================================
def calcular_totales(items, descuento_global=0.0, iva_pct=16.0,
                     igtf_pct=0.0, monto_divisas=0.0):
    """
    items: [{cantidad, precio_unitario, descuento_linea}]
    Orden obligatorio: subtotal -> descuentos -> base -> IVA -> IGTF.
    El IGTF se aplica SOLO sobre la porción pagada en divisas.
    """
    subtotal = 0.0
    for it in items:
        cant = float(it.get("cantidad") or 1)
        precio = float(it.get("precio_unitario") or 0)
        desc = float(it.get("descuento_linea") or 0)
        subtotal += max(0.0, cant * precio - desc)

    descuento_global = min(float(descuento_global or 0), subtotal)
    base = round(subtotal - descuento_global, 2)
    iva_monto = round(base * (float(iva_pct) / 100.0), 2)

    # IGTF: 3% sobre lo que se paga en divisas (proporcional a la base)
    igtf_monto = 0.0
    if igtf_pct and monto_divisas:
        porcion = min(float(monto_divisas), base)
        igtf_monto = round(porcion * (float(igtf_pct) / 100.0), 2)

    total = round(base + iva_monto + igtf_monto, 2)
    return {
        "subtotal": round(subtotal, 2),
        "descuento": round(descuento_global, 2),
        "base_imponible": base,
        "iva_pct": float(iva_pct),
        "iva_monto": iva_monto,
        "igtf_pct": float(igtf_pct or 0),
        "igtf_monto": igtf_monto,
        "total": total,
    }


# =====================================================================
# NUMERACIÓN CORRELATIVA — bloqueo transaccional
# =====================================================================
def siguiente_numero(serie_codigo: str):
    """
    Reserva el siguiente número de la serie DENTRO de una transacción.

    Postgres: BEGIN IMMEDIATE equivalente -> UPDATE ... RETURNING toma el lock
    de fila; dos cajeros se serializan y nunca reciben el mismo número.
    Si la transacción falla, el número NO se consume (rollback).
    """
    with get_conn() as conn:
        cur = conn.cursor()
        if IS_POSTGRES:
            cur.execute("BEGIN")
            cur.execute(
                """UPDATE series_factura
                   SET ultimo_numero = ultimo_numero + 1, updated_at = NOW()
                   WHERE codigo = %s
                   RETURNING id, ultimo_numero, prefijo""",
                (serie_codigo,),
            )
            row = cur.fetchone()
        else:
            cur.execute("BEGIN IMMEDIATE")
            cur.execute(
                "SELECT id, ultimo_numero, prefijo FROM series_factura WHERE codigo = ?",
                (serie_codigo,),
            )
            row = cur.fetchone()
            if row:
                nuevo = row[1] + 1
                cur.execute(
                    "UPDATE series_factura SET ultimo_numero = ?, updated_at = CURRENT_TIMESTAMP "
                    "WHERE id = ?", (nuevo, row[0]),
                )
                row = (row[0], nuevo, row[2])
        if not row:
            cur.execute("ROLLBACK")
            cur.close()
            raise ValueError(f"Serie '{serie_codigo}' no existe")
        serie_id, numero, prefijo = (row[0], row[1], row[2]) if not isinstance(row, dict) \
            else (row["id"], row["ultimo_numero"], row["prefijo"])
        cur.close()
        return serie_id, numero, f"{prefijo}-{numero:06d}"


# =====================================================================
# PDF
# =====================================================================
def generar_pdf(factura: dict, items: list, negocio: dict, formato: str = "carta") -> bytes:
    """Genera el PDF de la factura. formato: 'carta' | 'ticket'."""
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import mm
    from reportlab.lib import colors
    from reportlab.pdfgen import canvas

    buf = io.BytesIO()

    if formato == "ticket":
        ancho = 80 * mm
        alto = max(200 * mm, (120 + len(items) * 8) * mm)
        c = canvas.Canvas(buf, pagesize=(ancho, alto))
        y = alto - 12 * mm
        c.setFont("Courier-Bold", 9)
        c.drawCentredString(ancho / 2, y, negocio.get("razon_social", "MRS PETS")[:34])
        y -= 4 * mm
        c.setFont("Courier", 6.5)
        for linea in [negocio.get("rif", ""), negocio.get("direccion", "")[:40],
                      negocio.get("telefono", "")]:
            if linea:
                c.drawCentredString(ancho / 2, y, linea)
                y -= 3 * mm
        y -= 2 * mm
        c.setFont("Courier-Bold", 8)
        c.drawCentredString(ancho / 2, y, factura["numero_completo"])
        y -= 4 * mm
        c.setFont("Courier", 6.5)
        c.drawString(4 * mm, y, f"Fecha: {str(factura.get('fecha_emision') or '')[:19]}")
        y -= 3 * mm
        c.drawString(4 * mm, y, f"Cliente: {factura['cliente_nombre'][:32]}")
        y -= 3 * mm
        if factura.get("cliente_rif"):
            c.drawString(4 * mm, y, f"RIF: {factura['cliente_rif']}")
            y -= 3 * mm
        y -= 1 * mm
        c.line(4 * mm, y, ancho - 4 * mm, y)
        y -= 3.5 * mm
        c.setFont("Courier-Bold", 6.5)
        c.drawString(4 * mm, y, "CONCEPTO")
        c.drawRightString(ancho - 4 * mm, y, "TOTAL")
        y -= 3 * mm
        c.setFont("Courier", 6.5)
        for it in items:
            concepto = str(it["concepto"])[:30]
            c.drawString(4 * mm, y, concepto)
            y -= 3 * mm
            c.drawString(6 * mm, y, f"{it['cantidad']:g} x {it['precio_unitario']:.2f}")
            c.drawRightString(ancho - 4 * mm, y, f"{it['total_linea']:.2f}")
            y -= 3.5 * mm
        c.line(4 * mm, y, ancho - 4 * mm, y)
        y -= 4 * mm
        c.setFont("Courier", 7)
        for etiqueta, valor in [("Subtotal", factura["subtotal"]),
                                ("Descuento", factura["descuento"]),
                                ("Base imponible", factura["base_imponible"]),
                                (f"IVA {factura['iva_pct']:g}%", factura["iva_monto"])]:
            if valor:
                c.drawString(4 * mm, y, etiqueta)
                c.drawRightString(ancho - 4 * mm, y, f"{valor:.2f}")
                y -= 3 * mm
        if factura.get("igtf_monto"):
            c.drawString(4 * mm, y, f"IGTF {factura['igtf_pct']:g}%")
            c.drawRightString(ancho - 4 * mm, y, f"{factura['igtf_monto']:.2f}")
            y -= 3 * mm
        c.setFont("Courier-Bold", 9)
        c.drawString(4 * mm, y, "TOTAL USD")
        c.drawRightString(ancho - 4 * mm, y, f"{factura['total']:.2f}")
        y -= 5 * mm
        c.setFont("Courier", 6)
        letras = factura.get("total_letras") or ""
        for i in range(0, len(letras), 38):
            c.drawString(4 * mm, y, letras[i:i + 38])
            y -= 2.8 * mm
        y -= 2 * mm
        c.drawCentredString(ancho / 2, y, "¡Gracias por consentir a su princesa!")
        c.showPage()
        c.save()
        return buf.getvalue()

    # ---- CARTA ----
    c = canvas.Canvas(buf, pagesize=letter)
    W, H = letter
    M = 18 * mm
    y = H - M

    c.setFillColor(colors.HexColor("#7C3AED"))
    c.rect(0, H - 32 * mm, W, 32 * mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 17)
    c.drawString(M, H - 16 * mm, negocio.get("razon_social", "MRS PETS CORP, C.A."))
    c.setFont("Helvetica", 8.5)
    c.drawString(M, H - 22 * mm, f"RIF: {negocio.get('rif', '')}")
    c.drawString(M, H - 26.5 * mm, negocio.get("direccion", "")[:70])
    c.drawString(M, H - 30.5 * mm, f"Tel: {negocio.get('telefono', '')}")

    c.setFont("Helvetica-Bold", 13)
    c.drawRightString(W - M, H - 16 * mm, "FACTURA")
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(W - M, H - 22 * mm, factura["numero_completo"])
    c.setFont("Helvetica", 8.5)
    c.drawRightString(W - M, H - 26.5 * mm,
                      f"Fecha: {str(factura.get('fecha_emision') or '')[:10]}")

    y = H - 42 * mm
    c.setFillColor(colors.HexColor("#F3F4F6"))
    c.rect(M, y - 20 * mm, W - 2 * M, 20 * mm, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#111827"))
    c.setFont("Helvetica-Bold", 8)
    c.drawString(M + 4 * mm, y - 5 * mm, "CLIENTE")
    c.setFont("Helvetica", 9)
    c.drawString(M + 4 * mm, y - 10 * mm, factura["cliente_nombre"][:55])
    c.setFont("Helvetica", 8)
    c.drawString(M + 4 * mm, y - 14.5 * mm,
                 f"RIF: {factura.get('cliente_rif') or '—'}   "
                 f"Tel: {factura.get('cliente_telefono') or '—'}")
    c.drawString(M + 4 * mm, y - 18.5 * mm,
                 f"Email: {factura.get('cliente_email') or '—'}")

    y -= 28 * mm
    c.setFillColor(colors.HexColor("#7C3AED"))
    c.rect(M, y, W - 2 * M, 7 * mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(M + 3 * mm, y + 2.3 * mm, "CONCEPTO")
    c.drawRightString(W - M - 45 * mm, y + 2.3 * mm, "CANT")
    c.drawRightString(W - M - 25 * mm, y + 2.3 * mm, "P. UNIT")
    c.drawRightString(W - M - 3 * mm, y + 2.3 * mm, "TOTAL")
    y -= 7 * mm

    c.setFillColor(colors.HexColor("#111827"))
    c.setFont("Helvetica", 8.5)
    for i, it in enumerate(items):
        if i % 2 == 0:
            c.setFillColor(colors.HexColor("#FAFAFA"))
            c.rect(M, y - 1.5 * mm, W - 2 * M, 7 * mm, fill=1, stroke=0)
        c.setFillColor(colors.HexColor("#111827"))
        c.drawString(M + 3 * mm, y + 1 * mm, str(it["concepto"])[:52])
        c.drawRightString(W - M - 45 * mm, y + 1 * mm, f"{it['cantidad']:g}")
        c.drawRightString(W - M - 25 * mm, y + 1 * mm, f"{it['precio_unitario']:.2f}")
        c.drawRightString(W - M - 3 * mm, y + 1 * mm, f"{it['total_linea']:.2f}")
        y -= 7 * mm

    y -= 3 * mm
    c.setStrokeColor(colors.HexColor("#E5E7EB"))
    c.line(M, y, W - M, y)
    y -= 6 * mm

    filas = [("Subtotal", factura["subtotal"]),
             ("Descuento", -factura["descuento"] if factura["descuento"] else 0),
             ("Base imponible", factura["base_imponible"]),
             (f"IVA {factura['iva_pct']:g}%", factura["iva_monto"])]
    if factura.get("igtf_monto"):
        filas.append((f"IGTF {factura['igtf_pct']:g}%", factura["igtf_monto"]))

    c.setFont("Helvetica", 9)
    for etiqueta, valor in filas:
        if valor:
            c.drawRightString(W - M - 30 * mm, y, etiqueta)
            c.drawRightString(W - M - 3 * mm, y, f"{valor:,.2f}")
            y -= 5.5 * mm

    c.setFillColor(colors.HexColor("#7C3AED"))
    c.rect(W - M - 62 * mm, y - 3 * mm, 62 * mm, 9 * mm, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(W - M - 59 * mm, y, "TOTAL USD")
    c.drawRightString(W - M - 3 * mm, y, f"{factura['total']:,.2f}")
    y -= 12 * mm

    c.setFillColor(colors.HexColor("#111827"))
    c.setFont("Helvetica-Oblique", 8)
    letras = factura.get("total_letras") or ""
    for i in range(0, len(letras), 95):
        c.drawString(M, y, letras[i:i + 95])
        y -= 4 * mm

    if factura.get("total_ves"):
        y -= 2 * mm
        c.setFont("Helvetica", 8.5)
        c.drawString(M, y, f"Equivalente en Bs.: {factura['total_ves']:,.2f} "
                           f"(tasa {factura.get('tasa_bcv') or 0:,.2f})")
        y -= 5 * mm

    y -= 4 * mm
    c.setFont("Helvetica", 8)
    c.drawString(M, y, f"Estado: {factura['estado'].upper()}")
    if factura.get("motivo_anulacion"):
        y -= 4 * mm
        c.setFillColor(colors.HexColor("#DC2626"))
        c.drawString(M, y, f"ANULADA: {factura['motivo_anulacion'][:80]}")

    c.setFillColor(colors.HexColor("#6B7280"))
    c.setFont("Helvetica", 7)
    c.drawCentredString(W / 2, 14 * mm,
                        "Documento generado por el sistema Mrs Pets — "
                        "válido como comprobante interno de staging.")
    c.showPage()
    c.save()
    return buf.getvalue()
