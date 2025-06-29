document.addEventListener('DOMContentLoaded', function() {
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
      'investment-asset': 'Please enter an asset name',
      'investment-amount': 'Please enter an investment amount'
    };

    function switchTab(targetTab) {
      tabButtons.forEach(button => {
        button.classList.remove('border-blue-600', 'text-blue-600');
        button.classList.add('border-transparent', 'text-gray-500');
      });

      tabContents.forEach(content => {
        content.classList.add('hidden');
      });

      const activeButton = document.querySelector(`[data-tab="${targetTab}"]`);
      activeButton.classList.add('border-blue-600', 'text-blue-600');
      activeButton.classList.remove('border-transparent', 'text-gray-500');

      const activeContent = document.getElementById(`${targetTab}-tab`);
      activeContent.classList.remove('hidden');
    }

    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        const targetTab = this.getAttribute('data-tab');
        switchTab(targetTab);
      });
    });

    switchTab('purchase');

    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input[type="text"], input[type="number"], input[type="date"]');
      const amountInputs = form.querySelectorAll('input[name="amount"]');

      amountInputs.forEach(input => {
        input.addEventListener('input', function() {
          const raw = this.value;
          const cursorStart = this.selectionStart;
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

          this.value = formattedValue;
          this.setSelectionRange(cursorStart + diff, cursorStart + diff);
        });
      });

      inputs.forEach(input => {
        input.addEventListener('blur', function() {
          validateField(this);
        });

        input.addEventListener('input', function() {
          const errorDiv = this.parentNode.querySelector('.error-message');
          if (errorDiv && !this.classList.contains('border-red-500')) {
            errorDiv.classList.add('hidden');
            this.classList.remove('border-red-500');
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
      } else if (field.type === 'date' && new Date(value) < new Date()) {
        if (fieldId === 'goal-deadline') {
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

    const investmentForm = document.getElementById('investment-form');

    if (investmentForm) {
      investmentForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const inputs = investmentForm.querySelectorAll('input[type="text"], input[type="number"]');
        const submitButton = investmentForm.querySelector('button[type="submit"]');
        const submitText = submitButton.querySelector('.submit-text');
        const loadingText = submitButton.querySelector('.loading-text');

        let isValid = true;
        inputs.forEach(input => {
          if (!validateField(input)) {
            isValid = false;
          }
        });

        if (!isValid) return;

        const amountField = investmentForm.querySelector('input[name="amount"]');
        if (amountField && amountField.value) {
          amountField.value = amountField.value.replace(/,/g, '');
        }

        submitText.classList.add('hidden');
        loadingText.classList.remove('hidden');
        submitButton.disabled = true;

        const formData = new FormData(investmentForm);

        try {
          const response = await fetch(investmentForm.action, {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();

          if (response.ok && result.success) {
            window.location.href = '/dashboard';
          } else {
            throw new Error(result.error || 'Something went wrong');
          }
        } catch (err) {
          console.error('Submission error:', err);
          submitText.classList.remove('hidden');
          loadingText.classList.add('hidden');
          submitButton.disabled = false;

          const assetInput = investmentForm.querySelector('#investment-asset');
          const errorDiv = assetInput?.parentNode?.querySelector('.error-message');
          if (errorDiv) {
            errorDiv.textContent = err.message;
            errorDiv.classList.remove('hidden');
            assetInput.classList.add('border-red-500');
          }
        }
      });
    }
  });