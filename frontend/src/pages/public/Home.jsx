import { useEffect, useState } from 'react';
import { getImageUrl } from '../../services/imageUrl';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../../components/public/Header';
import Footer from '../../components/public/Footer';
import ProductCard from '../../components/public/ProductCard';
import { useConfig } from '../../context/ConfigContext';
import api from '../../services/api';
import styles from './Home.module.css';

export default function Home() {
  const { config, bustImageUrl } = useConfig();
  const [maisVendidos, setMaisVendidos] = useState([]);
  const [novidades, setNovidades] = useState([]);
  const [combos, setCombos] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/produtos/mais-vendidos').catch(() => ({ data: [] })),
      api.get('/novidades').catch(() => ({ data: [] })),
      api.get('/produtos/combos').catch(() => ({ data: [] })),
      api.get('/avaliacoes').catch(() => ({ data: [] })),
    ]).then(([mv, nov, cb, av]) => {
      setMaisVendidos(mv.data);
      setNovidades(nov.data);
      setCombos(cb.data);
      setAvaliacoes(av.data);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header />
      <main>
        {/* HERO */}
        <section
          className={styles.hero}
          style={config.hero_imagem ? {
            backgroundImage: `url(${bustImageUrl(getImageUrl(config.hero_imagem)) || ''})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : {}}
        >
          <div className={styles.heroOverlay} />
          <div className={`container ${styles.heroContent}`}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className={styles.heroText}
            >
              <span className={styles.heroBadge}>🔥 Delivery Artesanal</span>
              <h1 className={styles.heroTitle}>{config.hero_titulo}</h1>
              <p className={styles.heroSubtitle}>{config.hero_subtitulo}</p>
              <div className={styles.heroBtns}>
                <Link to="/cardapio" className="btn-primary">🍗 Fazer Pedido</Link>
                <a
                  href={`https://wa.me/${config.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  💬 WhatsApp
                </a>
              </div>
            </motion.div>
          </div>
          <div className={styles.heroWave}>
            <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#f4e6d3" />
            </svg>
          </div>
        </section>

        {/* MAIS VENDIDOS */}
        {maisVendidos.length > 0 && (
          <section className={styles.section}>
            <div className="container">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <p className={styles.sectionTag}>⭐ Favoritos do Público</p>
                <h2 className="section-title">Mais Vendidos</h2>
                <p className="section-subtitle">O que nossos clientes mais amam pedir</p>
              </motion.div>
              <div className={styles.grid}>
                {maisVendidos.map(p => <ProductCard key={p.id} produto={p} />)}
              </div>
              <div style={{ textAlign: 'center', marginTop: 40 }}>
                <Link to="/cardapio" className="btn-outline">Ver Cardápio Completo →</Link>
              </div>
            </div>
          </section>
        )}

        {/* NOVIDADES */}
        {novidades.length > 0 && (
          <section className={`${styles.section} ${styles.sectionDark}`}>
            <div className="container">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <p className={styles.sectionTag} style={{ color: 'var(--primary)' }}>🆕 Fresquinhos</p>
                <h2 className="section-title" style={{ color: 'white' }}>Novidades</h2>
                <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.7)' }}>Veja o que há de novo por aqui</p>
              </motion.div>
              <div className={styles.novidadesGrid}>
                {novidades.map((n, i) => (
                  <motion.div
                    key={n.id}
                    className={styles.novidadeCard}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    {n.imagem && (
                      <img
                        src={bustImageUrl(getImageUrl(n.imagem))}
                        alt={n.titulo}
                        className={styles.novidadeImg}
                      />
                    )}
                    <div className={styles.novidadeBody}>
                      <h3 className={styles.novidadeTitulo}>{n.titulo}</h3>
                      <p className={styles.novidadeDesc}>{n.descricao}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* COMBOS DA SEMANA */}
        {combos.length > 0 && (
          <section className={styles.section}>
            <div className="container">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <p className={styles.sectionTag}>🎯 Ofertas Exclusivas</p>
                <h2 className="section-title">Combos da Semana</h2>
                <p className="section-subtitle">Aproveite nossas melhores ofertas</p>
              </motion.div>
              <div className={styles.grid}>
                {combos.map(p => <ProductCard key={p.id} produto={p} />)}
              </div>
            </div>
          </section>
        )}

        {/* AVALIAÇÕES */}
        {avaliacoes.length > 0 && (
          <section className={`${styles.section} ${styles.sectionLight}`}>
            <div className="container">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <p className={styles.sectionTag}>💬 Depoimentos</p>
                <h2 className="section-title">O que dizem nossos clientes</h2>
              </motion.div>
              <div className={styles.avaliacoesGrid}>
                {avaliacoes.map((a, i) => (
                  <motion.div
                    key={a.id}
                    className={styles.avaliacaoCard}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <div className={styles.estrelas}>{'⭐'.repeat(a.nota)}</div>
                    <p className={styles.avaliacaoText}>"{a.comentario}"</p>
                    <p className={styles.avaliacaoAutor}>— {a.nome}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* HORÁRIO / CTA */}
        <section className={styles.ctaSection}>
          <div className="container">
            <motion.div
              className={styles.ctaBox}
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <h2 className={styles.ctaTitle}>Pronto para pedir? 🍗</h2>
              <p className={styles.ctaSub}>
                <strong>Horário de funcionamento:</strong> {config.horario}
              </p>
              <p className={styles.ctaEndereco}>📍 {config.endereco}</p>
              <Link to="/cardapio" className="btn-primary" style={{ fontSize: '1.1rem', padding: '16px 40px' }}>
                Fazer Pedido Agora
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
