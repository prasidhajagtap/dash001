const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const playerImg = document.getElementById("player-img");

/* Canvas */
let W, H;
function resize() {
  W = canvas.width = innerWidth;
  H = canvas.height = innerHeight;
}
addEventListener("resize", resize);
resize();

/* UI */
const startScreen = document.getElementById("start-screen");
const returningSection = document.getElementById("returning-user-section");
const loginSection = document.getElementById("login-section");
const displayName = document.getElementById("display-name");
const nameInput = document.getElementById("player-name");
const idInput = document.getElementById("player-id");
const nameErr = document.getElementById("name-val");
const idErr = document.getElementById("id-val");
const startBtn = document.getElementById("start-btn");
const quickStartBtn = document.getElementById("quick-start-btn");
const changeUserBtn = document.getElementById("change-user-link");

const hud = document.getElementById("game-hud");
const hudName = document.getElementById("hud-name");
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const pauseBtn = document.getElementById("pause-btn");
const pauseOverlay = document.getElementById("pause-overlay");
const pauseTrivia = document.getElementById("pause-trivia");
const resumeBtn = document.getElementById("resume-btn");

const gameOver = document.getElementById("game-over-screen");
const finalScoreEl = document.getElementById("final-score");
const bestScoreEl = document.getElementById("best-score");
const restartBtn = document.getElementById("restart-btn");
const menuBtn = document.getElementById("menu-btn");
const shareBtn = document.getElementById("share-btn");
const musicToggle = document.getElementById("music-toggle");

/* Trivia */
const triviaList = [
  "Poornata manages the entire employee lifecycle.",
  "Seamex enables seamless HR operations.",
  "Digital HR improves productivity.",
  "Secure employee data is a core promise of Poornata."
];

