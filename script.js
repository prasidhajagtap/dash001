const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let W, H;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

const playerImg = new Image();
playerImg.src = "character.png";

let player = { x: W / 2, y: H * 0.6, w: 80, h: 80, vx: 0 };

let enemies = [];
let powerups = [];

let score = 0;
let bestScore = Number(localStorage.getItem("bestScore")) || 0;
let level = 1;
let nextDifficultyAt = 100;
let diffSteps = [100, 200, 150, 150];
let diffIndex = 0;
let speed = 2;

let running = false;
let focusMode = false;
let shieldActive = false;
let achievedBadges = new Set();

let targetX = player.x;

const triviaList = [
  "Poornata supports the complete employee lifecycle.",
  "Seamex enables seamless HR operations across the Group.",
  "Digital onboarding reduces joining friction by 40%.",
  "Secure data handling is core to Poornata.",
  "Employee self-service drives productivity."
];

const sounds = {
  theme: new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_6b9a66a35c.mp3"),
  coin: new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_4c2d87c90b.mp3"),
  die: new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_3a5a902fcb.mp3")
};

sounds.theme.loop = true;
sounds.theme.volume = 0.25;

function vibrate(ms = 50) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

/* LOGIN WATCHER */
function checkLogin() {
  const modal = document.getElementById("login-modal");
  const nameInput = document.getElementById("empName");
  const idInput = document.getElementById("poornataId");

  if (!modal) return false;
  if (modal.style.display !== "none") return false;
  if (!nameInput || !idInput) return false;
  if (nameInput.value.trim().length < 3) return false;
  if (idInput.value.trim().length < 4) return false;

  return true;
}

/* INPUT */
canvas.addEventListener("touchmove", e => {
  if (!running) return;
  targetX = e.touches[0].clientX - player.w / 2;
});

canvas.addEventListener("mousemove", e => {
  if (!running) return;
  if (e.buttons === 1) targetX = e.clientX - player.w / 2;
});

canvas.addEventListener("click", e => {
  if (!running) return;
  if (e.clientX > W - 80 && e.clientY < 80) focusMode = !focusMode;
});

function spawnEnemy() {
  enemies.push({ x: Math.random() * (W - 40), y: -40, r: 22 });
}

function spawnPowerup() {
  powerups.push({ x: Math.random() * (W - 30), y: -30, r: 15 });
}

function drawBackground() {
  ctx.fillStyle = "#050b1f";
  ctx.fillRect(0, 0, W, H);
  if (!focusMode) {
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * W, Math.random() * H);
      ctx.lineTo(Math.random() * W, Math.random() * H + 80);
      ctx.stroke();
    }
  }
}

function autoCenter() {
  const center = W / 2 - player.w / 2;
  player.vx += (center - player.x) * 0.0005;
  player.vx *= 0.9;
  player.x += player.vx;
}

function update() {
  if (!running) return;

  score += 0.15;

  if (score > bestScore) {
    bestScore = Math.floor(score);
    localStorage.setItem("bestScore", bestScore);
    vibrate(80);
  }

  [500, 1000, 2000].forEach(v => {
    if (score > v && !achievedBadges.has(v)) {
      achievedBadges.add(v);
      vibrate(120);
    }
  });

  if (score > nextDifficultyAt) {
    level++;
    speed += 0.4;
    diffIndex = Math.min(diffIndex + 1, diffSteps.length - 1);
    nextDifficultyAt += diffSteps[diffIndex];
  }

  if (Math.random() < 0.018) spawnEnemy();
  if (Math.random() < 0.004) spawnPowerup();

  enemies.forEach(e => e.y += speed);
  powerups.forEach(p => p.y += speed);

  if (Math.abs(targetX - player.x) < 2) autoCenter();
  else player.x += (targetX - player.x) * 0.2;
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
    if (collide(player.x + 40, player.y + 40, 80, 80, e.x, e.y, e.r)) {
      sounds.die.play();
      running = false;
    }
  });

  powerups.forEach(p => {
    ctx.fillStyle = "cyan";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    if (collide(player.x + 40, player.y + 40, 80, 80, p.x, p.y, p.r)) {
      sounds.coin.play();
      vibrate(60);
    }
  });

  ctx.fillStyle = "#fff";
  ctx.fillText(`Score: ${Math.floor(score)}`, 20, 30);
  ctx.fillText(`Best: ${bestScore}`, 20, 50);

  if (!checkLogin()) ctx.fillText("Please login to start", W / 2 - 80, H / 2);
}

function loop() {
  if (!running && checkLogin()) {
    running = true;
    sounds.theme.play().catch(()=>{});
  }

  update();
  draw();
  requestAnimationFrame(loop);
}

loop();

window.shareScore = function () {
  const msg = `I just scored ${bestScore} on Seamless Dash. A fun way Seamex blends play with productivity. Think you can beat me?`;
  navigator.share({ text: msg, url: "https://seamex.app.link/download" });
};
