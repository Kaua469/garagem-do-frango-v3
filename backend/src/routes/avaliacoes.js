const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { adminMiddleware } = require('../middleware/auth');

// GET público — apenas ativas
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM avaliacoes WHERE ativo = TRUE ORDER BY criado_em DESC LIMIT 10'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

// GET admin — todas
router.get('/todas', adminMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM avaliacoes ORDER BY criado_em DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

// POST público — enviado pelo cliente
router.post('/public', async (req, res) => {
  try {
    const { nome, nota, comentario } = req.body;
    if (!nome || !comentario)
      return res.status(400).json({ error: 'Nome e comentário obrigatórios' });
    
    const { rows } = await db.query(
      'INSERT INTO avaliacoes (nome, nota, comentario, ativo) VALUES ($1,$2,$3,FALSE) RETURNING id',
      [nome, nota || 5, comentario]
    );
    res.status(201).json({ id: rows[0].id, message: 'Feedback enviado com sucesso!' });
  } catch (err) { res.status(500).json({ error: 'Erro ao enviar feedback' }); }
});

// POST — criar (admin)
router.post('/', adminMiddleware, async (req, res) => {
  try {
    const { nome, nota, comentario, ativo } = req.body;
    if (!nome || !comentario)
      return res.status(400).json({ error: 'Nome e comentário obrigatórios' });
    const { rows } = await db.query(
      'INSERT INTO avaliacoes (nome, nota, comentario, ativo) VALUES ($1,$2,$3,$4) RETURNING id',
      [nome, nota || 5, comentario, ativo !== false]
    );
    res.status(201).json({ id: rows[0].id });
  } catch (err) { res.status(500).json({ error: 'Erro ao criar' }); }
});

// PUT — editar
router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const { nome, nota, comentario, ativo } = req.body;
    await db.query(
      'UPDATE avaliacoes SET nome=$1, nota=$2, comentario=$3, ativo=$4 WHERE id=$5',
      [nome, nota || 5, comentario, !!ativo, req.params.id]
    );
    res.json({ message: 'Atualizada' });
  } catch (err) { res.status(500).json({ error: 'Erro ao atualizar' }); }
});

// DELETE
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM avaliacoes WHERE id = $1', [req.params.id]);
    res.json({ message: 'Removida' });
  } catch (err) { res.status(500).json({ error: 'Erro ao remover' }); }
});

module.exports = router;
