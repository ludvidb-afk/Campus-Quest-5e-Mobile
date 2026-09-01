
(() => {
'use strict';
const Q = window.CQ_QUESTIONS || [];
const STORE='cq5e_v1_mobile_state';
const SUBJECTS={
 'Mathématiques':{icon:'🧮',building:'Tour des nombres',mini:'multiplication',color:'#4e82c0'},
 'Français':{icon:'📚',building:'Grande bibliothèque',mini:'french',color:'#b96a6a'},
 'Histoire':{icon:'🏺',building:'Musée du Temps',mini:'timeline',color:'#b28a52'},
 'Géographie':{icon:'🌍',building:'Institut des Explorateurs',mini:'geo',color:'#4f9b73'},
 'SVT':{icon:'🧬',building:'Laboratoire du Vivant',mini:'foodchain',color:'#70a553'},
 'Physique-Chimie':{icon:'⚗️',building:'Laboratoire des Sciences',mini:'circuit',color:'#7d77b8'},
 'Technologie':{icon:'🤖',building:'Atelier des Inventeurs',mini:'robot',color:'#638594'},
 'EMC':{icon:'⚖️',building:'Maison des Citoyens',mini:'emc',color:'#c17852'},
 'Anglais':{icon:'🇬🇧',building:'London Club',mini:'language',color:'#5674aa'},
 'Espagnol':{icon:'🇪🇸',building:'Plaza Española',mini:'language',color:'#d49c48'},
 'Allemand':{icon:'🇩🇪',building:'Deutsches Zentrum',mini:'language',color:'#6a6a72'}
};
const DEFAULT={
 xp:0,coins:150,answered:0,correct:0,streak:0,bestStreak:0,
 errors:{},subject:{},miniPlayed:0,miniWon:0,best:{},
 avatar:{skin:'#d9a074',hair:'#49352d',shirt:'#f2c744',pants:'#324a69',hairStyle:'0',accessory:'none'},
 owned:['bed_basic','desk_basic'],equipped:['bed_basic','desk_basic'],
 sound:true,daily:{date:'',answered:0,mathCorrect:0,languageGames:0}
};
function clone(o){return JSON.parse(JSON.stringify(o))}
let S=clone(DEFAULT);
try{const x=JSON.parse(localStorage.getItem(STORE));if(x)S=Object.assign(S,x)}catch(e){}
S.avatar=Object.assign(clone(DEFAULT.avatar),S.avatar||{});
S.owned=Array.isArray(S.owned)?S.owned:clone(DEFAULT.owned);
S.equipped=Array.isArray(S.equipped)?S.equipped:clone(DEFAULT.equipped);
S.errors=S.errors||{};S.subject=S.subject||{};S.best=S.best||{};
function today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function resetDaily(){if(!S.daily||S.daily.date!==today())S.daily={date:today(),answered:0,mathCorrect:0,languageGames:0}}
resetDaily();
function save(){localStorage.setItem(STORE,JSON.stringify(S));refreshHUD()}
function level(){return Math.floor(S.xp/300)+1}
function rank(){const l=level();return l>=41?'Maître du Campus':l>=31?'Expert':l>=21?'Savant':l>=11?'Explorateur':l>=6?'Élève curieux':'Apprenti du Campus'}
function mastery(){return S.answered?Math.round(S.correct/S.answered*100):0}
function refreshHUD(){
 document.querySelectorAll('[data-coins]').forEach(e=>e.textContent=S.coins);
 document.querySelectorAll('[data-level]').forEach(e=>e.textContent=level());
 el('hudLevel').textContent=level();el('hudCoins').textContent=S.coins;el('rankText').textContent=rank();
}
function el(id){return document.getElementById(id)}
function toast(msg){const t=el('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),1900)}
function show(name){
 document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
 el(name+'View').classList.add('active');window.scrollTo(0,0);
 if(name==='room')drawRoom(); if(name==='avatar')loadAvatarForm(); if(name==='progress')renderProgress(); if(name==='subjects')renderSubjects();
}
document.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.back)));
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.open)));

/* Sound */
let audio=null;
function beep(ok=true){
 if(!S.sound)return;
 try{
  audio ||= new (window.AudioContext||window.webkitAudioContext)();
  const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);
  o.frequency.value=ok?660:220;g.gain.value=.06;o.start();o.stop(audio.currentTime+.08);
 }catch(e){}
}
el('soundBtn').addEventListener('click',()=>{S.sound=!S.sound;el('soundBtn').textContent=S.sound?'🔊':'🔇';save()});
el('soundBtn').textContent=S.sound?'🔊':'🔇';

