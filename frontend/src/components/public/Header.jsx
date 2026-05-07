import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl } from '../../services/imageUrl';
import { useConfig } from '../../context/ConfigContext';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Header.module.css';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { totalItens } = useCart();
  const { usuario, logout } = useAuth();
  const { config, bustImageUrl } = useConfig();
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => setMenuOpen(false), [location]);

  const navLinks = [
    { to: '/inicio', label: 'Início' },
    { to: '/cardapio', label: 'Cardápio' },
  ];

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>
        <Link to="/inicio" className={styles.logo}>
          <img
            src={config.logo_url ? bustImageUrl(getImageUrl(config.logo_url)) : '/logo.png'}
            alt={config.nome_loja}
            className={styles.logoImg}
            onError={e => { e.target.src = '/logo.png'; }}
          />
        </Link>

        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
          {navLinks.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={`${styles.navLink} ${location.pathname === l.to ? styles.active : ''}`}
            >
              {l.label}
            </Link>
          ))}
          {usuario ? (
            <>
              <Link to="/minha-conta" className={styles.navLink}>Minha Conta</Link>
              <button onClick={logout} className={styles.navLink} style={{background:'none'}}>Sair</button>
            </>
          ) : (
            <Link to="/login" className={styles.navLink}>Entrar</Link>
          )}
        </nav>

        <div className={styles.actions}>
          <Link to="/carrinho" className={styles.cartBtn}>
            🛒
            {totalItens > 0 && <span className={styles.cartBadge}>{totalItens}</span>}
          </Link>
          <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span className={menuOpen ? styles.barOpen : ''}></span>
            <span className={menuOpen ? styles.barOpen : ''}></span>
            <span className={menuOpen ? styles.barOpen : ''}></span>
          </button>
        </div>
      </div>
    </header>
  );
}
