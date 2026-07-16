const API = '/api/auth';

async function request(endpoint, body) {
  const response = await fetch(`${API}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'Something went wrong.'), { data });
  return data;
}

function showMessage(message, text, success = false) {
  message.textContent = text;
  message.classList.toggle('success', success);
}

document.querySelectorAll('.visibility-toggle').forEach((toggle) => {
  const password = toggle.closest('.password-input').querySelector('input');

  toggle.addEventListener('click', () => {
    const isHidden = password.type === 'password';
    password.type = isHidden ? 'text' : 'password';
    toggle.setAttribute('aria-pressed', String(isHidden));
    toggle.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  });
});

document.querySelectorAll('.app-form').forEach((form) => {
  const message = form.querySelector('.form-message');
  const fields = [...form.querySelectorAll('[data-field]')].map((container) => ({
    input: container.querySelector('input'),
    error: container.querySelector('.field-error'),
    empty: container.dataset.empty,
    invalid: container.dataset.invalid,
  }));

  const isFieldValid = (field) => {
    if (!field.input.validity.valid) return false;
    return field.input.type !== 'email' || /^[^\s@]+@[^\s@]+\.edu$/i.test(field.input.value);
  };

  const showFieldError = (field) => {
    const text = field.input.validity.valueMissing ? field.empty : (isFieldValid(field) ? '' : field.invalid);
    field.error.textContent = text || '';
    field.input.classList.toggle('is-invalid', Boolean(text));
    field.input.setAttribute('aria-invalid', String(Boolean(text)));
    return Boolean(text);
  };

  const clearFieldError = (field) => {
    field.error.textContent = '';
    field.input.classList.remove('is-invalid');
    field.input.setAttribute('aria-invalid', 'false');
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.classList.remove('success');

    fields.forEach((field) => {
      if (field.input.type === 'email') field.input.value = field.input.value.trim();
    });

    if (fields.map(showFieldError).some(Boolean)) {
      message.textContent = '';
      return;
    }

    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      if (form.dataset.action === 'signup') {
        const data = await request('/signup', { email: form.elements.email.value, password: form.elements.password.value });
        sessionStorage.setItem('hivePendingEmail', data.email);
        window.location.assign('./verify.html');
        return;
      }
      if (form.dataset.action === 'verify') {
        const email = sessionStorage.getItem('hivePendingEmail');
        if (!email) throw new Error('Please create your account first.');
        const data = await request('/verify', { email, code: form.elements.code.value });
        sessionStorage.removeItem('hivePendingEmail');
        showMessage(message, `${data.message} You can continue to Hive.`, true);
        return;
      }
      const data = await request('/login', { email: form.elements.email.value, password: form.elements.password.value });
      showMessage(message, data.message, true);
    } catch (error) {
      if (error.data?.needsVerification) {
        sessionStorage.setItem('hivePendingEmail', error.data.email);
        window.location.assign('./verify.html');
        return;
      }
      showMessage(message, error.message);
    } finally {
      button.disabled = false;
    }
  });

  fields.forEach((field) => {
    field.input.addEventListener('input', () => {
      if (isFieldValid(field)) clearFieldError(field);
    });
  });
});

document.querySelectorAll('[data-resend]').forEach((button) => {
  button.addEventListener('click', async () => {
    const message = button.closest('.app-form').querySelector('.form-message');
    const email = sessionStorage.getItem('hivePendingEmail');
    if (!email) return showMessage(message, 'Please create your account first.');
    button.disabled = true;
    try {
      const data = await request('/resend-verification', { email });
      showMessage(message, data.message, true);
    } catch (error) {
      showMessage(message, error.message);
    } finally {
      button.disabled = false;
    }
  });
});
