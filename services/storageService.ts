import { Product, Transaction, Customer, User, StoreSettings } from '../types';
import { MOCK_PRODUCTS, MOCK_TRANSACTIONS, MOCK_CUSTOMERS, MOCK_USERS, DEFAULT_SETTINGS } from '../constants';
import { db } from './db';

// Initialize DB with mock data if empty
export const initializeDatabase = async () => {
  const isProductsEmpty = await db.isEmpty('products');
  
  if (isProductsEmpty) {
      console.log("Initializing Database with Seed Data...");
      await db.bulkPut('products', MOCK_PRODUCTS);
      await db.bulkPut('transactions', MOCK_TRANSACTIONS);
      await db.bulkPut('customers', MOCK_CUSTOMERS);
      await db.bulkPut('users', MOCK_USERS);
      await db.saveSettings(DEFAULT_SETTINGS);
      return true; // Indicates initialized
  }
  return false;
};

export const getBackupData = async () => {
  const products = await db.getAll<Product>('products');
  const transactions = await db.getAll<Transaction>('transactions');
  const customers = await db.getAll<Customer>('customers');
  const users = await db.getAll<User>('users');
  const settings = await db.getSettings() || DEFAULT_SETTINGS;

  return {
    products,
    transactions,
    customers,
    users,
    settings,
    timestamp: new Date().toISOString(),
    version: '2.0' // Bumped version for DB
  };
};

export const restoreBackup = async (jsonData: string) => {
  try {
    const data = JSON.parse(jsonData);
    
    // Clear existing
    await db.clear('products');
    await db.clear('transactions');
    await db.clear('customers');
    await db.clear('users');
    await db.clear('settings');

    if (data.products) await db.bulkPut('products', data.products);
    if (data.transactions) await db.bulkPut('transactions', data.transactions);
    if (data.customers) await db.bulkPut('customers', data.customers);
    if (data.users) await db.bulkPut('users', data.users);
    if (data.settings) await db.saveSettings(data.settings);
    
    return true;
  } catch (e) {
    console.error("Restore failed", e);
    return false;
  }
};

export const factoryReset = async (includeDemoData: boolean) => {
  await db.clear('products');
  await db.clear('transactions');
  await db.clear('customers');
  await db.clear('users');
  await db.clear('settings');

  if (includeDemoData) {
      await db.bulkPut('products', MOCK_PRODUCTS);
      await db.bulkPut('transactions', MOCK_TRANSACTIONS);
      await db.bulkPut('customers', MOCK_CUSTOMERS);
      await db.bulkPut('users', MOCK_USERS);
      await db.saveSettings(DEFAULT_SETTINGS);
  } else {
    // Keep at least one admin user so they aren't locked out
    await db.bulkPut('users', [{ id: 'u1', name: 'Admin', pin: '1234', role: 'ADMIN' }]);
    await db.saveSettings(DEFAULT_SETTINGS);
  }
};