/* Audio */
let unlocked = false;
let soundOn = true;
const bgMusic = new Audio("https://cdn.jsdelivr.net/gh/joshua19881228/free-music-files@master/super-mario-bros-theme.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.4;

const sounds = {
  coin: new Audio("https://assets.mixkit.co/active_storage/sfx/1103/1103-preview.mp3"),
  die: new Audio("https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3"),
  level: new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3")
};
Object.values(sounds).forEach(s => s.volume = 0.6);

function unlockAudio() {
  if (unlocked) return;
  unlocked = true;
  if (soundOn) bgMusic.play().catch(()=>{});
}

/* State */
let running = false;
let paused = false;
let score = 0;
let level = 1;
let speed = 2.5;
let bestScore = 0;

let player = { x: W/2, y: H*0.6, w: 80, h: 80 };
let target = { x: player.x, y: player.y };
let enemies = [];
let powerups = [];
let nextDifficultyAt = 150;

/* Validation */
function validate() {
  const n = /^[A-Za-z ]{3,}$/.test(nameInput.value.trim());
  const i = /^[0-9]{4,}$/.test(idInput.value.trim());
  nameErr.style.visibility = n ? "hidden" : "visible";
  idErr.style.visibility = i ? "hidden" : "visible";
  startBtn.disabled = !(n && i);
}
nameInput.oninput = idInput.oninput = validate;

/* Start */
startBtn.onclick = () => {
  unlockAudio();
  startGame(nameInput.value.trim(), idInput.value.trim());
};

quickStartBtn.onclick = () => {
  const u = JSON.parse(localStorage.getItem("seamex_user"));
  if (u) startGame(u.name, u.id);
};

changeUserBtn.onclick = () => {
  returningSection.classList.add("hidden");
  loginSection.classList.remove("hidden");
};

function startGame(name, id) {
  localStorage.setItem("seamex_user", JSON.stringify({name, id}));
  hudName.textContent = name;
  startScreen.classList.add("hidden");
  hud.classList.remove("hidden");
  gameOver.classList.add("hidden");

  score = 0;
  level = 1;
  speed = 2.5;
  nextDifficultyAt = 150;
  enemies = [];
  powerups = [];
  running = true;
  paused = false;
  scoreEl.textContent = "0";
  levelEl.textContent = "1";
  bestScore = Number(localStorage.getItem("bestScore")) || 0;
}

/* Controls */
canvas.ontouchstart = canvas.ontouchmove = e => {
  if (!running || paused) return;
  unlockAudio();
  const t = e.touches[0];
  target.x = t.clientX - player.w/2;
  target.y = t.clientY - player.h/2 - 50;
};

canvas.onmousemove = e => {
  if (!running || paused || !e.buttons) return;
  target.x = e.clientX - player.w/2;
  target.y = e.clientY - player.h/2 - 50;
};

/* Pause */
pauseBtn.onclick = () => {
  paused = true;
  pauseTrivia.textContent = triviaList[Math.floor(Math.random()*triviaList.length)];
  pauseOverlay.classList.remove("hidden");
};

resumeBtn.onclick = () => {
  paused = false;
  pauseOverlay.classList.add("hidden");
};

/* Restart and Menu */
restartBtn.onclick = () => {
  paused = false;
  gameOver.classList.add("hidden");
  startGame(hudName.textContent, "");
};

menuBtn.onclick = () => {
  running = false;
  paused = false;
  gameOver.classList.add("hidden");
  hud.classList.add("hidden");
  startScreen.classList.remove("hidden");
  document.getElementById("ui-layer").style.pointerEvents = "auto";
};

/* Share */
shareBtn.onclick = () => {
  const msg = `I just scored ${bestScore} on Seamless Dash. A quick break. A smart dash. Can you beat me?`;
  if (navigator.share) navigator.share({text: msg, url: "https://seamex.app.link/download"});
  else alert(msg + "\nhttps://seamex.app.link/download");
};

/* Music */
musicToggle.onclick = () => {
  soundOn = !soundOn;
  musicToggle.textContent = soundOn ? "🔊 Sound On" : "🔇 Sound Off";
  if (soundOn) bgMusic.play().catch(()=>{});
  else bgMusic.pause();
};

/* Helpers */
function spawnEnemy() {
  enemies.push({ x: Math.random()*(W-40), y: -40, r: 20, rot: Math.random()*Math.PI });
}

function spawnPowerup() {
  powerups.push({ x: Math.random()*(W-30), y: -30, r: 16 });
}

function hit(ax, ay, aw, ah, bx, by, br) {
  return Math.abs(ax-bx) < aw/2 + br - 10 && Math.abs(ay-by) < ah/2 + br - 10;
}

/* Loop */
function update() {
  if (!running || paused) return;

  score += 0.2;
  scoreEl.textContent = Math.floor(score);

  if (score > bestScore) {
    bestScore = Math.floor(score);
    localStorage.setItem("bestScore", bestScore);
  }

  if (score > nextDifficultyAt) {
    level++;
    levelEl.textContent = level;
    nextDifficultyAt += 150;
    speed += 0.3;
    if (soundOn) sounds.level.play();
    navigator.vibrate?.(50);
  }

  if (Math.random() < 0.02) spawnEnemy();
  if (score > 100 && Math.random() < 0.01) spawnPowerup();

  enemies.forEach(e => { e.y += speed; e.rot += 0.05; });
  powerups.forEach(p => p.y += speed);

  player.x += (target.x - player.x) * 0.2;
  player.y += (target.y - player.y) * 0.2;
}

function draw() {
  ctx.clearRect(0,0,W,H);

  ctx.fillStyle = "#7ecbff";
  ctx.fillRect(0,0,W,H);

  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

  enemies.forEach(e => {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.rot);
    ctx.fillStyle = "#c62828";
    ctx.beginPath();
    for (let i=0;i<14;i++){
      const a = i/14 * Math.PI * 2;
      const r = i%2===0 ? 18 : 9;
      ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    if (hit(player.x+40, player.y+40, 80, 80, e.x, e.y, e.r)) endGame();
  });

  powerups.forEach(p => {
    ctx.fillStyle = "#4fc3f7";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fill();
  });
}

function endGame() {
  running = false;
  paused = false;
  gameOver.classList.remove("hidden");
  finalScoreEl.textContent = Math.floor(score);
  bestScoreEl.textContent = bestScore;
  if (soundOn) sounds.die.play();
}

(function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
})();
