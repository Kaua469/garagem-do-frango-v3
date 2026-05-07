-- ============================================================
-- GARAGEM DO FRANGO — SCHEMA POSTGRESQL (SUPABASE)
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Extensão para UUID (opcional, não usamos aqui mas boa prática)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id            SERIAL PRIMARY KEY,
  nome          VARCHAR(150) NOT NULL,
  telefone      VARCHAR(20)  NOT NULL UNIQUE,
  email         VARCHAR(150),
  senha         VARCHAR(255) NOT NULL,
  tipo          TEXT NOT NULL DEFAULT 'cliente' CHECK (tipo IN ('dona','cliente')),
  precisa_alterar_acesso BOOLEAN NOT NULL DEFAULT FALSE,
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_usuarios_telefone ON usuarios(telefone);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo     ON usuarios(tipo);

-- ============================================================
-- TABELA: produtos
-- ============================================================
CREATE TABLE IF NOT EXISTS produtos (
  id             SERIAL PRIMARY KEY,
  nome           VARCHAR(200) NOT NULL,
  descricao      TEXT,
  categoria      TEXT NOT NULL CHECK (categoria IN ('frangos','marmitas','porcoes','bebidas','sobremesas','combos')),
  imagem         VARCHAR(500),
  preco          NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  estoque        INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','inativo')),
  mais_vendido   BOOLEAN DEFAULT FALSE,
  novidade       BOOLEAN DEFAULT FALSE,
  combo_semana   BOOLEAN DEFAULT FALSE,
  tem_variacao   BOOLEAN DEFAULT FALSE,
  tem_quantidade BOOLEAN DEFAULT FALSE,
  qtd_min        INTEGER DEFAULT 1,
  qtd_max        INTEGER DEFAULT 20,
  criado_em      TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria);
CREATE INDEX IF NOT EXISTS idx_produtos_status    ON produtos(status);

