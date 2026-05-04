const getApiBase = () => {
  const host = process.env.REACT_APP_API_HOST;
  if (host) return host.replace(/\/api\/game\/?$/, '');
  return window.location.origin;
};

export const getTablesUrl = () => `${getApiBase()}/api/tables`;

export const getTableByIdUrl = (tableId) => `${getApiBase()}/api/tables/${tableId}`;

// Standardized endpoint for all state-changing game actions (JOIN, ACTION, LEAVE, etc.)
export const submitActionUrl = () => `${getApiBase()}/api/game/game-action`;

export const getSessionUrl = (sessionId) => {
  const base = getApiBase();
  return `${base}/api/game/sessions/${sessionId}`;
};

export const getTableStateUrl = (tableId, playerId, sessionId, currency) => {
  const base = getApiBase();
  const params = new URLSearchParams();
  params.set('playerId', playerId);
  if (sessionId) params.set('sessionId', sessionId);
  if (currency) params.set('currency', currency);
  return `${base}/api/game/tables/${tableId}/state?${params.toString()}`;
};


