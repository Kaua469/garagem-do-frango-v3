import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { usuario } = useAuth();
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [toasts, setToasts] = useState([]);
  const socketRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (usuario?.tipo !== 'dona') return;

    // Tenta encontrar a URL do socket automaticamente se não estiver no .env
    const fallbackUrl = window.location.origin.replace('frontend', 'backend').replace('3000', '3000');
    const socketUrl = import.meta.env.VITE_SOCKET_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : '');
    
    console.log('🔌 Tentando conectar socket em:', socketUrl || 'URL Padrão');

    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'] // Tenta websocket primeiro
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket conectado com sucesso!');
      socket.emit('entrar-admin');
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Erro de conexão no Socket:', err.message);
    });

    socket.on('novo-pedido', (dados) => {
      const notif = { id: Date.now(), tipo: 'novo_pedido', titulo: '🍗 Novo pedido recebido!', dados, lida: false, criado_em: new Date().toISOString() };
      addNotificacao(notif);
      addToast(notif);
      tocarSom();
    });

    socket.on('estoque-baixo', (dados) => {
      const notif = { id: Date.now(), tipo: 'estoque_baixo', titulo: '⚠️ Estoque baixo!', dados, lida: false, criado_em: new Date().toISOString() };
      addNotificacao(notif);
      addToast(notif);
    });

    socket.on('produto-indisponivel', (dados) => {
      const notif = { id: Date.now(), tipo: 'produto_indisponivel', titulo: '🚫 Produto indisponível!', dados, lida: false, criado_em: new Date().toISOString() };
      addNotificacao(notif);
      addToast(notif);
    });

    return () => socket.disconnect();
  }, [usuario]);

  function addNotificacao(notif) {
    setNotificacoes(prev => [notif, ...prev].slice(0, 50));
    setNaoLidas(prev => prev + 1);
  }

  function addToast(notif) {
    const id = Date.now();
    setToasts(prev => [...prev, { ...notif, toastId: id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.toastId !== id)), 5000);
  }

  function marcarLida(id) {
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
    setNaoLidas(prev => Math.max(0, prev - 1));
  }

  function marcarTodasLidas() {
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    setNaoLidas(0);
  }

  function removerToast(toastId) {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  }

  function tocarSom() {
    try {
      // Cria ou retoma o contexto de áudio (Browsers bloqueiam se não houver interação)
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      
      if (ctx.state === 'suspended') {
        // Se estiver suspenso, tentamos retomar (isso geralmente só funciona dentro de um clique)
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      // Som tipo "ding" mais nítido e alto
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // La (A5)
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1); // Mi (E6)
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05); // Volume 50%
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
      
      console.log('🔊 Alerta sonoro disparado');
    } catch (e) {
      console.error('Erro ao tocar som:', e);
    }
  }

  // Função para "desbloquear" o áudio (deve ser chamada por um clique do usuário)
  function permitirSom() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        tocarSom(); // Toca um som de teste
      });
    } else {
      tocarSom();
    }
  }

  return (
    <NotificationContext.Provider value={{ 
      notificacoes, 
      naoLidas, 
      toasts, 
      marcarLida, 
      marcarTodasLidas, 
      removerToast,
      permitirSom 
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);
