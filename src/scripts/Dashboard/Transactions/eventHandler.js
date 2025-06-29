import * as state from './state.js';
import { setCurrentPage, setCurrentAccountId } from './state.js';
import { applyFiltersAndSort, render } from './renderer.js';
import { cleanupDropdowns } from './utils.js';
import { openModal } from './modals.js';

export function attachRowEventListeners(elements) {
  elements.tableContainer.onclick = (e) => {
    const menuBtn = e.target.closest('.menu-btn');
    if (menuBtn) {
      e.stopPropagation();
      cleanupDropdowns();
      const transaction = state.allTransactions.find(t => t.id == menuBtn.dataset.id);
      if (transaction) createDropdownMenu(elements, menuBtn, transaction);
    }
  };
}

function createDropdownMenu(elements, btn, transaction) {
  const dropdown = document.createElement("div");
  dropdown.className = "dropdown-menu absolute right-0 mt-2 w-32 bg-white border rounded-md shadow-lg z-50";
  dropdown.innerHTML = `
    <div class="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm" data-action="edit">Edit</div>
    <div class="px-3 py-2 hover:bg-red-100 text-red-600 cursor-pointer text-sm" data-action="delete">Delete</div>
  `;

  dropdown.onclick = (e) => {
    const action = e.target.dataset.action;
    cleanupDropdowns();
    if (action === 'edit') {
      openModal(elements, 'edit', transaction);
    } else if (action === 'delete') {
      openModal(elements, 'delete', transaction);
    }
  };
  
  btn.parentElement.appendChild(dropdown);
}

export function initMainEventListeners(elements) {
  document.addEventListener("click", (e) => {
    if (!e.target.closest('.menu-btn, .dropdown-menu')) {
      cleanupDropdowns();
    }

    const pageButton = e.target.closest('[data-page]');
    if (pageButton && !pageButton.disabled && !pageButton.classList.contains('opacity-50')) {
      setCurrentPage(parseInt(pageButton.dataset.page, 10));
      elements.section.scrollIntoView({ behavior: 'smooth' });
      render(elements);
    }
  });

  elements.filters.toggleButton.addEventListener('click', () => {
    elements.filters.controls.classList.toggle('hidden');
  });

  const applyAndRender = () => {
    applyFiltersAndSort(elements);
    render(elements);
    if(window.innerWidth < 768) {
        elements.filters.controls.classList.add('hidden');
    }
  };

  elements.filters.apply.addEventListener('click', applyAndRender);

  elements.filters.clear.addEventListener('click', () => {
    elements.filters.name.value = '';
    elements.filters.type.value = 'all';
    elements.filters.amount.value = '';
    elements.filters.date.value = '';
    elements.filters.sort.value = 'date-desc';
    applyAndRender();
  });

  window.addEventListener('resize', () => render(elements), { passive: true });

  window.addEventListener('accountChanged', (e) => {
    setCurrentAccountId(e.detail.accountId);
    applyAndRender();
  });
}