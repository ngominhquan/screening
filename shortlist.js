'use strict';

const form = document.getElementById('shortlist');
const button = document.getElementById('submit');
const result = document.getElementById('result');
const consentText = document.getElementById('invitation-consent-text').textContent.trim();
const consentVersion = '2026-11-10-invitation-v1';

function showMessage(kind, text) {
  result.className = `message ${kind}`;
  result.textContent = text;
  result.hidden = false;
  result.focus();
  result.scrollIntoView({ block: 'center' });
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (button.disabled) return;

  // Native validation treats whitespace-only text as nonempty; trim it first.
  form.querySelectorAll('input:not([type="checkbox"])').forEach(input => {
    input.value = input.value.trim();
  });
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const key = form.elements.namedItem('access_key').value;
  if (!key || key === 'YOUR_WEB3FORMS_ACCESS_KEY') {
    showMessage('error', 'This form is temporarily unavailable. Please contact the landlord through your existing conversation.');
    return;
  }

  button.disabled = true;
  button.textContent = 'Sending…';
  result.hidden = true;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const data = Object.fromEntries(new FormData(form));
    data['Invitation permission wording'] = consentText;
    data['Consent wording version'] = consentVersion;
    data['Submitted at UTC'] = new Date().toISOString();
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal
    });
    const json = await response.json();
    if (!response.ok || json.success !== true) throw new Error('Submission failed');

    // Clear sensitive values only after the service confirms receipt.
    form.reset();
    form.hidden = true;
    showMessage('success', 'Thank you. Your request was sent to the landlord. The landlord will arrange your screening invitation separately. No credit check has been authorized or run by this form.');
  } catch (error) {
    showMessage('error', 'We could not confirm delivery. Your details are still in the form. Please try again, or contact the landlord through your existing conversation. If sending timed out, check with the landlord before retrying to avoid a duplicate.');
  } finally {
    clearTimeout(timeout);
    button.disabled = false;
    button.textContent = 'Request screening invitation';
  }
});
