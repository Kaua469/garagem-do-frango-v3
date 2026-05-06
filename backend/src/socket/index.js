const { Server } = require('socket.io');

let io;

function initSocket(server) {
  // Socket.IO CORS — espelha a mesma política do Express CORS
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
  ].filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (origin.endsWith('.vercel.app')) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error('Socket CORS: origem não permitida'));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    socket.on('entrar-admin', () => {
      socket.join('admin');
      console.log(`👑 Admin entrou na sala: ${socket.id}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.IO não inicializado');
  return io;
}

module.exports = { initSocket, getIO };