-- ============================================================
-- TABELA: variacoes_produto
-- ============================================================
CREATE TABLE IF NOT EXISTS variacoes_produto (
  id         SERIAL PRIMARY KEY,
  produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  nome       VARCHAR(150) NOT NULL,
  preco      NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  estoque    INTEGER NOT NULL DEFAULT 0,
  ativo      BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_variacoes_produto_id ON variacoes_produto(produto_id);

-- ============================================================
-- TABELA: enderecos_cliente
-- ============================================================
CREATE TABLE IF NOT EXISTS enderecos_cliente (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  rua         VARCHAR(200) NOT NULL,
  numero      VARCHAR(20),
  complemento VARCHAR(100),
  bairro      VARCHAR(100),
  cidade      VARCHAR(100),
  cep         VARCHAR(10),
  principal   BOOLEAN DEFAULT FALSE,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_enderecos_usuario ON enderecos_cliente(usuario_id);

-- ============================================================
-- TABELA: pedidos
-- ============================================================
CREATE TABLE IF NOT EXISTS pedidos (
  id                SERIAL PRIMARY KEY,
  numero            VARCHAR(20) NOT NULL UNIQUE,
  usuario_id        INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  nome_cliente      VARCHAR(150) NOT NULL,
  telefone_cliente  VARCHAR(20) NOT NULL,
  endereco_entrega  TEXT NOT NULL,
  subtotal          NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  taxa_entrega      NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total             NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  forma_pagamento   TEXT NOT NULL CHECK (forma_pagamento IN ('pix','dinheiro','cartao')),
  tipo_cartao       TEXT CHECK (tipo_cartao IN ('credito','debito')),
  troco             NUMERIC(10,2),
  observacao        TEXT,
  status            TEXT NOT NULL DEFAULT 'aguardando' CHECK (status IN ('aguardando','confirmado','preparando','saiu_entrega','entregue','cancelado')),
  criado_em         TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pedidos_status    ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_criado_em ON pedidos(criado_em);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario   ON pedidos(usuario_id);

-- ============================================================
-- TABELA: itens_pedido
-- ============================================================
CREATE TABLE IF NOT EXISTS itens_pedido (
  id             SERIAL PRIMARY KEY,
  pedido_id      INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id     INTEGER NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
  variacao_id    INTEGER REFERENCES variacoes_produto(id) ON DELETE SET NULL,
  nome_produto   VARCHAR(200) NOT NULL,
  nome_variacao  VARCHAR(150),
  quantidade     INTEGER NOT NULL DEFAULT 1,
  preco_unitario NUMERIC(10,2) NOT NULL,
  preco_total    NUMERIC(10,2) NOT NULL,
  observacao     TEXT,
  criado_em      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_id ON itens_pedido(pedido_id);

-- ============================================================
-- TABELA: financeiro
-- ============================================================
CREATE TABLE IF NOT EXISTS financeiro (
  id         SERIAL PRIMARY KEY,
  tipo       TEXT NOT NULL CHECK (tipo IN ('entrada','saida')),
  descricao  VARCHAR(300) NOT NULL,
  valor      NUMERIC(10,2) NOT NULL,
  pedido_id  INTEGER REFERENCES pedidos(id) ON DELETE SET NULL,
  categoria  VARCHAR(100),
  data       DATE NOT NULL,
  criado_em  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_financeiro_tipo ON financeiro(tipo);
CREATE INDEX IF NOT EXISTS idx_financeiro_data ON financeiro(data);

-- ============================================================
-- TABELA: novidades
-- ============================================================
CREATE TABLE IF NOT EXISTS novidades (
  id            SERIAL PRIMARY KEY,
  titulo        VARCHAR(200) NOT NULL,
  descricao     TEXT,
  imagem        VARCHAR(500),
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: avaliacoes
-- ============================================================
CREATE TABLE IF NOT EXISTS avaliacoes (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  nome        VARCHAR(150) NOT NULL,
  nota        INTEGER NOT NULL DEFAULT 5 CHECK (nota BETWEEN 1 AND 5),
  comentario  TEXT,
  ativo       BOOLEAN DEFAULT TRUE,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: configuracoes
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracoes (
  id           SERIAL PRIMARY KEY,
  chave        VARCHAR(100) NOT NULL UNIQUE,
  valor        TEXT,
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_configuracoes_chave ON configuracoes(chave);

-- ============================================================
-- TABELA: notificacoes
-- ============================================================
CREATE TABLE IF NOT EXISTS notificacoes (
  id        SERIAL PRIMARY KEY,
  tipo      TEXT NOT NULL CHECK (tipo IN ('novo_pedido','estoque_baixo','produto_indisponivel')),
  titulo    VARCHAR(200) NOT NULL,
  mensagem  TEXT NOT NULL,
  dados     JSONB,
  lida      BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON notificacoes(tipo);

-- ============================================================
-- FUNÇÃO: atualizar atualizado_em automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_usuarios
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_produtos
  BEFORE UPDATE ON produtos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_pedidos
  BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_novidades
  BEFORE UPDATE ON novidades
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_configuracoes
  BEFORE UPDATE ON configuracoes
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================
-- SEEDS — USUÁRIA DONA
-- Senha: 123456789  (hash bcrypt)
-- ============================================================
INSERT INTO usuarios (nome, telefone, senha, tipo, precisa_alterar_acesso)
VALUES ('Dona da Garagem', '16999999999',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'dona', TRUE)
ON CONFLICT (telefone) DO NOTHING;

-- ============================================================
-- SEEDS — CONFIGURAÇÕES
-- ============================================================
INSERT INTO configuracoes (chave, valor) VALUES
  ('nome_loja',     'Garagem do Frango'),
  ('telefone',      '(16) 99999-9999'),
  ('whatsapp',      '5516999999999'),
  ('instagram',     'garagemdofrango'),
  ('facebook',      'garagemdofrango'),
  ('endereco',      'Rua das Aves, 123 - Ribeirão Preto, SP'),
  ('horario',       'Seg-Sex: 11h às 22h | Sáb-Dom: 11h às 23h'),
  ('taxa_entrega',  '5.00'),
  ('hero_titulo',   'O Frango Mais Gostoso da Cidade!'),
  ('hero_subtitulo','Assado na hora, com muito tempero e amor. Peça agora e receba em casa!'),
  ('rota_admin',    '/garagem-frango-a9x7-controle'),
  ('notif_som',     '1'),
  ('notif_pedido',  '1'),
  ('notif_estoque_baixo', '1'),
  ('notif_produto_indisponivel', '1'),
  ('logo_url',      '/uploads/logo.png'),
  ('hero_imagem',   '/uploads/hero.jpg')
ON CONFLICT (chave) DO NOTHING;

-- ============================================================
-- SEEDS — PRODUTOS
-- ============================================================
INSERT INTO produtos (nome, descricao, categoria, preco, estoque, status, mais_vendido, tem_quantidade, qtd_min, qtd_max) VALUES
  ('Frango Assado Inteiro', 'Frango caipira assado no forno com ervas finas, alecrim e batatas rústicas.', 'frangos', 65.00, 15, 'ativo', TRUE, TRUE, 1, 20),
  ('Coxa Sobrecoxa Assada', 'Coxa e sobrecoxa douradas, temperadas com alho, limão e ervas.', 'frangos', 18.00, 30, 'ativo', TRUE, TRUE, 1, 20),
  ('Marmita Tradicional', 'Arroz, feijão, salada, frango grelhado e farofa.', 'marmitas', 22.00, 20, 'ativo', TRUE, FALSE, 1, 1),
  ('Marmita Fitness', 'Arroz integral, legumes refogados, peito de frango grelhado.', 'marmitas', 25.00, 15, 'ativo', FALSE, FALSE, 1, 1),
  ('Porção de Frango Frito', 'Pedaços crocantes com tempero especial da casa.', 'porcoes', 35.00, 10, 'ativo', TRUE, FALSE, 1, 1),
  ('Lasanha de Frango', 'Lasanha cremosa de frango desfiado com molho branco e queijo gratinado.', 'marmitas', 32.00, 8, 'ativo', FALSE, TRUE, 1, 20),
  ('Maionese de Frango', 'Maionese artesanal com frango desfiado, legumes e temperos especiais.', 'porcoes', 20.00, 25, 'ativo', TRUE, FALSE, 1, 1),
  ('Farofa Especial', 'Farofa crocante com bacon, ovos e especiarias da casa.', 'porcoes', 20.00, 30, 'ativo', FALSE, FALSE, 1, 1),
  ('Coca-Cola 2L', 'Coca-Cola gelada 2 litros.', 'bebidas', 12.00, 50, 'ativo', FALSE, FALSE, 1, 1),
  ('Suco de Laranja 500ml', 'Suco de laranja natural, espremido na hora.', 'bebidas', 8.00, 40, 'ativo', FALSE, FALSE, 1, 1),
  ('Pudim Artesanal', 'Pudim artesanal preparado com ingredientes selecionados.', 'sobremesas', 30.00, 12, 'ativo', TRUE, FALSE, 1, 1),
  ('Combo Família', 'Frango inteiro + 2 porções + 2 refrigerantes + farofa.', 'combos', 120.00, 10, 'ativo', TRUE, FALSE, 1, 1),
  ('Combo Casal', 'Meio frango + 1 porção + 2 refrigerantes.', 'combos', 75.00, 15, 'ativo', FALSE, FALSE, 1, 1)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEEDS — VARIAÇÕES
-- ============================================================
-- Pudim (id = 11)
INSERT INTO variacoes_produto (produto_id, nome, preco, estoque)
SELECT id, 'Pudim de Leite Condensado', 30.00, 12 FROM produtos WHERE nome = 'Pudim Artesanal' ON CONFLICT DO NOTHING;
INSERT INTO variacoes_produto (produto_id, nome, preco, estoque)
SELECT id, 'Pudim de Leite Ninho', 45.00, 8 FROM produtos WHERE nome = 'Pudim Artesanal' ON CONFLICT DO NOTHING;
INSERT INTO variacoes_produto (produto_id, nome, preco, estoque)
SELECT id, 'Mini Pudim', 8.00, 20 FROM produtos WHERE nome = 'Pudim Artesanal' ON CONFLICT DO NOTHING;

-- Maionese
INSERT INTO variacoes_produto (produto_id, nome, preco, estoque)
SELECT id, '250g', 10.00, 25 FROM produtos WHERE nome = 'Maionese de Frango' ON CONFLICT DO NOTHING;
INSERT INTO variacoes_produto (produto_id, nome, preco, estoque)
SELECT id, '500g', 20.00, 20 FROM produtos WHERE nome = 'Maionese de Frango' ON CONFLICT DO NOTHING;
INSERT INTO variacoes_produto (produto_id, nome, preco, estoque)
SELECT id, '1kg', 75.00, 10 FROM produtos WHERE nome = 'Maionese de Frango' ON CONFLICT DO NOTHING;

-- Farofa
INSERT INTO variacoes_produto (produto_id, nome, preco, estoque)
SELECT id, '250g', 10.00, 30 FROM produtos WHERE nome = 'Farofa Especial' ON CONFLICT DO NOTHING;
INSERT INTO variacoes_produto (produto_id, nome, preco, estoque)
SELECT id, '500g', 20.00, 25 FROM produtos WHERE nome = 'Farofa Especial' ON CONFLICT DO NOTHING;
INSERT INTO variacoes_produto (produto_id, nome, preco, estoque)
SELECT id, '1kg', 75.00, 15 FROM produtos WHERE nome = 'Farofa Especial' ON CONFLICT DO NOTHING;

-- Marcar tem_variacao = TRUE para esses produtos
UPDATE produtos SET tem_variacao = TRUE WHERE nome IN ('Maionese de Frango','Farofa Especial','Pudim Artesanal');

-- ============================================================
-- SEEDS — NOVIDADES
-- ============================================================
INSERT INTO novidades (titulo, descricao, ativo) VALUES
  ('🔥 Promoção Sexta-Feira!', 'Todo frango com 15% de desconto às sextas-feiras!', TRUE),
  ('🆕 Nova Marmita Fit!', 'Chegou a marmita fitness com ingredientes frescos.', TRUE),
  ('🎉 Combo Família em Destaque!', 'Nosso combo família está fazendo sucesso!', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEEDS — AVALIAÇÕES
-- ============================================================
INSERT INTO avaliacoes (nome, nota, comentario, ativo) VALUES
  ('Maria Silva', 5, 'O frango mais gostoso que já comi! Chegou quentinho e no horário.', TRUE),
  ('João Santos', 5, 'Serviço impecável, comida deliciosa. O pudim então... sem palavras!', TRUE),
  ('Ana Costa', 5, 'Minha família amou o combo familiar. 10 estrelas!', TRUE),
  ('Pedro Oliveira', 4, 'Ótima comida caseira. Entrega rápida e embalagem caprichada.', TRUE)
ON CONFLICT DO NOTHING;
