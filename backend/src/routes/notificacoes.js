const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { adminMiddleware } = require('../middleware/auth');

router.get('/', adminMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM notificacoes ORDER BY criado_em DESC LIMIT 50'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

// IMPORTANTE: rota específica ANTES da rota com parâmetro /:id
router.patch('/marcar-todas-lidas', adminMiddleware, async (req, res) => {
  try {
    await db.query('UPDATE notificacoes SET lida = TRUE');
    res.json({ message: 'Todas marcadas como lidas' });
  } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

router.patch('/:id/lida', adminMiddleware, async (req, res) => {
  try {
    await db.query('UPDATE notificacoes SET lida = TRUE WHERE id = $1', [req.params.id]);
    res.json({ message: 'Marcada como lida' });
  } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

module.exports = router;