/* Campus */
const canvas=el('campusCanvas'),ctx=canvas.getContext('2d');
const WORLD={w:1600,h:1050};
const buildings=[
 {id:'math',name:'Tour des nombres',subject:'Mathématiques',x:145,y:110,w:250,h:155},
 {id:'fr',name:'Grande bibliothèque',subject:'Français',x:485,y:80,w:250,h:155},
 {id:'history',name:'Musée du Temps',subject:'Histoire',x:855,y:85,w:250,h:155},
 {id:'geo',name:'Institut des Explorateurs',subject:'Géographie',x:1210,y:120,w:250,h:155},
 {id:'svt',name:'Laboratoire du Vivant',subject:'SVT',x:90,y:420,w:260,h:155},
 {id:'residence',name:'Résidence Campus',kind:'room',x:430,y:400,w:250,h:155,color:'#c07f77',icon:'🏠'},
 {id:'arcade',name:'Arcade des révisions',kind:'arcade',x:700,y:370,w:260,h:170,color:'#7656a8',icon:'🕹️'},
 {id:'store',name:'Boutique Campus',kind:'store',x:995,y:405,w:250,h:155,color:'#c38d4f',icon:'🛍️'},
 {id:'physics',name:'Laboratoire des Sciences',subject:'Physique-Chimie',x:1270,y:430,w:260,h:155},
 {id:'tech',name:'Atelier des Inventeurs',subject:'Technologie',x:100,y:745,w:250,h:155},
 {id:'emc',name:'Maison des Citoyens',subject:'EMC',x:410,y:780,w:250,h:155},
 {id:'english',name:'London Club',subject:'Anglais',x:710,y:790,w:230,h:145},
 {id:'spanish',name:'Plaza Española',subject:'Espagnol',x:990,y:780,w:230,h:145},
 {id:'german',name:'Deutsches Zentrum',subject:'Allemand',x:1260,y:745,w:250,h:155}
];
for(const b of buildings){if(b.subject){b.color=SUBJECTS[b.subject].color;b.icon=SUBJECTS[b.subject].icon}}
let player={x:800,y:660,vx:0,vy:0,target:null},near=null,joyVec={x:0,y:0},keyVec={x:0,y:0};
function resizeCampus(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);ctx.setTransform(d,0,0,d,0,0)}
addEventListener('resize',resizeCampus);setTimeout(resizeCampus,0);
function shade(hex,amt){
 let c=hex.replace('#',''),n=parseInt(c,16),r=Math.max(0,Math.min(255,(n>>16)+amt)),g=Math.max(0,Math.min(255,((n>>8)&255)+amt)),b=Math.max(0,Math.min(255,(n&255)+amt));
 return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)
}
function roundedPath(c,x,y,w,h,r){
 r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()
}
const CAMPUS_TREES=[[55,300,1],[390,300,.92],[1170,305,.94],[1530,300,1.04],[45,680,1],[370,680,.88],[1180,675,.94],[1540,680,1.06],[310,955,.9],[1490,950,1.02],[690,285,.84],[930,285,.86],[220,325,.7],[1375,330,.74],[255,650,.72],[1345,655,.72],[540,680,.68],[1060,670,.68]];
const CAMPUS_BENCHES=[[610,315,0],[1010,315,0],[610,705,0],[1010,710,0],[470,585,1],[1130,585,1]];
const GRASS_MARKS=(()=>{let seed=53021,a=[];for(let i=0;i<135;i++){seed=(seed*1664525+1013904223)>>>0;const x=seed%WORLD.w;seed=(seed*1664525+1013904223)>>>0;const y=seed%WORLD.h;seed=(seed*1664525+1013904223)>>>0;a.push([x,y,3+seed%7,seed%3])}return a})();
const FLOWERS=[[435,330],[455,342],[1140,342],[1160,328],[385,720],[1205,720],[680,700],[925,705],[600,260],[1000,260]];
function drawGround(c){
 const lawn=c.createLinearGradient(0,0,WORLD.w,WORLD.h);lawn.addColorStop(0,'#7fa66d');lawn.addColorStop(.46,'#6f9b62');lawn.addColorStop(1,'#5e8857');c.fillStyle=lawn;c.fillRect(0,0,WORLD.w,WORLD.h);
 c.lineCap='round';for(const [x,y,len,t] of GRASS_MARKS){c.strokeStyle=t===0?'rgba(31,83,47,.22)':t===1?'rgba(212,227,172,.18)':'rgba(255,255,255,.1)';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(x+2,y-len);c.stroke()}
 // chemins bordés et légèrement texturés
 const paths=[[800,0,800,1050],[0,525,1600,525],[250,860,1350,860],[260,180,1340,180]];
 for(const p of paths){c.strokeStyle='rgba(37,53,44,.24)';c.lineWidth=78;c.beginPath();c.moveTo(p[0]+5,p[1]+7);c.lineTo(p[2]+5,p[3]+7);c.stroke();c.strokeStyle='#b49f7d';c.lineWidth=70;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(p[2],p[3]);c.stroke();c.strokeStyle='#d8c8a7';c.lineWidth=57;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(p[2],p[3]);c.stroke();c.strokeStyle='rgba(255,255,255,.22)';c.lineWidth=2;c.setLineDash([18,15]);c.beginPath();c.moveTo(p[0],p[1]-8);c.lineTo(p[2],p[3]-8);c.stroke();c.setLineDash([])}
}
let campusGroundCache=null;
function getCampusGround(){
 if(campusGroundCache)return campusGroundCache;
 campusGroundCache=document.createElement('canvas');campusGroundCache.width=WORLD.w;campusGroundCache.height=WORLD.h;const c=campusGroundCache.getContext('2d');drawGround(c);
 for(const [x,y,v] of CAMPUS_BENCHES)drawBench(c,x,y,v);
 for(const [x,y] of FLOWERS){c.fillStyle='#5d873e';c.beginPath();c.arc(x,y,13,0,Math.PI*2);c.fill();for(let i=0;i<5;i++){c.fillStyle=i%2?'#f2c9d3':'#f0d768';c.beginPath();c.arc(x+Math.cos(i*1.256)*10,y+Math.sin(i*1.256)*7,5,0,Math.PI*2);c.fill()}}
 return campusGroundCache
}
function drawFountain(c,time){
 c.save();c.translate(800,620);c.fillStyle='rgba(25,45,40,.28)';c.beginPath();c.ellipse(12,20,123,89,0,0,Math.PI*2);c.fill();
 const stone=c.createRadialGradient(-25,-28,12,0,0,112);stone.addColorStop(0,'#eee7d8');stone.addColorStop(.58,'#bdb5a3');stone.addColorStop(1,'#827d73');c.fillStyle=stone;c.beginPath();c.ellipse(0,0,112,85,0,0,Math.PI*2);c.fill();
 const water=c.createRadialGradient(-20,-20,5,0,0,80);water.addColorStop(0,'#9de2ed');water.addColorStop(.55,'#4aa7bf');water.addColorStop(1,'#27758f');c.fillStyle=water;c.beginPath();c.ellipse(0,-3,88,63,0,0,Math.PI*2);c.fill();
 c.strokeStyle='rgba(224,250,255,.58)';c.lineWidth=3;for(let i=0;i<3;i++){c.beginPath();c.ellipse(0,-3,35+i*17+Math.sin(time+i)*2,22+i*10,0,0,Math.PI*2);c.stroke()}
 c.fillStyle='#c8c4bb';c.beginPath();c.ellipse(0,-4,25,17,0,0,Math.PI*2);c.fill();c.fillRect(-9,-68,18,65);c.fillStyle='#e9e6df';c.beginPath();c.ellipse(0,-68,13,8,0,0,Math.PI*2);c.fill();
 c.strokeStyle='rgba(214,249,255,.9)';c.lineWidth=4;c.beginPath();c.moveTo(0,-70);c.quadraticCurveTo(-20,-108,-42,-66);c.moveTo(0,-70);c.quadraticCurveTo(20,-108,42,-66);c.stroke();c.restore()
}
function drawTree(c,x,y,s=1){
 c.save();c.translate(x,y);c.scale(s,s);c.fillStyle='rgba(28,48,35,.28)';c.beginPath();c.ellipse(12,35,50,18,-.12,0,Math.PI*2);c.fill();
 const trunk=c.createLinearGradient(-11,0,13,0);trunk.addColorStop(0,'#553a27');trunk.addColorStop(.5,'#8b6240');trunk.addColorStop(1,'#4b3323');c.fillStyle=trunk;c.fillRect(-9,-7,18,50);c.strokeStyle='#4a3325';c.lineWidth=4;c.beginPath();c.moveTo(0,12);c.lineTo(-20,-15);c.moveTo(2,8);c.lineTo(22,-20);c.stroke();
 const crown=c.createRadialGradient(-16,-35,5,0,-20,53);crown.addColorStop(0,'#84b96e');crown.addColorStop(.58,'#3f7d4d');crown.addColorStop(1,'#245c3a');c.fillStyle=crown;for(const p of [[-22,-31,31],[18,-35,34],[0,-59,35],[-3,-18,37]]){c.beginPath();c.arc(p[0],p[1],p[2],0,Math.PI*2);c.fill()}c.fillStyle='rgba(224,239,186,.25)';c.beginPath();c.arc(-20,-50,16,0,Math.PI*2);c.fill();c.restore()
}
function drawBench(c,x,y,vertical){
 c.save();c.translate(x,y);if(vertical)c.rotate(Math.PI/2);c.fillStyle='rgba(25,44,35,.2)';c.fillRect(-45,11,96,12);c.fillStyle='#4f4033';c.fillRect(-42,-8,7,34);c.fillRect(35,-8,7,34);const wood=c.createLinearGradient(0,-18,0,14);wood.addColorStop(0,'#bb8957');wood.addColorStop(1,'#755035');c.fillStyle=wood;for(let i=0;i<3;i++){roundedPath(c,-50,-18+i*11,100,8,3);c.fill()}c.restore()
}
function drawBuilding(c,b,isNear){
 const base=b.color||'#6688aa',x=b.x,y=b.y,w=b.w,h=b.h,roofY=y+34;
 c.save();
 // ombre portée longue, orientée vers le sud-est
 c.fillStyle='rgba(22,35,31,.3)';c.beginPath();c.moveTo(x+13,y+52);c.lineTo(x+w+36,y+67);c.lineTo(x+w+52,y+h+30);c.lineTo(x+25,y+h+23);c.closePath();c.fill();
 if(isNear){c.strokeStyle='rgba(255,215,75,.92)';c.lineWidth=8;c.shadowColor='#ffd44f';c.shadowBlur=18;roundedPath(c,x-9,y-15,w+27,h+36,16);c.stroke();c.shadowBlur=0}
 // soubassement et façade avec relief
 c.fillStyle='#6f716d';c.fillRect(x-4,y+h-13,w+8,17);const wall=c.createLinearGradient(x,y,x+w,y+h);wall.addColorStop(0,shade(base,42));wall.addColorStop(.58,base);wall.addColorStop(1,shade(base,-34));c.fillStyle=wall;c.fillRect(x,roofY,w,h-34);
 c.fillStyle=shade(base,-45);c.beginPath();c.moveTo(x+w,roofY);c.lineTo(x+w+18,roofY+12);c.lineTo(x+w+18,y+h+4);c.lineTo(x+w,y+h);c.closePath();c.fill();
 // toit texturé
 const roof=c.createLinearGradient(x,y-12,x,y+48);roof.addColorStop(0,shade(base,5));roof.addColorStop(.42,shade(base,-38));roof.addColorStop(1,shade(base,-62));c.fillStyle=roof;c.beginPath();c.moveTo(x-18,roofY+5);c.lineTo(x+w/2,y-19);c.lineTo(x+w+21,roofY+5);c.lineTo(x+w+8,roofY+20);c.lineTo(x+w/2,y-1);c.lineTo(x-5,roofY+20);c.closePath();c.fill();
 c.strokeStyle='rgba(255,255,255,.22)';c.lineWidth=3;c.beginPath();c.moveTo(x+w/2,y-14);c.lineTo(x+w+15,roofY+7);c.stroke();
 // fenêtres vitrées
 const count=w<240?2:3,gap=w/(count+1);for(let i=1;i<=count;i++){const wx=x+gap*i-22,wy=y+65;const glass=c.createLinearGradient(wx,wy,wx+42,wy+42);glass.addColorStop(0,'#d6f4ff');glass.addColorStop(.45,'#7db7c8');glass.addColorStop(1,'#305d6f');c.fillStyle='#e7e1d4';c.fillRect(wx-4,wy-4,48,48);c.fillStyle=glass;c.fillRect(wx,wy,40,40);c.strokeStyle='rgba(255,255,255,.65)';c.lineWidth=2;c.beginPath();c.moveTo(wx+5,wy+30);c.lineTo(wx+29,wy+6);c.stroke();c.strokeStyle='#596568';c.lineWidth=2;c.strokeRect(wx,wy,40,40)}
 // entrée
 const dx=x+w/2-27,dy=y+h-61;c.fillStyle='rgba(34,42,48,.25)';roundedPath(c,dx-5,dy-4,64,65,5);c.fill();const door=c.createLinearGradient(dx,dy,dx+54,dy);door.addColorStop(0,'#2f3d47');door.addColorStop(.55,'#536a76');door.addColorStop(1,'#26323a');c.fillStyle=door;roundedPath(c,dx,dy,54,61,5);c.fill();c.fillStyle='#e1bd59';c.beginPath();c.arc(dx+43,dy+32,3,0,Math.PI*2);c.fill();
 // plaque de matière
 c.fillStyle='rgba(245,243,235,.96)';roundedPath(c,x+w/2-34,y+13,68,48,14);c.fill();c.strokeStyle='rgba(39,57,59,.18)';c.lineWidth=2;c.stroke();c.font='27px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(b.icon,x+w/2,y+37);
 // quelques détails selon le bâtiment
 if(b.id==='history'){c.fillStyle='#d9cfbd';for(const px of [x+14,x+w-26])c.fillRect(px,y+54,12,h-61)}
 if(b.id==='physics'||b.id==='svt'){c.fillStyle='rgba(180,232,225,.72)';c.fillRect(x+12,y+121,w-24,10)}
 if(b.id==='arcade'){c.fillStyle='#e9c957';for(let i=0;i<6;i++){c.beginPath();c.arc(x+26+i*42,y+56,4,0,Math.PI*2);c.fill()}}
 // nom, lisible sur le décor
 c.font='800 18px system-ui';c.textBaseline='alphabetic';c.lineWidth=6;c.strokeStyle='rgba(245,248,245,.94)';c.strokeText(b.name,x+w/2,y+h+28);c.fillStyle='#172c2a';c.fillText(b.name,x+w/2,y+h+28);c.restore()
}
function drawCampus(){
 const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);
 const zoom=Math.max(.62,Math.min(.88,w/900));
 const camX=Math.max(w/(2*zoom),Math.min(WORLD.w-w/(2*zoom),player.x));
 const camY=Math.max(h/(2*zoom),Math.min(WORLD.h-h/(2*zoom),player.y));
 ctx.save();ctx.translate(w/2,h/2);ctx.scale(zoom,zoom);ctx.translate(-camX,-camY);
 ctx.drawImage(getCampusGround(),0,0);drawFountain(ctx,performance.now()*.002);
 const layers=[...buildings.map(b=>({y:b.y+b.h,type:'building',value:b})),...CAMPUS_TREES.map(t=>({y:t[1]+43*t[2],type:'tree',value:t})),{y:player.y+35,type:'player'}].sort((a,b)=>a.y-b.y);
 for(const layer of layers){if(layer.type==='building')drawBuilding(ctx,layer.value,near===layer.value);else if(layer.type==='tree')drawTree(ctx,...layer.value);else drawAvatar(ctx,player.x,player.y,1,S.avatar)}
 ctx.restore();
 const vignette=ctx.createRadialGradient(w*.47,h*.38,Math.min(w,h)*.15,w*.5,h*.5,Math.max(w,h)*.75);vignette.addColorStop(0,'rgba(255,248,211,.04)');vignette.addColorStop(1,'rgba(11,28,31,.2)');ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
 requestAnimationFrame(drawCampus);
}
function drawAvatar(c,x,y,scale=1,a=S.avatar){
 c.save();c.translate(x,y);
 c.fillStyle='rgba(18,31,29,.3)';c.beginPath();c.ellipse(8*scale,34*scale,28*scale,9*scale,-.06,0,Math.PI*2);c.fill();
 if(a.accessory==='backpack'){const bag=c.createLinearGradient(-28*scale,-40*scale,28*scale,8*scale);bag.addColorStop(0,'#81649d');bag.addColorStop(1,'#493661');c.fillStyle=bag;roundedPath(c,-27*scale,-43*scale,54*scale,55*scale,10*scale);c.fill()}
 // jambes et chaussures
 c.fillStyle=a.pants;roundedPath(c,-21*scale,-2*scale,17*scale,38*scale,5*scale);c.fill();roundedPath(c,4*scale,-2*scale,17*scale,38*scale,5*scale);c.fill();c.fillStyle='#27333b';roundedPath(c,-24*scale,28*scale,22*scale,10*scale,4*scale);c.fill();roundedPath(c,3*scale,28*scale,22*scale,10*scale,4*scale);c.fill();
 // buste modelé et bras
 const shirt=c.createLinearGradient(-28*scale,-47*scale,28*scale,6*scale);shirt.addColorStop(0,shade(a.shirt,35));shirt.addColorStop(.65,a.shirt);shirt.addColorStop(1,shade(a.shirt,-30));c.fillStyle=shirt;roundedPath(c,-27*scale,-48*scale,54*scale,54*scale,10*scale);c.fill();c.fillStyle=a.skin;roundedPath(c,-37*scale,-40*scale,11*scale,39*scale,5*scale);c.fill();roundedPath(c,26*scale,-40*scale,11*scale,39*scale,5*scale);c.fill();
 // cou et visage avec ombrage doux
 c.fillStyle=shade(a.skin,-12);roundedPath(c,-8*scale,-54*scale,16*scale,15*scale,4*scale);c.fill();const skin=c.createRadialGradient(-9*scale,-77*scale,4*scale,0,-67*scale,31*scale);skin.addColorStop(0,shade(a.skin,28));skin.addColorStop(.72,a.skin);skin.addColorStop(1,shade(a.skin,-22));c.fillStyle=skin;c.beginPath();c.ellipse(0,-69*scale,27*scale,30*scale,0,0,Math.PI*2);c.fill();
 c.fillStyle=a.hair;
 if(String(a.hairStyle)==='0'){c.beginPath();c.arc(0,-80*scale,27*scale,Math.PI,Math.PI*2);c.fill();c.beginPath();c.moveTo(-27*scale,-80*scale);c.quadraticCurveTo(0,-70*scale,27*scale,-82*scale);c.lineTo(26*scale,-70*scale);c.quadraticCurveTo(0,-78*scale,-26*scale,-68*scale);c.closePath();c.fill()}
 if(String(a.hairStyle)==='1'){c.beginPath();c.arc(0,-80*scale,29*scale,Math.PI,Math.PI*2);c.fill();roundedPath(c,-29*scale,-80*scale,10*scale,38*scale,5*scale);c.fill();roundedPath(c,19*scale,-80*scale,10*scale,38*scale,5*scale);c.fill()}
 if(String(a.hairStyle)==='2'){for(const p of [[-18,-84],[0,-91],[19,-84],[-25,-70],[25,-70]]){c.beginPath();c.arc(p[0]*scale,p[1]*scale,13*scale,0,Math.PI*2);c.fill()}}
 c.fillStyle='#26323a';c.beginPath();c.ellipse(-9*scale,-69*scale,2.5*scale,3.1*scale,0,0,Math.PI*2);c.ellipse(9*scale,-69*scale,2.5*scale,3.1*scale,0,0,Math.PI*2);c.fill();c.strokeStyle=shade(a.skin,-38);c.lineWidth=1.6*scale;c.beginPath();c.arc(0,-61*scale,7*scale,.2,Math.PI-.2);c.stroke();
 if(a.accessory==='glasses'){c.strokeStyle='#26364e';c.lineWidth=2*scale;c.strokeRect(-17*scale,-75*scale,13*scale,11*scale);c.strokeRect(4*scale,-75*scale,13*scale,11*scale);c.beginPath();c.moveTo(-4*scale,-70*scale);c.lineTo(4*scale,-70*scale);c.stroke()}
 c.restore();
}
function distTo(b){const cx=b.x+b.w/2,cy=b.y+b.h/2;return Math.hypot(player.x-cx,player.y-cy)}
function tick(){
 let dx=joyVec.x,dy=joyVec.y;
 if(Math.hypot(dx,dy)<.05){dx=keyVec.x;dy=keyVec.y}
 if(Math.hypot(dx,dy)<.05 && player.target){
  const tx=player.target.x-player.x,ty=player.target.y-player.y,d=Math.hypot(tx,ty);
  if(d<8)player.target=null;else{dx=tx/d;dy=ty/d}
 }
 const speed=3.7;player.x=Math.max(25,Math.min(WORLD.w-25,player.x+dx*speed));player.y=Math.max(50,Math.min(WORLD.h-30,player.y+dy*speed));
 near=null;let nd=999;
 for(const b of buildings){const d=distTo(b);if(d<155&&d<nd){near=b;nd=d}}
 if(near){el('actionBtn').textContent='Entrer';el('nearLabel').textContent=near.icon+' '+near.name}
 else{el('actionBtn').textContent='Explorer';el('nearLabel').textContent='Approche-toi d’un bâtiment.'}
 requestAnimationFrame(tick);
}
canvas.addEventListener('pointerdown',e=>{
 const r=canvas.getBoundingClientRect(),w=r.width,h=r.height,zoom=Math.max(.62,Math.min(.88,w/900));
 const camX=Math.max(w/(2*zoom),Math.min(WORLD.w-w/(2*zoom),player.x));
 const camY=Math.max(h/(2*zoom),Math.min(WORLD.h-h/(2*zoom),player.y));
 player.target={x:(e.clientX-r.left-w/2)/zoom+camX,y:(e.clientY-r.top-h/2)/zoom+camY};
});
const joy=el('joy'),knob=el('joyKnob');let joyPointer=null;
function joyMove(e){
 const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,m=Math.hypot(dx,dy),lim=34;
 if(m>lim){dx*=lim/m;dy*=lim/m} joyVec={x:dx/lim,y:dy/lim};knob.style.transform=`translate(${dx}px,${dy}px)`;player.target=null;
}
joy.addEventListener('pointerdown',e=>{joyPointer=e.pointerId;joy.setPointerCapture(e.pointerId);joyMove(e)});
joy.addEventListener('pointermove',e=>{if(e.pointerId===joyPointer)joyMove(e)});
function joyEnd(e){if(e.pointerId===joyPointer){joyPointer=null;joyVec={x:0,y:0};knob.style.transform='translate(0,0)'}}
joy.addEventListener('pointerup',joyEnd);joy.addEventListener('pointercancel',joyEnd);
const keys={};addEventListener('keydown',e=>keys[e.key.toLowerCase()]=true);addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
setInterval(()=>{if(keys.arrowleft||keys.a)keyVec.x=-1;else if(keys.arrowright||keys.d)keyVec.x=1;else keyVec.x=0;if(keys.arrowup||keys.w)keyVec.y=-1;else if(keys.arrowdown||keys.s)keyVec.y=1;else keyVec.y=0},25);
el('actionBtn').addEventListener('click',()=>{if(!near){toast('Explore le Campus et approche-toi d’un bâtiment.');return}enterBuilding(near)});
function enterBuilding(b){if(b.subject)openSubject(b.subject);else if(b.kind==='room')show('room');else if(b.kind==='store')show('store');else if(b.kind==='arcade')show('arcade')}

