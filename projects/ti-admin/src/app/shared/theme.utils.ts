// Utilidad mínima para manejar tema persistente (prefijo TI-)
export type ThemeMode = 'claro' | 'oscuro';
export const THEME_STORAGE_KEY = 'TI-theme';

// Lee del storage (si no existe, devuelve null)
export function getSavedTheme(): ThemeMode | null {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return v === 'oscuro' || v === 'claro' ? (v as ThemeMode) : null;
  } catch {
    return null;
  }
}

// Aplica/remueve la clase en <body> para activar el tema oscuro
export function applyTheme(mode: ThemeMode): void {
  const dark = mode === 'oscuro';
  document.body.classList.toggle('dark-theme', dark);
}

// Guarda elección actual
export function persistTheme(mode: ThemeMode): void {
  try { localStorage.setItem(THEME_STORAGE_KEY, mode); } catch {}
}

// Inicializa desde storage (o “light” por defecto) antes de que Angular pinte
export function initThemeFromStorage(): ThemeMode {
  const saved = getSavedTheme() ?? 'claro';
  applyTheme(saved);
  return saved;
}
