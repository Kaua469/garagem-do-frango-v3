import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import api from '../../services/api';
import { formatarData, formatarDataCurta } from '../../services/dateUtils';
import styles from './AdminDashboard.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

const STATUS_LABEL = {
  aguardando: '⏳', confirmado: '✅', preparando: '👨‍🍳',
  saiu_entrega: '🛵', entregue: '🎉', cancelado: '❌',
};

function StatCard({ icon, label, value, color, sub }) {
  return (
    <motion.div className={styles.statCard} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className={styles.statIcon} style={{ background: color + '20', color }}>{icon}</div>
      <div>
        <p className={styles.statLabel}>{label}</p>
        <p className={styles.statValue}>{value}</p>
        {sub && <p className={styles.statSub}>{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;
  if (!data) return <p style={{ color: 'red' }}>Erro ao carregar dashboard.</p>;

  const vendasChartData = {
    labels: data.vendasDia.map(v => formatarDataCurta(v.data)),
    datasets: [{
      label: 'Vendas (R$)',
      data: data.vendasDia.map(v => Number(v.total).toFixed(2)),
      backgroundColor: 'rgba(239,98,3,0.18)',
      borderColor: '#ef6203',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#ef6203',
    }]
  };

  const rankingChartData = {
    labels: data.maisVendidos.map(m => m.nome_produto),
    datasets: [{
      label: 'Qtd Vendida',
      data: data.maisVendidos.map(m => m.total_vendido),
      backgroundColor: ['#ef6203', '#cf280c', '#5a2b0c', '#f6ad3c', '#2d9b3f'],
      borderRadius: 8,
    }]
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false } } }
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>📊 Dashboard</h1>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <StatCard icon="💰" label="Vendido Hoje" value={`R$ ${Number(data.totalHoje).toFixed(2)}`} color="#ef6203" sub={`${data.pedidosHoje} pedido(s)`} />
        <StatCard icon="📅" label="Vendido no Mês" value={`R$ ${Number(data.totalMes).toFixed(2)}`} color="#2d9b3f" />
        <StatCard icon="📈" label="Entradas do Mês" value={`R$ ${Number(data.entradas).toFixed(2)}`} color="#3182ce" />
        <StatCard icon="📉" label="Saídas do Mês" value={`R$ ${Number(data.saidas).toFixed(2)}`} color="#e53e3e" />
        <StatCard icon="💵" label="Lucro do Mês" value={`R$ ${Number(data.lucro).toFixed(2)}`} color={data.lucro >= 0 ? '#2d9b3f' : '#e53e3e'} />
        <StatCard icon="⚠️" label="Estoque Baixo" value={`${data.estoqueBaixo} produto(s)`} color="#f6ad3c" />
      </div>

      {/* Charts */}
      <div className={styles.chartsGrid}>
        <div className={styles.chartBox}>
          <h3 className={styles.chartTitle}>Vendas dos Últimos 30 Dias</h3>
          <div className={styles.chartWrap}>
            <Line data={vendasChartData} options={chartOptions} />
          </div>
        </div>

        <div className={styles.chartBox}>
          <h3 className={styles.chartTitle}>Produtos Mais Vendidos</h3>
          <div className={styles.chartWrap}>
            <Bar data={rankingChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className={styles.recentBox}>
        <h3 className={styles.chartTitle}>Pedidos Recentes</h3>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Número</th><th>Cliente</th><th>Total</th><th>Pagamento</th><th>Status</th><th>Data</th>
              </tr>
            </thead>
            <tbody>
              {data.pedidosRecentes.map(p => (
                <tr key={p.id}>
                  <td><strong>#{p.numero}</strong></td>
                  <td>{p.nome_cliente}</td>
                  <td><strong style={{ color: 'var(--primary)' }}>R$ {Number(p.total).toFixed(2)}</strong></td>
                  <td style={{ textTransform: 'capitalize' }}>{p.forma_pagamento}</td>
                  <td>{STATUS_LABEL[p.status] || ''} {p.status}</td>
                  <td>{formatarData(p.criado_em)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
