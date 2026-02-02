
import { StudySession, TimerSettings, StreakLog, StreakSettings } from '../types';
import { DB_NAME, DB_VERSION, STORE_NAME, SETTINGS_STORE_NAME, STREAK_STORE_NAME, DEFAULT_SETTINGS, DEFAULT_STREAK_SETTINGS } from '../constants';

export class IDBService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error("IndexedDB error:", event);
        reject("Error opening database");
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = (event.target as IDBOpenDBRequest).transaction;
        
        // 1. Sessions Store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('subject', 'subject', { unique: false });
        } else {
           // Maintenance for existing store if needed
           const objectStore = transaction!.objectStore(STORE_NAME);
           if (!objectStore.indexNames.contains('timestamp')) objectStore.createIndex('timestamp', 'timestamp', { unique: false });
           if (!objectStore.indexNames.contains('subject')) objectStore.createIndex('subject', 'subject', { unique: false });
        }

        // 2. Settings Store
        if (!db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
          db.createObjectStore(SETTINGS_STORE_NAME, { keyPath: 'id' });
        }

        // 3. Streak Logs Store (Secret App)
        if (!db.objectStoreNames.contains(STREAK_STORE_NAME)) {
            const streakStore = db.createObjectStore(STREAK_STORE_NAME, { keyPath: 'id', autoIncrement: true });
            streakStore.createIndex('endDate', 'endDate', { unique: false });
        }
      };
    });
  }

  // --- Main App Methods ---

  async addSession(session: StudySession): Promise<number> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("Database not initialized");
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(session);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async updateSession(session: StudySession): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("Database not initialized");
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(session);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllSessions(): Promise<StudySession[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("Database not initialized");
      try {
        const transaction = this.db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('timestamp');
        const request = index.openCursor(null, 'prev');
        const results: StudySession[] = [];
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };
        request.onerror = () => reject(request.error);
      } catch (error) {
        // Fallback
        const transaction = this.db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve((request.result as StudySession[]).reverse());
        request.onerror = () => reject(request.error);
      }
    });
  }

  async deleteSession(id: number): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
       if (!this.db) return reject("Database not initialized");
       const transaction = this.db.transaction([STORE_NAME], 'readwrite');
       const store = transaction.objectStore(STORE_NAME);
       const request = store.delete(id);
       request.onsuccess = () => resolve();
       request.onerror = () => reject(request.error);
    });
  }

  async getSettings(): Promise<TimerSettings> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("Database not initialized");
      const transaction = this.db.transaction([SETTINGS_STORE_NAME], 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE_NAME);
      const request = store.get('user_settings');
      request.onsuccess = () => {
        if (request.result) {
          const merged = { ...DEFAULT_SETTINGS, ...request.result.value };
          if ('pomodoroDuration' in request.result.value && !('focusDuration' in request.result.value)) {
              merged.focusDuration = request.result.value.pomodoroDuration * 60;
          }
          resolve(merged);
        } else {
          resolve(DEFAULT_SETTINGS);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveSettings(settings: TimerSettings): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("Database not initialized");
      const transaction = this.db.transaction([SETTINGS_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE_NAME);
      const request = store.put({ id: 'user_settings', value: settings });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- Secret App Methods ---

  async getStreakSettings(): Promise<StreakSettings> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
        if (!this.db) return reject("Database not initialized");
        const transaction = this.db.transaction([SETTINGS_STORE_NAME], 'readonly');
        const store = transaction.objectStore(SETTINGS_STORE_NAME);
        const request = store.get('streak_settings');
        request.onsuccess = () => {
            resolve(request.result ? request.result.value : DEFAULT_STREAK_SETTINGS);
        };
        request.onerror = () => reject(request.error);
    });
  }

  async saveStreakSettings(settings: StreakSettings): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
        if (!this.db) return reject("Database not initialized");
        const transaction = this.db.transaction([SETTINGS_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(SETTINGS_STORE_NAME);
        const request = store.put({ id: 'streak_settings', value: settings });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
  }

  async addStreakLog(log: StreakLog): Promise<void> {
      if (!this.db) await this.init();
      return new Promise((resolve, reject) => {
          if (!this.db) return reject("Database not initialized");
          const transaction = this.db.transaction([STREAK_STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STREAK_STORE_NAME);
          const request = store.add(log);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
      });
  }

  async getStreakLogs(): Promise<StreakLog[]> {
      if (!this.db) await this.init();
      return new Promise((resolve, reject) => {
          if (!this.db) return reject("Database not initialized");
          const transaction = this.db.transaction([STREAK_STORE_NAME], 'readonly');
          const store = transaction.objectStore(STREAK_STORE_NAME);
          // Get all, sort by ID/date implicitly
          const request = store.getAll();
          request.onsuccess = () => {
              const logs = request.result as StreakLog[];
              // Return newest first
              resolve(logs.sort((a, b) => b.endDate - a.endDate));
          };
          request.onerror = () => reject(request.error);
      });
  }
}

export const dbService = new IDBService();
