
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
function drawCampus(){
 const w=canvas.clientWidth,h=canvas.clientHeight;ctx.clearRect(0,0,w,h);
 const zoom=Math.max(.62,Math.min(.88,w/900));
 const camX=Math.max(w/(2*zoom),Math.min(WORLD.w-w/(2*zoom),player.x));
 const camY=Math.max(h/(2*zoom),Math.min(WORLD.h-h/(2*zoom),player.y));
 ctx.save();ctx.translate(w/2,h/2);ctx.scale(zoom,zoom);ctx.translate(-camX,-camY);
 // lawn
 ctx.fillStyle='#82b56e';ctx.fillRect(0,0,WORLD.w,WORLD.h);
 // paths
 ctx.strokeStyle='#dec99b';ctx.lineWidth=62;ctx.lineCap='round';
 [[800,0,800,1050],[0,525,1600,525],[250,860,1350,860],[260,180,1340,180]].forEach(p=>{ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(p[2],p[3]);ctx.stroke()});
 // pond/fountain
 ctx.fillStyle='#c6b58d';ctx.beginPath();ctx.arc(800,620,105,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#62a9c5';ctx.beginPath();ctx.arc(800,620,80,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#e8edf0';ctx.beginPath();ctx.arc(800,620,25,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#78bcd5';ctx.fillRect(793,557,14,62);
 // trees
 const trees=[[55,300],[390,300],[1170,305],[1530,300],[45,680],[370,680],[1180,675],[1540,680],[310,955],[1490,950],[690,285],[930,285]];
 for(const [x,y] of trees){ctx.fillStyle='#75563b';ctx.fillRect(x-10,y,20,42);ctx.fillStyle='#397a45';ctx.beginPath();ctx.arc(x,y-12,37,0,Math.PI*2);ctx.fill();ctx.fillStyle='#4e9255';ctx.beginPath();ctx.arc(x-18,y-25,25,0,Math.PI*2);ctx.fill()}
 // buildings
 for(const b of buildings){
  const c=b.color||'#6688aa';
  ctx.fillStyle='rgba(0,0,0,.13)';ctx.fillRect(b.x+14,b.y+18,b.w,b.h);
  ctx.fillStyle=c;ctx.fillRect(b.x,b.y+38,b.w,b.h-38);
  ctx.fillStyle=shade(c,-28);ctx.beginPath();ctx.moveTo(b.x-15,b.y+38);ctx.lineTo(b.x+b.w/2,b.y-10);ctx.lineTo(b.x+b.w+15,b.y+38);ctx.closePath();ctx.fill();
  ctx.fillStyle='#dce8f0';
  for(let i=0;i<3;i++)ctx.fillRect(b.x+30+i*72,b.y+68,42,40);
  ctx.fillStyle='#3a4c60';ctx.fillRect(b.x+b.w/2-25,b.y+b.h-45,50,45);
  ctx.font='30px system-ui';ctx.textAlign='center';ctx.fillText(b.icon,b.x+b.w/2,b.y+20);
  ctx.fillStyle='#15243b';ctx.font='700 19px system-ui';ctx.fillText(b.name,b.x+b.w/2,b.y+b.h+27);
 }
 drawAvatar(ctx,player.x,player.y,1,S.avatar);
 ctx.restore();
 requestAnimationFrame(drawCampus);
}
function drawAvatar(c,x,y,scale=1,a=S.avatar){
 c.save();c.translate(x,y);
 if(a.accessory==='backpack'){c.fillStyle='#5d3f7c';c.fillRect(-25*scale,-42*scale,50*scale,58*scale)}
 c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(0,30*scale,30*scale,10*scale,0,0,Math.PI*2);c.fill();
 c.fillStyle=a.pants;c.fillRect(-20*scale,0,16*scale,35*scale);c.fillRect(4*scale,0,16*scale,35*scale);
 c.fillStyle=a.shirt;c.fillRect(-26*scale,-45*scale,52*scale,52*scale);
 c.fillStyle=a.skin;c.fillRect(-34*scale,-39*scale,10*scale,42*scale);c.fillRect(24*scale,-39*scale,10*scale,42*scale);
 c.beginPath();c.arc(0,-67*scale,27*scale,0,Math.PI*2);c.fill();
 c.fillStyle=a.hair;
 if(String(a.hairStyle)==='0'){c.beginPath();c.arc(0,-78*scale,27*scale,Math.PI,Math.PI*2);c.fill();c.fillRect(-27*scale,-78*scale,54*scale,10*scale)}
 if(String(a.hairStyle)==='1'){c.beginPath();c.arc(0,-78*scale,29*scale,Math.PI,Math.PI*2);c.fill();c.fillRect(-29*scale,-79*scale,9*scale,33*scale);c.fillRect(20*scale,-79*scale,9*scale,33*scale)}
 if(String(a.hairStyle)==='2'){for(const p of [[-18,-84],[0,-91],[19,-84],[-25,-70],[25,-70]]){c.beginPath();c.arc(p[0]*scale,p[1]*scale,13*scale,0,Math.PI*2);c.fill()}}
 c.fillStyle='#273044';c.beginPath();c.arc(-9*scale,-68*scale,2.4*scale,0,Math.PI*2);c.arc(9*scale,-68*scale,2.4*scale,0,Math.PI*2);c.fill();
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
 x.fillStyle='#dbe9f1';x.fillRect(0,0,w,250);x.fillStyle='#d4b88c';x.fillRect(0,250,w,h-250);
 x.fillStyle='#b7c7d7';x.fillRect(270,55,220,125);x.fillStyle='#9bd0ed';x.fillRect(282,67,196,101);
 x.strokeStyle='#8d7655';x.lineWidth=3;for(let i=0;i<12;i++){x.beginPath();x.moveTo(0,260+i*18);x.lineTo(w,260+i*18);x.stroke()}
 const eq=S.equipped;
 if(eq.includes('rug')){x.fillStyle='#7d62ad';x.beginPath();x.ellipse(380,360,120,55,0,0,Math.PI*2);x.fill()}
 const bed=eq.includes('bed_galaxy');x.fillStyle=bed?'#394d8c':'#f2d6a4';x.fillRect(60,250,220,105);x.fillStyle=bed?'#7184c7':'#fff4dd';x.fillRect(75,262,190,63);
 x.fillStyle='#795e48';x.fillRect(500,265,180,18);x.fillRect(515,283,15,83);x.fillRect(650,283,15,83);
 if(eq.includes('desk_modern')){x.fillStyle='#4c667e';x.fillRect(500,262,180,20)}
 if(eq.includes('plant')){x.fillStyle='#9a6c47';x.fillRect(690,300,38,45);x.fillStyle='#4e9157';for(const p of [[700,292],[716,278],[725,300]]){x.beginPath();x.arc(p[0],p[1],24,0,Math.PI*2);x.fill()}}
 if(eq.includes('bookshelf')){x.fillStyle='#805f45';x.fillRect(25,80,105,150);x.fillStyle='#f0cf57';for(let yy=105;yy<210;yy+=35){for(let xx=40;xx<115;xx+=15)x.fillRect(xx,yy,10,25)}}
 if(eq.includes('poster')){x.fillStyle='#4d79a8';x.fillRect(545,70,120,80);x.fillStyle='#9ec9e8';x.beginPath();x.arc(605,110,29,0,Math.PI*2);x.fill()}
 if(eq.includes('lamp')){x.fillStyle='#f7d65a';x.beginPath();x.arc(455,240,18,0,Math.PI*2);x.fill();x.strokeStyle='#555';x.beginPath();x.moveTo(455,258);x.lineTo(455,320);x.stroke()}
 if(eq.includes('chair')){x.fillStyle='#4e4778';x.fillRect(455,320,55,65);x.fillRect(447,375,70,16)}
 drawAvatar(x,375,350,1.25,S.avatar);renderInventory();
}
function renderStoreRoom(){renderShop();renderInventory()}
new MutationObserver(()=>{if(el('storeView').classList.contains('active'))renderShop()}).observe(el('storeView'),{attributes:true});

/* Avatar */
function loadAvatarForm(){el('skinColor').value=S.avatar.skin;el('hairColor').value=S.avatar.hair;el('shirtColor').value=S.avatar.shirt;el('pantsColor').value=S.avatar.pants;el('hairStyle').value=String(S.avatar.hairStyle);el('accessory').value=S.avatar.accessory;drawAvatarPreview()}
function drawAvatarPreview(){const c=el('avatarCanvas'),x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);x.fillStyle='#98d1ec';x.fillRect(0,0,c.width,270);x.fillStyle='#d6bd92';x.fillRect(0,270,c.width,230);drawAvatar(x,200,330,2.4,{skin:el('skinColor').value,hair:el('hairColor').value,shirt:el('shirtColor').value,pants:el('pantsColor').value,hairStyle:el('hairStyle').value,accessory:el('accessory').value})}
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
