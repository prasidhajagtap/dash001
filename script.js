const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const triviaList = [
    "Seamex provides a single point of contact for the entire employee lifecycle.",
    "Poornata is the core HRMS platform for the entire Aditya Birla Group.",
    "Seamex enables digital onboarding for a paperless experience.",
    "The Seamex platform integrates payroll and benefits administration.",
    "Poornata stores employee data securely with advanced encryption."
];

let player, enemies = [], powerups = [], particles = [], gameState = 'START';
let score = 0, level = 1, playerName = "", poornataId = "", bgOffset = 0;
let shieldActive = false, shieldTime = 0, isPaused = false;
let timeWarpActive = false;
let fingerTarget = {x:0,y:0};

/* Sounds */
const sounds = {
    power: new Audio('https://assets.mixkit.co/active_storage/sfx/1103/1103-preview.mp3'),
    hit: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
    lvl: new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'),
    over: new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'),
    slow: new Audio('https://assets.mixkit.co/active_storage/sfx/614/614-preview.mp3')
};
const bgMusic = new Audio("https://cdn.jsdelivr.net/gh/joshua19881228/free-music-files@master/super-mario-bros-theme.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.4;
let isMuted = false;

function unlockAudio() {
bgMusic.currentTime = 0;
if (!isMuted) bgMusic.play().catch(()=>{});
    Object.values(sounds).forEach(s => { s.muted=false; s.play().then(()=>{s.pause();s.currentTime=0}).catch(()=>{}); });
}

class Player {
    constructor() { 
        this.w = 85; this.h = 85;
        this.x = canvas.width/2 - 42; 
        this.y = canvas.height * 0.60;
    }
    update(){
        this.x += (fingerTarget.x - this.x) * 0.25;
        this.y += (fingerTarget.y - this.y) * 0.25;
    }
    draw() {
        if(shieldActive) {
            if (shieldTime > 2 || Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.strokeStyle='#0984e3'; ctx.lineWidth=6; ctx.beginPath();
                ctx.arc(this.x+42,this.y+42,55,0,Math.PI*2); ctx.stroke();
            }
        }
        const img = document.getElementById('player-img');
        if(img.complete && img.naturalWidth !== 0) ctx.drawImage(img, this.x, this.y, this.w, this.h);
        else { ctx.fillStyle='#A01018'; ctx.fillRect(this.x, this.y, this.w, this.h); }
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (player) {
        player.y = canvas.height * 0.60;
        player.x = Math.max(0, Math.min(canvas.width - 85, player.x));
    }
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);
resizeCanvas();

function animate() {
    if(gameState !== 'PLAYING' || isPaused) return;

    ctx.fillStyle = level >= 20 ? "#212121" : (level >= 10 ? "#fff3e0" : "#f8f9fa");
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.strokeStyle = level >= 20 ? "#333" : "#e9ecef";
    bgOffset = (bgOffset + (timeWarpActive ? 1 : 2) + level) % 40;
    for(let y=bgOffset; y<canvas.height; y+=40) {
        ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke();
    }

    const spdMult = timeWarpActive ? 0.4 : 1;
    score += 0.15 * spdMult;
    document.getElementById('score').innerText = Math.floor(score);

    if(Math.floor(score) >= level * 100) levelUp();

    if(shieldActive){
        shieldTime -= 0.016;
        document.getElementById('shield-timer').innerText = Math.ceil(shieldTime);
        if(shieldTime<=0){
            shieldActive=false;
            document.getElementById('shield-indicator').classList.add('hidden');
        }
    }

    player.update();
    player.draw();

    if(Math.random() < (0.03 + level*0.005) * spdMult)
        enemies.push({x:Math.random()*(canvas.width-30), y:-50, spd:(4+level*0.6)*spdMult, rot:Math.random()*6});

    if(score > 100 && Math.random() < 0.004){
        const type = (level>=5 && Math.random()>0.7) ? 'SLOW' : 'SHIELD';
        powerups.push({x:Math.random()*(canvas.width-40), y:-50, type});
    }

    enemies.forEach((e,i)=>{
        e.y += e.spd; e.rot += 0.05;
      ctx.save();
ctx.translate(e.x + 15, e.y + 15);
ctx.rotate(e.rot);
ctx.fillStyle = "#c62828";
ctx.beginPath();
for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const r = i % 2 === 0 ? 18 : 9;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
}
ctx.closePath();
ctx.fill();
ctx.restore();


        if(e.x < player.x+75 && e.x+30 > player.x+10 && e.y < player.y+75 && e.y+30 > player.y+10){
            if(shieldActive){
                if(!isMuted) sounds.hit.play();
                enemies.splice(i,1);
            } else gameOver();
        }
        if(e.y > canvas.height) enemies.splice(i,1);
    });

    powerups.forEach((p,i)=>{
        p.y += 4*spdMult;
        const cx=p.x+20, cy=p.y+20;
        ctx.fillStyle=p.type==='SHIELD'?'#0984e3':'#FFC107';
        ctx.beginPath(); ctx.arc(cx,cy,20,0,Math.PI*2); ctx.fill();
        ctx.font='24px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillStyle='#fff'; ctx.fillText(p.type==='SHIELD'?'🛡️':'⏳',cx,cy);

        if(player.x < p.x+40 && player.x+85 > p.x && player.y < p.y+40 && player.y+85 > p.y){
            if(p.type==='SLOW'){ timeWarpActive=true; if(!isMuted) sounds.slow.play(); setTimeout(()=>timeWarpActive=false,5000); }
            else { shieldActive=true; shieldTime=8; if(!isMuted) sounds.power.play(); document.getElementById('shield-indicator').classList.remove('hidden'); }
            if(navigator.vibrate) navigator.vibrate(50);
            powerups.splice(i,1);
        }
    });

    requestAnimationFrame(animate);
}

function levelUp(){
    level++;
    if(!isMuted) sounds.lvl.play();
    document.getElementById('level').innerText = level;

    const trivia = triviaList[(level-1)%triviaList.length];
    const el=document.createElement('div');
    el.className='floating-trivia';
    el.innerText=trivia;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),3000);
}

