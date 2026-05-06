const { Pool } = require('pg');

// Usa DATABASE_URL do Supabase (inclui SSL automaticamente)
// Formato: postgresql://postgres:[senha]@db.[ref].supabase.co:5432/postgres
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }  // necessário para Supabase/Render
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  // Silencioso em produção
  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ PostgreSQL (Supabase) conectado!');
  }
});

pool.on('error', (err) => {
  console.error('❌ Erro no pool PostgreSQL:', err.message);
});

// Teste de conexão na inicialização
pool.query('SELECT 1')
  .then(() => console.log('✅ Supabase PostgreSQL conectado com sucesso!'))
  .catch(err => console.error('❌ Falha ao conectar Supabase:', err.message));

module.exports = pool;
