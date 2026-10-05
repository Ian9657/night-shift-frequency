const registerReview = document.querySelector('[data-register-review]');
const reviewAccess = document.querySelector('[data-review-sale]');
let draftRecordChoice = null;

function openRegisterReview() {
  if (!shiftStarted || state.busy) return;
  draftRecordChoice = null;
  renderRegisterReview();
  if (!registerReview.open) registerReview.showModal();
}

function renderRegisterReview() {
  const focusedChoice = registerReview.querySelector('input:focus')?.value;
  const archiveWasOpen = registerReview.querySelector('details')?.open;
  const order = currentEvent();
  const full = eventScannedItems().length === order.items.length;
  const decision = shiftState.decisionFor(order.id);
  const checks = shiftState.checksFor(order.id);
  const deciding = Boolean(order.mismatch && full && !decision && checks.length);
  const prior = shiftState.decisionFor(order.linkedOrderId);
  const body = document.querySelector('[data-review-body]');
  body.replaceChildren();
  function recordTable(title, pairs, className = '') {
    const heading = document.createElement('h3');
    heading.textContent = title;
    const dl = document.createElement('dl');
    dl.className = className;
    for (const [key, value, tone] of pairs) {
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = key; dd.textContent = value;
      if (tone) dd.className = tone;
      dl.append(dt, dd);
    }
    body.append(heading, dl);
  }
  if (state.reportShown) {
    const report = shiftState.report();
    recordTable('SHIFT CLOSED', [['SALES', money(report.sales)], ['TRANSACTIONS', report.orders],
      ['OVERRIDES', report.overrides], ['LINKS', report.links], ['CURRENT SCAN', report.verified]]);
  }
  const conflicting = full && order.items.some(item => item.real && item.real !== item.pos);
  recordTable(order.id.toUpperCase(), [
    ['TIME', order.clock, 'muted'],
    ['ITEM', order.items.map(item => item.real || item.pos).join(' / '), conflicting ? 'anomaly' : ''],
    ['REGISTER', full ? order.items.map(item => shiftState.currentRegisterObservation(order.id, item.id)).join(' / ') : 'AWAITING SCAN', conflicting ? 'anomaly' : ''],
    ...(order.mismatch ? [['RE-SCAN', checks.at(-1)?.result || 'PENDING', checks.length ? '' : 'muted']] : []),
  ]);
  if (order.decisionKind === 'provenance' && prior) {
    recordTable('LINKED TRANSACTION / ' + prior.orderId.toUpperCase(), [
      ['ENTRY', prior.finalRecordedLabel], ['ORIGIN', prior.recordOrigin],
      ['VERIFY', prior.verificationMode],
    ]);
  }
  if (order.mismatch && full && !checks.length) {
    const instruction = document.createElement('p');
    instruction.className = 'register-instruction';
    instruction.textContent = 'RETURN TO COUNTER TO RE-SCAN';
    body.append(instruction);
  }
  if (decision) {
    recordTable('SAVED ENTRY', [['LABEL', decision.finalRecordedLabel], ['ORIGIN', decision.recordOrigin],
      ['VERIFY', decision.verificationMode],
      ...(decision.linkedOrderId ? [['FROM', decision.linkedOrderId.toUpperCase()]] : [])], 'saved-entry');
  }
  const fieldset = document.querySelector('[data-review-choices]');
  fieldset.querySelectorAll('label').forEach(node => node.remove());
  fieldset.hidden = !deciding;
  const choices = order.decisionKind === 'identity'
    ? [['keep', 'KEEP REGISTER ENTRY'], ['correct', 'CORRECT TO ITEM']]
    : [['linked', 'USE LINKED ENTRY'], ['independent', 'USE CURRENT SCAN']];
  const save = document.querySelector('[data-submit-record]');
  function showPreview() {
    const preview = document.querySelector('[data-review-preview]');
    preview.replaceChildren();
    preview.hidden = !deciding || !draftRecordChoice;
    if (preview.hidden) return;
    const record = shiftState.previewDecision(order.id, draftRecordChoice);
    for (const [key, value] of [['LABEL', record.finalRecordedLabel], ['ORIGIN', record.recordOrigin],
      ['VERIFY', record.verificationMode], ...(record.linkedOrderId ? [['FROM', record.linkedOrderId.toUpperCase()]] : [])]) {
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = key; dd.textContent = value; preview.append(dt, dd);
    }
  }
  if (deciding) for (const [value, title] of choices) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio'; input.name = 'record-choice'; input.value = value;
    input.checked = draftRecordChoice === value;
    const text = document.createElement('span'); text.textContent = title;
    label.append(input, text); fieldset.append(label);
    input.addEventListener('change', () => {
      draftRecordChoice = value;
      showPreview();
      save.disabled = dialogueLocked || state.busy;
    });
  }
  showPreview();
  save.disabled = !deciding || !draftRecordChoice || dialogueLocked || state.busy;
  save.hidden = !deciding;
  if (order.decisionKind !== 'identity' || state.reportShown) {
    const archive = document.createElement('details');
    archive.open = Boolean(archiveWasOpen);
    const summary = document.createElement('summary'); summary.textContent = 'PAID TRANSACTIONS';
    archive.append(summary);
    for (const transaction of shiftState.transactions.slice().reverse()) {
      const paragraph = document.createElement('p');
      paragraph.textContent = transaction.orderId.toUpperCase() + ' / ' +
        transaction.lines.map(p => p.label + ' x' + p.quantity).join(' / ') +
        ' / ' + money(transaction.total) + ' / ' + transaction.recordOrigin + ' / ' + transaction.verificationMode +
        (transaction.linkedOrderId ? ' / FROM ' + transaction.linkedOrderId.toUpperCase() : '');
      archive.append(paragraph);
    }
    body.append(archive);
  }
  if (focusedChoice) {
    [...fieldset.querySelectorAll('input')].find(input => input.value === focusedChoice)?.focus({ preventScroll: true });
  }
}
reviewAccess.addEventListener('click', openRegisterReview);
document.querySelector('[data-close-review]').addEventListener('click', () => registerReview.close());
document.querySelector('[data-submit-record]').addEventListener('click', () => submitRegisterDecision(draftRecordChoice));
document.querySelector('[data-review-rescan]').addEventListener('click', () => registerReview.close());