function start(n,id){
    unlockAudio();
    playerName=n; poornataId=id;
    localStorage.setItem('seamex_session', JSON.stringify({n,id,exp:Date.now()+7776000000}));
    gameState='PLAYING'; isPaused=false; timeWarpActive=false;
    score=0; level=1; enemies=[]; powerups=[]; particles=[];
    document.getElementById('level').innerText="1";
    document.getElementById('score').innerText="0";
    document.querySelectorAll('.screen-box, .overlay-modal').forEach(e=>e.classList.add('hidden'));
    document.getElementById('game-hud').classList.remove('hidden');
    document.getElementById('hud-name').innerText=n;
    player=new Player();
    fingerTarget.x=player.x; fingerTarget.y=player.y;
    requestAnimationFrame(animate);
}

function gameOver(){
    gameState='OVER'; isPaused=false;
    bgMusic.pause(); if(!isMuted) sounds.over.play();
    document.getElementById('game-hud').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText=Math.floor(score);
    let s=JSON.parse(localStorage.getItem(`s_${poornataId}`)||'[]');
    s.push(Math.floor(score)); s.sort((a,b)=>b-a);
    localStorage.setItem(`s_${poornataId}`,JSON.stringify(s.slice(0,5)));
    document.getElementById('best-score').innerText=s[0]||0;
}

/* Input tracking */
window.addEventListener('touchmove',e=>{
    if(player && gameState==='PLAYING'){
        fingerTarget.x=Math.max(0,Math.min(canvas.width-85,e.touches[0].clientX-42));
        fingerTarget.y=Math.max(0,Math.min(canvas.height-85,e.touches[0].clientY-42-50));
    }
},{passive:false});
window.addEventListener('mousemove',e=>{
    if(player && gameState==='PLAYING'){
        fingerTarget.x=Math.max(0,Math.min(canvas.width-85,e.clientX-42));
        fingerTarget.y=Math.max(0,Math.min(canvas.height-85,e.clientY-42-50));
    }
});

/* UI */
const nameInp=document.getElementById('player-name');
const idInp=document.getElementById('player-id');
const startBtn=document.getElementById('start-btn');

function validate(){
    const isNameValid=/^[a-zA-Z\s]+$/.test(nameInp.value)&&nameInp.value.length>=3;
    const isIdValid=/^\d+$/.test(idInp.value)&&idInp.value.length>=4;
    document.getElementById('name-val').style.display=(nameInp.value&&!isNameValid)?'block':'none';
    document.getElementById('id-val').style.display=(idInp.value&&!isIdValid)?'block':'none';
    startBtn.disabled=!(isNameValid&&isIdValid);
}
[nameInp,idInp].forEach(el=>el.addEventListener('input',validate));

document.getElementById('start-btn').addEventListener('click',()=>start(nameInp.value.trim(),idInp.value.trim()));
document.getElementById('restart-btn').addEventListener('click',()=>start(playerName,poornataId));
document.getElementById('menu-btn').addEventListener('click',()=>{
    gameState = 'START';
    isPaused = false;
    running = false;

    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('game-hud').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');

    // allow UI to receive clicks again
    document.getElementById('ui-layer').style.pointerEvents = 'auto';
});
document.getElementById('pause-btn').addEventListener('click',()=>{isPaused=true; bgMusic.pause(); document.getElementById('pause-trivia').innerText=triviaList[Math.floor(Math.random()*triviaList.length)]; document.getElementById('pause-overlay').classList.remove('hidden');});
document.getElementById('resume-btn').addEventListener('click',()=>{isPaused=false; if(!isMuted) bgMusic.play(); document.getElementById('pause-overlay').classList.add('hidden'); requestAnimationFrame(animate);});
document.getElementById('continue-btn').addEventListener('click',()=>{document.getElementById('level-modal').classList.add('hidden'); isPaused=false; if(!isMuted) bgMusic.play(); requestAnimationFrame(animate);});
document.getElementById('music-toggle').addEventListener('click',function(){isMuted=!isMuted; this.innerText=isMuted?"🔇 Sound Off":"🔊 Sound On"; isMuted?bgMusic.pause():(gameState==='PLAYING'&&bgMusic.play());});

document.getElementById('share-btn').addEventListener('click',()=>{
    const msg=`🚀 I just dashed ${Math.floor(score)} points as ${playerName}. Can you beat me? \nDownload Seamex: https://seamex.app.link/download`;
    if(navigator.share) navigator.share({text:msg});
    else { navigator.clipboard.writeText(msg); alert("Challenge copied!"); }
});

const sess=JSON.parse(localStorage.getItem('seamex_session'));
if(sess&&sess.exp>Date.now()){
    playerName=sess.n; poornataId=sess.id;
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('returning-user-section').classList.remove('hidden');
    document.getElementById('display-name').innerText=playerName;
}
