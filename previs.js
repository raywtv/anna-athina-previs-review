import './study.js';
import * as T from './three.module.min.js';
import {outlines} from './geometry.js';
const data=await (await fetch('./timeline.json')).json();
const $=s=>document.querySelector(s), api=window.study;
const stages=data.stages;
let seconds=0;for(const s of stages){s.t0=seconds;seconds+=s.reviewSeconds;s.t1=seconds;}
const duration=seconds;
const clamp=T.MathUtils.clamp, mix=T.MathUtils.lerp;
const ramp=(p,a,b)=>clamp((p-a)/(b-a),0,1);
function originalClock(p){const s=stages.find(s=>p<s.end)||stages.at(-1);return mix(s.t0,s.t1,ramp(p,s.start,s.end));}
function originalProgress(t){const s=stages.find(s=>t<s.t1)||stages.at(-1);return mix(s.start,s.end,ramp(t,s.t0,s.t1));}
// Camera and video share one deterministic review clock. Smooth the final
// progress/time mapping without moving any phase endpoint or changing duration.
const mapKnots=[.77,.82,.88,.92,.96,1];
const mapTimes=mapKnots.map(originalClock);
const mapSlopes=mapKnots.map((x,i)=>{
 if(i===0)return (53-46)/(.77-.68);
 if(i===mapKnots.length-1)return 81;
 const a=(mapTimes[i]-mapTimes[i-1])/(x-mapKnots[i-1]);
 const b=(mapTimes[i+1]-mapTimes[i])/(mapKnots[i+1]-x);
 return 2*a*b/(a+b);
});
function cubic(a,b,va,vb,u,dt){return (2*u**3-3*u*u+1)*a+(u**3-2*u*u+u)*dt*va+(-2*u**3+3*u*u)*b+(u**3-u*u)*dt*vb;}
function clock(q){if(q<.77)return originalClock(q);let i=0;while(i<mapKnots.length-2&&q>mapKnots[i+1])i++;
 const dt=mapKnots[i+1]-mapKnots[i],u=clamp((q-mapKnots[i])/dt,0,1);
 return cubic(mapTimes[i],mapTimes[i+1],mapSlopes[i],mapSlopes[i+1],u,dt);}
function progress(t){if(t<53)return originalProgress(t);let a=.77,b=1;for(let i=0;i<42;i++){const m=(a+b)/2;if(clock(m)<t)a=m;else b=m;}return(a+b)/2;}
let p=0,playing=false,raf=0,serial=0,mediaStarted=false,debug=false,warmed=false;
const rm=matchMedia('(prefers-reduced-motion: reduce)');
const rt=api.ready?api.runtime():null;
const records=[],temporary=new T.Group(),pathGroup=new T.Group();
let keys,coreBatch,corePieces=[],lastState='',lastSnapshot={};

// Authored review-clock Hermite path. Shared derivatives avoid pose jumps at phases.
// Last tangent is the unchanged frozen walk's entry velocity.
const sourceKeys=data.cameraKeys||data.proposedCameraKeys||data.cameraAnchors;
if(!sourceKeys)throw Error('Storyboard camera anchors missing');
keys=sourceKeys.map(k=>({p:k.p.slice(),a:k.target.slice(),f:k.fov,t:originalClock(k.progress),progress:k.progress}));
// Small connector revision after the first 3D check: reduce the western detour.
// The 13 intervals and exact frozen endpoint/tangent remain unchanged.
const revisions={
 .14:{p:[15,14,50],a:[26,6,21]},
 .27:{p:[29,17,55],a:[30,7,20]},
 .77:{p:[21,19,48],a:[28,9,23]},
 .82:{p:[12,16,46],a:[25,9,23]},
 .852:{p:[-5.5,10,40],a:[15,8,24]},
 .866:{p:[-4,6.2,35.82],a:[14.8,8.45,25.35]}
};
for(const k of keys)if(revisions[k.progress])Object.assign(k,revisions[k.progress]);
function originalCameraPose(time){
 let i=0;while(i<keys.length-2&&time>keys[i+1].t)i++;
 const a=keys[i],b=keys[i+1],dt=b.t-a.t,u=clamp((time-a.t)/dt,0,1);
 const velocity=(n,k,j)=>{if(n===keys.length-1)return(k==='p'?[3.5,0,-2.142857142857]:[2.857142857143,-.642857142857,.428571428571])[j];
  const prev=keys[Math.max(0,n-1)],next=keys[Math.min(keys.length-1,n+1)];return(next[k][j]-prev[k][j])/(next.t-prev.t);};
 const interpolate=k=>a[k].map((v,j)=>(2*u**3-3*u*u+1)*v+(u**3-2*u*u+u)*dt*velocity(i,k,j)+(-2*u**3+3*u*u)*b[k][j]+(u**3-u*u)*dt*velocity(i+1,k,j));
 return {p:interpolate('p'),a:interpolate('a'),f:mix(a.f,b.f,u)};
}

