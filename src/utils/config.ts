import { ValidationError } from '../types/errors';

interface Config {
  api: {
    url: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  auth: {
    tokenKey: string;
    refreshTokenKey: string;
    expiryKey: string;
    cookieDomain: string;
    secureCookie: boolean;
  };
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    debug: boolean;
    analytics: boolean;
  };
  features: {
    socialLogin: boolean;
    analytics: boolean;
    scheduling: boolean;
    teamManagement: boolean;
  };
  limits: {
    maxFileSize: number;
    maxUploadFiles: number;
    maxTeamMembers: number;
    maxScheduledPosts: number;
  };
  social: {
    platforms: string[];
    defaultHashtags: string[];
    maxHashtags: number;
  };
}

const defaultConfig: Config = {
  api: {
    url: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },
  auth: {
    tokenKey: 'auth_token',
    refreshTokenKey: 'refresh_token',
    expiryKey: 'token_expiry',
    cookieDomain: import.meta.env.VITE_COOKIE_DOMAIN || 'localhost',
    secureCookie: import.meta.env.VITE_ENV === 'production'
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Social Media Manager',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: (import.meta.env.VITE_ENV || 'development') as 'development' | 'staging' | 'production',
    debug: import.meta.env.VITE_DEBUG === 'true',
    analytics: import.meta.env.VITE_ANALYTICS === 'true'
  },
  features: {
    socialLogin: true,
    analytics: true,
    scheduling: true,
    teamManagement: true
  },
  limits: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxUploadFiles: 10,
    maxTeamMembers: 10,
    maxScheduledPosts: 100
  },
  social: {
    platforms: ['facebook', 'twitter', 'instagram', 'linkedin'],
    defaultHashtags: [],
    maxHashtags: 30
  }
};

class ConfigManager {
  private config: Config;
  private overrides: Partial<Config> = {};

  constructor(initialConfig: Config = defaultConfig) {
    this.config = this.validateConfig(initialConfig);
    this.loadEnvironmentOverrides();
  }

  private validateConfig(config: Config): Config {
    // Validate API configuration
    if (!config.api.url) {
      throw new ValidationError('API URL is required');
    }

    // Validate environment
    if (!['development', 'staging', 'production'].includes(config.app.environment)) {
      throw new ValidationError('Invalid environment');
    }

    // Validate limits
    if (config.limits.maxFileSize <= 0) {
      throw new ValidationError('Invalid max file size');
    }
    if (config.limits.maxUploadFiles <= 0) {
      throw new ValidationError('Invalid max upload files');
    }
    if (config.limits.maxTeamMembers <= 0) {
      throw new ValidationError('Invalid max team members');
    }
    if (config.limits.maxScheduledPosts <= 0) {
      throw new ValidationError('Invalid max scheduled posts');
    }

    return config;
  }

  private loadEnvironmentOverrides() {
    // Load overrides from environment variables
    const env = import.meta.env;
    
    if (env.VITE_API_URL) {
      this.override('api.url', env.VITE_API_URL);
    }
    if (env.VITE_API_TIMEOUT) {
      this.override('api.timeout', parseInt(env.VITE_API_TIMEOUT, 10));
    }
    if (env.VITE_MAX_FILE_SIZE) {
      this.override('limits.maxFileSize', parseInt(env.VITE_MAX_FILE_SIZE, 10));
    }
    if (env.VITE_MAX_TEAM_MEMBERS) {
      this.override('limits.maxTeamMembers', parseInt(env.VITE_MAX_TEAM_MEMBERS, 10));
    }
    if (env.VITE_FEATURES) {
      try {
        const features = JSON.parse(env.VITE_FEATURES);
        this.override('features', features);
      } catch (error) {
        console.warn('Failed to parse features configuration:', error);
      }
    }
  }

  get<T>(key: string): T {
    return this.getNestedValue(key, this.config);
  }

  override(key: string, value: any) {
    this.setNestedValue(key, this.overrides, value);
    this.updateConfig();
  }

  reset(key?: string) {
    if (key) {
      this.deleteNestedValue(key, this.overrides);
    } else {
      this.overrides = {};
    }
    this.updateConfig();
  }

  private updateConfig() {
    this.config = this.validateConfig({
      ...defaultConfig,
      ...this.mergeOverrides(defaultConfig, this.overrides)
    });
  }

  private getNestedValue(path: string, obj: any): any {
    return path.split('.').reduce((current, key) => {
      if (current === undefined) return undefined;
      return current[key];
    }, obj);
  }

  private setNestedValue(path: string, obj: any, value: any) {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!(key in current)) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private deleteNestedValue(path: string, obj: any) {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!(key in current)) return undefined;
      return current[key];
    }, obj);
    if (target) {
      delete target[lastKey];
    }
  }

  private mergeOverrides(base: any, overrides: any): any {
    const result = { ...base };
    for (const key in overrides) {
      if (typeof overrides[key] === 'object' && !Array.isArray(overrides[key])) {
        result[key] = this.mergeOverrides(base[key] || {}, overrides[key]);
      } else {
        result[key] = overrides[key];
      }
    }
    return result;
  }

  getFullConfig(): Config {
    return { ...this.config };
  }

  isDevelopment(): boolean {
    return this.config.app.environment === 'development';
  }

  isStaging(): boolean {
    return this.config.app.environment === 'staging';
  }

  isProduction(): boolean {
    return this.config.app.environment === 'production';
  }

  isFeatureEnabled(feature: keyof Config['features']): boolean {
    return this.config.features[feature];
  }

  getApiUrl(): string {
    return this.config.api.url;
  }

  getEnvironment(): string {
    return this.config.app.environment;
  }
}

export const config = new ConfigManager();
export default config; 