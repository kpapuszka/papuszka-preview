const copyEmail = document.querySelector('#copy-email');
const emailLink = document.querySelector('.contact-email');
const copyStatus = document.querySelector('.copy-status');
if (navigator.clipboard?.writeText) {
  copyEmail.hidden = false;
  copyEmail.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(emailLink.textContent);
      copyStatus.textContent = 'Copied.';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(emailLink);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      copyStatus.textContent = 'Address selected. Use Copy to copy it.';
    }
  });
}