/* Subjects */
function renderSubjects(){
 const d=el('subjectList');d.innerHTML='';
 Object.keys(SUBJECTS).forEach(s=>{
  const st=S.subject[s]||{answered:0,correct:0};const pct=st.answered?Math.round(st.correct/st.answered*100):0;
  const b=document.createElement('button');b.className='subject-card';b.innerHTML=`<span class="emoji">${SUBJECTS[s].icon}</span><b>${s}</b><small>${SUBJECTS[s].building}<br>${st.answered?pct+'% de réussite':Q.filter(q=>q.subject===s).length+' questions'}</small>`;
  b.addEventListener('click',()=>openSubject(s));d.appendChild(b);
 });
}
let currentSubject='Mathématiques';
function openSubject(s){currentSubject=s;const m=SUBJECTS[s];el('subjectTitle').textContent=s;el('subjectBuilding').textContent=m.building;el('subjectIcon').textContent=m.icon;el('subjectName').textContent=s;const st=S.subject[s]||{answered:0,correct:0};el('subjectStats').textContent=st.answered?`${st.correct}/${st.answered} réponses correctes`:'Aucune session pour le moment';el('miniBtn').textContent='🎯 '+miniName(m.mini,s);show('subject')}
function miniName(type,s){return type==='multiplication'?'Multiplications express':type==='french'?'Détective des fautes':type==='timeline'?'Frise du temps':type==='geo'?'Mission cartographe':type==='foodchain'?'Chaîne alimentaire':type==='circuit'?'Circuit électrique':type==='robot'?'Robot programmeur':type==='emc'?'Défi citoyen':'Jeu des paires — '+s}
el('classicBtn').addEventListener('click',()=>startQuiz(currentSubject,false));
el('errorsBtn').addEventListener('click',()=>startQuiz(currentSubject,true));
el('miniBtn').addEventListener('click',()=>startMini(SUBJECTS[currentSubject].mini,currentSubject));

