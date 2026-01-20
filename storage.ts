import { AppSettings, DEFAULT_SETTINGS } from '../types';

const SETTINGS_KEY = 'comicast_settings';

export const saveSettings = (settings: AppSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings", e);
  }
};

export const loadSettings = (): AppSettings => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Failed to load settings", e);
  }
  return DEFAULT_SETTINGS;
};

export const clearCache = () => {
  localStorage.removeItem(SETTINGS_KEY);
  // If we had other caches (like IndexedDB for files), we would clear them here.
  // For now, this just resets settings to default.
};