import axios from 'axios';

const nomeLoja = 'Garagem do Frango';

const STATUS_CONFIG = {
  aguardando:   { texto: '⏳ Aguardando confirmação' },
  confirmado:   { texto: '✅ Confirmado! Estamos separando seu pedido' },
  preparando:   { texto: '👨‍🍳 Na cozinha! Seu pedido está sendo preparado' },
  saiu_entrega: { texto: '🛵 Saiu para entrega! O motoboy já está a caminho' },
  entregue:     { texto: '🎉 Entregue! Bom apetite!' },
  cancelado:    { texto: '❌ Pedido cancelado' },
};

function montarMensagem(pedido, nomeLoja = 'Garagem do Frango') {
  const cfg   = STATUS_CONFIG[pedido.status] || { texto: pedido.status };
  const total = `R$ ${Number(pedido.total).toFixed(2).replace('.', ',')}`;
  const subtotal = `R$ ${Number(pedido.subtotal).toFixed(2).replace('.', ',')}`;
  const taxa = `R$ ${Number(pedido.taxa_entrega).toFixed(2).replace('.', ',')}`;

  const itensTexto = (pedido.itens || []).map(i => {
    const varText = i.nome_variacao ? ` (${i.nome_variacao})` : '';
    return `- ${i.quantidade}x ${i.nome_produto}${varText}: R$ ${Number(i.preco_total).toFixed(2).replace('.', ',')}`;
  }).join('\n');

  const linhas = [
    `*${nomeLoja}* 🍗`,
    '',
    `Olá, *${pedido.nome_cliente}*!`,
    `Atualização do seu pedido *#${pedido.numero}*:`,
    '',
    `📍 *Status: ${cfg.texto}*`,
    '----------------------------------',
    '',
    `📦 *Itens do pedido:*`,
    itensTexto,
    '',
    `💵 *Resumo:*`,
    `Subtotal: ${subtotal}`,
    `Taxa de entrega: ${taxa}`,
    `*Total: ${total}*`,
    '',
    `💳 *Pagamento:* ${pedido.forma_pagamento}${pedido.tipo_cartao ? ` (${pedido.tipo_cartao})` : ''}`,
    `📍 *Entrega:* ${pedido.endereco_entrega}`,
    '',
    '----------------------------------',
    '_Garagem do Frango -- Feito com amor!_'
  ];

  return linhas.join('\n');
}

export function gerarLinkWhatsApp(pedido, nomeLoja = 'Garagem do Frango') {
  let fone = String(pedido.telefone_cliente || '').replace(/\D/g, '');
  if (!fone) return null;
  if (!fone.startsWith('55')) fone = '55' + fone;

  const mensagem = montarMensagem(pedido, nomeLoja);
  const encoded  = encodeURIComponent(mensagem);

  return `https://wa.me/${fone}?text=${encoded}`;
}

export function abrirWhatsApp(pedido, nomeLoja = 'Garagem do Frango') {
  const link = gerarLinkWhatsApp(pedido, nomeLoja);
  if (!link) {
    alert('Telefone do cliente não encontrado.');
    return;
  }
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = link;
  } else {
    window.open(link, '_blank', 'noopener,noreferrer');
  }
}

export async function enviarWhatsAppAutomatico(pedido, nomeLoja = 'Garagem do Frango') {
  const instance = import.meta.env.VITE_ZAPI_INSTANCE;
  const token    = import.meta.env.VITE_ZAPI_TOKEN;

  if (!instance || !token) return false;

  let fone = String(pedido.telefone_cliente || '').replace(/\D/g, '');
  if (!fone) return false;
  if (!fone.startsWith('55')) fone = '55' + fone;

  const mensagem = montarMensagem(pedido, nomeLoja);

  try {
    const { data } = await axios.post(
      `https://api.z-api.io/instances/${instance}/token/${token}/send-text`,
      { phone: fone, message: mensagem },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return !!data;
  } catch (err) {
    console.error('Erro Z-API:', err);
    return false;
  }
}
