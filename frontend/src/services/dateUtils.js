/**
 * Formata data vinda do MySQL de forma segura em todos os navegadores.
 * O MySQL retorna DATE como "YYYY-MM-DD" e DATETIME como "YYYY-MM-DD HH:MM:SS"
 * ou "YYYY-MM-DDTHH:MM:SS.000Z". new Date("YYYY-MM-DD") falha no Safari.
 */

/**
 * Converte qualquer valor de data MySQL em objeto Date seguro.
 * @param {string|Date|null} val
 * @returns {Date|null}
 */
function parseData(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val) ? null : val;

  const str = String(val).trim();

  // Formato DATE puro: "2026-04-09"
  const dateOnly = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    return new Date(
      parseInt(dateOnly[1]),
      parseInt(dateOnly[2]) - 1,
      parseInt(dateOnly[3])
    );
  }

  // Formato DATETIME MySQL: "2026-04-09 14:30:00"
  const dateTime = str.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
  if (dateTime) {
    return new Date(
      parseInt(dateTime[1]),
      parseInt(dateTime[2]) - 1,
      parseInt(dateTime[3]),
      parseInt(dateTime[4]),
      parseInt(dateTime[5]),
      parseInt(dateTime[6])
    );
  }

  // ISO com timezone: deixar o browser lidar (geralmente funciona)
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formata como "dd/mm/aaaa"
 */
export function formatarData(val) {
  const d = parseData(val);
  if (!d) return '–';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const aaaa = d.getFullYear();
  return `${dd}/${mm}/${aaaa}`;
}

/**
 * Formata como "dd/mm/aaaa às HH:MM"
 */
export function formatarDataHora(val) {
  const d = parseData(val);
  if (!d) return '–';
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const aaaa = d.getFullYear();
  const hh   = String(d.getHours()).padStart(2, '0');
  const min  = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${aaaa} às ${hh}:${min}`;
}

/**
 * Formata como "HH:MM"
 */
export function formatarHora(val) {
  const d = parseData(val);
  if (!d) return '–';
  const hh  = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

/**
 * Formata como "dd/mm" (para gráficos)
 */
export function formatarDataCurta(val) {
  const d = parseData(val);
  if (!d) return '–';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}
