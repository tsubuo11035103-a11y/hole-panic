const DEFAULT_IMAGE = './assets/tsubuo.png';

const stages = [
  { id: 1, title: 'おひるね', mode: 'sleep', premium: false, count: 20, black: 1, fever: 1, time: 60, fieldScale: 1.45, speed: 0, desc: 'ねているキャラをぜんぶ回収しよう！' },
  { id: 2, title: 'おさんぽ', mode: 'walk', premium: false, count: 25, black: 1, fever: 1, time: 70, fieldScale: 1.65, speed: 0.42, desc: 'てくてく歩くキャラをつかまえよう！' },
  { id: 3, title: '逃走中', mode: 'escape', premium: false, count: 30, black: 2, fever: 1, time: 80, fieldScale: 1.85, speed: 0.72, desc: 'にげるキャラをおいかけろ！' },
  { id: 4, title: 'おひるね王国', mode: 'sleep', premium: true, count: 50, black: 2, fever: 1, time: 90, fieldScale: 2.1, speed: 0, desc: 'ふかふか王国で大量回収！' },
  { id: 5, title: 'あわてんぼうさんぽ', mode: 'walk', premium: true, count: 60, black: 2, fever: 1, time: 100, fieldScale: 2.35, speed: 0.74, desc: 'あわてて歩くキャラをまとめて回収！' },
  { id: 6, title: '超逃走中', mode: 'escape', premium: true, count: 80, black: 3, fever: 1, time: 120, fieldScale: 2.7, speed: 1.03, desc: '超にげるキャラを最後まで追いかけろ！' },
];

const $ = (id) => document.getElementById(id);
const screens = ['homeScreen', 'introScreen', 'gameScreen', 'resultScreen'];
const els = {
  stageList: $('stageList'), licenseInput: $('licenseInput'), unlockButton: $('unlockButton'), unlockMessage: $('unlockMessage'),
  uploadPanel: $('uploadPanel'), imageUpload: $('imageUpload'), resetImageButton: $('resetImageButton'),
  introStageNo: $('introStageNo'), introTitle: $('introTitle'), introDescription: $('introDescription'), startButton: $('startButton'), backFromIntroButton: $('backFromIntroButton'),
  field: $('field'), viewport: $('gameViewport'), timeLeft: $('timeLeft'), collectedText: $('collectedText'), holeLevelText: $('holeLevelText'), statusBanner: $('statusBanner'),
  resultTitle: $('resultTitle'), rankBadge: $('rankBadge'), rankName: $('rankName'), rankComment: $('rankComment'), resultTime: $('resultTime'), retryButton: $('retryButton'), homeButton: $('homeButton'),
  soundButton: $('soundButton')
};

let premium = localStorage.getItem('holePanicPremium') === 'true';
let characterImage = localStorage.getItem('holePanicImage') || DEFAULT_IMAGE;
let selectedStage = null;
let game = null;
let audioOn = true;
let audioContext = null;

function showScreen(id) {
  screens.forEach((screen) => $(screen).classList.toggle('active', screen === id));
}

function updatePremiumUI() {
  els.uploadPanel.classList.toggle('locked-panel', !premium);
  renderStages();
}

function renderStages() {
  els.stageList.innerHTML = '';
  stages.forEach((stage) => {
    const locked = stage.premium && !premium;
    const best = localStorage.getItem(`holePanicBest_${stage.id}`);
    const btn = document.createElement('button');
    btn.className = `stage-card ${locked ? 'locked' : ''}`;
    btn.type = 'button';
    btn.innerHTML = `
      <div>
        <span>STAGE ${stage.id}${stage.premium ? ' / 有料' : ' / 無料'}</span>
        <strong>${locked ? '🔒 ' : ''}${stage.title}</strong>
        <span>${stage.count}体・${stage.time}秒${best ? `・BEST ${best}` : ''}</span>
      </div>
      <div class="stage-pill">${locked ? '合言葉' : 'あそぶ'}</div>
    `;
    btn.addEventListener('click', () => {
      if (locked) {
        els.licenseInput.focus();
        els.unlockMessage.textContent = '有料ステージは合言葉で解放できます。';
        return;
      }
      openIntro(stage);
    });
    els.stageList.appendChild(btn);
  });
}

async function unlockPremium() {
  const key = els.licenseInput.value.trim();
  if (!key) return;
  els.unlockButton.disabled = true;
  els.unlockMessage.textContent = '確認中…';
  try {
    const res = await fetch('/api/check-license', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key })
    });
    const data = await res.json();
    if (data.ok) {
      premium = true;
      localStorage.setItem('holePanicPremium', 'true');
      els.unlockMessage.textContent = '有料版を解放しました！';
      playSound('clear');
      updatePremiumUI();
    } else {
      els.unlockMessage.textContent = '合言葉がちがうみたいです。';
      playSound('bad');
    }
  } catch {
    els.unlockMessage.textContent = '認証APIに接続できません。Vercel設定前は使えません。';
  } finally {
    els.unlockButton.disabled = false;
  }
}

