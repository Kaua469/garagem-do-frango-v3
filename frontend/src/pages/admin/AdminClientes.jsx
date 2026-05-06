import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import styles from './AdminClientes.module.css';

export default function AdminClientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [busca, setBusca]       = useState('');

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setClientes(r.data.topClientes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtrados = clientes.filter(c =>
    c.nome_cliente.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone_cliente.includes(busca)
  );

  const totalGeral = clientes.reduce((a, c) => a + Number(c.total_gasto), 0);

  const abrirWhats = (tel) => {
    let fone = tel.replace(/\D/g, '');
    if (!fone.startsWith('55')) fone = '55' + fone;
    window.open(`https://wa.me/${fone}`, '_blank', 'noopener');
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>👥 Melhores Clientes</h1>
          <p className={styles.pageSub}>
            Top {clientes.length} clientes por valor gasto · Total acumulado: <strong>R$ {totalGeral.toFixed(2)}</strong>
          </p>
        </div>
      </div>

      {/* Podium top 3 */}
      {!loading && clientes.length >= 3 && (
        <div className={styles.podium}>
          {/* 2º lugar */}
          <motion.div
            className={`${styles.podiumCard} ${styles.p2}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className={styles.podiumMedal}>🥈</div>
            <div className={styles.podiumNome}>{clientes[1].nome_cliente}</div>
            <div className={styles.podiumValor}>R$ {Number(clientes[1].total_gasto).toFixed(2)}</div>
            <div className={styles.podiumPed}>{clientes[1].total_pedidos} pedido(s)</div>
          </motion.div>

          {/* 1º lugar */}
          <motion.div
            className={`${styles.podiumCard} ${styles.p1}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <div className={styles.podiumMedal}>🏆</div>
            <div className={styles.podiumNome}>{clientes[0].nome_cliente}</div>
            <div className={styles.podiumValor}>R$ {Number(clientes[0].total_gasto).toFixed(2)}</div>
            <div className={styles.podiumPed}>{clientes[0].total_pedidos} pedido(s)</div>
            <div className={styles.podiumBadge}>Fiel nº 1</div>
          </motion.div>

          {/* 3º lugar */}
          <motion.div
            className={`${styles.podiumCard} ${styles.p3}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className={styles.podiumMedal}>🥉</div>
            <div className={styles.podiumNome}>{clientes[2].nome_cliente}</div>
            <div className={styles.podiumValor}>R$ {Number(clientes[2].total_gasto).toFixed(2)}</div>
            <div className={styles.podiumPed}>{clientes[2].total_pedidos} pedido(s)</div>
          </motion.div>
        </div>
      )}

      {/* Busca */}
      <div className={styles.searchRow}>
        <input
          className="input-field"
          style={{ maxWidth: 340 }}
          placeholder="🔍 Buscar por nome ou telefone..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>

      {/* Tabela completa */}
      {loading ? <div className="spinner" /> : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Telefone</th>
                <th>Pedidos</th>
                <th>Total Gasto</th>
                <th>Ticket Médio</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.emptyCell}>Nenhum cliente encontrado.</td>
                </tr>
              )}
              {filtrados.map((c, idx) => {
                const ticket = Number(c.total_gasto) / Number(c.total_pedidos);
                const posicao = clientes.indexOf(c) + 1;
                return (
                  <motion.tr
                    key={c.telefone_cliente}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <td>
                      <span className={`${styles.rank} ${posicao === 1 ? styles.r1 : posicao === 2 ? styles.r2 : posicao === 3 ? styles.r3 : styles.rN}`}>
                        {posicao === 1 ? '🏆' : posicao === 2 ? '🥈' : posicao === 3 ? '🥉' : `#${posicao}`}
                      </span>
                    </td>
                    <td className={styles.tdNome}>{c.nome_cliente}</td>
                    <td className={styles.tdTel}>{c.telefone_cliente}</td>
                    <td>
                      <span className={styles.pedidosBadge}>{c.total_pedidos}</span>
                    </td>
                    <td>
                      <strong className={styles.totalValor}>
                        R$ {Number(c.total_gasto).toFixed(2)}
                      </strong>
                    </td>
                    <td className={styles.ticket}>
                      R$ {ticket.toFixed(2)}
                    </td>
                    <td>
                      <button
                        className={styles.whatsBtn}
                        onClick={() => abrirWhats(c.telefone_cliente)}
                        title="Enviar mensagem no WhatsApp"
                      >
                        💬 WhatsApp
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
