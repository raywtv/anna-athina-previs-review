import * as T from './three.module.min.js';
import {makeAnna} from './geometry.js';
import {concepts,entry} from './paths.js';
import {applyLook,setupLighting,lighting,views} from './look.js';
entry.poster='./media/source-1018.jpg';
let externalPose=null;
let look,selectLight,lightingState,inspection='hero';
const $=s=>document.querySelector(s),stage=$('#stage'),canvas=$('#scene'),video=$('#footage'),poster=$('#fallback'),status=$('#status');
const rm=matchMedia('(prefers-reduced-motion: reduce)');
let renderer,model,world,foreground,camera,postScene,postCamera,post,targets,photo,videoTex,activeOccluder;
let playing=false,loaded=false,failed=false,at=0,raf=0,token=0,stats={},videoPromise;
const current=()=>concepts[$('#concept').value];
const cut=()=>$('#coverage').value==='partial'?current().partialCut:current().cut;
const end=()=>cut()+entry.duration;
const fallback=()=>rm.matches||$('#quality').value==='low'||failed;
const meshes={};
function light(scene){scene.add(new T.HemisphereLight(0xffffff,0x667077,1.3));const key=new T.DirectionalLight(0xffffff,1.5);key.position.set(30,70,45);scene.add(key);}
// Time-parametrised cubic Hermite interpolation, with shared endpoint velocities.
// This is authored camera movement, not optimisation against photographs.
function evaluatePath(t){const keys=current().keys;let i=0;while(i<keys.length-2&&t>keys[i+1].t)i++;const a=keys[i],b=keys[i+1],dt=b.t-a.t,u=T.MathUtils.clamp((t-a.t)/dt,0,1);
 const v=(n,k,j)=>{const p=keys[Math.max(0,n-1)],q=keys[Math.min(keys.length-1,n+1)];return(q[k][j]-p[k][j])/(q.t-p.t);};
 const mix=k=>a[k].map((x,j)=>(2*u**3-3*u*u+1)*x+(u**3-2*u*u+u)*dt*v(i,k,j)+(-2*u**3+3*u*u)*b[k][j]+(u**3-u*u)*dt*v(i+1,k,j));
 return {p:mix('p'),a:mix('a'),f:a.f+(b.f-a.f)*u};}
function pose(t){if(externalPose){camera.position.fromArray(externalPose.p);camera.up.set(0,1,0);camera.lookAt(...externalPose.a);camera.fov=externalPose.f;camera.updateProjectionMatrix();camera.updateMatrixWorld();return externalPose;}const v=views[inspection];const q=inspection==='handover'?evaluatePath(t):v.t!==undefined?evaluatePath(v.t):{p:v.p,a:v.a,f:v.f};camera.position.fromArray(q.p);camera.up.set(0,1,0);camera.lookAt(...q.a);camera.fov=q.f;camera.updateProjectionMatrix();camera.updateMatrixWorld();return q;}
function selectOccluder(){if(activeOccluder)foreground.remove(activeOccluder);activeOccluder=meshes[$('#concept').value];foreground.add(activeOccluder);foreground.updateMatrixWorld(true);}
function size(){if(!renderer)return;const w=$('#quality').value==='full'?3840:Math.min(1920,Math.round(stage.clientWidth*Math.min(devicePixelRatio,1.5)));renderer.setSize(w,Math.round(w*9/16),false);for(const [i,rt] of targets.entries()){const active=i===0||$('#shutter').value==='on';rt.samples=active&&w>1000?2:0;rt.setSize(active?w:1,active?Math.round(w*9/16):1);}}
function paint(t){at=T.MathUtils.clamp(t,0,end());$('#scrub').max=end();$('#scrub').value=at;$('#time').value=`${at.toFixed(2)} / ${end().toFixed(2)} s`;
 if(fallback()){canvas.style.visibility='hidden';poster.style.display=loaded&&playing?'none':'block';video.style.visibility=loaded&&playing?'visible':'hidden';return;}
 const real=inspection==='handover'&&at>=cut(),native=inspection==='handover'&&at>=current().clear&&loaded;canvas.style.visibility=native?'hidden':'visible';video.style.visibility=loaded?'visible':'hidden';poster.style.display='none';$('#badge').textContent=native?(at>=cut()+current().duration?'Real drone reveal':'Real façade bridge'):real?'Foreground reveal':'Rendered architecture';if(native)return;
 const start=performance.now(),shutter=$('#shutter').value==='on'&&at>2.55&&at<current().clear,count=shutter?3:1;
 let calls=0,triangles=0;
 for(let i=0;i<count;i++){pose(at+(count===1?0:(i-1)*.0005));renderer.setRenderTarget(targets[i]);renderer.setClearColor(real?0x000000:lightingState.background,real?0:1);renderer.clear();renderer.render(real?foreground:world,camera);calls+=renderer.info.render.calls;triangles+=renderer.info.render.triangles;}
 pose(at);post.uniforms.s0.value=targets[0].texture;post.uniforms.s1.value=targets[count===3?1:0].texture;post.uniforms.s2.value=targets[count===3?2:0].texture;
 post.uniforms.realMap.value=loaded?videoTex:photo;post.uniforms.isVideo.value=loaded?1:0;post.uniforms.real.value=real?1:0;
 post.uniforms.depthMap.value=targets[0].depthTexture;post.uniforms.inverseProjection.value.copy(camera.projectionMatrixInverse);post.uniforms.contact.value=real||innerWidth<760?0:1;post.uniforms.projectionScale.value=camera.projectionMatrix.elements[5];
 renderer.setRenderTarget(null);renderer.setClearColor(0x727b82,1);renderer.render(postScene,postCamera);
 stats={groups:Object.keys(model.groups).length,calls:calls+1,triangles,temporalSamples:count,modelCalls:52,modelTriangles:13900,lighting:$('#lighting').value,view:inspection,shadowMap:innerWidth<760?1024:2048,cpuSubmitMs:performance.now()-start,renderSize:renderer.getSize(new T.Vector2()).toArray()};}
