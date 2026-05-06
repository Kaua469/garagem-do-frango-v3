const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { adminMiddleware } = require('../middleware/auth');

// Helper: busca variações de um produto
async function getVariacoes(produtoId) {
  const { rows } = await db.query(
    'SELECT * FROM variacoes_produto WHERE produto_id = $1 AND ativo = TRUE',
    [produtoId]
  );
  return rows;
}

// GET /api/produtos
router.get('/', async (req, res) => {
  try {
    const { categoria, status } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (categoria) { params.push(categoria); where += ` AND categoria = $${params.length}`; }
    if (status)    { params.push(status);    where += ` AND status = $${params.length}`; }

    const { rows: produtos } = await db.query(
      `SELECT * FROM produtos ${where} ORDER BY criado_em DESC`,
      params
    );

    for (const p of produtos) {
      p.variacoes = p.tem_variacao ? await getVariacoes(p.id) : [];
    }
    res.json(produtos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// GET /api/produtos/mais-vendidos
router.get('/mais-vendidos', async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM produtos WHERE mais_vendido = TRUE AND status = 'ativo' LIMIT 6"
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

// GET /api/produtos/combos
router.get('/combos', async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM produtos WHERE combo_semana = TRUE AND status = 'ativo' LIMIT 4"
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

// GET /api/produtos/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM produtos WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Produto não encontrado' });
    const produto = rows[0];
    produto.variacoes = await getVariacoes(produto.id);
    res.json(produto);
  } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

// POST /api/produtos (admin)
router.post('/', adminMiddleware, async (req, res) => {
  try {
    const {
      nome, descricao, categoria, preco, estoque, status, imagem,
      mais_vendido, novidade, combo_semana, tem_variacao, tem_quantidade,
      qtd_min, qtd_max, variacoes
    } = req.body;

    // Validação básica para evitar dados corrompidos no banco
    if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome do produto é obrigatório' });
    const CATS = ['frangos','marmitas','porcoes','bebidas','sobremesas','combos'];
    if (!CATS.includes(categoria)) return res.status(400).json({ error: 'Categoria inválida' });
    if (isNaN(parseFloat(preco)) || parseFloat(preco) < 0) return res.status(400).json({ error: 'Preço inválido' });
    if (isNaN(parseInt(estoque)) || parseInt(estoque) < 0) return res.status(400).json({ error: 'Estoque inválido' });

    const { rows } = await db.query(
      `INSERT INTO produtos
        (nome,descricao,categoria,preco,estoque,status,imagem,
         mais_vendido,novidade,combo_semana,tem_variacao,tem_quantidade,qtd_min,qtd_max)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id`,
      [
        nome, descricao, categoria, preco || 0, estoque || 0,
        status || 'ativo', imagem || null,
        !!mais_vendido, !!novidade, !!combo_semana,
        !!tem_variacao, !!tem_quantidade,
        qtd_min || 1, qtd_max || 20
      ]
    );
    const produtoId = rows[0].id;

    if (tem_variacao && variacoes?.length) {
      for (const v of variacoes) {
        await db.query(
          'INSERT INTO variacoes_produto (produto_id, nome, preco, estoque) VALUES ($1,$2,$3,$4)',
          [produtoId, v.nome, v.preco, v.estoque || 0]
        );
      }
    }
    res.status(201).json({ id: produtoId, message: 'Produto criado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// PUT /api/produtos/:id (admin)
router.put('/:id', adminMiddleware, async (req, res) => {
  try {
    const {
      nome, descricao, categoria, preco, estoque, status, imagem,
      mais_vendido, novidade, combo_semana, tem_variacao, tem_quantidade,
      qtd_min, qtd_max
    } = req.body;

    // Validação
    if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome do produto é obrigatório' });
    const ID = parseInt(req.params.id);
    if (isNaN(ID)) return res.status(400).json({ error: 'ID inválido' });

    await db.query(
      `UPDATE produtos SET
        nome=$1,descricao=$2,categoria=$3,preco=$4,estoque=$5,status=$6,imagem=$7,
        mais_vendido=$8,novidade=$9,combo_semana=$10,tem_variacao=$11,
        tem_quantidade=$12,qtd_min=$13,qtd_max=$14
       WHERE id=$15`,
      [
        nome, descricao, categoria, preco, estoque, status, imagem,
        !!mais_vendido, !!novidade, !!combo_semana,
        !!tem_variacao, !!tem_quantidade,
        qtd_min || 1, qtd_max || 20,
        req.params.id
      ]
    );

    // Notificações de estoque
    const { emitirEstoqueBaixo, emitirProdutoIndisponivel } = require('../services/notificationService');
    if (Number(estoque) === 0) await emitirProdutoIndisponivel({ id: req.params.id, nome });
    else if (Number(estoque) < 3) await emitirEstoqueBaixo({ id: req.params.id, nome, estoque });

    res.json({ message: 'Produto atualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// DELETE /api/produtos/:id (admin)
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const ID = parseInt(req.params.id);
    if (isNaN(ID)) return res.status(400).json({ error: 'ID inválido' });
    // Verifica se tem pedidos antes de deletar (proteção FK)
    const { rows: pedCheck } = await db.query(
      'SELECT COUNT(*) as n FROM itens_pedido WHERE produto_id = $1', [ID]
    );
    if (parseInt(pedCheck[0].n) > 0) {
      // Não deleta — apenas inativa para preservar histórico
      await db.query("UPDATE produtos SET status = 'inativo' WHERE id = $1", [ID]);
      return res.json({ message: 'Produto inativado (tem pedidos vinculados — não pode excluir)' });
    }
    await db.query('DELETE FROM produtos WHERE id = $1', [ID]);
    res.json({ message: 'Produto removido' });
  } catch (err) { res.status(500).json({ error: 'Erro ao remover produto' }); }
});

// POST /api/produtos/:id/variacoes (admin)
router.post('/:id/variacoes', adminMiddleware, async (req, res) => {
  try {
    const { nome, preco, estoque } = req.body;
    const { rows } = await db.query(
      'INSERT INTO variacoes_produto (produto_id, nome, preco, estoque) VALUES ($1,$2,$3,$4) RETURNING id',
      [req.params.id, nome, preco, estoque || 0]
    );
    res.status(201).json({ id: rows[0].id });
  } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

// PUT /api/produtos/:id/variacoes/:vid (admin)
router.put('/:id/variacoes/:vid', adminMiddleware, async (req, res) => {
  try {
    const { nome, preco, estoque } = req.body;
    await db.query(
      'UPDATE variacoes_produto SET nome=$1, preco=$2, estoque=$3 WHERE id=$4',
      [nome, preco, estoque, req.params.vid]
    );
    res.json({ message: 'Variação atualizada' });
  } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

// DELETE /api/produtos/:id/variacoes/:vid (admin)
router.delete('/:id/variacoes/:vid', adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM variacoes_produto WHERE id=$1', [req.params.vid]);
    res.json({ message: 'Variação removida' });
  } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

module.exports = router;
