export const tableId = "transaction-manager-table";
export const ITEMS_PER_PAGE = 20;

export let allTransactions = [];
export let filteredTransactions = [];
export let currentPage = 1;
export let activeTransaction = null;
export let currentAccountId = 'all';

export function setAllTransactions(transactions) {
  allTransactions = transactions;
}

export function setFilteredTransactions(transactions) {
  filteredTransactions = transactions;
}

export function setCurrentPage(page) {
  currentPage = page;
}

export function setActiveTransaction(transaction) {
  activeTransaction = transaction;
}

export function setCurrentAccountId(accountId) {
  currentAccountId = accountId;
}