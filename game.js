(() => {
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);
const menu=$('menu'),hud=$('hud'),pauseScreen=$('pause'),overScreen=$('gameover');
let W=innerWidth,H=innerHeight,dpr=1,raf,last=0,active=false,paused=false,ended=false;
let lane=0,playerX=0,jump=0,sliding=0,runT=0,speed=0.34,distance=0,coins=0,chase=0.22,world=0,worldProgress=0,objects=[],spawnTimer=0,score=0,mode='endless',soundOn=true;
let toastTimer=0,dialogTimer=0,dialogQueue=[],audioCtx=null;
const worlds=[
 {name:'ANCIENT JUNGLE',sky:['#152b39','#5d9b69'],leaf:'#285944',road:'#5c5b60',edge:'#9a8e79',accent:'#ffdb8b'},
 {name:'BLOSSOM GARDEN',sky:['#30234c','#eaa2c7'],leaf:'#b85b91',road:'#656078',edge:'#d6b5cb',accent:'#ffe8a5'},
 {name:'SKY RUINS',sky:['#17374f','#9bd2df'],leaf:'#4b8c9b',road:'#656d7d',edge:'#c4d0d8',accent:'#fff1b5'},
 {name:'MOONLIT TEMPLE',sky:['#101b3a','#484f87'],leaf:'#273d5e',road:'#45485d',edge:'#7d8bb2',accent:'#93e8ff'}
];
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',resize);resize();
function rnd(a,b){return a+Math.random()*(b-a)}
function beep(freq=440,dur=.08,type='sine',vol=.04){if(!soundOn)return;try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();let o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.value=vol;g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur)}catch(e){}}
function speak(text,who='KIKI'){ $('speaker').textContent=who; $('line').textContent=text;$('dialogue').classList.remove('hidden');dialogTimer=3.2;beep(who==='KIKI'?620:270,.16,'triangle',.025)}
function notify(t){$('toast').textContent=t;toastTimer=1.4}
function reset(){lane=0;playerX=0;jump=0;sliding=0;runT=0;speed=.34;distance=0;coins=0;chase=.22;world=0;worldProgress=0;objects=[];spawnTimer=.6;score=0;ended=false;paused=false;last=0;$('distance').textContent='0';$('coins').textContent='0';$('chaseMeter').style.width='22%';}
function start(){mode=$('mode').value;reset();active=true;menu.classList.add('hidden');pauseScreen.classList.add('hidden');overScreen.classList.add('hidden');hud.classList.remove('hidden');speak("I wanna marry you! Don't run!",'KIKI');notify(worlds[0].name);beep(600,.15,'triangle');}
function pause(){if(!active||ended)return;paused=true;active=false;pauseScreen.classList.remove('hidden')}
function resume(){paused=false;active=true;pauseScreen.classList.add('hidden');last=0;requestAnimationFrame(loop)}
function gameOver(){if(ended)return;ended=true;active=false;hud.classList.add('hidden');overScreen.classList.remove('hidden');$('finalDistance').textContent=Math.floor(distance);$('finalCoins').textContent=coins;$('endTitle').textContent='Kiki caught Senpai!';$('endLine').textContent="“You're not running away anymore. I'm going to marry you now!”";beep(160,.35,'sawtooth',.04)}
function action(a){if(!active||paused)return;
 if(a==='left'){if(lane>-1)lane--;else notify('Careful at the edge!');beep(330)}
 if(a==='right'){if(lane<1)lane++;else notify('Careful at the edge!');beep(380)}
 if(a==='jump'&&jump<=0&&sliding<=0){jump=1;beep(520,.12,'triangle')}
 if(a==='slide'){sliding=.75;beep(220,.12,'triangle')}
}
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();action(b.dataset.action)}));
$('startBtn').onclick=start;$('resumeBtn').onclick=resume;$('pauseBtn').onclick=pause;$('quitBtn').onclick=()=>{active=false;paused=false;hud.classList.add('hidden');pauseScreen.classList.add('hidden');menu.classList.remove('hidden')};$('againBtn').onclick=start;$('homeBtn').onclick=()=>{overScreen.classList.add('hidden');menu.classList.remove('hidden')};
$('soundToggle').onclick=()=>{soundOn=!soundOn;$('soundToggle').textContent=soundOn?'🔊':'🔇';if(soundOn)beep(500)};
addEventListener('keydown',e=>{let map={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'jump',w:'jump',' ':'jump',ArrowDown:'slide',s:'slide'};if(map[e.key]){e.preventDefault();action(map[e.key])}if(e.key==='Escape'&&active)pause();else if(e.key==='Escape'&&paused)resume()});
let touchX=0,touchY=0;
canvas.addEventListener('touchstart',e=>{touchX=e.changedTouches[0].clientX;touchY=e.changedTouches[0].clientY},{passive:true});
canvas.addEventListener('touchend',e=>{if(!active)return;let dx=e.changedTouches[0].clientX-touchX,dy=e.changedTouches[0].clientY-touchY;if(Math.max(Math.abs(dx),Math.abs(dy))>25){if(Math.abs(dx)>Math.abs(dy))action(dx>0?'right':'left');else action(dy<0?'jump':'slide')}},{passive:true});
function pathAt(t){let horizon=H*.28,base=H*.9;let z=Math.max(0,Math.min(1,t));let y=horizon+(base-horizon)*z;let half= W*(.055+.36*z);let curve=Math.sin(worldProgress*.008+z*2.2)*W*.12*z;return {y,half,cx:W/2+curve}}
function poly(points,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let p of points.slice(1))ctx.lineTo(p[0],p[1]);ctx.closePath();ctx.fill()}
function drawBackground(w){let g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,w.sky[0]);g.addColorStop(1,w.sky[1]);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 // moon/sun
 ctx.globalAlpha=.7;ctx.fillStyle=w.accent;ctx.beginPath();ctx.arc(W*.78,H*.13,Math.min(W,H)*.045,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
 // distant hills / temple silhouettes
 for(let i=0;i<6;i++){let x=(i*W/4.2-(worldProgress*.12)% (W/4.2));ctx.fillStyle=i%2?w.leaf:'#1b3147';poly([[x-100,H*.43],[x+40,H*.22+rnd(0,0)],[x+150,H*.44]],ctx.fillStyle)}
 // trees / blossom lamps
 for(let side of [-1,1])for(let i=0;i<8;i++){let z=((i/8+runT*.09)%1),p=pathAt(z),x=p.cx+side*(p.half+20+z*W*.13),y=p.y;let s=8+z*42;ctx.fillStyle=w.leaf;ctx.fillRect(x-s*.12,y-s*.8,s*.24,s*.85);ctx.beginPath();ctx.ellipse(x,y-s*.8,s*.52,s*.48,0,0,Math.PI*2);ctx.fill();if(world===1){ctx.fillStyle='#ffc2df';ctx.beginPath();ctx.arc(x-s*.2,y-s*.9,s*.2,0,Math.PI*2);ctx.arc(x+s*.2,y-s*.78,s*.18,0,Math.PI*2);ctx.fill()}}
}
function drawRoad(){let w=worlds[world],steps=30;for(let i=0;i<steps;i++){let z=i/steps,z2=(i+1)/steps,p=pathAt(z),q=pathAt(z2);poly([[p.cx-p.half,p.y],[p.cx+p.half,p.y],[q.cx+q.half,q.y],[q.cx-q.half,q.y]],Math.floor((i+Math.floor(runT*7))%2)?w.road:'#55545f');poly([[p.cx-p.half,p.y],[p.cx-p.half+Math.max(1,W*.004*z),p.y],[q.cx-q.half+Math.max(1,W*.004*z2),q.y],[q.cx-q.half,q.y]],w.edge);poly([[p.cx+p.half,p.y],[p.cx+p.half-Math.max(1,W*.004*z),p.y],[q.cx+q.half-Math.max(1,W*.004*z2),q.y],[q.cx+q.half,q.y]],w.edge);
 for(let l of [-1/3,1/3])if(i%2===0){let x1=p.cx+p.half*l,x2=q.cx+q.half*l;ctx.strokeStyle='#ffffff70';ctx.lineWidth=1+z*2;ctx.beginPath();ctx.moveTo(x1,p.y);ctx.lineTo(x2,q.y);ctx.stroke()}}
 // road glints
}
function lanePos(l,z){let p=pathAt(z);return p.cx+l*p.half*.58}
function drawPerson(x,y,scale,isGirl,pose=0){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
 // shadow
 ctx.fillStyle='#07101c75';ctx.beginPath();ctx.ellipse(0,0,22,7,0,0,Math.PI*2);ctx.fill();
 // legs
 let swing=Math.sin(runT*13+pose)*8;
 ctx.lineCap='round';ctx.lineWidth=9;ctx.strokeStyle=isGirl?'#f3dce9':'#a9d7f0';
 ctx.beginPath();ctx.moveTo(-7,-20);ctx.lineTo(-9+swing,-5);ctx.lineTo(-10+swing,0);ctx.stroke();
 ctx.beginPath();ctx.moveTo(7,-20);ctx.lineTo(9-swing,-7);ctx.lineTo(12-swing,0);ctx.stroke();
 // shoes
 ctx.fillStyle=isGirl?'#d83468':'#f8fbff';ctx.fillRect(-17+swing,-4,13,5);ctx.fillRect(5-swing,-4,14,5);
 // body and clothes
 ctx.fillStyle=isGirl?'#f7b1d0':'#1398d2';ctx.beginPath();ctx.moveTo(-13,-59);ctx.quadraticCurveTo(-20,-42,-13,-23);ctx.lineTo(13,-23);ctx.quadraticCurveTo(20,-43,13,-59);ctx.closePath();ctx.fill();
 if(isGirl){ctx.fillStyle='#df4c8a';poly([[-13,-51],[13,-51],[23,-20],[-21,-20]],'#df4c8a');ctx.fillStyle='#ffe7f2';ctx.fillRect(-12,-60,24,9);ctx.strokeStyle='#ffe7f2';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-14,-54);ctx.lineTo(-22,-43);ctx.moveTo(14,-54);ctx.lineTo(22,-43);ctx.stroke()}
 else {ctx.fillStyle='#0871ad';ctx.fillRect(-12,-58,24,28);ctx.strokeStyle='#e5f7ff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-3,-55);ctx.lineTo(-3,-45);ctx.moveTo(3,-55);ctx.lineTo(3,-45);ctx.stroke()}
 // arms
 ctx.strokeStyle=isGirl?'#f4c5d8':'#f2c7a8';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-12,-54);ctx.lineTo(-23,-40+Math.sin(runT*10)*4);ctx.moveTo(12,-54);ctx.lineTo(23,-42-Math.sin(runT*10)*4);ctx.stroke();
 // neck and face
 ctx.fillStyle='#f4c9b8';ctx.fillRect(-5,-69,10,13);ctx.fillStyle='#ffe0d2';ctx.beginPath();ctx.ellipse(0,-78,14,16,0,0,Math.PI*2);ctx.fill();
 // hair
 ctx.fillStyle=isGirl?'#202139':'#14253e';ctx.beginPath();ctx.arc(0,-83,15,Math.PI,Math.PI*2);ctx.lineTo(15,-78);ctx.lineTo(8,-89);ctx.lineTo(1,-82);ctx.lineTo(-5,-91);ctx.lineTo(-14,-78);ctx.closePath();ctx.fill();
 if(isGirl){ctx.fillStyle='#52618e';ctx.beginPath();ctx.moveTo(7,-90);ctx.quadraticCurveTo(22,-67,15,-45);ctx.lineTo(10,-52);ctx.lineTo(10,-80);ctx.fill()}
 // eyes
 ctx.fillStyle=isGirl?'#8c3d6d':'#2674ad';ctx.fillRect(-8,-80,4,2);ctx.fillRect(4,-80,4,2);
 ctx.restore()}
