import { useEffect, useState } from 'react';
import api from '../../services/api';
import styles from './AdminEstoque.module.css';

export default function AdminEstoque() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [saving, setSaving] = useState(false);

  const carregar = () => {
    setLoading(true);
    api.get('/produtos').then(r => setProdutos(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const salvarEstoque = async (produto) => {
    setSaving(true);
    try {
      await api.put(`/produtos/${produto.id}`, { ...produto, estoque: parseInt(editVal) });
      setEditId(null);
      carregar();
    } catch (e) {
      alert('Erro ao atualizar');
    } finally {
      setSaving(false);
    }
  };

  const baixo = produtos.filter(p => p.estoque > 0 && p.estoque < 3);
  const esgotados = produtos.filter(p => p.estoque === 0);
  const ok = produtos.filter(p => p.estoque >= 3);

  return (
    <div>
      <h1 className={styles.pageTitle}>📋 Estoque</h1>

      {/* Summary cards */}
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
              <tr><th>Produto</th><th>Categoria</th><th>Status</th><th>Estoque</th><th>Ação</th></tr>
            </thead>
            <tbody>
              {produtos.map(p => (
                <tr key={p.id} className={p.estoque === 0 ? styles.rowDanger : p.estoque < 3 ? styles.rowWarn : ''}>
                  <td><strong>{p.nome}</strong></td>
                  <td style={{ textTransform: 'capitalize' }}>{p.categoria}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${p.status === 'ativo' ? styles.statusAtivo : styles.statusInativo}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    {editId === p.id ? (
                      <input
                        type="number"
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        className={styles.estoqueInput}
                        min="0"
                        autoFocus
                      />
                    ) : (
                      <span className={`${styles.estoqueBadge} ${p.estoque === 0 ? styles.estoqueZero : p.estoque < 3 ? styles.estoqueBaixo : styles.estoqueOk}`}>
                        {p.estoque} un.
                      </span>
                    )}
                  </td>
                  <td>
                    {editId === p.id ? (
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
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
