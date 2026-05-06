import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/public/Header';
import Footer from '../../components/public/Footer';
import ProductCard from '../../components/public/ProductCard';
import api from '../../services/api';
import styles from './Cardapio.module.css';

const CATEGORIAS = [
  { id: 'todos',      label: 'Todos',      icon: '🍽️', cls: styles.catTodos   },
  { id: 'frangos',    label: 'Frangos',    icon: '🍗', cls: styles.catFrangos },
  { id: 'marmitas',   label: 'Marmitas',   icon: '🥡', cls: styles.catMarmitas},
  { id: 'porcoes',    label: 'Porções',    icon: '🍟', cls: styles.catPorcoes },
  { id: 'bebidas',    label: 'Bebidas',    icon: '🥤', cls: styles.catBebidas },
  { id: 'sobremesas', label: 'Sobremesas', icon: '🍮', cls: styles.catSobre   },
  { id: 'combos',     label: 'Combos',     icon: '🎁', cls: styles.catCombos  },
];

export default function Cardapio() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [categoria, setCategoria] = useState('todos');
  const [busca, setBusca]         = useState('');

  useEffect(() => {
    api.get('/produtos', { params: { status: 'ativo' } })
      .then(r => setProdutos(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtrados = produtos.filter(p => {
    const matchCat   = categoria === 'todos' || p.categoria === categoria;
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
    return matchCat && matchBusca;
  });

  return (
    <>
      <Header />
      <main className={styles.main}>

        {/* Banner */}
        <section className={styles.banner}>
          <div className="container">
            <motion.h1
              className={styles.bannerTitle}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              🍗 Nosso Cardápio
            </motion.h1>
            <p className={styles.bannerSub}>Tudo feito com amor e ingredientes frescos</p>
          </div>
        </section>

        {/* Barra de busca + categorias (sticky) */}
        <div className={styles.stickyBar}>
          <div className="container">
            <input
              type="text"
              className={styles.searchInput}
              placeholder="🔍 Buscar produto..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
          <div className={styles.catScroll}>
            {CATEGORIAS.map(c => (
              <button
                key={c.id}
                className={`${styles.catChip} ${c.cls} ${categoria === c.id ? styles.catAtivo : ''}`}
                onClick={() => setCategoria(c.id)}
              >
                <span className={styles.catIcon}>{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Produtos */}
        <div className="container">
          {loading ? (
            <div className="spinner" style={{ margin: '60px auto' }} />
          ) : filtrados.length === 0 ? (
            <div className={styles.empty}>
              <p>😕 Nenhum produto encontrado para "<strong>{busca || categoria}</strong>"</p>
            </div>
          ) : (
            <motion.div
              className={styles.grid}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {filtrados.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <ProductCard produto={p} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

      </main>
      <Footer />
    </>
  );
}
