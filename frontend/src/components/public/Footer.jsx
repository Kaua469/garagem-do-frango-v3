import { Link } from 'react-router-dom';
import { useConfig } from '../../context/ConfigContext';
import styles from './Footer.module.css';

export default function Footer() {
  const { config } = useConfig();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.col}>
          <img src="/logo.png" alt={config.nome_loja} className={styles.logo} />
          <p className={styles.tagline}>O frango mais gostoso da cidade, feito com amor e tradição.</p>
        </div>

        <div className={styles.col}>
          <h4 className={styles.colTitle}>Horário</h4>
          <p className={styles.text}>{config.horario}</p>
          <p className={styles.text}>📍 {config.endereco}</p>
        </div>

        <div className={styles.col}>
          <h4 className={styles.colTitle}>Contato</h4>
          <a href={`tel:${config.telefone}`} className={styles.link}>📞 {config.telefone}</a>
          <a href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noreferrer" className={styles.link}>💬 WhatsApp</a>
          <a href={`https://instagram.com/${config.instagram}`} target="_blank" rel="noreferrer" className={styles.link}>📸 @{config.instagram}</a>
          <a href={`https://facebook.com/${config.facebook}`} target="_blank" rel="noreferrer" className={styles.link}>👍 Facebook</a>
        </div>

        <div className={styles.col}>
          <h4 className={styles.colTitle}>Navegação</h4>
          <Link to="/inicio" className={styles.link}>Início</Link>
          <Link to="/cardapio" className={styles.link}>Cardápio</Link>
          <Link to="/carrinho" className={styles.link}>Carrinho</Link>
          <Link to="/login" className={styles.link}>Entrar</Link>
        </div>
      </div>
      <div className={styles.bottom}>
        <p>© {new Date().getFullYear()} {config.nome_loja}. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
