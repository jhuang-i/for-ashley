const storageKey = 'notes-for-ashley-v1';
const byId = id => document.getElementById(id);
const form = byId('letter-form');
const date = byId('letter-day');
const occasion = byId('occasion');
const message = byId('message');
const eastern = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
const today = eastern.format(new Date());
const prettyDate = day => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(day + 'T12:00:00Z'));
byId('today-label').textContent = prettyDate(today);

function read() {
  try { return JSON.parse(localStorage.getItem(storageKey)) || {}; }
  catch { return {}; }
}
let timer;
function notify(text) {
  byId('status').textContent = text;
  clearTimeout(timer);
  timer = setTimeout(() => { byId('status').textContent = ''; }, 4200);
}
function persist(changes) {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ ...read(), ...changes }));
    return true;
  } catch {
    notify('This browser couldn’t save your draft.');
    return false;
  }
}
function populate(note) {
  date.value = note?.date || today;
  occasion.value = note?.settings?.occasion || 'Morning';
  if (!occasion.value) occasion.value = 'Morning';
  message.value = note?.text || '';
}
const snapshot = () => ({ date: date.value, settings: { occasion: occasion.value }, text: message.value });
populate(read().letterDraft);
form.addEventListener('input', () => persist({ letterDraft: snapshot() }));

function renderHistory() {
  const history = byId('history');
  history.replaceChildren();
  const notes = read().history || [];
  if (!notes.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Notes you save on this browser will appear here.';
    history.append(empty);
  }
  for (const note of notes) {
    const card = document.createElement('article');
    card.className = 'panel';
    const title = document.createElement('h3');
    title.textContent = prettyDate(note.date) + ' · ' + note.settings.occasion;
    const text = document.createElement('p');
    text.textContent = note.text;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Open in editor';
    button.addEventListener('click', () => {
      if (message.value.trim() && message.value !== note.text &&
          !window.confirm('Replace the text in the editor with this saved note?')) return;
      populate(note);
      persist({ letterDraft: snapshot() });
      message.focus();
    });
    card.append(title, text, button);
    history.append(card);
  }
}
renderHistory();

byId('save').addEventListener('click', () => {
  if (!form.reportValidity() || !message.value.trim()) return;
  const note = snapshot();
  const history = read().history || [];
  if (history.some(item => item.date === note.date && item.settings.occasion === note.settings.occasion && item.text === note.text)) {
    notify('This draft is already saved.');
    return;
  }
  if (persist({ letterDraft: note, history: [{ ...note, id: crypto.randomUUID() }, ...history] })) {
    renderHistory();
    notify('Draft saved.');
  }
});
byId('preview').addEventListener('click', () => {
  if (!form.reportValidity()) return;
  const preview = byId('letter-preview');
  preview.querySelector('time').dateTime = date.value;
  preview.querySelector('time').textContent = prettyDate(date.value);
  preview.querySelector('.preview-occasion').textContent = occasion.value;
  preview.querySelector('.preview-message').textContent = message.value;
  preview.showModal();
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  const text = message.value.trim();
  if (!text) { notify('Write a letter before publishing.'); return; }
  const entry = JSON.stringify({ day: date.value, occasion: occasion.value, message: text }, null, 2);
  const url = new URL('https://github.com/jhuang-i/for-ashley/issues/new');
  url.searchParams.set('title', 'Publish a note for Ashley');
  url.searchParams.set('body', entry);
  if (url.href.length > 7000) {
    try {
      await navigator.clipboard.writeText(entry);
      url.searchParams.delete('body');
      if (!window.confirm('Your long note was copied. Open GitHub and paste it into the issue body?')) return;
    } catch {
      notify('Couldn’t copy this long note. Try shortening it.');
      return;
    }
  }
  persist({ letterDraft: snapshot() });
  window.location.assign(url.href);
});
