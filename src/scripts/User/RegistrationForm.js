const form = document.getElementById('authForm');
const submitBtn = document.getElementById('submitBtn');
const errorMessage = document.getElementById('errorMessage');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

function validateEmail(email) {
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
return emailRegex.test(email);
}

function validatePassword(password) {
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
return passwordRegex.test(password);
}

function clearError() {
errorMessage.textContent = '';
}

[emailInput, passwordInput].forEach(input => {
input.addEventListener('input', clearError);
});

async function loginUser(email, password) {
submitBtn.textContent = 'Logging in...';
try {
    const loginRes = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    });
    if (!loginRes.ok) {
    const loginData = await loginRes.json().catch(() => null);
    throw new Error((loginData && loginData.error) || 'Login failed after registration.');
    }
    const loginData = await loginRes.json();
    if (!loginData.success) {
    throw new Error(loginData.error || 'Login failed after registration.');
    }
    submitBtn.textContent = 'Success! Redirecting...';
    setTimeout(() => {
    window.location.href = '/login/onboarding';
    }, 1500);
} catch (error) {
    errorMessage.textContent = error.message;
    submitBtn.disabled = false;
    submitBtn.textContent = 'Register'; // fallback
}
}

async function handleSubmit(e) {
e.preventDefault();
const apiPath = form.getAttribute('data-api');
const email = emailInput.value.trim();
const password = passwordInput.value.trim();

if (!email) {
    errorMessage.textContent = 'Please enter your email address';
    return;
}

if (!validateEmail(email)) {
    errorMessage.textContent = 'Please enter a valid email address';
    return;
}

if (!password) {
    errorMessage.textContent = 'Please enter your password';
    return;
}

if (!validatePassword(password) && apiPath.includes('register')) {
    errorMessage.textContent = 'Password must be at least 8 characters long and include uppercase, lowercase, and a number';
    return;
}

submitBtn.disabled = true;
submitBtn.textContent = apiPath.includes('register') ? 'Registering...' : 'Logging in...';
errorMessage.textContent = '';

try {
    const res = await fetch(apiPath, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
    const data = await res.json().catch(() => null);
    if (data && data.error) {
        throw new Error(data.error);
    }
    throw new Error('An unexpected error occurred, please try again');
    }

    const data = await res.json();
    if (!data.success) {
    throw new Error(data.error || 'Authentication failed, please try again.');
    }

    if (apiPath.includes('register')) {
    await loginUser(email, password);
    } else {
    submitBtn.textContent = 'Success! Redirecting...';
    setTimeout(() => {
        window.location.href = '/login/onboarding';
    }, 500);
    }

} catch (error) {
    errorMessage.textContent = error.message;
    submitBtn.disabled = false;
    submitBtn.textContent = apiPath.includes('register') ? 'Register' : 'Login';
}
}

form.addEventListener('submit', handleSubmit);