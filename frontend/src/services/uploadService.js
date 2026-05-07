/**
 * uploadService.js
 *
 * Centraliza o upload de imagens para o Vercel Blob (via backend).
 * Usado por: AdminConfiguracoes, AdminProdutos, AdminNovidades.
 */
import api from './api';

/**
 * Envia um arquivo para o backend que o persiste no Vercel Blob.
 *
 * @param {File} file  — objeto File do <input type="file">
 * @returns {Promise<string>}  — URL pública permanente no Vercel Blob
 * @throws {Error}  — se o upload falhar
 */
export async function uploadImagem(file) {
  if (!file) throw new Error('Nenhum arquivo selecionado');

  const fd = new FormData();
  fd.append('arquivo', file);

  const { data } = await api.post('/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  if (!data?.url) throw new Error('Upload não retornou URL');
  return data.url;
}

/**
 * Cria um data URL local para preview instantâneo
 * (exibe antes do upload completar)
 *
 * @param {File} file
 * @returns {Promise<string>}  — data:image/... URL
 */
export function criarPreviewLocal(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}
