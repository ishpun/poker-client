import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Tables from './pages/Tables';
import TableConfig from './pages/TableConfig';
import Play from './pages/Play';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/tables" replace />} />
        <Route path="/tables" element={<Tables />} />
        <Route path="/table-config" element={<TableConfig />} />
        <Route path="/play/:tableId/:playerId" element={<Play />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
