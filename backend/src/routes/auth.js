const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { telefone, senha } = req.body;
    if (!telefone || !senha)
      return res.status(400).json({ error: 'Telefone e senha são obrigatórios' });

    const { rows } = await db.query(
      'SELECT * FROM usuarios WHERE telefone = $1 AND ativo = TRUE',
      [telefone]
    );
    if (!rows.length) return res.status(401).json({ error: 'Credenciais inválidas' });

    const usuario = rows[0];
    const ok = await bcrypt.compare(senha, usuario.senha);
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign(
      { id: usuario.id, tipo: usuario.tipo },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      usuario: {
        id:    usuario.id,
        nome:  usuario.nome,
        telefone: usuario.telefone,
        tipo:  usuario.tipo,
        precisa_alterar_acesso: usuario.precisa_alterar_acesso,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// POST /api/auth/cadastro
router.post('/cadastro', async (req, res) => {
  try {
    const { nome, telefone, senha } = req.body;
    if (!nome || !telefone || !senha)
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });

    const { rows: exist } = await db.query(
      'SELECT id FROM usuarios WHERE telefone = $1',
      [telefone]
    );
    if (exist.length) return res.status(409).json({ error: 'Telefone já cadastrado' });

    const hash = await bcrypt.hash(senha, 10);
    const { rows } = await db.query(
      'INSERT INTO usuarios (nome, telefone, senha, tipo) VALUES ($1,$2,$3,$4) RETURNING id',
      [nome, telefone, hash, 'cliente']
    );
    const id = rows[0].id;

    const token = jwt.sign({ id, tipo: 'cliente' }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.status(201).json({ token, usuario: { id, nome, telefone, tipo: 'cliente' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao cadastrar' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({ usuario: req.usuario });
});

// POST /api/auth/primeiro-acesso
router.post('/primeiro-acesso', authMiddleware, async (req, res) => {
  try {
    const { novo_telefone, nova_senha, confirmar_senha } = req.body;
    if (!novo_telefone || !nova_senha || !confirmar_senha)
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    if (nova_senha !== confirmar_senha)
      return res.status(400).json({ error: 'Senhas não conferem' });
    if (nova_senha.length < 8)
      return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres' });

    const { rows: exist } = await db.query(
      'SELECT id FROM usuarios WHERE telefone = $1 AND id != $2',
      [novo_telefone, req.usuario.id]
    );
    if (exist.length) return res.status(409).json({ error: 'Telefone já em uso' });

    const hash = await bcrypt.hash(nova_senha, 10);
    await db.query(
      'UPDATE usuarios SET telefone = $1, senha = $2, precisa_alterar_acesso = FALSE WHERE id = $3',
      [novo_telefone, hash, req.usuario.id]
    );

    res.json({ message: 'Acesso atualizado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar acesso' });
  }
});

module.exports = router;
