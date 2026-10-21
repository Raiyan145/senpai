import './style.css';
import * as THREE from 'three';

const canvas=document.querySelector('#scene');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
const scene=new THREE.Scene();scene.background=new THREE.Color('#c5a2c8');scene.fog=new THREE.FogExp2('#9a9ac1',.012);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,260);camera.position.set(0,5.5,10);
const hemi=new THREE.HemisphereLight(0xc8e4ff,0x463448,2.0);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffd7bc,3.2);sun.position.set(-12,22,9);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-18;sun.shadow.camera.right=18;sun.shadow.camera.top=25;sun.shadow.camera.bottom=-25;scene.add(sun);
const fill=new THREE.PointLight(0x69baff,28,50);fill.position.set(5,6,-18);scene.add(fill);
const mat=(color,roughness=.82,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const mats={stone:mat('#5e586f'),edge:mat('#c5a8a1'),dark:mat('#28263f'),leaf:mat('#315d5b'),leaf2:mat('#557c69'),pink:mat('#fa9dca'),pink2:mat('#ffc6e3'),gold:mat('#ffd66b',.3,.6),water: new THREE.MeshStandardMaterial({color:'#55c8ee',roughness:.22,metalness:.12,transparent:true,opacity:.8}),wood:mat('#75505b'),white:mat('#fff0f7'),blue:mat('#159bd2'),jeans:mat('#8bbde3'),skin:mat('#f3c5b6'),hair:mat('#1b2139'),dress:mat('#df4d8b')};
const boxGeo=new THREE.BoxGeometry(1,1,1),sphereGeo=new THREE.SphereGeometry(1,16,12),cylGeo=new THREE.CylinderGeometry(1,1,1,10);
function mesh(geo,material,parent,x=0,y=0,z=0){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function box(parent,material,x,y,z,sx,sy,sz){const m=mesh(boxGeo,material,parent,x,y,z);m.scale.set(sx,sy,sz);return m}
function sphere(parent,material,x,y,z,sx,sy=sx,sz=sx){const m=mesh(sphereGeo,material,parent,x,y,z);m.scale.set(sx,sy,sz);return m}
function group(parent,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g}
function makeTree(x,z,blossom=false,scale=1){const g=group(scene,x,0,z);let trunk=mesh(new THREE.CylinderGeometry(.12,.25,2.5,7),mats.wood,g,0,1.25,0);trunk.scale.setScalar(scale);for(let i=0;i<6;i++){let a=i*Math.PI*2/6;let b=sphere(g,blossom?(i%2?mats.pink:mats.pink2):(i%2?mats.leaf:mats.leaf2),Math.cos(a)*.8,2.4+Math.sin(i*2)*.22,Math.sin(a)*.7,.72*scale,.55*scale,.65*scale);b.castShadow=false}return g}
function makePagoda(x,z,scale=1){const g=group(scene,x,0,z);box(g,mats.dark,0,1.6,0,2.8*scale,3.2*scale,2.3*scale);for(let i=0;i<3;i++){const y=(2.2+i*1.15)*scale,w=(3.8-i*.7)*scale;let roof=mesh(new THREE.ConeGeometry(w*.72,.55*scale,4),mat(i===1?'#594765':'#38344f'),g,0,y,0);roof.rotation.y=Math.PI/4;roof.scale.z=.78;box(g,mats.edge,0,y-.3*scale,0,w,.09*scale,w*.72)}const tip=mesh(new THREE.ConeGeometry(.18*scale,.8*scale,6),mats.gold,g,0,5.8*scale,0);return g}
const worldGroups=[];
function makeWorld(index){const root=group(scene);worldGroups.push(root);const pal=[
 {sky:'#f2a7a7',fog:'#a9a1c5',ground:'#4d655a',road:'#565064',edge:'#c7a4a6',leaf:true},
 {sky:'#e8a8ce',fog:'#b5a0c9',ground:'#65516b',road:'#5d526d',edge:'#e9a4c8',leaf:true},
 {sky:'#90c8df',fog:'#91b4c9',ground:'#526d7c',road:'#555f75',edge:'#bacbd9',leaf:false},
 {sky:'#222747',fog:'#55547c',ground:'#283c52',road:'#34384f',edge:'#7883b5',leaf:false}
 ][index];root.userData.palette=pal;
 // ground and long road segment
 const ground=mesh(new THREE.PlaneGeometry(90,190),mat(pal.ground),root,0,-.22,-70);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;
 const road=mesh(new THREE.PlaneGeometry(10.5,190),mat(pal.road),root,0,-.08,-70);road.rotation.x=-Math.PI/2;road.receiveShadow=true;
 for(let side of [-1,1]){box(root,mat(pal.edge),side*5.35,.02,-70,.35,.25,190);for(let i=0;i<22;i++){let z=14-i*8.2;makeTree(side*(8.5+(i%3)*2),z,pal.leaf,1+(i%4)*.12)}}
 for(let z=10;z>-180;z-=23){makePagoda(Math.sin(z*.12)*14,z,.55+Math.abs(Math.sin(z))*.25);if(index===1){for(let side of [-1,1]){const lantern=box(root,mat('#d59b74'),side*4.2,1.2,z, .3,1.5,.3);sphere(root,mat('#ffd8a1',.25),side*4.2,2,z,.22,.28,.22)}}}
 // decorative waterfalls on far sides
 if(index===2||index===3){for(let side of [-1,1]){box(root,mats.water,side*18,3,-50,2,7,5);box(root,mats.water,side*18,1,-43,1.2,2,9)}}
 root.visible=index===0;return root}
for(let i=0;i<4;i++)makeWorld(i);
const roadDecor=group(scene);
for(let z=4;z>-160;z-=4){for(let lane of [-1,0,1]){const line=box(roadDecor,mat('#ffffff55'),lane*1.75,-.055,z,.035,.02,1.5);line.castShadow=false}}
function createCharacter(isKiki=false){const root=group(scene);root.userData.isKiki=isKiki;const body=group(root,0,0,0);root.userData.body=body;
 // legs and arms pivot groups
 const legs=[];for(let side of [-1,1]){const leg=group(body,side*.22,.95,0);box(leg,isKiki?mats.dress:mats.jeans,0,-.38,0,.25,.78,.28);sphere(leg,isKiki?mats.dress:mats.jeans,0,-.74,0,.14,.16,.16);box(leg,isKiki?mats.dress:mats.white,0,-.78,.14,.3,.12,.42);legs.push(leg)}
 const torso=box(body,isKiki?mats.dress:mats.blue,0,1.55,0,isKiki?.85:.7,.9,.42);if(!isKiki){box(body,mats.blue,0,1.92,-.02,.82,.25,.45);box(body,mats.white,-.12,1.87,.23,.035,.28,.025);box(body,mats.white,.12,1.87,.23,.035,.28,.025)}
 else {box(body,mats.white,0,1.83,.22,.55,.22,.08);const skirt=mesh(new THREE.ConeGeometry(.72,.85,8),mats.dress,body,0,1.12,0);skirt.scale.z=.7}
 const arms=[];for(let side of [-1,1]){const arm=group(body,side*(isKiki?.51:.44),1.78,0);box(arm,isKiki?mats.skin:mats.blue,side*.12,-.28,0,.22,.62,.24);sphere(arm,mats.skin,side*.12,-.62,.02,.15,.13,.15);arms.push(arm)}
 box(body,mats.skin,0,2.1,0,.22,.24,.22);sphere(body,mats.skin,0,2.43,0,.36,.4,.34);
 // hair cap and bangs
 sphere(body,mats.hair,0,2.63,-.02,.39,.29,.37);for(let i=0;i<5;i++){const bang=mesh(new THREE.ConeGeometry(.13,.34,5),isKiki?mat(i%2?'#293354':'#242238'):mats.hair,body,(i-2)*.13,2.48,.28);bang.rotation.z=(i-2)*-.18}
 if(isKiki){for(let side of [-1,1]){const hair=mesh(new THREE.ConeGeometry(.16,1.1,6),mats.hair,body,side*.36,1.95,-.08);hair.rotation.z=side*.1;box(body,mats.pink,side*.25,2.84,0,.12,.08,.12)}}
 // eyes
 for(let side of [-1,1])sphere(body,isKiki?mat('#b64e86'):mat('#267ac0'),side*.13,2.43,.3,.055,.07,.025);
 root.userData.legs=legs;root.userData.arms=arms;root.userData.materials={};return root}
const senpai=createCharacter(false);senpai.position.set(0,0,3.2);scene.add(senpai);
const kiki=createCharacter(true);kiki.scale.setScalar(.88);kiki.position.set(0,0,7);scene.add(kiki);
function nameSprite(text,color){const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle='#11182bcc';x.strokeStyle='#ffffff99';x.lineWidth=5;roundRect(x,12,12,488,104,24);x.fill();x.stroke();x.font='900 48px Nunito, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillStyle=color;x.fillText(text,256,64);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));s.scale.set(2.4,.6,1);return s}
function roundRect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
const senpaiTag=nameSprite('SENPAI','#9fe6ff'),kikiTag=nameSprite('KIKI ♥','#ff9dcb');scene.add(senpaiTag,kikiTag);
const obstacleGroup=group(scene),coinGroup=group(scene);let obstacles=[],coinObjects=[],particles=[];
function makeObstacle(type,lane,z){const g=group(obstacleGroup,lane*2.65,0,z);if(type==='block'){box(g,mat('#9b6a50'),0,.65,0,1.2,1.3,.9);box(g,mat('#d0a078'),0,1.25,0,1.28,.12,.98)}else if(type==='bar'){box(g,mat('#75485e'),0,1.85,0,2.4,.18,.25);for(let x of [-1,1])box(g,mat('#dba4c1'),x*1.1,1.05,0,.12,1.7,.2)}else if(type==='gap'){const gmat=mat('#151a2d');box(g,gmat,0,-.13,0,2.4,.15,2.1);for(let x of [-1,1])box(g,mat('#b5a1a0'),x*1.3,0,0,.13,.2,2.1)}else{const log=mesh(new THREE.CylinderGeometry(.25,.32,2.2,8),mat('#7b4f44'),g,0,1.25,0);log.rotation.z=Math.PI/2;g.userData.swing=true}
g.userData.type=type;g.userData.lane=lane;g.userData.hit=false;g.userData.z0=z;obstacles.push(g);return g}
function makeCoin(lane,z){const g=group(coinGroup,lane*2.65,1.15,z);const coin=mesh(new THREE.TorusGeometry(.28,.09,8,18),mats.gold,g);coin.rotation.y=Math.PI/2;const inner=mesh(new THREE.TorusGeometry(.14,.035,6,14),mat('#fff0a6',.3,.3),g);inner.rotation.y=Math.PI/2;g.userData.hit=false;coinObjects.push(g)}
function clearObjects(){for(const o of obstacles)obstacleGroup.remove(o);for(const c of coinObjects)coinGroup.remove(c);obstacles=[];coinObjects=[]}
let state='menu',lane=0,laneVisual=0,jumpT=0,slideT=0,runTime=0,distance=0,coins=0,chase=0.22,speed=13,spawnClock=0,worldIndex=0,worldDistance=0,mode='endless',lastTime=0,soundOn=true,audio=null,dialogTimer=0;
const $=s=>document.querySelector(s);
function beep(freq=440,duration=.1,wave='sine',volume=.035){if(!soundOn)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.type=wave;o.frequency.value=freq;g.gain.value=volume;g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration)}catch{}}
function say(who,text){$('#speaker').textContent=who;$('#dialogue-text').textContent=text;$('#dialogue').classList.remove('hidden');dialogTimer=3.8;beep(who==='KIKI'?630:280,.14,'triangle')}
function showWorld(){const names=['ANCIENT JUNGLE','BLOSSOM GARDEN','SKY RUINS','MOONLIT TEMPLE'];$('#world-label').textContent=names[worldIndex];$('#world-label').classList.remove('hidden')}
function setWorld(i){worldIndex=i%4;worldGroups.forEach((g,n)=>g.visible=n===worldIndex);const p=worldGroups[worldIndex].userData.palette;scene.background.set(p.sky);scene.fog.color.set(p.fog);scene.fog.density=worldIndex===3?.018:.011;showWorld();say('WORLD',`Entering ${$('#world-label').textContent.toLowerCase()}.`)}
function start(){mode=$('#mode').value;state='playing';lane=0;laneVisual=0;jumpT=0;slideT=0;runTime=0;distance=0;coins=0;chase=.22;speed=13;spawnClock=.7;worldDistance=0;lastTime=0;clearObjects();$('#distance').textContent='0';$('#coins').textContent='0';$('#chase-fill').style.width='22%';$('#menu').classList.add('hidden');$('#pause-menu').classList.add('hidden');$('#gameover').classList.add('hidden');$('#hud').classList.remove('hidden');$('#chase').classList.remove('hidden');$('#touch').classList.remove('hidden');$('#world-label').classList.remove('hidden');setWorld(0);say('KIKI',"I wanna marry you! Don't run!");beep(580,.16,'triangle');}
function pause(){if(state!=='playing')return;state='paused';$('#pause-menu').classList.remove('hidden')}
function resume(){if(state!=='paused')return;state='playing';lastTime=0;$('#pause-menu').classList.add('hidden')}
function endGame(){state='over';$('#hud').classList.add('hidden');$('#chase').classList.add('hidden');$('#touch').classList.add('hidden');$('#world-label').classList.add('hidden');$('#gameover').classList.remove('hidden');$('#final-distance').textContent=Math.floor(distance);$('#final-coins').textContent=coins;$('#end-dialogue').textContent="“You're not running away anymore. I'm going to marry you now!”";beep(145,.32,'sawtooth',.05);localStorage.setItem('senpaiBest',Math.max(Number(localStorage.getItem('senpaiBest')||0),Math.floor(distance)))}
function act(a){if(state!=='playing')return;if(a==='left'){lane=Math.max(-1,lane-1);beep(320)}if(a==='right'){lane=Math.min(1,lane+1);beep(390)}if(a==='jump'&&jumpT<=0&&slideT<=0){jumpT=1;beep(540,.1,'triangle')}if(a==='slide'){slideT=.8;beep(220,.1,'triangle')}}
document.querySelectorAll('[data-move]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();act(b.dataset.move)}));
$('#start').onclick=start;$('#pause').onclick=pause;$('#resume').onclick=resume;$('#restart-pause').onclick=start;$('#again').onclick=start;$('#quit').onclick=()=>{state='menu';$('#pause-menu').classList.add('hidden');$('#hud').classList.add('hidden');$('#chase').classList.add('hidden');$('#touch').classList.add('hidden');$('#menu').classList.remove('hidden')};$('#home').onclick=()=>{state='menu';$('#gameover').classList.add('hidden');$('#menu').classList.remove('hidden')};$('#skip-dialogue').onclick=()=>$('#dialogue').classList.add('hidden');$('#sound').onclick=()=>{soundOn=!soundOn;$('#sound').textContent=soundOn?'♫':'🔇';if(soundOn)beep(500)};
window.addEventListener('keydown',e=>{const map={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'jump',w:'jump',' ':'jump',ArrowDown:'slide',s:'slide'};if(map[e.key]){e.preventDefault();act(map[e.key])}if(e.key==='Escape'){state==='playing'?pause():state==='paused'?resume():null}});
let tx=0,ty=0;canvas.addEventListener('touchstart',e=>{tx=e.changedTouches[0].clientX;ty=e.changedTouches[0].clientY},{passive:true});canvas.addEventListener('touchend',e=>{if(state!=='playing')return;const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;if(Math.max(Math.abs(dx),Math.abs(dy))>25){if(Math.abs(dx)>Math.abs(dy))act(dx>0?'right':'left');else act(dy<0?'jump':'slide')}},{passive:true});
function spawn(){const lanePick=[-1,0,1][Math.floor(Math.random()*3)],r=Math.random();if(r<.32){for(let i=0;i<5;i++)makeCoin(lanePick,-35-i*2.2)}else{const type=r<.55?'block':r<.75?'bar':r<.9?'gap':'swing';makeObstacle(type,lanePick,-48);if(Math.random()<.5)for(let i=0;i<3;i++)makeCoin([-1,0,1].filter(x=>x!==lanePick)[Math.floor(Math.random()*2)],-42-i*2.3)}}
function collision(){const playerZ=3.2;for(const o of obstacles){if(o.userData.hit)continue;const dz=Math.abs(o.position.z-playerZ);if(dz<1.5&&o.userData.lane===lane){const type=o.userData.type;let safe=(type==='bar'&&slideT>.2)||(type==='gap'&&jumpT>.35);if(!safe){o.userData.hit=true;chase=Math.min(1,chase+.22);distance=Math.max(0,distance-5);say('SENPAI','Whoa!');beep(120,.18,'sawtooth',.05)}else o.userData.hit=true}}
for(const c of coinObjects){if(c.userData.hit)continue;if(Math.abs(c.position.z-playerZ)<1.3&&Math.round(c.position.x/2.65)===lane&&jumpT<.9){c.userData.hit=true;coins++;$('#coins').textContent=coins;beep(850,.06,'sine',.025)}}
}
function update(dt){runTime+=dt;if(state==='playing'){speed=Math.min(28,13+distance*.002);distance+=dt*speed*.65;worldDistance+=dt*speed;spawnClock-=dt;if(spawnClock<=0){spawn();spawnClock=Math.max(.65,1.35-speed*.018)}if(worldDistance>190){worldDistance=0;setWorld(worldIndex+1)}laneVisual=THREE.MathUtils.damp(laneVisual,lane,12,dt);senpai.position.x=THREE.MathUtils.damp(senpai.position.x,laneVisual*2.65,10,dt);jumpT=Math.max(0,jumpT-dt*1.35);slideT=Math.max(0,slideT-dt*1.15);chase=Math.max(.12,chase-dt*.009);
for(const o of obstacles){o.position.z+=speed*dt;if(o.userData.swing)o.rotation.z=Math.sin(runTime*4+o.position.z)*.3}
for(const c of coinObjects){c.position.z+=speed*dt;c.rotation.y+=dt*4}
collision();obstacles=obstacles.filter(o=>{if(o.position.z>12){obstacleGroup.remove(o);return false}return true});coinObjects=coinObjects.filter(c=>{if(c.position.z>12||c.userData.hit){coinGroup.remove(c);return false}return true});
if(chase>=.96){endGame()}$('#distance').textContent=Math.floor(distance);$('#chase-value').textContent=Math.floor(chase*100)+'%';$('#chase-fill').style.width=Math.floor(chase*100)+'%';if(mode==='missions'&&Math.floor(distance)%300<speed*dt*.65) say('MISSION','Keep running and avoid the traps!');if(mode==='daily'&&coins>=20)say('DAILY','Challenge complete: 20 coins!');}
if(dialogTimer>0){dialogTimer-=dt;if(dialogTimer<=0)$('#dialogue').classList.add('hidden')}}
function animateCharacter(ch,phase,sliding=false,jump=0){const swing=Math.sin(phase*11);ch.userData.legs.forEach((l,i)=>{l.rotation.x=sliding?-.9:swing*(i===0?1:-1)*.65});ch.userData.arms.forEach((a,i)=>{a.rotation.x=sliding?-.4:-swing*(i===0?1:-1)*.5});ch.userData.body.position.y=jump>0?Math.sin((1-jump)*Math.PI)*1.6:0;ch.userData.body.rotation.x=sliding?.45:0}
function render(t){const dt=Math.min(.05,t/1000||0);if(state==='playing'){animateCharacter(senpai,runTime,slideT>0,jumpT);animateCharacter(kiki,runTime*1.05);kiki.position.x=THREE.MathUtils.damp(kiki.position.x,senpai.position.x*.45,2,dt);kiki.position.z=7+Math.sin(runTime*2)*.25}else{animateCharacter(senpai,runTime*.25);animateCharacter(kiki,runTime*.25)}
senpaiTag.position.set(senpai.position.x,3.6+senpai.userData.body.position.y,senpai.position.z);kikiTag.position.set(kiki.position.x,3.45,kiki.position.z);
camera.position.x=THREE.MathUtils.damp(camera.position.x,senpai.position.x*.28,3,Math.min(.05,dt));camera.lookAt(senpai.position.x*.22,1.7,-7);
for(let i=0;i<worldGroups.length;i++)if(worldGroups[i].visible){worldGroups[i].position.z=0}
renderer.render(scene,camera)}
let prev=performance.now();function loop(now){requestAnimationFrame(loop);const dt=Math.min(.04,(now-prev)/1000);prev=now;if(state==='playing')update(dt);else if(dialogTimer>0)update(dt);render(now)}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7)});
$('#loading').classList.add('hidden');requestAnimationFrame(loop);
