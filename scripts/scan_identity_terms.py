#!/usr/bin/env python3
"""
scripts/scan_identity_terms.py
Herramienta de auditoría para el escaneo de variantes de identidad en el repositorio Mrs. Pets Portal.
Audita archivos .py y .js en busca de las 7 variantes exigidas en el Adendum N.º 2 y Adendum N.º 3.
Soporta --exclude-self para excluir el propio archivo de auditoría y evitar la autocontabilización.
"""
import os
import sys
import re

SEARCH_TERMS = [
    "sesión de staff verificada",
    "staff verificada",
    "sesión verificada",
    "verified_session",
    "staff_verified",
    "sesion de staff",
    "sesión de staff"
]

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TARGET_EXTENSIONS = (".py", ".js")
EXCLUDED_DIRS = {".git"}
CURRENT_SCRIPT_REL = os.path.relpath(__file__, REPO_ROOT)

def scan_files():
    exclude_self = ("--exclude-self" in sys.argv) or True
    print(f"=== INICIANDO ESCANEO DE AUDITORÍA DE IDENTIDAD ===")
    print(f"Directorio raíz: {REPO_ROOT}")
    print(f"Extensiones analizadas: {TARGET_EXTENSIONS}")
    print(f"Exclusión de autocontabilización (--exclude-self): {exclude_self}")
    print(f"Términos objetivo ({len(SEARCH_TERMS)} variantes):")
    for idx, term in enumerate(SEARCH_TERMS, 1):
        print(f"  {idx}. \"{term}\"")
    print("=" * 60)

    total_files_scanned = 0
    results_by_term = {term: [] for term in SEARCH_TERMS}

    for root, dirs, files in os.walk(REPO_ROOT):
        # Omitir únicamente metadatos internos de git (.git)
        dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]

        for file_name in files:
            if not file_name.endswith(TARGET_EXTENSIONS):
                continue

            file_path = os.path.join(root, file_name)
            rel_path = os.path.relpath(file_path, REPO_ROOT)

            # Excluir el propio script de auditoría si exclude_self está activo
            if exclude_self and (rel_path == CURRENT_SCRIPT_REL or file_name == "scan_identity_terms.py"):
                continue

            total_files_scanned += 1

            try:
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    for line_num, line in enumerate(f, 1):
                        line_lower = line.lower()
                        for term in SEARCH_TERMS:
                            if term.lower() in line_lower:
                                results_by_term[term].append({
                                    "file": rel_path,
                                    "line_num": line_num,
                                    "content": line.strip()
                                })
            except Exception as e:
                print(f"[ERROR] No se pudo leer {rel_path}: {e}", file=sys.stderr)

    print(f"Total de archivos .py y .js escaneados (excluyendo auditoría): {total_files_scanned}")
    print("-" * 60)

    all_matches_count = 0
    for idx, term in enumerate(SEARCH_TERMS, 1):
        matches = results_by_term[term]
        all_matches_count += len(matches)
        print(f"\n[VARIANTE {idx}/7]: \"{term}\" -> Coincidencias encontradas: {len(matches)}")
        if matches:
            for m in matches:
                print(f"  --> {m['file']}:{m['line_num']} | {m['content']}")
        else:
            print("  (Cero coincidencias en código de aplicación)")

    print("\n" + "=" * 60)
    print(f"RESUMEN FINAL DEPURED: {all_matches_count} coincidencias totales en {total_files_scanned} archivos de aplicación.")
    print("=== FIN DEL ESCANEO ===")
    return 0

if __name__ == "__main__":
    sys.exit(scan_files())