// One C1 trajectory through docking, full blade cover and exit. The short
// 2.4/2.8-second braking/alignment knots are deliberately not used.
const approach=[
 {t:65,p:[.6,6.2,33],a:[19,7.5,26],vp:[3.5,0,-2.142857142857],va:[2.857142857143,-.642857142857,.428571428571]},
 {t:68,p:[8.68,6.2,27.375],a:[24,6.2,27.375],vp:[.1,0,-1.9],va:[0,0,-1.9]},
 {t:68.48,p:[9.05,6.2,26.55],a:[24,6.2,26.55],vp:[1.458333333333,0,-1.458333333333],va:[0,0,-1.458333333333]}
];
function cameraPose(time){
 if(time<65){const q=originalCameraPose(time);
  // C1 FOV, no final zoom-rate stop at the 48-degree anchor.
  if(time>=57){const stop=originalClock(.866),u=clamp((time-57)/(stop-57),0,1);
   q.f=cubic(43,48,0,0,u,stop-57);}
  return q;
 }
 const i=time<68?0:1,a=approach[i],b=approach[i+1],dt=b.t-a.t,u=clamp((time-a.t)/dt,0,1);
 const v=k=>a[k].map((x,j)=>cubic(x,b[k][j],a['v'+k][j],b['v'+k][j],u,dt));
 return {p:v('p'),a:v('a'),f:48};
}

