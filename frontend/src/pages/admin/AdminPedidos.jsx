import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gerarNFTermica, gerarNFPDF } from '../../services/nfService';
import api from '../../services/api';
import { abrirWhatsApp, enviarWhatsAppAutomatico } from '../../services/whatsappService';
import { formatarData, formatarDataHora } from '../../services/dateUtils';
import styles from './AdminPedidos.module.css';

const STATUSES = ['aguardando', 'confirmado', 'preparando', 'saiu_entrega', 'entregue', 'cancelado'];
const STATUS_LABEL = {
  aguardando: '⏳ Aguardando', confirmado: '✅ Confirmado', preparando: '👨‍🍳 Preparando',
  saiu_entrega: '🛵 Saiu para Entrega', entregue: '🎉 Entregue', cancelado: '❌ Cancelado',
};
const STATUS_COLOR = {
  aguardando: '#f6ad3c', confirmado: '#3182ce', preparando: '#9f7aea',
  saiu_entrega: '#ed8936', entregue: '#2d9b3f', cancelado: '#e53e3e',
};
const PAGAMENTO_LABEL = { pix: 'PIX', dinheiro: 'Dinheiro', cartao: 'Cartão' };


export default function AdminPedidos() {
  const [pedidos, setPedidos]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [detalhes, setDetalhes]     = useState(null);
  const [detalheItens, setDetalheItens] = useState([]);
  const [gerando, setGerando]       = useState(null);
  const [config, setConfig]         = useState({});

  const carregar = () => {
    setLoading(true);
    api.get('/pedidos', { params: { status: filtroStatus || undefined } })
      .then(r => setPedidos(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregar();
    api.get('/configuracoes').then(r => setConfig(r.data)).catch(() => {});
  }, [filtroStatus]);

  const abrirDetalhes = async (p) => {
    setDetalhes(p);
    const { data } = await api.get(`/pedidos/${p.id}`);
    setDetalheItens(data.itens || []);
  };

  const [whatsappPendente, setWhatsappPendente] = useState(null); // { pedido, nomeLoja }

  const atualizarStatus = async (id, status, pedidoAtual = null) => {
    try {
      const { data } = await api.patch(`/pedidos/${id}/status`, { status });
      carregar();

      const pedidoAtualizado = data.pedido || pedidoAtual;
      const nomeLoja = data.config?.nome_loja || config.nome_loja || 'Garagem do Frango';

      if (detalhes?.id === id) setDetalhes(prev => ({ ...prev, status })); // updated via atualizarStatus

      // Tenta envio automático (Z-API). Se não tiver Z-API configurado,
      // mostra o botão para enviar manualmente.
      if (pedidoAtualizado && status !== 'aguardando') {
        const enviouAuto = await enviarWhatsAppAutomatico(pedidoAtualizado, nomeLoja);
        if (!enviouAuto) {
          setWhatsappPendente({ pedido: pedidoAtualizado, nomeLoja });
          setTimeout(() => setWhatsappPendente(null), 30000); // fecha em 30s
        }
      }
    } catch (err) {
      alert('Erro ao atualizar status. Tente novamente.');
    }
  };

  const handleGerarTermicaLista = async (p) => {
    setGerando(p.id);
    try {
      const { data } = await api.get(`/pedidos/${p.id}`);
      gerarNFTermica(data, data.itens || [], config);
    } catch { alert('Erro ao gerar cupom. Tente novamente.'); }
    finally { setGerando(null); }
  };

  const handleGerarTermicaModal = () => {
    gerarNFTermica(detalhes, detalheItens, config);
  };

  const handleGerarNFLista = async (p) => {
    setGerando(p.id);
    try {
      const { data } = await api.get(`/pedidos/${p.id}`);
      await gerarNFPDF(data, data.itens || [], config);
    } catch { alert('Erro ao gerar NF. Tente novamente.'); }
    finally { setGerando(null); }
  };

  const handleGerarNFModal = async () => {
    setGerando(detalhes.id);
    try {
      await gerarNFPDF(detalhes, detalheItens, config);
    } catch { alert('Erro ao gerar NF.'); }
    finally { setGerando(null); }
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>📦 Pedidos</h1>

      {/* Filtros de status */}
      <div className={styles.filtros}>
        <button className={`${styles.filtroBtn} ${filtroStatus === '' ? styles.filtroAtivo : ''}`} onClick={() => setFiltroStatus('')}>Todos</button>
        {STATUSES.map(s => (
          <button key={s} className={`${styles.filtroBtn} ${filtroStatus === s ? styles.filtroAtivo : ''}`} onClick={() => setFiltroStatus(s)}>
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {loading ? <div className="spinner" /> : (
        <div className={styles.pedidosList}>
          {pedidos.length === 0 && <p className={styles.empty}>Nenhum pedido encontrado.</p>}

          {pedidos.map(p => (
            <div key={p.id} className={styles.pedidoCard}>
              <div className={styles.pedidoTop}>
                <div>
                  <span className={styles.pedidoNum}>#{p.numero}</span>
                  <span className={styles.pedidoCliente}>{p.nome_cliente}</span>
                  <span className={styles.pedidoTel}>📞 {p.telefone_cliente}</span>
                </div>
                <div className={styles.pedidoRight}>
                  <span className={styles.pedidoTotal}>R$ {Number(p.total).toFixed(2)}</span>
                  <span className={styles.statusBadge} style={{ background: STATUS_COLOR[p.status] + '20', color: STATUS_COLOR[p.status] }}>
                    {STATUS_LABEL[p.status]}
                  </span>
                </div>
              </div>

              <div className={styles.pedidoMid}>
                <span>📍 {p.endereco_entrega}</span>
                <span>💳 {p.forma_pagamento}{p.tipo_cartao ? ` (${p.tipo_cartao})` : ''}</span>
                <span>🕐 {formatarDataHora(p.criado_em)}</span>
              </div>

              <div className={styles.pedidoActions}>
                <button className={styles.detalhesBtn} onClick={() => abrirDetalhes(p)}>📋 Detalhes</button>

                {/* ── BOTÕES NF ── */}
                <button
                  className={styles.termicaBtn}
                  onClick={() => handleGerarTermicaLista(p)}
                  disabled={gerando === p.id}
                  title="Imprimir Cupom Térmico (80mm)"
                >
                  🖨️ Cupom
                </button>
                <button
                  className={styles.nfBtn}
                  onClick={() => handleGerarNFLista(p)}
                  disabled={gerando === p.id}
                  title="Baixar Nota Fiscal em PDF"
                >
                  {gerando === p.id
                    ? <><span className={styles.nfSpinner} /> Gerando...</>
                    : <>🧾 PDF</>}
                </button>

                <div className={styles.statusBtns}>
                  {STATUSES.filter(s => s !== p.status && s !== 'cancelado').map(s => (
                    <button key={s} className={styles.statusBtn} style={{ borderColor: STATUS_COLOR[s], color: STATUS_COLOR[s] }} onClick={() => atualizarStatus(p.id, s, p)}>
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                  {p.status !== 'cancelado' && (
                    <button className={styles.cancelarBtn} onClick={() => atualizarStatus(p.id, 'cancelado', p)}>❌ Cancelar</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TOAST WHATSAPP ── */}
      <AnimatePresence>
        {whatsappPendente && (
          <motion.div
            className={styles.waTostContainer}
            initial={{ x: 120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          >
            <div className={styles.waToastIcon}>💬</div>
            <div className={styles.waToastBody}>
              <p className={styles.waToastTitle}>Notificar cliente?</p>
              <p className={styles.waToastSub}>
                {whatsappPendente.pedido.nome_cliente} • #{whatsappPendente.pedido.numero}
              </p>
              <p className={styles.waToastStatus}>
                Status: {STATUS_LABEL[whatsappPendente.pedido.status]}
              </p>
            </div>
            <div className={styles.waToastBtns}>
              <button
                className={styles.waEnviarBtn}
                onClick={() => {
                  abrirWhatsApp(whatsappPendente.pedido, whatsappPendente.nomeLoja);
                  setWhatsappPendente(null);
                }}
              >
                📲 Enviar
              </button>
              <button
                className={styles.waIgnorarBtn}
                onClick={() => setWhatsappPendente(null)}
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal detalhes + NF ── */}
      <AnimatePresence>
        {detalhes && (
          <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDetalhes(null)}>
            <motion.div className={styles.modal} initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 16 }} onClick={e => e.stopPropagation()}>

              <div className={styles.modalHeader}>
                <div>
                  <h2>Pedido #{detalhes.numero}</h2>
                  <span className={styles.statusBadge} style={{ background: STATUS_COLOR[detalhes.status] + '20', color: STATUS_COLOR[detalhes.status], display: 'inline-block', marginTop: 6 }}>
                    {STATUS_LABEL[detalhes.status]}
                  </span>
                </div>
                <div className={styles.modalHeaderBtns}>
                  {/* ── BOTÃO NF NO MODAL ── */}
                  <button
                    className={styles.waBtnModal}
                    onClick={() => abrirWhatsApp(detalhes, config.nome_loja)}
                    title="Enviar atualização via WhatsApp"
                  >
                    💬 WhatsApp
                  </button>
                  <button
                    className={styles.termicaBtnModal}
                    onClick={handleGerarTermicaModal}
                    title="Imprimir Cupom Térmico (80mm)"
                  >
                    🖨️ Cupom
                  </button>
                  <button
                    className={styles.nfBtnModal}
                    onClick={handleGerarNFModal}
                    disabled={gerando === detalhes.id}
                  >
                    {gerando === detalhes.id
                      ? <><span className={styles.nfSpinner} /> Gerando...</>
                      : <>🧾 Baixar NF em PDF</>}
                  </button>
                  <button className={styles.closeBtn} onClick={() => setDetalhes(null)}>✕</button>
                </div>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.infoGrid}>
                  <div><span className={styles.infoLabel}>Cliente</span><span className={styles.infoVal}>{detalhes.nome_cliente}</span></div>
                  <div><span className={styles.infoLabel}>Telefone</span><span className={styles.infoVal}>{detalhes.telefone_cliente}</span></div>
                  <div className={styles.fullCol}><span className={styles.infoLabel}>Endereço</span><span className={styles.infoVal}>{detalhes.endereco_entrega}</span></div>
                  <div>
                    <span className={styles.infoLabel}>Pagamento</span>
                    <span className={styles.infoVal}>
                      {PAGAMENTO_LABEL[detalhes.forma_pagamento] || detalhes.forma_pagamento}
                      {detalhes.tipo_cartao ? ` – ${detalhes.tipo_cartao}` : ''}
                    </span>
                  </div>
                  {detalhes.troco && (
                    <div><span className={styles.infoLabel}>Troco para</span><span className={styles.infoVal}>R$ {Number(detalhes.troco).toFixed(2)}</span></div>
                  )}
                  {detalhes.observacao && (
                    <div className={styles.fullCol}><span className={styles.infoLabel}>Observação</span><span className={styles.infoVal}>{detalhes.observacao}</span></div>
                  )}
                </div>

                <div className={styles.itensSec}>
                  <h4 className={styles.itensTitle}>Itens</h4>
                  <div className={styles.itensHeader}>
                    <span>Produto</span><span>Qtd</span><span>Unit.</span><span>Total</span>
                  </div>
                  {detalheItens.map(i => (
                    <div key={i.id} className={styles.itemRow}>
                      <span>{i.nome_produto}{i.nome_variacao ? <em> ({i.nome_variacao})</em> : ''}</span>
                      <span className={styles.itemCenter}>{i.quantidade}×</span>
                      <span className={styles.itemRight}>R$ {Number(i.preco_unitario).toFixed(2)}</span>
                      <span className={styles.itemTotal}>R$ {Number(i.preco_total).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.totaisModal}>
                  <div className={styles.totalRow}><span>Subtotal</span><span>R$ {Number(detalhes.subtotal).toFixed(2)}</span></div>
                  <div className={styles.totalRow}><span>Taxa de entrega</span><span>R$ {Number(detalhes.taxa_entrega).toFixed(2)}</span></div>
                  <div className={`${styles.totalRow} ${styles.totalFinal}`}><span>Total</span><span>R$ {Number(detalhes.total).toFixed(2)}</span></div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
