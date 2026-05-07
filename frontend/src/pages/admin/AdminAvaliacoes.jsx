import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../../services/api';
import { formatarData } from '../../services/dateUtils';
import styles from './AdminAvaliacoes.module.css';

const NOTA_VAZIA = { nome: '', nota: 5, comentario: '', ativo: true };

export default function AdminAvaliacoes() {
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [editando, setEditando]     = useState(null);
  const [form, setForm]             = useState(NOTA_VAZIA);
  const [saving, setSaving]         = useState(false);
  const [erro, setErro]             = useState('');

  const carregar = () => {
    setLoading(true);
    api.get('/avaliacoes/todas')
      .then(r => setAvaliacoes(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const abrirCriar = () => {
    setEditando(null);
    setForm(NOTA_VAZIA);
    setErro('');
    setModal(true);
  };

  const abrirEditar = (a) => {
    setEditando(a);
    setForm({ nome: a.nome, nota: a.nota, comentario: a.comentario, ativo: !!a.ativo });
    setErro('');
    setModal(true);
  };

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const salvar = async () => {
    if (!form.nome.trim() || !form.comentario.trim()) {
      setErro('Preencha nome e comentário.');
      return;
    }
    setSaving(true);
    setErro('');
    try {
      if (editando) {
        await api.put(`/avaliacoes/${editando.id}`, form);
      } else {
        await api.post('/avaliacoes', form);
      }
      setModal(false);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const excluir = async (id, nome) => {
    if (!confirm(`Excluir avaliação de "${nome}"?`)) return;
    await api.delete(`/avaliacoes/${id}`);
    carregar();
  };

  const toggleAtivo = async (a) => {
    await api.put(`/avaliacoes/${a.id}`, { ...a, ativo: !a.ativo });
    carregar();
  };

  const ativas   = avaliacoes.filter(a => a.ativo).length;
  const inativas = avaliacoes.filter(a => !a.ativo).length;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>⭐ Avaliações</h1>
          <p className={styles.pageSub}>
            {ativas} ativas · {inativas} ocultas · {avaliacoes.length} total
          </p>
        </div>
        <button className="btn-primary" onClick={abrirCriar}>+ Nova Avaliação</button>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className={styles.grid}>
          {avaliacoes.length === 0 && (
            <p className={styles.empty}>Nenhuma avaliação cadastrada. Clique em "Nova Avaliação" para adicionar.</p>
          )}

          {avaliacoes.map(a => (
            <motion.div
              key={a.id}
              className={`${styles.card} ${!a.ativo ? styles.cardInativa : ''}`}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Status badge */}
              <div className={styles.cardTop}>
                <span className={`${styles.statusPill} ${a.ativo ? styles.pillAtivo : styles.pillInativo}`}>
                  {a.ativo ? '✅ Visível no site' : '⛔ Oculta'}
                </span>
                <span className={styles.estrelas}>{'⭐'.repeat(a.nota)}</span>
              </div>

              <p className={styles.comentario}>"{a.comentario}"</p>
              <p className={styles.autor}>— {a.nome}</p>
              <p className={styles.data}>
                {formatarData(a.criado_em)}
              </p>

              <div className={styles.acoes}>
                <button
                  className={styles.toggleBtn}
                  onClick={() => toggleAtivo(a)}
                  title={a.ativo ? 'Ocultar do site' : 'Mostrar no site'}
                >
                  {a.ativo ? '🙈 Ocultar' : '👁️ Mostrar'}
                </button>
                <button className={styles.editBtn} onClick={() => abrirEditar(a)}>✏️ Editar</button>
                <button className={styles.delBtn} onClick={() => excluir(a.id, a.nome)}>🗑️</button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setModal(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94 }}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>{editando ? 'Editar Avaliação' : 'Nova Avaliação'}</h2>
                <button className={styles.closeBtn} onClick={() => setModal(false)}>✕</button>
              </div>

              <div className={styles.modalBody}>
                {erro && <div className={styles.erroBox}>{erro}</div>}

                <div className={styles.field}>
                  <label>Nome do cliente *</label>
                  <input
                    className="input-field"
                    placeholder="Ex: Maria Silva"
                    value={form.nome}
                    onChange={e => set('nome', e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label>Nota (1 a 5) *</label>
                  <div className={styles.notaSelector}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        className={`${styles.notaBtn} ${form.nota >= n ? styles.notaAtiva : ''}`}
                        onClick={() => set('nota', n)}
                        type="button"
                      >
                        ⭐
                      </button>
                    ))}
                    <span className={styles.notaNum}>{form.nota}/5</span>
                  </div>
                </div>

                <div className={styles.field}>
                  <label>Comentário *</label>
                  <textarea
                    className="input-field"
                    rows={4}
                    placeholder="O que o cliente disse sobre a experiência..."
                    value={form.comentario}
                    onChange={e => set('comentario', e.target.value)}
                  />
                </div>

                <label className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={e => set('ativo', e.target.checked)}
                  />
                  Visível no site público
                </label>

                <div className={styles.modalFooter}>
                  <button className="btn-outline" onClick={() => setModal(false)}>Cancelar</button>
                  <button className="btn-primary" onClick={salvar} disabled={saving}>
                    {saving ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Criar Avaliação'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
