import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import Header from '../../components/public/Header';
import Footer from '../../components/public/Footer';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import styles from './AuthPages.module.css';

export default function Cadastro() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [erro, setErro] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setErro('');
    if (data.senha !== data.confirmar) { setErro('Senhas não conferem'); return; }
    try {
      await api.post('/auth/cadastro', { nome: data.nome, telefone: data.telefone, senha: data.senha });
      await login(data.telefone, data.senha);
      navigate('/minha-conta');
    } catch (err) {
      setErro(err.response?.data?.error || 'Erro ao cadastrar');
    }
  };

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <motion.div className={styles.card} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <div className={styles.icon}>✨</div>
            <h1 className={styles.title}>Criar Conta</h1>
            <p className={styles.sub}>Faça seu cadastro e peça com facilidade!</p>

            {erro && <div className={styles.errorBox}>{erro}</div>}

            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              <div className={styles.field}>
                <label>Nome completo</label>
                <input className="input-field" placeholder="Seu nome" {...register('nome', { required: 'Obrigatório' })} />
                {errors.nome && <span className={styles.err}>{errors.nome.message}</span>}
              </div>
              <div className={styles.field}>
                <label>Telefone</label>
                <input className="input-field" placeholder="16999999999" {...register('telefone', { required: 'Obrigatório' })} />
                {errors.telefone && <span className={styles.err}>{errors.telefone.message}</span>}
              </div>
              <div className={styles.field}>
                <label>Senha</label>
                <input className="input-field" type="password" placeholder="Mínimo 8 caracteres" {...register('senha', { required: 'Obrigatório', minLength: { value: 8, message: 'Mínimo 8 caracteres' } })} />
                {errors.senha && <span className={styles.err}>{errors.senha.message}</span>}
              </div>
              <div className={styles.field}>
                <label>Confirmar senha</label>
                <input className="input-field" type="password" placeholder="Repita a senha" {...register('confirmar', { required: 'Obrigatório' })} />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                Cadastrar
              </button>
            </form>
            <p className={styles.link}>Já tem conta? <Link to="/login">Entrar</Link></p>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
