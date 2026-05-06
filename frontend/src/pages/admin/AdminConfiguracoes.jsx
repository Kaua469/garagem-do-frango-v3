import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { uploadImagem, criarPreviewLocal } from '../../services/uploadService';
import { getImageUrl } from '../../services/imageUrl';
import { useConfig } from '../../context/ConfigContext';
import styles from './AdminConfiguracoes.module.css';

const TABS = [
  { id: 'loja',         label: '🏪 Loja' },
  { id: 'aparencia',    label: '🎨 Aparência' },
  { id: 'conta',        label: '🔐 Minha Conta' },
  { id: 'notificacoes', label: '🔔 Notificações' },
  { id: 'admin',        label: '🔒 Área Admin' },
];

export default function AdminConfiguracoes() {
  const [tab, setTab]       = useState('loja');
  const { config, setConfig, reloadConfig, invalidateImages } = useConfig();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');

  const { register: regLoja, handleSubmit: handleLoja, reset: resetLoja } = useForm();
  const { register: regConta, handleSubmit: handleConta } = useForm();
  const { register: regAdmin, handleSubmit: handleAdmin } = useForm();

  useEffect(() => {
    api.get('/configuracoes')
      .then(r => { setConfig(r.data); resetLoja(r.data); })
      .finally(() => setLoading(false));
  }, []);

  const showMsg = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3500);
  };

  const salvarLoja = async (data) => {
    setSaving(true);
    try {
      await api.put('/configuracoes', data);
      setConfig(prev => ({ ...prev, ...data }));
      showMsg('✅ Configurações salvas com sucesso!');
    } catch { showMsg('❌ Erro ao salvar.'); }
    finally { setSaving(false); }
  };

  const salvarConta = async (data) => {
    setSaving(true);
    try {
      await api.put('/configuracoes/conta', data);
      showMsg('✅ Conta atualizada com sucesso!');
    } catch (err) {
      showMsg('❌ ' + (err.response?.data?.error || 'Erro ao atualizar'));
    } finally { setSaving(false); }
  };

  const salvarAdmin = async (data) => {
    if (!data.rota_admin) return;
    const rota = data.rota_admin.startsWith('/') ? data.rota_admin : '/' + data.rota_admin;
    setSaving(true);
    try {
      await api.put('/configuracoes', { rota_admin: rota });
      showMsg('✅ Rota atualizada! Atualize também o frontend e faça novo deploy.');
    } catch { showMsg('❌ Erro.'); }
    finally { setSaving(false); }
  };

  const salvarNotif = async (e) => {
    e.preventDefault();
    const d = {
      notif_som:                 e.target.notif_som?.checked ? '1' : '0',
      notif_pedido:              e.target.notif_pedido?.checked ? '1' : '0',
      notif_estoque_baixo:       e.target.notif_estoque_baixo?.checked ? '1' : '0',
      notif_produto_indisponivel:e.target.notif_produto_indisponivel?.checked ? '1' : '0',
    };
    setSaving(true);
    try {
      await api.put('/configuracoes', d);
      showMsg('✅ Notificações salvas!');
    } catch { showMsg('❌ Erro.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div>
      <h1 className={styles.pageTitle}>⚙️ Configurações</h1>

      {msg && <div className={styles.msgBox}>{msg}</div>}

      <div className={styles.layout}>
        <nav className={styles.tabNav}>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`${styles.tabBtn} ${tab === t.id ? styles.tabActive : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className={styles.tabContent}>

          {/* ── LOJA ── */}
          {tab === 'loja' && (
            <form onSubmit={handleLoja(salvarLoja)} className={styles.form}>
              <h2 className={styles.sectionTitle}>Informações da Loja</h2>
              <div className={styles.row2}>
                <Field label="Nome da Loja"  name="nome_loja"  reg={regLoja} />
                <Field label="Telefone"       name="telefone"   reg={regLoja} />
              </div>
              <div className={styles.row2}>
                <Field label="WhatsApp (somente números)" name="whatsapp"  reg={regLoja} />
                <Field label="Instagram (sem @)"          name="instagram" reg={regLoja} />
              </div>
              <div className={styles.row2}>
                <Field label="Facebook"                   name="facebook"      reg={regLoja} />
                <Field label="Taxa de Entrega (R$)"       name="taxa_entrega"  reg={regLoja} type="number" />
              </div>
              <Field label="Endereço Completo"           name="endereco"        reg={regLoja} />
              <Field label="Horário de Funcionamento"    name="horario"         reg={regLoja} />
              <Field label="Título Principal da Home"    name="hero_titulo"     reg={regLoja} />
              <Field label="Subtítulo da Home"           name="hero_subtitulo"  reg={regLoja} />
              <SaveBtn saving={saving} />
            </form>
          )}

          {/* ── APARÊNCIA ── */}
          {tab === 'aparencia' && (
            <div className={styles.form}>
              <h2 className={styles.sectionTitle}>Aparência do Site</h2>
              <p style={{ fontSize:'0.88rem', color:'var(--text-secondary)', marginBottom:20 }}>
                As imagens são armazenadas no <strong>Vercel Blob</strong> — permanecem após redeploy e nunca são perdidas.
              </p>

              <UploadField
                label="Logo do Site"
                chave="logo_url"
                config={config}
                setConfig={setConfig}
                invalidateImages={invalidateImages}
                showMsg={showMsg}
                bustImageUrl={bustImageUrl}
              />
              <UploadField
                label="Imagem do Hero (fundo da página inicial)"
                chave="hero_imagem"
                config={config}
                setConfig={setConfig}
                invalidateImages={invalidateImages}
                showMsg={showMsg}
                bustImageUrl={bustImageUrl}
              />
              <UploadField
                label="Banner Extra"
                chave="banner_url"
                config={config}
                setConfig={setConfig}
                invalidateImages={invalidateImages}
                showMsg={showMsg}
                bustImageUrl={bustImageUrl}
              />
            </div>
          )}

          {/* ── CONTA ── */}
          {tab === 'conta' && (
            <form onSubmit={handleConta(salvarConta)} className={styles.form}>
              <h2 className={styles.sectionTitle}>Minha Conta (Dona)</h2>
              <Field label="Novo Telefone de Login"  name="novo_telefone"  reg={regConta} placeholder="Deixe em branco para não alterar" />
              <Field label="Nova Senha"              name="nova_senha"     reg={regConta} type="password" placeholder="Mínimo 8 caracteres" />
              <Field label="Confirmar Nova Senha"    name="confirmar_senha" reg={regConta} type="password" />
              <SaveBtn saving={saving} label="Atualizar Conta" />
            </form>
          )}

          {/* ── NOTIFICAÇÕES ── */}
          {tab === 'notificacoes' && (
            <form onSubmit={salvarNotif} className={styles.form}>
              <h2 className={styles.sectionTitle}>Configurações de Notificações</h2>
              <div className={styles.notifList}>
                <CheckField label="🔊 Tocar som ao receber pedido"          name="notif_som"                 defaultChecked={config.notif_som === '1'} />
                <CheckField label="📦 Notificar novos pedidos"              name="notif_pedido"              defaultChecked={config.notif_pedido === '1'} />
                <CheckField label="⚠️ Alertar estoque baixo (&lt;3 un.)"   name="notif_estoque_baixo"       defaultChecked={config.notif_estoque_baixo === '1'} />
                <CheckField label="🚫 Alertar produto indisponível (= 0)"   name="notif_produto_indisponivel" defaultChecked={config.notif_produto_indisponivel === '1'} />
              </div>
              <SaveBtn saving={saving} label="Salvar Notificações" />
            </form>
          )}

          {/* ── ADMIN ── */}
          {tab === 'admin' && (
            <form onSubmit={handleAdmin(salvarAdmin)} className={styles.form}>
              <h2 className={styles.sectionTitle}>Rota Administrativa Secreta</h2>
              <div className={styles.alertBox}>
                ⚠️ Alterar a rota exige que você atualize <code>ADMIN_ROUTE</code> em{' '}
                <code>frontend/src/App.jsx</code> e faça um novo deploy.
              </div>
              <Field
                label="Rota administrativa (ex: /garagem-frango-a9x7-controle)"
                name="rota_admin"
                reg={regAdmin}
                defaultValue={config.rota_admin || '/garagem-frango-a9x7-controle'}
              />
              <SaveBtn saving={saving} label="Salvar Rota" />
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

/* ─── Componentes auxiliares ─────────────────────────────────────── */

function Field({ label, name, reg, type = 'text', placeholder = '', defaultValue }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
      <label style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-secondary)' }}>{label}</label>
      <input
        className="input-field"
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        {...reg(name)}
      />
    </div>
  );
}

function CheckField({ label, name, defaultChecked }) {
  return (
    <label style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 0', borderBottom:'1px solid #f0e4d4', cursor:'pointer', fontWeight:600, fontSize:'0.9rem' }}>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} style={{ accentColor:'var(--primary)', width:18, height:18 }} />
      {label}
    </label>
  );
}

function SaveBtn({ saving, label = 'Salvar Configurações' }) {
  return (
    <button type="submit" className="btn-primary" disabled={saving} style={{ marginTop:8 }}>
      {saving ? 'Salvando...' : label}
    </button>
  );
}

/**
 * UploadField — campo completo de upload com:
 *  - Preview instantâneo local (antes do upload)
 *  - Upload para Vercel Blob via backend
 *  - Salva URL no banco via /configuracoes
 *  - Invalida cache para forçar re-renderização no site
 */
function UploadField({ label, chave, config, setConfig, invalidateImages, showMsg, bustImageUrl: bust }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState(null); // data URL para preview local
  const inputRef = useRef();

  const currentUrl = config[chave];

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Mostra preview local imediatamente
    try {
      const localPreview = await criarPreviewLocal(file);
      setPreview(localPreview);
    } catch { /* sem preview, tudo bem */ }

    // 2. Faz upload para Vercel Blob
    setUploading(true);
    try {
      const novaUrl = await uploadImagem(file);

      // 3. Salva URL no banco
      await api.put('/configuracoes', { [chave]: novaUrl });

      // 4. Atualiza estado local do config
      setConfig(prev => ({ ...prev, [chave]: novaUrl }));

      // 5. Invalida cache de imagens em todo o app (hero, banner, logo)
      invalidateImages();

      setPreview(null); // limpa preview local — a imagem real já está no blob
      showMsg('✅ Imagem atualizada com sucesso!');
    } catch (err) {
      setPreview(null);
      showMsg('❌ Erro no upload: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = ''; // limpa o input para permitir reenvio
    }
  };

  return (
    <div className={styles.uploadField}>
      <p className={styles.uploadLabel}>{label}</p>

      {/* Preview: local (antes do upload) ou imagem atual do banco */}
      {(preview || currentUrl) && (
        <div className={styles.uploadPreviewWrap}>
          <img
            src={preview || (bust ? bust(getImageUrl(currentUrl)) : getImageUrl(currentUrl))}
            alt={label}
            className={styles.uploadPreview}
            onError={e => { e.target.style.display = 'none'; }}
          />
          {uploading && (
            <div className={styles.uploadOverlay}>
              <div className={styles.uploadSpinner} />
              <span>Enviando...</span>
            </div>
          )}
        </div>
      )}

      <label className={styles.uploadBtn}>
        {uploading ? 'Enviando...' : '📁 Escolher imagem'}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleChange}
          disabled={uploading}
          style={{ display: 'none' }}
        />
      </label>

      {currentUrl && (
        <p className={styles.uploadCurrent}>
          Atual: <a href={currentUrl} target="_blank" rel="noreferrer" style={{ color:'var(--primary)', wordBreak:'break-all' }}>
            {currentUrl.length > 60 ? currentUrl.slice(0,60) + '...' : currentUrl}
          </a>
        </p>
      )}
    </div>
  );
}
