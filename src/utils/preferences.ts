import { createTypedStorage } from './storage';
import { logger } from './logger';
import { ValidationError } from '../types/errors';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
    scheduling: boolean;
    analytics: boolean;
    teamUpdates: boolean;
  };
  scheduling: {
    defaultPlatforms: string[];
    defaultHashtags: string[];
    defaultTime: string;
    bufferTime: number;
    autoSchedule: boolean;
  };
  display: {
    compactView: boolean;
    showThumbnails: boolean;
    listViewMode: 'compact' | 'comfortable' | 'detailed';
    dateFormat: string;
    timeFormat: '12h' | '24h';
  };
  privacy: {
    shareAnalytics: boolean;
    shareDiagnostics: boolean;
    storeHistory: boolean;
    autoSave: boolean;
  };
  accessibility: {
    reduceMotion: boolean;
    highContrast: boolean;
    largeText: boolean;
    screenReader: boolean;
  };
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  language: navigator.language,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  notifications: {
    email: true,
    push: true,
    desktop: true,
    scheduling: true,
    analytics: true,
    teamUpdates: true
  },
  scheduling: {
    defaultPlatforms: [],
    defaultHashtags: [],
    defaultTime: '09:00',
    bufferTime: 30,
    autoSchedule: false
  },
  display: {
    compactView: false,
    showThumbnails: true,
    listViewMode: 'comfortable',
    dateFormat: 'MMM D, YYYY',
    timeFormat: '12h'
  },
  privacy: {
    shareAnalytics: true,
    shareDiagnostics: true,
    storeHistory: true,
    autoSave: true
  },
  accessibility: {
    reduceMotion: false,
    highContrast: false,
    largeText: false,
    screenReader: false
  }
};

type PreferenceKey = keyof UserPreferences;
type NestedPreferenceKey = string;
type PreferenceValue = any;
type PreferenceChangeCallback = (
  key: NestedPreferenceKey,
  newValue: PreferenceValue,
  oldValue: PreferenceValue
) => void;

class PreferencesManager {
  private preferences: UserPreferences;
  private storage = createTypedStorage<UserPreferences>('preferences');
  private changeListeners: Set<PreferenceChangeCallback> = new Set();
  private initialized: boolean = false;

  constructor() {
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.init();
  }

  private async init() {
    try {
      const stored = await this.storage.get();
      if (stored) {
        this.preferences = this.mergeWithDefaults(stored);
      }
      this.initialized = true;
      this.applyPreferences();
    } catch (error) {
      logger.error('Failed to initialize preferences', 'system', error as Error);
    }
  }

  private mergeWithDefaults(stored: Partial<UserPreferences>): UserPreferences {
    return {
      theme: stored.theme ?? DEFAULT_PREFERENCES.theme,
      language: stored.language ?? DEFAULT_PREFERENCES.language,
      timezone: stored.timezone ?? DEFAULT_PREFERENCES.timezone,
      notifications: {
        ...DEFAULT_PREFERENCES.notifications,
        ...(stored.notifications as Partial<UserPreferences['notifications']> || {})
      },
      scheduling: {
        ...DEFAULT_PREFERENCES.scheduling,
        ...(stored.scheduling as Partial<UserPreferences['scheduling']> || {})
      },
      display: {
        ...DEFAULT_PREFERENCES.display,
        ...(stored.display as Partial<UserPreferences['display']> || {})
      },
      privacy: {
        ...DEFAULT_PREFERENCES.privacy,
        ...(stored.privacy as Partial<UserPreferences['privacy']> || {})
      },
      accessibility: {
        ...DEFAULT_PREFERENCES.accessibility,
        ...(stored.accessibility as Partial<UserPreferences['accessibility']> || {})
      }
    };
  }

  private applyPreferences() {
    // Apply theme
    this.applyTheme();

    // Apply accessibility settings
    this.applyAccessibility();

    // Apply other visual preferences
    document.documentElement.style.setProperty(
      '--list-view-mode',
      this.preferences.display.listViewMode
    );
  }