/* Quiz */
let session=[],qi=0,qscore=0,locked=false,qstreak=0;
function shuffle(a){const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x}
function startQuiz(subject=null,errorOnly=false){
 let pool=Q;if(subject)pool=pool.filter(q=>q.subject===subject);
 if(errorOnly)pool=pool.filter(q=>(S.errors[q.id]||0)>0);
 if(!pool.length){toast('Aucune erreur à retravailler ici 🎉');return}
 session=shuffle(pool).slice(0,Math.min(10,pool.length));qi=0;qscore=0;qstreak=0;locked=false;
 el('quizTitle').textContent=errorOnly?'Révision des erreurs':'Révision classique';el('quizSub').textContent=subject||'Mélange surprise';show('quiz');renderQuestion();
}
function renderQuestion(){
 if(qi>=session.length)return finishQuiz();
 const q=session[qi];locked=false;el('qCount').textContent=`${qi+1}/${session.length}`;el('qScore').textContent=qscore+' point'+(qscore>1?'s':'');el('qBar').style.width=(qi/session.length*100)+'%';el('qPrompt').textContent=q.prompt;el('streakHud').textContent=qstreak;
 const c=el('qChoices');c.innerHTML='';shuffle(q.choices).forEach(ch=>{const b=document.createElement('button');b.className='choice';b.textContent=ch;b.addEventListener('click',()=>answerQuestion(q,ch,b));c.appendChild(b)});
 el('qFeedback').className='feedback';el('qNext').style.display='none';
}
function subjectTouch(s,ok){S.subject[s] ||= {answered:0,correct:0};S.subject[s].answered++;if(ok)S.subject[s].correct++}
function answerQuestion(q,ch,b){
 if(locked)return;locked=true;const ok=ch===q.answer;
 document.querySelectorAll('#qChoices .choice').forEach(x=>{if(x.textContent===q.answer)x.classList.add('correct');else if(x===b&&!ok)x.classList.add('wrong');x.disabled=true});
 S.answered++;S.daily.answered++;subjectTouch(q.subject,ok);
 if(ok){qscore++;S.correct++;qstreak++;S.streak++;S.bestStreak=Math.max(S.bestStreak,S.streak);S.xp+=20;S.coins+=5;if(S.errors[q.id])S.errors[q.id]=Math.max(0,S.errors[q.id]-1);if(q.subject==='Mathématiques')S.daily.mathCorrect++}
 else{qstreak=0;S.streak=0;S.errors[q.id]=(S.errors[q.id]||0)+1;S.xp+=5;S.coins+=1}
 beep(ok);save();
 const f=el('qFeedback');f.className='feedback show';f.innerHTML=ok?`✅ <b>Bonne réponse !</b><br>${q.explanation||''}`:`❌ <b>Bonne réponse : ${q.answer}</b><br>${q.explanation||''}`;
 el('qNext').style.display='block';
}
el('qNext').addEventListener('click',()=>{qi++;renderQuestion()});
el('mixedShortcut').addEventListener('click',()=>startQuiz(null,false));
el('errorsShortcut').addEventListener('click',()=>startQuiz(null,true));
function finishQuiz(){el('qBar').style.width='100%';el('qPrompt').textContent=`🎉 Session terminée : ${qscore}/${session.length}`;el('qChoices').innerHTML='';const f=el('qFeedback');f.className='feedback show';f.innerHTML=qscore===session.length?'👑 Parfait ! Série légendaire.':qscore>=Math.ceil(session.length*.7)?'⭐ Très belle session !':'🧠 Tes erreurs ont été ajoutées à « À retravailler ».';el('qNext').style.display='none';save()}

