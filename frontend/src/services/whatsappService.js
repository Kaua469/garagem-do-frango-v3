/**
 * ═══════════════════════════════════════════════════════════════
 * SERVIÇO DE NOTIFICAÇÃO WHATSAPP — GARAGEM DO FRANGO
 *
 * Modo 1 (Padrão/Gratuito):
 *   Gera link wa.me com mensagem pré-preenchida COM emojis.
 *   A dona clica → WhatsApp abre pronto para enviar.
 *
 * Modo 2 (Automático — Z-API):
 *   Configure VITE_ZAPI_INSTANCE e VITE_ZAPI_TOKEN no .env
 *   para envio automático sem precisar clicar.
 * ═══════════════════════════════════════════════════════════════
 */

// Status com emojis completos — visíveis no WhatsApp
const STATUS_CONFIG = {
  aguardando:   { emoji: '\u23F3', texto: 'Aguardando confirmação' },
  confirmado:   { emoji: '\u2705', texto: 'Confirmado! Estamos separando seu pedido' },
  preparando:   { emoji: '\uD83D\uDC68\u200D\uD83C\uDF73', texto: 'Na cozinha! Seu pedido está sendo preparado' },
  saiu_entrega: { emoji: '\uD83D\uDEF5', texto: 'Saiu para entrega! Já chega aí' },
  entregue:     { emoji: '\uD83C\uDF89', texto: 'Entregue! Bom apetite!' },
  cancelado:    { emoji: '\u274C', texto: 'Pedido cancelado' },
};

/**
 * Monta a mensagem com emojis preservados.
 * Os emojis são caracteres Unicode normais — funcionam em wa.me.
 */
function montarMensagem(pedido, nomeLoja = 'Garagem do Frango') {
  const cfg   = STATUS_CONFIG[pedido.status] || { emoji: '\uD83D\uDCE6', texto: pedido.status };
  const total = `R$ ${Number(pedido.total).toFixed(2).replace('.', ',')}`;

  // Usa \n real — encodeURIComponent converte para %0A que WhatsApp interpreta
  const linhas = [
    `${cfg.emoji} *${nomeLoja}*`,
    ``,
    `Olá, *${pedido.nome_cliente}*! \uD83D\uDC4B`,
    ``,
    `Atualização do seu pedido *#${pedido.numero}*:`,
    ``,
    `\uD83D\uDCCC *Status:* ${cfg.emoji} ${cfg.texto}`,
    `\uD83D\uDCB0 *Total:* ${total}`,
  ];

  if (pedido.status === 'saiu_entrega') {
    linhas.push(`\uD83D\uDCCD *Endereço:* ${pedido.endereco_entrega}`);
  }

  if (pedido.status === 'entregue') {
    linhas.push(``, `\u2B50 Adoramos te atender! Obrigado pela confiança.`);
  }

  if (pedido.status === 'cancelado') {
    linhas.push(``, `Em caso de dúvidas, fale conosco. \uD83D\uDE0A`);
  }

  if (pedido.status === 'confirmado' || pedido.status === 'preparando') {
    linhas.push(`\u23F1\uFE0F Em breve atualizamos novamente!`);
  }

  linhas.push(``, `\uD83C\uDF57 Garagem do Frango — Feito com amor!`);

  return linhas.join('\n');
}

/**
 * Gera o link wa.me com a mensagem completa e emojis.
 *
 * encodeURIComponent preserva emojis como UTF-8 percent-encoded
 * que o wa.me decodifica corretamente, mostrando os emojis no WhatsApp.
 */
export function gerarLinkWhatsApp(pedido, nomeLoja = 'Garagem do Frango') {
  let fone = String(pedido.telefone_cliente || '').replace(/\D/g, '');
  if (!fone) return null;
  if (!fone.startsWith('55')) fone = '55' + fone;

  const mensagem = montarMensagem(pedido, nomeLoja);
  // encodeURIComponent('🍗') = '%F0%9F%8D%97' → wa.me decodifica e mostra 🍗
  const encoded  = encodeURIComponent(mensagem);

  return `https://wa.me/${fone}?text=${encoded}`;
}

/**
 * Abre WhatsApp com a mensagem pré-preenchida.
 * No celular abre o app; no desktop abre WhatsApp Web.
 */
export function abrirWhatsApp(pedido, nomeLoja = 'Garagem do Frango') {
  const link = gerarLinkWhatsApp(pedido, nomeLoja);
  if (!link) {
    alert('Telefone do cliente não encontrado.');
    return;
  }
  // Usa window.location.href no mobile para abrir o app nativo
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = link;
  } else {
    window.open(link, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Envio automático via Z-API (opcional).
 * Configure no frontend/.env:
 *   VITE_ZAPI_INSTANCE=sua-instancia
 *   VITE_ZAPI_TOKEN=seu-token
 *
 * @returns {Promise<boolean>} true = enviado, false = não configurado/erro
 */
export async function enviarWhatsAppAutomatico(pedido, nomeLoja = 'Garagem do Frango') {
  const instance = import.meta.env.VITE_ZAPI_INSTANCE;
  const token    = import.meta.env.VITE_ZAPI_TOKEN;

  if (!instance || !token) return false;

  let fone = String(pedido.telefone_cliente || '').replace(/\D/g, '');
  if (!fone) return false;
  if (!fone.startsWith('55')) fone = '55' + fone;

  const mensagem = montarMensagem(pedido, nomeLoja);

  try {
    const resp = await fetch(
      `https://api.z-api.io/instances/${instance}/token/${token}/send-text`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fone, message: mensagem }),
      }
    );
    return resp.ok;
  } catch {
    return false;
  }
}
