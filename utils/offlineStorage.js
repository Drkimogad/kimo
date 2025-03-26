const DB_NAME = 'kimo-ai';
const DB_VERSION = 3; // Incremented for new schema
const STORE_NAMES = {
    HISTORY: 'history',
    CACHE: 'model-cache',
    SETTINGS: 'settings'
};

export class OfflineStorage {
    static #db = null;
    static #initialized = false;

    static async init() {
        if (this.#initialized) return this.#db;
        
        try {
            this.#db = await this.#openDatabase();
            this.#initialized = true;
            console.debug('IndexedDB initialized');
            return this.#db;
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw new Error('OFFLINE_STORAGE_UNAVAILABLE');
        }
    }

    static async #openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create or upgrade stores
                if (!db.objectStoreNames.contains(STORE_NAMES.HISTORY)) {
                    const store = db.createObjectStore(STORE_NAMES.HISTORY, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('type', 'type', { unique: false });
                }

                if (!db.objectStoreNames.contains(STORE_NAMES.CACHE)) {
                    const cacheStore = db.createObjectStore(STORE_NAMES.CACHE, {
                        keyPath: 'key'
                    });
                    cacheStore.createIndex('expires', 'expires', { unique: false });
                }

                if (!db.objectStoreNames.contains(STORE_NAMES.SETTINGS)) {
                    db.createObjectStore(STORE_NAMES.SETTINGS, {
                        keyPath: 'name'
                    });
                }
            };

            request.onsuccess = () => {
                const db = request.result;
                
                // Add version change listener for future upgrades
                db.onversionchange = () => {
                    db.close();
                    console.log('Database updated elsewhere - reopening');
                    this.#initialized = false;
                    this.init();
                };
                
                resolve(db);
            };

            request.onerror = () => {
                console.error('Database open error:', request.error);
                reject(request.error);
            };

            request.onblocked = () => {
                console.warn('Database upgrade blocked by other connections');
                reject(new Error('DATABASE_BLOCKED'));
            };
        });
    }

    static async add(storeName, data) {
        try {
            const db = await this.init();
            return await new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, 'readwrite');
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
                
                const store = tx.objectStore(storeName);
                const item = {
                    ...data,
                    timestamp: data.timestamp || Date.now(),
                    id: data.id || this.#generateId()
                };
                store.add(item);
            });
        } catch (error) {
            console.error('Add operation failed:', error);
            throw this.#wrapError(error);
        }
    }

    static async getAll(storeName, options = {}) {
        try {
            const db = await this.init();
            return await new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, 'readonly');
                const store = tx.objectStore(storeName);
                let request;
                
                if (options.index && options.range) {
                    const index = store.index(options.index);
                    request = index.getAll(options.range);
                } else {
                    request = store.getAll();
                }
                
                request.onsuccess = () => {
                    const results = request.result || [];
                    resolve(options.limit ? results.slice(0, options.limit) : results);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('GetAll operation failed:', error);
            throw this.#wrapError(error);
        }
    }

    // New Methods
    static async getByType(storeName, type, limit = 50) {
        return this.getAll(storeName, {
            index: 'type',
            range: IDBKeyRange.only(type),
            limit
        });
    }

    static async clearStore(storeName) {
        try {
            const db = await this.init();
            return await new Promise((resolve, reject) => {
                const tx = db.transaction(storeName, 'readwrite');
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
                tx.objectStore(storeName).clear();
            });
        } catch (error) {
            console.error('Clear operation failed:', error);
            throw this.#wrapError(error);
        }
    }

    static async cacheModel(key, data, ttl = 3600) {
        await this.add(STORE_NAMES.CACHE, {
            key,
            data,
            expires: Date.now() + (ttl * 1000)
        });
    }

    static async getCachedModel(key) {
        const db = await this.init();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAMES.CACHE, 'readonly');
            const store = tx.objectStore(STORE_NAMES.CACHE);
            const request = store.get(key);
            
            request.onsuccess = () => {
                const item = request.result;
                if (item && item.expires > Date.now()) {
                    resolve(item.data);
                } else {
                    if (item) {
                        // Cleanup expired item
                        store.delete(key);
                    }
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Private helpers
    static #generateId() {
        return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    static #wrapError(error) {
        return new Error(`STORAGE_ERROR: ${error.message}`);
    }

    // Maintenance
    static async cleanup() {
        try {
            const db = await this.init();
            const tx = db.transaction(STORE_NAMES.CACHE, 'readwrite');
            const store = tx.objectStore(STORE_NAMES.CACHE);
            const index = store.index('expires');
            const range = IDBKeyRange.upperBound(Date.now());
            
            const expiredKeys = await new Promise((resolve) => {
                const request = index.getAllKeys(range);
                request.onsuccess = () => resolve(request.result);
            });
            
            await Promise.all(expiredKeys.map(key => 
                new Promise((resolve) => {
                    const deleteRequest = store.delete(key);
                    deleteRequest.onsuccess = resolve;
                })
            );
            
            console.log(`Cleaned up ${expiredKeys.length} expired items`);
        } catch (error) {
            console.error('Cleanup failed:', error);
        }
    }
}

// Automatic maintenance
if (typeof window !== 'undefined') {
    // Run cleanup every hour
    setInterval(() => OfflineStorage.cleanup(), 3600000);
    
    // Initial cleanup
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => OfflineStorage.cleanup(), 5000);
    });
}