/* Shop & room */
const ITEMS=[
 {id:'bed_basic',name:'Lit Campus',icon:'🛏️',price:0,slot:'bed'},
 {id:'desk_basic',name:'Bureau d’étude',icon:'🖥️',price:0,slot:'desk'},
 {id:'bed_galaxy',name:'Lit Galaxie',icon:'🌌',price:180,slot:'bed'},
 {id:'desk_modern',name:'Bureau moderne',icon:'🪑',price:140,slot:'desk'},
 {id:'plant',name:'Plante verte',icon:'🪴',price:60,slot:'plant'},
 {id:'lamp',name:'Lampe étoile',icon:'💡',price:90,slot:'lamp'},
 {id:'rug',name:'Tapis rond',icon:'🟣',price:100,slot:'rug'},
 {id:'poster',name:'Affiche du monde',icon:'🗺️',price:70,slot:'poster'},
 {id:'bookshelf',name:'Bibliothèque',icon:'📚',price:120,slot:'bookshelf'},
 {id:'chair',name:'Fauteuil gaming',icon:'🪑',price:150,slot:'chair'}
];
function renderShop(){
 const g=el('shopGrid');g.innerHTML='';
 ITEMS.filter(i=>i.price>0).forEach(i=>{const owned=S.owned.includes(i.id),d=document.createElement('div');d.className='item';d.innerHTML=`<div class="art">${i.icon}</div><b>${i.name}</b><small>Décoration • ${i.slot}</small><span class="price">${owned?'Possédé':'🪙 '+i.price}</span><button class="btn ${owned?'soft':'gold'}" style="width:100%;margin-top:8px">${owned?'Équiper':'Acheter'}</button>`;d.querySelector('button').addEventListener('click',()=>owned?equip(i):buy(i));g.appendChild(d)})
}
function buy(i){if(S.coins<i.price){toast('Pas assez de jetons Campus.');return}S.coins-=i.price;S.owned.push(i.id);equip(i);save();renderShop();toast(i.name+' acheté 🎉')}
function equip(i){S.equipped=S.equipped.filter(id=>(ITEMS.find(x=>x.id===id)||{}).slot!==i.slot);S.equipped.push(i.id);save();renderInventory();drawRoom();toast(i.name+' équipé')}
function renderInventory(){const d=el('inventory');d.innerHTML='';S.owned.forEach(id=>{const i=ITEMS.find(x=>x.id===id);if(!i)return;const b=document.createElement('button');b.className='inv';b.innerHTML=`<div style="font-size:1.6rem">${i.icon}</div><b>${i.name}</b><small>${S.equipped.includes(id)?'✅ Équipé':'Toucher pour équiper'}</small>`;b.addEventListener('click',()=>equip(i));d.appendChild(b)})}
function drawRoom(){
 const c=el('roomCanvas'),x=c.getContext('2d'),w=c.width,h=c.height;x.clearRect(0,0,w,h);
 const wall=x.createLinearGradient(0,0,w,260);wall.addColorStop(0,'#d9e1e3');wall.addColorStop(.55,'#f0eee8');wall.addColorStop(1,'#c7d2d6');x.fillStyle=wall;x.fillRect(0,0,w,254);
 // plinthes et parquet en perspective
 x.fillStyle='#8a7765';x.fillRect(0,246,w,14);const floor=x.createLinearGradient(0,255,0,h);floor.addColorStop(0,'#b89468');floor.addColorStop(1,'#806044');x.fillStyle=floor;x.fillRect(0,260,w,h-260);x.strokeStyle='rgba(79,52,34,.42)';x.lineWidth=2;for(let i=-3;i<12;i++){x.beginPath();x.moveTo(380+i*62,260);x.lineTo(380+i*105,h);x.stroke()}for(let yy=286;yy<h;yy+=34){x.beginPath();x.moveTo(0,yy);x.lineTo(w,yy);x.stroke()}
 // fenêtre avec paysage et lumière
 x.fillStyle='rgba(55,63,66,.22)';x.fillRect(264,50,236,143);x.fillStyle='#f6f3ea';x.fillRect(270,44,220,135);const sky=x.createLinearGradient(0,55,0,170);sky.addColorStop(0,'#85c9e9');sky.addColorStop(1,'#e8f0cf');x.fillStyle=sky;x.fillRect(282,56,196,111);x.fillStyle='#5b8a55';x.beginPath();x.moveTo(282,145);x.quadraticCurveTo(340,104,388,147);x.quadraticCurveTo(430,111,478,143);x.lineTo(478,167);x.lineTo(282,167);x.fill();x.strokeStyle='#f6f3ea';x.lineWidth=8;x.beginPath();x.moveTo(380,52);x.lineTo(380,173);x.moveTo(278,111);x.lineTo(482,111);x.stroke();x.fillStyle='rgba(255,239,178,.13)';x.beginPath();x.moveTo(278,176);x.lineTo(515,460);x.lineTo(270,460);x.closePath();x.fill();
 const eq=S.equipped;
 if(eq.includes('rug')){const rug=x.createRadialGradient(350,340,8,380,360,125);rug.addColorStop(0,'#9b88c1');rug.addColorStop(1,'#554778');x.fillStyle='rgba(45,31,59,.24)';x.beginPath();x.ellipse(392,370,130,58,0,0,Math.PI*2);x.fill();x.fillStyle=rug;x.beginPath();x.ellipse(380,358,120,53,0,0,Math.PI*2);x.fill();x.strokeStyle='rgba(255,255,255,.25)';x.lineWidth=4;x.beginPath();x.ellipse(380,358,96,40,0,0,Math.PI*2);x.stroke()}
 const bed=eq.includes('bed_galaxy');x.fillStyle='rgba(45,35,31,.3)';x.fillRect(72,280,225,96);const frame=x.createLinearGradient(55,250,290,365);frame.addColorStop(0,bed?'#364879':'#b28558');frame.addColorStop(1,bed?'#1f2b51':'#6e4b32');x.fillStyle=frame;roundedPath(x,55,246,228,112,8);x.fill();const blanket=x.createLinearGradient(70,258,265,335);blanket.addColorStop(0,bed?'#667ec2':'#f1d39f');blanket.addColorStop(1,bed?'#283a78':'#c18d5c');x.fillStyle=blanket;roundedPath(x,70,257,198,82,10);x.fill();x.fillStyle=bed?'#e5e7ff':'#fff4df';roundedPath(x,82,263,70,30,10);x.fill();if(bed){x.fillStyle='#f6df73';for(const p of [[188,278],[222,308],[169,321]]){x.beginPath();x.arc(p[0],p[1],3,0,Math.PI*2);x.fill()}}
 x.fillStyle='rgba(43,34,30,.25)';x.fillRect(506,279,190,95);const desk=x.createLinearGradient(500,255,680,290);desk.addColorStop(0,eq.includes('desk_modern')?'#71889a':'#9c7450');desk.addColorStop(1,eq.includes('desk_modern')?'#344b5d':'#5f402d');x.fillStyle=desk;roundedPath(x,498,255,188,25,5);x.fill();x.fillRect(512,278,14,91);x.fillRect(658,278,14,91);x.fillStyle='#25343d';roundedPath(x,552,215,83,48,5);x.fill();x.fillStyle='#78aec5';x.fillRect(559,222,69,34);x.fillStyle='#41484c';x.fillRect(588,263,11,18);
 if(eq.includes('plant')){x.fillStyle='rgba(38,45,35,.23)';x.beginPath();x.ellipse(713,348,32,10,0,0,Math.PI*2);x.fill();const pot=x.createLinearGradient(688,305,730,347);pot.addColorStop(0,'#c37b51');pot.addColorStop(1,'#75422c');x.fillStyle=pot;x.beginPath();x.moveTo(688,306);x.lineTo(731,306);x.lineTo(724,348);x.lineTo(695,348);x.closePath();x.fill();for(const p of [[701,290,24,-.5],[716,274,27,.2],[727,296,23,.75]]){x.save();x.translate(p[0],p[1]);x.rotate(p[3]);x.fillStyle='#447a4d';x.beginPath();x.ellipse(0,0,p[2],10,0,0,Math.PI*2);x.fill();x.restore()}}
 if(eq.includes('bookshelf')){const shelf=x.createLinearGradient(20,70,140,235);shelf.addColorStop(0,'#9c7452');shelf.addColorStop(1,'#553b2b');x.fillStyle=shelf;roundedPath(x,20,70,122,168,5);x.fill();x.fillStyle='#493326';for(let yy=102;yy<225;yy+=39)x.fillRect(27,yy,108,7);const colors=['#b4514e','#d5ae4e','#4f7794','#708f5d'];for(let row=0;row<3;row++)for(let col=0;col<6;col++){x.fillStyle=colors[(row+col)%colors.length];x.fillRect(34+col*16,79+row*39,11,22+((col*3)%8))}}
 if(eq.includes('poster')){x.fillStyle='rgba(46,48,48,.2)';x.fillRect(544,69,130,91);x.fillStyle='#f3ead6';x.fillRect(538,63,130,90);const map=x.createRadialGradient(600,105,5,603,108,43);map.addColorStop(0,'#b6d7b0');map.addColorStop(1,'#4f83a6');x.fillStyle=map;x.beginPath();x.arc(603,108,34,0,Math.PI*2);x.fill();x.strokeStyle='#735d45';x.strokeRect(538,63,130,90)}
 if(eq.includes('lamp')){x.strokeStyle='#41494d';x.lineWidth=5;x.beginPath();x.moveTo(457,260);x.lineTo(457,326);x.stroke();const glow=x.createRadialGradient(457,241,3,457,241,48);glow.addColorStop(0,'rgba(255,241,145,.62)');glow.addColorStop(1,'rgba(255,230,107,0)');x.fillStyle=glow;x.beginPath();x.arc(457,241,48,0,Math.PI*2);x.fill();x.fillStyle='#e7bc4d';x.beginPath();x.moveTo(438,252);x.lineTo(476,252);x.lineTo(468,226);x.lineTo(446,226);x.closePath();x.fill()}
 if(eq.includes('chair')){x.fillStyle='rgba(31,29,39,.26)';x.beginPath();x.ellipse(482,398,49,15,0,0,Math.PI*2);x.fill();const chair=x.createLinearGradient(454,310,510,390);chair.addColorStop(0,'#756ba1');chair.addColorStop(1,'#3c355d');x.fillStyle=chair;roundedPath(x,454,307,57,74,12);x.fill();roundedPath(x,446,364,73,23,8);x.fill();x.fillStyle='#34383e';x.fillRect(479,385,7,19);x.fillRect(458,402,50,6)}
 drawAvatar(x,375,350,1.25,S.avatar);renderInventory();
}
function renderStoreRoom(){renderShop();renderInventory()}
new MutationObserver(()=>{if(el('storeView').classList.contains('active'))renderShop()}).observe(el('storeView'),{attributes:true});

