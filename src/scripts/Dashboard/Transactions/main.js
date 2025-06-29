import { tableId } from './state.js';
import { fetchTransactions } from './api.js';
import { applyFiltersAndSort, render } from './renderer.js';
import { initMainEventListeners } from './eventHandler.js';
import { initModalEventListeners } from './modals.js';

const elements = {
  section: document.getElementById("transaction-section"),
  tableContainer: document.getElementById(tableId),
  paginationWrapper: document.getElementById("pagination-wrapper"),
  editModal: {
    modal: document.getElementById("edit-modal"),
    form: document.getElementById("edit-form"),
    id: document.getElementById("edit-id"),
    type: document.getElementById("edit-type"),
    title: document.getElementById("edit-title"),
    amount: document.getElementById("edit-amount"),
    date: document.getElementById("edit-date"),
    cancel: document.getElementById("cancel-edit"),
  },
  deleteModal: {
    modal: document.getElementById("delete-modal"),
    cancel: document.getElementById("cancel-delete"),
    confirm: document.getElementById("confirm-delete"),
  },
  filters: {
    toggleButton: document.getElementById("filter-toggle-button"),
    controls: document.getElementById("filter-controls"),
    name: document.getElementById("filter-name"),
    type: document.getElementById("filter-type"),
    amount: document.getElementById("filter-amount"),
    date: document.getElementById("filter-date"),
    sort: document.getElementById("sort-by"),
    clear: document.getElementById("clear-filters"),
    apply: document.getElementById("apply-filters")
  },
};

async function initialize() {
  initMainEventListeners(elements);
  initModalEventListeners(elements);

  elements.tableContainer.innerHTML = '<div class="text-gray-500 p-4">Loading transactions...</div>';

  try {
    await fetchTransactions();
    applyFiltersAndSort(elements);
    render(elements);
  } catch (error) {
    elements.tableContainer.innerHTML = '<div class="p-4 text-red-600">Failed to load transactions.</div>';
  }
}

initialize();