async function loadVideo(){if(loaded)return;if(videoPromise)return videoPromise;videoPromise=(async()=>{const src=stage.clientWidth<760||fallback()?entry.videoLow:entry.video4k;video.dataset.source=src;const r=await fetch(src);if(!r.ok)throw Error('The local review footage could not be loaded.');video.src=URL.createObjectURL(await r.blob());await new Promise((resolve,reject)=>{video.addEventListener('loadeddata',resolve,{once:true});video.addEventListener('error',()=>reject(Error('Video decoding failed.')),{once:true});video.load();});loaded=true;})();try{await videoPromise;}catch(e){videoPromise=null;throw e;}}
function pause(){playing=false;cancelAnimationFrame(raf);video.pause();$('#pause').disabled=true;}
async function seekVideo(t){await loadVideo();const v=Math.min(entry.duration-.04,Math.max(0,Math.round(t*25)/25+.00001));if(Math.abs(video.currentTime-v)>.006)await new Promise(resolve=>{video.addEventListener('seeked',resolve,{once:true});video.currentTime=v;});if(videoTex)videoTex.needsUpdate=true;}
async function seek(t){pause();const id=++token;if(t>=cut())await seekVideo(t-cut());if(id===token)paint(t);}
async function play(){inspection='handover';$('#view').value='handover';pause();const id=++token;status.textContent='Preparing footage…';try{await seekVideo(0);if(id!==token)return;playing=true;$('#pause').disabled=false;
 if(fallback()){canvas.style.visibility='hidden';poster.style.display='none';video.style.visibility='visible';await video.play();status.textContent='Normal video playback; spatial transition skipped.';return;}
 let epoch=performance.now(),begun=false;status.textContent='Playing at normal speed';
 function tick(now){if(!playing)return;let t=(now-epoch)/1000;if(t>=cut()&&!begun){begun=true;video.play().catch(e=>{pause();status.textContent=e.message;});}if(begun)t=cut()+video.currentTime;paint(t);if(t>=end()-.03){pause();status.textContent='Concept complete.';return;}raf=requestAnimationFrame(tick);}raf=requestAnimationFrame(tick);
 }catch(e){pause();status.textContent=e.message;poster.style.display='block';}}
