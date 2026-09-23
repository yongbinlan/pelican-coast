import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const $=s=>document.querySelector(s), reduced=matchMedia('(prefers-reduced-motion: reduce)');
const state={playing:!reduced.matches,speed:12,sunset:false,sound:false,phase:0,distance:0,view:'coast'};
let renderer,scene,camera,controls;
try { init(); } catch(e){fail(e);}
function fail(e){$('#loading').classList.add('done');$('#error').hidden=false;$('#error-detail').textContent=e.message;console.error(e);}
function init(){
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;$('#scene').appendChild(renderer.domElement);
 scene=new THREE.Scene();scene.background=new THREE.Color('#f3f2e9');scene.fog=new THREE.Fog('#f3f2e9',26,65);
 camera=new THREE.PerspectiveCamera(36,1,.1,120);
 controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=!reduced.matches;controls.dampingFactor=.075;controls.enablePan=false;controls.minDistance=7;controls.maxDistance=24;controls.minPolarAngle=.2;controls.maxPolarAngle=Math.PI*.47;controls.target.set(0,1.6,0);
 const hemi=new THREE.HemisphereLight(0xdaf7ff,0xb4b391,2.8);scene.add(hemi);
 const sun=new THREE.DirectionalLight(0xffedcd,4);sun.position.set(-3,9,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.5,far:30});sun.shadow.normalBias=.035;sun.shadow.bias=-.0001;sun.shadow.radius=4;scene.add(sun);
 const fill=new THREE.DirectionalLight(0xbfe9ec,1.1);fill.position.set(5,4,-6);scene.add(fill);
 const mats={};const mat=(name,color,roughness=.7,metalness=0)=>mats[name]=new THREE.MeshStandardMaterial({color,roughness,metalness});
 mat('white','#fff6dd');mat('feather','#e5e6d8');mat('dark','#263c3c');mat('orange','#edaa39');mat('pouch','#e8bc65');mat('teal','#36968b',.35,.22);mat('mint','#a4d2bc');mat('silver','#c5d3c7',.3,.65);mat('tire','#2a3b3b');mat('rubber','#f0dfba');mat('brown','#9a6240');mat('sand','#e6d5a5');mat('sandSide','#c9b386');mat('grass','#a9bc91');mat('road','#778b80');mat('stripe','#ece4c8');mat('leaf','#557d5c');mat('leaf2','#84a576');mat('red','#bd634b');mat('glass','#4b878a',.25,.35);
 const v=(x,y,z)=>new THREE.Vector3(x,y,z);
 function mesh(g,m,p,parent=scene){const o=new THREE.Mesh(g,typeof m==='string'?mats[m]:m);if(p)o.position.set(...p);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function ell(p,s,m,parent=scene){const o=mesh(new THREE.SphereGeometry(1,32,20),m,p,parent);o.scale.set(...s);return o;}
 function box(p,s,m,parent=scene,r=0){const o=mesh(new THREE.BoxGeometry(...s),m,p,parent);o.rotation.y=r;return o;}
 function rod(a,b,r,m,parent=scene){a=Array.isArray(a)?v(...a):a;b=Array.isArray(b)?v(...b):b;const o=mesh(new THREE.CylinderGeometry(r,r,a.distanceTo(b),12),m,null,parent);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(v(0,1,0),b.clone().sub(a).normalize());return o;}
 function tube(points,r,m,parent=scene){const curve=new THREE.CatmullRomCurve3(points.map(p=>v(...p)));return mesh(new THREE.TubeGeometry(curve,32,r,10,false),m,null,parent);}
 function torus(p,r,t,m,parent=scene){return mesh(new THREE.TorusGeometry(r,t,12,64),m,p,parent);}
 // Original miniature coastline: softly layered island, moving road and water.
 const island=new THREE.Group();scene.add(island);
 const seaMat=new THREE.MeshStandardMaterial({color:'#86c6be',roughness:.28,metalness:.12});
 const sea=mesh(new THREE.CylinderGeometry(7.6,7.5,.24,100),seaMat,[0,-.38,0]);
 const base=mesh(new THREE.CylinderGeometry(5.8,5.6,.55,96),'sandSide',[0,-.22,0],island);base.scale.z=.71;
 const sand=mesh(new THREE.CylinderGeometry(5.82,5.78,.12,96),'sand',[0,.105,0],island);sand.scale.z=.71;
 const lawn=mesh(new THREE.CylinderGeometry(4.95,5.1,.15,96),'grass',[0,.22,-.6],island);lawn.scale.z=.58;
 const road=box([0,.26,1.12],[10.6,.09,1.62],'road',island);
 for(const z of [.34,1.9])box([0,.312,z],[10.55,.02,.045],'stripe',island);
 const dashes=[];for(let i=0;i<17;i++)dashes.push(box([-5.1+i*.65,.313,1.13],[.3,.015,.035],'stripe',island));
 // Sparse shoreline foam and stones, all seeded deterministically.
 let seed=923;function rand(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646;}
 const ripples=[];const foam=new THREE.MeshBasicMaterial({color:'#dceae0',transparent:true,opacity:.62});
 for(let i=0;i<30;i++){const a=rand()*Math.PI*2,r=6+rand()*1.2;const o=ell([Math.cos(a)*r,-.242,Math.sin(a)*r*.85],[.12+rand()*.3,.005,.018],foam);ripples.push(o);}
 for(let i=0;i<20;i++){let x=(rand()-.5)*10,z=-1.2-rand()*1.6;if(Math.abs(x)<2&&z>-1.7)continue;const rock=mesh(new THREE.DodecahedronGeometry(.15+rand()*.24,1),i%2?'sandSide':'feather',[x,.35,z],island);rock.scale.set(1,.7,.8);rock.rotation.set(rand(),rand(),rand());}
 function grass(x,z,s=1){const g=new THREE.Group();g.position.set(x,.33,z);g.scale.setScalar(s);island.add(g);for(let j=0;j<5;j++){const a=j*1.6;const leaf=ell([Math.cos(a)*.12,.25,Math.sin(a)*.12],[.045,.3,.07],j%2?'leaf':'leaf2',g);leaf.rotation.z=(j-2)*.22;}return g;}
 for(const p of [[-4.5,-.4,1.1],[-3.7,2.6,.8],[4.4,2.5,.8],[2.3,-1.7,.8],[-1.6,-2.3,1],[4.5,-1.6,1.2]])grass(...p);
 // Lighthouse with balcony rails, lantern and a coral roof.
 const lighthouse=new THREE.Group();lighthouse.position.set(3.5,.33,-1.9);island.add(lighthouse);
 mesh(new THREE.CylinderGeometry(.32,.49,2.05,40),'white',[0,1.025,0],lighthouse);
 mesh(new THREE.CylinderGeometry(.36,.39,.37,40),'red',[0,1.5,0],lighthouse);
 mesh(new THREE.CylinderGeometry(.55,.55,.12,40),'white',[0,2.1,0],lighthouse);
 mesh(new THREE.CylinderGeometry(.29,.29,.49,24),'glass',[0,2.4,0],lighthouse);
 mesh(new THREE.ConeGeometry(.52,.45,40),'red',[0,2.86,0],lighthouse);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;rod([Math.cos(a)*.47,2.12,Math.sin(a)*.47],[Math.cos(a)*.47,2.4,Math.sin(a)*.47],.016,'white',lighthouse);}
 const rail=torus([0,2.4,0],.47,.018,'white',lighthouse);rail.rotation.x=Math.PI/2;
 box([0,.35,.447],[.2,.62,.035],'brown',lighthouse);box([0,1,.35],[.13,.22,.04],'glass',lighthouse);
 ell([0,3.12,0],[.045,.06,.045],'orange',lighthouse);
 // Small coastal fence, route sign and a bench.
 for(let i=0;i<6;i++){const x=-4.7+i*.6;rod([x,.33,-1.4],[x,.97,-1.4],.05,'white',island);}rod([-4.7,.72,-1.4],[-1.7,.72,-1.4],.035,'white',island);
 rod([-3.6,.33,-.65],[-3.6,1.5,-.65],.035,'brown',island);const sign=box([-3.6,1.3,-.65],[.68,.28,.08],'teal',island);box([-3.6,1.3,-.598],[.3,.025,.01],'white',island);rod([-3.47,1.3,-.58],[-3.56,1.37,-.58],.012,'white',island);rod([-3.47,1.3,-.58],[-3.56,1.23,-.58],.012,'white',island);
 // Bicycle, local forward +X. Both wheel groups rotate around their own axle.
 const rider=new THREE.Group();rider.position.set(0,.31,1.05);scene.add(rider);
 const wheels=[];for(const x of [-1.3,1.25]){const g=new THREE.Group();g.position.set(x,.71,0);rider.add(g);torus([0,0,0],.64,.073,'tire',g);torus([0,0,.055],.615,.036,'rubber',g);torus([0,0,-.055],.615,.036,'rubber',g);torus([0,0,0],.54,.026,'silver',g);for(let j=0;j<16;j++){const a=j*Math.PI/8;rod([0,0,j%2?.035:-.035],[Math.cos(a)*.54,Math.sin(a)*.54,0],.009,'silver',g);}const axle=mesh(new THREE.CylinderGeometry(.068,.068,.22,20),'silver',[0,0,0],g);axle.rotation.x=Math.PI/2;wheels.push(g);}
 const rear=[-1.3,.71,0],crank=[-.2,.83,0],seat=[-.65,1.71,0],head=[.9,1.78,0],front=[1.25,.71,0];
 for(const [a,b] of [[rear,crank],[crank,seat],[seat,rear],[seat,head],[head,crank]])rod(a,b,.053,'teal',rider);
 for(const z of [-.12,.12]){rod([.9,1.83,z],[1.25,.71,z],.042,'teal',rider);rod([-.2,.83,z],[-1.3,.71,z],.033,'teal',rider);}
 rod([-.65,1.7,0],[-.72,1.97,0],.035,'silver',rider);ell([-.73,1.97,0],[.36,.07,.18],'brown',rider);
 tube([[.9,1.78,0],[.87,2.06,0],[1.02,2.2,0],[1.09,2.23,.35]],.032,'silver',rider);tube([[1.02,2.2,0],[1.09,2.23,-.35]],.032,'silver',rider);
 for(const z of [-.35,.35])rod([1.07,2.23,z],[1.31,2.23,z],.044,'brown',rider);
 const bell=ell([1.04,2.28,.22],[.065,.045,.065],'silver',rider);
 const chainPoints=[[-1.3,.63,.16],[-.2,.66,.16],[0,.8,.16],[-.2,1,.16],[-1.3,.79,.16],[-1.4,.71,.16],[-1.3,.63,.16]];tube(chainPoints,.016,'dark',rider);torus([-.2,.83,.19],.175,.022,'silver',rider);
 // Racks, fenders, lamp and basket add physical detail without hiding the frame.
 for(const x of [-1.3,1.25]){const pts=[];for(let j=0;j<=20;j++){let a=j*Math.PI/20;pts.push([x+Math.cos(a)*.76,.71+Math.sin(a)*.76,0]);}tube(pts,.03,'mint',rider);}
 rod([-1.6,1.55,-.16],[-.95,1.55,-.16],.025,'silver',rider);rod([-1.6,1.55,.16],[-.95,1.55,.16],.025,'silver',rider);rod([-1.5,1.55,0],[-1.3,.71,0],.018,'silver',rider);
 rod([.94,1.69,0],[1.35,1.69,0],.025,'silver',rider);rod([1.35,1.69,0],[1.37,1.76,0],.025,'silver',rider);
 ell([1.37,1.76,0],[.11,.1,.1],'brown',rider);ell([1.455,1.76,0],[.025,.075,.075],'white',rider);
 // Pelican: full bill + throat pouch, curved neck, individual wing feathers.
 const bird=new THREE.Group();rider.add(bird);
 const body=ell([-.69,2.58,0],[.69,.77,.46],'white',bird);body.rotation.z=.22;
 ell([-.35,2.42,.1],[.42,.51,.34],'feather',bird);
 const tail=ell([-1.3,2.19,0],[.43,.15,.28],'white',bird);tail.rotation.z=.36;
 for(const z of [-.23,0,.23]){const f=ell([-1.53,2.12,z],[.29,.07,.085],'dark',bird);f.rotation.z=.25;}
 tube([[-.43,2.77,0],[-.25,3.1,0],[-.34,3.4,0],[-.2,3.68,0],[.09,3.73,0]],.205,'white',bird);
 ell([.2,3.73,0],[.43,.38,.32],'white',bird);
 const pouch=ell([.93,3.44,0],[.75,.28,.23],'pouch',bird);pouch.rotation.z=.09;
 const bill=ell([1.06,3.65,0],[.99,.095,.245],'orange',bird);bill.rotation.z=-.015;
 tube([[.4,3.61,.215],[1.02,3.59,.21],[1.65,3.58,.13],[2.0,3.61,0]],.014,'brown',bird);
 ell([1.99,3.61,0],[.055,.055,.035],'orange',bird);
 for(const z of [-.295,.295]){ell([.26,3.81,z],[.104,.112,.035],'pouch',bird);ell([.279,3.815,z*1.09],[.067,.078,.029],'dark',bird);ell([.3,3.847,z*1.17],[.022,.024,.011],'white',bird);}
 // Helmet is a true hemisphere with rim, vents, and safety straps.
 mesh(new THREE.SphereGeometry(.405,40,20,0,Math.PI*2,0,Math.PI/2),'teal',[.15,3.91,0],bird).scale.set(1.13,.76,.93);
 const helmetRim=torus([.15,3.916,0],.4,.023,'mint',bird);helmetRim.rotation.x=Math.PI/2;helmetRim.scale.set(1.13,.93,1);
 for(const z of [-.16,0,.16]){const vent=ell([.17,4.19-Math.abs(z)*.34,z],[.17,.016,.032],'dark',bird);vent.rotation.z=.06;}
 for(const z of [-.27,.27])tube([[-.08,3.92,z],[-.03,3.44,z],[.27,3.57,z],[.42,3.92,z]],.012,'brown',bird);
 // Both wings hold the bars, layered flight feathers remain visible.
 for(const side of [-1,1]){const z=side*.35;tube([[-.7,2.94,z],[-.25,2.8,z*1.25],[.25,2.41,z*1.2],[1.12,2.23,side*.35]],.115,'white',bird);for(let j=0;j<4;j++){const f=ell([-.72-j*.105,2.57-j*.08,z*1.1],[.13,.36,.058],j>1?'dark':'feather',bird);f.rotation.z=-.5;}ell([1.15,2.24,side*.35],[.18,.09,.10],'white',bird);}
 // A tiny scarf follows the riding cadence.
 const scarf=torus([-.3,3.14,0],.21,.064,'red',bird);scarf.rotation.x=Math.PI/2;
 const scarfTail=ell([-.72,3.1,-.06],[.37,.085,.13],'red',bird);scarfTail.rotation.z=.15;
 // Articulated legs: hip -> knee -> pedal, no detached feet.
 const legs=[];for(const side of [-1,1]){const g=new THREE.Group();rider.add(g);const upper=rod([0,0,0],[0,1,0],.055,'orange',g),lower=rod([0,0,0],[0,1,0],.046,'orange',g);const foot=ell([0,0,0],[.21,.058,.14],'orange',g);const pedal=box([0,0,0],[.27,.055,.2],'dark',g);const arm=rod([0,0,0],[0,1,0],.028,'silver',g);legs.push({side,upper,lower,foot,pedal,arm});}
 function setRod(o,a,b,r){o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(v(0,1,0),b.clone().sub(a).normalize());o.scale.y=a.distanceTo(b);}
 function pose(){wheels.forEach(w=>w.rotation.z=-state.phase*1.35);for(const l of legs){const a=-state.phase+(l.side===1?0:Math.PI);const p=v(-.2+Math.cos(a)*.29,.83+Math.sin(a)*.29,l.side*.26),hip=v(-.72,2.12,l.side*.24),knee=v(-.28+Math.cos(a)*.14,1.55+Math.sin(a)*.14,l.side*.29);setRod(l.upper,hip,knee);setRod(l.lower,knee,p.clone().add(v(0,.08,0)));l.foot.position.copy(p).add(v(.055,.083,0));l.pedal.position.copy(p);setRod(l.arm,v(-.2,.83,l.side*.26),p);}
 bird.position.y=Math.sin(state.phase*2)*.012;scarfTail.rotation.z=.15+Math.sin(state.phase*2)*.07;}
 // A distant sailboat completes the miniature world.
 const boat=new THREE.Group();boat.position.set(-4,-.15,-4.5);scene.add(boat);ell([0,0,0],[.53,.11,.2],'white',boat);rod([0,0,0],[0,1.1,0],.018,'brown',boat);
 const sailShape=new THREE.Shape();sailShape.moveTo(.04,.2);sailShape.lineTo(.04,1.03);sailShape.lineTo(.54,.2);sailShape.closePath();const sail=mesh(new THREE.ShapeGeometry(sailShape),new THREE.MeshStandardMaterial({color:'#faf0ce',side:THREE.DoubleSide}),null,boat);
 let targetCamera=null,toastTimer,audio=null,noiseGain=null;
 const presets={coast:[7.8,5.7,12],side:[0,3.6,13.8],top:[7,12,8]};
 function setView(name,instant=false){state.view=name;let p=presets[name].slice();const mobile=innerWidth<600;if(mobile){p=p.map(n=>n*1.3);controls.target.set(0,2.08,.4);}else controls.target.set(-.25,1.72,0);targetCamera=v(...p);if(instant||reduced.matches){camera.position.copy(targetCamera);targetCamera=null;}document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('selected',b.dataset.view===name);b.setAttribute('aria-pressed',b.dataset.view===name);});}
 controls.addEventListener('start',()=>{targetCamera=null;document.querySelectorAll('[data-view]').forEach(b=>{b.classList.remove('selected');b.setAttribute('aria-pressed','false');});});
 let wasMobile=innerWidth<600;
 function resize(){const rect=$('main').getBoundingClientRect();renderer.setSize(rect.width,rect.height);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();const mobile=innerWidth<600;if(mobile!==wasMobile){wasMobile=mobile;setView(state.view,true);}}window.addEventListener('resize',resize);resize();setView('coast',true);
 function toast(t){$('#toast').textContent=t;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2200);}
 function updatePlay(){$('#play-text').textContent=state.playing?'歇一会儿':'继续骑行';$('#play-icon').textContent=state.playing?'Ⅱ':'▶';$('#play').setAttribute('aria-label',state.playing?'暂停骑行':'继续骑行');$('#play').setAttribute('aria-pressed',String(!state.playing));}
 $('#play').onclick=()=>{state.playing=!state.playing;updatePlay();};updatePlay();
 $('#speed').oninput=e=>{state.speed=Number(e.target.value);$('#speed-value').textContent=`${state.speed<9?'慢慢':state.speed<18?'悠游':'追风'} · ${state.speed} km/h`;};
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));$('#reset').onclick=()=>{setView('coast');toast('回到海岸的第一眼');};
 $('#day').onclick=()=>{state.sunset=!state.sunset;document.body.classList.toggle('sunset',state.sunset);$('#day').innerHTML=state.sunset?'☼ <span>晴日模式</span>':'☀ <span>日落模式</span>';$('#day').setAttribute('aria-label',state.sunset?'切换至晴日':'切换至日落');$('#light-name').textContent=state.sunset?'落日慢骑':'晴日海岸';$('#light-caption').textContent=state.sunset?'把日落骑进回忆':'风很轻，路还长';};
 function context(){if(!audio)audio=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();return audio;}
 function ring(){try{const ac=context();for(const delay of [0,.14]){const osc=ac.createOscillator(),gain=ac.createGain();osc.type='sine';osc.frequency.value=delay?2150:2850;gain.gain.setValueAtTime(0,ac.currentTime+delay);gain.gain.linearRampToValueAtTime(.13,ac.currentTime+delay+.006);gain.gain.exponentialRampToValueAtTime(.001,ac.currentTime+delay+.8);osc.connect(gain).connect(ac.destination);osc.start(ac.currentTime+delay);osc.stop(ac.currentTime+delay+.85);}toast('叮铃——借过一阵海风');}catch{toast('当前浏览器无法播放声音');}}
 $('#bell').onclick=ring;
 $('#sound').onclick=()=>{try{const ac=context();if(!noiseGain){const buffer=ac.createBuffer(1,ac.sampleRate*4,ac.sampleRate),data=buffer.getChannelData(0);let last=0;for(let i=0;i<data.length;i++){last=(last+.02*(Math.random()*2-1))/1.02;data[i]=last*3.5;}const src=ac.createBufferSource();src.buffer=buffer;src.loop=true;const filter=ac.createBiquadFilter();filter.type='lowpass';filter.frequency.value=750;noiseGain=ac.createGain();noiseGain.gain.value=0;src.connect(filter).connect(noiseGain).connect(ac.destination);src.start();}state.sound=!state.sound;noiseGain.gain.setTargetAtTime(state.sound?.2:0,ac.currentTime,.3);$('#sound').setAttribute('aria-pressed',state.sound);$('#sound').setAttribute('aria-label',state.sound?'关闭海浪环境音':'开启海浪环境音');toast(state.sound?'海浪已开启，听见慢下来的声音':'海浪已静音');}catch{toast('当前浏览器无法播放声音');}};
 $('#capture').onclick=()=>{renderer.render(scene,camera);const a=document.createElement('a');a.download='pelican-coast.png';a.href=renderer.domElement.toDataURL('image/png');a.click();toast('已保存这一刻的海岸');};
 window.addEventListener('keydown',e=>{if(/INPUT|BUTTON|TEXTAREA/.test(e.target.tagName))return;if(e.code==='Space'){e.preventDefault();$('#play').click();}if(e.key.toLowerCase()==='b')ring();if(e.key.toLowerCase()==='r')$('#reset').click();});
 reduced.addEventListener('change',e=>{if(e.matches){state.playing=false;controls.enableDamping=false;updatePlay();}});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();fail(new Error('图形上下文已丢失，请重新加载。'));});
 const dayColor=new THREE.Color('#f3f2e9'),nightColor=new THREE.Color('#ecd6c6');let last=performance.now(),frames=0,hidden=false;
 document.addEventListener('visibilitychange',()=>{hidden=document.hidden;last=performance.now();});
 function animate(now){requestAnimationFrame(animate);if(hidden)return;const dt=Math.min((now-last)/1000,.05);last=now;if(state.playing){state.phase+=dt*state.speed*.19;state.distance+=dt*state.speed/3.6;for(const d of dashes){d.position.x-=dt*state.speed*.08;if(d.position.x< -5.35)d.position.x+=11.05;}boat.position.y=-.15+Math.sin(state.phase*.3)*.025;}pose();if(targetCamera){camera.position.lerp(targetCamera,1-Math.exp(-dt*5));if(camera.position.distanceTo(targetCamera)<.01)targetCamera=null;}const blend=reduced.matches?1:1-Math.exp(-dt*3);scene.background.lerp(state.sunset?nightColor:dayColor,blend);scene.fog.color.copy(scene.background);sun.color.lerp(new THREE.Color(state.sunset?'#ffaf70':'#ffedcd'),blend);sun.intensity=THREE.MathUtils.lerp(sun.intensity,state.sunset?3.3:4,blend);hemi.intensity=THREE.MathUtils.lerp(hemi.intensity,state.sunset?1.7:2.8,blend);controls.update();renderer.render(scene,camera);frames++;if(frames===2){$('#loading').classList.add('done');window.__pelicanReady=true;}}
 requestAnimationFrame(animate);
 window.__pelican={state,scene,camera,controls,renderer,get frames(){return frames;},get legs(){return legs.map(l=>({foot:l.foot.position.toArray(),pedal:l.pedal.position.toArray()}));}};
}