/* Avatar */
function loadAvatarForm(){el('skinColor').value=S.avatar.skin;el('hairColor').value=S.avatar.hair;el('shirtColor').value=S.avatar.shirt;el('pantsColor').value=S.avatar.pants;el('hairStyle').value=String(S.avatar.hairStyle);el('accessory').value=S.avatar.accessory;drawAvatarPreview()}
function drawAvatarPreview(){const c=el('avatarCanvas'),x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);const sky=x.createLinearGradient(0,0,0,330);sky.addColorStop(0,'#75b7d6');sky.addColorStop(.68,'#d5e6d3');sky.addColorStop(1,'#779c68');x.fillStyle=sky;x.fillRect(0,0,c.width,330);x.fillStyle='#507d52';x.beginPath();x.moveTo(0,247);x.quadraticCurveTo(85,185,170,245);x.quadraticCurveTo(285,175,400,250);x.lineTo(400,330);x.lineTo(0,330);x.fill();const floor=x.createLinearGradient(0,300,0,500);floor.addColorStop(0,'#c9b692');floor.addColorStop(1,'#8b765d');x.fillStyle=floor;x.fillRect(0,300,400,200);x.strokeStyle='rgba(78,63,49,.26)';for(let yy=320;yy<500;yy+=28){x.beginPath();x.moveTo(0,yy);x.lineTo(400,yy);x.stroke()}drawAvatar(x,200,385,2.4,{skin:el('skinColor').value,hair:el('hairColor').value,shirt:el('shirtColor').value,pants:el('pantsColor').value,hairStyle:el('hairStyle').value,accessory:el('accessory').value})}
['skinColor','hairColor','shirtColor','pantsColor','hairStyle','accessory'].forEach(id=>el(id).addEventListener('input',drawAvatarPreview));
el('saveAvatar').addEventListener('click',()=>{S.avatar={skin:el('skinColor').value,hair:el('hairColor').value,shirt:el('shirtColor').value,pants:el('pantsColor').value,hairStyle:el('hairStyle').value,accessory:el('accessory').value};save();toast('Personnage enregistré ✨')});

