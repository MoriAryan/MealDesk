import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppLayout } from "./layouts/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { PaymentMethodsPage } from "./pages/PaymentMethodsPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { PosConfigPage } from "./pages/PosConfigPage";
import { ProductEditorPage } from "./pages/ProductEditorPage";
import { ProductsPage } from "./pages/ProductsPage";
import { KitchenDisplayPage } from "./pages/KitchenDisplayPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";
import { CustomersPage } from "./pages/CustomersPage";
import { OrdersPage } from "./pages/OrdersPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { PosTerminalLayout } from "./layouts/PosTerminalLayout";
import { CustomerDisplayPage } from "./pages/CustomerDisplayPage";
import { ReportsPage } from "./pages/ReportsPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/settings"
          element={
            <PlaceholderPage
              title="Settings Home"
              description="Use Products, Categories, Payment Methods, and POS Config routes for Phase 2 management flows."
            />
          }
        />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:productId" element={<ProductEditorPage />} />
        <Route path="/payment-methods" element={<PaymentMethodsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/pos" element={<PosTerminalLayout />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/pos-config" element={<PosConfigPage />} />
        <Route path="/kitchen-display" element={<KitchenDisplayPage />} />
        <Route path="/customer-display" element={<CustomerDisplayPage />} />
        <Route
          path="/self-ordering"
          element={
            <PlaceholderPage
              title="Self Ordering"
              description="Mobile self-ordering module route shell is prepared for token-based flow implementation."
            />
          }
        />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
