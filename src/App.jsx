import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Tables from './pages/Tables';
import TableConfig from './pages/TableConfig';
import Play from './pages/Play';
import GameReplayPage from './pages/GameReplayPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/tables" replace />} />
        <Route path="/tables" element={<Tables />} />
        <Route path="/table-config" element={<TableConfig />} />
        <Route path="/play/:tableId/:playerId/:currency/:token/:tenantId" element={<Play />} />
        <Route path="/play/:tableId/:playerId" element={<Play />} />
        <Route path="/replay/:sessionId" element={<GameReplayPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
