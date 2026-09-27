import * as T from './three.module.min.js';
import {outlines} from './geometry.js';
const clamp=T.MathUtils.clamp,mix=T.MathUtils.lerp;
const ramp=(p,a,b)=>clamp((p-a)/(b-a),0,1);
const ease=x=>x*x*(3-2*x);

// Animation ledger, not a replacement building. All matrices/buffers remain frozen.
// These are architectural intervals within evidence gaps, not a pour programme.
export function createConstruction(rt){
 const {T:unused,model,world,renderer,look}=rt;
 const records=[],temporary=new T.Group();temporary.name='Construction-only state controls';world.add(temporary);
 renderer.localClippingEnabled=true;
 const palette={slab:0xb4b1a6,wall:0xa9aaa2,core:0xa5a79f,formed:0x95846c,wet:0x92988f};
 function schedule(name,final){
  const B=name.startsWith('B'),level=+(name.match(/level (\d)/)?.[1]||1);
  if(name==='site / visible base')return[0,.025,.70,.755];
  if(name.includes('balustrade'))return[B?.719:.731,B?.74:.757,.72,.757];
  if(name.includes('privacy screens'))return[.722,.748,.722,.748];
  if(name.includes('/ enclosure')){
   if(final===look.materials.glass){const a=(B?.687:.704)+(level-1)*.01;return[a,a+.019,a,a+.019];}
   const a=(B?[.137,.218,.48]:[.14,.444,.553])[level-1];return[a,a+(level===1?.039:.043),(B?.686:.702)+(level-1)*.008,(B?.725:.745)+(level-1)*.008];
  }
  if(name.includes('/ slab')||name.includes('balcony bands')){
   const a=(B?[.093,.186,.446]:[.068,.285,.52])[level-1],band=name.includes('balcony');
   // Slab first, its in-place concrete edge second. No outward translation.
   const offset=band?.024:0;return[a+offset,a+offset+(B||level!==2?.031:.06),(B?.69:.708)+(level-1)*.006,(B?.729:.75)+(level-1)*.005];
  }
  if(name.includes('raised north terrace'))return[.397,.435,.718,.755];
  if(name.includes('structural columns'))return[.14,.18,.708,.748];
  if(name.includes('cores /'))return[.54,.579,.712,.752];
  if(name.includes('connection / glazing'))return[.724,.75,.724,.75];
  if(name.includes('architectural blades'))return[.563,.606,.722,.758];
  if(name.includes('roof plate'))return[B?.603:.625,B?.63:.652,.72,B?.75:.756];
  if(name.includes('raised terrace'))return final===look.materials.tile?[.65,.679,.731,.758]:[.621,.65,.731,.758];
  if(name.includes('pool shell'))return[.661,.68,.737,.758];
  if(name.includes('pool coping'))return[.743,.754,.743,.754];
  if(name.includes('pool water'))return[.756,.768,.756,.768];
  if(name.includes('access and'))return[.64,.672,.731,.758];
  return[.685,.729,.713,.755];
 }
 // Keep the final shader (including the approved glazing callback) on each
 // cloned material. Earlier concrete changes response, not final shader identity.
 function interim(final,plane,kind,glass){
  const m=final.clone();m.name='Construction state / '+final.name;
  m.clippingPlanes=[plane];m.clipShadows=true;
  const finish={value:0},concrete={value:new T.Color(palette[kind]||palette.slab)};
  const original=final.onBeforeCompile.bind(final),cache=final.customProgramCacheKey.bind(final);
  m.onBeforeCompile=s=>{original(s);if(!glass){s.uniforms.constructionFinish=finish;s.uniforms.constructionTone=concrete;
   s.fragmentShader='uniform float constructionFinish;uniform vec3 constructionTone;\n'+s.fragmentShader;
   // After baseline colour assignment, before lighting. Clean mineral concrete;
   // no grunge/noise and no fake reinforcement/formwork pattern.
   s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`diffuseColor.rgb=mix(constructionTone,diffuseColor.rgb,constructionFinish);\n#include <roughnessmap_fragment>`);
  }};
  m.customProgramCacheKey=()=>cache()+'-construction-v1-'+(glass?'glass':'solid');
  return {m,finish,concrete};
 }
 model.root.traverse(o=>{if(!o.isMesh)return;const name=o.parent.name,final=o.material;
  const glass=[look.materials.glass,look.materials.rail,look.materials.pool].includes(final);
  const kind=name.includes('cores')||name.includes('pool shell')?'core':name.includes('enclosure')?'wall':'slab';
  const box=new T.Box3().setFromObject(o),plane=new T.Plane(new T.Vector3(0,-1,0),100);
  // The repaired curve was formerly part of this group's cuboid batch.
  // Keep its shared construction front instead of revealing a tiny standalone
  // corner before the supporting slab has reached it. Timing is unchanged.
  if(name==='B / level 3 / balcony bands'&&o.parent.children.some(m=>m.userData.contactRepair))box.setFromObject(o.parent);
  // Thin plates resolve in plan from the connection outward. Height clipping a
  // thin slab exposes its underside as a false top and produces self-shadow bands.
  // This is a schematic zone reveal, not a claimed concrete pour-front direction.
  const planar=name.includes('/ slab')||name.includes('balcony bands')||name.includes('roof plate')||name.includes('raised north terrace')||name==='site / visible base'||name.includes('raised terrace');
  if(planar)plane.normal.set(name.startsWith('B')?1:-1,0,0);
  const material=interim(final,plane,kind,glass);
  // Set transparency before shader precompilation. Changing it only during the
  // first update leaves an opaque-program variant cached and defeats opacity.
  if(name.includes('pool water')){material.m.transparent=true;material.m.depthWrite=false;material.m.opacity=0;}
  // Prefer the slab surface over coplanar column tops in the temporary state.
  // This is raster depth ordering, not altered support/slab geometry.
  if(name.includes('/ slab')){material.m.polygonOffset=true;material.m.polygonOffsetFactor=-1;material.m.polygonOffsetUnits=-1;}
  records.push({o,name,final,glass,kind,box,plane,planar,...material,timing:o.userData.assemblyRole==='service-walls'?[.14,.179,.702,.745]:o.userData.assemblyRole==='service-doors'?[.716,.745,.716,.745]:o.userData.assemblyRole==='entry-walls'?[.18,.25,.712,.752]:o.userData.assemblyRole==='atrium-returns'?[.54,.60,.712,.752]:o.userData.assemblyRole==='entry-canopy'?[.641,.667,.724,.753]:o.userData.assemblyRole==='egress-doors'?[.716,.745,.716,.745]:schedule(name,final),cast:o.castShadow});
 });
 const core=records.find(r=>r.name==='cores / central connection'&&r.o.isInstancedMesh),corePieces=[];
 const capGeometry=new T.PlaneGeometry(1,1);capGeometry.rotateX(-Math.PI/2);
 const capMaterial=new T.MeshStandardMaterial({name:'Temporary shaft cut surface',color:palette.core,roughness:.91});
 if(core)for(const prefix of ['lift core','B stair core','A stair enclosure']){
  const indices=core.o.userData.parts.map((s,i)=>s.startsWith(prefix)?i:-1).filter(i=>i>=0);
  const plane=new T.Plane(new T.Vector3(0,-1,0),0),material=interim(core.final,plane,'core',false);
  const mesh=new T.InstancedMesh(core.o.geometry,material.m,indices.length),matrix=new T.Matrix4();
  indices.forEach((idx,i)=>{core.o.getMatrixAt(idx,matrix);mesh.setMatrixAt(i,matrix)});
  mesh.castShadow=true;mesh.receiveShadow=true;mesh.name='Temporary height control / '+prefix;temporary.add(mesh);
  const caps=new T.InstancedMesh(capGeometry,capMaterial,indices.length),capParts=[];
  indices.forEach(idx=>{core.o.getMatrixAt(idx,matrix);const position=new T.Vector3(),rotation=new T.Quaternion(),scale=new T.Vector3();matrix.decompose(position,rotation,scale);capParts.push({position,scale})});
  caps.name='Temporary shaft cut surface / '+prefix;caps.receiveShadow=true;caps.frustumCulled=false;temporary.add(caps);
  corePieces.push({mesh,caps,capParts,plane,prefix,...material});
 }
 // Presentation cleanup: no schematic set-out/reference line objects.
 let lastKey='';const capTransform=new T.Object3D(),wetTone=new T.Color(palette.wet),dryTone=new T.Color(palette.slab);
 function update(p){
  for(const r of records){const [a,b,c,d]=r.timing,rev=ease(ramp(p,a,b)),f=ease(ramp(p,c,d));
   r.o.visible=rev>0;r.plane.constant=r.planar?(r.name.startsWith('B')?-mix(r.box.max.x+.008,r.box.min.x-.008,rev):mix(r.box.min.x-.008,r.box.max.x+.008,rev)):mix(r.box.min.y-.008,r.box.max.y+.008,rev);
   if(r.name.includes('pool water')){r.plane.constant=100;r.m.transparent=true;r.m.depthWrite=false;r.m.opacity=rev;r.o.castShadow=false;}
   r.finish.value=f;r.concrete.value.set(palette[r.kind]);
   // Preparation and pour share the SAME actual deck/void geometry. Only the
   // material state resolves; no duplicated slab pops at the milestone.
   if(r.name==='A / level 2 / slab'||r.name==='A / level 2 / balcony bands'){
    const pour=ease(ramp(p,.37,.432)),cure=ease(ramp(p,.432,.48));
    r.concrete.value.set(palette.formed).lerp(wetTone,pour).lerp(dryTone,cure);
   }
   r.m.roughness=mix(r.name==='A / level 2 / slab'?mix(.95,.79,ease(ramp(p,.37,.432))):.91,r.final.roughness??.8,f);
   if(r.glass)r.m.roughness=r.final.roughness;
   r.m.metalness=r.glass?r.final.metalness:mix(0,r.final.metalness??0,f);
   // Retain final opacity; installation is an in-place mask, not a glass colour fade.
   r.o.material=(f>=1&&rev>=1)?r.final:r.m;
   // Thin deck surfaces resolve laterally; no fully formed shadow before a surface exists.
   r.o.castShadow=r.cast&&(rev>=1||!r.name.includes('raised terrace'));
  }
  if(core){const top=ease(ramp(p,.44,.579));core.o.visible=p>=.579;
   for(const c of corePieces){c.mesh.visible=p>.14&&p<.579;c.caps.visible=c.mesh.visible;
    const b=c.prefix==='B stair core',start=b?4.6:3.4;
    const lower=mix(start,b?10.8:6.63,ease(ramp(p,.14,b?.26:.27)));
    const max=b?14.56:c.prefix==='lift core'?15.8:12.7;
    c.plane.constant=mix(lower,max+.01,top);
    c.capParts.forEach(({position,scale},i)=>{capTransform.position.set(position.x,Math.min(c.plane.constant-.001,position.y+scale.y/2),position.z);const active=c.plane.constant>position.y-scale.y/2+.001;capTransform.scale.set(active?scale.x:0,1,active?scale.z:0);capTransform.updateMatrix();c.caps.setMatrixAt(i,capTransform.matrix)});c.caps.instanceMatrix.needsUpdate=true;
   }
  }
  const key=records.map(r=>`${+r.o.visible},${r.plane.constant.toFixed(3)}`).join('|')+corePieces.map(c=>c.plane.constant.toFixed(3)).join('|');
  if(key!==lastKey){renderer.shadowMap.needsUpdate=true;lastKey=key;}
  return {progress:p,completed:p>=.77,groups:Object.fromEntries(Object.entries(model.groups).map(([n,g])=>[n,g.children.filter(o=>o.visible).length])),materialsRestored:records.every(r=>r.o.material===r.final),temporaryVisible:temporary.children.filter(o=>o.visible).map(o=>o.name)};
 }
 return {update,records,temporary,inventory:()=>records.map(r=>({group:r.name,mesh:r.o.name,timing:r.timing,material:r.final.name,kind:r.kind,bounds:{min:r.box.min.toArray(),max:r.box.max.toArray()}}))};
}
