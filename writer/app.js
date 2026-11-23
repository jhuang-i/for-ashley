const occasions = ['Morning', 'Date night', 'Thinking of you', 'A hard day', 'Celebration', 'Just because'];
const tones = ['Romantic', 'Supportive', 'Poetic', 'Less romantic'];
const images = ['Morning light', 'Nature', 'Stars', 'Galaxy', 'Everyday'];
const lengths = ['Brief', 'Balanced', 'Fuller'];
const defaults = { occasion: 'Morning', tone: 'Romantic', imagery: 'Morning light', length: 'Balanced', detail: '' };
const workspace = document.querySelector('#workspace');
const storageKey = 'notes-for-ashley-v1';
const readState = () => {
  try { return JSON.parse(localStorage.getItem(storageKey)) || {}; }
  catch { return {}; }
};
const state = { history: [], prompts: [], settings: defaults, daily: null, dateNight: null, used: {}, ...readState() };
const day = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const formatDay = (date, options) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...options }).format(new Date(date + 'T12:00:00Z'));
const clean = (value) => value.replace(/—/g, ', ').replace(/\bin\s+the\s+world\b/gi, 'anywhere').replace(/[ \t]{2,}/g, ' ').trim();
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const esc = escapeHtml;
let statusTimer;
function notify(message) {
  document.querySelector('#status').textContent = message;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { document.querySelector('#status').textContent = ''; }, 3000);
}
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); return true; }
  catch { notify('Browser storage is unavailable. Copy anything you want to keep.'); return false; }
}
const greetings = {
  Morning: ['Good morning, Ashley.', 'Morning, Ashley. I woke up thinking of you.', 'Hey Ashley, I wanted you to have something kind to wake up to.', 'Good morning, Ashley. I hope you got some real rest.'],
  'Date night': ['I’m looking forward to tonight, Ashley.', 'Hey Ashley, I’ve been looking forward to having time with you.', 'I’m glad we get tonight together, Ashley.', 'Ashley, I keep catching myself smiling about tonight.'],
  'Thinking of you': ['You crossed my mind today, Ashley.', 'Hey Ashley, I was just thinking of you.', 'I wanted to check in, Ashley.', 'Ashley, I thought of you today and wanted to tell you.'],
  'A hard day': ['Hey Ashley, I know today’s been a lot.', 'I’ve been thinking about you, Ashley.', 'Ashley, I wish I could make today a bit easier for you.', 'Hey Ashley, I wanted to leave you a little kindness today.'],
  Celebration: ['I’m so glad you get to celebrate this, Ashley.', 'Ashley, I hope you’re taking a minute to enjoy this.', 'I’m proud of you, Ashley.', 'Ashley, I hope you’ve let yourself grin about this today.'],
  'Just because': ['Hey Ashley, I wanted to write you a little note.', 'I’ve been thinking of you, Ashley.', 'Ashley, I had something sweet I wanted to tell you.', 'Hey Ashley, I felt like leaving you a little surprise.']
};
const wishes = {
  Romantic: ['I love how easily a few minutes with you can become the part of the day I wish I could replay.', 'I love you. I wish I could say it right beside you and hear the little smile in your voice.', 'I’d gladly steal a few extra minutes with you, even if we spent them talking about absolutely nothing.', 'My favorite part of getting to know you is how often I still find something new to love.'],
  Supportive: ['I hope you get to take things one at a time and lean on me if you need to.', 'I’m here if you want to talk, vent, or just have quiet company.', 'There’s room for however you feel today. I’m glad to sit with you through it.', 'Take whatever time you need today. I’m thinking of you and I’m here whenever you want company.'],
  Poetic: ['I wish I could tuck a little peace into your day and leave it somewhere you’d find it by surprise.', 'I hope something lovely catches you off guard and stays with you long after the moment passes.', 'Some moments ask so little of us and still give us something worth keeping. I hope you find one today.', 'I hope you have a moment worth taking slowly, the sort you can still feel hours later.'],
  'Less romantic': ['I hope you find something to laugh about today. Tell me about it later if you feel like it.', 'I’m glad we get to share the little things. I always like hearing what your day has been like.', 'Hope you get some time for yourself and something good to look forward to.', 'I hope something today turns out better than you expected. I’d love to hear about it.']
};
const scenes = {
  'Morning light': [
    ['I hope the first light feels gentle on you today.', 'I hope you get a minute like that first patch of sun on the floor, when even the dust seems to have somewhere pleasant to be.'],
    ['I hope you catch a sliver of sunlight and get to stand in it for a while.', 'There’s a particular kind of light that makes the edges of ordinary things beautiful. I hope a little of it follows you through the day.'],
    ['I hope the day gives you a moment as warm as sun through a window.', 'I wish I could leave you a little of that amber light that slips through the blinds and makes you want to stay in bed just a minute longer.'],
    ['I hope you get a few minutes of sun across your shoulders.', 'I hope there’s a place you can sit for a few minutes where the light falls across your hands and you can let everything else wait.']
  ],
  Nature: [
    ['I hope you get a breath of air that smells like rain.', 'I hope something brings you the same quiet as the first rain on warm pavement, when you can open a window and let the rest of the day fall away.'],
    ['I hope you find a moment as easy as watching leaves move in the wind.', 'Somewhere there are leaves turning their pale undersides to the wind. I hope you get to notice something that small and lovely today.'],
    ['I hope something good finds you as quietly as dew on the grass.', 'I hope the day holds something you almost walk past, like a bright drop of rain caught in the bend of a leaf.'],
    ['I hope you get to hear birds through an open window.', 'I wish you a moment like standing under a tree just after the rain, close enough to hear each drop fall through the leaves.']
  ],
  Stars: [
    ['I hope you get a little moment like spotting the first star.', 'I love that one bright star can make you stop halfway to the door and look up. I hope something gives you that small surprise today.'],
    ['If the sky clears tonight, I hope you catch a few stars.', 'I hope you get a moment like stepping out beneath a clear sky and seeing more stars the longer you stand there.'],
    ['I hope you catch a little starlight before the day is over.', 'If you see a star through your window tonight, I hope you give yourself a minute to look at it before reaching for your phone.']
  ],
  Galaxy: [
    ['I hope you find a little wonder today, the kind you feel looking up at the Milky Way.', 'The Milky Way looks like a silver brushstroke until you remember how many suns it holds. I hope something ordinary opens up like that for you today.'],
    ['I hope you get a moment big enough to make the day’s worries feel a little smaller.', 'I hope you find the sort of quiet you get when you picture a galaxy turning slowly, all those bright places carrying on without a sound.'],
    ['I hope there’s something radiant waiting for you in the middle of your day.', 'I keep thinking of those pictures of galaxies where the brightest stars are tucked among wide ribbons of dust. I hope you find something radiant in an unlikely corner today.']
  ],
  Everyday: [
    ['I hope you get a meal you really enjoy and a little time to yourself.', 'I hope the day gives you one of those ordinary pleasures you remember later, like the first sip of a drink you made exactly the way you like it.'],
    ['I hope a good song comes on at exactly the right time.', 'I hope a song you’d almost forgotten finds you today and gives you a reason to turn it up a little.'],
    ['I hope you get a few minutes to do whatever you want.', 'I hope you get a few unclaimed minutes to play something, put on a favorite song, or just sit somewhere comfortable.']
  ]
};
const endings = {
  Romantic: ['I’m sending you a kiss and saving one for later.', 'I love you, and I’m glad I get to tell you again today.', 'I can’t wait to hear your voice again.', 'I’m holding you a little closer in my thoughts today.'],
  Supportive: ['You can take today at your own pace.', 'I’m rooting for you through the small stuff, too.', 'There’s no hurry to reply. I just wanted to check in.', 'If you want a little company later, I’d be glad to spend some time with you.'],
  Poetic: ['I hope the day leaves you with a good memory to carry into tomorrow.', 'I hope you get to keep a little of that feeling for later.', 'I wanted to leave you something small and good to come back to.', 'I hope today gives you a reason to set everything down and smile.'],
  'Less romantic': ['I’d love to hear how your day goes.', 'Hope you get a moment to put your feet up later.', 'Talk whenever you feel like it.', 'Sending you a little good luck for the rest of the day.']
};
function pickIndex(key, size) {
  let choices = state.used[key] || [];
  if (!choices.length) {
    choices = Array.from({ length: size }, (_, index) => index);
    for (let index = size - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [choices[index], choices[other]] = [choices[other], choices[index]];
    }
  }
  const next = choices.shift();
  state.used[key] = choices;
  return next;
}
function generate(settings) {
  const { occasion, tone, imagery, length, detail } = settings;
  const greeting = greetings[occasion];
  const wish = wishes[tone];
  const scene = scenes[imagery];
  const ending = endings[tone];
  const startIndex = pickIndex('greeting/' + occasion, greeting.length);
  const wishIndex = pickIndex('wish/' + tone, wish.length);
  const sceneIndex = pickIndex('scene/' + imagery, scene.length);
  const endIndex = pickIndex('ending/' + tone, ending.length);
  const detailText = clean(detail);
  const personal = detailText ? detailText + (/[.!?…]$/.test(detailText) ? '' : '.') : '';
  const night = occasion === 'Date night' ? 'I’m looking forward to an evening where we can settle in and spend some time together.' : '';
  const short = [greeting[startIndex], personal, length === 'Brief' ? ending[endIndex] : (night || scene[sceneIndex][0]), length === 'Fuller' ? wish[wishIndex] : ''];
  const poetic = [greeting[(startIndex + 1) % greeting.length], personal, scene[(sceneIndex + 1) % scene.length][1], length === 'Brief' ? ending[endIndex] : wish[(wishIndex + 1) % wish.length], length === 'Fuller' ? (night || ending[(endIndex + 1) % ending.length]) : ''];
  return [short, poetic].map((lines) => clean(lines.filter(Boolean).join(' ')));
}
const themeCards = [
  ['Morning light', 'Sun on the windowsill, warm hands, or a room filling slowly with gold.'],
  ['Nature', 'Rain on pavement, leaves in the wind, or birds heard through an open window.'],
  ['Stars', 'The first star after sunset, a clear sky, or a quiet minute by the window.'],
  ['Galaxy', 'The Milky Way, distant suns, and the scale of the sky.'],
  ['Everyday', 'A favorite song, a good meal, or a game you’re looking forward to playing together.']
];
const starterPrompts = [
  { name: 'A soft start', occasion: 'Morning', tone: 'Romantic', imagery: 'Morning light', length: 'Balanced', detail: '' },
  { name: 'Room to breathe', occasion: 'A hard day', tone: 'Supportive', imagery: 'Nature', length: 'Brief', detail: '' },
  { name: 'Under the same sky', occasion: 'Thinking of you', tone: 'Poetic', imagery: 'Stars', length: 'Fuller', detail: '' },
  { name: 'An evening together', occasion: 'Date night', tone: 'Romantic', imagery: 'Stars', length: 'Balanced', detail: '' },
  { name: 'A simple hello', occasion: 'Just because', tone: 'Less romantic', imagery: 'Everyday', length: 'Brief', detail: '' }
];
const pages = {
  today: ['Today’s message', 'A little warmth for Ashley to wake up to.'],
  history: ['Message history', 'Find the words you saved by date or occasion.'],
  themes: ['Recurring themes', 'Start with an image you’d like to share with Ashley.'],
  date: ['Date night', 'Write a little something for the time you get together.'],
  prompts: ['Reusable prompts', 'Keep your favorite settings ready for another day.']
};
let view = 'today';
let draft;
let editId;
let filter = { date: '', occasion: '', search: '' };
function todayDraft() {
  if (!state.daily || day() !== state.daily.openedOn) {
    const settings = { ...defaults, ...state.settings, occasion: 'Morning' };
    state.daily = { openedOn: day(), ...makeDraft(settings) };
    persist();
  }
  return state.daily;
}
function makeDraft(settings) {
  return { date: day(), settings, texts: generate(settings) };
}
function show(target) {
  view = target;
  editId = null;
  if (target === 'today') draft = todayDraft();
  if (target === 'date') draft = state.dateNight ||= makeDraft({ ...defaults, occasion: 'Date night', imagery: 'Stars' });
  render();
  window.scrollTo(0, 0);
}
function render() {
  const [title, subtitle] = pages[view];
  document.querySelector('#today-label').textContent = formatDay(day(), { weekday: 'long', month: 'long', day: 'numeric' });
  document.querySelector('#title').textContent = editId ? 'Edit saved message' : title;
  document.querySelector('#subtitle').textContent = editId ? 'Review the wording and save your changes.' : subtitle;
  document.querySelectorAll('nav button').forEach((button) => {
    if (button.dataset.view === view) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  if (view === 'today' || view === 'date' || editId) renderComposer();
  else if (view === 'history') renderHistory();
  else if (view === 'themes') renderThemes();
  else renderPrompts();
}
const options = (values, current) => values.map((value) => '<option' + (value === current ? ' selected' : '') + '>' + esc(value) + '</option>').join('');
const select = (label, name, values, current) => '<label>' + label + '<select name="' + name + '">' + options(values, current) + '</select></label>';
function renderComposer() {
  const s = draft.settings;
  const editor = Boolean(editId);
  const variants = editor ? [draft.variant] : ['Short option', 'Poetic option'];
  workspace.innerHTML = `
    <div class="layout">
      <section class="panel settings"><h2>${editor ? 'Message details' : 'Make it yours'}</h2>
      <form id="settings">
        <div class="pair">${select('Occasion', 'occasion', occasions, s.occasion)}${select('Tone', 'tone', tones, s.tone)}</div>
        <div class="pair">${select('Imagery', 'imagery', images, s.imagery)}${select('Length', 'length', lengths, s.length)}</div>
        <label>${editor ? 'Date' : 'Write for'}<input type="date" name="date" required value="${esc(draft.date)}"></label>
        ${editor ? '' : `<label>Personal line <small>Optional. Added to both drafts.</small><textarea name="detail" rows="2" maxlength="320" placeholder="I loved hearing you laugh last night.">${esc(s.detail)}</textarea></label>
        <button class="primary" type="submit">✦ &nbsp; Generate both drafts</button>
        <button type="button" data-action="save-prompt">Save settings as prompt</button>`}
      </form></section>
      <section><div class="section-head"><h2>${editor ? 'Saved draft' : 'Your drafts'}</h2></div>
      <div class="drafts">${variants.map((label, index) => `
        <article class="draft">
          <h3><span aria-hidden="true">${label === 'Short option' ? '☀' : '✧'}</span>${esc(label)}</h3>
          <label class="draft-editor">Edit message<textarea aria-label="${esc(label)} message" data-text="${index}" rows="${label === 'Short option' ? 4 : 6}">${esc(draft.texts[index])}</textarea></label>
          <div class="actions">
             <button type="button" class="primary" data-action="save" data-index="${index}">${editor ? 'Save changes' : 'Save message'}</button>
             <button type="button" data-action="copy" data-index="${index}">Copy</button>
             <button type="button" data-action="publish" data-index="${index}">Publish for Ashley</button>
             ${editor ? '<button type="button" data-action="cancel">Back to history</button>' : ''}
          </div>
        </article>`).join('')}</div></section>
    </div>`;
}
function renderHistory() {
  workspace.innerHTML = `
   <div class="section-head"><h2>Saved messages</h2></div>
   <div class="filters">
    <input name="search" type="search" aria-label="Search messages" placeholder="Search messages" value="${esc(filter.search)}">
    <input name="date" type="date" aria-label="Filter by date" value="${esc(filter.date)}">
    <select name="occasion" aria-label="Filter by occasion"><option value="">All occasions</option>${options(occasions, filter.occasion)}</select>
    <button data-action="clear">Clear filters</button>
   </div><div class="stack" id="records"></div>`;
  renderRecords();
}
function renderRecords() {
  const records = state.history.filter((note) =>
    (!filter.date || note.date === filter.date) &&
    (!filter.occasion || note.settings.occasion === filter.occasion) &&
    note.text.toLowerCase().includes(filter.search.toLowerCase().trim()));
  document.querySelector('#records').innerHTML = records.map((note) => `
   <article class="panel record"><div class="meta">${esc(formatDay(note.date, { month:'long', day:'numeric', year:'numeric' }))} · ${esc(note.settings.occasion)} · ${esc(note.settings.tone)}</div>
   <h3>${esc(note.variant)}</h3><p>${esc(note.text)}</p>
   <div class="actions"><button data-action="edit" data-id="${note.id}">Edit</button><button data-action="reuse" data-id="${note.id}">Reuse</button><button data-action="copy-saved" data-id="${note.id}">Copy</button><button data-action="publish-saved" data-id="${note.id}">Publish for Ashley</button></div></article>`).join('') ||
   '<div class="empty">' + (state.history.length ? 'No messages match these filters.' : 'Save a draft to start your message history.') + '</div>';
}
function renderThemes() {
  workspace.innerHTML = '<div class="grid">' + themeCards.map(([name, description]) =>
    `<article class="panel"><h3>${esc(name)}</h3><p>${esc(description)}</p><button data-action="theme" data-name="${esc(name)}">Use this theme</button></article>`).join('') + '</div>';
}
function renderPrompts() {
  workspace.innerHTML = '<div class="grid">' + [...state.prompts, ...starterPrompts].map((prompt, index) =>
    `<article class="panel"><h3>${esc(prompt.name)}</h3><p>${esc([prompt.occasion, prompt.tone, prompt.imagery, prompt.length].join(' · '))}</p>
    ${prompt.detail ? '<p>' + esc(prompt.detail) + '</p>' : ''}
    <button data-action="prompt" data-index="${index}">Use prompt</button></article>`).join('') + '</div>';
}
function readForm() {
  const form = document.querySelector('#settings');
  const values = new FormData(form);
  const { date, ...settings } = Object.fromEntries(values);
  return { date: date || day(), settings: { ...draft.settings, ...settings } };
}
function saveDraft(index) {
  const text = clean(draft.texts[index]);
  if (!text) { notify('Write a message before saving.'); return; }
  if (!document.querySelector('#settings').reportValidity()) return;
  const { settings, date } = readForm();
  const variant = editId ? draft.variant : (index === 0 ? 'Short option' : 'Poetic option');
  const existing = state.history.find((note) => note.id === editId ||
    (!editId && note.text === text && note.date === date && note.settings.occasion === settings.occasion && note.variant === variant));
  if (existing && !editId) { notify('This message is already saved.'); return; }
  const note = { id: existing?.id || crypto.randomUUID(), date, variant, settings, text };
  if (existing) Object.assign(existing, note);
  else state.history.unshift(note);
  const saved = persist();
  if (editId && saved) { filter = { date: '', occasion: '', search: '' }; show('history'); }
  if (saved) notify(existing ? 'Changes saved.' : 'Message saved to history.');
}
async function publishNote(button, date, occasion, text) {
  const message = clean(text);
  if (!message || message.length > 5000) {
    notify('Write a note between 1 and 5,000 characters.');
    return;
  }
  const entry = JSON.stringify({ day: date, occasion, message }, null, 2);
  const url = new URL('https://github.com/jhuang-i/for-ashley/issues/new');
  url.searchParams.set('title', 'Publish a note for Ashley');
  url.searchParams.set('body', entry);
  if (url.href.length > 7000) {
    try {
      await navigator.clipboard.writeText(entry);
      url.searchParams.delete('body');
      notify('Long note copied. Paste it into the GitHub issue body.');
    } catch {
      notify('Couldn’t copy this long note. Try shortening it.');
      return;
    }
  }
  window.location.assign(url.href);
}
async function copy(text) {
  if (!text.trim()) { notify('There’s no message to copy yet.'); return; }
  try { await navigator.clipboard.writeText(clean(text)); notify('Message copied.'); }
  catch { notify('Clipboard unavailable. Select and copy the message text.'); }
}
function applyPrompt(settings, reusedNote) {
  const target = settings.occasion === 'Date night' ? 'date' : 'today';
  show(target);
  Object.assign(draft, makeDraft(settings));
  if (reusedNote) draft.texts[reusedNote.variant === 'Short option' ? 0 : 1] = reusedNote.text;
  persist();
  render();
}
document.querySelector('nav').addEventListener('click', (event) => {
  const button = event.target.closest('[data-view]');
  if (button) show(button.dataset.view);
});
workspace.addEventListener('input', (event) => {
  const field = event.target;
  if (field.matches('[data-text]')) {
    draft.texts[Number(field.dataset.text)] = field.value;
    if (!editId) persist();
  } else if (field.closest('.filters')) {
    filter[field.name] = field.value;
    renderRecords();
  } else if (field.closest('#settings') && !editId) {
    const { settings, date } = readForm();
    draft.settings = settings;
    if (field.name === 'date' && field.value) draft.date = date;
    if (view === 'today') state.settings = settings;
    persist();
  }
});
workspace.addEventListener('submit', (event) => {
  if (event.target.id !== 'settings') return;
  event.preventDefault();
  if (editId) return;
  const { date, settings } = readForm();
  Object.assign(draft, { date, settings, texts: generate(settings) });
  if (view === 'today') state.settings = settings;
  persist();
  renderComposer();
  notify('Two fresh drafts are ready.');
});
workspace.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action, index, id, name } = button.dataset;
  const note = state.history.find((item) => item.id === id);
  if (action === 'save') saveDraft(Number(index));
  if (action === 'publish' && document.querySelector('#settings').reportValidity()) {
    const { date, settings } = readForm();
    publishNote(button, date, settings.occasion, draft.texts[Number(index)]);
  }
  if (action === 'publish-saved') publishNote(button, note.date, note.settings.occasion, note.text);
  if (action === 'copy') copy(draft.texts[Number(index)]);
  if (action === 'copy-saved') copy(note.text);
  if (action === 'cancel') show('history');
  if (action === 'clear') { filter = { date: '', occasion: '', search: '' }; renderHistory(); }
  if (action === 'edit') {
    editId = id;
    draft = { ...note, settings: { ...note.settings }, texts: [note.text] };
    render();
    window.scrollTo(0, 0);
  }
  if (action === 'reuse') applyPrompt(note.settings, note);
  if (action === 'theme') applyPrompt({ ...defaults, ...state.settings, imagery: name });
  if (action === 'prompt') {
    const { name: title, ...settings } = [...state.prompts, ...starterPrompts][Number(index)];
    applyPrompt(settings);
  }
  if (action === 'save-prompt') {
    const settings = readForm().settings;
    const title = window.prompt('Give these settings a name', settings.tone + ' ' + settings.occasion.toLowerCase());
    if (!title?.trim()) return;
    state.prompts.unshift({ ...settings, name: title.trim().slice(0, 80) });
    if (persist()) notify('Prompt saved.');
  }
});
show('today');
