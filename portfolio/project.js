(() => {
  const progressBar = document.querySelector('.scroll-progress');
  const updateProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.transform = `scaleX(${scrollable > 0 ? window.scrollY / scrollable : 0})`;
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  document.querySelectorAll('.reveal').forEach(element => {
    const observer = new IntersectionObserver(([entry], currentObserver) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        currentObserver.disconnect();
      }
    }, { threshold: .12 });
    observer.observe(element);
  });

  const dialog = document.querySelector('.lightbox');
  const triggers = [...document.querySelectorAll('.gallery-trigger')];
  if (!dialog || triggers.length === 0) return;

  const image = dialog.querySelector('[data-lightbox-image]');
  const caption = dialog.querySelector('[data-lightbox-caption]');
  const count = dialog.querySelector('[data-lightbox-count]');
  let currentIndex = 0;
  let lastTrigger = null;

  const showImage = index => {
    currentIndex = (index + triggers.length) % triggers.length;
    const trigger = triggers[currentIndex];
    image.src = trigger.dataset.full;
    image.alt = trigger.dataset.alt;
    caption.textContent = trigger.dataset.caption;
    count.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(triggers.length).padStart(2, '0')}`;
  };

  triggers.forEach((trigger, index) => {
    trigger.addEventListener('click', () => {
      lastTrigger = trigger;
      showImage(index);
      dialog.showModal();
    });
  });
  dialog.querySelector('[data-gallery-prev]').addEventListener('click', () => showImage(currentIndex - 1));
  dialog.querySelector('[data-gallery-next]').addEventListener('click', () => showImage(currentIndex + 1));
  dialog.querySelector('[data-gallery-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') showImage(currentIndex - 1);
    if (event.key === 'ArrowRight') showImage(currentIndex + 1);
  });
  dialog.addEventListener('close', () => lastTrigger?.focus());
})();
