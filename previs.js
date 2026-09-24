import './study.js';
import * as T from './three.module.min.js';
import {createConstruction} from './construction-state.js';
import {mobilePose} from './mobile-fidelity.js';
const data=await (await fetch('./timeline.json')).json();
const $=s=>document.querySelector(s), api=window.study;
const stages=data.stages;const compact=innerWidth<760;
if(compact)for(const s of stages)s.reviewSeconds=s.mobileSeconds;
let seconds=0;for(const s of stages){s.t0=seconds;seconds+=s.reviewSeconds;s.t1=seconds;}
const duration=seconds,bladeStart=stages[10].t0,videoStart=stages[11].t0,videoEnd=videoStart+6.32,holdStart=stages[8].t0,depart=stages[9].t0;
const clamp=T.MathUtils.clamp, mix=T.MathUtils.lerp;
const ramp=(p,a,b)=>clamp((p-a)/(b-a),0,1);
function originalClock(p){const s=stages.find(s=>p<s.end)||stages.at(-1);return mix(s.t0,s.t1,ramp(p,s.start,s.end));}
function originalProgress(t){const s=stages.find(s=>t<s.t1)||stages.at(-1);return mix(s.start,s.end,ramp(t,s.t0,s.t1));}
// Camera and video share one deterministic review clock. Smooth the final
// progress/time mapping without moving any phase endpoint or changing duration.
const mapKnots=[...stages.map(s=>s.start),1];
const mapTimes=mapKnots.map(originalClock);
const mapSlopes=mapKnots.map((x,i)=>{
 if(i===0)return(mapTimes[1]-mapTimes[0])/(mapKnots[1]-mapKnots[0]);
 if(i===mapKnots.length-1)return(mapTimes[i]-mapTimes[i-1])/(x-mapKnots[i-1]);
 const a=(mapTimes[i]-mapTimes[i-1])/(x-mapKnots[i-1]);
 const b=(mapTimes[i+1]-mapTimes[i])/(mapKnots[i+1]-x);
 return 2*a*b/(a+b);
});
function cubic(a,b,va,vb,u,dt){return (2*u**3-3*u*u+1)*a+(u**3-2*u*u+u)*dt*va+(-2*u**3+3*u*u)*b+(u**3-u*u)*dt*vb;}
function quintic(a,b,va,vb,aa,ab,u,dt){const c0=a,c1=va*dt,c2=aa*dt*dt/2,d=b-c0-c1-c2,v=vb*dt-c1-2*c2,ac=ab*dt*dt-2*c2;return c0+c1*u+c2*u*u+(10*d-4*v+ac/2)*u**3+(-15*d+7*v-ac)*u**4+(6*d-3*v+ac/2)*u**5;}
function clock(q){let i=0;while(i<mapKnots.length-2&&q>mapKnots[i+1])i++;
 const dt=mapKnots[i+1]-mapKnots[i],u=clamp((q-mapKnots[i])/dt,0,1);
 return cubic(mapTimes[i],mapTimes[i+1],mapSlopes[i],mapSlopes[i+1],u,dt);}
function progress(t){let a=0,b=1;for(let i=0;i<42;i++){const m=(a+b)/2;if(clock(m)<t)a=m;else b=m;}return(a+b)/2;}
let p=0,playing=false,raf=0,serial=0,mediaStarted=false,debug=false,warmed=false;
const rm=matchMedia('(prefers-reduced-motion: reduce)');
const rt=api.ready?api.runtime():null;
const pathGroup=new T.Group();let construction;
let keys,lastSnapshot={};

// Authored review-clock Hermite path. Shared derivatives avoid pose jumps at phases.
// Last tangent is the unchanged frozen walk's entry velocity.
const sourceKeys=data.cameraKeys||data.proposedCameraKeys||data.cameraAnchors;
if(!sourceKeys)throw Error('Storyboard camera anchors missing');
keys=sourceKeys.map(k=>({p:k.p.slice(),a:k.target.slice(),f:k.fov,t:originalClock(k.progress),progress:k.progress}));
// Small connector revision after the first 3D check: reduce the western detour.
// The 13 intervals and exact frozen endpoint/tangent remain unchanged.
const revisions={
 .14:{p:[15,14,50],a:[26,6,21]},
 .27:{p:[35,20,59],a:[34,7,20]},
 .37:{p:[52,21,59],a:[49,7,19]},
 .44:{p:[65,22,54],a:[49,8,20]},
 .6:{p:[57,30,74],a:[39,11,20]},
 .68:{p:[21,33,80],a:[34,10,18]},
 .77:{p:[17,32,79],a:[34,10,18]},
 .82:{p:[15,31.5,78],a:[34,10,18]},
 .852:{p:[-5.5,15,45],a:[17,9,23]},
 .866:{p:[-4,6.2,35.82],a:[14.8,8.45,25.35]}
};
for(const k of keys)if(revisions[k.progress])Object.assign(k,revisions[k.progress]);
function originalCameraPose(time){
 let i=0;while(i<keys.length-2&&time>keys[i+1].t)i++;
 const a=keys[i],b=keys[i+1],dt=b.t-a.t,u=clamp((time-a.t)/dt,0,1);
 const velocity=(n,k,j)=>{if(keys[n].progress===.68||keys[n].progress===.77||keys[n].progress===.82)return(k==='p'?[-.333,-.083,-.167]:[0,0,0])[j];if(n===keys.length-1)return(k==='p'?[3.5,0,-2.142857142857]:[2.857142857143,-.642857142857,.428571428571])[j];
  const prev=keys[Math.max(0,n-1)],next=keys[Math.min(keys.length-1,n+1)];return(next[k][j]-prev[k][j])/(next.t-prev.t);};
 const endAcceleration=(k,j)=>{if(i+1!==keys.length-1)return 0;const a=approach[0],b=approach[1],d=b.t-a.t;return(-6*a[k][j]-4*d*a['v'+k][j]+6*b[k][j]-2*d*b['v'+k][j])/(d*d)};
 const interpolate=k=>a[k].map((v,j)=>quintic(v,b[k][j],velocity(i,k,j),velocity(i+1,k,j),0,endAcceleration(k,j),u,dt));
 return {p:interpolate('p'),a:interpolate('a'),f:quintic(a.f,b.f,0,0,0,0,u,dt)};
}