function openIntro(stage) {
  selectedStage = stage;
  els.introStageNo.textContent = `STAGE ${stage.id}`;
  els.introTitle.textContent = stage.title;
  els.introDescription.textContent = stage.desc;
  showScreen('introScreen');
}

function getAudio() {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  return audioContext;
}

function beep(freq, duration, type = 'sine', gainValue = 0.05) {
  if (!audioOn) return;
  const ctx = getAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = gainValue;
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playSound(kind) {
  if (!audioOn) return;
  if (kind === 'pop') { beep(580, .08); setTimeout(() => beep(760, .06), 45); }
  if (kind === 'level') { [520, 660, 820].forEach((f, i) => setTimeout(() => beep(f, .09, 'triangle'), i * 65)); }
  if (kind === 'fever') { [740, 980, 1220].forEach((f, i) => setTimeout(() => beep(f, .12, 'sine', .06), i * 80)); }
  if (kind === 'bad') { beep(160, .22, 'sawtooth', .04); }
  if (kind === 'clear') { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, .13, 'triangle', .06), i * 90)); }
}

function startGame() {
  showScreen('gameScreen');
  const rect = els.viewport.getBoundingClientRect();
  const fieldW = Math.floor(rect.width * selectedStage.fieldScale);
  const fieldH = Math.floor(rect.height * selectedStage.fieldScale);
  game = {
    stage: selectedStage,
    width: fieldW,
    height: fieldH,
    viewW: rect.width,
    viewH: rect.height,
    offsetX: 0,
    offsetY: 0,
    holeX: rect.width / 2,
    holeY: rect.height / 2,
    holeLevel: 1,
    collected: 0,
    totalTargets: selectedStage.count,
    characters: [],
    startedAt: performance.now(),
    timeLeft: selectedStage.time,
    running: true,
    feverUntil: 0,
    shrinkUntil: 0,
    lastFrame: performance.now()
  };
  els.field.innerHTML = '';
  els.field.style.width = `${fieldW}px`;
  els.field.style.height = `${fieldH}px`;
  createHole();
  spawnCharacters();
  bindPointer();
  playSound('level');
  requestAnimationFrame(loop);
}

function createHole() {
  const hole = document.createElement('div');
  hole.className = 'hole';
  els.field.appendChild(hole);
  game.holeEl = hole;
  updateHole();
}

function holeSize() {
  const base = [72, 96, 120][game.holeLevel - 1] || 72;
  if (performance.now() < game.feverUntil) return 148;
  if (performance.now() < game.shrinkUntil) return 52;
  return base;
}

function updateHole() {
  const size = holeSize();
  const worldX = game.offsetX + game.holeX;
  const worldY = game.offsetY + game.holeY;
  game.holeEl.style.left = `${worldX}px`;
  game.holeEl.style.top = `${worldY}px`;
  game.holeEl.style.width = `${size}px`;
  game.holeEl.style.height = `${size * .76}px`;
  game.holeEl.classList.toggle('fever', performance.now() < game.feverUntil);
  game.holeEl.classList.toggle('shrink', performance.now() < game.shrinkUntil);
}

function spawnCharacters() {
  const items = [];
  for (let i = 0; i < game.stage.count; i++) items.push('normal');
  for (let i = 0; i < game.stage.black; i++) items.push('black');
  for (let i = 0; i < game.stage.fever; i++) items.push('fever');
  shuffle(items);

  const placed = [];
  items.forEach((type, i) => {
    const pos = getFreePosition(placed, 54);
    placed.push(pos);
    const el = document.createElement('div');
    el.className = `character ${type}`;
    el.style.backgroundImage = type === 'normal'
      ? `url("${characterImage}")`
      : makeSpecialImage(type);
    els.field.appendChild(el);
    const angle = Math.random() * Math.PI * 2;
    game.characters.push({
      id: i, type, el, x: pos.x, y: pos.y, size: 54, alive: true,
      vx: Math.cos(angle) * game.stage.speed, vy: Math.sin(angle) * game.stage.speed
    });
  });
}

