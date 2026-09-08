import assert from 'node:assert/strict';
import { STEPS, answerLabel, validateStep, buildMessage, summaryRows, whatsappLink } from '../public/quiz/quiz-model.mjs';

const answers = {
  project: 'cover', theme: 'other', themeNote: 'Homenagem ao avô & família',
  finish: 'blackgray', references: 'ready', placement: 'other', placementNote: 'Ombro esquerdo',
  size: 'big', budget: '1000to1999', timing: 'months', location: 'other', cityNote: 'São José / SC',
  availability: 'saturday', name: '  João da Silva  ', notes: 'Relógio às 12:30. Símbolos: + & ? # ♥ <3',
};
const indexOf = key => STEPS.findIndex(step => step.key === key);
assert.equal(STEPS.filter(step => step.options).length, 10);
assert.equal(STEPS.filter(step => !step.options).length, 1, 'only name needs typing');
for (const [index, step] of STEPS.entries()) {
  assert.equal(validateStep(index, answers), null);
  if (!step.options) continue;
  assert.equal(validateStep(index, {}).field, step.key, 'missing required choice');
  assert.equal(validateStep(index, { [step.key]: 'invalid' }).field, step.key, 'reject unknown choices');
  for (const option of step.options) {
    const changed = { ...answers, [step.key]: option.value };
    assert.equal(validateStep(index, changed), null);
    if (option.value !== 'other') assert.ok(buildMessage(changed).includes(option.label), 'all choice labels included in message');
  }
}
const message = buildMessage(answers);
const url = new URL(whatsappLink(message));
assert.equal(url.hostname, 'wa.me');
assert.equal(url.pathname, '/5547996615555');
assert.equal(url.searchParams.get('text'), message, 'preserve accents, punctuation and newlines');
assert.ok(message.includes('possibilidade de cobrir'), 'coverage requires evaluation');
assert.ok(message.includes('João da Silva.'));
for (const [, value] of summaryRows(answers)) assert.ok(message.includes(value), value);
for (const project of STEPS[0].options) {
  assert.notEqual(buildMessage({ ...answers, project: project.value }), buildMessage({ ...answers, project: project.value === 'new' ? 'first' : 'new' }));
}
assert.equal(validateStep(indexOf('details'), { name: '  ' }).field, 'name');
const noTyping = { ...answers, themeNote: '', placementNote: '', cityNote: '', notes: '' };
for (let index = 0; index < STEPS.length; index++) assert.equal(validateStep(index, noTyping), null, 'other notes are optional');
for (const key of ['theme', 'placement', 'location']) assert.ok(buildMessage(noTyping).includes(answerLabel(key, 'other')));
const changed = { ...answers, theme: 'animal', placement: 'arm', location: 'itapema', notes: '' };
for (const note of [answers.themeNote, answers.placementNote, answers.cityNote]) assert.ok(!buildMessage(changed).includes(note), 'stale other notes excluded');
assert.ok(!buildMessage(changed).includes('Detalhes:'), 'empty optional details excluded');
const maximum = { ...answers };
for (const key of ['name', 'notes', 'themeNote', 'placementNote', 'cityNote']) maximum[key] = 'x'.repeat(5000);
assert.ok(buildMessage(maximum).length < 2200, 'generated message fits editor limit');
assert.equal(new URL(whatsappLink('Texto revisado: café & arte\nOutro detalhe.')).searchParams.get('text'), 'Texto revisado: café & arte\nOutro detalhe.');
console.log('Quiz passed: ten choice questions, validation of every option, project personalization, complete WhatsApp summary, optional typing, stale-answer removal, size limits and URL encoding.');
