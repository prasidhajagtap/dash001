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

let player = {
  x: W / 2,
  y: H * 0.6,
  w: 80,
  h: 80
};

let enemies = [];
let powerups = [];
let score = 0;
let bestScore = Number(localStorage.getItem("bestScore")) || 0;
let level = 1;
let nextDifficultyAt = 100;
let difficultyIncrement = [100, 200, 150, 150];
let diffIndex = 0;
let speed = 2;
let running = true;
let shieldActive = false;

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
sounds.theme.volume = 0.3;

function vibrate(ms = 50) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

canvas.addEventListener("touchmove", e => {
  const t = e.touches[0];
  player.x = t.clientX - player.w / 2;
});

canvas.addEventListener("mousemove", e => {
  if (e.buttons === 1) player.x = e.clientX - player.w / 2;
});

function spawnEnemy() {
  enemies.push({
    x: Math.random() * (W - 40),
    y: -40,
    r: 20 + Math.random() * 10
  });
}

function spawnPowerup() {
  powerups.push({
    x: Math.random() * (W - 30),
    y: -30,
    r: 15,
    type: Math.random() > 0.5 ? "shield" : "warp"
  });
}

function drawBackground() {
  ctx.fillStyle = "#050b1f";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  for (let i = 0; i < 30; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * W, Math.random() * H);
    ctx.lineTo(Math.random() * W, Math.random() * H + 100);
    ctx.stroke();
  }
}

function update() {
  if (!running) return;

  score += 0.15;
  if (score > bestScore) {
    bestScore = Math.floor(score);
    localStorage.setItem("bestScore", bestScore);
    vibrate(100);
  }

  if (score > nextDifficultyAt) {
    level++;
    speed += 0.5;
    diffIndex = Math.min(diffIndex + 1, difficultyIncrement.length - 1);
    nextDifficultyAt += difficultyIncrement[diffIndex];
  }

  if (Math.random() < 0.02) spawnEnemy();
  if (Math.random() < 0.005) spawnPowerup();

  enemies.forEach(e => e.y += speed);
  powerups.forEach(p => p.y += speed);

  enemies = enemies.filter(e => e.y < H + 50);
  powerups = powerups.filter(p => p.y < H + 50);
}

function collide(a, b) {
  return Math.abs(a.x - b.x) < a.w / 2 + b.r &&
         Math.abs(a.y - b.y) < a.h / 2 + b.r;
}

function draw() {
  drawBackground();

  ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

  enemies.forEach(e => {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fill();

    if (collide({x: player.x + 40, y: player.y + 40, w: 80, h: 80}, e)) {
      if (!shieldActive) {
        sounds.die.play();
        running = false;
        alert(`Game Over.\n\nTrivia: ${triviaList[level % triviaList.length]}`);
      }
    }
  });

  powerups.forEach(p => {
    ctx.fillStyle = p.type === "shield" ? "cyan" : "gold";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();

    if (collide({x: player.x + 40, y: player.y + 40, w: 80, h: 80}, p)) {
      sounds.coin.play();
      vibrate(80);
      shieldActive = true;
      setTimeout(() => shieldActive = false, 8000);
      powerups = powerups.filter(x => x !== p);
    }
  });

  ctx.fillStyle = "#fff";
  ctx.fillText(`Score: ${Math.floor(score)}`, 20, 30);
  ctx.fillText(`Best: ${bestScore}`, 20, 50);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

sounds.theme.play();
loop();

window.shareScore = function () {
  const msg = `I just scored ${bestScore} on Seamless Dash. A fun way Seamex blends play with productivity. Think you can beat me?`;
  navigator.share({ text: msg, url: "https://seamex.app.link/download" });
};
