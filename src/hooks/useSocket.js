import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export function useSocket(onEvents = {}) {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000');
    socketRef.current = socket;

    Object.entries(onEvents).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => socket.disconnect();
  }, []);

  return socketRef;
}
