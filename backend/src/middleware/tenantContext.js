import { AsyncLocalStorage } from 'async_hooks';

const asyncLocalStorage = new AsyncLocalStorage();

export function runWithTenant(customerCode, callback) {
  return asyncLocalStorage.run({ customerCode: (customerCode || 'renic-pb').toLowerCase() }, callback);
}

export function getCurrentTenantCode() {
  const store = asyncLocalStorage.getStore();
  return store?.customerCode || 'renic-pb';
}

export default {
  runWithTenant,
  getCurrentTenantCode
};
