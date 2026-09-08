import { STEPS, clean, validateStep, summaryRows, buildMessage, whatsappLink } from './quiz-model.mjs';
import { setProjectForTheme } from './quiz-gallery.mjs';

const $ = id => document.getElementById(id);
const answers = {};
let current = 0;
const form = $('quiz-form');
const heading = $('question-title');
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const icon = name => `<svg class="icon" aria-hidden="true"><use href="#${name}"/></svg>`;

function showSection(id) {
  for (const section of ['intro', 'quiz', 'result']) $(section).hidden = section !== id;
  document.body.dataset.screen = id;
}

function focusHeading(element) {
  element.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: reducedMotion() ? 'instant' : 'smooth' });
}

function fieldMarkup(key, label, { placeholder = '', optional = false, limit = 70, multiline = false, autocomplete = '' } = {}) {
  const attributes = `id="${key}" name="${key}" maxlength="${limit}" placeholder="${placeholder}" ${optional ? '' : 'required'} ${autocomplete ? `autocomplete="${autocomplete}"` : ''}`;
  return `<div class="field"><label class="field-label" for="${key}">${label}${optional ? ' <span>(opcional)</span>' : ''}</label>${multiline ? `<textarea ${attributes} rows="3"></textarea>` : `<input type="text" ${attributes}>`}</div>`;
}

function renderConditional() {
  const extra = $('conditional-field');
  if (!extra) return;
  const other = answers[STEPS[current].key] === 'other';
  extra.hidden = !other;
  extra.querySelector('input').disabled = !other;
}

