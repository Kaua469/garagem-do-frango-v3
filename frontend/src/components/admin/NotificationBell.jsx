import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatarHora } from '../../services/dateUtils';
import { useNotification } from '../../context/NotificationContext';
import styles from './NotificationBell.module.css';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notificacoes, naoLidas, marcarLida, marcarTodasLidas } = useNotification();

  const tipoIcon = { novo_pedido: '🍗', estoque_baixo: '⚠️', produto_indisponivel: '🚫' };
  const tipoLabel = { novo_pedido: 'Novo Pedido', estoque_baixo: 'Estoque Baixo', produto_indisponivel: 'Produto Indisponível' };

  return (
    <div className={styles.wrapper}>
      <button className={styles.bell} onClick={() => setOpen(!open)} aria-label="Notificações">
        🔔
        {naoLidas > 0 && (
          <motion.span
            className={styles.badge}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            key={naoLidas}
          >
            {naoLidas > 9 ? '9+' : naoLidas}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.18 }}
          >
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Notificações</span>
              {naoLidas > 0 && (
                <button className={styles.markAll} onClick={marcarTodasLidas}>
                  Marcar todas como lidas
                </button>
              )}
            </div>

            <div className={styles.list}>
              {notificacoes.length === 0 && (
                <div className={styles.empty}>Nenhuma notificação</div>
              )}
              {notificacoes.map(n => (
                <div
                  key={n.id}
                  className={`${styles.item} ${!n.lida ? styles.unread : ''}`}
                  onClick={() => marcarLida(n.id)}
                >
                  <span className={styles.itemIcon}>{tipoIcon[n.tipo] || '🔔'}</span>
                  <div className={styles.itemBody}>
                    <p className={styles.itemTitulo}>{n.titulo}</p>
                    {n.dados?.nome_cliente && (
                      <p className={styles.itemDetalhe}>
                        {n.dados.nome_cliente} • #{n.dados.numero} • R$ {Number(n.dados.total).toFixed(2)}
                      </p>
                    )}
                    {n.dados?.produto_nome && (
                      <p className={styles.itemDetalhe}>
                        {n.dados.produto_nome}{n.dados.variacao_nome ? ` - ${n.dados.variacao_nome}` : ''} • Estoque: {n.dados.estoque}
                      </p>
                    )}
                    <p className={styles.itemTime}>
                      {formatarHora(n.criado_em)}
                    </p>
                  </div>
                  {!n.lida && <div className={styles.dot} />}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {open && <div className={styles.backdrop} onClick={() => setOpen(false)} />}
    </div>
  );
}
