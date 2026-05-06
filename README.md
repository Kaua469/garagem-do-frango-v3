# 🍗 Garagem do Frango - Sistema Completo

## Estrutura
```
garagem-do-frango/
├── backend/          ← Node.js + Express + MySQL + Socket.IO
└── frontend/         ← React + Vite
```

## Login Inicial (DONA)
- **Telefone:** 16999999999
- **Senha:** 123456789
- **Rota admin:** /garagem-frango-a9x7-controle

---

## 🚀 Como rodar localmente

### 1. Banco de dados
```bash
mysql -u root -p < backend/database.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Edite .env com seus dados MySQL e JWT_SECRET
npm install
npm run dev
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env
# Edite VITE_API_URL=http://localhost:3000/api
# Edite VITE_SOCKET_URL=http://localhost:3000
npm install
npm run dev
```

---

## 🌐 Deploy na Hostinger

### Frontend
```bash
cd frontend
npm run build
# Envie todo o conteúdo de /dist para public_html via FTP ou File Manager
# O arquivo .htaccess já está em frontend/public/ e será incluído no /dist
```

### Backend
```bash
cd backend
npm install --production
# Configure as variáveis de ambiente no painel da Hostinger (Node.js)
# Inicie com PM2:
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Configurar domínio da API
No painel da Hostinger, crie um subdomínio:
- **api.garagemdofrango.com.br** apontando para a porta 3000

---

## 🔒 Primeiro acesso
1. Acesse: https://garagemdofrango.com.br/garagem-frango-a9x7-controle
2. Login: 16999999999 / 123456789
3. O sistema vai redirecionar para definir novo telefone e senha
4. Após salvar, você terá acesso completo ao painel

---

## ⚙️ Trocar rota administrativa
1. Faça login no painel admin
2. Vá em **Configurações → Área Admin**
3. Digite a nova rota secreta
4. Salve
5. Atualize `ADMIN_ROUTE` no arquivo `frontend/src/App.jsx`
6. Faça novo `npm run build` e suba o /dist novamente

---

## 🔔 Notificações em tempo real
O Socket.IO já está configurado. Para funcionar:
1. Garanta que `VITE_SOCKET_URL` aponta para a URL do backend
2. Faça login como dona no painel admin
3. As notificações chegam automaticamente quando um pedido é feito

