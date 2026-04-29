const getApiBase = () => {
  const host = process.env.REACT_APP_API_HOST;
  if (host) return host.replace(/\/api\/game\/?$/, '');
  return window.location.origin;
};

export const getTablesUrl = () => `${getApiBase()}/api/tables`;

export const getTableByIdUrl = (tableId) => `${getApiBase()}/api/tables/${tableId}`;

export const getJoinGameUrl = (tableId, playerId) => {
  const base = getApiBase();
  return `${base}/api/game/tables/${tableId}/players/${playerId}/join`;
};

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

export const submitActionUrl = () => {
  const base = getApiBase();
  return `${base}/api/game/action`;
};
