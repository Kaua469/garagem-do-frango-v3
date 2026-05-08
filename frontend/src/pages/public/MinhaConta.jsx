import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../components/public/Header';
import Footer from '../../components/public/Footer';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatarData } from '../../services/dateUtils';
import styles from './MinhaConta.module.css';

const STATUS_LABEL = {
  aguardando: '⏳ Aguardando',
  confirmado: '✅ Confirmado',
  preparando: '👨‍🍳 Preparando',
  saiu_entrega: '🛵 Saiu para Entrega',
  entregue: '🎉 Entregue',
  cancelado: '❌ Cancelado',
};

export default function MinhaConta() {
  const { usuario, logout } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!usuario) return;
    api.get('/pedidos/meus').then(r => setPedidos(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [usuario]);

  if (!usuario) return <Navigate to="/login" />;

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Olá, {usuario.nome}! 👋</h1>
              <p className={styles.sub}>Telefone: {usuario.telefone}</p>
            </div>
            <button onClick={logout} className="btn-outline">Sair</button>
          </div>

          {/* ── SEÇÃO DE PERFIL / SEGURANÇA ── */}
          <ProfileSection usuario={usuario} />

          <h2 className={styles.secTitle}>Meus Pedidos</h2>

          {loading ? (
            <div className="spinner" />
          ) : pedidos.length === 0 ? (
            <div className={styles.empty}>
              <p>Você ainda não fez nenhum pedido.</p>
              <Link to="/cardapio" className="btn-primary" style={{ marginTop: 20 }}>Pedir Agora 🍗</Link>
            </div>
          ) : (
            <div className={styles.pedidosList}>
              {pedidos.map(p => (
                <div key={p.id} className={styles.pedidoCard}>
                  <div className={styles.pedidoHeader}>
                    <span className={styles.pedidoNum}>Pedido #{p.numero}</span>
                    <span className={styles.pedidoStatus}>{STATUS_LABEL[p.status] || p.status}</span>
                  </div>
                  <div className={styles.pedidoInfo}>
                    <span>📅 {formatarData(p.criado_em)}</span>
                    <span>💳 {p.forma_pagamento}</span>
                    <span className={styles.pedidoTotal}>R$ {Number(p.total).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── SEÇÃO DE FEEDBACK ── */}
          <FeedbackSection usuario={usuario} />
        </div>
      </main>
      <Footer />
    </>
  );
}

function FeedbackSection({ usuario }) {
  const [form, setForm] = useState({ nota: 5, comentario: '' });
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  const enviar = async () => {
    if (!form.comentario.trim()) return alert('Escreva um comentário antes de enviar.');
    setLoading(true);
    try {
      await api.post('/avaliacoes/public', {
        nome: usuario.nome,
        nota: form.nota,
        comentario: form.comentario
      });
      setEnviado(true);
    } catch {
      alert('Erro ao enviar feedback. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <div className={styles.feedbackSuccess}>
        <h3>🎉 Obrigado pelo feedback!</h3>
        <p>Sua avaliação foi enviada com sucesso e será revisada pela nossa equipe.</p>
      </div>
    );
  }

  return (
    <div className={styles.feedbackBox}>
      <h2 className={styles.secTitle}>O que está achando da Garagem? ⭐</h2>
      <p className={styles.feedbackSub}>Sua opinião é muito importante para nós!</p>
      
      <div className={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map(n => (
          <button 
            key={n} 
            className={`${styles.starBtn} ${form.nota >= n ? styles.starActive : ''}`}
            onClick={() => setForm(p => ({ ...p, nota: n }))}
          >
            ⭐
          </button>
        ))}
      </div>

      <textarea
        className={`input-field ${styles.feedbackArea}`}
        placeholder="Conte-nos como foi sua experiência..."
        value={form.comentario}
        onChange={e => setForm(p => ({ ...p, comentario: e.target.value }))}
        rows={3}
      />

      <button 
        className="btn-primary" 
        onClick={enviar} 
        disabled={loading}
        style={{ width: '100%', marginTop: 14 }}
      >
        {loading ? 'Enviando...' : 'Enviar Feedback'}
      </button>
    </div>
  );
}

function ProfileSection({ usuario }) {
  const [showPhone, setShowPhone] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [phone, setPhone] = useState(usuario.telefone);
  const [passForm, setPassForm] = useState({ atual: '', nova: '', confirma: '' });

  const salvarTelefone = async () => {
    setLoading(true);
    try {
      await api.patch('/auth/perfil', { telefone: phone });
      alert('Telefone atualizado! Entre novamente para aplicar as mudanças.');
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao atualizar telefone');
    } finally {
      setLoading(false);
    }
  };

  const salvarSenha = async () => {
    if (passForm.nova !== passForm.confirma) return alert('As senhas não conferem');
    setLoading(true);
    try {
      await api.patch('/auth/perfil', { 
        senha_atual: passForm.atual, 
        nova_senha: passForm.nova 
      });
      alert('Senha atualizada com sucesso!');
      setShowPass(false);
      setPassForm({ atual: '', nova: '', confirma: '' });
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao atualizar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.profileBox}>
      <div className={styles.profileActions}>
        <button className="btn-outline" onClick={() => setShowPhone(!showPhone)}>
          📱 Alterar Telefone
        </button>
        <button className="btn-outline" onClick={() => setShowPass(!showPass)}>
          🔑 Alterar Senha
        </button>
      </div>

      <AnimatePresence>
        {showPhone && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={styles.editSection}>
            <label>Novo Telefone</label>
            <input 
              className="input-field" 
              value={phone} 
              onChange={e => setPhone(e.target.value)}
              placeholder="Ex: 11999999999"
            />
            <button className="btn-primary" onClick={salvarTelefone} disabled={loading} style={{ marginTop: 10 }}>
              {loading ? 'Salvando...' : 'Salvar Novo Telefone'}
            </button>
          </motion.div>
        )}

        {showPass && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={styles.editSection}>
            <div className={styles.passGrid}>
              <div>
                <label>Senha Atual</label>
                <input 
                  type="password" 
                  className="input-field" 
                  value={passForm.atual} 
                  onChange={e => setPassForm(p => ({...p, atual: e.target.value}))}
                />
              </div>
              <div>
                <label>Nova Senha</label>
                <input 
                  type="password" 
                  className="input-field" 
                  value={passForm.nova} 
                  onChange={e => setPassForm(p => ({...p, nova: e.target.value}))}
                />
              </div>
              <div>
                <label>Confirmar Nova Senha</label>
                <input 
                  type="password" 
                  className="input-field" 
                  value={passForm.confirma} 
                  onChange={e => setPassForm(p => ({...p, confirma: e.target.value}))}
                />
              </div>
            </div>
            <button className="btn-primary" onClick={salvarSenha} disabled={loading} style={{ marginTop: 15, width: '100%' }}>
              {loading ? 'Atualizando...' : 'Atualizar Senha'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
