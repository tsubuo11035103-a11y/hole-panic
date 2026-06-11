(() => {
  'use strict';

  const PAID_NOTE_URL = 'https://note.com/cute_tsubuo'; // TODO: note有料記事URLに変更
  const TSUBUO_NOTE_URL = 'https://note.com/cute_tsubuo';
  const STORAGE_UNLOCK = 'holePanicPremiumUnlocked';
  const STORAGE_SOUND = 'holePanicSoundEnabled';
  const STORAGE_BEST = 'holePanicBestTimes';

  const $ = (id) => document.getElementById(id);
  const canvas = $('gameCanvas');
  const ctx = canvas.getContext('2d');

  const screens = {
    title: $('titleScreen'),
    stage: $('stageScreen'),
    license: $('licenseScreen'),
    intro: $('introScreen'),
    result: $('resultScreen'),
  };

  const ui = {
    hud: $('hud'), scoreText: $('scoreText'), timeText: $('timeText'), countdown: $('countdown'),
    startBtn: $('startBtn'), licenseBtn: $('licenseBtn'), soundBtn: $('soundBtn'), titleBtn: $('titleBtn'),
    imageBtn: $('imageBtn'), imageInput: $('imageInput'), imageStatus: $('imageStatus'),
    noteLink: $('noteLink'), resultNoteLink: $('resultNoteLink'),
    stageList: $('stageList'), backTitleBtn: $('backTitleBtn'),
    licenseInput: $('licenseInput'), unlockBtn: $('unlockBtn'), closeLicenseBtn: $('closeLicenseBtn'), licenseMessage: $('licenseMessage'),
    introStage: $('introStage'), introTitle: $('introTitle'), introText: $('introText'),
    resultTitle: $('resultTitle'), resultScore: $('resultScore'), rankBox: $('rankBox'), rankComment: $('rankComment'),
    retryBtn: $('retryBtn'), stageSelectBtn: $('stageSelectBtn'),
  };

  const STAGES = [
    { id:1, premium:false, name:'おひるね', mode:'sleep', count:20, black:1, fever:1, time:60, intro:'ねているキャラをぜんぶ回収しよう！', sprite:'sleep', feverSprite:'feverSleep', blackSprite:'blackSleep' },
    { id:2, premium:false, name:'おさんぽ', mode:'walk', count:25, black:1, fever:1, time:70, intro:'てくてく歩くキャラをつかまえよう！', sprite:'walk', feverSprite:'feverWalk', blackSprite:'blackMove' },
    { id:3, premium:false, name:'逃走中', mode:'run', count:30, black:2, fever:1, time:80, intro:'にげるキャラを追いかけろ！', sprite:'run', feverSprite:'feverRun', blackSprite:'blackMove' },
    { id:4, premium:true, name:'おひるね王国', mode:'sleep', count:50, black:2, fever:1, time:90, intro:'王国じゅうのキャラをぜんぶ回収！', sprite:'sleep', feverSprite:'feverSleep', blackSprite:'blackSleep' },
    { id:5, premium:true, name:'あわてんぼうさんぽ', mode:'walkFast', count:60, black:2, fever:1, time:100, intro:'あわてて歩くキャラをつかまえよう！', sprite:'walk', feverSprite:'feverWalk', blackSprite:'blackMove' },
    { id:6, premium:true, name:'超逃走中', mode:'runFast', count:80, black:3, fever:1, time:120, intro:'全力でにげるキャラを追いかけろ！', sprite:'run', feverSprite:'feverRun', blackSprite:'blackMove' },
  ];

  const SPRITE_PATHS = {
    sleep:'assets/ohirunetsubuo.png', walk:'assets/osanpotsubuo.png', run:'assets/tousoutsubuo.png',
    feverSleep:'assets/feverohirunetsubuo.png', feverWalk:'assets/feverosanpotsubuo.png', feverRun:'assets/fevertousoutsubuo.png',
    blackSleep:'assets/ohiruneblack.png', blackMove:'assets/idoublack.png',
    fall:'assets/rakkatsubuo.png', feverFall:'assets/feverrakkatsubuo.png', blackFall:'assets/rakkablack.png',
    icon:'assets/icon.png'
  };

  const sounds = {
  title:new Audio('assets/sounds/title.mp3'),
  game:new Audio('assets/sounds/game.mp3'),
  danger:new Audio('assets/sounds/danger.mp3'),

  countdown:new Audio('assets/sounds/countdown.mp3'),
  hole:new Audio('assets/sounds/hole.mp3'),
  fever:new Audio('assets/sounds/fever.mp3'),
  black:new Audio('assets/sounds/black.mp3'),
  clear:new Audio('assets/sounds/clear.mp3'),
  fail:new Audio('assets/sounds/fail.mp3'),
  button:new Audio('assets/sounds/button.mp3'),
  levelup:new Audio('assets/sounds/levelup.mp3')
};
  sounds.title.loop = true;
sounds.game.loop = true;
sounds.danger.loop = true;

sounds.title.volume = 0.45;
sounds.game.volume = 0.42;
sounds.danger.volume = 0.5;

  const state = {
    view:'title', premium: localStorage.getItem(STORAGE_UNLOCK) === '1', sound: localStorage.getItem(STORAGE_SOUND) !== '0',
    best: readBest(), currentStage:null, customImage:null, customImageName:'',
    running:false, intro:false, result:null, lastTime:0,
    vw:0, vh:0, dpr:1, mapW:0, mapH:0, camera:{x:0,y:0}, hole:{x:0,y:0,r:42, level:1},
    entities:[], collected:0, totalTargets:0, score:0, timeLeft:0, startAt:0, elapsed:0,
    feverUntil:0, blackUntil:0, dragging:false, pointerId:null,
    particles:[], previewT:0,countingDown:false,
countdownToken:0,
  };

  const imgs = {};
  Object.entries(SPRITE_PATHS).forEach(([k, src]) => { imgs[k] = loadImage(src); });

  function loadImage(src){ const img = new Image(); img.src = src; return img; }
  function loadAudio(src){ const a = new Audio(); a.src = src; a.preload='auto'; return a; }
  function play(name){
  if(!state.sound) return;

  const src = sounds[name];
  if(!src) return;

  const audio = src.cloneNode();

  if(name === 'hole'){
    audio.playbackRate = 0.9 + Math.random() * 0.2;
  }

  audio.volume = src.volume ?? 1;
  audio.play().catch(()=>{});
}

  function stopBgm(){
  ['title', 'game', 'danger'].forEach(name => {
    sounds[name].pause();
    sounds[name].currentTime = 0;
  });
}

function playBgm(name){
  if(!state.sound) return;

  ['title', 'game', 'danger'].forEach(n => {
  if(n !== name){
    sounds[n].pause();
    sounds[n].currentTime = 0;
  }
});

  const bgm = sounds[name];
  bgm.loop = true;
  bgm.play().catch(()=>{});
}
  function readBest(){ try{return JSON.parse(localStorage.getItem(STORAGE_BEST)||'{}')}catch{return {}} }
  function saveBest(){ localStorage.setItem(STORAGE_BEST, JSON.stringify(state.best)); }

  function resize(){
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);

  const vv = window.visualViewport;
  state.vw = Math.round(vv ? vv.width : document.documentElement.clientWidth);
  state.vh = Math.round(vv ? vv.height : document.documentElement.clientHeight);

  document.documentElement.style.setProperty('--vvw', state.vw + 'px');
  document.documentElement.style.setProperty('--vvh', state.vh + 'px');
  document.documentElement.style.setProperty('--vvx', (vv ? vv.offsetLeft : 0) + 'px');
  document.documentElement.style.setProperty('--vvy', (vv ? vv.offsetTop : 0) + 'px');

  canvas.width = Math.floor(state.vw * state.dpr);
  canvas.height = Math.floor(state.vh * state.dpr);
  canvas.style.width = state.vw + 'px';
  canvas.style.height = state.vh + 'px';

  ctx.setTransform(state.dpr,0,0,state.dpr,0,0);
}
  window.visualViewport?.addEventListener('resize', resize, {passive:true});
window.visualViewport?.addEventListener('scroll', resize, {passive:true});

  function show(name){
    Object.values(screens).forEach(s=>s.classList.add('hidden'));
    ui.hud.classList.add('hidden'); ui.countdown.classList.add('hidden');
    if(name) screens[name].classList.remove('hidden');
    state.view = name || 'game';
  }

  function updatePremiumUI(){
    document.querySelectorAll('.premium-only').forEach(el=>el.classList.toggle('hidden', !state.premium));
    ui.noteLink.href = state.premium ? TSUBUO_NOTE_URL : PAID_NOTE_URL;
    ui.noteLink.textContent = state.premium ? 'つぶおのnote' : 'note有料記事へ';
    ui.resultNoteLink.href = ui.noteLink.href;
    ui.resultNoteLink.textContent = ui.noteLink.textContent;
    ui.soundBtn.textContent = `効果音：${state.sound ? 'ON' : 'OFF'}`;
  }

  function renderStageList(){
    ui.stageList.innerHTML = '';
    STAGES.forEach(st=>{
      const locked = st.premium && !state.premium;
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'stage-card' + (locked ? ' locked' : '');
      const best = state.best[st.id];
      const bestText = best ? `・ BEST ${best.time.toFixed(1)}秒 ${best.rank}` : '';
      btn.innerHTML = `<div><div class="stage-num">STAGE ${st.id} / ${st.premium?'有料':'無料'}</div><div class="stage-name">${locked?'🔒 ':''}${st.name}</div><div class="stage-meta">${st.count}体 ・ ${st.time}秒 ${bestText}</div></div><div class="play-badge">${locked?'LOCK':'あそぶ'}</div>`;
      if(!locked) btn.addEventListener('click', ()=>selectStage(st));
      ui.stageList.appendChild(btn);
    });
  }

  function goTitle(){
  state.countingDown = false;
  state.countdownToken++;
  state.running = false;
  state.currentStage = null;
  updatePremiumUI();
  show('title');
  playBgm('title');
}
  function goStage(){
  play('button');
  state.countingDown = false;
  state.countdownToken++;
  state.running = false;
  renderStageList();
  show('stage');
}

  ui.startBtn.addEventListener('click', () => { requestFs(); goStage(); });
  ui.backTitleBtn.addEventListener('click', goTitle);
  ui.titleBtn.addEventListener('click', goTitle);
  ui.licenseBtn.addEventListener('click', () => { ui.licenseMessage.textContent=''; ui.licenseInput.value=''; show('license'); });
  ui.closeLicenseBtn.addEventListener('click', goTitle);
  ui.soundBtn.addEventListener('click', () => { state.sound=!state.sound; localStorage.setItem(STORAGE_SOUND, state.sound?'1':'0'); updatePremiumUI(); });
  ui.imageBtn.addEventListener('click', () => ui.imageInput.click());
  ui.imageInput.addEventListener('change', handleImageUpload);
  ui.retryBtn.addEventListener('click', () => { if(state.currentStage) selectStage(state.currentStage); });
  ui.stageSelectBtn.addEventListener('click', goStage);
  ui.unlockBtn.addEventListener('click', unlockPremium);

  function requestFs(){
    const el = document.documentElement;
    if(!document.fullscreenElement && el.requestFullscreen){ el.requestFullscreen().catch(()=>{}); }
  }

  async function unlockPremium(){
    const key = ui.licenseInput.value.trim();
    if(!key){ ui.licenseMessage.textContent = '合言葉を入力してね'; return; }
    ui.licenseMessage.textContent = '確認中...';
    try{
      const res = await fetch('/api/check-license', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({key}) });
      const data = await res.json();
      if(data.ok){
        state.premium = true; localStorage.setItem(STORAGE_UNLOCK,'1'); updatePremiumUI(); ui.licenseMessage.textContent='有料版を解放しました！'; setTimeout(goTitle, 650);
      }else ui.licenseMessage.textContent='合言葉が違います';
    }catch(e){ ui.licenseMessage.textContent='認証APIに接続できません'; }
  }

  function handleImageUpload(e){
    const file = e.target.files && e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = () => { const img = new Image(); img.onload = () => { state.customImage = img; state.customImageName = file.name; ui.imageStatus.textContent = file.name; }; img.src = reader.result; };
    reader.readAsDataURL(file);
  }

  function selectStage(st){
  if(state.countingDown || state.running) return;

  state.countingDown = true;
  state.countdownToken++;

  const token = state.countdownToken;

  state.currentStage = st;
  ui.introStage.textContent = `STAGE ${st.id}`;
  ui.introTitle.textContent = st.name;
  ui.introText.textContent = st.intro;

  show('intro');

  setTimeout(() => {
    if(token === state.countdownToken) startCountdown(st, token);
  }, 1050);
}

  async function startCountdown(st, token){
  screens.intro.classList.add('hidden');
  ui.countdown.classList.remove('hidden');

  play('countdown'); // 最初に1回だけ鳴らす

  for(const v of ['3','2','1','GO!']){
    if(token !== state.countdownToken) return;

    ui.countdown.textContent = v;
    await wait(v === 'GO!' ? 650 : 950);
  }

  if(token !== state.countdownToken) return;

  ui.countdown.classList.add('hidden');
  state.countingDown = false;
  startGame(st);
}
  function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }

  function startGame(st){
    stopBgm();
playBgm('game');
    state.dangerMode = false;
    requestFs(); show(null); ui.hud.classList.remove('hidden');
    const scale = st.premium ? 6 : 3.5;
    state.mapW = Math.max(state.vw * (st.premium?2.2:1.65), state.vw + 200);
    state.mapH = Math.max(state.vh * scale, state.vh + 400);
    state.hole = { x: state.mapW/2, y: state.mapH - state.vh*0.55, r: 38, level:1 };
    state.camera = clampCamera(state.hole.x - state.vw/2, state.hole.y - state.vh/2);
    state.entities = []; state.particles = []; state.collected=0; state.score=0; state.totalTargets=st.count; state.timeLeft=st.time; state.elapsed=0;
    state.feverUntil=0; state.blackUntil=0; state.running=true; state.startAt=performance.now(); state.lastTime=performance.now();
    spawnEntities(st); updateHud();
  }

  function spawnEntities(st){
    const margin = 90;
    const safeR = Math.min(state.vw, state.vh) * .35;
    const all = [];
    const add = (type, spriteKey) => {
      for(let tries=0; tries<2000; tries++){
        const x = margin + Math.random()*(state.mapW-margin*2);
        const y = margin + Math.random()*(state.mapH-margin*2);
        if(dist(x,y,state.hole.x,state.hole.y) < safeR) continue;
        if(all.some(e=>dist(x,y,e.x,e.y)<58)) continue;
        const e = makeEntity(type, spriteKey, x, y, st); all.push(e); state.entities.push(e); return;
      }
    };
    for(let i=0;i<st.count;i++) add('normal', st.sprite);
    for(let i=0;i<st.fever;i++) add('fever', st.feverSprite);
    for(let i=0;i<st.black;i++) add('black', st.blackSprite);
  }

  function makeEntity(type, spriteKey, x, y, st){
    const speedBase = st.mode==='walk' ? 24 : st.mode==='walkFast' ? 44 : st.mode==='run' ? 36 : st.mode==='runFast' ? 58 : 0;
    const a = Math.random()*Math.PI*2;
    return { type, spriteKey, x, y, vx:Math.cos(a)*speedBase, vy:Math.sin(a)*speedBase, r:28, alive:true, falling:0, scale:1, rot:0, panic:0 };
  }

  canvas.addEventListener('pointerdown', pointerDown, {passive:false});
  canvas.addEventListener('pointermove', pointerMove, {passive:false});
  canvas.addEventListener('pointerup', pointerUp, {passive:false});
  canvas.addEventListener('pointercancel', pointerUp, {passive:false});
  function pointerDown(e){ if(!state.running) return; e.preventDefault(); state.dragging=true; state.pointerId=e.pointerId; moveHoleToScreen(e.clientX,e.clientY); canvas.setPointerCapture?.(e.pointerId); }
  function pointerMove(e){ if(!state.running || !state.dragging || e.pointerId!==state.pointerId) return; e.preventDefault(); moveHoleToScreen(e.clientX,e.clientY); }
  function pointerUp(e){ if(e.pointerId===state.pointerId){ state.dragging=false; state.pointerId=null; } }
  function moveHoleToScreen(sx, sy){
    const targetX = clamp(sx + state.camera.x, 32, state.mapW - 32);
const targetY = clamp(sy + state.camera.y, 32, state.mapH - 32);

state.hole.x += (targetX - state.hole.x) * 0.18;
state.hole.y += (targetY - state.hole.y) * 0.18;    const desired = clampCamera(state.hole.x - state.vw/2, state.hole.y - state.vh/2);
    state.camera.x += (desired.x - state.camera.x) * 0.08;
state.camera.y += (desired.y - state.camera.y) * 0.08;
  }

  function loop(now){
    const dt = Math.min((now - state.lastTime)/1000 || 0, .04); state.lastTime = now;
    if(state.running) updateGame(dt, now); else updatePreview(dt, now);
    draw(now);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function updateGame(dt, now){
    state.elapsed = (now - state.startAt)/1000; state.timeLeft = Math.max(0, state.currentStage.time - state.elapsed);
    if(state.timeLeft <= 0){ finish(false); return; }
    updateHoleSize(now); updateEntities(dt, now); updateParticles(dt); updateHud();
    if(state.timeLeft <= 10 && !state.dangerMode){
  state.dangerMode = true;
  playBgm('danger');
}
  }

  function updateHoleSize(now){
    const baseLevel = state.collected >= state.totalTargets*.5 ? 3 : state.collected >= state.totalTargets*.25 ? 2 : 1;
    let lvl = baseLevel;
    if(now < state.feverUntil) lvl = 4;
    if(now < state.blackUntil) lvl = 0;
    if(lvl !== state.hole.level && lvl > state.hole.level) play('levelup');
    state.hole.level = lvl;
    const sizes = [28, 40, 56, 72, 92];
    const target = sizes[lvl]; state.hole.r += (target - state.hole.r) * .18;
  }

  function updateEntities(dt, now){
    const st = state.currentStage;
    for(const e of state.entities){
      if(!e.alive){
  // 落下演出をゆっくり見せる
  e.falling += dt * 1.8;

  // 穴の中心に吸い込まれる
  e.x += (state.hole.x - e.x) * 0.08;
  e.y += (state.hole.y - e.y) * 0.08;

  // 少しずつ小さくして消える
  e.scale = Math.max(0, 1 - e.falling);

  // くるっと回る
  e.rot += dt * 4;

  continue;
}
      if(st.mode.includes('run')){
        const d = dist(e.x,e.y,state.hole.x,state.hole.y);
        if(d < 260){
          const ax = (e.x-state.hole.x)/(d||1), ay=(e.y-state.hole.y)/(d||1);
          const sp = st.mode==='runFast' ? 120 : 86;
          e.vx += ax*sp*dt*3; e.vy += ay*sp*dt*3;
        } else wander(e, dt, st.mode==='runFast'?48:34);
        limitSpeed(e, st.mode==='runFast'?110:82);
      }else if(st.mode.includes('walk')){
        wander(e, dt, st.mode==='walkFast'?38:22);
        limitSpeed(e, st.mode==='walkFast'?58:36);
      }
      e.x += e.vx*dt; e.y += e.vy*dt;
      bounce(e);
      const collectDistance = state.hole.r + e.r * .55;
      if(dist(e.x,e.y,state.hole.x,state.hole.y) < collectDistance) collectEntity(e, now);
    }
    state.entities = state.entities.filter(e => e.alive || e.falling < 1.15);
  }

  function wander(e, dt, amount){ e.vx += (Math.random()-.5)*amount*dt*8; e.vy += (Math.random()-.5)*amount*dt*8; }
  function limitSpeed(e, max){ const s=Math.hypot(e.vx,e.vy); if(s>max){ e.vx=e.vx/s*max; e.vy=e.vy/s*max; } }
  function bounce(e){
    const m=55; if(e.x<m){e.x=m;e.vx=Math.abs(e.vx)} if(e.x>state.mapW-m){e.x=state.mapW-m;e.vx=-Math.abs(e.vx)}
    if(e.y<m){e.y=m;e.vy=Math.abs(e.vy)} if(e.y>state.mapH-m){e.y=state.mapH-m;e.vy=-Math.abs(e.vy)}
  }

  function collectEntity(e, now){
    e.alive=false; e.falling=.01; e.spriteKey = e.type==='black' ? 'blackFall' : e.type==='fever' ? 'feverFall' : 'fall';
    spawnPop(e.x,e.y,e.type); play(
  e.type === 'fever'
    ? 'fever'
    : e.type === 'black'
    ? 'black'
    : 'hole'
);
    if(e.type==='fever'){ state.feverUntil = now + 10000; state.score += 5; }
    else if(e.type==='black'){ state.blackUntil = now + 5000; state.score = Math.max(0, state.score-2); }
    else { state.collected++; state.score++; }
    if(state.collected >= state.totalTargets) finish(true);
  }

  function spawnPop(x,y,type){
    const txt = type==='fever' ? 'FEVER!' : type==='black' ? 'DOWN!' : '+1';
    const color = type==='fever' ? '#ffd84d' : type==='black' ? '#4b3f72' : '#ffffff';
    state.particles.push({x,y,vy:-50,t:0,txt,color});
  }
  function updateParticles(dt){ state.particles.forEach(p=>{p.t+=dt;p.y+=p.vy*dt}); state.particles=state.particles.filter(p=>p.t<1); }

  function finish(clear){
    if(!state.running) return; state.running=false; play(clear?'clear':'fail');
    const elapsed = state.elapsed; const rank = clear ? getRank(state.currentStage.time, state.timeLeft) : {code:'C', label:'しっぱい', comment:'ざんねん！もういちどチャレンジ！'};
    if(clear){ const prev = state.best[state.currentStage.id]; if(!prev || elapsed < prev.time){ state.best[state.currentStage.id] = {time:elapsed, rank:rank.code}; saveBest(); } }
    ui.resultTitle.textContent = clear ? 'クリア！' : 'しっぱい！';
    ui.resultScore.textContent = clear
  ? `${elapsed.toFixed(1)}秒`
  : `${state.collected}/${state.totalTargets}`;
    ui.rankBox.textContent = `${rank.code} ${rank.label}`;
    ui.rankComment.textContent = rank.comment;
    updatePremiumUI(); show('result');
    stopBgm();
  }

  function getRank(total, remain){
    const r = remain / total;
    if(r >= .66) return {code:'SS', label:'プロ', comment:'きみはホールのプロ！つぶおたちもびっくり！'};
    if(r >= .40) return {code:'S', label:'たつじん', comment:'すごい！ホールのたつじんだ！'};
    if(r >= .15) return {code:'A', label:'ふつう', comment:'クリア！つぎはSをめざそう！'};
    return {code:'B', label:'ギリギリ', comment:'なんとかクリア！あぶなかった〜！'};
  }

  function updateHud(){ ui.scoreText.textContent = `${state.collected}/${state.totalTargets}`; ui.timeText.textContent = Math.ceil(state.timeLeft); }

  function updatePreview(dt, now){
    state.previewT += dt;
    state.mapW = state.vw; state.mapH = state.vh; state.camera = {x:0,y:0};
    state.hole.x = state.vw * (.55 + Math.sin(state.previewT*.7)*.08);
    state.hole.y = state.vh * (.55 + Math.cos(state.previewT*.6)*.07);
    state.hole.r = 55 + Math.sin(state.previewT*1.8)*4; state.hole.level=2;
  }

  function draw(now){
    ctx.clearRect(0,0,state.vw,state.vh);
    drawMat();
    if(state.running) drawGameWorld(now); else drawPreviewWorld(now);
  }

  function drawMat(){
    const g = ctx.createLinearGradient(0,0,0,state.vh); g.addColorStop(0,'#dff6ff'); g.addColorStop(1,'#fff7fb'); ctx.fillStyle=g; ctx.fillRect(0,0,state.vw,state.vh);
    ctx.save(); ctx.globalAlpha=.28; ctx.strokeStyle='#ffffff'; ctx.lineWidth=22;
    const step=96; const off = state.running ? -state.camera.y*.08%step : (state.previewT*8)%step;
    for(let y=-step+off;y<state.vh+step;y+=step){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(state.vw,y+state.vw*.35); ctx.stroke(); }
    ctx.globalAlpha=.16; ctx.strokeStyle='#9eddf5'; ctx.lineWidth=2;
    for(let y=-step+off;y<state.vh+step;y+=step/2){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(state.vw,y+state.vw*.35); ctx.stroke(); }
    ctx.restore();
  }

  function drawGameWorld(now){
  ctx.save();
  ctx.translate(-state.camera.x, -state.camera.y);

  drawMapBounds();

  // 先に穴を描く
  drawHole(now);

  // その上にキャラを描く
  // 落下中の画像も見えるようになる
  drawEntities(now);

  drawParticles();

  ctx.restore();
}

  function drawPreviewWorld(now){
    const chars = [
      {x:.18,y:.30,k:'sleep',s:50},{x:.78,y:.25,k:'walk',s:52},{x:.28,y:.70,k:'run',s:54},{x:.70,y:.74,k:'feverSleep',s:56},{x:.48,y:.35,k:'blackMove',s:52}
    ];
    chars.forEach((c,i)=>drawSprite(imgs[c.k], state.vw*c.x, state.vh*c.y + Math.sin(state.previewT*2+i)*6, c.s, 1, Math.sin(state.previewT+i)*.05));
    drawHole(now);
  }

  function drawMapBounds(){
  ctx.save();

  // フィールド外を少し暗くする
  ctx.fillStyle = 'rgba(80, 140, 170, 0.08)';
  ctx.fillRect(0, 0, state.mapW, state.mapH);

  // 端っこを太めのふかふか枠にする
  ctx.strokeStyle = 'rgba(55, 150, 190, 0.45)';
  ctx.lineWidth = 18;
  ctx.strokeRect(9, 9, state.mapW - 18, state.mapH - 18);

  // 内側に白いライン
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 5;
  ctx.strokeRect(24, 24, state.mapW - 48, state.mapH - 48);

  ctx.restore();
}

  function drawEntities(now){
  for(const e of state.entities){
    const img = getEntityImage(e);

    if(e.alive && e.type === 'fever'){
      drawSparkles(e.x, e.y, now);
    }

    drawSprite(img, e.x, e.y, 62, e.scale, e.rot);
  }
}

  function drawSparkles(x, y, now){
  ctx.save();

  for(let i = 0; i < 8; i++){
    const a = (Math.PI * 2 / 8) * i + now * 0.003;
    const d = 34 + Math.sin(now * 0.006 + i) * 6;
    const sx = x + Math.cos(a) * d;
    const sy = y + Math.sin(a) * d;
    const r = 3 + Math.sin(now * 0.01 + i) * 1.5;

    ctx.fillStyle = i % 2 === 0
      ? 'rgba(255, 216, 77, 0.95)'
      : 'rgba(255, 255, 255, 0.95)';

    ctx.beginPath();
    ctx.moveTo(sx, sy - r * 2);
    ctx.lineTo(sx + r, sy);
    ctx.lineTo(sx, sy + r * 2);
    ctx.lineTo(sx - r, sy);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

  function getEntityImage(e){
    if(state.premium && state.customImage && e.type==='normal') return state.customImage;
    return imgs[e.spriteKey] || imgs.sleep;
  }

  function drawSprite(img,x,y,size,scale=1,rot=0){
    ctx.save(); ctx.translate(x,y); ctx.rotate(rot); ctx.scale(scale,scale);
    ctx.shadowColor='rgba(60,90,120,.22)'; ctx.shadowBlur=10; ctx.shadowOffsetY=7;
    if(img && img.complete && img.naturalWidth){ ctx.drawImage(img,-size/2,-size/2,size,size); }
    else { ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(0,0,size/2,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#203040'; ctx.beginPath(); ctx.arc(-8,-4,3,0,Math.PI*2); ctx.arc(8,-4,3,0,Math.PI*2); ctx.fill(); }
    ctx.restore();
  }

  function drawHole(now){
    const x = state.running ? state.hole.x : state.hole.x;
    const y = state.running ? state.hole.y : state.hole.y;
    const r = state.hole.r;
    const fever = state.running && now < state.feverUntil;
    const black = state.running && now < state.blackUntil;
    ctx.save();
    if(fever){
      for(let i=0;i<14;i++){ const a=i/14*Math.PI*2 + now*.003; ctx.fillStyle=`hsla(${(i*32+now*.04)%360},90%,65%,.8)`; ctx.beginPath(); ctx.arc(x+Math.cos(a)*(r+18), y+Math.sin(a)*(r+18), 3+Math.sin(now*.01+i)*2, 0, Math.PI*2); ctx.fill(); }
    }
    const outer = ctx.createRadialGradient(x-r*.25,y-r*.35,r*.25,x,y,r*1.25);
    outer.addColorStop(0, fever?'#fff8a0':'#ffffff'); outer.addColorStop(.55, fever?'#79ecff':'#b5eea9'); outer.addColorStop(1, black?'#4b3f72':'#63df5d');
    ctx.fillStyle=outer; ctx.beginPath(); ctx.arc(x,y,r+13,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(x+5,y+10,r*1.02,r*.82,0,0,Math.PI*2); ctx.fill();
    const inner = ctx.createRadialGradient(x-r*.18,y-r*.22,2,x,y,r);
    inner.addColorStop(0,'#202830'); inner.addColorStop(.75,'#050607'); inner.addColorStop(1,'#000');
    ctx.fillStyle=inner; ctx.beginPath(); ctx.ellipse(x,y,r*.95,r*.78,0,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function drawParticles(){
    ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 28px system-ui,-apple-system,sans-serif';
    state.particles.forEach(p=>{ ctx.globalAlpha=1-p.t; ctx.fillStyle=p.color; ctx.strokeStyle='#203040'; ctx.lineWidth=5; ctx.strokeText(p.txt,p.x,p.y); ctx.fillText(p.txt,p.x,p.y); });
    ctx.restore();
  }

  function clampCamera(x,y){ return { x:clamp(x,0,Math.max(0,state.mapW-state.vw)), y:clamp(y,0,Math.max(0,state.mapH-state.vh)) }; }
  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
  function dist(x1,y1,x2,y2){ return Math.hypot(x1-x2,y1-y2); }

  updatePremiumUI(); show('title'); playBgm('title');
})();
