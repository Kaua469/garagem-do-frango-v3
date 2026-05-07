import { useEffect, useState } from 'react';
import api from '../../services/api';
import { formatarData } from '../../services/dateUtils';
import styles from './AdminFinanceiro.module.css';

const hoje = () => new Date().toISOString().slice(0, 10);
const mesAtual = () => new Date().toISOString().slice(0, 7);

export default function AdminFinanceiro() {
  const [registros, setRegistros]   = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [mes, setMes]               = useState(mesAtual);
  const [saving, setSaving]         = useState(false);
  const [form, setForm] = useState({
    tipo: 'saida',
    descricao: '',
    valor: '',
    categoria: 'geral',
    data: hoje(),
  });

  const carregar = () => {
    setLoading(true);
    Promise.all([
      api.get('/financeiro', { params: { mes } }),
      api.get('/dashboard').catch(() => ({ data: {} })),
    ]).then(([fin, dash]) => {
      setRegistros(fin.data);
      setPagamentos(dash.data.pagamentosMes || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, [mes]);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const salvar = async () => {
    if (!form.descricao.trim() || !form.valor || !form.data) {
      alert('Preencha descrição, valor e data.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/financeiro', form);
      setForm({ tipo: 'saida', descricao: '', valor: '', categoria: 'geral', data: hoje() });
      carregar();
    } catch {
      alert('Erro ao lançar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const totalEntradas = registros.filter(r => r.tipo === 'entrada').reduce((a, r) => a + Number(r.valor), 0);
  const totalSaidas   = registros.filter(r => r.tipo === 'saida').reduce((a, r) => a + Number(r.valor), 0);
  const saldo         = totalEntradas - totalSaidas;

  return (
    <div>
      <h1 className={styles.pageTitle}>💰 Financeiro</h1>

      {/* Filtro de mês */}
      <div className={styles.mesRow}>
        <label className={styles.mesLabel}>Mês de referência:</label>
        <input
          type="month"
          value={mes}
          onChange={e => setMes(e.target.value)}
          className={`input-field ${styles.mesInput}`}
        />
      </div>

      {/* Cards resumo */}
      <div className={styles.summaryGrid}>
        <div className={`${styles.summCard} ${styles.entrada}`}>
          <span className={styles.summLabel}>📈 Entradas</span>
          <span className={styles.summVal}>R$ {totalEntradas.toFixed(2)}</span>
        </div>
        <div className={`${styles.summCard} ${styles.saida}`}>
          <span className={styles.summLabel}>📉 Saídas</span>
          <span className={styles.summVal}>R$ {totalSaidas.toFixed(2)}</span>
        </div>
        <div className={`${styles.summCard} ${styles.lucro}`}>
          <span className={styles.summLabel}>💵 Saldo</span>
          <span className={styles.summVal} style={{ color: saldo >= 0 ? '#2d9b3f' : '#e53e3e' }}>
            R$ {saldo.toFixed(2)}
          </span>
        </div>
      </div>


      {/* ── Breakdown por forma de pagamento ── */}
      {pagamentos.length > 0 && (
        <div className={styles.pgtoGrid}>
          {pagamentos.map(pg => (
            <div key={pg.forma_pagamento} className={styles.pgtoCard}>
              <span className={styles.pgtoIcon}>
                {pg.forma_pagamento === 'pix' ? '⚡' : pg.forma_pagamento === 'cartao' ? '💳' : '💵'}
              </span>
              <div>
                <p className={styles.pgtoLabel}>
                  {pg.forma_pagamento === 'pix' ? 'PIX' : pg.forma_pagamento === 'cartao' ? 'Cartão' : 'Dinheiro'}
                </p>
                <p className={styles.pgtoValor}>R$ {Number(pg.total).toFixed(2)}</p>
                <p className={styles.pgtoQtd}>{pg.qtd} pedido(s)</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulário de lançamento */}
      <div className={styles.formBox}>
        <h3 className={styles.formTitle}>Lançar Entrada / Despesa</h3>

        {/* Linha 1: tipo + descrição */}
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Tipo *</label>
            <select
              className="input-field"
              value={form.tipo}
              onChange={e => set('tipo', e.target.value)}
            >
              <option value="entrada">📈 Entrada</option>
              <option value="saida">📉 Saída</option>
            </select>
          </div>

          <div className={`${styles.formField} ${styles.fieldFlex}`}>
            <label className={styles.fieldLabel}>Descrição *</label>
            <input
              className="input-field"
              placeholder="Ex: Compra de ingredientes, venda de pedido..."
              value={form.descricao}
              onChange={e => set('descricao', e.target.value)}
            />
          </div>
        </div>

        {/* Linha 2: valor + data + categoria + botão */}
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Valor (R$) *</label>
            <input
              className="input-field"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={form.valor}
              onChange={e => set('valor', e.target.value)}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Data *</label>
            <input
              className="input-field"
              type="date"
              value={form.data}
              onChange={e => set('data', e.target.value)}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Categoria</label>
            <select
              className="input-field"
              value={form.categoria}
              onChange={e => set('categoria', e.target.value)}
            >
              <option value="pedido">Pedido</option>
              <option value="ingredientes">Ingredientes</option>
              <option value="embalagem">Embalagem</option>
              <option value="gas">Gás / Energia</option>
              <option value="manutencao">Manutenção</option>
              <option value="marketing">Marketing</option>
              <option value="funcionario">Funcionário</option>
              <option value="geral">Geral / Outro</option>
            </select>
          </div>

          <div className={`${styles.formField} ${styles.fieldBtn}`}>
            <label className={styles.fieldLabel}>&nbsp;</label>
            <button
              className={styles.lancarBtn}
              onClick={salvar}
              disabled={saving}
            >
              {saving ? 'Salvando...' : '+ Lançar'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de registros */}
      {loading ? <div className="spinner" /> : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Descrição</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {registros.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>
                    Nenhum lançamento em {mes}.
                  </td>
                </tr>
              )}
              {registros.map(r => (
                <tr key={r.id}>
                  <td className={styles.tdData}>
                    {formatarData(r.data)}
                  </td>
                  <td>
                    <span className={`${styles.tipoBadge} ${r.tipo === 'entrada' ? styles.tipoEntrada : styles.tipoSaida}`}>
                      {r.tipo === 'entrada' ? '📈 Entrada' : '📉 Saída'}
                    </span>
                  </td>
                  <td className={styles.tdCat}>{r.categoria || '–'}</td>
                  <td>{r.descricao}</td>
                  <td>
                    <strong style={{ color: r.tipo === 'entrada' ? '#2d9b3f' : '#e53e3e' }}>
                      R$ {Number(r.valor).toFixed(2)}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
