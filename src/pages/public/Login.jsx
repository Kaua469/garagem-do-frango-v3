// ===== Login.jsx =====
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import Header from '../../components/public/Header';
import Footer from '../../components/public/Footer';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { getImageUrl } from '../../services/imageUrl';
import styles from './AuthPages.module.css';

export function Login() {
  const { login, loading } = useAuth();
  const { config, bustImageUrl } = useConfig();
  const navigate = useNavigate();
  const [erro, setErro] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setErro('');
    try {
      const res = await login(data.telefone, data.senha);
      if (res.usuario.tipo === 'dona') {
        if (res.usuario.precisa_alterar_acesso) {
          navigate('/garagem-frango-a9x7-controle/primeiro-acesso');
        } else {
          navigate('/garagem-frango-a9x7-controle');
        }
      } else {
        navigate('/minha-conta');
      }
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao fazer login');
    }
  };

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <motion.div className={styles.card} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <img
            src={config.logo_url ? bustImageUrl(getImageUrl(config.logo_url)) : '/logo.png'}
            alt={config.nome_loja || 'Garagem do Frango'}
            className={styles.logoLogin}
            onError={e => { e.target.src = '/logo.png'; }}
          />
            <h1 className={styles.title}>Entrar</h1>
            <p className={styles.sub}>Bem-vindo(a) de volta!</p>

            {erro && <div className={styles.errorBox}>{erro}</div>}

            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              <div className={styles.field}>
                <label>Telefone</label>
                <input className="input-field" placeholder="16999999999" {...register('telefone', { required: 'Obrigatório' })} />
                {errors.telefone && <span className={styles.err}>{errors.telefone.message}</span>}
              </div>
              <div className={styles.field}>
                <label>Senha</label>
                <input className="input-field" type="password" placeholder="Sua senha" {...register('senha', { required: 'Obrigatório' })} />
                {errors.senha && <span className={styles.err}>{errors.senha.message}</span>}
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
            <p className={styles.link}>Não tem conta? <Link to="/cadastro">Cadastre-se</Link></p>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
export default Login;
