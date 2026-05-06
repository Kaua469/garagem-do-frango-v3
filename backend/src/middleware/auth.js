const jwt = require('jsonwebtoken');
const db  = require('../config/db');

// ── authMiddleware ─────────────────────────────────────────────────────────
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-dev');
    const { rows } = await db.query(
      'SELECT id, nome, telefone, tipo, precisa_alterar_acesso FROM usuarios WHERE id = $1 AND ativo = TRUE',
      [decoded.id]
    );
    if (!rows.length) return res.status(401).json({ error: 'Usuário não encontrado' });
    req.usuario = rows[0];
    next();
  } catch (err) {
    // Distingue token expirado de token inválido
    const msg = err.name === 'TokenExpiredError'
      ? 'Token expirado — faça login novamente'
      : 'Token inválido';
    return res.status(401).json({ error: msg });
  }
}

// ── adminMiddleware ────────────────────────────────────────────────────────
// FIX: não usa callback aninhado — cadeia corretamente com next()
function adminMiddleware(req, res, next) {
  authMiddleware(req, res, (err) => {
    if (err) return; // authMiddleware já respondeu
    if (!req.usuario) return res.status(401).json({ error: 'Não autenticado' });
    if (req.usuario.tipo !== 'dona') {
      return res.status(403).json({ error: 'Acesso negado — apenas a dona pode acessar esta área' });
    }
    // Bloqueia acesso ao painel se precisa redefinir senha
    if (req.usuario.precisa_alterar_acesso && req.path !== '/primeiro-acesso') {
      return res.status(403).json({ error: 'Redefina sua senha antes de continuar' });
    }
    next();
  });
}

module.exports = { authMiddleware, adminMiddleware };
