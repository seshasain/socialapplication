import { ValidationError } from '../types/errors';

interface StorageOptions {
  encrypt?: boolean;
  ttl?: number;
}

interface StorageItem<T> {
  value: T;
  timestamp: number;
  expiresAt?: number;
  version: string;
}

const APP_VERSION = '1.0.0'; // Should match your app version
const ENCRYPTION_KEY = process.env.VITE_ENCRYPTION_KEY || 'default-key';

class Storage {
  private prefix: string;

  constructor(prefix: string = 'app') {
    this.prefix = prefix;
  }

  async set<T>(key: string, value: T, options: StorageOptions = {}): Promise<void> {
    try {
      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        version: APP_VERSION
      };

      if (options.ttl) {
        item.expiresAt = Date.now() + options.ttl;
      }

      const serialized = JSON.stringify(item);
      const finalValue = options.encrypt ? await this.encrypt(serialized) : serialized;
      
      localStorage.setItem(this.getKey(key), finalValue);
    } catch (error) {
      console.error('Failed to store item:', error);
      throw new ValidationError('Failed to store item');
    }
  }

  async get<T>(key: string, options: StorageOptions = {}): Promise<T | null> {
    try {
      const value = localStorage.getItem(this.getKey(key));
      if (!value) return null;

      const decrypted = options.encrypt ? await this.decrypt(value) : value;
      const item: StorageItem<T> = JSON.parse(decrypted);

      // Check version
      if (item.version !== APP_VERSION) {
        this.remove(key);
        return null;
      }

      // Check expiration
      if (item.expiresAt && item.expiresAt < Date.now()) {
        this.remove(key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.error('Failed to retrieve item:', error);
      return null;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.getKey(key));
  }

  clear(): void {
    const keys = this.getAllKeys();
    keys.forEach(key => this.remove(key));
  }

  async clearExpired(): Promise<void> {
    const keys = this.getAllKeys();
    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (!value) continue;

      try {
        const item: StorageItem<any> = JSON.parse(value);
        if (item.expiresAt && item.expiresAt < Date.now()) {
          this.remove(key.replace(this.prefix + ':', ''));
        }
      } catch {
        // If we can't parse the item, remove it
        this.remove(key.replace(this.prefix + ':', ''));
      }
    }
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  private getAllKeys(): string[] {
    return Object.keys(localStorage).filter(key => key.startsWith(this.prefix + ':'));
  }

  private async encrypt(value: string): Promise<string> {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      console.warn('Encryption not supported in this environment');
      return value;
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(value);
      
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(ENCRYPTION_KEY),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const key = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt']
      );

      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        data
      );

      // Combine salt, iv, and encrypted data
      const combined = new Uint8Array(salt.length + iv.length + new Uint8Array(encrypted).length);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encrypted), salt.length + iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      return value;
    }
  }

  private async decrypt(value: string): Promise<string> {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      console.warn('Decryption not supported in this environment');
      return value;
    }

    try {
      const combined = new Uint8Array(
        atob(value)
          .split('')
          .map(char => char.charCodeAt(0))
      );

      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const data = combined.slice(28);

      const encoder = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(ENCRYPTION_KEY),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      const key = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['decrypt']
      );

      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        data
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      return value;
    }
  }
}

// Create instances for different storage purposes
export const appStorage = new Storage('app');
export const authStorage = new Storage('auth');
export const cacheStorage = new Storage('cache');

// Type-safe storage hooks
export function createTypedStorage<T>(key: string, storage = appStorage) {
  return {
    get: (options?: StorageOptions) => storage.get<T>(key, options),
    set: (value: T, options?: StorageOptions) => storage.set<T>(key, value, options),
    remove: () => storage.remove(key)
  };
}

// Example usage:
// const userPreferences = createTypedStorage<UserPreferences>('preferences');
// await userPreferences.set({ theme: 'dark' }, { encrypt: true }); 