/* Mini games */
const MINI=[
 ['multiplication','🧮','Multiplications express','Mathématiques'],
 ['french','🔎','Détective des fautes','Français'],
 ['timeline','🕰️','Frise du temps','Histoire'],
 ['geo','🗺️','Mission cartographe','Géographie'],
 ['foodchain','🧬','Chaîne alimentaire','SVT'],
 ['circuit','⚡','Circuit électrique','Physique-Chimie'],
 ['robot','🤖','Robot programmeur','Technologie'],
 ['language','🌍','Jeu des paires','Langues']
];
function renderArcade(){const g=el('arcadeGrid');g.innerHTML='';MINI.forEach(m=>{const b=document.createElement('button');b.className='subject-card';b.innerHTML=`<span class="emoji">${m[1]}</span><b>${m[2]}</b><small>${m[3]}</small>`;b.addEventListener('click',()=>startMini(m[0],m[3]==='Langues'?'Anglais':m[3]));g.appendChild(b)})}
function miniReward(score,total,key,subject){
 S.miniPlayed++;if(score>=Math.ceil(total*.7))S.miniWon++;S.xp+=score*15;S.coins+=score*4;S.best[key]=Math.max(S.best[key]||0,score);
 if(['Anglais','Espagnol','Allemand'].includes(subject))S.daily.languageGames++;
 save();beep(score>=Math.ceil(total*.7));
}
function doneMini(score,total,key,subject){
 miniReward(score,total,key,subject);el('miniArea').innerHTML=`<div class="mini-title">🎉 Partie terminée</div><p>Score : <b>${score}/${total}</b></p><p>Récompense : +${score*15} XP et +${score*4} jetons.</p><button class="btn primary" id="againMini">Rejouer</button> <button class="btn ghost" id="backArcade">Arcade</button>`;
 el('againMini').onclick=()=>startMini(key,subject);el('backArcade').onclick=()=>show('arcade');
}
function startMini(type,subject){
 el('miniHeader').textContent=miniName(type,subject);el('miniSub').textContent=subject;show('mini');
 if(type==='multiplication')miniMultiplication(subject);
 else if(type==='french')miniFrench(subject);
 else if(type==='timeline')miniTimeline(subject);
 else if(type==='geo')miniGeo(subject);
 else if(type==='foodchain')miniFood(subject);
 else if(type==='circuit')miniCircuit(subject);
 else if(type==='robot')miniRobot(subject);
 else if(type==='emc')miniEMC(subject);
 else miniLanguage(subject);
}
function miniMultiplication(subject){
 let n=0,score=0,a=0,b=0;const A=el('miniArea');
 function next(){if(n>=10)return doneMini(score,10,'multiplication',subject);a=2+Math.floor(Math.random()*11);b=2+Math.floor(Math.random()*11);A.innerHTML=`<div class="mini-title">⚡ Calcul ${n+1}/10</div><div class="prompt">${a} × ${b} = ?</div><form id="mf"><input id="mi" inputmode="numeric" style="width:100%;padding:14px;border:1px solid #dce3ed;border-radius:13px;font-size:1.2rem" placeholder="Ta réponse"><button class="btn primary" style="width:100%;margin-top:10px">Valider</button></form>`;el('mf').onsubmit=e=>{e.preventDefault();const ok=Number(el('mi').value)===a*b;if(ok)score++;beep(ok);n++;setTimeout(next,250)};setTimeout(()=>el('mi').focus(),40)}
 next();
}
const FRENCH=[
 ['Ils mange une pomme.','Ils mangent une pomme.','Ils manges une pomme.'],
 ['Tu a fini ton travail.','Tu as fini ton travail.','Tu à fini ton travail.'],
 ['Les fille jouent dehors.','Les filles jouent dehors.','Les filles joue dehors.'],
 ['Il va a la bibliothèque.','Il va à la bibliothèque.','Il vas à la bibliothèque.'],
 ['Nous somme en retard.','Nous sommes en retard.','Nous sonmes en retard.']
];
function miniFrench(subject){let n=0,score=0,A=el('miniArea');function next(){if(n>=5)return doneMini(score,5,'french',subject);const row=FRENCH[n],opts=shuffle(row);A.innerHTML=`<div class="mini-title">🔎 Phrase ${n+1}/5</div><p>Choisis la phrase correctement écrite.</p><div class="choices">${opts.map(x=>`<button class="choice">${x}</button>`).join('')}</div>`;A.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{const ok=b.textContent===row[1];if(ok)score++;beep(ok);n++;setTimeout(next,300)})}next()}
const EVENTS=[['Couronnement de Charlemagne',800],['Début de la première croisade',1096],['Prise de Constantinople',1453],['Découverte de l’Amérique par Christophe Colomb',1492],['Début de la Réforme de Luther',1517]];
function miniTimeline(subject){let remaining=shuffle(EVENTS),score=0,A=el('miniArea');function next(){if(!remaining.length)return doneMini(score,5,'timeline',subject);A.innerHTML=`<div class="mini-title">🕰️ Quel événement vient en premier ?</div><p>${5-remaining.length}/5 placés</p><div class="choices">${remaining.map(e=>`<button class="choice">${e[0]}</button>`).join('')}</div>`;const earliest=[...remaining].sort((a,b)=>a[1]-b[1])[0];A.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{const e=remaining.find(x=>x[0]===b.textContent),ok=e===earliest;if(ok){score++;remaining=remaining.filter(x=>x!==e)}else{remaining=remaining.filter(x=>x!==earliest)}beep(ok);setTimeout(next,300)})}next()}
const GEO=[['Europe','🌍 Nord-Ouest'],['Afrique','🌍 Centre-Sud'],['Asie','🌏 Est'],['Amérique du Nord','🌎 Nord-Ouest'],['Amérique du Sud','🌎 Sud-Ouest'],['Océanie','🌏 Sud-Est']];
function miniGeo(subject){let n=0,score=0,A=el('miniArea');function next(){if(n>=6)return doneMini(score,6,'geo',subject);const target=GEO[n][0],opts=shuffle(GEO);A.innerHTML=`<div class="mini-title">🗺️ Carte schématique</div><p>Trouve : <b>${target}</b></p><div class="tilegrid">${opts.map(x=>`<button class="tile">${x[1]}<br><small>${x[0]}</small></button>`).join('')}</div>`;A.querySelectorAll('.tile').forEach(b=>b.onclick=()=>{const ok=b.textContent.includes(target);if(ok)score++;beep(ok);n++;setTimeout(next,300)})}next()}
function sequenceGame(subject,key,title,items){
 let selected=[],score=0,A=el('miniArea');const target=items.map(x=>x[0]);
 A.innerHTML=`<div class="mini-title">${title}</div><p>Touche les éléments dans le bon ordre.</p><div class="tilegrid">${shuffle(items).map(x=>`<button class="tile" data-v="${x[0]}">${x[1]}<br><small>${x[0]}</small></button>`).join('')}</div><p id="seq">Ordre : —</p>`;
 A.querySelectorAll('.tile').forEach(b=>b.onclick=()=>{if(b.disabled)return;selected.push(b.dataset.v);b.disabled=true;b.classList.add('selected');el('seq').textContent='Ordre : '+selected.join(' → ');if(selected.length===target.length){for(let i=0;i<target.length;i++)if(selected[i]===target[i])score++;setTimeout(()=>doneMini(score,target.length,key,subject),450)}})
}
function miniFood(subject){sequenceGame(subject,'foodchain','🧬 Construis la chaîne alimentaire',[['Herbe','🌱'],['Sauterelle','🦗'],['Grenouille','🐸'],['Serpent','🐍'],['Aigle','🦅']])}
function miniCircuit(subject){sequenceGame(subject,'circuit','⚡ Ferme le circuit',[['Pile','🔋'],['Interrupteur','🔘'],['Lampe','💡'],['Retour pile','🔌']])}
function miniRobot(subject){
 let cmds=[],A=el('miniArea'),robot={x:0,y:0},goal={x:3,y:2},block={x:2,y:1};
 function render(){
  A.innerHTML=`<div class="mini-title">🤖 Programme le robot</div><p>Atteins ⭐ sans toucher ⛔.</p><div class="robot-grid">${Array.from({length:16},(_,i)=>{const x=i%4,y=Math.floor(i/4);return `<div class="cell ${x===block.x&&y===block.y?'block':''} ${x===goal.x&&y===goal.y?'goal':''}">${x===robot.x&&y===robot.y?'🤖':x===block.x&&y===block.y?'⛔':x===goal.x&&y===goal.y?'⭐':''}</div>`}).join('')}</div><p>Programme : ${cmds.join(' ')||'—'}</p><div class="grid3"><button class="btn soft" data-c="⬆️">⬆️</button><button class="btn soft" data-c="➡️">➡️</button><button class="btn soft" data-c="⬇️">⬇️</button><button class="btn soft" data-c="⬅️">⬅️</button><button class="btn ghost" id="clearR">Effacer</button><button class="btn gold" id="runR">Exécuter</button></div>`;
  A.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{if(cmds.length<8){cmds.push(b.dataset.c);render()}});
  el('clearR').onclick=()=>{cmds=[];render()};
  el('runR').onclick=()=>run();
 }
 function run(){robot={x:0,y:0};let safe=true;for(const c of cmds){if(c==='⬆️')robot.y--;if(c==='⬇️')robot.y++;if(c==='⬅️')robot.x--;if(c==='➡️')robot.x++;if(robot.x<0||robot.x>3||robot.y<0||robot.y>3||(robot.x===block.x&&robot.y===block.y)){safe=false;break}}const ok=safe&&robot.x===goal.x&&robot.y===goal.y;beep(ok);render();setTimeout(()=>doneMini(ok?5:1,5,'robot',subject),600)}
 render();
}
const EMC=[
 ['Tu vois un camarade insulté dans un groupe de discussion.',['Prévenir un adulte et soutenir le camarade','Partager le message','Ne rien faire'],'Prévenir un adulte et soutenir le camarade'],
 ['Une information étrange circule en ligne.',['La vérifier avant de la partager','La partager immédiatement','Inventer un titre plus choquant'],'La vérifier avant de la partager'],
 ['Un élève est exclu d’une activité.',['Chercher une solution respectueuse et inclusive','Se moquer de lui','L’ignorer'],'Chercher une solution respectueuse et inclusive']
];
function miniEMC(subject){let n=0,score=0,A=el('miniArea');function next(){if(n>=EMC.length)return doneMini(score,EMC.length,'emc',subject);const [p,opts,ans]=EMC[n];A.innerHTML=`<div class="mini-title">⚖️ Situation ${n+1}/${EMC.length}</div><p>${p}</p><div class="choices">${shuffle(opts).map(x=>`<button class="choice">${x}</button>`).join('')}</div>`;A.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{const ok=b.textContent===ans;if(ok)score++;beep(ok);n++;setTimeout(next,300)})}next()}
const WORDS={
 'Anglais':[['apple','pomme'],['house','maison'],['school','école'],['water','eau'],['book','livre'],['friend','ami']],
 'Espagnol':[['hola','bonjour'],['casa','maison'],['escuela','école'],['agua','eau'],['libro','livre'],['amigo','ami']],
 'Allemand':[['Hallo','bonjour'],['Haus','maison'],['Schule','école'],['Wasser','eau'],['Buch','livre'],['Freund','ami']]
};
function miniLanguage(subject){
 if(!WORDS[subject])subject='Anglais';let pairs=WORDS[subject].slice(0,4),cards=shuffle(pairs.flatMap((p,i)=>[{v:p[0],id:i},{v:p[1],id:i}])),first=null,matched=0,tries=0,A=el('miniArea');
 A.innerHTML=`<div class="mini-title">🌍 Jeu des paires — ${subject}</div><p>Associe les mots.</p><div class="tilegrid">${cards.map((c,i)=>`<button class="tile" data-i="${i}" data-id="${c.id}">${c.v}</button>`).join('')}</div>`;
 A.querySelectorAll('.tile').forEach(b=>b.onclick=()=>{if(b.disabled||b===first)return;b.classList.add('selected');if(!first){first=b;return}tries++;const ok=b.dataset.id===first.dataset.id;if(ok){b.disabled=first.disabled=true;b.classList.add('ok');first.classList.add('ok');matched++;beep(true);first=null;if(matched===pairs.length)setTimeout(()=>doneMini(Math.max(1,6-(tries-pairs.length)),6,'language',subject),500)}else{beep(false);const f=first;first=null;setTimeout(()=>{b.classList.remove('selected');f.classList.remove('selected')},450)}})
}

