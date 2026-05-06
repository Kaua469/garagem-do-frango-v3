import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../../components/admin/NotificationBell';
import NotificationToast from '../../components/admin/NotificationToast';
import styles from './AdminLayout.module.css';

const NAV = [
  { to: '', label: 'Dashboard', icon: '📊', end: true },
  { to: 'pedidos', label: 'Pedidos', icon: '📦' },
  { to: 'produtos', label: 'Produtos', icon: '🍗' },
  { to: 'estoque', label: 'Estoque', icon: '📋' },
  { to: 'financeiro', label: 'Financeiro', icon: '💰' },
  { to: 'novidades', label: 'Novidades', icon: '🆕' },
  { to: 'avaliacoes', label: 'Avaliações', icon: '⭐' },
  { to: 'clientes', label: 'Clientes', icon: '👥' },
  { to: 'configuracoes', label: 'Configurações', icon: '⚙️' },
];

export default function AdminLayout({ children, adminRoute }) {
  const [sideOpen, setSideOpen] = useState(false);
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sideOpen ? styles.sideOpen : ''}`}>
        <div className={styles.sideHeader}>
          <img src="/logo.png" alt="Garagem do Frango" className={styles.logo} />
          <button className={styles.closeBtn} onClick={() => setSideOpen(false)}>✕</button>
        </div>

        <nav className={styles.nav}>
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={`${adminRoute}${n.to ? '/' + n.to : ''}`}
              end={n.end}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ''}`}
              onClick={() => setSideOpen(false)}
            >
              <span className={styles.navIcon}>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sideFooter}>
          <p className={styles.adminName}>{usuario?.nome}</p>
          <button className={styles.logoutBtn} onClick={handleLogout}>🚪 Sair</button>
        </div>
      </aside>

      {sideOpen && <div className={styles.overlay} onClick={() => setSideOpen(false)} />}

      {/* Main content */}
      <div className={styles.content}>
        <header className={styles.topBar}>
          <button className={styles.menuBtn} onClick={() => setSideOpen(true)} aria-label="Menu">
            ☰
          </button>
          <h1 className={styles.topBarTitle}>Painel Administrativo</h1>
          <div className={styles.topBarActions}>
            <NotificationBell />
            <div className={styles.adminBadge}>👑 Dona</div>
          </div>
        </header>

        <main className={styles.main}>
          {children}
        </main>
      </div>

      <NotificationToast />
    </div>
  );
}
