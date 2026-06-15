import { Routes, Route } from 'react-router-dom';
import { LangProvider } from './context/LangContext';
import LoginPage    from './pages/LoginPage';
import BossPage     from './pages/BossPage';
import StaffPage    from './pages/StaffPage';
import CustomerPage from './pages/CustomerPage';
import NotFound     from './pages/NotFound';

export default function App() {
  return (
    <LangProvider>
      <Routes>
        <Route path="/"          element={<LoginPage />} />
        <Route path="/dashboard" element={<BossPage />} />
        <Route path="/staff"     element={<StaffPage />} />
        <Route path="/customer"  element={<CustomerPage />} />
        <Route path="*"          element={<NotFound />} />
      </Routes>
    </LangProvider>
  );
}