function makeSpecialImage(type) {
  const fill = type === 'fever' ? '#FFD84D' : '#4B3F72';
  const eye = type === 'fever' ? '#263646' : '#ff6b7b';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><filter id='s'><feDropShadow dx='0' dy='8' stdDeviation='5' flood-color='#6b7f90' flood-opacity='.25'/></filter><g filter='url(#s)'><path d='M23 37c9-20 54-26 73-8 22 21 10 64-23 72-28 7-61-8-66-33-3-13 5-24 16-31z' fill='white'/><path d='M27 39c8-17 47-22 63-7 19 18 8 54-19 61-24 6-52-7-56-28-3-11 4-20 12-26z' fill='${fill}'/><circle cx='49' cy='59' r='5' fill='${eye}'/><circle cx='73' cy='59' r='5' fill='${eye}'/><path d='M51 76c7 5 15 5 22 0' stroke='#263646' stroke-width='5' stroke-linecap='round' fill='none'/></g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function getFreePosition(placed, size) {
  let best = null;
  for (let tries = 0; tries < 120; tries++) {
    const x = 30 + Math.random() * (game.width - 60 - size);
    const y = 30 + Math.random() * (game.height - 60 - size);
    const startDist = Math.hypot(x - game.holeX, y - game.holeY);
    if (startDist < 160) continue;
    const ok = placed.every((p) => Math.hypot(p.x - x, p.y - y) > size * .78);
    if (ok) return { x, y };
    best = { x, y };
  }
  return best || { x: 50, y: 50 };
}

function bindPointer() {
  els.viewport.onpointerdown = (e) => { els.viewport.setPointerCapture(e.pointerId); moveHole(e); };
  els.viewport.onpointermove = (e) => { if (e.pressure || e.buttons || e.pointerType === 'touch') moveHole(e); };
}

function moveHole(e) {
  if (!game?.running) return;
  const rect = els.viewport.getBoundingClientRect();
  game.holeX = clamp(e.clientX - rect.left, 24, game.viewW - 24);
  game.holeY = clamp(e.clientY - rect.top, 24, game.viewH - 24);

  const margin = 90;
  if (game.holeX > game.viewW - margin) game.offsetX += 8;
  if (game.holeX < margin) game.offsetX -= 8;
  if (game.holeY > game.viewH - margin) game.offsetY += 8;
  if (game.holeY < margin) game.offsetY -= 8;
  game.offsetX = clamp(game.offsetX, 0, Math.max(0, game.width - game.viewW));
  game.offsetY = clamp(game.offsetY, 0, Math.max(0, game.height - game.viewH));
  updateCamera();
}

function updateCamera() {
  els.field.style.transform = `translate(${-game.offsetX}px, ${-game.offsetY}px)`;
}

function loop(now) {
  if (!game?.running) return;
  const dt = Math.min(32, now - game.lastFrame) / 16.67;
  game.lastFrame = now;
  game.timeLeft = Math.max(0, game.stage.time - (now - game.startedAt) / 1000);
  if (game.timeLeft <= 0) return endGame(false);

  moveCharacters(dt);
  checkCollect(now);
  updateHoleLevel();
  updateHole();
  updateHUD(now);
  requestAnimationFrame(loop);
}

function moveCharacters(dt) {
  const worldHoleX = game.offsetX + game.holeX;
  const worldHoleY = game.offsetY + game.holeY;
  game.characters.forEach((c) => {
    if (!c.alive) return;
    if (game.stage.mode === 'sleep') {
      // 寝ているので動かない
    } else if (game.stage.mode === 'walk') {
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      if (Math.random() < .01) {
        const a = Math.random() * Math.PI * 2;
        c.vx = Math.cos(a) * game.stage.speed;
        c.vy = Math.sin(a) * game.stage.speed;
      }
    } else if (game.stage.mode === 'escape') {
      const dx = c.x - worldHoleX;
      const dy = c.y - worldHoleY;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 230) {
        c.vx += (dx / d) * .085 * dt;
        c.vy += (dy / d) * .085 * dt;
      } else if (Math.random() < .012) {
        const a = Math.random() * Math.PI * 2;
        c.vx += Math.cos(a) * .16;
        c.vy += Math.sin(a) * .16;
      }
      const max = game.stage.speed * 1.8;
      const v = Math.hypot(c.vx, c.vy) || 1;
      if (v > max) { c.vx = (c.vx / v) * max; c.vy = (c.vy / v) * max; }
      c.x += c.vx * dt;
      c.y += c.vy * dt;
    }

    if (c.x < 12 || c.x > game.width - c.size - 12) c.vx *= -1;
    if (c.y < 12 || c.y > game.height - c.size - 12) c.vy *= -1;
    c.x = clamp(c.x, 12, game.width - c.size - 12);
    c.y = clamp(c.y, 12, game.height - c.size - 12);
    c.el.style.transform = `translate(${c.x}px, ${c.y}px)`;
  });
}

