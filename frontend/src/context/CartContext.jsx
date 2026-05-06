import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [itens, setItens] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gf_carrinho')) || []; } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('gf_carrinho', JSON.stringify(itens));
  }, [itens]);

  const adicionarItem = (produto, variacao = null, quantidade = 1, observacao = '') => {
    setItens(prev => {
      const key = `${produto.id}-${variacao?.id || 'sem'}`;
      const existente = prev.find(i => i.key === key);
      if (existente) {
        return prev.map(i => i.key === key ? { ...i, quantidade: i.quantidade + quantidade } : i);
      }
      const preco = variacao ? variacao.preco : produto.preco;
      return [...prev, {
        key,
        produto_id: produto.id,
        variacao_id: variacao?.id || null,
        nome_produto: produto.nome,
        nome_variacao: variacao?.nome || null,
        imagem: produto.imagem,
        preco_unitario: preco,
        quantidade,
        observacao
      }];
    });
  };

  const removerItem = (key) => setItens(prev => prev.filter(i => i.key !== key));

  const alterarQuantidade = (key, quantidade) => {
    if (quantidade <= 0) { removerItem(key); return; }
    setItens(prev => prev.map(i => i.key === key ? { ...i, quantidade } : i));
  };

  const limparCarrinho = () => setItens([]);

  const subtotal = itens.reduce((acc, i) => acc + i.preco_unitario * i.quantidade, 0);
  const totalItens = itens.reduce((acc, i) => acc + i.quantidade, 0);

  return (
    <CartContext.Provider value={{ itens, adicionarItem, removerItem, alterarQuantidade, limparCarrinho, subtotal, totalItens }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
