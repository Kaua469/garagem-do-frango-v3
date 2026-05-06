const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { emitirNovoPedido } = require('../services/notificationService');

function gerarNumeroPedido() {
  const d = new Date();
  return `GF${String(d.getDate()).padStart(2,'0')}${String(d.getMonth()+1).padStart(2,'0')}${Math.floor(Math.random()*9000)+1000}`;
}

// POST /api/pedidos
router.post('/', async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const { nome_cliente, telefone_cliente, endereco_entrega, itens,
            forma_pagamento, tipo_cartao, troco, observacao, usuario_id } = req.body;

    let subtotal = 0;
    for (const item of itens) subtotal += item.preco_unitario * item.quantidade;

    const { rows: cfgRows } = await client.query(
      "SELECT valor FROM configuracoes WHERE chave = 'taxa_entrega'"
    );
    const taxa_entrega = cfgRows.length ? parseFloat(cfgRows[0].valor) : 5.00;
    const total  = subtotal + taxa_entrega;
    const numero = gerarNumeroPedido();

    const { rows: pedRows } = await client.query(
      `INSERT INTO pedidos
        (numero,usuario_id,nome_cliente,telefone_cliente,endereco_entrega,
         subtotal,taxa_entrega,total,forma_pagamento,tipo_cartao,troco,observacao)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id`,
      [numero, usuario_id||null, nome_cliente, telefone_cliente, endereco_entrega,
       subtotal, taxa_entrega, total, forma_pagamento, tipo_cartao||null, troco||null, observacao||null]
    );
    const pedido_id = pedRows[0].id;

    for (const item of itens) {
      await client.query(
        `INSERT INTO itens_pedido
          (pedido_id,produto_id,variacao_id,nome_produto,nome_variacao,
           quantidade,preco_unitario,preco_total,observacao)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [pedido_id, item.produto_id, item.variacao_id||null,
         item.nome_produto, item.nome_variacao||null,
         item.quantidade, item.preco_unitario,
         item.preco_unitario * item.quantidade, item.observacao||null]
      );

      if (item.variacao_id) {
        await client.query(
          'UPDATE variacoes_produto SET estoque = estoque - $1 WHERE id = $2',
          [item.quantidade, item.variacao_id]
        );
      } else {
        await client.query(
          'UPDATE produtos SET estoque = estoque - $1 WHERE id = $2',
          [item.quantidade, item.produto_id]
        );
      }
    }

    await client.query(
      `INSERT INTO financeiro (tipo,descricao,valor,pedido_id,categoria,data)
       VALUES ($1,$2,$3,$4,$5,CURRENT_DATE)`,
      ['entrada', `Pedido #${numero}`, total, pedido_id, 'pedido']
    );

    await client.query('COMMIT');

    await emitirNovoPedido({ id: pedido_id, numero, nome_cliente, total });
    res.status(201).json({ pedido_id, numero, total });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  } finally {
    client.release();
  }
});

// GET /api/pedidos (admin)
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = '';
    if (status) { params.push(status); where = `WHERE status = $${params.length}`; }
    params.push(parseInt(limit), parseInt(offset));
    const { rows } = await db.query(
      `SELECT * FROM pedidos ${where} ORDER BY criado_em DESC LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

// GET /api/pedidos/meus (cliente)
router.get('/meus', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM pedidos WHERE usuario_id = $1 ORDER BY criado_em DESC',
      [req.usuario.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

// GET /api/pedidos/:id (admin)
router.get('/:id', adminMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM pedidos WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Pedido não encontrado' });
    const { rows: itens } = await db.query(
      'SELECT * FROM itens_pedido WHERE pedido_id = $1',
      [req.params.id]
    );
    res.json({ ...rows[0], itens });
  } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

// PATCH /api/pedidos/:id/status (admin)
router.patch('/:id/status', adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validos = ['aguardando','confirmado','preparando','saiu_entrega','entregue','cancelado'];
    if (!validos.includes(status)) return res.status(400).json({ error: 'Status inválido' });

    await db.query('UPDATE pedidos SET status = $1 WHERE id = $2', [status, req.params.id]);

    const { rows } = await db.query('SELECT * FROM pedidos WHERE id = $1', [req.params.id]);
    const pedido = rows[0] || null;

    const { rows: cfgs } = await db.query(
      "SELECT chave, valor FROM configuracoes WHERE chave IN ('nome_loja','whatsapp')"
    );
    const cfg = {};
    cfgs.forEach(r => { cfg[r.chave] = r.valor; });

    res.json({ message: 'Status atualizado', pedido, config: cfg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro' });
  }
});

module.exports = router;
