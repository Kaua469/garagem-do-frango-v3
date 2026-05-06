const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { adminMiddleware } = require('../middleware/auth');

router.get('/', adminMiddleware, async (req, res) => {
  try {
    const hoje    = new Date().toISOString().slice(0, 10);       // 'YYYY-MM-DD'
    const mesAtual = new Date().toISOString().slice(0, 7);       // 'YYYY-MM'

    // Vendas hoje
    const { rows: [diaRow] } = await db.query(
      `SELECT COALESCE(SUM(total),0) AS valor, COUNT(*) AS qtd
       FROM pedidos
       WHERE criado_em::date = $1 AND status != 'cancelado'`,
      [hoje]
    );

    // Vendas mês
    const { rows: [mesRow] } = await db.query(
      `SELECT COALESCE(SUM(total),0) AS valor
       FROM pedidos
       WHERE TO_CHAR(criado_em,'YYYY-MM') = $1 AND status != 'cancelado'`,
      [mesAtual]
    );

    // Estoque baixo
    const { rows: [estoqueRow] } = await db.query(
      "SELECT COUNT(*) AS qtd FROM produtos WHERE estoque < 3 AND estoque > 0"
    );

    // Pedidos recentes
    const { rows: pedidosRecentes } = await db.query(
      "SELECT * FROM pedidos ORDER BY criado_em DESC LIMIT 10"
    );

    // Entradas/saídas do mês
    const { rows: [entradasRow] } = await db.query(
      `SELECT COALESCE(SUM(valor),0) AS total FROM financeiro
       WHERE tipo = 'entrada' AND TO_CHAR(data,'YYYY-MM') = $1`,
      [mesAtual]
    );
    const { rows: [saidasRow] } = await db.query(
      `SELECT COALESCE(SUM(valor),0) AS total FROM financeiro
       WHERE tipo = 'saida' AND TO_CHAR(data,'YYYY-MM') = $1`,
      [mesAtual]
    );

    // Vendas por dia (últimos 30 dias)
    const { rows: vendasDia } = await db.query(
      `SELECT criado_em::date AS data, SUM(total) AS total
       FROM pedidos
       WHERE criado_em >= NOW() - INTERVAL '30 days' AND status != 'cancelado'
       GROUP BY criado_em::date
       ORDER BY criado_em::date ASC`
    );

    // Mais vendidos
    const { rows: maisVendidos } = await db.query(
      `SELECT ip.nome_produto, SUM(ip.quantidade) AS total_vendido
       FROM itens_pedido ip
       JOIN pedidos p ON p.id = ip.pedido_id
       WHERE p.status != 'cancelado'
       GROUP BY ip.nome_produto
       ORDER BY total_vendido DESC
       LIMIT 5`
    );

    // Pagamentos por forma no mês
    const { rows: pagamentosMes } = await db.query(
      `SELECT forma_pagamento, COALESCE(SUM(total),0) AS total, COUNT(*) AS qtd
       FROM pedidos
       WHERE TO_CHAR(criado_em,'YYYY-MM') = $1 AND status != 'cancelado'
       GROUP BY forma_pagamento`,
      [mesAtual]
    );

    // Top clientes
    const { rows: topClientes } = await db.query(
      `SELECT nome_cliente, telefone_cliente,
              COUNT(*) AS total_pedidos,
              COALESCE(SUM(total),0) AS total_gasto
       FROM pedidos
       WHERE status != 'cancelado'
       GROUP BY nome_cliente, telefone_cliente
       ORDER BY total_gasto DESC
       LIMIT 10`
    );

    res.json({
      totalHoje:      diaRow.valor,
      pedidosHoje:    diaRow.qtd,
      totalMes:       mesRow.valor,
      estoqueBaixo:   estoqueRow.qtd,
      entradas:       entradasRow.total,
      saidas:         saidasRow.total,
      lucro:          Number(entradasRow.total) - Number(saidasRow.total),
      pedidosRecentes,
      vendasDia,
      maisVendidos,
      pagamentosMes,
      topClientes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no dashboard' });
  }
});

module.exports = router;
