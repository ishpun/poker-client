const getApiBase = () => {
  const host = process.env.REACT_APP_API_HOST;
  if (host) return host.replace(/\/api\/game\/?$/, '');
  return window.location.origin;
};

export const tablesApiUrl = `${getApiBase()}/api/tables`;

export const getTableByIdUrl = (tableId) => `${tablesApiUrl}/${tableId}`;

export const getJoinGameUrl = (tableId, playerId, currency, mode) => {
  const base = getApiBase();
  const params = new URLSearchParams();
  if (currency) params.set('currency', currency);
  if (mode) params.set('mode', mode);
  const queryString = params.toString();
  return `${base}/api/game/tables/${tableId}/players/${playerId}/join${queryString ? `?${queryString}` : ''}`;
};

export const getSessionUrl = (sessionId) => {
  const base = getApiBase();
  return `${base}/api/game/sessions/${sessionId}`;
};

export const getTableStateUrl = (tableId, playerId, sessionId, currency, mode) => {
  const base = getApiBase();
  const params = new URLSearchParams();
  params.set('playerId', playerId);
  if (sessionId) params.set('sessionId', sessionId);
  if (currency) params.set('currency', currency);
  if (mode) params.set('mode', mode);
  return `${base}/api/game/tables/${tableId}/state?${params.toString()}`;
};

export const submitActionUrl = () => {
  const base = getApiBase();
  return `${base}/api/game/action`;
};