function drawObjects(){for(let o of objects){let p=pathAt(o.z),x=lanePos(o.lane,o.z),y=p.y,s=.25+o.z*1.1;
 if(o.type==='coin'){ctx.fillStyle='#ffda62';ctx.strokeStyle='#fff2a5';ctx.lineWidth=2*s;ctx.beginPath();ctx.ellipse(x,y-20*s,8*s,11*s,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#b57b21';ctx.font=`bold ${10*s}px sans-serif`;ctx.textAlign='center';ctx.fillText('$',x,y-16*s)}
 else if(o.type==='block'){ctx.fillStyle='#5a392f';ctx.fillRect(x-17*s,y-30*s,34*s,30*s);ctx.fillStyle='#9b6b50';ctx.fillRect(x-14*s,y-27*s,28*s,5*s);ctx.strokeStyle='#d6ad79';ctx.lineWidth=2*s;ctx.strokeRect(x-17*s,y-30*s,34*s,30*s)}
 else if(o.type==='gap'){ctx.fillStyle='#151923';ctx.fillRect(x-25*s,y-3*s,50*s,8*s);ctx.strokeStyle='#b8a6a0';ctx.lineWidth=2*s;ctx.strokeRect(x-25*s,y-3*s,50*s,8*s)}
 else if(o.type==='bar'){ctx.fillStyle='#7b4d60';ctx.fillRect(x-25*s,y-37*s,50*s,7*s);ctx.fillStyle='#f9b5d3';ctx.fillRect(x-25*s,y-39*s,50*s,3*s)}
 }}
function render(){let w=worlds[world];drawBackground(w);drawRoad();drawObjects();
 // perspective center runner and pursuer
 let base=H*.89,scale=Math.min(W,H)/470;
 let px=W/2+playerX*W*.18;
 if(jump>0){base-=Math.sin((1-jump)*Math.PI)*H*.12}
 drawPerson(px,base,scale*.88,false);
 drawPerson(W/2+Math.sin(runT*3)*W*.008, H*.965,scale*.78,true);
 // atmospheric sparkles
 for(let i=0;i<22;i++){let x=(i*127+runT*19)%W,y=(i*71+Math.sin(runT+i)*12)%(H*.65);ctx.globalAlpha=.12;ctx.fillStyle=w.accent;ctx.fillRect(x,y,2,2)}ctx.globalAlpha=1;
 // labels follow character approximately
 $('senpai-tag').style.left=px+'px';$('senpai-tag').style.top=(base-100*scale)+'px';
 $('kiki-tag').style.left=(W/2)+'px';$('kiki-tag').style.top=(H*.965-95*scale)+'px';
}
function spawn(){let lanePick=[-1,0,1][Math.floor(Math.random()*3)];let typeRoll=Math.random();let type=typeRoll<.35?'coin':typeRoll<.57?'block':typeRoll<.77?'bar':'gap';
 if(type==='coin'){for(let i=0;i<5;i++)objects.push({type,lane:lanePick,z:.05-i*.045,hit:false})}
 else objects.push({type,lane:lanePick,z:.04,hit:false});
 // occasionally coins on other lane
 if(Math.random()<.35)for(let i=0;i<3;i++)objects.push({type:'coin',lane:[-1,0,1].filter(x=>x!==lanePick)[Math.floor(Math.random()*2)],z:.12-i*.05,hit:false});
}
function update(dt){if(!active)return;dt=Math.min(dt,.04);runT+=dt;speed=Math.min(.75,.34+distance/15000);distance+=dt*speed*45;worldProgress+=dt*speed*100;world=Math.floor(worldProgress/1500)%worlds.length;
 if(Math.floor(worldProgress/1500)!==Math.floor((worldProgress-dt*speed*100)/1500)) {notify(worlds[world].name);beep(760,.15,'sine')}
 jump=Math.max(0,jump-dt*1.65);sliding=Math.max(0,sliding-dt);
 spawnTimer-=dt;if(spawnTimer<=0){spawn();spawnTimer=Math.max(.45,rnd(1.05,1.55)-speed*.55)}
 for(let o of objects){o.z+=dt*speed*.56;if(!o.hit&&o.z>.82&&o.z<.97&&o.lane===lane){
   if(o.type==='coin'){o.hit=true;coins++;$('coins').textContent=coins;beep(850,.07,'sine',.03)}
   else if(o.type==='block'||o.type==='gap'&&jump<.5||o.type==='bar'&&sliding<.1){o.hit=true;chase=Math.min(1,chase+.19);distance=Math.max(0,distance-4);notify('Kiki is catching up!');beep(130,.18,'sawtooth',.05)}
   else if(o.type==='gap'&&jump>=.5||o.type==='bar'&&sliding>.1){o.hit=true}
 }}
 objects=objects.filter(o=>o.z<1.12&&!(o.hit&&o.type==='coin'));
 chase=Math.max(.12,chase-dt*.006);if(chase>=.96){gameOver();return}
 $('distance').textContent=Math.floor(distance);$('chaseMeter').style.width=Math.floor(chase*100)+'%';
 if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('toast').textContent=''}
 if(dialogTimer>0){dialogTimer-=dt;if(dialogTimer<=0)$('dialogue').classList.add('hidden')}
 if(mode==='missions'&&distance>0&&Math.floor(distance)%250<speed*45*dt)notify('Mission: keep running!');if(mode==='daily'&&coins>=20)notify('Daily challenge complete: 20 coins!');
}
function loop(t){if(!active)return;let dt=last?(t-last)/1000:0;last=t;update(dt);render();if(active)raf=requestAnimationFrame(loop)}
// Background animation on title screen
function idle(t){if(active||paused)return;runT+=.012;worldProgress+=.18;world=Math.floor(worldProgress/1500)%worlds.length;render();raf=requestAnimationFrame(idle)}
function kickLoop(){cancelAnimationFrame(raf);last=0;raf=requestAnimationFrame(loop)}
$('startBtn').addEventListener('click',()=>{kickLoop()});
$('resumeBtn').addEventListener('click',()=>kickLoop());
$('againBtn').addEventListener('click',()=>kickLoop());
render();raf=requestAnimationFrame(idle);
})();