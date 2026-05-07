import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import Header from '../../components/public/Header';
import Footer from '../../components/public/Footer';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { getImageUrl } from '../../services/imageUrl';
import api from '../../services/api';
import styles from './Carrinho.module.css';

export default function Carrinho() {
  const { itens, removerItem, alterarQuantidade, subtotal, limparCarrinho } = useCart();
  const { usuario } = useAuth();
  const { config } = useConfig();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pedidoFinalizado, setPedidoFinalizado] = useState(null);
  const taxaEntrega = parseFloat(config.taxa_entrega || 5);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      nome_cliente: usuario?.nome || '',
      telefone_cliente: usuario?.telefone || '',
    }
  });

  const formaPagamento = watch('forma_pagamento');

  const onFinalizar = async (dados) => {
    setLoading(true);
    try {
      const payload = {
        ...dados,
        usuario_id: usuario?.id || null,
        itens: itens.map(i => ({
          produto_id: i.produto_id,
          variacao_id: i.variacao_id,
          nome_produto: i.nome_produto,
          nome_variacao: i.nome_variacao,
          quantidade: i.quantidade,
          preco_unitario: i.preco_unitario,
          observacao: i.observacao || '',
        })),
      };
      const { data } = await api.post('/pedidos', payload);
      limparCarrinho();
      setPedidoFinalizado(data);
    } catch (err) {
      alert('Erro ao finalizar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Pedido finalizado ── */
  if (pedidoFinalizado) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className="container">
            <motion.div className={styles.successBox} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <div className={styles.successIcon}>🎉</div>
              <h2 className={styles.successTitle}>Pedido realizado!</h2>
              <p className={styles.successText}>Seu pedido <strong>#{pedidoFinalizado.numero}</strong> foi recebido com sucesso.</p>
              <p className={styles.successTotal}>Total: R$ {Number(pedidoFinalizado.total).toFixed(2)}</p>
              <Link to="/inicio" className="btn-primary">Voltar ao Início</Link>
            </motion.div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  /* ── Carrinho vazio ── */
  if (itens.length === 0) {
    return (
      <>
        <Header />
        <main className={styles.main}>
          <div className="container">
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🛒</div>
              <h2>Seu carrinho está vazio</h2>
              <p>Adicione produtos do nosso cardápio delicioso!</p>
              <Link to="/cardapio" className="btn-primary" style={{ marginTop: 24 }}>Ver Cardápio</Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <h1 className={styles.pageTitle}>🛒 Meu Carrinho</h1>

          <div className={styles.layout}>

            {/* ── COLUNA ESQUERDA: itens ── */}
            <div className={styles.colLeft}>
              <AnimatePresence>
                {itens.map(item => (
                  <motion.div
                    key={item.key}
                    className={styles.itemCard}
                    layout
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className={styles.itemImg}>
                      {item.imagem
                        ? <img src={getImageUrl(item.imagem)} alt={item.nome_produto} onError={e => { e.target.style.display='none'; e.target.parentNode.textContent='🍗'; }} />
                        : <span>🍗</span>
                      }
                    </div>

                    <div className={styles.itemInfo}>
                      <h4 className={styles.itemNome}>{item.nome_produto}</h4>
                      {item.nome_variacao && <p className={styles.itemVar}>{item.nome_variacao}</p>}
                      <p className={styles.itemPreco}>R$ {Number(item.preco_unitario).toFixed(2)} cada</p>
                    </div>

                    <div className={styles.itemRight}>
                      <div className={styles.itemControls}>
                        <button onClick={() => alterarQuantidade(item.key, item.quantidade - 1)}>−</button>
                        <span>{item.quantidade}</span>
                        <button onClick={() => alterarQuantidade(item.key, item.quantidade + 1)}>+</button>
                      </div>
                      <div className={styles.itemTotalRow}>
                        <span className={styles.itemTotal}>
                          R$ {(item.preco_unitario * item.quantidade).toFixed(2)}
                        </span>
                        <button className={styles.removeBtn} onClick={() => removerItem(item.key)} title="Remover">🗑️</button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* ── COLUNA DIREITA: resumo + formulário ── */}
            <div className={styles.colRight}>

              {/* Resumo do Pedido */}
              <div className={styles.resumoBox}>
                <h3 className={styles.resumoTitle}>Resumo do Pedido</h3>

                <div className={styles.resumoItens}>
                  {itens.map(item => (
                    <div key={item.key} className={styles.resumoItem}>
                      <span className={styles.resumoItemNome}>
                        {item.quantidade}× {item.nome_produto}
                        {item.nome_variacao ? <em> ({item.nome_variacao})</em> : ''}
                      </span>
                      <span className={styles.resumoItemValor}>
                        R$ {(item.preco_unitario * item.quantidade).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={styles.resumoDivider} />

                <div className={styles.resumoRow}>
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className={styles.resumoRow}>
                  <span>Taxa de entrega</span>
                  <span>R$ {taxaEntrega.toFixed(2)}</span>
                </div>
                <div className={`${styles.resumoRow} ${styles.resumoTotal}`}>
                  <span>Total</span>
                  <span>R$ {(subtotal + taxaEntrega).toFixed(2)}</span>
                </div>
              </div>

              {/* Formulário de entrega */}
              <form onSubmit={handleSubmit(onFinalizar)} className={styles.form}>
                <h3 className={styles.formTitle}>Dados de Entrega</h3>

                <div className={styles.field}>
                  <label>Nome completo *</label>
                  <input className="input-field" {...register('nome_cliente', { required: 'Obrigatório' })} placeholder="Seu nome" />
                  {errors.nome_cliente && <span className={styles.error}>{errors.nome_cliente.message}</span>}
                </div>

                <div className={styles.field}>
                  <label>Telefone *</label>
                  <input className="input-field" {...register('telefone_cliente', { required: 'Obrigatório' })} placeholder="(16) 99999-9999" />
                  {errors.telefone_cliente && <span className={styles.error}>{errors.telefone_cliente.message}</span>}
                </div>

                <div className={styles.field}>
                  <label>Endereço completo *</label>
                  <textarea
                    className="input-field"
                    rows={3}
                    {...register('endereco_entrega', { required: 'Obrigatório' })}
                    placeholder="Rua, número, bairro, complemento..."
                  />
                  {errors.endereco_entrega && <span className={styles.error}>{errors.endereco_entrega.message}</span>}
                </div>

                <div className={styles.field}>
                  <label>Forma de pagamento *</label>
                  <select className="input-field" {...register('forma_pagamento', { required: 'Obrigatório' })}>
                    <option value="">Selecione...</option>
                    <option value="pix">⚡ Pix</option>
                    <option value="dinheiro">💵 Dinheiro</option>
                    <option value="cartao">💳 Cartão</option>
                  </select>
                  {errors.forma_pagamento && <span className={styles.error}>{errors.forma_pagamento.message}</span>}
                </div>

                {formaPagamento === 'cartao' && (
                  <div className={styles.field}>
                    <label>Tipo do cartão *</label>
                    <select className="input-field" {...register('tipo_cartao', { required: 'Obrigatório' })}>
                      <option value="">Selecione...</option>
                      <option value="credito">Crédito</option>
                      <option value="debito">Débito</option>
                    </select>
                    {errors.tipo_cartao && <span className={styles.error}>{errors.tipo_cartao.message}</span>}
                  </div>
                )}

                {formaPagamento === 'dinheiro' && (
                  <div className={styles.field}>
                    <label>Troco para</label>
                    <input className="input-field" type="number" step="0.01" {...register('troco')} placeholder="R$ 0,00" />
                  </div>
                )}

                <div className={styles.field}>
                  <label>Observações (opcional)</label>
                  <textarea className="input-field" rows={2} {...register('observacao')} placeholder="Alguma observação sobre o pedido?" />
                </div>

                {/* Total sticky no mobile */}
                <div className={styles.totalSticky}>
                  <div className={styles.totalStickyInfo}>
                    <span>Total a pagar</span>
                    <strong>R$ {(subtotal + taxaEntrega).toFixed(2)}</strong>
                  </div>
                  <button
                    type="submit"
                    className={styles.finalizarBtn}
                    disabled={loading}
                  >
                    {loading ? 'Finalizando...' : '✅ Finalizar Pedido'}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
