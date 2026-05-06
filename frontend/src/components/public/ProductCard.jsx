import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { getImageUrl } from '../../services/imageUrl';
import { useConfig } from '../../context/ConfigContext';
import styles from './ProductCard.module.css';

export default function ProductCard({ produto }) {
  const { adicionarItem } = useCart();
  const { imageVersion } = useConfig();
  const [variacaoSelecionada, setVariacaoSelecionada] = useState(null);
  const [quantidade, setQuantidade] = useState(produto.qtd_min || 1);
  const [adicionado, setAdicionado] = useState(false);
  const [imgError, setImgError] = useState(false);

  const esgotado = produto.estoque === 0;
  const imgUrl   = getImageUrl(produto.imagem, imageVersion);

  // Preço exibido: variação selecionada, ou menor variação, ou preço base
  const precoBase = produto.tem_variacao && produto.variacoes?.length > 0
    ? Math.min(...produto.variacoes.map(v => Number(v.preco)))
    : Number(produto.preco);
  const precoExibido = variacaoSelecionada
    ? Number(variacaoSelecionada.preco) * quantidade
    : precoBase * quantidade;
  const temVariacao  = produto.tem_variacao && produto.variacoes?.length > 0;
  const precisaEscolha = temVariacao && !variacaoSelecionada;

  const handleAdicionar = () => {
    if (esgotado || precisaEscolha) return;
    adicionarItem(produto, variacaoSelecionada, quantidade);
    setAdicionado(true);
    setTimeout(() => setAdicionado(false), 1600);
  };

  return (
    <motion.article
      className={`${styles.card} ${esgotado ? styles.esgotado : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={esgotado ? {} : { y: -5, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3 }}
    >
      {/* ── IMAGEM ── */}
      <div className={styles.imgBox}>
        {imgUrl && !imgError ? (
          <img
            src={imgUrl}
            alt={produto.nome}
            className={styles.img}
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className={styles.imgPlaceholder}>🍗</div>
        )}

        {esgotado && (
          <div className={styles.esgotadoOverlay}>
            <span>Indisponível</span>
          </div>
        )}

        {/* Badges — apenas um de cada vez */}
        {!esgotado && produto.mais_vendido && (
          <span className={`${styles.badge} ${styles.badgeSell}`}>⭐ + Vendido</span>
        )}
        {!esgotado && produto.novidade && !produto.mais_vendido && (
          <span className={`${styles.badge} ${styles.badgeNew}`}>🆕 Novo</span>
        )}
        {!esgotado && produto.combo_semana && !produto.mais_vendido && !produto.novidade && (
          <span className={`${styles.badge} ${styles.badgeCombo}`}>🎁 Combo</span>
        )}
      </div>

      {/* ── CORPO ── */}
      <div className={styles.body}>

        {/* Nome */}
        <h3 className={styles.nome}>{produto.nome}</h3>

        {/* Descrição — sempre 2 linhas para alinhar */}
        {produto.descricao && (
          <p className={styles.desc}>{produto.descricao}</p>
        )}
        {!produto.descricao && (
          <p className={styles.desc} aria-hidden="true">&nbsp;</p>
        )}

        {/* ── ZONA FLEXÍVEL: cresce para empurrar rodapé para baixo ── */}
        <div className={styles.middle}>

          {/* Variações */}
          {temVariacao && (
            <div className={styles.varBox}>
              <p className={styles.varLabel}>Escolha o tamanho:</p>
              <div className={styles.varList}>
                {produto.variacoes.map(v => (
                  <button
                    key={v.id}
                    className={`${styles.varBtn} ${variacaoSelecionada?.id === v.id ? styles.varAtiva : ''}`}
                    onClick={() => setVariacaoSelecionada(v)}
                    type="button"
                  >
                    <span className={styles.varNome}>{v.nome}</span>
                    <span className={styles.varPreco}>R$ {Number(v.preco).toFixed(2)}</span>
                  </button>
                ))}
              </div>
              {precisaEscolha && (
                <p className={styles.varDica}>👆 Escolha uma opção acima</p>
              )}
            </div>
          )}

          {/* Controle de quantidade */}
          {produto.tem_quantidade && (
            <div className={styles.qtdBox}>
              <span className={styles.varLabel}>Quantidade:</span>
              <div className={styles.qtdCtrl}>
                <button
                  type="button"
                  onClick={() => setQuantidade(q => Math.max(produto.qtd_min || 1, q - 1))}
                  aria-label="Diminuir"
                >−</button>
                <span className={styles.qtdNum}>{quantidade}</span>
                <button
                  type="button"
                  onClick={() => setQuantidade(q => Math.min(produto.qtd_max || 20, q + 1))}
                  aria-label="Aumentar"
                >+</button>
              </div>
            </div>
          )}

        </div>

        {/* ── RODAPÉ: sempre na base do card ── */}
        <div className={styles.footer}>
          <div className={styles.precoWrap}>
            {temVariacao && !variacaoSelecionada && (
              <span className={styles.precoLabel}>A partir de</span>
            )}
            <span className={styles.preco}>
              R$ {precoExibido.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <button
            className={`${styles.addBtn} ${adicionado ? styles.added : ''} ${esgotado || precisaEscolha ? styles.disabled : ''}`}
            onClick={handleAdicionar}
            disabled={esgotado}
            type="button"
          >
            {adicionado
              ? <><span className={styles.checkIcon}>✓</span> Adicionado</>
              : esgotado
                ? 'Indisponível'
                : precisaEscolha
                  ? 'Escolha o tamanho'
                  : <><span className={styles.plusIcon}>+</span> Adicionar</>
            }
          </button>
        </div>

      </div>
    </motion.article>
  );
}
