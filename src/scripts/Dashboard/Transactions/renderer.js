import * as state from './state.js';
import { formatDateString, truncateText } from './utils.js';
import { attachRowEventListeners } from './eventHandler.js';
import { setFilteredTransactions, setCurrentPage } from './state.js';

export function applyFiltersAndSort(elements) {
  const { name, type, amount, date, sort } = elements.filters;

  const accountFiltered = state.currentAccountId === 'all'
    ? state.allTransactions
    : state.allTransactions.filter(t => String(t.bankAccountId) === String(state.currentAccountId));

  const otherFiltered = accountFiltered.filter(t => {
    const matchName = !name.value || t.title.toLowerCase().includes(name.value.trim().toLowerCase());
    const matchType = type.value === 'all' || t.type === type.value;
    const matchAmount = !amount.value || Math.abs(t.amount) <= +amount.value;
    const matchDate = !date.value || new Date(t.date).toISOString().slice(0, 10) === date.value;
    return matchName && matchType && matchAmount && matchDate;
  });

  otherFiltered.sort((a, b) => {
    switch (sort.value) {
      case "date-asc": {
        const dateDiff = new Date(a.date) - new Date(b.date);
        return dateDiff !== 0 ? dateDiff : a.id - b.id;
      }
      case "amount-desc":
        return Math.abs(b.amount) - Math.abs(a.amount);
      case "amount-asc":
        return Math.abs(a.amount) - Math.abs(b.amount);
      default: {
        const dateDiff = new Date(b.date) - new Date(a.date);
        return dateDiff !== 0 ? dateDiff : b.id - a.id;
      }
    }
  });

  setFilteredTransactions(otherFiltered);

  if (Math.ceil(state.filteredTransactions.length / state.ITEMS_PER_PAGE) < state.currentPage) {
    setCurrentPage(1);
  }
}

export function render(elements) {
  renderTable(elements);
  renderPagination(elements);
  attachRowEventListeners(elements);
}

function renderTable(elements) {
  if (!state.filteredTransactions.length) {
    elements.tableContainer.innerHTML = `<div class="p-4 text-gray-500">No transactions found for the selected criteria.</div>`;
    return;
  }
  const pagedList = state.filteredTransactions.slice((state.currentPage - 1) * state.ITEMS_PER_PAGE, state.currentPage * state.ITEMS_PER_PAGE);
  const isMobile = window.innerWidth < 768;
  const tableContent = pagedList.map(t => isMobile ? createMobileCard(t) : createDesktopRow(t)).join('');

  if (isMobile) {
    elements.tableContainer.className = "bg-transparent shadow-none";
    elements.tableContainer.innerHTML = `<div class="p-0 sm:p-0">${tableContent}</div>`;
  } else {
    elements.tableContainer.className = "bg-white rounded-xl shadow text-sm mb-6 relative";
    elements.tableContainer.innerHTML = `
      <table class="w-full table-fixed text-sm border-collapse">
        <thead class="bg-gray-100/70 text-gray-600">
          <tr><th class="w-2/5 px-4 py-3 text-left font-medium">Title</th><th class="w-1/4 px-4 py-3 text-left font-medium">Amount</th><th class="w-1/4 px-4 py-3 text-left font-medium">Date</th><th class="w-1/6 px-4 py-3 text-left font-medium">Type</th><th class="w-12 px-4 py-3"></th></tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">${tableContent}</tbody>
      </table>`;
  }
}

function createMobileCard(t) {
    return `
      <div class="p-4 bg-white mb-2 rounded-lg border border-gray-200/80">
        <div class="flex justify-between items-center">
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-800 truncate">${truncateText(t.title, 25)}</div>
            <div class="text-sm text-gray-500 mt-1">${formatDateString(t.date)}</div>
          </div>
          <div class="flex items-center ml-4">
            <div class="font-semibold text-base ${t.type === 'deposit' ? 'text-green-600' : 'text-red-600'} mr-3">
              ${t.type === 'deposit' ? '+' : '-'}$${Math.abs(t.amount).toFixed(2)}
            </div>
            <div class="relative"><button class="menu-btn p-2 rounded-full hover:bg-gray-100" data-id="${t.id}"><svg class="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/></svg></button></div>
          </div>
        </div>
      </div>`;
}

function createDesktopRow(t) {
    return `
      <tr class="hover:bg-gray-50">
        <td class="px-4 py-3 truncate">${truncateText(t.title, 35)}</td>
        <td class="px-4 py-3 font-semibold ${t.type === 'deposit' ? 'text-green-600' : 'text-red-600'}">$${Math.abs(t.amount).toFixed(2)}</td>
        <td class="px-4 py-3 text-gray-500">${formatDateString(t.date)}</td>
        <td class="px-4 py-3 text-gray-500">${t.type === 'deposit' ? "Deposit" : "Purchase"}</td>
        <td class="px-4 py-3 text-right relative"><button class="menu-btn p-1 rounded-full hover:bg-gray-200" data-id="${t.id}"><svg class="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg></button></td>
      </tr>`;
}

function generatePaginationItems(currentPage, totalPages) {
    const delta = 1;
    const range = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
    }
    if (currentPage - delta > 2) range.unshift('...');
    if (currentPage + delta < totalPages - 1) range.push('...');
    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);
    return [...new Set(range)];
}

function renderPagination(elements) {
    elements.paginationWrapper.innerHTML = "";
    const totalItems = state.filteredTransactions.length;
    if (totalItems <= state.ITEMS_PER_PAGE) return;

    const totalPages = Math.ceil(totalItems / state.ITEMS_PER_PAGE);

    const pageItems = generatePaginationItems(state.currentPage, totalPages).map(page => {
        if (page === '...') return `<li><span class="px-3 py-2">...</span></li>`;
        const activeClasses = 'bg-blue-600 text-white border-blue-600';
        const defaultClasses = 'bg-white hover:bg-gray-100';
        return `<li><button data-page="${page}" class="px-3 py-2 leading-tight border rounded-md ${page === state.currentPage ? activeClasses : defaultClasses}">${page}</button></li>`;
    }).join('');

    const prevDisabled = state.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : '';
    const nextDisabled = state.currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : '';

    elements.paginationWrapper.innerHTML = `
      <ul class="inline-flex items-center -space-x-px text-sm gap-1">
        <li><button data-page="${state.currentPage - 1}" class="px-3 py-2 leading-tight bg-white border rounded-md hover:bg-gray-100 ${prevDisabled}">Previous</button></li>
        ${pageItems}
        <li><button data-page="${state.currentPage + 1}" class="px-3 py-2 leading-tight bg-white border rounded-md hover:bg-gray-100 ${nextDisabled}">Next</button></li>
      </ul>`;
}