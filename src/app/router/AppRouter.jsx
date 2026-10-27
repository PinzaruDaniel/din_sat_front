import { ProducerPickupSection } from '../../presentation/features/pickup/ProducerPickupSection.jsx';
import { useAuth } from '../../presentation/features/auth/AuthContext.js';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from '../Layout.jsx';
import { MarketplacePage } from '../../presentation/features/catalog/MarketplacePage.jsx';
import { AuthPage } from '../../presentation/features/auth/AuthPage.jsx';
import { ProductPage } from '../../presentation/features/catalog/ProductPage.jsx';
import { ProducersPage } from '../../presentation/features/producers/ProducersPage.jsx';
import { ProducerDashboard } from '../../presentation/features/producers/ProducerDashboard.jsx';
import { CartPage } from '../../presentation/features/cart/CartPage.jsx';
import { OrdersPage } from '../../presentation/features/orders/OrdersPage.jsx';
import {
  EmptyState,
  BackToShop,
} from '../../presentation/shared/ui/Feedback.jsx';
import { ProtectedRoute } from './ProtectedRoute.jsx';
function NotFound() {
  return (
    <EmptyState
      title="Ne-am rătăcit puțin."
      text="Pagina căutată nu există, dar piața te așteaptă."
    >
      <BackToShop />
    </EmptyState>
  );
}
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<MarketplacePage />} />
          <Route path="login" element={<AuthPage key="login" />} />
          <Route
            path="register"
            element={<AuthPage key="register" registering />}
          />
          <Route path="products/:id" element={<ProductPage />} />
          <Route path="producers" element={<ProducersPage />} />
          <Route path="producers/:id" element={<ProducersPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="orders" element={<OrdersPage />} />
          </Route>
          <Route element={<ProtectedRoute role="producer" />}>
            <Route path="producer" element={<ProducerPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function ProducerPage() {
  const { user } = useAuth();
  return (
    <ProducerDashboard>
      <ProducerPickupSection producerId={user.id} />
    </ProducerDashboard>
  );
}
