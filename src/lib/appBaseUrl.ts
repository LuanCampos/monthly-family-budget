// Centraliza a URL base do app (ex.: GitHub Pages com subpasta)
// - Em dev: import.meta.env.BASE_URL geralmente é "/"
// - Em produção (GitHub Pages): "/monthly-family-budget/"
export const getAppBaseUrl = (): string => {
  return new URL(import.meta.env.BASE_URL, window.location.origin).toString();
};