function interval(name,material){
 const side=name.startsWith('B')?'B':'A',level=+(name.match(/level (\d)/)?.[1]||1);
 if(name==='site / visible base')return [.07,.12,.73,.765];
 if(name.includes('balustrade'))return [.716,.742,.716,.742];
 if(name.includes('privacy screens'))return [.716,.741,.716,.741];
 if(name.includes('/ enclosure')){
  if(material===rt.look.materials.glass)return[.682+(side==='A'?.013:0)+level*.007,.718+level*.008,.68,.755];
  const starts=side==='B'?[.14,.19,.46]:[.15,.445,.515];return[starts[level-1],starts[level-1]+.045,.686+(side==='A'?.015:0),.744];
 }
 if(name.includes('/ slab')||name.includes('balcony bands')){
  const starts=side==='B'?[.09,.175,.455]:[.065,.37,.515];return[starts[level-1],starts[level-1]+(level===2&&side==='A'?.069:.04),.69,.742];
 }
 if(name.includes('raised north terrace'))return[.395,.44,.706,.746];
 if(name.includes('structural columns'))return[.14,.175,.71,.744];
 if(name.includes('cores /'))return[.14,.58,.706,.747];
 if(name.includes('connection / glazing'))return[.708,.741,.708,.741];
 if(name.includes('architectural blades'))return[.56,.62,.71,.751];
 if(name.includes('roof plate'))return[side==='B'?.602:.62,side==='B'?.629:.651,.712,.751];
 if(name.includes('raised terrace'))return[.638,.665,.721,.756];
 if(name.includes('pool shell'))return[.65,.678,.734,.759];
 if(name.includes('pool coping'))return[.738,.752,.738,.752];
 if(name.includes('pool water'))return[.752,.765,.752,.765];
 if(name.includes('access and'))return[.637,.67,.724,.757];
 return[.68,.73,.70,.76];
}
function setup(){
 const {model,world,renderer}=rt;
 renderer.localClippingEnabled=true;
 world.add(temporary,pathGroup);
 model.root.traverse(o=>{if(!o.isMesh)return;const name=o.parent.name,box=new T.Box3().setFromObject(o),final=o.material;
  const timing=name==='cores / central connection'&&!o.isInstancedMesh?[.54,.58,.706,.747]:interval(name,final),glass=[rt.look.materials.glass,rt.look.materials.rail,rt.look.materials.pool].includes(final);
  const plane=new T.Plane(new T.Vector3(0,-1,0),100);
  const interim=glass?final.clone():new T.MeshStandardMaterial({color:0xb6b3aa,roughness:.91,metalness:0});
  interim.clippingPlanes=[plane];interim.clipShadows=true;
  records.push({o,name,final,interim,plane,box,timing,glass});
 });
 // Only the construction representation splits the existing shaft batch.
 // Matrices and shared box geometry are copied unchanged; final batch is restored.
 coreBatch=records.find(r=>r.name==='cores / central connection'&&r.o.isInstancedMesh);
 if(coreBatch){for(const prefix of ['lift core','B stair core','A stair enclosure']){
  const indices=coreBatch.o.userData.parts.map((s,i)=>s.startsWith(prefix)?i:-1).filter(i=>i>=0);
  const plane=new T.Plane(new T.Vector3(0,-1,0),3.4),mat=new T.MeshStandardMaterial({color:0xb6b3aa,roughness:.91,clippingPlanes:[plane],clipShadows:true});
  const mesh=new T.InstancedMesh(coreBatch.o.geometry,mat,indices.length),matrix=new T.Matrix4();
  indices.forEach((idx,i)=>{coreBatch.o.getMatrixAt(idx,matrix);mesh.setMatrixAt(i,matrix);});mesh.castShadow=true;mesh.receiveShadow=true;mesh.name='Temporary height control / '+prefix;temporary.add(mesh);corePieces.push({mesh,plane,prefix});
 }}
 // A single shared transfer mesh in a dry formwork state, never duplicated building geometry.
 const transfer=model.groups['A / level 2 / slab'].children[0];
 const form=transfer.clone();form.geometry=transfer.geometry;form.material=new T.MeshStandardMaterial({color:0x998875,roughness:1});form.name='Temporary formed transfer outline';form.castShadow=true;form.receiveShadow=true;temporary.add(form);
 temporary.userData.form=form;
 const earth=new T.Mesh(new T.PlaneGeometry(86,35),new T.MeshStandardMaterial({color:0x827461,roughness:1}));earth.rotation.x=-Math.PI/2;earth.position.set(39,3.005,17);earth.name='Schematic site surface — no inferred excavation dimensions';earth.receiveShadow=true;temporary.add(earth);temporary.userData.earth=earth;
 const footprint=new T.Group();footprint.name='Schematic footprint set-out, not excavation geometry';for(const side of ['A1','B1']){const points=[...outlines[side],outlines[side][0]].map(v=>new T.Vector3(v[0],3.012,v[1]));footprint.add(new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:0xd8c99c})));}temporary.add(footprint);temporary.userData.footprint=footprint;
 const pts=[];for(let t=0;t<=65;t+=.15)pts.push(new T.Vector3(...cameraPose(t).p));for(let t=0;t<=3;t+=.03)pts.push(new T.Vector3(...api.evaluatePath(t).p));
 pathGroup.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:0xf7b800,depthTest:false})));
 pathGroup.visible=false;
}
function state(q){
 const completed=q>=.77;
 for(const r of records){const [a,b,c,d]=r.timing;let reveal=ramp(q,a,b);const finish=ramp(q,c,d);
  if(r.name==='A / level 2 / slab'&&q>=.37)reveal=1;
  r.o.visible=reveal>0;r.plane.constant=mix(r.box.min.y-.025,r.box.max.y+.025,reveal);
  if(completed||finish>=1){r.o.material=r.final;}else{r.o.material=r.interim;if(!r.glass){r.interim.color.set(0xb6b3aa).lerp(r.final.color,finish);r.interim.roughness=mix(.91,r.final.roughness??.8,finish);r.interim.metalness=mix(0,r.final.metalness??0,finish);if(r.name==='A / level 2 / slab'&&q<.44)r.interim.color.set(0x998875).lerp(new T.Color(0xb6b3aa),ramp(q,.37,.44));}}
 }
 if(coreBatch){coreBatch.o.visible=q>=.58;for(const c of corePieces){c.mesh.visible=q>.14&&q<.58;
  const isB=c.prefix==='B stair core';const h=isB?mix(4.6,10.8,ramp(q,.14,.26))+mix(0,3.76,ramp(q,.45,.57)):mix(3.4,6.63,ramp(q,.14,.27))+mix(0,c.prefix==='lift core'?9.17:6.07,ramp(q,.44,.58));c.plane.constant=h;
 }}
 temporary.userData.form.visible=q>=.285&&q<.37;
 temporary.userData.earth.visible=q<.12;
 temporary.userData.footprint.visible=q<.065;
 pathGroup.visible=debug;
 const key=records.map(r=>`${+r.o.visible}:${r.o.material===r.final?1:r.plane.constant.toFixed(3)}:${ramp(q,r.timing[2],r.timing[3]).toFixed(3)}`).join('|')+corePieces.map(c=>c.plane.constant.toFixed(3)).join('|');
 if(key!==lastState){rt.renderer.shadowMap.needsUpdate=true;lastState=key;}
 lastSnapshot={progress:q,completed,groups:Object.fromEntries(Object.entries(rt.model.groups).map(([n,g])=>[n,g.children.filter(o=>o.visible).length])),materialsRestored:records.every(r=>r.o.material===r.final),temporaryVisible:temporary.children.filter(o=>o.visible).map(o=>o.name)};
}
function ui(){const s=stages.find(s=>p<s.end)||stages.at(-1);$('#progress').value=p;$('#readout').textContent=`${p.toFixed(4)} · ${clock(p).toFixed(1)} / ${duration.toFixed(2)} s`;
 $('#phase-title').textContent=`${stages.indexOf(s)+1}. ${s.title}`;$('#phase-detail').textContent=s.state;
 [...$('#phases').children].forEach((b,i)=>b.setAttribute('aria-current',stages[i]===s?'step':'false'));
 $('#groups').textContent=Object.entries(lastSnapshot.groups||{}).map(([n,c])=>`${c?'●':'○'} ${n} (${c} active batches)`).join('\n');
}
function render(q){p=clamp(q,0,1);if(rt){state(p);const t=clock(p),hand=Math.max(0,t-65);let pose=cameraPose(t);if(debug)pose={p:[105,85,100],a:[38,5,18],f:48};api.renderPrevis(pose,hand);}ui();}
function pause(){playing=false;cancelAnimationFrame(raf);api.pause();api.video.pause();}
let seekQueue=Promise.resolve();
function seek(q){pause();const id=++serial;
 if(q<.92){api.video.pause();render(q);return Promise.resolve();}
 // Keep the last valid image until decoding finishes; never show a stale video
 // frame at a newly requested progress value. Latest seek wins.
 $('#previs-status').textContent='Seeking the exact real-footage state…';
 seekQueue=seekQueue.catch(()=>{}).then(async()=>{if(id!==serial)return;await api.seekVideo(clock(q)-68);if(id===serial){render(q);$('#previs-status').textContent='Paused at requested progress.';}});return seekQueue;
}
async function play(){pause();if(rm.matches||!rt){await realOnly();return;}const id=++serial;if(p>=.999)render(0);
 $('#previs-status').textContent='Preparing the unchanged real-footage ending…';await api.prepareVideo();if(id!==serial)return;
 if(!warmed){
  // Exercise the decoder before the cinematic clock starts; reset to the exact
  // approved first source frame. No decode-clock takeover during camera motion.
  await api.video.play();await new Promise(r=>setTimeout(r,120));api.video.pause();await api.seekVideo(0);
  const saved=p;for(const q of [.03,.13,.25,.35,.43,.58,.67,.72,.755,.79]){state(q);api.renderPrevis(cameraPose(clock(q)),0);}
  // Compile/upload the foreground-only video composite too. It is a different
  // shader variant from the instanced building and must not first compile at cut.
  api.renderPrevis(cameraPose(68),3);api.renderPrevis(cameraPose(68.16),3.16);
  render(saved);warmed=true;}
 const start=clock(p);if(start>=68)await api.seekVideo(start-68);else await api.seekVideo(0);
 if(id!==serial)return;playing=true;mediaStarted=start>=68;if(mediaStarted)await api.video.play();const epoch=performance.now();
 $('#previs-status').textContent='Playing the 74.32-second review clock. Scrubbing takes control immediately.';
 const tick=now=>{if(!playing)return;let t=start+(now-epoch)/1000;
  if(t>=68&&!mediaStarted){mediaStarted=true;api.video.play().catch(e=>{pause();$('#previs-status').textContent=e.message;});}
  // Keep the camera on its monotonic review clock; video never owns camera time.
  render(progress(t));if(t>=duration-.045){render(1);pause();$('#previs-status').textContent='Review complete. Replay is explicit.';return;}raf=requestAnimationFrame(tick);
 };raf=requestAnimationFrame(tick);
}
async function realOnly(){pause();++serial;await api.prepareVideo();await api.seekVideo(0);$('#scene').style.visibility='hidden';$('#fallback').style.display='none';api.video.style.visibility='visible';api.video.controls=true;await api.video.play();$('#previs-status').textContent='Optional normal video playback; camera journey skipped.';}
if(rt){setup();
 // Compile the temporary material variants before the review clock starts.
 for(const r of records)r.o.material=r.interim;
 if(rt.renderer.compileAsync)await rt.renderer.compileAsync(rt.world,rt.camera);
 for(const r of records)r.o.material=r.final;
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
render(rm.matches?.79:0);$('#previs-status').textContent=rt?'Ready. Stage controls seek to the middle of each phase.':'WebGL unavailable: use real footage only.';
window.previs={ready:true,seek,play,pause,render,clock,progress,keys,stages,cameraPose,rt,
 snapshot:()=>({...lastSnapshot,camera:cameraPose(clock(p)),stats:api.stats(),diagnostics:rt?api.diagnostics():null,videoTime:api.video.currentTime,playing}),
 coverage:t=>api.coverage(t,cameraPose(65+t)),
 approach,mapKnots,mapTimes,mapSlopes,
 inventory:()=>records.map(r=>({group:r.name,mesh:r.o.name,timing:r.timing,bounds:{min:r.box.min.toArray(),max:r.box.max.toArray()}}))};
