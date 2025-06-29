const balanceDisplay = document.getElementById('balance-display');
const accountSelect = document.getElementById('account-select');

let accounts = [];

function formatCurrency(amount) {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
}

function updateBalance(accountId) {
  let total = 0;

  if (accountId === 'all') {
    total = accounts.reduce((sum, acc) => {
      const balance = parseFloat(acc.balance || 0);
      return sum + balance;
    }, 0);
    console.log('Total for all accounts:', total);
  } else {
    const acc = accounts.find(a => String(a.id) === String(accountId));
    console.log('Found account:', acc);

    if (acc) {
      total = parseFloat(acc.balance || 0);
    } else {
      console.error('Account not found for ID:', accountId);
    }
  }

  balanceDisplay.textContent = formatCurrency(total);
  window.currentBalance = total;

  window.dispatchEvent(new CustomEvent('accountChanged', {
    detail: { accountId: accountId }
  }));

  balanceDisplay.style.transform = 'scale(1.05)';
  setTimeout(() => {
    balanceDisplay.style.transform = 'scale(1)';
  }, 200);
}

function populateAccountOptions() {
  accountSelect.innerHTML = '<option value="all">All Accounts</option>';

  accounts.forEach(account => {
    const option = document.createElement('option');
    option.value = account.id;
    option.textContent = `${account.name}`;
    accountSelect.appendChild(option);
  });

  console.log('Populated options for accounts:', accounts.map(a => ({
    id: a.id,
    name: a.name,
    balance: a.balance,
    idType: typeof a.id
  })));
}

accountSelect.addEventListener('change', (e) => {
  updateBalance(e.target.value);
});

async function fetchAccounts() {
  try {
    const res = await fetch('/api/user/fetch/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to fetch accounts');
    accounts = await res.json();

    populateAccountOptions();
    updateBalance('all');
  } catch (err) {
    console.error('Error loading accounts:', err);
    balanceDisplay.textContent = 'Error loading balance';
    balanceDisplay.className = 'font-bold text-2xl text-red-600';
  }
}

balanceDisplay.style.transition = 'transform 0.2s ease-in-out';
fetchAccounts();
