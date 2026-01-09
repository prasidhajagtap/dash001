const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let W, H;
function resize(){ W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
addEventListener("resize", resize);
resize();

const playerImg = document.getElementById("player-img");

/* UI */
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
const levelModal = document.getElementById("level-modal");
const triviaText = document.getElementById("trivia-text");
const continueBtn = document.getElementById("continue-btn");

/* Game state */
let running=false, paused=false;
let score=0, bestScore=Number(localStorage.getItem("bestScore"))||0;
let level=1, speed=2.5;
let player={x:W/2,y:H*0.6,w:80,h:80};
let target={x:player.x,y:player.y};
let enemies=[], powerups=[];
let nextDifficultyAt = 150;

/* Trivia */
const triviaList = [
 "Poornata supports the full employee lifecycle.",
 "Seamex powers seamless HR operations.",
 "Digital HR reduces errors and saves time.",
 "Secure data handling is core to Poornata."
];

/* Audio */
let unlocked=false, soundOn=true;
const sounds = {
 theme:new Audio("https://cdn.jsdelivr.net/gh/joshua19881228/free-music-files@master/super-mario-bros-theme.mp3"),
 coin:new Audio("https://cdn.jsdelivr.net/gh/joshua19881228/free-music-files@master/coin.mp3"),
 die:new Audio("https://cdn.jsdelivr.net/gh/joshua19881228/free-music-files@master/mario-death.mp3"),
 level:new Audio("https://cdn.jsdelivr.net/gh/joshua19881228/free-music-files@master/power-up.mp3")
};
Object.values(sounds).forEach(a=>a.volume=0.5);

/* Validation */
function validate(){
 const n=/^[A-Za-z ]{3,}$/.test(nameInput.value.trim());
 const i=/^[0-9]{4,}$/.test(idInput.value.trim());
 nameErr.style.visibility = n?"hidden":"visible";
 idErr.style.visibility = i?"hidden":"visible";
 startBtn.disabled = !(n&&i);
}
nameInput.oninput = idInput.oninput = validate;

/* Start */
startBtn.onclick = ()=>{
 unlockAudio();
 localStorage.setItem("seamex_user", JSON.stringify({name:nameInput.value,id:idInput.value,time:Date.now()}));
 initGame();
};
quickStartBtn.onclick = ()=>{
 const u=JSON.parse(localStorage.getItem("seamex_user"));
 if(u){ nameInput.value=u.name; idInput.value=u.id; initGame(); }
};
changeUserBtn.onclick = ()=>{
 returningSection.classList.add("hidden");
 loginSection.classList.remove("hidden");
};

/* Controls */
canvas.ontouchstart = canvas.ontouchmove = e=>{
 if(!running||paused) return;
 unlockAudio();
 const t=e.touches[0];
 target.x = t.clientX - player.w/2;
 target.y = t.clientY - player.h/2 - 40;
};
canvas.onmousemove = e=>{
 if(!running||paused||!e.buttons) return;
 target.x = e.clientX - player.w/2;
 target.y = e.clientY - player.h/2 - 40;
};

pauseBtn.onclick = ()=>{
 paused=true;
 pauseOverlay.classList.remove("hidden");
};
resumeBtn.onclick = ()=>{
 paused=false;
 pauseOverlay.classList.add("hidden");
};

/* Level modal */
continueBtn.onclick = ()=>{
 levelModal.classList.add("hidden");
};

/* Restart */
restartBtn.onclick = ()=>{ gameOver.classList.add("hidden"); initGame(); };
menuBtn.onclick = ()=> location.reload();

/* Share */
shareBtn.onclick = ()=>{
 const msg = `I just scored ${bestScore} on Seamless Dash. A quick break. A smart dash. Can you beat me?`;
 if(navigator.share) navigator.share({text:msg,url:"https://seamex.app.link/download"});
 else alert(msg+"\nhttps://seamex.app.link/download");
};

/* Music */
musicToggle.onclick = ()=>{
 soundOn=!soundOn;
 musicToggle.textContent = soundOn?"🔊 Sound On":"🔇 Sound Off";
 if(soundOn) sounds.theme.play().catch(()=>{});
 else sounds.theme.pause();
};

/* Helpers */
function unlockAudio(){
 if(unlocked) return;
 unlocked=true;
 sounds.theme.loop=true;
 if(soundOn) sounds.theme.play().catch(()=>{});
}
function initGame(){
 startScreen.classList.add("hidden");
 gameOver.classList.add("hidden");
 hud.classList.remove("hidden");
 paused=false; running=true;
 score=0; level=1; speed=2.5; nextDifficultyAt=150;
 enemies=[]; powerups=[];
 hudName.textContent = nameInput.value;
 levelEl.textContent = level;
}
function spawnEnemy(){ enemies.push({x:Math.random()*(W-40),y:-40,r:20}); }
function spawnPowerup(){ powerups.push({x:Math.random()*(W-30),y:-30,r:16,type:Math.random()>0.5?"shield":"warp"}); }
function hit(ax,ay,aw,ah,bx,by,br){ return Math.abs(ax-bx)<aw/2+br-10 && Math.abs(ay-by)<ah/2+br-10; }

/* Update */
function update(){
 if(!running||paused) return;

 score+=0.2;
 scoreEl.textContent=Math.floor(score);

 if(score>bestScore){
  bestScore=Math.floor(score);
  localStorage.setItem("bestScore",bestScore);
 }

 if(score>nextDifficultyAt){
  level++;
  levelEl.textContent=level;
  triviaText.textContent = triviaList[level%triviaList.length];
  levelModal.classList.remove("hidden");
  if(soundOn) sounds.level.play();
  navigator.vibrate?.(60);
  nextDifficultyAt+=150;
  speed+=0.3;
 }

 if(Math.random()<0.02) spawnEnemy();
 if(score>100 && Math.random()<0.008) spawnPowerup();

 enemies.forEach(e=>e.y+=speed);
 powerups.forEach(p=>p.y+=speed);

 player.x += (target.x-player.x)*0.2;
 player.y += (target.y-player.y)*0.2;
}

/* Draw */
function draw(){
 ctx.clearRect(0,0,W,H);
 ctx.fillStyle="#7ecbff"; ctx.fillRect(0,0,W,H);
 ctx.drawImage(playerImg,player.x,player.y,player.w,player.h);

 enemies.forEach(e=>{
  ctx.fillStyle="#ff4d4d";
  ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.fill();
  if(hit(player.x+40,player.y+40,80,80,e.x,e.y,e.r)) endGame();
 });

 powerups.forEach(p=>{
  ctx.fillStyle = p.type==="shield"?"#4fc3f7":"#ba68c8";
  ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
  if(hit(player.x+40,player.y+40,80,80,p.x,p.y,p.r)){
   if(soundOn) sounds.coin.play();
   navigator.vibrate?.(50);
  }
 });
}

function endGame(){
 running=false;
 gameOver.classList.remove("hidden");
 finalScoreEl.textContent=Math.floor(score);
 bestScoreEl.textContent=bestScore;
 if(soundOn) sounds.die.play();
}

/* Loop */
(function loop(){ update(); draw(); requestAnimationFrame(loop); })();
