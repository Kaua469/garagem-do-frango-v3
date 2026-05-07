/**
 * ═══════════════════════════════════════════════════════════════
 * MÓDULO DE EMISSÃO DE NOTA FISCAL — GARAGEM DO FRANGO
 *
 * gerarNFTermica(pedido, itens, config)
 *   → Imprime cupom 80mm na impressora térmica.
 *     Configuração obrigatória na impressora:
 *       - Tamanho do papel: 80mm ou "Rolo"
 *       - Sem margens (margens = 0)
 *       - Escala: 100% (não ajustar à página)
 *
 * gerarNFPDF(pedido, itens, config)
 *   → Baixa Nota Fiscal em PDF A4.
 * ═══════════════════════════════════════════════════════════════
 */

import { jsPDF } from 'jspdf';

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const PGTO = { pix: 'PIX', dinheiro: 'Dinheiro', cartao: 'Cartão' };
const STATUS_STR = {
  aguardando:   'Aguardando',
  confirmado:   'Confirmado',
  preparando:   'Preparando',
  saiu_entrega: 'Saiu p/ Entrega',
  entregue:     'Entregue',
  cancelado:    'Cancelado',
};

function parseDt(val) {
  if (!val) return null;
  const s = String(val).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (m) return new Date(+m[1], +m[2]-1, +m[3], +m[4], +m[5]);
  return null;
}

