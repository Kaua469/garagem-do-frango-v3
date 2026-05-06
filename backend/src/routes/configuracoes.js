const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const bcrypt  = require('bcrypt');
const { adminMiddleware } = require('../middleware/auth');

// GET /api/configuracoes (público)
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT chave, valor FROM configuracoes');
    const config = {};
    rows.forEach(r => { config[r.chave] = r.valor; });
    res.json(config);
  } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

// PUT /api/configuracoes (admin)
router.put('/', adminMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    for (const [chave, valor] of Object.entries(updates)) {
      // PostgreSQL: ON CONFLICT DO UPDATE (equivalente ao ON DUPLICATE KEY UPDATE)
      await db.query(
        `INSERT INTO configuracoes (chave, valor)
         VALUES ($1, $2)
         ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor`,
        [chave, valor]
      );
    }
    res.json({ message: 'Configurações atualizadas' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

// PUT /api/configuracoes/conta (admin)
router.put('/conta', adminMiddleware, async (req, res) => {
  try {
    const { novo_telefone, nova_senha, confirmar_senha } = req.body;

    if (novo_telefone) {
      const { rows } = await db.query(
        'SELECT id FROM usuarios WHERE telefone = $1 AND id != $2',
        [novo_telefone, req.usuario.id]
      );
      if (rows.length) return res.status(409).json({ error: 'Telefone já em uso' });
      await db.query('UPDATE usuarios SET telefone = $1 WHERE id = $2', [novo_telefone, req.usuario.id]);
    }

    if (nova_senha) {
      if (nova_senha !== confirmar_senha) return res.status(400).json({ error: 'Senhas não conferem' });
      if (nova_senha.length < 8) return res.status(400).json({ error: 'Mínimo 8 caracteres' });
      const hash = await bcrypt.hash(nova_senha, 10);
      await db.query('UPDATE usuarios SET senha = $1 WHERE id = $2', [hash, req.usuario.id]);
    }

    res.json({ message: 'Conta atualizada com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar conta' });
  }
});

module.exports = router;
