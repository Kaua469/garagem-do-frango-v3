import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './NotFound.module.css';

export default function NotFound() {
  return (
    <main className={styles.main}>
      <motion.div
        className={styles.box}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className={styles.icon}>🍗</div>
        <h1 className={styles.code}>404</h1>
        <h2 className={styles.title}>Página não encontrada</h2>
        <p className={styles.text}>O frango voou... essa página não existe!</p>
        <Link to="/inicio" className="btn-primary" style={{ marginTop: 28 }}>
          Voltar ao Início
        </Link>
      </motion.div>
    </main>
  );
}
