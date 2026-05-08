import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import styles from './AdminEstoque.module.css';

export default function AdminEstoque() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null); // id do produto ou id da variação
  const [editVal, setEditVal] = useState('');
  const [saving, setSaving] = useState(false);

  const carregar = () => {
    setLoading(true);
    api.get('/produtos').then(r => setProdutos(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const salvarEstoque = async (produto, variacaoId = null) => {
    setSaving(true);
    try {
      let payload;
      if (variacaoId) {
        // Atualiza apenas a variação específica dentro do array
        const variacoesAtualizadas = produto.variacoes.map(v => 
          v.id === variacaoId ? { ...v, estoque: parseInt(editVal) } : v
        );
        payload = { ...produto, variacoes: variacoesAtualizadas };
      } else {
        payload = { ...produto, estoque: parseInt(editVal) };
      }

      await api.put(`/produtos/${produto.id}`, payload);
      setEditId(null);
      carregar();
    } catch (e) {
      alert('Erro ao atualizar estoque');
    } finally {
      setSaving(false);
    }
  };

  const baixo = produtos.filter(p => p.estoque > 0 && p.estoque < 3);
  const esgotados = produtos.filter(p => p.estoque === 0);
  const ok = produtos.filter(p => p.estoque >= 3);

  const renderEstoqueBadge = (qtd) => {
    const q = Number(qtd);
    const cls = q === 0 ? styles.estoqueZero : q < 3 ? styles.estoqueBaixo : styles.estoqueOk;
    return <span className={`${styles.estoqueBadge} ${cls}`}>{q} un.</span>;
  };

  return (
    <div>
      <h1 className={styles.pageTitle}>📋 Estoque</h1>

      <div className={styles.summaryGrid}>
        <div className={`${styles.summaryCard} ${styles.cardOk}`}>
          <span className={styles.summaryNum}>{ok.length}</span>
          <span className={styles.summaryLabel}>✅ Em estoque</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.cardWarn}`}>
          <span className={styles.summaryNum}>{baixo.length}</span>
          <span className={styles.summaryLabel}>⚠️ Estoque baixo (&lt;3)</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.cardDanger}`}>
          <span className={styles.summaryNum}>{esgotados.length}</span>
          <span className={styles.summaryLabel}>🚫 Esgotados</span>
        </div>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr><th>Produto / Variação</th><th>Categoria</th><th>Status</th><th>Estoque</th><th>Ação</th></tr>
            </thead>
            <tbody>
              {produtos.map(p => (
                <React.Fragment key={p.id}>
                  {/* Linha do Produto Principal */}
                  <tr className={p.estoque === 0 ? styles.rowDanger : p.estoque < 3 ? styles.rowWarn : ''}>
                    <td>
                      <strong>{p.nome}</strong>
                      {p.tem_variacao && <div style={{ fontSize: '0.7rem', color: '#888' }}>Possui variações</div>}
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{p.categoria}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${p.status === 'ativo' ? styles.statusAtivo : styles.statusInativo}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      {!p.tem_variacao ? (
                        editId === p.id ? (
                          <input
                            type="number"
                            value={editVal}
                            onChange={e => setEditVal(e.target.value)}
                            className={styles.estoqueInput}
                            min="0"
                            autoFocus
                          />
                        ) : renderEstoqueBadge(p.estoque)
                      ) : (
                        <span className={styles.estoqueBadge} style={{ background: '#f0f0f0', color: '#555' }}>
                          Total: {p.estoque}
                        </span>
                      )}
                    </td>
                    <td>
                      {!p.tem_variacao && (
                        editId === p.id ? (
                          <div className={styles.editBtns}>
                            <button className={styles.saveBtn} onClick={() => salvarEstoque(p)} disabled={saving}>
                              {saving ? '...' : '✅'}
                            </button>
                            <button className={styles.cancelBtn} onClick={() => setEditId(null)}>✕</button>
                          </div>
                        ) : (
                          <button className={styles.editBtn} onClick={() => { setEditId(p.id); setEditVal(p.estoque); }}>
                            ✏️ Editar
                          </button>
                        )
                      )}
                    </td>
                  </tr>

                  {/* Linhas das Variações */}
                  {p.tem_variacao && p.variacoes?.map(v => (
                    <tr key={v.id} style={{ background: '#fafafa' }}>
                      <td style={{ paddingLeft: '40px', color: '#666' }}>
                        ↳ {v.nome}
                      </td>
                      <td>—</td>
                      <td>—</td>
                      <td>
                        {editId === `v_${v.id}` ? (
                          <input
                            type="number"
                            value={editVal}
                            onChange={e => setEditVal(e.target.value)}
                            className={styles.estoqueInput}
                            min="0"
                            autoFocus
                          />
                        ) : renderEstoqueBadge(v.estoque)}
                      </td>
                      <td>
                        {editId === `v_${v.id}` ? (
                          <div className={styles.editBtns}>
                            <button className={styles.saveBtn} onClick={() => salvarEstoque(p, v.id)} disabled={saving}>
                              {saving ? '...' : '✅'}
                            </button>
                            <button className={styles.cancelBtn} onClick={() => setEditId(null)}>✕</button>
                          </div>
                        ) : (
                          <button className={styles.editBtn} onClick={() => { setEditId(`v_${v.id}`); setEditVal(v.estoque); }}>
                            ✏️ Editar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