function describe(){const c=current();entry.duration=c.duration+3.24;entry.video4k='./media/'+c.video+'-sequence-3840.mp4';entry.videoLow='./media/'+c.video+'-sequence-1280.mp4';$('#name').textContent=c.title;$('#description').textContent=c.description;$('#parameters').textContent=`${c.source} Bridge: frame ${c.frame} / ${c.time.toFixed(3)} s; ${c.duration.toFixed(2)} s. Wider reveal: frame 740 / 29.600 s; 3.24 s.`;}
try{
 photo=await new T.TextureLoader().loadAsync(entry.poster);photo.colorSpace=T.SRGBColorSpace;
 renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'});renderer.outputColorSpace=T.SRGBColorSpace;
 world=new T.Scene();foreground=new T.Scene();model=makeAnna();look=applyLook(model);world.add(model.root);selectLight=setupLighting(renderer,world,foreground);lightingState=selectLight('coastal');model.root.updateMatrixWorld(true);
 camera=new T.PerspectiveCamera(48,16/9,.01,1000);
 for(const [name,c] of Object.entries(concepts)){const group=model.groups[c.occluder];let mesh;
 if(typeof c.part==='number'){const source=group.children.find(m=>m.isInstancedMesh),matrix=new T.Matrix4();source.getMatrixAt(c.part,matrix);mesh=new T.Mesh(source.geometry,source.material);mesh.matrix.copy(source.matrixWorld).multiply(matrix);mesh.matrixAutoUpdate=false;}
 else{const source=group.children.find(m=>m.name===c.part);mesh=new T.Mesh(source.geometry,source.material);mesh.matrix.copy(source.matrixWorld);mesh.matrixAutoUpdate=false;}
 mesh.name='Foreground reference — '+c.occluder;meshes[name]=mesh;}
 selectOccluder();videoTex=new T.VideoTexture(video);videoTex.colorSpace=T.SRGBColorSpace;
 targets=[0,1,2].map(()=>new T.WebGLRenderTarget(1,1,{depthBuffer:true,type:T.HalfFloatType,depthTexture:new T.DepthTexture(1,1)}));
 post=new T.ShaderMaterial({uniforms:{s0:{value:null},s1:{value:null},s2:{value:null},realMap:{value:photo},isVideo:{value:0},real:{value:0},depthMap:{value:null},inverseProjection:{value:new T.Matrix4()},contact:{value:0},projectionScale:{value:1}},vertexShader:'varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`varying vec2 uv0;uniform sampler2D s0,s1,s2,realMap,depthMap;uniform float isVideo,real,contact,projectionScale;uniform mat4 inverseProjection;
 vec3 viewPoint(vec2 uv){float d=texture2D(depthMap,uv).x;vec4 p=inverseProjection*vec4(uv*2.-1.,d*2.-1.,1.);return p.xyz/p.w;}
 void main(){vec4 g=(texture2D(s0,uv0)+texture2D(s1,uv0)+texture2D(s2,uv0))/3.;vec3 c=texture2D(realMap,uv0).rgb;
 if(isVideo>.5)c=mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));
 // Tone-map rendered linear radiance ONLY. Video EOTF + output sRGB is preserved.
 vec3 r=g.rgb/max(g.a,.0001);
 // Eight bounded depth neighbours; no blurred silhouettes or large AO halos.
 vec3 vp=viewPoint(uv0);vec3 n=normalize(cross(dFdx(vp),dFdy(vp)));if(dot(n,-vp)<0.)n=-n;
 float occ=0.;if(contact>.5&&texture2D(depthMap,uv0).x<.99999){
  float radius=clamp(.48*projectionScale/max(-vp.z,1.),.0006,.016);
  for(int j=0;j<8;j++){float angle=float(j)*.785398;vec2 uv=clamp(uv0+vec2(cos(angle)*.5625,sin(angle))*radius,vec2(.001),vec2(.999));vec3 d=viewPoint(uv)-vp;float len=length(d);occ+=max(dot(n,d/max(len,.001))-.17,0.)*(1.-smoothstep(.18,1.6,len));}
  r*=1.-min(.20,occ*.10);
 }
 r=clamp((r*(2.51*r+.03))/(r*(2.43*r+.59)+.14),0.,1.);
 gl_FragColor=vec4(r*g.a+c*(1.-g.a)*real,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});postScene=new T.Scene();postCamera=new T.Camera();postScene.add(new T.Mesh(new T.PlaneGeometry(2,2),post));
 size();paint(0);status.textContent='Choose a view or play the approved handover.';new ResizeObserver(()=>{size();if(!playing)paint(at)}).observe(stage);
}catch(e){failed=true;status.textContent='WebGL unavailable. Play the real footage using the fallback.';poster.style.display='block';console.error(e);}
let lastConcept='walk';function change(){pause();++token;if(lastConcept!==$('#concept').value){if(video.src.startsWith('blob:'))URL.revokeObjectURL(video.src);video.removeAttribute('src');video.load();loaded=false;videoPromise=null;lastConcept=$('#concept').value;}describe();if(renderer){selectOccluder();size();}paint(0);}
$('#lighting').onchange=()=>{pause();lightingState=selectLight($('#lighting').value);paint(at);};
$('#view').onchange=()=>{pause();inspection=$('#view').value;paint(0);};
$('#replay').onclick=play;$('#pause').onclick=()=>{pause();status.textContent='Paused.';};for(const id of ['concept','coverage','shutter','quality'])$('#'+id).onchange=change;
$('#scrub').oninput=e=>{inspection='handover';$('#view').value='handover';seek(+e.target.value).catch(e=>status.textContent=e.message);};$('#fullscreen').onclick=()=>stage.requestFullscreen?.();document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});new IntersectionObserver(([e])=>{if(!e.isIntersecting)pause();}).observe(stage);rm.addEventListener('change',change);video.onended=()=>{pause();status.textContent='End of the continuous drone shot.';};describe();
window.study={ready:!failed,
 runtime:()=>({T,model,world,foreground,camera,renderer,look}),
 renderPrevis(q,t=0){inspection='handover';externalPose=q;paint(t);},
 prepareVideo:loadVideo,seekVideo,video,
play,pause,seek,paint,concepts,entry,evaluatePath,
 async inspect(view,light='coastal'){pause();inspection=view;$('#view').value=view;$('#lighting').value=light;lightingState=selectLight(light);paint(0);paint(0);},
 materials:()=>look.assignments,
 diagnostics:()=>{let tris=0,calls=0;const mats=new Set();model.root.traverse(o=>{if(!o.isMesh)return;const n=o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count;tris+=n/3*(o.isInstancedMesh?o.count:1);calls++;mats.add(o.material.uuid);});return {buildingTriangles:tris,buildingMeshCalls:calls,buildingMaterialCount:mats.size,sharedMaterialFamilies:Object.keys(look.materials).length,rendererMemory:{...renderer.info.memory},glazing:{roughness:look.materials.glass.roughness,ior:look.materials.glass.ior,clearcoat:look.materials.glass.clearcoat,envMapIntensity:look.materials.glass.envMapIntensity},shadowAutoUpdate:renderer.shadowMap.autoUpdate};},
 lighting,views,
 inventory:()=>Object.fromEntries(Object.entries(model.groups).map(([name,g])=>[name,{notes:g.userData,objects:g.children.map(o=>({name:o.name,instanced:!!o.isInstancedMesh,count:o.isInstancedMesh?o.count:1}))}])),
 async configure(c,coverage='full',shutter='off'){$('#concept').value=c;$('#coverage').value=coverage;$('#shutter').value=shutter;change();},
 stats:()=>({...stats,time:at,videoTime:video.currentTime,cut:cut(),clear:current().clear,end:end(),fallback:fallback()}),
 coverage(t,q=null){const previousPose=externalPose;externalPose=q;pose(t);externalPose=previousPose;const ray=new T.Raycaster();let n=0,hits=0;foreground.updateMatrixWorld(true);for(let y=0;y<19;y++)for(let x=0;x<33;x++){ray.setFromCamera(new T.Vector2((x+.5)/33*2-1,(y+.5)/19*2-1),camera);hits+=ray.intersectObject(activeOccluder,false).length>0?1:0;n++;}return {time:t,coverage:hits/n,pose:q||evaluatePath(t)};}
};


