const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { adminMiddleware } = require('../middleware/auth');

// GET /api/financeiro (admin)
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const { mes } = req.query;
    const params  = [];
    let where = '';
    if (mes) {
      params.push(mes);
      where = `WHERE TO_CHAR(data,'YYYY-MM') = $${params.length}`;
    }
    params.push(100);
    const { rows } = await db.query(
      `SELECT * FROM financeiro ${where} ORDER BY data DESC, id DESC LIMIT $${params.length}`,
      params
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

// POST /api/financeiro (admin)
router.post('/', adminMiddleware, async (req, res) => {
  try {
    const { tipo, descricao, valor, categoria, data } = req.body;
    const { rows } = await db.query(
      'INSERT INTO financeiro (tipo, descricao, valor, categoria, data) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [tipo, descricao, valor, categoria || 'geral', data]
    );
    res.status(201).json({ id: rows[0].id });
  } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

module.exports = router;
