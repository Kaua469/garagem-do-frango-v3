require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { initSocket } = require('./socket');
const db = require('./config/db');

const app = express();
const server = http.createServer(app);

// Init Socket.IO
initSocket(server);

// Middlewares
// CORS: aceita a URL exata do Vercel + qualquer preview URL do Vercel
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,                    // URL principal (ex: https://garagem.vercel.app)
  'http://localhost:5173',                     // dev local Vite
  'http://localhost:3000',                     // dev local
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Permite requisições sem origin (Postman, mobile apps)
    if (!origin) return callback(null, true);
    // Permite qualquer deploy de preview da Vercel
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    // Permite origins configuradas
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error('CORS: origem não permitida — ' + origin));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/produtos', require('./routes/produtos'));
app.use('/api/pedidos', require('./routes/pedidos'));
app.use('/api/financeiro', require('./routes/financeiro'));
app.use('/api/novidades', require('./routes/novidades'));
app.use('/api/configuracoes', require('./routes/configuracoes'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/notificacoes', require('./routes/notificacoes'));
app.use('/api/avaliacoes', require('./routes/avaliacoes'));
app.use('/api/upload', require('./routes/upload'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler global — captura erros assíncronos e de validação
app.use((err, req, res, next) => {
  // Erro de CORS
  if (err.message && err.message.startsWith('CORS')) {
    return res.status(403).json({ error: err.message });
  }
  // Erros de validação do multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Arquivo muito grande (máximo 8MB)' });
  }
  if (err.message && err.message.includes('Apenas imagens')) {
    return res.status(415).json({ error: err.message });
  }
  // Erro de JWT expirado
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
  console.error('[ERROR]', req.method, req.path, '→', err.message || err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🍗 Garagem do Frango API rodando na porta ${PORT}`);
});
