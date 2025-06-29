let accountIndex = 0;
const form = document.getElementById('onboardingForm');
const accountsContainer = document.getElementById('accountsContainer');
const addAccountBtn = document.getElementById('addAccountBtn');
const errorMessage = document.getElementById('errorMessage');

const createAccountGroup = (index) => {
const wrapper = document.createElement('div');
wrapper.className = "account-group space-y-2 p-3 bg-white border border-gray-200 rounded-xl relative shadow-sm";
wrapper.innerHTML = `
    <div class="flex flex-col gap-2 md:flex-row md:gap-4">
    <div class="flex-1">
        <label for="account-name-${index}">Account Name <span class='text-red-500'>*</span></label>
        <input id="account-name-${index}" name="accountName[]" required class="w-full px-2 py-1 border rounded-md" />
    </div>
    <div class="flex-1">
        <label for="account-type-${index}">Type <span class='text-red-500'>*</span></label>
        <select id="account-type-${index}" name="accountType[]" required class="w-full px-2 py-1 border rounded-md">
        <option value="checking">Checking</option>
        <option value="savings">Savings</option>
        </select>
    </div>
    </div>
    <div>
    <label for="account-balance-${index}">Balance ($) <span class='text-red-500'>*</span></label>
    <input id="account-balance-${index}" name="accountBalance[]" inputmode="decimal" type="text" required class="balance-input w-full px-2 py-1 border rounded-md appearance-none" />
    </div>
    <button type="button" class="absolute top-2 right-2 text-red-500 text-sm hover:underline remove-account-btn">Remove</button>
`;
return wrapper;
};

const addAccount = () => {
const group = createAccountGroup(accountIndex++);
accountsContainer.appendChild(group);
};

addAccountBtn.addEventListener('click', addAccount);
window.addEventListener('DOMContentLoaded', addAccount);

accountsContainer.addEventListener('click', (e) => {
if (e.target.classList.contains('remove-account-btn')) {
    e.target.closest('.account-group')?.remove();
}
});

accountsContainer.addEventListener('input', (e) => {
const input = e.target;
if (!input.matches('.balance-input')) return;

const raw = input.value;
const cursorStart = input.selectionStart;

let value = raw.replace(/,/g, '');

const validChars = value.match(/^(\d*)(\.?)(\d*)/) || [];
let intPart = validChars[1] || '';
let dot = validChars[2] || '';
let decPart = validChars[3] || '';

if (decPart.length > 2) {
const rounded = Math.round(parseFloat(intPart + '.' + decPart) * 100) / 100;
const [newInt, newDec = ''] = rounded.toFixed(2).split('.');
intPart = newInt;
decPart = newDec;
dot = '.';
}

const intWithCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

let formattedValue = intWithCommas;
if (dot) {
formattedValue += '.' + decPart;
}

const oldLeft = raw.slice(0, cursorStart);
const newLeft = formattedValue.slice(0, cursorStart);
const commasBefore = (oldLeft.match(/,/g) || []).length;
const commasAfter = (newLeft.match(/,/g) || []).length;
const diff = commasAfter - commasBefore;

input.value = formattedValue;
input.setSelectionRange(cursorStart + diff, cursorStart + diff);
});

form.addEventListener('submit', async (e) => {
e.preventDefault();
errorMessage.textContent = '';

const formData = new FormData(form);
const firstName = formData.get('firstName')?.trim();
const lastName = formData.get('lastName')?.trim();
const age = parseInt(formData.get('age'));
const income = formData.get('income');
const employer = formData.get('employer');
const creditScore = parseInt(formData.get('creditScore'));

const accountNames = formData.getAll('accountName[]');
const accountTypes = formData.getAll('accountType[]');
const accountBalances = formData.getAll('accountBalance[]');

if (!firstName || !lastName) {
    errorMessage.textContent = 'Please enter your full name';
    return;
}

if (!age || age < 13) {
    errorMessage.textContent = 'Please enter a valid age (13 or older)';
    return;
}

if (!income) {
    errorMessage.textContent = 'Please select your income range';
    return;
}

if (!creditScore || creditScore < 300 || creditScore > 850) {
    errorMessage.textContent = 'Credit score must be between 300 and 850';
    return;
}

if (accountNames.length === 0) {
    errorMessage.textContent = 'Please enter at least one bank account';
    return;
}

const accounts = accountNames.map((name, i) => ({
    name,
    type: accountTypes[i],
    balance: parseFloat(accountBalances[i].replace(/,/g, '')) || 0,
}));

if (accounts.some(acc => !acc.name || !acc.type || acc.balance <= 0)) {
    errorMessage.textContent = 'Each account must have a valid name, type, and positive balance';
    return;
}

const payload = {
    firstName,
    lastName,
    age,
    income,
    employer,
    creditScore,
    accounts,
};

try {
    const res = await fetch('/api/user/push/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    });

    if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || 'Something went wrong during onboarding.');
    }

    window.location.href = '/dashboard';
} catch (err) {
    errorMessage.textContent = err.message;
}
});