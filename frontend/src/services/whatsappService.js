import axios from 'axios';

const nomeLoja = 'Garagem do Frango';

const STATUS_CONFIG = {
  aguardando:   { emoji: '⏳', texto: 'Aguardando confirmação' },
  confirmado:   { emoji: '✅', texto: 'Confirmado! Estamos separando seu pedido' },
  preparando:   { emoji: '👨‍🍳', texto: 'Na cozinha! Seu pedido está sendo preparado' },
  saiu_entrega: { emoji: '🛵', texto: 'Saiu para entrega! Já chega aí' },
  entregue:     { emoji: '🎉', texto: 'Entregue! Bom apetite!' },
  cancelado:    { emoji: '❌', texto: 'Pedido cancelado' },
};

function montarMensagem(pedido, nomeLoja = 'Garagem do Frango') {
  const cfg   = STATUS_CONFIG[pedido.status] || { emoji: '📦', texto: pedido.status };
  const total = `R$ ${Number(pedido.total).toFixed(2).replace('.', ',')}`;

  const linhas = [
    `${cfg.emoji} *${nomeLoja}*`,
    '',
    `Olá, *${pedido.nome_cliente}*! 👋`,
    '',
    `Atualização do seu pedido *#${pedido.numero}*:`,
    '',
    `📌 *Status:* ${cfg.emoji} ${cfg.texto}`,
    `💰 *Total:* ${total}`,
  ];

  if (pedido.status === 'saiu_entrega') {
    linhas.push(`📍 *Endereço:* ${pedido.endereco_entrega}`);
  }

  if (pedido.status === 'entregue') {
    linhas.push('', `⭐ Adoramos te atender! Obrigado pela confiança.`);
  }

  if (pedido.status === 'cancelado') {
    linhas.push('', `Em caso de dúvidas, fale conosco. 😊`);
  }

  if (pedido.status === 'confirmado' || pedido.status === 'preparando') {
    linhas.push('⏲️ Em breve atualizamos novamente!');
  }

  linhas.push('', `🍗 Garagem do Frango — Feito com amor!`);

  return linhas.join('\r\n'); 
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

  const mensagem = montarMensagem(pedido, nomeLoja).normalize('NFC');

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
