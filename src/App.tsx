import { HashRouter, Routes, Route } from 'react-router-dom';
import { VehicleProvider } from './context/VehicleContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Issues from './pages/Issues';
import Legal from './pages/Legal';
import History from './pages/History';
import Budget from './pages/Budget';
import Settings from './pages/Settings';

export default function App() {
  return (
    <VehicleProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="serwis" element={<Schedule />} />
            <Route path="usterki" element={<Issues />} />
            <Route path="prawne" element={<Legal />} />
            <Route path="historia" element={<History />} />
            <Route path="budzet" element={<Budget />} />
            <Route path="ustawienia" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </VehicleProvider>
  );
}
