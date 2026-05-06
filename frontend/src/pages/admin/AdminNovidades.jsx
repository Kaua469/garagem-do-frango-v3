import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../../services/api';
import { uploadImagem, criarPreviewLocal } from '../../services/uploadService';
import { getImageUrl } from '../../services/imageUrl';
import { useConfig } from '../../context/ConfigContext';
import styles from './AdminNovidades.module.css';

export default function AdminNovidades() {
  const { imageVersion } = useConfig();
  const [novidades, setNovidades] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [editando, setEditando]   = useState(null);
  const [form, setForm]           = useState({ titulo: '', descricao: '', ativo: true });
  const [uploadFile, setUploadFile] = useState(null);
  const [previewImg, setPreviewImg] = useState(null); // ← FIX: estava faltando
  const [saving, setSaving]       = useState(false);
  const [erro, setErro]           = useState('');

  // ── FIX: usa /novidades/todas para admin ver TODAS (não só as ativas) ──
  const carregar = () => {
    setLoading(true);
    api.get('/novidades/todas')
      .then(r => setNovidades(r.data))
      .catch(() => {
        // fallback para rota pública se /todas não existir ainda
        api.get('/novidades').then(r => setNovidades(r.data)).catch(() => {});
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const fecharModal = () => {
    setModal(false);
    setPreviewImg(null);
    setUploadFile(null);
    setErro('');
  };

  const abrirCriar = () => {
    setEditando(null);
    setForm({ titulo: '', descricao: '', ativo: true });
    setUploadFile(null);
    setPreviewImg(null);
    setErro('');
    setModal(true);
  };

  const abrirEditar = (n) => {
    setEditando(n);
    setForm({ titulo: n.titulo, descricao: n.descricao || '', ativo: !!n.ativo });
    setUploadFile(null);
    setPreviewImg(null);
    setErro('');
    setModal(true);
  };

  // ── FIX: try/catch correto — erro não era capturado, botão parecia travar ──
  const salvar = async () => {
    if (!form.titulo?.trim()) {
      setErro('O título é obrigatório.');
      return;
    }

    setSaving(true);
    setErro('');

    try {
      let imagemUrl = editando?.imagem || null;

      if (uploadFile) {
        imagemUrl = await uploadImagem(uploadFile);
      }

      const payload = { ...form, imagem: imagemUrl };

      if (editando) {
        await api.put(`/novidades/${editando.id}`, payload);
      } else {
        await api.post('/novidades', payload);
      }

      fecharModal();
      carregar();
    } catch (err) {
      // ← FIX: antes sem catch — erro era silencioso, botão ficava travado
      const msg = err.response?.data?.error || err.message || 'Erro ao salvar';
      setErro(msg);
    } finally {
      setSaving(false);
    }
  };

  const excluir = async (id, titulo) => {
    if (!confirm(`Excluir a novidade "${titulo}"?`)) return;
    try {
      await api.delete(`/novidades/${id}`);
      carregar();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao excluir');
    }
  };

  const toggleAtivo = async (n) => {
    try {
      await api.put(`/novidades/${n.id}`, { ...n, ativo: !n.ativo });
      carregar();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao atualizar');
    }
  };

  const ativas   = novidades.filter(n => n.ativo).length;
  const inativas = novidades.filter(n => !n.ativo).length;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>🆕 Novidades</h1>
          <p className={styles.pageSub}>
            {ativas} ativas · {inativas} ocultas · {novidades.length} total
          </p>
        </div>
        <button className="btn-primary" onClick={abrirCriar}>+ Nova Promoção</button>
      </div>

      {loading ? <div className="spinner" /> : (
        <div className={styles.grid}>
          {novidades.length === 0 && (
            <p className={styles.empty}>
              Nenhuma novidade cadastrada. Clique em "+ Nova Promoção".
            </p>
          )}

          {novidades.map(n => (
            <motion.div
              key={n.id}
              className={styles.card}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {n.imagem && (
                <img
                  src={getImageUrl(n.imagem, imageVersion)}
                  alt={n.titulo}
                  className={styles.cardImg}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              )}
              <div className={styles.cardBody}>
                <div className={styles.cardTop}>
                  <span className={`${styles.statusPill} ${n.ativo ? styles.pillAtivo : styles.pillInativo}`}>
                    {n.ativo ? '✅ Visível no site' : '⛔ Oculta'}
                  </span>
                </div>
                <h3 className={styles.cardTitulo}>{n.titulo}</h3>
                <p className={styles.cardDesc}>{n.descricao}</p>

                <div className={styles.cardFooter}>
                  <div className={styles.acoes}>
                    <button
                      className={styles.toggleBtn}
                      onClick={() => toggleAtivo(n)}
                      title={n.ativo ? 'Ocultar' : 'Mostrar no site'}
                    >
                      {n.ativo ? '🙈 Ocultar' : '👁️ Mostrar'}
                    </button>
                    <button
                      className={styles.btnEdit}
                      onClick={() => abrirEditar(n)}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      className={styles.btnDelete}
                      onClick={() => excluir(n.id, n.titulo)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      <AnimatePresence>
        {modal && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={fecharModal}
          >
            <motion.div
              className={styles.modal}
              initial={{ scale: 0.94, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94 }}
              onClick={e => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>{editando ? 'Editar Novidade' : 'Nova Novidade / Promoção'}</h2>
                <button className={styles.closeBtn} onClick={fecharModal}>✕</button>
              </div>

              <div className={styles.modalBody}>

                {/* Erro */}
                {erro && (
                  <div style={{
                    background: '#fff5f5', border: '1px solid #feb2b2',
                    color: '#c53030', padding: '10px 14px', borderRadius: 8,
                    fontSize: '0.88rem', marginBottom: 12
                  }}>
                    ❌ {erro}
                  </div>
                )}

                {/* Título */}
                <div className={styles.field}>
                  <label>Título *</label>
                  <input
                    className="input-field"
                    placeholder="Ex: 🔥 Promoção de Sexta!"
                    value={form.titulo}
                    onChange={e => set('titulo', e.target.value)}
                  />
                </div>

                {/* Descrição */}
                <div className={styles.field}>
                  <label>Descrição</label>
                  <textarea
                    className="input-field"
                    rows={4}
                    placeholder="Detalhes da promoção..."
                    value={form.descricao}
                    onChange={e => set('descricao', e.target.value)}
                  />
                </div>

                {/* Imagem */}
                <div className={styles.field}>
                  <label>Imagem</label>

                  {/* Preview local ou imagem atual do banco */}
                  {(previewImg || editando?.imagem) && (
                    <div style={{ marginBottom: 10 }}>
                      <img
                        src={previewImg || getImageUrl(editando?.imagem, imageVersion)}
                        alt="Preview"
                        style={{
                          height: 120, maxWidth: '100%',
                          borderRadius: 10, objectFit: 'cover',
                          opacity: previewImg ? 0.85 : 1,
                          display: 'block',
                        }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      {previewImg && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: 4 }}>
                          ⏳ Imagem selecionada — será enviada ao clicar Salvar
                        </p>
                      )}
                    </div>
                  )}

                  {/* Input de arquivo estilizado */}
                  <label style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'var(--primary)', color: 'white',
                    padding: '8px 18px', borderRadius: 50, fontSize: '0.85rem',
                    fontWeight: 800, cursor: 'pointer',
                  }}>
                    📁 {uploadFile ? uploadFile.name : 'Escolher imagem'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      style={{ display: 'none' }}
                      onChange={async e => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setUploadFile(f);
                        try {
                          const prev = await criarPreviewLocal(f);
                          setPreviewImg(prev);
                        } catch { /* sem preview */ }
                      }}
                    />
                  </label>
                </div>

                {/* Ativo */}
                <label className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={e => set('ativo', e.target.checked)}
                  />
                  Visível no site público
                </label>

                {/* Botões */}
                <div className={styles.modalFooter}>
                  <button
                    className="btn-outline"
                    onClick={fecharModal}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn-primary"
                    onClick={salvar}
                    disabled={saving}
                  >
                    {saving
                      ? (uploadFile ? '⏳ Enviando imagem...' : '⏳ Salvando...')
                      : editando ? '✅ Salvar Alterações' : '✅ Criar Novidade'
                    }
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
