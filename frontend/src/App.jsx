import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ConfigProvider } from './context/ConfigContext';
import { NotificationProvider } from './context/NotificationContext';

// Public pages
import Home       from './pages/public/Home';
import Cardapio   from './pages/public/Cardapio';
import Carrinho   from './pages/public/Carrinho';
import Login      from './pages/public/Login';
import Cadastro   from './pages/public/Cadastro';
import MinhaConta from './pages/public/MinhaConta';
import NotFound   from './pages/public/NotFound';

// Admin pages
import AdminLayout        from './pages/admin/AdminLayout';
import AdminDashboard     from './pages/admin/AdminDashboard';
import AdminProdutos      from './pages/admin/AdminProdutos';
import AdminEstoque       from './pages/admin/AdminEstoque';
import AdminPedidos       from './pages/admin/AdminPedidos';
import AdminFinanceiro    from './pages/admin/AdminFinanceiro';
import AdminNovidades     from './pages/admin/AdminNovidades';
import AdminAvaliacoes    from './pages/admin/AdminAvaliacoes';
import AdminClientes     from './pages/admin/AdminClientes';
import AdminConfiguracoes from './pages/admin/AdminConfiguracoes';
import PrimeiroAcesso     from './pages/admin/PrimeiroAcesso';

const ADMIN_ROUTE = '/garagem-frango-a9x7-controle';

function AdminGuard({ children }) {
  const { usuario } = useAuth();
  if (!usuario || usuario.tipo !== 'dona') return <NotFound />;
  if (usuario.precisa_alterar_acesso)
    return <Navigate to={`${ADMIN_ROUTE}/primeiro-acesso`} replace />;
  return children;
}

function PrimeiroAcessoGuard({ children }) {
  const { usuario } = useAuth();
  if (!usuario || usuario.tipo !== 'dona') return <NotFound />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ConfigProvider>
        <AuthProvider>
          <CartProvider>
            <NotificationProvider>
              <Routes>
                {/* ── Públicas ── */}
                <Route path="/"            element={<Navigate to="/inicio" replace />} />
                <Route path="/inicio"      element={<Home />} />
                <Route path="/cardapio"    element={<Cardapio />} />
                <Route path="/carrinho"    element={<Carrinho />} />
                <Route path="/login"       element={<Login />} />
                <Route path="/cadastro"    element={<Cadastro />} />
                <Route path="/minha-conta" element={<MinhaConta />} />

                {/* ── Primeiro acesso ── */}
                <Route
                  path={`${ADMIN_ROUTE}/primeiro-acesso`}
                  element={
                    <PrimeiroAcessoGuard>
                      <PrimeiroAcesso adminRoute={ADMIN_ROUTE} />
                    </PrimeiroAcessoGuard>
                  }
                />

                {/* ── ROTA ADMIN OCULTA ── */}
                <Route
                  path={`${ADMIN_ROUTE}/*`}
                  element={
                    <AdminGuard>
                      <AdminLayout adminRoute={ADMIN_ROUTE}>
                        <Routes>
                          <Route index                  element={<AdminDashboard />} />
                          <Route path="pedidos"         element={<AdminPedidos />} />
                          <Route path="produtos"        element={<AdminProdutos />} />
                          <Route path="estoque"         element={<AdminEstoque />} />
                          <Route path="financeiro"      element={<AdminFinanceiro />} />
                          <Route path="novidades"       element={<AdminNovidades />} />
                          <Route path="avaliacoes"      element={<AdminAvaliacoes />} />
                          <Route path="clientes"        element={<AdminClientes />} />
                          <Route path="configuracoes"   element={<AdminConfiguracoes />} />
                          <Route path="*"               element={<NotFound />} />
                        </Routes>
                      </AdminLayout>
                    </AdminGuard>
                  }
                />

                {/* ── 404 ── */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </NotificationProvider>
          </CartProvider>
        </AuthProvider>
      </ConfigProvider>
    </BrowserRouter>
  );
}