/* Progress */
function renderProgress(){
 resetDaily();const p=el('profile');p.innerHTML=`<div class="statline"><span>Rang</span><b>${rank()}</b></div><div class="statline"><span>Niveau</span><b>${level()}</b></div><div class="statline"><span>XP</span><b>${S.xp}</b></div><div class="statline"><span>Jetons</span><b>${S.coins}</b></div><div class="statline"><span>Réussite globale</span><b>${mastery()}%</b></div><div class="statline"><span>Meilleure série</span><b>${S.bestStreak}</b></div>`;
 const missions=[
  ['Répondre à 10 questions',S.daily.answered,10],
  ['Réussir 5 questions de maths',S.daily.mathCorrect,5],
  ['Jouer à 1 mini-jeu de langue',S.daily.languageGames,1]
 ];
 el('daily').innerHTML=missions.map(m=>`<div class="mission ${m[1]>=m[2]?'done':''}"><b>${m[1]>=m[2]?'✅':'🎯'} ${m[0]}</b><br><small>${Math.min(m[1],m[2])}/${m[2]}</small></div>`).join('');
 const badges=[
  ['🔥 Série parfaite','10 bonnes réponses de suite',S.bestStreak>=10],
  ['🧮 Calculateur','50 bonnes réponses en maths',(S.subject['Mathématiques']?.correct||0)>=50],
  ['🌍 Globe-trotter','20 bonnes réponses en géographie',(S.subject['Géographie']?.correct||0)>=20],
  ['📚 Bibliothécaire','20 bonnes réponses en français',(S.subject['Français']?.correct||0)>=20],
  ['🕹️ Joueur du Campus','10 mini-jeux joués',S.miniPlayed>=10],
  ['👑 Incollable','500 bonnes réponses',S.correct>=500]
 ];
 el('badges').innerHTML=badges.map(b=>`<div class="badge ${b[2]?'':'locked'}"><b>${b[0]}</b><br><small>${b[1]}</small></div>`).join('');
 const sp=el('subjectProgress');sp.innerHTML='';Object.keys(SUBJECTS).forEach(s=>{const st=S.subject[s]||{answered:0,correct:0},pct=st.answered?Math.round(st.correct/st.answered*100):0;sp.innerHTML+=`<div class="statline"><span>${SUBJECTS[s].icon} ${s}</span><b>${st.answered?pct+'%':'—'}</b></div>`});
 const errs=Object.entries(S.errors).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]).slice(0,10);el('errorProgress').innerHTML=errs.length?errs.map(([id,n])=>{const q=Q.find(x=>x.id===id);return q?`<div class="statline"><span>${SUBJECTS[q.subject].icon} ${q.prompt}</span><b>${n}×</b></div>`:''}).join(''):'<p class="muted">Aucune notion en difficulté 🎉</p>';
}
el('resetState').addEventListener('click',()=>{if(confirm('Effacer toute la progression, les achats et l’avatar ?')){S=clone(DEFAULT);resetDaily();save();renderShop();renderProgress();toast('Sauvegarde réinitialisée')}});

/* Installation PWA */
let deferred=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;el('installCard').classList.add('show');el('installShortcut').style.display='block'});
async function install(){if(deferred){deferred.prompt();await deferred.userChoice;deferred=null;el('installCard').classList.remove('show');el('installShortcut').style.display='none'}else toast('Dans Chrome : menu ⋮ → Ajouter à l’écran d’accueil')}
el('installBtn').addEventListener('click',install);el('installShortcut').addEventListener('click',()=>{show('progress');setTimeout(install,100)});
if('serviceWorker' in navigator && location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});

/* init */
renderSubjects();renderArcade();renderShop();renderInventory();refreshHUD();resizeCampus();requestAnimationFrame(drawCampus);requestAnimationFrame(tick);
})();
