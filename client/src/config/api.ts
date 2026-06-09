/** API root — uvek sa završnim slashom */
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? "/api/v1/"
).replace(/\/?$/, "/");

export const apiUrl = (path: string): string =>
  `${API_BASE_URL}${path.replace(/^\//, "")}`;
