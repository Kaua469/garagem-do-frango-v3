import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Header from '../../components/public/Header';
import Footer from '../../components/public/Footer';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatarData } from '../../services/dateUtils';
import styles from './MinhaConta.module.css';

const STATUS_LABEL = {
  aguardando: '⏳ Aguardando',
  confirmado: '✅ Confirmado',
  preparando: '👨‍🍳 Preparando',
  saiu_entrega: '🛵 Saiu para Entrega',
  entregue: '🎉 Entregue',
  cancelado: '❌ Cancelado',
};

export default function MinhaConta() {
  const { usuario, logout } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!usuario) return;
    api.get('/pedidos/meus').then(r => setPedidos(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [usuario]);

  if (!usuario) return <Navigate to="/login" />;

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Olá, {usuario.nome}! 👋</h1>
              <p className={styles.sub}>Telefone: {usuario.telefone}</p>
            </div>
            <button onClick={logout} className="btn-outline">Sair</button>
          </div>

          <h2 className={styles.secTitle}>Meus Pedidos</h2>

          {loading ? (
            <div className="spinner" />
          ) : pedidos.length === 0 ? (
            <div className={styles.empty}>
              <p>Você ainda não fez nenhum pedido.</p>
              <Link to="/cardapio" className="btn-primary" style={{ marginTop: 20 }}>Pedir Agora 🍗</Link>
            </div>
          ) : (
            <div className={styles.pedidosList}>
              {pedidos.map(p => (
                <div key={p.id} className={styles.pedidoCard}>
                  <div className={styles.pedidoHeader}>
                    <span className={styles.pedidoNum}>Pedido #{p.numero}</span>
                    <span className={styles.pedidoStatus}>{STATUS_LABEL[p.status] || p.status}</span>
                  </div>
                  <div className={styles.pedidoInfo}>
                    <span>📅 {formatarData(p.criado_em)}</span>
                    <span>💳 {p.forma_pagamento}</span>
                    <span className={styles.pedidoTotal}>R$ {Number(p.total).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
