import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import styles from './PrimeiroAcesso.module.css';

export default function PrimeiroAcesso({ adminRoute }) {
  const navigate = useNavigate();
  const { atualizarUsuario } = useAuth();
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setErro('');
    if (data.nova_senha !== data.confirmar_senha) { setErro('Senhas não conferem'); return; }
    setLoading(true);
    try {
      await api.post('/auth/primeiro-acesso', {
        novo_telefone: data.novo_telefone,
        nova_senha: data.nova_senha,
        confirmar_senha: data.confirmar_senha,
      });
      atualizarUsuario({ telefone: data.novo_telefone, precisa_alterar_acesso: false });
      navigate(adminRoute);
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao atualizar acesso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <motion.div className={styles.card} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <div className={styles.icon}>🔐</div>
        <h1 className={styles.title}>Primeiro Acesso</h1>
        <p className={styles.sub}>Por segurança, defina um novo telefone e senha antes de continuar.</p>

        {erro && <div className={styles.errorBox}>{erro}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.field}>
            <label>Novo Telefone de Login</label>
            <input className="input-field" placeholder="Somente números, ex: 16999887766" {...register('novo_telefone', { required: 'Obrigatório' })} />
            {errors.novo_telefone && <span className={styles.err}>{errors.novo_telefone.message}</span>}
          </div>
          <div className={styles.field}>
            <label>Nova Senha</label>
            <input className="input-field" type="password" placeholder="Mínimo 8 caracteres" {...register('nova_senha', { required: 'Obrigatório', minLength: { value: 8, message: 'Mínimo 8 caracteres' } })} />
            {errors.nova_senha && <span className={styles.err}>{errors.nova_senha.message}</span>}
          </div>
          <div className={styles.field}>
            <label>Confirmar Nova Senha</label>
            <input className="input-field" type="password" placeholder="Repita a senha" {...register('confirmar_senha', { required: 'Obrigatório' })} />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
            {loading ? 'Salvando...' : '✅ Salvar e Continuar'}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
