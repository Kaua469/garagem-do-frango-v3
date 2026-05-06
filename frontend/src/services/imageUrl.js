/**
 * getImageUrl(path, bustVersion?)
 *
 * Suporta 3 formatos de URL de imagem:
 *
 *  1. URL absoluta do Vercel Blob  → retorna como está (sem modificar)
 *     ex: https://xxxx.public.blob.vercel-storage.com/garagem/1234.jpg
 *
 *  2. URL relativa (legado /uploads) → converte para URL absoluta do backend
 *     ex: /uploads/frango.jpg  →  https://api.render.com/uploads/frango.jpg
 *
 *  3. null / undefined → retorna null
 *
 * @param {string|null} path  — URL armazenada no banco
 * @param {number} [v]        — versão para cache-busting (do ConfigContext.imageVersion)
 */
export function getImageUrl(path, v) {
  if (!path) return null;

  let url;

  if (path.startsWith('http')) {
    // URL absoluta (Vercel Blob ou externa) — usa diretamente
    url = path;
  } else {
    // URL relativa legada (/uploads/...) — monta a URL do backend
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api')
      .replace(/\/api\/?$/, '');
    url = `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  // Cache-busting: só adiciona ?v= se versão > 0 e a URL não for uma URL de Blob
  // (Blob URLs já são únicas por upload — o bust é útil apenas para URLs estáticas)
  if (v && v > 0 && !url.includes('blob.vercel-storage.com')) {
    const sep = url.includes('?') ? '&' : '?';
    url = `${url}${sep}v=${v}`;
  }

  return url;
}

/**
 * isVercelBlobUrl(url)
 * Retorna true se a URL veio do Vercel Blob Storage
 */
export function isVercelBlobUrl(url) {
  return typeof url === 'string' && url.includes('blob.vercel-storage.com');
}
