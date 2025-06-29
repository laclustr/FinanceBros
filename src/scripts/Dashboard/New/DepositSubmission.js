window.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById('deposit-form');
    const errorDiv = document.getElementById('deposit-error-message');
    const successDiv = document.getElementById('deposit-success-message');
    const errorText = errorDiv.querySelector('.deposit-error-text');
    const successText = successDiv.querySelector('.deposit-success-text');
    const submitButton = form.querySelector('button[type="submit"]');
    const submitText = submitButton.querySelector('.submit-text');
    const loadingText = submitButton.querySelector('.loading-text');
    const accountSelect = form.querySelector("#deposit-account");

    try {
      const res = await fetch('/api/user/fetch/accounts', {
        method: 'POST',
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        accountSelect.innerHTML = `<option value="" disabled selected hidden>Select an account</option>`;
        data.forEach(account => {
          const opt = document.createElement("option");
          opt.value = account.name;
          opt.textContent = account.name;
          accountSelect.appendChild(opt);
        });
      }
    } catch (err) {
      console.error("Failed to load deposit account options:", err);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      errorDiv.classList.add('hidden');
      successDiv.classList.add('hidden');

      if (!accountSelect.value) {
        errorText.textContent = 'Please select a valid account.';
        errorDiv.classList.remove('hidden');
        return;
      }

      submitButton.disabled = true;
      submitText.classList.add('hidden');
      loadingText.classList.remove('hidden');

      try {
        const formData = new FormData(form);
        const response = await fetch('/api/user/push/deposits', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });

        let data = {};
        try {
          data = await response.json();
        } catch {
          data = { error: 'Invalid server response' };
        }

        if (!response.ok) {
          errorText.textContent = data.message || data.error || 'An error occurred while processing your request';
          errorDiv.classList.remove('hidden');
        } else {
          successText.textContent = data.message || 'Deposit added successfully!';
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