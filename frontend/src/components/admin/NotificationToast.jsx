import { AnimatePresence, motion } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
import styles from './NotificationToast.module.css';

export default function NotificationToast() {
  const { toasts, removerToast } = useNotification();

  const tipoStyle = {
    novo_pedido: styles.pedido,
    estoque_baixo: styles.estoque,
    produto_indisponivel: styles.indisponivel,
  };

  return (
    <div className={styles.container}>
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.toastId}
            className={`${styles.toast} ${tipoStyle[t.tipo] || ''}`}
            initial={{ x: 120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <div className={styles.toastIcon}>
              {t.tipo === 'novo_pedido' ? '🍗' : t.tipo === 'estoque_baixo' ? '⚠️' : '🚫'}
            </div>
            <div className={styles.toastBody}>
              <p className={styles.toastTitle}>{t.titulo}</p>
              {t.dados?.nome_cliente && (
                <p className={styles.toastSub}>
                  {t.dados.nome_cliente} • #{t.dados.numero}
                </p>
              )}
              {t.dados?.produto_nome && (
                <p className={styles.toastSub}>{t.dados.produto_nome}</p>
              )}
            </div>
            <button className={styles.close} onClick={() => removerToast(t.toastId)}>✕</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
