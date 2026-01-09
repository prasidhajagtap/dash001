const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let W, H;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

const playerImg = document.getElementById("player-img");

/* DOM */
const startScreen = document.getElementById("start-screen");
const loginSection = document.getElementById("login-section");
const returningSection = document.getElementById("returning-user-section");
const startBtn = document.getElementById("start-btn");
const quickStartBtn = document.getElementById("quick-start-btn");
const changeUserBtn = document.getElementById("change-user-link");
const nameInput = document.getElementById("player-name");
const idInput = document.getElementById("player-id");
const nameErr = document.getElementById("name-val");
const idErr = document.getElementById("id-val");
const hud = document.getElementById("game-hud");
const hudName = document.getElementById("hud-name");
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const pauseBtn = document.getElementById("pause-btn");
const pauseOverlay = document.getElementById("pause-overlay");
const resumeBtn = document.getElementById("resume-btn");
const gameOver = document.getElementById("game-over-screen");
const finalScoreEl = document.getElementById("final-score");
const bestScoreEl = document.getElementById("best-score");
const restartBtn = document.getElementById("restart-btn");
const menuBtn = document.getElementById("menu-btn");
const shareBtn = document.getElementById("share-btn");
const musicToggle = document.getElementById("music-toggle");

/* STATE */
let running = false;
let paused = false;
let score = 0;
let bestScore = Number(localStorage.getItem("bestScore")) || 0;
let level = 1;
let nextDifficultyAt = 100;
let speed = 2.5;
let player = { x: W / 2, y: H * 0.6, w: 80, h: 80 };
let enemies = [];
let powerups = [];
let target = { x: player.x, y: player.y };
let shieldActive = false;

/* AUDIO */
const sounds = {
  theme: new Audio("https://cdn.jsdelivr.net/gh/joshua19881228/free-music-files@master/super-mario-bros-theme.mp3"),
  coin: new Audio("https://cdn.jsdelivr.net/gh/joshua19881228/free-music-files@master/coin.mp3"),
  die: new Audio("https://cdn.jsdelivr.net/gh/joshua19881228/free-music-files@master/mario-death.mp3"),
  level: new Audio("https://cdn.jsdelivr.net/gh/joshua19881228/free-music-files@master/power-up.mp3")
};
Object.values(sounds).forEach(s => s.volume = 0.5);
sounds.theme.loop = true;
let soundOn = true;

/* VALIDATION */
function validateInputs() {
  const nameOk = /^[A-Za-z ]{3,}$/.test(nameInput.value.trim());
  const idOk = /^[0-9]{4,}$/.test(idInput.value.trim());
  nameErr.style.visibility = nameOk ? "hidden" : "visible";
  idErr.style.visibility = idOk ? "hidden" : "visible";
  startBtn.disabled = !(nameOk && idOk);
}

nameInput.addEventListener("input", validateInputs);
idInput.addEventListener("input", validateInputs);

/* LOGIN */
function startGame() {
  localStorage.setItem("seamex_user", JSON.stringify({
    name: nameInput.value.trim(),
    id: idInput.value.trim(),
    time: Date.now()
  }));
  initGame();
}

function initGame() {
  startScreen.classList.add("hidden");
  gameOver.classList.add("hidden");
  hud.classList.remove("hidden");
  paused = false;
  running = true;
  score = 0;
  level = 1;
  speed = 2.5;
  enemies = [];
  powerups = [];
  hudName.textContent = nameInput.value.trim();
  if (soundOn) sounds.theme.play().catch(()=>{});
}

startBtn.addEventListener("click", startGame);

quickStartBtn.addEventListener("click", () => {
  const u = JSON.parse(localStorage.getItem("seamex_user"));
  if (u) {
    nameInput.value = u.name;
    idInput.value = u.id;
    initGame();
  }
});

changeUserBtn.addEventListener("click", () => {
  returningSection.classList.add("hidden");
  loginSection.classList.remove("hidden");
});

const savedUser = JSON.parse(localStorage.getItem("seamex_user"));
if (savedUser) {
  document.getElementById("display-name").textContent = savedUser.name;
  returningSection.classList.remove("hidden");
  loginSection.classList.add("hidden");
}

/* CONTROLS */
canvas.addEventListener("touchstart", e => {
  if (!running) return;
  const t = e.touches[0];
  target.x = t.clientX - player.w / 2;
  target.y = t.clientY - player.h / 2;
});

canvas.addEventListener("touchmove", e => {
  if (!running) return;
  const t = e.touches[0];
  target.x = t.clientX - player.w / 2;
  target.y = t.clientY - player.h / 2;
});

canvas.addEventListener("mousemove", e => {
  if (!running || !e.buttons) return;
  target.x = e.clientX - player.w / 2;
  target.y = e.clientY - player.h / 2;
});

pauseBtn.addEventListener("click", () => paused = true);
resumeBtn.addEventListener("click", () => paused = false);

/* GAME */
function spawnEnemy() {
  enemies.push({ x: Math.random() * (W - 40), y: -40, r: 22 });
}

function spawnPowerup() {
  powerups.push({ x: Math.random() * (W - 30), y: -30, r: 15 });
}

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#6ec6ff");
  grad.addColorStop(1, "#b3e5fc");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

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
    speed += 0.4;
    if (soundOn) sounds.level.play();
    if (navigator.vibrate) navigator.vibrate(80);
  }

  if (Math.random() < 0.02) spawnEnemy();
  if (score > 100 && Math.random() < 0.01) spawnPowerup();

  enemies.forEach(e => e.y += speed);
  powerups.forEach(p => p.y += speed);

  player.x += (target.x - player.x) * 0.2;
  player.y += (target.y - player.y) * 0.2;
}

function collide(ax, ay, aw, ah, bx, by, br) {
  return Math.abs(ax - bx) < aw / 2 + br &&
         Math.abs(ay - by) < ah / 2 + br;
}

function draw() {
  drawBackground();
  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

  enemies.forEach(e => {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fill();
    if (collide(player.x + 40, player.y + 40, 80, 80, e.x, e.y, e.r)) endGame();
  });

  powerups.forEach(p => {
    ctx.fillStyle = "gold";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    if (collide(player.x + 40, player.y + 40, 80, 80, p.x, p.y, p.r)) {
      if (soundOn) sounds.coin.play();
      if (navigator.vibrate) navigator.vibrate(50);
    }
  });
}

function endGame() {
  running = false;
  gameOver.classList.remove("hidden");
  finalScoreEl.textContent = Math.floor(score);
  bestScoreEl.textContent = bestScore;
  if (soundOn) sounds.die.play();
}

/* GAME OVER */
restartBtn.addEventListener("click", initGame);
menuBtn.addEventListener("click", () => location.reload());

shareBtn.addEventListener("click", () => {
  const msg = `I just scored ${bestScore} on Seamless Dash. A quick break. A smart dash. Think you can beat me?`;
  if (navigator.share) navigator.share({ text: msg, url: "https://seamex.app.link/download" });
  else alert(msg + "\n" + "https://seamex.app.link/download");
});

/* MUSIC */
musicToggle.addEventListener("click", () => {
  soundOn = !soundOn;
  musicToggle.textContent = soundOn ? "🔊 Sound On" : "🔇 Sound Off";
  if (soundOn) sounds.theme.play().catch(()=>{});
  else sounds.theme.pause();
});

/* LOOP */
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
