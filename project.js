if ('IntersectionObserver' in window) {
  const sections = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('entered');
        sections.unobserve(entry.target);
      }
    }
  });
  document.querySelectorAll('.project-section').forEach(section => sections.observe(section));
}