function checkCollect(now) {
  const worldHoleX = game.offsetX + game.holeX;
  const worldHoleY = game.offsetY + game.holeY;
  const radius = holeSize() * .62;
  game.characters.forEach((c) => {
    if (!c.alive) return;
    const cx = c.x + c.size / 2;
    const cy = c.y + c.size / 2;
    if (Math.hypot(cx - worldHoleX, cy - worldHoleY) < radius) {
      c.alive = false;
      c.el.classList.add('collected');
      setTimeout(() => c.el.remove(), 300);
      if (c.type === 'normal') {
        game.collected += 1;
        playSound('pop');
      } else if (c.type === 'fever') {
        game.feverUntil = now + 10000;
        flash('✨ フィーバー！10秒巨大化 ✨');
        playSound('fever');
      } else if (c.type === 'black') {
        game.shrinkUntil = now + 5000;
        flash('😈 ブラック！5秒小さくなる');
        playSound('bad');
      }
      if (game.collected >= game.totalTargets) endGame(true);
    }
  });
}

function updateHoleLevel() {
  const ratio = game.collected / game.totalTargets;
  const next = ratio >= .5 ? 3 : ratio >= .25 ? 2 : 1;
  if (next > game.holeLevel) playSound('level');
  game.holeLevel = next;
}

function updateHUD(now) {
  els.timeLeft.textContent = Math.ceil(game.timeLeft);
  els.collectedText.textContent = `${game.collected}/${game.totalTargets}`;
  els.holeLevelText.textContent = performance.now() < game.feverUntil ? 'MAX' : game.holeLevel;
}

function flash(text) {
  els.statusBanner.textContent = text;
  clearTimeout(game.flashTimer);
  game.flashTimer = setTimeout(() => { els.statusBanner.textContent = ''; }, 1600);
}

function endGame(clear) {
  if (!game?.running) return;
  game.running = false;
  const used = game.stage.time - game.timeLeft;
  const rank = getRank(clear, game.timeLeft, game.stage.time);
  els.resultTitle.textContent = clear ? 'ステージクリア！' : '時間切れ！';
  els.rankBadge.textContent = rank.code;
  els.rankName.textContent = `${rank.code} ${rank.name}`;
  els.rankComment.textContent = rank.comment;
  els.resultTime.textContent = clear ? `クリアタイム ${used.toFixed(1)}秒` : `あと ${game.totalTargets - game.collected}体だったよ`;
  if (clear) {
    const prev = parseFloat(localStorage.getItem(`holePanicBestRaw_${game.stage.id}`) || '9999');
    if (used < prev) {
      localStorage.setItem(`holePanicBestRaw_${game.stage.id}`, String(used));
      localStorage.setItem(`holePanicBest_${game.stage.id}`, `${used.toFixed(1)}秒 ${rank.code}`);
    }
    playSound('clear');
  } else {
    playSound('bad');
  }
  showScreen('resultScreen');
}

function getRank(clear, left, total) {
  if (!clear) return { code: 'C', name: 'しっぱい', comment: 'ざんねん！もういちどチャレンジ！' };
  const ratio = left / total;
  if (ratio >= .66) return { code: 'SS', name: 'プロ', comment: 'きみはホールのプロ！みんなびっくり！' };
  if (ratio >= .40) return { code: 'S', name: 'たつじん', comment: 'すごい！ホールのたつじんだ！' };
  if (ratio >= .15) return { code: 'A', name: 'ふつう', comment: 'クリア！つぎはSをめざそう！' };
  return { code: 'B', name: 'ギリギリ', comment: 'なんとかクリア！あぶなかった〜！' };
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

els.unlockButton.addEventListener('click', unlockPremium);
els.licenseInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') unlockPremium(); });
els.startButton.addEventListener('click', startGame);
els.backFromIntroButton.addEventListener('click', () => showScreen('homeScreen'));
els.retryButton.addEventListener('click', () => openIntro(selectedStage));
els.homeButton.addEventListener('click', () => { renderStages(); showScreen('homeScreen'); });
els.soundButton.addEventListener('click', () => { audioOn = !audioOn; els.soundButton.textContent = audioOn ? '🔊' : '🔇'; });
els.imageUpload.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    characterImage = reader.result;
    try { localStorage.setItem('holePanicImage', characterImage); } catch { alert('画像が大きすぎるかもしれません。小さめの画像で試してください。'); }
  };
  reader.readAsDataURL(file);
});
els.resetImageButton.addEventListener('click', () => {
  characterImage = DEFAULT_IMAGE;
  localStorage.removeItem('holePanicImage');
  els.imageUpload.value = '';
});

updatePremiumUI();
showScreen('homeScreen');
