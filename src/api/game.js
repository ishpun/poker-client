const getApiBase = () => {
  const host = process.env.REACT_APP_API_HOST;
  if (host) return host.replace(/\/api\/game\/?$/, '');
  return window.location.origin;
};

export const getSessionByIdUrl = (id) =>
  `${getApiBase()}/api/game/sessions/${id}`;
