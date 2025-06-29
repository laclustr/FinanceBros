import * as state from './state.js';
import { setActiveTransaction } from './state.js';
import { updateTransaction, deleteTransaction, fetchTransactions } from './api.js';
import { applyFiltersAndSort, render } from './renderer.js';

export function openModal(elements, type, transaction) {
  setActiveTransaction(transaction);

  if (type === 'edit') {
    const { id, type: txType, title, amount, date } = transaction;
    elements.editModal.id.value = id;
    elements.editModal.type.value = txType;
    elements.editModal.title.value = title;
    elements.editModal.amount.value = Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const dateObj = new Date(date);
    const year = dateObj.getUTCFullYear();
    const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getUTCDate().toString().padStart(2, '0');
    elements.editModal.date.value = `${year}-${month}-${day}`;

    elements.editModal.modal.classList.remove('hidden');
    elements.editModal.modal.classList.add('flex');
  } else if (type === 'delete') {
    elements.deleteModal.modal.classList.remove('hidden');
    elements.deleteModal.modal.classList.add('flex');
  }
}

export function closeModal(elements) {
  elements.editModal.modal.classList.add('hidden');
  elements.editModal.modal.classList.remove('flex');
  elements.deleteModal.modal.classList.add('hidden');
  elements.deleteModal.modal.classList.remove('flex');
  setActiveTransaction(null);
}

async function refresh(elements) {
  await fetchTransactions();
  applyFiltersAndSort(elements);
  render(elements);
}

export function initModalEventListeners(elements) {
    elements.editModal.amount.addEventListener('input', (e) => {
        const input = e.target;
        let value = input.value.replace(/,/g, '');
        if (isNaN(value)) value = "0";
        
        const validChars = value.match(/^(\d*)(\.?)(\d{0,2})/);
        if(!validChars) return;

        let intPart = validChars[1] || '';
        let dot = validChars[2] || '';
        let decPart = validChars[3] || '';

        const intWithCommas = Number(intPart).toLocaleString('en-US');
        input.value = intWithCommas + dot + decPart;
    });

    elements.editModal.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dateValue = elements.editModal.date.value;
        const localDate = new Date(dateValue + 'T00:00:00');
        const amountValue = parseFloat(elements.editModal.amount.value.replace(/,/g, ''));

        const transactionData = {
            type: elements.editModal.type.value,
            id: parseInt(elements.editModal.id.value, 10),
            title: elements.editModal.title.value,
            amount: amountValue,
            date: localDate.toISOString(),
        };

        try {
            await updateTransaction(transactionData);
            closeModal(elements);
            await refresh(elements);
        } catch (err) {
            console.error("Error updating transaction:", err);
        }
    });

    elements.deleteModal.confirm.addEventListener('click', async () => {
        if (!state.activeTransaction) return;
        
        try {
            await deleteTransaction(state.activeTransaction);
            closeModal(elements);
            await refresh(elements);
        } catch (err) {
            console.error("Error deleting transaction:", err);
        }
    });

    elements.editModal.cancel.addEventListener('click', () => closeModal(elements));
    elements.deleteModal.cancel.addEventListener('click', () => closeModal(elements));
}