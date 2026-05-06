const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { adminMiddleware } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM novidades WHERE ativo = TRUE ORDER BY criado_em DESC'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

router.get('/todas', adminMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM novidades ORDER BY criado_em DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

router.post('/', adminMiddleware, async (req, res) => {
  try {
    const { titulo, descricao, imagem } = req.body;
    const { rows } = await db.query(
      'INSERT INTO novidades (titulo, descricao, imagem) VALUES ($1,$2,$3) RETURNING id',
      [titulo, descricao, imagem || null]
    );
    res.status(201).json({ id: rows[0].id });
  } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const { titulo, descricao, imagem, ativo } = req.body;
    await db.query(
      'UPDATE novidades SET titulo=$1, descricao=$2, imagem=$3, ativo=$4 WHERE id=$5',
      [titulo, descricao, imagem, ativo !== false, req.params.id]
    );
    res.json({ message: 'Novidade atualizada' });
  } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM novidades WHERE id = $1', [req.params.id]);
    res.json({ message: 'Removida' });
  } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

module.exports = router;
