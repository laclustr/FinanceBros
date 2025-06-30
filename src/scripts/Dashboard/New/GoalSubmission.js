window.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector('#goal-tab form');
    const submitButton = form.querySelector('button[type="submit"]');
    const submitText = submitButton.querySelector('.submit-text');
    const loadingText = submitButton.querySelector('.loading-text');

    let messageWrapper = document.getElementById('goal-form-messages');
    if (!messageWrapper) {
      messageWrapper = document.createElement('div');
      messageWrapper.id = 'goal-form-messages';
      messageWrapper.className = 'max-w-md mx-auto w-full mb-4';
      form.insertAdjacentElement('afterbegin', messageWrapper);
    }

    let errorDiv = document.getElementById('goal-error-message');
    let successDiv = document.getElementById('goal-success-message');

    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'goal-error-message';
      errorDiv.className = 'hidden bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4';
      errorDiv.innerHTML = '<span class="goal-error-text"></span>';
      messageWrapper.appendChild(errorDiv);
    }

    if (!successDiv) {
      successDiv = document.createElement('div');
      successDiv.id = 'goal-success-message';
      successDiv.className = 'hidden bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4';
      successDiv.innerHTML = '<span class="goal-success-text"></span>';
      messageWrapper.appendChild(successDiv);
    }

    const errorText = errorDiv.querySelector('.goal-error-text');
    const successText = successDiv.querySelector('.goal-success-text');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      errorDiv.classList.add('hidden');
      successDiv.classList.add('hidden');

      submitButton.disabled = true;
      submitText.classList.add('hidden');
      loadingText.classList.remove('hidden');

      try {
        const formData = new FormData(form);
        const response = await fetch('/api/user/push/goals', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
          errorText.textContent = data.message || data.error || 'An error occurred while setting your goal.';
          errorDiv.classList.remove('hidden');
        } else {
          successText.textContent = data.message || 'Goal created successfully!';
          successDiv.classList.remove('hidden');
          form.reset();
        }
      } catch (error) {
        errorText.textContent = `Network error - please try again.`;
        errorDiv.classList.remove('hidden');
      } finally {
        submitButton.disabled = false;
        submitText.classList.remove('hidden');
        loadingText.classList.add('hidden');
      }
    });
  });