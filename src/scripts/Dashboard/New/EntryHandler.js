document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  const validationMessages = {
    'purchase-title': 'Please enter a purchase title',
    'purchase-amount': 'Please enter a valid amount',
    'deposit-title': 'Please enter an income source',
    'deposit-amount': 'Please enter a valid amount',
    'goal-title': 'Please enter a goal title',
    'goal-target': 'Please enter a target amount',
    'goal-deadline': 'Please select a target date',
  };

  function switchTab(targetTab) {
    tabButtons.forEach(button => {
      button.classList.remove('border-blue-600', 'text-blue-600');
      button.classList.add('border-transparent', 'text-gray-500');
    });

    tabContents.forEach(content => content.classList.add('hidden'));

    const activeButton = document.querySelector(`[data-tab="${targetTab}"]`);
    const activeContent = document.getElementById(`${targetTab}-tab`);

    if (activeButton) {
      activeButton.classList.add('border-blue-600', 'text-blue-600');
      activeButton.classList.remove('border-transparent', 'text-gray-500');
    }

    if (activeContent) {
      activeContent.classList.remove('hidden');
    }
  }

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  switchTab('purchase');

  document.querySelectorAll('form').forEach(form => {
    const inputs = form.querySelectorAll('input[type="text"], input[type="number"], input[name="target"], input[type="date"]');

    form.querySelectorAll('input[name="amount"], input[name="target"]').forEach(input => {
      input.addEventListener('input', function () {
        const raw = this.value;
        const cursorStart = this.selectionStart;

        let value = raw.replace(/,/g, '');
        const valid = value.match(/^(\d*)(\.?)(\d*)/) || [];
        let [_, intPart = '', dot = '', decPart = ''] = valid;

        if (decPart.length > 2) {
          const rounded = Math.round(parseFloat(intPart + '.' + decPart) * 100) / 100;
          [intPart, decPart = ''] = rounded.toFixed(2).split('.');
          dot = '.';
        }

        const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        let formatted = formattedInt + (dot ? '.' + decPart : '');

        const oldLeft = raw.slice(0, cursorStart);
        const newLeft = formatted.slice(0, cursorStart);
        const diff = (newLeft.match(/,/g) || []).length - (oldLeft.match(/,/g) || []).length;

        this.value = formatted;
        this.setSelectionRange(cursorStart + diff, cursorStart + diff);
      });
    });

    inputs.forEach(input => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => {
        const errorDiv = input.parentNode.querySelector('.error-message');
        if (errorDiv && input.classList.contains('border-red-500')) {
          errorDiv.classList.add('hidden');
          input.classList.remove('border-red-500');
        }
      });
    });
  });

  function validateField(field) {
    const value = field.value.trim();
    const errorDiv = field.parentNode.querySelector('.error-message');
    const fieldId = field.id;
    let isValid = true;
    let errorMessage = '';

    if (!value) {
      isValid = false;
      errorMessage = validationMessages[fieldId] || 'This field is required';
    } else if (
      field.name === 'amount' &&
      (value === '' || isNaN(value.replace(/,/g, '')) || parseFloat(value.replace(/,/g, '')) <= 0)
    ) {
      isValid = false;
      errorMessage = 'Please enter a valid positive number';
    } else if (field.type === 'date') {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (fieldId === 'goal-deadline' && selectedDate < today) {
        isValid = false;
        errorMessage = 'Please select a future date';
      }
    }

    if (!isValid) {
      field.classList.add('border-red-500');
      if (errorDiv) {
        errorDiv.textContent = errorMessage;
        errorDiv.classList.remove('hidden');
      }
    } else {
      field.classList.remove('border-red-500');
      if (errorDiv) {
        errorDiv.classList.add('hidden');
      }
    }

    return isValid;
  }
});