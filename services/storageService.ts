
import { Product, Transaction, Customer, User, StoreSettings } from '../types';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, MOCK_USERS, DEFAULT_SETTINGS } from '../constants';

const KEYS = {
  PRODUCTS: 'qikpos_products',
  TRANSACTIONS: 'qikpos_transactions',
  CUSTOMERS: 'qikpos_customers',
  USERS: 'qikpos_users',
  SETTINGS: 'qikpos_settings'
};

export const loadData = <T>(key: string, defaultValue: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error(`Failed to parse ${key}`, e);
    return defaultValue;
  }
};

export const saveData = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const getBackupData = () => {
  return {
    products: loadData(KEYS.PRODUCTS, MOCK_PRODUCTS),
    transactions: loadData(KEYS.TRANSACTIONS, MOCK_TRANSACTIONS),
    customers: loadData(KEYS.CUSTOMERS, MOCK_CUSTOMERS),
    users: loadData(KEYS.USERS, MOCK_USERS),
    settings: loadData(KEYS.SETTINGS, DEFAULT_SETTINGS),
    timestamp: new Date().toISOString(),
    version: '1.0'
  };
};

export const restoreBackup = (jsonData: string) => {
  try {
    const data = JSON.parse(jsonData);
    if (data.products) saveData(KEYS.PRODUCTS, data.products);
    if (data.transactions) saveData(KEYS.TRANSACTIONS, data.transactions);
    if (data.customers) saveData(KEYS.CUSTOMERS, data.customers);
    if (data.users) saveData(KEYS.USERS, data.users);
    if (data.settings) saveData(KEYS.SETTINGS, data.settings);
    return true;
  } catch (e) {
    console.error("Restore failed", e);
    return false;
  }
};

export const factoryReset = (includeDemoData: boolean) => {
  if (includeDemoData) {
    saveData(KEYS.PRODUCTS, MOCK_PRODUCTS);
    saveData(KEYS.TRANSACTIONS, MOCK_TRANSACTIONS);
    saveData(KEYS.CUSTOMERS, MOCK_CUSTOMERS);
    saveData(KEYS.USERS, MOCK_USERS);
    saveData(KEYS.SETTINGS, DEFAULT_SETTINGS);
  } else {
    saveData(KEYS.PRODUCTS, []);
    saveData(KEYS.TRANSACTIONS, []);
    saveData(KEYS.CUSTOMERS, []);
    // Keep at least one admin user so they aren't locked out
    saveData(KEYS.USERS, [{ id: 'u1', name: 'Admin', pin: '1234', role: 'ADMIN' }]);
    saveData(KEYS.SETTINGS, DEFAULT_SETTINGS);
  }
};

export { KEYS };
