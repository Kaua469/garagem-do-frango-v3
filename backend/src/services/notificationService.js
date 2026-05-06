const { getIO } = require('../socket');
const db = require('../config/db');

async function emitirNovoPedido(pedido) {
  try {
    const io = getIO();
    const dados = {
      pedido_id: pedido.id,
      numero: pedido.numero,
      nome_cliente: pedido.nome_cliente,
      total: pedido.total,
      horario: new Date().toLocaleTimeString('pt-BR')
    };

    // Salvar notificação no banco
    await db.query(
      `INSERT INTO notificacoes (tipo, titulo, mensagem, dados) VALUES ($1, $2, $3, $4)`,
      [
        'novo_pedido',
        'Novo pedido recebido!',
        `Pedido #${pedido.numero} de ${pedido.nome_cliente} - R$ ${Number(pedido.total).toFixed(2)}`,
        JSON.stringify(dados)
      ]
    );

    io.to('admin').emit('novo-pedido', dados);
    console.log(`📦 Emitido: novo-pedido #${pedido.numero}`);
  } catch (err) {
    console.error('Erro ao emitir novo-pedido:', err.message);
  }
}

async function emitirEstoqueBaixo(produto, variacao = null) {
  try {
    const io = getIO();
    const dados = {
      produto_id: produto.id,
      produto_nome: produto.nome,
      variacao_nome: variacao ? variacao.nome : null,
      estoque: variacao ? variacao.estoque : produto.estoque
    };

    await db.query(
      `INSERT INTO notificacoes (tipo, titulo, mensagem, dados) VALUES ($1, $2, $3, $4)`,
      [
        'estoque_baixo',
        'Estoque baixo!',
        `${produto.nome}${variacao ? ' - ' + variacao.nome : ''}: apenas ${dados.estoque} unidade(s) restante(s)`,
        JSON.stringify(dados)
      ]
    );

    io.to('admin').emit('estoque-baixo', dados);
    console.log(`⚠️ Emitido: estoque-baixo - ${produto.nome}`);
  } catch (err) {
    console.error('Erro ao emitir estoque-baixo:', err.message);
  }
}

async function emitirProdutoIndisponivel(produto) {
  try {
    const io = getIO();
    const dados = {
      produto_id: produto.id,
      produto_nome: produto.nome
    };

    await db.query(
      `INSERT INTO notificacoes (tipo, titulo, mensagem, dados) VALUES ($1, $2, $3, $4)`,
      [
        'produto_indisponivel',
        'Produto indisponível!',
        `${produto.nome} está sem estoque e foi desativado no cardápio.`,
        JSON.stringify(dados)
      ]
    );

    io.to('admin').emit('produto-indisponivel', dados);
    console.log(`🚫 Emitido: produto-indisponivel - ${produto.nome}`);
  } catch (err) {
    console.error('Erro ao emitir produto-indisponivel:', err.message);
  }
}

module.exports = { emitirNovoPedido, emitirEstoqueBaixo, emitirProdutoIndisponivel };
