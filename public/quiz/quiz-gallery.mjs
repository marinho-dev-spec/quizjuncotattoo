const $ = id => document.getElementById(id);
const projects = [
  { file: 'tattoo-16.webp', caption: 'Zeus em realismo', alt: 'Zeus em realismo preto e cinza, tatuado no braço' },
  { file: 'tattoo-15.webp', caption: 'Leão e composição no braço', alt: 'Leão em composição de realismo no braço' },
  { file: 'tattoo-18.webp', caption: 'Fé em preto e cinza', alt: 'Jesus com coroa de espinhos e cruz, tatuado no braço' },
  { file: 'tattoo-26.webp', caption: 'Retrato e expressão', alt: 'Rosto feminino em preto e cinza, com cruz na mão' },
  { file: 'tattoo-20.webp', caption: 'Detalhes de uma armadura', alt: 'Armadura e espada em realismo no antebraço' },
  { file: 'tattoo-17.webp', caption: 'Uma composição, vários detalhes', alt: 'Leão, cruz e relógio em uma composição no braço' },
];
const gallery = document.querySelector('.project-gallery');
const viewport = $('project-viewport');
const track = $('project-track');
const group = track.querySelector('.project-group');
const dialog = $('project-dialog');
let asideIndex = 0;
let dialogIndex = 0;
let opener;
let previousOverflow = '';
let visible = false;

function photo(element, project, variant = '') {
  const src = '/imagens-junco/' + variant + project.file;
  if (element.getAttribute('src') !== src) element.src = src;
  element.alt = project.alt;
}

export function setProjectForTheme(theme) {
  asideIndex = ({ mythology: 0, animal: 1, religious: 2, portrait: 3, other: 4, undecided: 5 })[theme] ?? 0;
  const project = projects[asideIndex];
  photo($('aside-photo'), project, 'medium/');
  photo($('mobile-project-photo'), project, 'thumbs/');
  $('mobile-project-photo').alt = '';
  $('aside-caption').textContent = project.caption;
}

for (const [index, project] of projects.entries()) {
  if (index === 0) continue; // The first photograph is present before JavaScript loads.
  const button = document.createElement('button');
  button.className = 'project-photo';
  button.type = 'button';
  button.tabIndex = -1; // Keyboard visitors use the stable "Ampliar fotos" control.
  button.dataset.project = index;
  button.setAttribute('aria-label', 'Ampliar ' + project.caption);
  const image = document.createElement('img');
  image.width = 1400; image.height = 1867; image.alt = project.alt;
  image.loading = 'lazy'; image.decoding = 'async'; image.draggable = false;
  // Declare selection hints first so a thumbnail request is not canceled for srcset.
  image.sizes = '(max-width: 760px) calc(100vw - 72px), 380px';
  image.srcset = '/imagens-junco/thumbs/' + project.file + ' 640w, /imagens-junco/medium/' + project.file + ' 800w';
  image.src = '/imagens-junco/thumbs/' + project.file;
  const caption = document.createElement('span');
  caption.textContent = project.caption;
  button.append(image, caption);
  group.append(button);
}
// Two identical groups form one continuous loop, like the site's portfolio.
const duplicate = group.cloneNode(true);
duplicate.setAttribute('aria-hidden', 'true');
duplicate.querySelectorAll('img').forEach(image => { image.alt = ''; image.loading = 'lazy'; image.removeAttribute('fetchpriority'); });
track.append(duplicate);
track.querySelectorAll('img').forEach(image => image.addEventListener('error', () => {
  if (image.dataset.fallback) {
    image.hidden = true;
    image.parentElement.querySelector('span').textContent += ' · Foto indisponível';
    return;
  }
  image.dataset.fallback = 'true';
  image.removeAttribute('srcset');
  image.src = '/imagens-junco/thumbs/' + projects[Number(image.parentElement.dataset.project)].file;
}));

function nearestProject() {
  const bounds = viewport.getBoundingClientRect();
  const center = bounds.left + bounds.width / 2;
  let nearest = 0;
  let distance = Infinity;
  for (const button of track.querySelectorAll('[data-project]')) {
    const rect = button.getBoundingClientRect();
    const next = Math.abs(rect.left + rect.width / 2 - center);
    if (next < distance) { distance = next; nearest = Number(button.dataset.project); }
  }
  return nearest;
}

function showDialogPhoto(index) {
  dialogIndex = (index + projects.length) % projects.length;
  const project = projects[dialogIndex];
  photo($('dialog-image'), project);
  $('dialog-caption').textContent = project.caption;
  $('dialog-count').textContent = (dialogIndex + 1) + ' / ' + projects.length;
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $('dialog-image').getAnimations().forEach(animation => animation.cancel());
    $('dialog-image').animate([{ opacity: .55 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
  }
}
function openPhoto(index, trigger) {
  opener = trigger;
  showDialogPhoto(index);
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  dialog.showModal();
  $('dialog-close').focus({ preventScroll: true });
}
track.addEventListener('click', event => {
  const button = event.target.closest('[data-project]');
  if (button) openPhoto(Number(button.dataset.project), $('gallery-open'));
});
$('gallery-open').addEventListener('click', () => openPhoto(nearestProject(), $('gallery-open')));
document.querySelectorAll('[data-view-project]').forEach(button => button.addEventListener('click', event => openPhoto(asideIndex, event.currentTarget)));
$('dialog-prev').addEventListener('click', () => showDialogPhoto(dialogIndex - 1));
$('dialog-next').addEventListener('click', () => showDialogPhoto(dialogIndex + 1));
$('dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
dialog.addEventListener('keydown', event => {
  if (event.key === 'Tab') {
    const first = $('dialog-close');
    const last = $('dialog-next');
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  if (event.key === 'ArrowRight') { event.preventDefault(); showDialogPhoto(dialogIndex + 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); showDialogPhoto(dialogIndex - 1); }
});
dialog.addEventListener('close', () => {
  document.body.style.overflow = previousOverflow;
  opener?.focus({ preventScroll: true });
});

// Only invisible surfaces stop doing work; hover and focus never stop the strip.
function syncVisibility() {
  gallery.dataset.offscreen = String(!visible || document.hidden || $('intro').hidden);
}
new IntersectionObserver(entries => {
  visible = entries[entries.length - 1].isIntersecting;
  syncVisibility();
}).observe(viewport);
new MutationObserver(syncVisibility).observe($('intro'), { attributes: true, attributeFilter: ['hidden'] });
document.addEventListener('visibilitychange', syncVisibility);
syncVisibility();