function renderStep(index) {
  current = index;
  const step = STEPS[current];
  showSection('quiz');
  document.body.dataset.step = step.key;
  $('step-label').textContent = `Etapa ${current + 1} de ${STEPS.length}`;
  $('progress').max = STEPS.length;
  $('progress').value = current + 1;
  $('progress').textContent = `${current + 1} de ${STEPS.length}`;
  heading.textContent = step.title;
  $('question-help').textContent = step.key === 'placement' && answers.project === 'cover'
    ? 'Escolha a região da tattoo que você quer cobrir. Depois, envie uma foto ao Gabriel para ele avaliar.'
    : step.help;
  $('form-error').textContent = '';
  $('selection-note').textContent = '';
  $('next').querySelector('span').textContent = current === STEPS.length - 1 ? 'Ver minha mensagem' : 'Continuar';
  let fields = '';
  if (step.options) {
    fields = `<fieldset class="choice-grid ${step.compact ? 'compact-choices' : ''} ${step.options.length === 3 ? 'single-column' : ''}" aria-labelledby="question-title" aria-describedby="question-help">${step.options.map(option => `
      <label class="choice ${step.images ? `choice-image ${option.image ? '' : 'no-photo'}` : ''}">
        <input type="radio" name="${step.key}" value="${option.value}" required>
        <span class="choice-face">${option.image ? `<img src="/imagens-junco/thumbs/${option.image}" alt="${option.alt}" width="480" height="640" loading="lazy">` : option.icon ? icon(option.icon) : ''}<span class="choice-text"><strong>${option.label}</strong></span></span>
      </label>`).join('')}</fieldset>`;
    if (step.other) fields += `<div id="conditional-field" hidden>${fieldMarkup(step.other.key, step.other.label, step.other)}</div>`;
  } else {
    fields = fieldMarkup('name', 'Seu nome', { placeholder: 'Como você prefere ser chamado?', limit: 60, autocomplete: 'given-name' })
      + `<details class="optional-details" ${answers.notes ? 'open' : ''}><summary>Quer acrescentar algum detalhe? <span>Opcional</span></summary>${fieldMarkup('notes', 'O que mais o Gabriel precisa saber?', { placeholder: 'Uma homenagem, uma data de viagem ou um detalhe importante para você…', limit: 500, optional: true, multiline: true })}</details>`;
  }
  // Only trusted option definitions become markup; visitor text is assigned as values.
  $('question-fields').innerHTML = fields;
  for (const input of form.querySelectorAll('input,textarea')) {
    if (input.type === 'radio') input.checked = answers[input.name] === input.value;
    else input.value = answers[input.name] || '';
  }
  renderConditional();
  setProjectForTheme(answers.theme);
  $('question-content').getAnimations().forEach(animation => animation.cancel());
  if (!reducedMotion()) {
    $('question-content').animate([{ opacity: .25, transform: 'translateY(7px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 220, easing: 'ease-out' });
  }
  focusHeading(heading);
}

function collect(event) {
  const input = event.target;
  if (!input.name || (input.type === 'radio' && !input.checked)) return;
  answers[input.name] = input.value;
  form.querySelectorAll('[aria-invalid]').forEach(field => {
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
  });
  $('form-error').textContent = '';
  renderConditional();
  if (input.type === 'radio') {
    $('selection-note').textContent = 'Opção selecionada. Toque em Continuar para avançar.';
    if (input.name === 'theme') setProjectForTheme(input.value);
  }
}
form.addEventListener('input', collect);
form.addEventListener('change', collect);

function showError(error) {
  $('form-error').textContent = error.message;
  const input = form.elements.namedItem(error.field);
  const target = input instanceof RadioNodeList ? input[0] : input;
  if (target instanceof HTMLElement) {
    target.setAttribute('aria-invalid', 'true');
    target.setAttribute('aria-describedby', 'form-error');
    target.focus();
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const error = validateStep(current, answers);
  if (error) return showError(error);
  if (current < STEPS.length - 1) return renderStep(current + 1);
  for (let index = 0; index < STEPS.length; index++) {
    const invalid = validateStep(index, answers);
    if (invalid) { renderStep(index); showError(invalid); return; }
  }
  showResult();
});

function updateMessageLink() {
  const text = $('message').value.trim();
  const link = $('whatsapp-link');
  if (text) {
    link.href = whatsappLink(text);
    link.removeAttribute('aria-disabled');
    $('message-error').textContent = '';
  } else {
    link.removeAttribute('href');
    link.setAttribute('aria-disabled', 'true');
    $('message-error').textContent = 'Escreva uma mensagem antes de abrir o WhatsApp.';
  }
  $('copy-message').textContent = 'Copiar mensagem';
  $('copy-status').textContent = '';
}

function showResult() {
  showSection('result');
  $('result-personal').textContent = `${clean(answers.name, 60)}, suas escolhas estão reunidas na mensagem abaixo. Confira e envie ao Gabriel quando quiser.`;
  $('summary-details').open = false;
  const summary = $('answer-summary');
  summary.replaceChildren();
  for (const [label, value] of summaryRows(answers)) {
    const row = document.createElement('div'); row.className = 'summary-row';
    const dt = document.createElement('dt'); dt.textContent = label;
    const dd = document.createElement('dd'); dd.textContent = value;
    row.append(dt, dd); summary.append(row);
  }
  const descriptions = {
    first: 'O Gabriel pode te orientar sobre o desenho, a região e o tamanho para a sua primeira tattoo.',
    cover: 'Na conversa, envie uma foto da tattoo atual. O Gabriel precisa avaliar o desenho e a pele antes de indicar uma cobertura.',
    large: 'Se tiver referências do fechamento, envie na conversa para discutir o desenho, as sessões e o orçamento.',
    new: 'Se tiver fotos de referência, envie na conversa. Elas ajudam o Gabriel a entender a sua ideia.',
  };
  $('next-step-description').textContent = descriptions[answers.project];
  $('message').value = buildMessage(answers);
  updateMessageLink();
  focusHeading($('result-title'));
}

document.querySelectorAll('[data-start]').forEach(button => button.addEventListener('click', () => renderStep(current)));
$('back').addEventListener('click', () => {
  if (current > 0) renderStep(current - 1);
  else { showSection('intro'); document.querySelector('[data-start]').focus(); window.scrollTo({ top: 0, behavior: 'instant' }); }
});
$('edit-answers').addEventListener('click', () => renderStep(0));
$('message').addEventListener('input', updateMessageLink);
$('whatsapp-link').addEventListener('click', event => {
  if (!$('message').value.trim()) { event.preventDefault(); $('message').focus(); }
});
$('copy-message').addEventListener('click', async () => {
  if (!$('message').value.trim()) { $('message').focus(); return; }
  try {
    await navigator.clipboard.writeText($('message').value.trim());
    $('copy-message').textContent = 'Mensagem copiada';
    $('copy-status').textContent = 'Mensagem copiada. Cole na conversa com o Gabriel.';
  } catch {
    $('message').focus(); $('message').select();
    $('copy-status').textContent = 'Não foi possível copiar automaticamente. O texto está selecionado para você copiar.';
  }
});

// Small tattoo symbols fall in a continuous CSS loop, with no frame-by-frame JS.
function initStudioAtmosphere() {
  const field = $('studio-atmosphere');
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const symbols = ['machine', 'rose', 'skull', 'needle'];
  const fragment = document.createDocumentFragment();
  const svgNamespace = 'http://www.w3.org/2000/svg';
  for (let index = 0; index < 28; index += 1) {
    const particle = document.createElement('span');
    const icon = document.createElementNS(svgNamespace, 'svg');
    const use = document.createElementNS(svgNamespace, 'use');
    const duration = 19 + (index * 7 % 15);
    const phase = (index * 0.61803398875 + 0.13) % 1;
    particle.className = 'tattoo-particle';
    particle.style.setProperty('--x', ((index * 37 + 7) % 96) + '%');
    particle.style.setProperty('--size', (26 + (index * 11 % 17)) + 'px');
    particle.style.setProperty('--duration', duration + 's');
    particle.style.setProperty('--delay', (-phase * duration) + 's');
    particle.style.setProperty('--drift', ((index * 13 % 49) - 24) + 'px');
    particle.style.setProperty('--angle', ((index * 17 % 60) - 30) + 'deg');
    particle.style.setProperty('--turn', ((index * 23 % 100) - 50) + 'deg');
    particle.style.setProperty('--alpha', (0.14 + (index % 4) * 0.02).toFixed(2));
    icon.setAttribute('viewBox', '0 0 40 40');
    icon.setAttribute('focusable', 'false');
    use.setAttribute('href', '#rain-' + symbols[index % symbols.length]);
    icon.append(use);
    particle.append(icon);
    fragment.append(particle);
  }
  field.replaceChildren(fragment);
  function sync() {
    field.dataset.paused = String(media.matches || document.hidden);
  }
  media.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  sync();
}
initStudioAtmosphere();
