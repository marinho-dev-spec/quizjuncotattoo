export const WHATSAPP_NUMBER = '5547996615555';

// These ranges express the visitor's plans, not studio prices or a quote.
export const STEPS = [
  {
    key: 'project', title: 'Qual é o seu próximo projeto?',
    help: 'Escolha o que você quer fazer.',
    options: [
      { value: 'first', label: 'Minha primeira tattoo', icon: 'spark' },
      { value: 'new', label: 'Uma nova tattoo', icon: 'pen' },
      { value: 'cover', label: 'Cobrir uma tattoo', icon: 'layers' },
      { value: 'large', label: 'Um fechamento', icon: 'frame' },
    ],
  },
  {
    key: 'theme', title: 'O que você imagina tatuar?',
    help: 'Escolha a ideia mais próxima da sua. As fotos são projetos do Gabriel.',
    images: true,
    options: [
      { value: 'portrait', label: 'Rostos e retratos', image: 'tattoo-26.webp', alt: 'Retrato feminino em preto e cinza' },
      { value: 'animal', label: 'Animais', image: 'tattoo-15.webp', alt: 'Leão em uma composição de realismo' },
      { value: 'religious', label: 'Temas religiosos', image: 'tattoo-18.webp', alt: 'Retrato de Jesus em preto e cinza' },
      { value: 'mythology', label: 'Mitologia e esculturas', image: 'tattoo-16.webp', alt: 'Escultura de Zeus tatuada no braço' },
      { value: 'other', label: 'Tenho outra ideia' },
      { value: 'undecided', label: 'Ainda estou escolhendo' },
    ],
    other: { key: 'themeNote', label: 'Qual é a sua ideia?', placeholder: 'Ex.: uma homenagem ao meu avô', limit: 180, optional: true },
  },
  {
    key: 'finish', title: 'Você imagina a tattoo em preto e cinza?',
    help: 'Essa é a especialidade do Gabriel, como nos projetos que você viu.',
    options: [
      { value: 'blackgray', label: 'Sim, em preto e cinza' },
      { value: 'color', label: 'Penso em uma tattoo colorida' },
      { value: 'undecided', label: 'Quero orientação para decidir' },
    ],
  },
  {
    key: 'references', title: 'Você já tem referências?',
    help: 'Se tiver fotos ou desenhos, pode enviar depois na conversa.',
    options: [
      { value: 'ready', label: 'Tenho imagens para enviar' },
      { value: 'idea', label: 'Tenho a ideia, ainda sem fotos' },
      { value: 'help', label: 'Quero ajuda para encontrar uma ideia' },
    ],
  },
  {
    key: 'placement', title: 'Em qual parte do corpo?',
    help: 'O lugar ajuda a definir a proporção do desenho.',
    compact: true,
    options: [
      { value: 'arm', label: 'Braço' }, { value: 'forearm', label: 'Antebraço' },
      { value: 'leg', label: 'Perna' }, { value: 'back', label: 'Costas' },
      { value: 'chest', label: 'Peito ou costelas' }, { value: 'hand', label: 'Mão ou pescoço' },
      { value: 'other', label: 'Outra região' }, { value: 'undecided', label: 'Quero ajuda para escolher' },
    ],
    other: { key: 'placementNote', label: 'Qual região?', placeholder: 'Ex.: ombro esquerdo', limit: 70, optional: true },
  },
  {
    key: 'size', title: 'Que tamanho você tem em mente?',
    help: 'Uma estimativa já ajuda. Vocês ajustam os detalhes na conversa.',
    options: [
      { value: 'small', label: 'Até 10 cm' },
      { value: 'medium', label: 'Entre 10 e 20 cm' },
      { value: 'big', label: 'Mais de 20 cm' },
      { value: 'full', label: 'Fechar uma região do corpo' },
      { value: 'undecided', label: 'Quero orientação sobre o tamanho' },
    ],
  },
  {
    key: 'budget', title: 'Quanto você pensa em investir?',
    help: 'É o valor que você tem em mente. O orçamento depende da avaliação do projeto.',
    options: [
      { value: 'under500', label: 'Menos de R$ 500' },
      { value: '500to999', label: 'De R$ 500 a R$ 999' },
      { value: '1000to1999', label: 'De R$ 1.000 a R$ 1.999' },
      { value: '2000to3999', label: 'De R$ 2.000 a R$ 3.999' },
      { value: '4000plus', label: 'R$ 4.000 ou mais' },
      { value: 'guidance', label: 'Quero entender os valores primeiro' },
    ],
  },
  {
    key: 'timing', title: 'Quando você gostaria de fazer?',
    help: 'Escolha seu momento. A data será combinada com o Gabriel.',
    options: [
      { value: 'soon', label: 'Nas próximas semanas' },
      { value: 'months', label: 'Nos próximos meses' },
      { value: 'trip', label: 'Durante uma viagem a Itapema' },
      { value: 'research', label: 'Estou pesquisando, sem data definida' },
    ],
  },
  {
    key: 'location', title: 'De onde você vem?',
    help: 'O atendimento é presencial, em Meia Praia, Itapema.',
    compact: true,
    options: [
      { value: 'itapema', label: 'Itapema' },
      { value: 'portobelo', label: 'Porto Belo' },
      { value: 'balneario', label: 'Balneário Camboriú' },
      { value: 'bombinhas', label: 'Bombinhas' },
      { value: 'tijucas', label: 'Tijucas' },
      { value: 'camboriu', label: 'Camboriú' },
      { value: 'itajai', label: 'Itajaí' },
      { value: 'other', label: 'Outra cidade' },
    ],
    other: { key: 'cityNote', label: 'Qual cidade?', placeholder: 'Sua cidade e estado', limit: 80, optional: true, autocomplete: 'address-level2' },
  },
  {
    key: 'availability', title: 'Quando fica melhor vir ao estúdio?',
    help: 'Atendemos de segunda a sábado, das 13h30 às 20h30. A agenda precisa ser confirmada.',
    options: [
      { value: 'afternoon', label: 'Durante a semana, à tarde' },
      { value: 'evening', label: 'Durante a semana, após as 18h' },
      { value: 'saturday', label: 'Prefiro sábado' },
      { value: 'flexible', label: 'Tenho flexibilidade de horário' },
      { value: 'organize', label: 'Ainda preciso me organizar para ir' },
    ],
  },
  {
    key: 'details', title: 'Como o Gabriel pode te chamar?',
    help: 'Só falta seu nome para preparar a mensagem com as suas escolhas.',
  },
];