// One C1 trajectory through docking, full blade cover and exit. The short
// 2.4/2.8-second braking/alignment knots are deliberately not used.
const approach=[
 {t:bladeStart,p:[.6,6.2,33],a:[19,7.5,26],vp:[3.5,0,-2.142857142857],va:[2.857142857143,-.642857142857,.428571428571]},
 {t:videoStart,p:[8.68,6.2,27.375],a:[24,6.2,27.375],vp:[.1,0,-1.9],va:[0,0,-1.9]},
 {t:videoStart+.48,p:[9.05,6.2,26.55],a:[24,6.2,26.55],vp:[1.458333333333,0,-1.458333333333],va:[0,0,-1.458333333333]}
];
function cameraPose(time){
 if(time<bladeStart){const q=originalCameraPose(time);
  // C1 FOV, no final zoom-rate stop at the 48-degree anchor.
  if(time>=depart){const stop=originalClock(.866),u=clamp((time-depart)/(stop-depart),0,1);
   q.f=cubic(43,48,0,0,u,stop-depart);}
  return q;
 }
 const i=time<videoStart?0:1,a=approach[i],b=approach[i+1],dt=b.t-a.t,u=clamp((time-a.t)/dt,0,1);
 const v=k=>a[k].map((x,j)=>cubic(x,b[k][j],a['v'+k][j],b['v'+k][j],u,dt));
 return {p:v('p'),a:v('a'),f:48};
}

function setup(){
 construction=createConstruction(rt);
 const points=[];for(let t=0;t<=videoStart+.48;t+=.15)points.push(new T.Vector3(...activePose(t).p));
 pathGroup.add(new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:0xf7b800,depthTest:false})));
 rt.world.add(pathGroup);pathGroup.visible=false;
}
function state(q){lastSnapshot=construction.update(q);pathGroup.visible=debug;}
const mobileMode=()=>innerWidth<760;
function activePose(time){return mobileMode()?mobilePose(time,cameraPose,{stages,holdStart,depart,bladeStart}):cameraPose(time);}
function ui(){const s=stages.find(s=>p<s.end)||stages.at(-1);$('#progress').value=p;$('#readout').textContent=`${p.toFixed(4)} · ${clock(p).toFixed(1)} / ${duration.toFixed(2)} s`;
 $('#phase-title').textContent=`${stages.indexOf(s)+1}. ${s.title}`;$('#phase-detail').textContent=s.state;
 [...$('#phases').children].forEach((b,i)=>b.setAttribute('aria-current',stages[i]===s?'step':'false'));
 $('#groups').textContent=Object.entries(lastSnapshot.groups||{}).map(([n,c])=>`${c?'●':'○'} ${n} (${c} active batches)`).join('\n');
}
function render(q){p=clamp(q,0,1);$('#end-card').hidden=clock(p)<videoEnd;
 if(compact){const u=ramp(p,.82,.88),v=u*u*(3-2*u),ratio=String(mix(4/3,16/9,v));if($('#stage').style.aspectRatio!==ratio){$('#stage').style.aspectRatio=ratio;api.resize();}}if(rt){state(p);const t=clock(p),hand=Math.max(0,t-bladeStart);let pose=activePose(t);if(debug)pose={p:[105,85,100],a:[38,5,18],f:48};api.renderPrevis(pose,hand);}ui();}
