/**
 * ─────────────────────────────────────────────────────────────────
 * ROTA DE UPLOAD — VERCEL BLOB STORAGE
 *
 * Substitui completamente o armazenamento local (filesystem).
 * Usa @vercel/blob para armazenar imagens de forma permanente.
 *
 * Variável obrigatória no ambiente:
 *   BLOB_READ_WRITE_TOKEN  (obtida no painel Vercel → Storage → Blob)
 *
 * Fluxo:
 *   1. Multer lê o arquivo na memória (memoryStorage — sem disco)
 *   2. @vercel/blob.put() envia para a CDN da Vercel
 *   3. Retorna a URL pública permanente (https://...)
 * ─────────────────────────────────────────────────────────────────
 */
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const { put } = require('@vercel/blob');
const { adminMiddleware } = require('../middleware/auth');

// ── Multer em MEMÓRIA (sem disco, sem /uploads, sem perda de arquivo)
const memStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/i;
  if (allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens (jpeg, png, gif, webp) são permitidas'), false);
  }
};

const upload = multer({
  storage: memStorage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
});

// ── POST /api/upload
router.post('/', adminMiddleware, upload.single('arquivo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({
        error: 'BLOB_READ_WRITE_TOKEN não configurado. Configure no painel Vercel.',
      });
    }

    // Gera nome único: pasta/timestamp-random.ext
    const ext      = req.file.originalname.split('.').pop().toLowerCase();
    const filename = `garagem/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Envia para Vercel Blob (armazenamento permanente na CDN)
    const blob = await put(filename, req.file.buffer, {
      access: 'public',
      contentType: req.file.mimetype,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Retorna a URL pública permanente
    res.json({
      url: blob.url,          // ex: https://xxxx.public.blob.vercel-storage.com/...
      filename,
    });

  } catch (err) {
    console.error('Erro no upload para Vercel Blob:', err.message);
    res.status(500).json({ error: 'Erro ao fazer upload da imagem: ' + err.message });
  }
});

module.exports = router;
