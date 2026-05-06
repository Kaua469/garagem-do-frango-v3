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

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', {
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('entrar-admin');
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
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  }

  return (
    <NotificationContext.Provider value={{ notificacoes, naoLidas, toasts, marcarLida, marcarTodasLidas, removerToast }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);
