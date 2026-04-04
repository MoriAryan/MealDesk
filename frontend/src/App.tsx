import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<AppLayout />}>
        <Route
          path="/"
          element={
            <PlaceholderPage
              title="Dashboard"
              description="Dashboard shell with KPI and reporting placeholders is ready for upcoming phases."
            />
          }
        />
        <Route
          path="/settings"
          element={
            <PlaceholderPage
              title="POS Settings"
              description="POS configuration pages for products, terminals, payment methods, and self ordering will be implemented from Phase 2 onward."
            />
          }
        />
        <Route
          path="/pos"
          element={
            <PlaceholderPage
              title="POS Terminal"
              description="Floor view, register, and payment flow pages are reserved and scaffolded for the next phases."
            />
          }
        />
        <Route
          path="/kitchen-display"
          element={
            <PlaceholderPage
              title="Kitchen Display"
              description="Kitchen ticket board shell is in place and will be wired to realtime updates in a later phase."
            />
          }
        />
        <Route
          path="/customer-display"
          element={
            <PlaceholderPage
              title="Customer Display"
              description="Customer-facing realtime display route is scaffolded and ready for integration."
            />
          }
        />
        <Route
          path="/self-ordering"
          element={
            <PlaceholderPage
              title="Self Ordering"
              description="Mobile self-ordering module route shell is prepared for token-based flow implementation."
            />
          }
        />
        <Route
          path="/reports"
          element={
            <PlaceholderPage
              title="Reports"
              description="Reporting and export screens are scaffolded and will be implemented in the reporting phase."
            />
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
