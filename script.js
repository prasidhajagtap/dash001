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
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const pauseBtn = document.getElementById("pause-btn");
const pauseOverlay = document.getElementById("pause-overlay");
const resumeBtn = document.getElementById("resume-btn");
const levelModal = document.getElementById("level-modal");
const triviaText = document.getElementById("trivia-text");
const continueBtn = document.getElementById("continue-btn");
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
let diffSteps = [100, 200, 150, 150];
let diffIndex = 0;
let speed = 2;
let player = { x: W / 2, y: H * 0.6, w: 80, h: 80, vx: 0 };
let enemies = [];
let powerups = [];
let targetX = player.x;
let shieldActive = false;
let focusMode = false;
let achievedBadges = new Set();

const triviaList = [
  "Poornata supports the complete employee lifecycle.",
  "Seamex enables seamless HR operations across the Group.",
  "Digital onboarding reduces joining friction by 40%.",
  "Secure data handling is core to Poornata.",
  "Employee self-service drives productivity."
];

/* AUDIO */
const sounds = {
  theme: new Audio("https://cdn.jsdelivr.net/gh/joshua19881228/free-music-files@master/super-mario-bros-theme.mp3"),
  coin: new Audio("https://cdn.jsdelivr.net/gh/joshua19881228/free-music-files@master/coin.mp3"),
  die: new Audio("https://cdn.jsdelivr.net/gh/joshua19881228/free-music-files@master/mario-death.mp3")
};
sounds.theme.loop = true;
sounds.theme.volume = 0.25;
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

/* LOGIN FLOW */
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
  hud.classList.remove("hidden");
  running = true;
  paused = false;
  score = 0;
  level = 1;
  speed = 2;
  enemies = [];
  powerups = [];
  achievedBadges.clear();
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
canvas.addEventListener("touchmove", e => {
  if (!running || paused) return;
  targetX = e.touches[0].clientX - player.w / 2;
});

canvas.addEventListener("mousemove", e => {
  if (!running || paused) return;
  if (e.buttons === 1) targetX = e.clientX - player.w / 2;
});

pauseBtn.addEventListener("click", () => {
  paused = true;
  pauseOverlay.classList.remove("hidden");
});

resumeBtn.addEventListener("click", () => {
  paused = false;
  pauseOverlay.classList.add("hidden");
});

/* GAME */
function spawnEnemy() {
  enemies.push({ x: Math.random() * (W - 40), y: -40, r: 22 });
}

function spawnPowerup() {
  powerups.push({ x: Math.random() * (W - 30), y: -30, r: 15 });
}

function drawBackground() {
  ctx.fillStyle = "#050b1f";
  ctx.fillRect(0, 0, W, H);
}

function autoCenter() {
  const c = W / 2 - player.w / 2;
  player.vx += (c - player.x) * 0.0005;
  player.vx *= 0.9;
  player.x += player.vx;
}

function update() {
  if (!running || paused) return;

  score += 0.15;
  scoreEl.textContent = Math.floor(score);

  if (score > bestScore) {
    bestScore = Math.floor(score);
    localStorage.setItem("bestScore", bestScore);
  }

  if (score > nextDifficultyAt) {
    level++;
    levelEl.textContent = level;
    triviaText.textContent = triviaList[level % triviaList.length];
    levelModal.classList.remove("hidden");
    paused = true;
    diffIndex = Math.min(diffIndex + 1, diffSteps.length - 1);
    nextDifficultyAt += diffSteps[diffIndex];
    speed += 0.4;
  }

  if (Math.random() < 0.018) spawnEnemy();
  if (Math.random() < 0.004) spawnPowerup();

  enemies.forEach(e => e.y += speed);
  powerups.forEach(p => p.y += speed);

  if (Math.abs(targetX - player.x) < 2) autoCenter();
  else player.x += (targetX - player.x) * 0.2;
}

continueBtn.addEventListener("click", () => {
  paused = false;
  levelModal.classList.add("hidden");
});

/* COLLISION */
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
    if (collide(player.x + 40, player.y + 40, 80, 80, e.x, e.y, e.r)) {
      endGame();
    }
  });

  powerups.forEach(p => {
    ctx.fillStyle = "cyan";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
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
  const msg = `I just scored ${bestScore} on Seamless Dash. A fun way Seamex blends play with productivity. Think you can beat me?`;
  if (navigator.share) navigator.share({ text: msg, url: "https://seamex.app.link/download" });
  else alert(msg);
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
