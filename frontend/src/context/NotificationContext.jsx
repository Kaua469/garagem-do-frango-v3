import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { usuario } = useAuth();
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [conectado, setConectado] = useState(false);
  const socketRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (usuario?.tipo !== 'dona') return;

    // Descobre a URL do socket baseada na URL da API
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const socketUrl = import.meta.env.VITE_SOCKET_URL || apiUrl.replace('/api', '') || 'http://localhost:3000';
    
    console.log('🔌 Conectando Socket em:', socketUrl);

    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket conectado!');
      setConectado(true);
      socket.emit('entrar-admin');
    });

    socket.on('disconnect', () => {
      console.warn('❌ Socket desconectado!');
      setConectado(false);
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Erro de conexão Socket:', err.message);
      setConectado(false);
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
      tocarSom();
    });

    socket.on('produto-indisponivel', (dados) => {
      const notif = { id: Date.now(), tipo: 'produto_indisponivel', titulo: '🚫 Produto indisponível!', dados, lida: false, criado_em: new Date().toISOString() };
      addNotificacao(notif);
      addToast(notif);
      tocarSom();
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

  const audioCtxRef = useRef(null);

  // Inicializa o contexto de áudio uma única vez
  function obterAudioContext() {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    return audioCtxRef.current;
  }

  function tocarSom() {
    try {
      const ctx = obterAudioContext();
      
      if (ctx.state === 'suspended') {
        console.warn('⚠️ Áudio suspenso. Clique em "Ativar Som" no painel.');
        return;
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      // Som tipo "Alerta de Restaurante" (Duplo bip)
      osc.type = 'sine';
      
      // Bip 1
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.1);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      
      // Bip 2
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.4);
      gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.5);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.9);
      
      console.log('🔔 SOM: Alerta sonoro de novo pedido disparado!');
    } catch (e) {
      console.error('❌ SOM: Erro ao tentar tocar áudio:', e);
    }
  }

  function permitirSom() {
    const ctx = obterAudioContext();
    if (ctx.state === 'suspended' || ctx.state === 'closed') {
      ctx.resume().then(() => {
        console.log('✅ Áudio DESBLOQUEADO pelo usuário.');
        tocarSom(); // Toca som de teste
        alert('Som ativado com sucesso! Você ouvirá o alerta nos próximos pedidos.');
      }).catch(err => console.error('Erro ao retomar áudio:', err));
    } else {
      tocarSom();
      alert('O som já está ativo e pronto!');
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
      permitirSom,
      conectado
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);