function fmtDT(val) {
  const d = parseDt(val);
  if (!d) return '';
  const p = n => String(n).padStart(2,'0');
  return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function moeda(v) { return `R$ ${Number(v).toFixed(2).replace('.',',')}`.replace(/(\d)(?=(\d{3})+,)/g,'$1.'); }

// Pad texto com espaços para alinhar em largura fixa (32 chars para 80mm / 10pt)
function padL(str, width) { return String(str).substring(0,width).padEnd(width,' '); }
function padR(str, width) { return String(str).substring(0,width).padStart(width,' '); }
function linha(esq, dir, total=38) {
  const e = String(esq).substring(0, total - String(dir).length - 1);
  return e + ' '.repeat(Math.max(1, total - e.length - String(dir).length)) + String(dir);
}
function sep(char='-', n=38) { return char.repeat(n); }
function centro(str, n=38) {
  str = String(str).substring(0,n);
  const pad = Math.floor((n - str.length) / 2);
  return ' '.repeat(pad) + str;
}

// ─── 1. CUPOM TÉRMICO 80mm ───────────────────────────────────────────────────
/**
 * CORREÇÕES aplicadas para eliminar páginas em branco:
 *
 * 1. @page { size: 80mm auto; margin: 0 } fora de @media print (no topo)
 * 2. html/body sem height fixo — apenas width: 80mm
 * 3. Sem <div> espaçadores no final
 * 4. window.open sem height fixo → browser usa tamanho real do conteúdo
 * 5. print() chamado via requestAnimationFrame após layout completo
 */
export function gerarNFTermica(pedido, itens, config = {}) {
  const nomeLoja = config.nome_loja || 'Garagem do Frango';
  const endereco = config.endereco  || '';
  const telefone = config.telefone  || '';
  const pgto     = PGTO[pedido.forma_pagamento] || pedido.forma_pagamento;
  const pgtoFull = pedido.tipo_cartao ? `${pgto} (${pedido.tipo_cartao})` : pgto;
  const status   = STATUS_STR[pedido.status] || pedido.status;
  const dataHora = fmtDT(pedido.criado_em);

  const linhasItens = itens.map(item => {
    const nome = item.nome_variacao
      ? `${item.nome_produto} (${item.nome_variacao})`
      : item.nome_produto;
    const nomeFormatado = nome.length > 38 ? nome.slice(0, 35) + '...' : nome;
    const qtdUnit = `${item.quantidade}x  ${moeda(item.preco_unitario)} un.`;
    const total   = moeda(item.preco_total);
    return `<div class="item">
      <div class="item-nome">${nomeFormatado}</div>
      <div class="item-sub"><span>${qtdUnit}</span><span>${total}</span></div>
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Cupom ${pedido.numero}</title>
<style>

/* ════════════════════════════════════════
   @page DEVE ficar aqui no TOPO, FORA de
   qualquer @media, para funcionar em
   todos os navegadores (Chrome, Edge, Firefox)
════════════════════════════════════════ */
@page {
  size: 80mm auto;   /* largura fixa, altura automática pelo conteúdo */
  margin: 0mm;       /* sem margens — a impressora térmica não usa margem */
}

/* ── RESET TOTAL ── */
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* ── HTML e BODY: largura fixa, altura AUTOMÁTICA ──
   NUNCA coloque height fixo aqui — isso cria páginas em branco */
html {
  width: 80mm;
  background: #fff;
}
body {
  width: 80mm;
  margin: 0 auto;
  padding: 3mm 4mm 5mm 4mm;
  background: #fff;
  color: #000;
  font-family: 'Courier New', Courier, monospace;
  font-size: 9pt;
  line-height: 1.45;
  /* height: auto é o padrão — NÃO sobrescreva */
}

/* ── SEPARADORES ── */
.sep-d  { border: none; border-top: 1px dashed #000; margin: 2.5mm 0; }
.sep-s  { border: none; border-top: 1.5px solid #000; margin: 2.5mm 0; }
.sep-db { border: none; border-top: 3px double #000; margin: 2.5mm 0; }

/* ── CABEÇALHO ── */
.h-nome {
  font-size: 13pt;
  font-weight: bold;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 1mm;
}
.h-info {
  font-size: 7.5pt;
  text-align: center;
  line-height: 1.6;
  color: #444;
}

/* ── CUPOM TITULO ── */
.c-titulo {
  font-size: 7.5pt;
  font-weight: bold;
  text-align: center;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 2mm 0 0.5mm;
}
.c-num  { font-size: 12pt; font-weight: bold; text-align: center; }
.c-data { font-size: 7pt; text-align: center; color: #555; margin-top: 0.5mm; }

/* ── SEÇÃO LABEL ── */
.s-lbl {
  font-size: 7pt;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #555;
  margin-bottom: 1mm;
}

/* ── LINHAS DE DADO ── */
.d-row {
  display: flex;
  font-size: 8pt;
  margin-bottom: 1mm;
  gap: 2mm;
}
.d-lbl { color: #555; width: 10mm; flex-shrink: 0; }
.d-val { font-weight: bold; flex: 1; word-break: break-word; }

/* ── ITENS ── */
.i-header {
  display: flex;
  justify-content: space-between;
  font-size: 7pt;
  font-weight: bold;
  text-transform: uppercase;
  color: #555;
  margin-bottom: 1mm;
}
.item { margin-bottom: 2mm; }
.item-nome {
  font-size: 8.5pt;
  font-weight: bold;
  word-break: break-word;
  line-height: 1.3;
}
.item-sub {
  display: flex;
  justify-content: space-between;
  font-size: 7.5pt;
  color: #444;
  padding-left: 2mm;
}
.item-sub span:last-child { font-weight: bold; color: #000; }

/* ── TOTAIS ── */
.t-row {
  display: flex;
  justify-content: space-between;
  font-size: 8.5pt;
  padding: 0.4mm 0;
  color: #444;
}
.t-final {
  display: flex;
  justify-content: space-between;
  font-size: 12pt;
  font-weight: bold;
  padding: 1mm 0;
  color: #000;
}

/* ── PAGAMENTO ── */
.pgto-box {
  border: 1px solid #000;
  padding: 1.5mm 2mm;
  margin-top: 2mm;
}
.pgto-lbl { font-size: 7pt; color: #555; text-transform: uppercase; letter-spacing: 1px; }
.pgto-val { font-size: 9.5pt; font-weight: bold; margin-top: 0.5mm; }

/* ── RODAPÉ ── */
.obrigado {
  font-size: 9pt;
  font-weight: bold;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 2mm 0 1mm;
}
.rodape {
  font-size: 7pt;
  text-align: center;
  color: #555;
  line-height: 1.7;
}

/* ── BARCODE SIMULADO ── */
.bc-bar {
  font-size: 22pt;
  text-align: center;
  letter-spacing: -1px;
  line-height: 1;
  margin: 2mm 0 0.5mm;
}
.bc-num {
  font-size: 6.5pt;
  text-align: center;
  letter-spacing: 2px;
  color: #555;
}

/* ── FORÇA impressão sem fundo colorido ── */
@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}

</style>
</head>
<body>

<div class="h-nome">${nomeLoja}</div>
<div class="h-info">${endereco ? endereco + '<br/>' : ''}${telefone ? 'Tel: ' + telefone : ''}</div>

<hr class="sep-db"/>

<div class="c-titulo">*** Cupom Fiscal ***</div>
<div class="c-num">#${pedido.numero}</div>
<div class="c-data">${dataHora} | ${status}</div>

<hr class="sep-d"/>

<div class="s-lbl">Cliente</div>
<div class="d-row"><span class="d-lbl">Nome:</span><span class="d-val">${pedido.nome_cliente}</span></div>
<div class="d-row"><span class="d-lbl">Tel:</span><span class="d-val">${pedido.telefone_cliente}</span></div>
<div class="d-row"><span class="d-lbl">End.:</span><span class="d-val">${pedido.endereco_entrega}</span></div>
${pedido.observacao ? `<div class="d-row"><span class="d-lbl">Obs:</span><span class="d-val" style="font-size:7.5pt">${pedido.observacao}</span></div>` : ''}

<hr class="sep-d"/>

<div class="s-lbl">Itens</div>
<div class="i-header"><span>Descricao</span><span>Total</span></div>
${linhasItens}

<hr class="sep-s"/>

<div class="t-row"><span>Subtotal</span><span>${moeda(pedido.subtotal)}</span></div>
<div class="t-row"><span>Entrega</span><span>${moeda(pedido.taxa_entrega)}</span></div>
<hr class="sep-d"/>
<div class="t-final"><span>TOTAL</span><span>${moeda(pedido.total)}</span></div>

<div class="pgto-box">
  <div class="pgto-lbl">Pagamento</div>
  <div class="pgto-val">${pgtoFull}</div>
  ${pedido.troco && pedido.forma_pagamento === 'dinheiro'
    ? `<div class="t-row" style="font-size:8pt;margin-top:1mm"><span>Troco para:</span><span>${moeda(pedido.troco)}</span></div>`
    : ''}
</div>

<hr class="sep-db"/>

<div class="obrigado">Obrigado! Volte sempre!</div>
<div class="rodape">${nomeLoja}<br/>Sem valor fiscal | ${dataHora}</div>

<div class="bc-bar">|||&thinsp;||&thinsp;||||&thinsp;||&thinsp;|||&thinsp;|||||</div>
<div class="bc-num">${pedido.numero}</div>

<script>
// Aguarda o layout estabilizar completamente antes de imprimir.
// requestAnimationFrame garante que o navegador terminou de renderizar.
// O setTimeout adicional é segurança extra para fontes carregarem.
function doPrint() {
  window.requestAnimationFrame(function() {
    window.requestAnimationFrame(function() {
      setTimeout(function() {
        window.print();
        // Fecha a janela automaticamente após imprimir (no Chrome/Edge)
        // window.close(); // descomente se quiser fechar após imprimir
      }, 250);
    });
  });
}

if (document.readyState === 'complete') {
  doPrint();
} else {
  window.addEventListener('load', doPrint);
}
</script>
</body>
</html>`;

  // IMPORTANTE: abrir sem height fixo.
  // O browser vai calcular o tamanho da janela pelo conteúdo real.
  // Sem height fixo não há espaço em branco antes do conteúdo.
  const win = window.open(
    '',
    '_blank',
    'width=380,toolbar=0,menubar=0,location=0,scrollbars=1,resizable=1'
  );

  if (!win) {
    alert(
      'Pop-up bloqueado!\n\n' +
      'Para imprimir o cupom, permita pop-ups para este site:\n' +
      '1. Clique no ícone de pop-up bloqueado na barra de endereço\n' +
      '2. Escolha "Sempre permitir pop-ups de..."\n' +
      '3. Clique em "Cupom" novamente'
    );
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();
}


// ─── 2. NOTA FISCAL PDF A4 ───────────────────────────────────────────────────
export async function gerarNFPDF(pedido, itens, config = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  const nomeLoja = config.nome_loja || 'Garagem do Frango';
  const endereco = config.endereco  || '';
  const telefone = config.telefone  || '';

  const LARANJA = [239, 98, 3];
  const ESCURO  = [21, 9, 0];
  const CINZA   = [120, 100, 88];
  const CLARO   = [244, 230, 211];
  const BRANCO  = [255, 255, 255];

  // Cabeçalho
  doc.setFillColor(...ESCURO);
  doc.rect(0, 0, W, 44, 'F');
  doc.setFillColor(...LARANJA);
  doc.rect(0, 44, W, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...BRANCO);
  doc.text(nomeLoja, 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(200, 170, 140);
  doc.text('O frango mais gostoso da cidade!', 14, 23);
  if (endereco) doc.text(`Endereço: ${endereco}`, 14, 29);
  if (telefone) doc.text(`Tel: ${telefone}`, 14, 35);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...LARANJA);
  doc.text('NOTA FISCAL DE PEDIDO', W - 14, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(200, 170, 140);
  doc.text(`Nº: ${pedido.numero}`, W - 14, 21, { align: 'right' });
  doc.text(`Emitida em: ${fmtDT(pedido.criado_em)}`, W - 14, 27, { align: 'right' });
  doc.text(`Status: ${STATUS_STR[pedido.status] || pedido.status}`, W - 14, 33, { align: 'right' });

  let y = 56;

  // Dados do cliente
  doc.setFillColor(...CLARO);
  doc.roundedRect(12, y, W - 24, 40, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...LARANJA);
  doc.text('DADOS DO CLIENTE', 18, y + 8);

  const dadosCliente = [
    ['Cliente:', pedido.nome_cliente],
    ['Telefone:', pedido.telefone_cliente],
    ['Endereço:', doc.splitTextToSize(pedido.endereco_entrega, W - 90)[0]],
  ];
  dadosCliente.forEach(([label, val], i) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...CINZA);
    doc.text(label, 18, y + 16 + i * 8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...ESCURO);
    doc.text(val, 50, y + 16 + i * 8);
  });
  if (pedido.observacao) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...CINZA);
    doc.text(`Obs: ${pedido.observacao}`, 18, y + 37);
  }
  y += 48;

  // Tabela de itens
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...LARANJA);
  doc.text('ITENS DO PEDIDO', 18, y);
  y += 5;

  doc.setFillColor(...ESCURO);
  doc.rect(12, y, W - 24, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...BRANCO);
  doc.text('DESCRIÇÃO', 18, y + 5.5);
  doc.text('QTD', 125, y + 5.5, { align: 'center' });
  doc.text('UNIT.', 155, y + 5.5, { align: 'right' });
  doc.text('TOTAL', W - 15, y + 5.5, { align: 'right' });
  y += 8;

  itens.forEach((item, idx) => {
    doc.setFillColor(...(idx % 2 === 0 ? BRANCO : [252, 245, 236]));
    doc.rect(12, y, W - 24, 9, 'F');
    const nomeItem = item.nome_variacao ? `${item.nome_produto} (${item.nome_variacao})` : item.nome_produto;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...ESCURO);
    doc.text(doc.splitTextToSize(nomeItem, 100)[0], 18, y + 6);
    doc.text(String(item.quantidade), 125, y + 6, { align: 'center' });
    doc.setTextColor(...CINZA);
    doc.text(moeda(item.preco_unitario), 155, y + 6, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...LARANJA);
    doc.text(moeda(item.preco_total), W - 15, y + 6, { align: 'right' });
    y += 9;
  });
  doc.setDrawColor(...CLARO);
  doc.setLineWidth(0.4);
  doc.rect(12, y - itens.length * 9 - 8, W - 24, itens.length * 9 + 8);
  y += 6;

  // Totais
  const boxX = W - 92, boxW = 80;
  doc.setFillColor(...CLARO);
  doc.roundedRect(boxX, y, boxW, 36, 3, 3, 'F');

  let ty = y + 10;
  const drawRow = (label, valor, destaque = false) => {
    doc.setFont('helvetica', destaque ? 'bold' : 'normal');
    doc.setFontSize(destaque ? 10 : 8.5);
    doc.setTextColor(...(destaque ? LARANJA : ESCURO));
    doc.text(label, boxX + 6, ty);
    doc.text(moeda(valor), boxX + boxW - 5, ty, { align: 'right' });
    ty += 9;
  };
  drawRow('Subtotal:', pedido.subtotal);
  drawRow('Taxa de entrega:', pedido.taxa_entrega);
  doc.setDrawColor(...LARANJA);
  doc.setLineWidth(0.4);
  doc.line(boxX + 5, ty - 2, boxX + boxW - 5, ty - 2);
  ty += 2;
  drawRow('TOTAL:', pedido.total, true);

  const pgtoFull = pedido.tipo_cartao
    ? `${PGTO[pedido.forma_pagamento] || pedido.forma_pagamento} (${pedido.tipo_cartao})`
    : (PGTO[pedido.forma_pagamento] || pedido.forma_pagamento);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...CINZA);
  doc.text('Forma de pagamento:', 18, y + 10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ESCURO);
  doc.text(pgtoFull, 62, y + 10);

  if (pedido.troco && pedido.forma_pagamento === 'dinheiro') {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...CINZA);
    doc.text('Troco para:', 18, y + 18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...ESCURO);
    doc.text(moeda(pedido.troco), 50, y + 18);
  }

  // Rodapé
  const footerY = 274;
  doc.setFillColor(...LARANJA);
  doc.rect(0, footerY, W, 2, 'F');
  doc.setFillColor(...ESCURO);
  doc.rect(0, footerY + 2, W, 21, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...BRANCO);
  doc.text(nomeLoja, W / 2, footerY + 9, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(160, 130, 110);
  const info = [endereco, telefone].filter(Boolean).join(' | ');
  if (info) doc.text(info, W / 2, footerY + 15, { align: 'center' });
  doc.text('Obrigado pela preferência! Volte sempre.', W / 2, footerY + 20, { align: 'center' });

  doc.saveGraphicsState();
  doc.setGState(doc.GState({ opacity: 0.035 }));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(72);
  doc.setTextColor(...LARANJA);
  doc.text('GARAGEM', W / 2, 165, { align: 'center', angle: 28 });
  doc.restoreGraphicsState();

  doc.save(`NF-Pedido-${pedido.numero}.pdf`);
}