export function clean(value, limit = 500) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit);
}

export function answerLabel(key, value) {
  return STEPS.find(step => step.key === key)?.options?.find(option => option.value === value)?.label || '';
}

export function validateStep(index, answers) {
  const step = STEPS[index];
  if (!step) return { field: 'project', message: 'Volte ao início para revisar suas respostas.' };
  if (step.options && !step.options.some(option => option.value === answers[step.key])) {
    return { field: step.key, message: 'Escolha uma opção para continuar.' };
  }
  if (step.key === 'details' && clean(answers.name, 60).length < 2) {
    return { field: 'name', message: 'Preencha seu nome com pelo menos 2 caracteres.' };
  }
  return null;
}

export function summaryRows(answers) {
  const labels = { project: 'Projeto', theme: 'Ideia', finish: 'Cores', references: 'Referências', placement: 'Região', size: 'Tamanho', budget: 'Investimento em mente', timing: 'Quando', location: 'Cidade', availability: 'Disponibilidade' };
  const rows = [['Nome', clean(answers.name, 60)]];
  for (const step of STEPS.filter(step => step.options)) {
    let value = answerLabel(step.key, answers[step.key]);
    if (step.other && answers[step.key] === 'other') {
      value = clean(answers[step.other.key], step.other.limit) || value;
    }
    if (value) rows.push([labels[step.key], value]);
  }
  if (clean(answers.notes)) rows.push(['Detalhes', clean(answers.notes, 500)]);
  return rows;
}

export function buildMessage(answers) {
  const intentions = {
    first: 'Quero fazer minha primeira tatuagem e gostaria da sua orientação.',
    new: 'Quero conversar com você sobre uma nova tatuagem.',
    cover: 'Quero avaliar a possibilidade de cobrir uma tatuagem que já tenho.',
    large: 'Quero conversar sobre um projeto de fechamento.',
  };
  const rows = summaryRows(answers).filter(([label]) => label !== 'Nome');
  return 'Olá, Gabriel! Meu nome é ' + clean(answers.name, 60) + '.\n\n'
    + (intentions[answers.project] || intentions.new) + '\nRespondi ao quiz do Junco e este é o meu resumo:\n\n'
    + rows.map(([label, value]) => label + ': ' + value).join('\n')
    + '\n\nVocê pode me orientar sobre o desenho, o valor e a disponibilidade?';
}

export function whatsappLink(message) {
  return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message.trim());
}