  private applyTheme() {
    const theme = this.getEffectiveTheme();
    document.documentElement.setAttribute('data-theme', theme);
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  private applyAccessibility() {
    const { accessibility } = this.preferences;
    
    if (accessibility.reduceMotion) {
      document.documentElement.style.setProperty('--transition-duration', '0s');
    }
    
    if (accessibility.highContrast) {
      document.documentElement.classList.add('high-contrast');
    }
    
    if (accessibility.largeText) {
      document.documentElement.classList.add('large-text');
    }
  }

  private getEffectiveTheme(): 'light' | 'dark' {
    if (this.preferences.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return this.preferences.theme;
  }

  async get<K extends PreferenceKey>(key: K): Promise<UserPreferences[K]> {
    if (!this.initialized) {
      await this.init();
    }
    return this.preferences[key];
  }

  async getNestedValue(path: string): Promise<any> {
    if (!this.initialized) {
      await this.init();
    }

    return path.split('.').reduce((obj: any, key: string) => {
      return obj && obj[key];
    }, this.preferences);
  }

  async set<K extends PreferenceKey>(key: K, value: UserPreferences[K]): Promise<void> {
    const oldValue = this.preferences[key];
    this.preferences[key] = value;
    
    await this.save();
    this.notifyListeners(key, value, oldValue);
    this.applyPreferences();
  }

  async setNestedValue(path: string, value: any): Promise<void> {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const oldValue = await this.getNestedValue(path);
    
    let current: any = this.preferences;
    for (const key of keys) {
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
    
    await this.save();
    this.notifyListeners(path, value, oldValue);
    this.applyPreferences();
  }

  async reset(key?: PreferenceKey): Promise<void> {
    if (key) {
      // Create a new object with just the reset key
      const resetValue = { [key]: DEFAULT_PREFERENCES[key] };
      // Merge it with existing preferences
      this.preferences = {
        ...this.preferences,
        ...resetValue
      };
    } else {
      this.preferences = { ...DEFAULT_PREFERENCES };
    }
    
    await this.save();
    this.applyPreferences();
  }

  private async save(): Promise<void> {
    try {
      await this.storage.set(this.preferences);
    } catch (error) {
      logger.error('Failed to save preferences', 'system', error as Error);
      throw new ValidationError('Failed to save preferences');
    }
  }

  onChange(callback: PreferenceChangeCallback): () => void {
    this.changeListeners.add(callback);
    return () => this.changeListeners.delete(callback);
  }

  private notifyListeners(
    key: string,
    newValue: PreferenceValue,
    oldValue: PreferenceValue
  ) {
    this.changeListeners.forEach(listener => {
      try {
        listener(key, newValue, oldValue);
      } catch (error) {
        logger.error('Error in preference change listener', 'system', error as Error);
      }
    });
  }

  // Utility methods for common operations
  async toggleTheme(): Promise<void> {
    const currentTheme = await this.get('theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    await this.set('theme', newTheme);
  }

  async toggleNotification(type: keyof UserPreferences['notifications']): Promise<void> {
    const current = await this.getNestedValue(`notifications.${type}`);
    await this.setNestedValue(`notifications.${type}`, !current);
  }

  async addDefaultPlatform(platform: string): Promise<void> {
    const current = await this.getNestedValue('scheduling.defaultPlatforms');
    if (!current.includes(platform)) {
      await this.setNestedValue('scheduling.defaultPlatforms', [...current, platform]);
    }
  }

  async removeDefaultPlatform(platform: string): Promise<void> {
    const current = await this.getNestedValue('scheduling.defaultPlatforms');
    await this.setNestedValue(
      'scheduling.defaultPlatforms',
      current.filter((p: string) => p !== platform)
    );
  }

  async updateDefaultHashtags(hashtags: string[]): Promise<void> {
    await this.setNestedValue('scheduling.defaultHashtags', hashtags);
  }

  async setListViewMode(mode: UserPreferences['display']['listViewMode']): Promise<void> {
    await this.setNestedValue('display.listViewMode', mode);
  }

  async toggleAccessibilitySetting(
    setting: keyof UserPreferences['accessibility']
  ): Promise<void> {
    const current = await this.getNestedValue(`accessibility.${setting}`);
    await this.setNestedValue(`accessibility.${setting}`, !current);
  }
}

export const preferences = new PreferencesManager();
export default preferences; 