function pause(){playing=false;cancelAnimationFrame(raf);api.pause();api.video.pause();}
let seekQueue=Promise.resolve();
function seek(q){pause();const id=++serial;
 if(q<.92){api.video.pause();render(q);return Promise.resolve();}
 // Keep the last valid image until decoding finishes; never show a stale video
 // frame at a newly requested progress value. Latest seek wins.
 $('#previs-status').textContent='Seeking the exact real-footage state…';
 seekQueue=seekQueue.catch(()=>{}).then(async()=>{if(id!==serial)return;await api.seekVideo(Math.min(6.28,clock(q)-videoStart));if(id===serial){render(q);$('#previs-status').textContent='Paused at requested progress.';}});return seekQueue;
}
async function play(){pause();if(rm.matches||!rt){await realOnly();return;}const id=++serial;if(p>=.999)render(0);
 $('#previs-status').textContent='Preparing the unchanged real-footage ending…';await api.prepareVideo();if(id!==serial)return;
 if(!warmed){
  // Exercise the decoder before the cinematic clock starts; reset to the exact
  // approved first source frame. No decode-clock takeover during camera motion.
  await api.video.play();await new Promise(r=>setTimeout(r,120));api.video.pause();await api.seekVideo(0);
  const saved=p;for(const q of [.03,.13,.25,.35,.43,.58,.67,.72,.755,.761,.79]){state(q);api.renderPrevis(activePose(clock(q)),0);}
  // Compile/upload the foreground-only video composite too. It is a different
  // shader variant from the instanced building and must not first compile at cut.
  api.renderPrevis(activePose(videoStart),3);api.renderPrevis(activePose(videoStart+.16),3.16);
  render(saved);warmed=true;}
 const start=clock(p);if(start>=videoStart)await api.seekVideo(start-videoStart);else await api.seekVideo(0);
 if(id!==serial)return;playing=true;mediaStarted=start>=videoStart;if(mediaStarted)await api.video.play();const epoch=performance.now();
 $('#previs-status').textContent='Playing the revised review clock. Scrubbing takes control immediately.';
 const tick=now=>{if(!playing)return;let t=start+(now-epoch)/1000;
  if(t>=videoStart&&!mediaStarted){mediaStarted=true;api.video.play().catch(e=>{pause();$('#previs-status').textContent=e.message;});}
  // Keep the camera on its monotonic review clock; video never owns camera time.
  render(progress(t));if(t>=duration-.045){render(1);pause();$('#previs-status').textContent='Review complete. Replay is explicit.';return;}raf=requestAnimationFrame(tick);
 };raf=requestAnimationFrame(tick);
}
async function realOnly(){pause();++serial;await api.prepareVideo();await api.seekVideo(0);$('#scene').style.visibility='hidden';$('#fallback').style.display='none';api.video.style.visibility='visible';api.video.controls=true;await api.video.play();$('#previs-status').textContent='Optional normal video playback; camera journey skipped.';}
if(rt){setup();
 // Compile both ledgers once, including temporarily hidden construction groups.
 // Direct phase jumps should not pay a first-use shader cost during review.
 for(const r of construction.records){r.o.visible=true;r.o.material=r.m;}
 if(rt.renderer.compileAsync)await rt.renderer.compileAsync(rt.world,rt.camera);
 construction.update(.79);
 if(rt.renderer.compileAsync)await rt.renderer.compileAsync(rt.world,rt.camera);
 for(const q of [.03,.13,.24,.35,.42,.55,.66,.72,.755,.761,.79]){state(q);api.renderPrevis(activePose(clock(q)),0);}
}
for(const [i,s] of stages.entries()){const b=document.createElement('button');b.textContent=`${String(i+1).padStart(2,'0')} ${s.title}`;b.onclick=()=>seek((s.start+s.end)/2);$('#phases').append(b);}
$('#play-previs').onclick=()=>play().catch(e=>$('#previs-status').textContent=e.message);
$('#pause-previs').onclick=pause;$('#restart-previs').onclick=()=>seek(0);
$('#progress').oninput=e=>{api.video.controls=false;seek(+e.target.value).catch(e=>$('#previs-status').textContent=e.message);};
$('#path-debug').onchange=e=>{debug=e.target.checked;pause();render(p);};
$('#group-debug').onchange=e=>$('#groups').hidden=!e.target.checked;
$('#completed').onclick=()=>seek(.79);$('#real-play').onclick=realOnly;
$('#full-review').onclick=()=>$('#stage').requestFullscreen?.();
document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();++serial;}});
new IntersectionObserver(([e])=>{if(!e.isIntersecting)pause();}).observe($('#stage'));
window.addEventListener('resize',()=>{if(!playing)render(p);});
render(rm.matches?.79:0);$('#previs-status').textContent=rt?'Ready. In-place construction; approved completed look and handover.':'WebGL unavailable: use real footage only.';
window.previs={ready:true,seek,play,pause,render,clock,progress,keys,stages,cameraPose,rt,
 snapshot:()=>({...lastSnapshot,camera:activePose(clock(p)),stats:api.stats(),diagnostics:rt?api.diagnostics():null,videoTime:api.video.currentTime,playing}),
 coverage:t=>api.coverage(t,activePose(bladeStart+t)),
 activePose,mobileMode,construction,duration,bladeStart,videoStart,videoEnd,
 approach,mapKnots,mapTimes,mapSlopes,
 inventory:()=>construction?.inventory()};
