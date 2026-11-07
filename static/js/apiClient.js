/**
 * Mrs. Pets Unified API Client
 * Provee métodos helpers estandarizados para interacción con microservicios.
 */
(function() {
  window.apiClient = window.apiClient || {
    async get(url, options = {}) {
      try {
        const res = await fetch(url, options);
        return await res.json();
      } catch (e) {
        console.warn('[apiClient] GET error:', e);
        return { status: 'error', error: e.message };
      }
    },
    async post(url, data, options = {}) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
          body: JSON.stringify(data),
          ...options
        });
        return await res.json();
      } catch (e) {
        console.warn('[apiClient] POST error:', e);
        return { status: 'error', error: e.message };
      }
    }
  };
})();
