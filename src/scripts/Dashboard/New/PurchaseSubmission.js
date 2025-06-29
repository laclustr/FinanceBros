window.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById('purchase-form');
    const errorDiv = document.getElementById('purchase-error-message');
    const successDiv = document.getElementById('purchase-success-message');
    const errorText = errorDiv.querySelector('.purchase-error-text');
    const successText = successDiv.querySelector('.purchase-success-text');
    const submitButton = form.querySelector('button[type="submit"]');
    const submitText = submitButton.querySelector('.submit-text');
    const loadingText = submitButton.querySelector('.loading-text');

    const select = form.querySelector('#purchase-account');

    try {
      const res = await fetch('/api/user/fetch/accounts', {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        select.innerHTML = '';
        
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.disabled = true;
        defaultOption.selected = true;
        defaultOption.hidden = true;
        defaultOption.textContent = 'Select an account';
        select.appendChild(defaultOption);

        data.forEach(account => {
          const option = document.createElement('option');
          option.value = account.name;
          option.textContent = account.name;
          select.appendChild(option);
        });
      } else {
        throw new Error('Failed to fetch accounts');
      }
    } catch (err) {
      console.error("Failed to load purchase account options:", err);
      select.innerHTML = '<option disabled selected>Failed to load</option>';
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      errorDiv.classList.add('hidden');
      successDiv.classList.add('hidden');

      if (!select.value) {
        errorText.textContent = 'Please select a valid account.';
        errorDiv.classList.remove('hidden');
        return;
      }

      submitButton.disabled = true;
      submitText.classList.add('hidden');
      loadingText.classList.remove('hidden');

      try {
        const formData = new FormData(form);
        const response = await fetch('/api/user/push/purchases', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
          errorText.textContent = data.message || data.error || 'An error occurred while processing your request';
          errorDiv.classList.remove('hidden');
        } else {
          successText.textContent = data.message || 'Purchase added successfully!';
          successDiv.classList.remove('hidden');
          form.reset();
        }
      } catch (error) {
        errorText.textContent = 'Network error - please check your connection and try again';
        errorDiv.classList.remove('hidden');
      } finally {
        submitButton.disabled = false;
        submitText.classList.remove('hidden');
        loadingText.classList.add('hidden');
      }
    });
  });