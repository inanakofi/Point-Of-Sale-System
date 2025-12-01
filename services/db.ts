import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Product, Transaction, Customer, User, StoreSettings } from '../types';

interface QikPOSDB extends DBSchema {
  products: {
    key: string;
    value: Product;
  };
  transactions: {
    key: string;
    value: Transaction;
  };
  customers: {
    key: string;
    value: Customer;
  };
  users: {
    key: string;
    value: User;
  };
  settings: {
    key: string;
    value: StoreSettings;
  };
}

const DB_NAME = 'qikpos-db';
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB<QikPOSDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('customers')) {
        db.createObjectStore('customers', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
         db.createObjectStore('settings');
      }
    },
  });
};

export const db = {
  async getAll<T>(storeName: keyof QikPOSDB): Promise<T[]> {
    const db = await initDB();
    return db.getAll(storeName) as Promise<T[]>;
  },
  
  async getSettings(): Promise<StoreSettings | undefined> {
    const db = await initDB();
    return db.get('settings', 'main_config');
  },

  async saveSettings(settings: StoreSettings) {
    const db = await initDB();
    return db.put('settings', settings, 'main_config');
  },

  async add<T>(storeName: keyof QikPOSDB, value: T) {
     const db = await initDB();
     return db.put(storeName, value);
  },

  async update<T>(storeName: keyof QikPOSDB, value: T) {
    const db = await initDB();
    return db.put(storeName, value);
 },
  
  async delete(storeName: keyof QikPOSDB, key: string) {
    const db = await initDB();
    return db.delete(storeName, key);
  },
  
  // Bulk add for restore/init
  async bulkPut<T>(storeName: keyof QikPOSDB, values: T[]) {
    const db = await initDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await Promise.all(values.map(val => store.put(val)));
    await tx.done;
  },

  async clear(storeName: keyof QikPOSDB) {
      const db = await initDB();
      return db.clear(storeName);
  },

  async isEmpty(storeName: keyof QikPOSDB) {
      const db = await initDB();
      const count = await db.count(storeName);
      return count === 0;
  }
};