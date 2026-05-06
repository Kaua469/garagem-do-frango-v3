import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { uploadImagem, criarPreviewLocal } from '../../services/uploadService';
import { getImageUrl } from '../../services/imageUrl';
import { useConfig } from '../../context/ConfigContext';
import styles from './AdminProdutos.module.css';

const CATEGORIAS = ['frangos', 'marmitas', 'porcoes', 'bebidas', 'sobremesas', 'combos'];

const MODAL_VAZIO = {
  nome: '', descricao: '', categoria: 'frangos', preco: '', estoque: '',
  status: 'ativo', mais_vendido: false, novidade: false, combo_semana: false,
  tem_variacao: false, tem_quantidade: false, qtd_min: 1, qtd_max: 20,
};

export default function AdminProdutos() {
  const { imageVersion } = useConfig();
  const [produtos, setProdutos]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando]   = useState(null);
  const [variacoes, setVariacoes] = useState([]);
  const [novaVariacao, setNovaVariacao] = useState({ nome: '', preco: '', estoque: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [previewImg, setPreviewImg] = useState(null); // ← FIX: estava faltando
  const [saving, setSaving]       = useState(false);
  const [erro, setErro]           = useState('');
  const [busca, setBusca]         = useState('');
  const [catFiltro, setCatFiltro] = useState('todos');

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: MODAL_VAZIO,
  });
  const temVariacao = watch('tem_variacao');

  // ── Carrega produtos ──────────────────────────────────────────────────────
  const carregar = () => {
    setLoading(true);
    api.get('/produtos')
      .then(r => setProdutos(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => { carregar(); }, []);

  // ── Abrir modal criar ─────────────────────────────────────────────────────
  const abrirCriar = () => {
    setEditando(null);
    setVariacoes([]);
    setUploadFile(null);
    setPreviewImg(null);
    setErro('');
    reset(MODAL_VAZIO);
    setModalOpen(true);
  };

  // ── Abrir modal editar ────────────────────────────────────────────────────
  const abrirEditar = (p) => {
    setEditando(p);
    setVariacoes(p.variacoes || []);
    setUploadFile(null);
    setPreviewImg(null);
    setErro('');
    reset({
      nome:           p.nome,
      descricao:      p.descricao || '',
      categoria:      p.categoria,
      preco:          p.preco,
      estoque:        p.estoque,
      status:         p.status,
      mais_vendido:   !!p.mais_vendido,
      novidade:       !!p.novidade,
      combo_semana:   !!p.combo_semana,
      tem_variacao:   !!p.tem_variacao,
      tem_quantidade: !!p.tem_quantidade,
      qtd_min:        p.qtd_min,
      qtd_max:        p.qtd_max,
    });
    setModalOpen(true);
  };

  // ── Fechar modal ──────────────────────────────────────────────────────────
  const fecharModal = () => {
    setModalOpen(false);
    setPreviewImg(null);
    setUploadFile(null);
    setErro('');
  };

  // ── Salvar (criar ou editar) ──────────────────────────────────────────────
  const onSubmit = async (data) => {
    setSaving(true);
    setErro('');
    try {
      let imagemUrl = editando?.imagem || null;

      if (uploadFile) {
        imagemUrl = await uploadImagem(uploadFile);
      }

      const payload = { ...data, imagem: imagemUrl, variacoes };

      if (editando) {
        await api.put(`/produtos/${editando.id}`, payload);
      } else {
        await api.post('/produtos', payload);
      }

      fecharModal();
      carregar();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Erro ao salvar produto';
      setErro(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Excluir ───────────────────────────────────────────────────────────────
  const excluir = async (id) => {
    if (!confirm('Excluir este produto?')) return;
    try {
      const { data } = await api.delete(`/produtos/${id}`);
      carregar();
      // Backend pode inativar em vez de deletar se tiver pedidos
      if (data?.message?.includes('inativado')) {
        alert('Produto inativado (tem pedidos vinculados).');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao excluir produto');
    }
  };

  // ── Variações ─────────────────────────────────────────────────────────────
  const adicionarVariacao = () => {
    if (!novaVariacao.nome || !novaVariacao.preco) return;
    setVariacoes(prev => [...prev, { ...novaVariacao, id: `tmp_${Date.now()}` }]);
    setNovaVariacao({ nome: '', preco: '', estoque: '' });
  };
  const removerVariacao = (id) => setVariacoes(prev => prev.filter(v => v.id !== id));

  // ── Filtros ───────────────────────────────────────────────────────────────
  const filtrados = produtos.filter(p => {
    const matchCat   = catFiltro === 'todos' || p.categoria === catFiltro;
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
    return matchCat && matchBusca;
  });

  return (
    <div>
      {/* ── Cabeçalho ── */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>🍗 Produtos</h1>
        <button className="btn-primary" onClick={abrirCriar}>+ Novo Produto</button>
      </div>

      {/* ── Filtros ── */}
      <div className={styles.filters}>
        <input
          className="input-field"
          style={{ maxWidth: 280 }}
          placeholder="🔍 Buscar..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <select
          className="input-field"
          style={{ maxWidth: 200 }}
          value={catFiltro}
          onChange={e => setCatFiltro(e.target.value)}
        >
          <option value="todos">Todas categorias</option>
          {CATEGORIAS.map(c => (
            <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>
          ))}
        </select>
      </div>

      {/* ── Tabela ── */}
      {loading ? <div className="spinner" /> : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Imagem</th>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 && (
                <tr><td colSpan={7} className={styles.empty}>Nenhum produto encontrado.</td></tr>
              )}
              {filtrados.map(p => (
                <tr key={p.id}>
                  <td>
                    {p.imagem ? (
                      <img
                        src={getImageUrl(p.imagem, imageVersion)}
                        alt={p.nome}
                        className={styles.prodImg}
                        onError={e => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML = '<div class="' + styles.prodImgPlaceholder + '">🍗</div>';
                        }}
                      />
                    ) : (
                      <div className={styles.prodImgPlaceholder}>🍗</div>
                    )}
                  </td>
                  <td><strong>{p.nome}</strong></td>
                  <td>
                    <span className={styles.catBadge} style={{ textTransform: 'capitalize' }}>
                      {p.categoria}
                    </span>
                  </td>
                  <td>R$ {Number(p.preco).toFixed(2)}</td>
                  <td>
                    <span className={`${styles.estoqueBadge} ${
                      p.estoque === 0 ? styles.estoqueZero
                      : p.estoque < 3 ? styles.estoqueBaixo
                      : styles.estoqueOk
                    }`}>
                      {p.estoque}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${
                      p.status === 'ativo' ? styles.statusAtivo : styles.statusInativo
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.acoes}>
                      <button
                        className={styles.btnEdit}
                        onClick={() => abrirEditar(p)}
                        title="Editar produto"
                      >
                        ✏️
                      </button>
                      <button
                        className={styles.btnDelete}
                        onClick={() => excluir(p.id)}
                        title="Excluir produto"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal criar/editar ── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={fecharModal}
          >
            <motion.div
              className={styles.modal}
              initial={{ scale: 0.94, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 20 }}
              onClick={e => e.stopPropagation()} // ← não fecha ao clicar dentro
            >
              {/* Header do modal */}
              <div className={styles.modalHeader}>
                <h2>{editando ? `Editar: ${editando.nome}` : 'Novo Produto'}</h2>
                <button onClick={fecharModal} className={styles.modalCloseBtn}>✕</button>
              </div>

              {/* Mensagem de erro */}
              {erro && (
                <div className={styles.modalErro}>
                  ❌ {erro}
                </div>
              )}

              {/* Formulário */}
              <form onSubmit={handleSubmit(onSubmit)} className={styles.modalForm}>

                {/* Nome + Categoria */}
                <div className={styles.row2}>
                  <div className={styles.field}>
                    <label>Nome *</label>
                    <input
                      className="input-field"
                      {...register('nome', { required: 'Nome obrigatório' })}
                      placeholder="Nome do produto"
                    />
                    {errors.nome && <span className={styles.fieldErr}>{errors.nome.message}</span>}
                  </div>
                  <div className={styles.field}>
                    <label>Categoria *</label>
                    <select className="input-field" {...register('categoria', { required: true })}>
                      {CATEGORIAS.map(c => (
                        <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Descrição */}
                <div className={styles.field}>
                  <label>Descrição</label>
                  <textarea
                    className="input-field"
                    rows={3}
                    {...register('descricao')}
                    placeholder="Descrição do produto"
                  />
                </div>

                {/* Preço + Estoque + Status */}
                <div className={styles.row3}>
                  <div className={styles.field}>
                    <label>Preço (R$) *</label>
                    <input
                      className="input-field"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('preco', { required: 'Preço obrigatório' })}
                    />
                    {errors.preco && <span className={styles.fieldErr}>{errors.preco.message}</span>}
                  </div>
                  <div className={styles.field}>
                    <label>Estoque *</label>
                    <input
                      className="input-field"
                      type="number"
                      min="0"
                      {...register('estoque', { required: 'Estoque obrigatório' })}
                    />
                    {errors.estoque && <span className={styles.fieldErr}>{errors.estoque.message}</span>}
                  </div>
                  <div className={styles.field}>
                    <label>Status</label>
                    <select className="input-field" {...register('status')}>
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className={styles.checkboxRow}>
                  {[
                    { name: 'mais_vendido',   label: '⭐ Mais Vendido' },
                    { name: 'novidade',       label: '🆕 Novidade' },
                    { name: 'combo_semana',   label: '🎁 Combo' },
                    { name: 'tem_variacao',   label: '📦 Tem Variações' },
                    { name: 'tem_quantidade', label: '🔢 Controle Qtd' },
                  ].map(({ name, label }) => (
                    <label key={name} className={styles.checkbox}>
                      <input type="checkbox" {...register(name)} />
                      {label}
                    </label>
                  ))}
                </div>

                {/* Quantidade min/max */}
                {watch('tem_quantidade') && (
                  <div className={styles.row2}>
                    <div className={styles.field}>
                      <label>Qtd Mínima</label>
                      <input className="input-field" type="number" min="1" {...register('qtd_min')} />
                    </div>
                    <div className={styles.field}>
                      <label>Qtd Máxima</label>
                      <input className="input-field" type="number" min="1" {...register('qtd_max')} />
                    </div>
                  </div>
                )}

                {/* Variações */}
                {temVariacao && (
                  <div className={styles.variacoesSection}>
                    <h4>Variações do produto</h4>
                    {variacoes.map(v => (
                      <div key={v.id} className={styles.varRow}>
                        <span>{v.nome}</span>
                        <span>R$ {Number(v.preco).toFixed(2)}</span>
                        <span>Est: {v.estoque || 0}</span>
                        <button type="button" onClick={() => removerVariacao(v.id)}>🗑️</button>
                      </div>
                    ))}
                    <div className={styles.novaVar}>
                      <input
                        className="input-field"
                        placeholder="Nome (ex: 250g)"
                        value={novaVariacao.nome}
                        onChange={e => setNovaVariacao(p => ({ ...p, nome: e.target.value }))}
                      />
                      <input
                        className="input-field"
                        placeholder="Preço"
                        type="number"
                        step="0.01"
                        value={novaVariacao.preco}
                        onChange={e => setNovaVariacao(p => ({ ...p, preco: e.target.value }))}
                      />
                      <input
                        className="input-field"
                        placeholder="Estoque"
                        type="number"
                        value={novaVariacao.estoque}
                        onChange={e => setNovaVariacao(p => ({ ...p, estoque: e.target.value }))}
                      />
                      <button type="button" className="btn-secondary" onClick={adicionarVariacao}>
                        + Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Imagem */}
                <div className={styles.field}>
                  <label>Imagem do Produto</label>

                  {/* Preview: local (antes do upload) ou imagem atual */}
                  {(previewImg || editando?.imagem) && (
                    <div style={{ marginBottom: 10 }}>
                      <img
                        src={previewImg || getImageUrl(editando?.imagem, imageVersion)}
                        alt="Preview"
                        className={styles.previewImg}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      {previewImg && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: 4 }}>
                          ⏳ Imagem selecionada — será enviada ao clicar em Salvar
                        </p>
                      )}
                    </div>
                  )}

                  <label className={styles.fileLabel}>
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

                {/* Footer do modal */}
                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={fecharModal}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving}
                  >
                    {saving
                      ? (uploadFile ? '⏳ Enviando imagem...' : '⏳ Salvando...')
                      : editando ? '✅ Salvar Alterações' : '✅ Criar Produto'
                    }
                  </button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
