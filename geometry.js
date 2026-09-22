import * as T from './three.module.min.js';
import {slabVoids,groundWalls,poolGeometry} from './refinement-data.js';

// Drawing coordinate system, metres. X = grid 1 -> 11; Z = A -> E; Y = RL.
// Outlines traced against the 7.5 m grid in A0101–A0105 / A0901–A0905.
// Local edge locations are rounded to 0.05–0.10 m: this is not a CAD export.
export const levels={A:[3.4,6.63,9.63,12.7],B:[4.6,7.92,11.24,14.56],pool:14.4};
export const outlines={
 A1:[[30,3.8],[73.9,3.8,2.5],[65.5,28.9,1],[32.5,28.9],[32.5,23],[30,23]],
 A2:[[29.5,4.1],[75.4,4.1,2.5],[65.2,28.915,1],[36.7,28.915],[36.7,27.1],[32.7,27.1],[32.7,18.3],[29.5,18.3]],
 A3:[[29.6,6.1],[63.4,6.1],[63.4,14.45],[65.0,14.45],[62.2,27.2,1],[32.5,27.2],[32.5,18],[29.6,18]],
 B1:[[2.3,18],[26.8,18],[26.8,14.5],[30,14.5],[30,28],[20.1,28],[20.1,22.1],[15,22.1],[15,28],[2.3,28]],
 B2:[[0,17.5,1],[26.8,18.4],[26.8,14.5],[29.5,14.5],[29.5,27.25],[20.1,27.25],[20.1,22],[14.85,22],[14.85,27.25],[1.2,27.25,1]],
 B3:[[3.2,17.5,1],[26.8,18.2],[26.8,14.5],[29.5,14.5],[29.5,27.2],[20,27.2],[20,22],[14.85,22],[14.85,27.2],[2.1,27.2,1]],
 roofA:[[29,5.3],[64.3,5.3],[64.3,13.8],[66,13.8],[62.5,28.1],[36.4,28.1],[36.4,26.8],[29,26.8]],
 roofB:[[3.25,16.8],[20,16.8],[20,18.3],[26.3,18.3],[26.3,13.8],[32.5,13.8],[32.5,18.5],[39.2,18.5],[39.2,27.1],[19.25,27.1],[19.25,23],[15,23],[15,28.1],[3.25,28.1]]
};
export const pool={...poolGeometry,y:poolGeometry.waterY};
export function makeAnna(){
 const root=new T.Group();root.name='Anna Athina — metre coordinates';
 const groups={};const group=name=>{const g=new T.Group();g.name=name;root.add(g);groups[name]=g;return g;};
 const mat={clay:new T.MeshLambertMaterial({color:0xc6c3ba}),band:new T.MeshLambertMaterial({color:0xe8e5dc}),core:new T.MeshLambertMaterial({color:0xa3a7a5}),glass:new T.MeshLambertMaterial({color:0x586770}),rail:new T.MeshLambertMaterial({color:0xaebbc0}),pool:new T.MeshLambertMaterial({color:0x7c949c}),base:new T.MeshLambertMaterial({color:0x8b9191})};
 const cube=new T.BoxGeometry(1,1,1);
 const box=(g,name,x,y,z,w,h,d,m=mat.clay)=>{const mesh=new T.Mesh(cube,m);mesh.name=name;mesh.position.set(x+w/2,y+h/2,z+d/2);mesh.scale.set(w,h,d);g.add(mesh);return mesh;};
 const shape=pts=>{const s=new T.Shape();const n=pts.length;pts.forEach((p,i)=>{const prev=pts[(i+n-1)%n],next=pts[(i+1)%n],r=p[2]||0;const a=Math.hypot(prev[0]-p[0],prev[1]-p[1]),b=Math.hypot(next[0]-p[0],next[1]-p[1]);const u=[(prev[0]-p[0])/a,(prev[1]-p[1])/a],v=[(next[0]-p[0])/b,(next[1]-p[1])/b];const angle=Math.acos(Math.max(-1,Math.min(1,u[0]*v[0]+u[1]*v[1])));const t=Math.min(r/Math.tan(angle/2),a*.4,b*.4);const entry=[p[0]+u[0]*t,p[1]+u[1]*t],end=[p[0]+v[0]*t,p[1]+v[1]*t];if(i===0)s.moveTo(...entry);else s.lineTo(...entry);if(r){const rr=t*Math.tan(angle/2),bis=[u[0]+v[0],u[1]+v[1]],len=Math.hypot(...bis),d=rr/Math.sin(angle/2),c=[p[0]+bis[0]/len*d,p[1]+bis[1]/len*d];s.absarc(c[0],c[1],rr,Math.atan2(entry[1]-c[1],entry[0]-c[0]),Math.atan2(end[1]-c[1],end[0]-c[0]),u[0]*v[1]-u[1]*v[0]>0);}else s.lineTo(...end);});s.closePath();return s;};
 const plate=(g,name,pts,y,h,m=mat.band,holes=[])=>{const sh=shape(pts);for(const ring of holes){const path=new T.Path();ring.forEach((p,i)=>i?path.lineTo(...p):path.moveTo(...p));path.closePath();sh.holes.push(path);}const geom=new T.ExtrudeGeometry(sh,{depth:h,bevelEnabled:false,curveSegments:6});geom.rotateX(Math.PI/2);const mesh=new T.Mesh(geom,m);mesh.name=name;mesh.position.y=y;g.add(mesh);return mesh;};
 // Mitred offsets retain the traced roof footprint. A1033 profile: crest +300,
 // projected edge about -125/-265, underside -540 relative to roof RL.
 const inset=(pts,d)=>pts.map((p,i)=>{const a=pts[(i+pts.length-1)%pts.length],b=pts[(i+1)%pts.length],u=new T.Vector2(p[0]-a[0],p[1]-a[1]).normalize(),v=new T.Vector2(b[0]-p[0],b[1]-p[1]).normalize(),n1=new T.Vector2(-u.y,u.x),n2=new T.Vector2(-v.y,v.x),bis=n1.clone().add(n2);return [p[0]+bis.x*d/(1+n1.dot(n2)),p[1]+bis.y*d/(1+n1.dot(n2))];});
 const roof=(g,name,pts,y)=>{const inner=inset(pts,.865);const holes=name.startsWith('B')?[[[29.3,19.4],[31.95,19.4],[31.95,23.8],[29.3,23.8]]]:[];plate(g,name+' / inner plate',inner,y,.27,mat.band,holes);const profile=[[0,-.125],[.8,.3],[.865,.23],[.865,0],[.865,-.27],[.57,-.54],[0,-.265]],rings=profile.map(([d,h])=>inset(pts,d).map(p=>[p[0],y+h,p[1]]));const pos=[];for(let k=0;k<rings.length;k++)for(let i=0;i<pts.length;i++){const j=(i+1)%pts.length,l=(k+1)%rings.length;pos.push(...rings[k][i],...rings[k][j],...rings[l][j],...rings[k][i],...rings[l][j],...rings[l][i]);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.computeVertexNormals();const mesh=new T.Mesh(geo,mat.band);mesh.material.side=T.DoubleSide;mesh.name=name+' / A1033 tapered profile';g.add(mesh);};
 const segment=(g,name,a,b,y,h,thick,m)=>{const dx=b[0]-a[0],dz=b[1]-a[1];const mesh=new T.Mesh(cube,m);mesh.name=name;mesh.position.set((a[0]+b[0])/2,y+h/2,(a[1]+b[1])/2);mesh.scale.set(Math.hypot(dx,dz),h,thick);mesh.rotation.y=-Math.atan2(dz,dx);g.add(mesh);return mesh;};
 const boundary=(g,pts,y,h,thick,m,transfer=false)=>{const ps=shape(pts).getPoints(10);for(let i=1;i<ps.length;i++){const a=[ps[i-1].x,ps[i-1].y],b=[ps[i].x,ps[i].y],cuts=[0,1];if(transfer&&Math.abs(b[0]-a[0])>.001)for(const x of [62.5,69]){const t=(x-a[0])/(b[0]-a[0]);if(t>0&&t<1)cuts.push(t);}cuts.sort((a,b)=>a-b);for(let j=1;j<cuts.length;j++){const at=t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],u=at(cuts[j-1]),v=at(cuts[j]),mid=at((cuts[j]+cuts[j-1])/2),raise=transfer&&(mid[0]>69||(mid[0]>62.5&&mid[1]>20))?.57:0;segment(g,'perimeter',u,v,y+raise,h,thick,m);}}};
 // A0903 front Level-3A parapet: drawing heights, not a photographic fit.
 // Keep the existing traced outside plan/R1000. Replace only its front run/arc.
 const frontA3=(g,rail=false)=>{
  const p=outlines.A3[4],prev=outlines.A3[3],next=outlines.A3[5];
  const u=new T.Vector2(prev[0]-p[0],prev[1]-p[1]).normalize(),v=new T.Vector2(next[0]-p[0],next[1]-p[1]).normalize();
  const angle=Math.acos(u.dot(v)),t=1/Math.tan(angle/2),cut=p[1]+u.y*t;
  // The boundary cuboids are still individual meshes at this point.
  for(const m of [...g.children])if(m.isMesh&&m.name==='perimeter'){
   const dz=Math.abs(Math.sin(m.rotation.y)*m.scale.x/2);
   if(m.position.z-dz>=cut-.001)g.remove(m);
  }
  const samples=shape(outlines.A3).getPoints(10).map(q=>[q.x,q.y]);
  let path=samples.filter(q=>q[1]>=cut-.001&&q[0]>=32.499);
  // Ordered polygon samples pass around the corner and then along the front.
  const knots=[56.695,48.775,39.080];
  const end=path.pop();path.push(...knots.filter(x=>x<path[path.length-1][0]&&x>end[0]).map(x=>[x,27.2]),end);
  const top=x=>x<39.080||x>56.695?10.2:x<=48.775?10.2-(x-39.080)*.27/9.695:9.93+(x-48.775)*.27/7.920;
  const pos=[];const rings=path.map((q,i)=>{
   const a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)],tangent=new T.Vector2(b[0]-a[0],b[1]-a[1]).normalize();
   const nx=-tangent.y,nz=tangent.x,offset=rail?.2:0,width=rail?.035:.2,lo=rail?top(q[0]):9.13,hi=rail?10.68:top(q[0]);
   return [[q[0]+nx*offset,lo,q[1]+nz*offset],[q[0]+nx*offset,hi,q[1]+nz*offset],[q[0]+nx*(offset+width),hi,q[1]+nz*(offset+width)],[q[0]+nx*(offset+width),lo,q[1]+nz*(offset+width)]];
  });
  for(let i=1;i<rings.length;i++)for(let j=0;j<4;j++){const k=(j+1)%4;pos.push(...rings[i-1][j],...rings[i][j],...rings[i][k],...rings[i-1][j],...rings[i][k],...rings[i-1][k]);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.computeVertexNormals();const mesh=new T.Mesh(geo,rail?mat.rail:mat.band);mesh.material.side=T.DoubleSide;mesh.name='A0903 front parapet / R1000 / drawing height profile';g.add(mesh);
  g.userData.frontAudit={source:'A0903 front RL10200/9930; detail C 400 downstand; A1031 inside-face glazing',lowPointX:48.775,plan:'existing rounded trace retained',profile:'200 mm representative thickness; 50 mm lower rebate omitted'};
 };
 const base=group('site / visible base');plate(base,'simplified site',[[0,14],[25,14],[25,0],[79,0],[69,32],[0,32]],3.15,.25,mat.base);
 for(const side of ['A','B'])for(let i=0;i<3;i++){
  const g=group(`${side} / level ${i+1} / slab`);const y=levels[side][i];plate(g,`${side}${i+1} slab`,outlines[side+(i+1)],y,side==='A'&&i===1?.39:.27,mat.band,slabVoids[side+(i+1)]||[]);g.userData={stage:side==='A'&&i===1?'transfer':'floor',wing:side,level:i+1,thicknessStatus:side==='A'&&i===1?'390 mm representative A0902 zone; local thicknesses vary':'simplified'};
  if(i>0){const fas=group(`${side} / level ${i+1} / balcony bands`);boundary(fas,outlines[side+(i+1)],y-.30,.90,.15,mat.band,side==='A'&&i===1);const rails=group(`${side} / level ${i+1} / balustrades`);boundary(rails,outlines[side+(i+1)],y+.60,.45,.035,mat.rail,side==='A'&&i===1);fas.userData.source='A1031 parapet up to 600 mm, A0902/3 local heights vary; 600 mm representative, not universal as-built';}
 }
 frontA3(groups['A / level 3 / balcony bands']);frontA3(groups['A / level 3 / balustrades'],true);
 // A0902 explicitly distinguishes the outer north terrace SSL7200 from
 // interior SSL6630 and front balcony SSL6530. Its stepped inner boundary
 // is a rounded grid trace; the base transfer plate is retained underneath.
 const lowerTerrace=group('A / level 2 / raised north terrace');
 const northTerrace=[[69.0,4.1],[75.4,4.1,2.5],[65.2,28.915,1],[62.5,28.915],[62.5,26.1,1],[65.4,19.2],[67.0,15.0],[65.7,14.3],[69.0,6.6]];
 plate(lowerTerrace,'A0902 raised north terrace SSL7200',northTerrace,7.2,.29,mat.band);
 lowerTerrace.userData={source:'A0902 SSL7200',innerEdge:'rounded plan trace; needs detailed boundary validation',basePlateOverlap:'intentional simplified hidden support'};
 // Exterior-only enclosures. Recessed glass planes and solid piers; no interior rooms.
 const envelopes={
 A:[[32.7,6.3],[60.5,6.3],[60.5,18.8],[59,25.5],[45.4,25.5],[43.5,24.8],[37,24.8],[37,25.1],[32.7,25.1]],
 B:[[5.3,18.3],[26.8,18.3],[26.8,25],[20.2,25],[20.2,21.8],[14.8,21.8],[14.8,25],[5.3,25]]
 };
 for(const side of ['A','B'])for(let i=0;i<3;i++){
  const g=group(`${side} / level ${i+1} / enclosure`),y=levels[side][i],h=levels[side][i+1]-y-.3;
  if(side==='A'&&i===0){const pts=groundWalls.A;boundary(g,pts,y,h,.2,mat.glass);for(let x=41.5;x<67;x+=7.5)box(g,'podium pier',x,y,27.5,.45,h,.55);continue;}
  const pts=i===0?groundWalls.B:envelopes[side];boundary(g,pts,y,h,.13,mat.glass);
  for(let j=0;j<pts.length;j++){const p=pts[j];box(g,'solid exterior pier',p[0]-.18,y,p[1]-.18,.36,h,.36);}
  if(side==='A'){for(const [x,w] of [[37.5,1.2],[44,1.1],[50.5,1.1],[56.2,.7]])box(g,'solid facade panel',x,y,24.9,w,h,.5);box(g,'rear wall mass',34,y,6.3,2.4,h,.2);}
  else{box(g,'B solid recess',i===0?10.25:14.7,y,i===0?22.65:21.8,i===0?4.95:5.5,h,.3);box(g,'B end side wall',i===0?2.3:5.3,y,20, .3,h,1);box(g,'B bay major solid wall',i===0?2.3:5.3,y,i===0?25.2:24.8,i===0?4.9:1.1,h,.2);}
 }
 const core=group('cores / central connection');
 const shaft=(name,x,z,w,d,y,h)=>{box(core,name+' rear',x,y,z,w,h,.2,mat.core);box(core,name+' front',x,y,z+d-.2,w,h,.2,mat.core);box(core,name+' left',x,y,z+.2,.2,h,d-.4,mat.core);box(core,name+' right',x+w-.2,y,z+.2,.2,h,d-.4,mat.core);};
 shaft('lift core',29.50,14.30,3.03,3.32,3.4,12.40);shaft('B stair core',25.35,20.35,3.90,6.2,4.6,9.96);shaft('A stair enclosure',32.55,20.40,3.95,6.15,3.4,9.30);
 const lobby=group('connection / glazing and roof');box(lobby,'glazed lobby front',29.65,4.6,26.52,2.7,10.2,.08,mat.glass);
 for(const y of [4.6,7.92,11.24,14.3])box(lobby,'lobby transom',29.65,y,26.52,2.7,.10,.10,mat.band);for(const x of [29.65,31,32.25])box(lobby,'lobby mullion',x,3.4,26.52,.08,10.9,.10,mat.band);
 const supports=group('supports / structural columns');const blades=group('facade / architectural blades');for(const x of [8.9,9.45,47.55,48.1]){const isB=x<20;box(blades,'paired vertical facade blade',x,isB?4.6:3.4,isB?27.1:27.05,.18,isB?9.7:9.0,.55,mat.band);}
 // North-face pair, located along the angled exterior edge in A0903.
 for(const z of [20.05,20.6])box(blades,'north facade blade',63.55,3.4,z,.55,9.0,.18,mat.band);
 box(core,'upper connection wall',32.4,11.24,26.5,6.8,3.05,.3,mat.clay);
 for(const x of [39.9,47.4,54.9,61.7])box(supports,'ground column',x,3.4,27,.4,3.23,.5,mat.clay);
 for(const side of ['A','B']){const g=group(`${side} / roof plate and profile`),y=levels[side][3];roof(g,`${side} roof`,outlines['roof'+side],y);}
 const terrace=group('roof / raised terrace');
 // Four deck strips preserve the pool opening; a solid deck would occlude its surface.
 box(terrace,'deck rear',40.3,14.15,15.5,17.349,.25,pool.z-15.5,mat.band);
 box(terrace,'deck front',40.3,14.15,pool.z+pool.d,17.349,.25,24.47-pool.z-pool.d,mat.band);
 box(terrace,'deck left',40.3,14.15,pool.z,pool.x-40.3,.25,pool.d,mat.band);
 box(terrace,'deck right',pool.x+pool.w,14.15,pool.z,57.649-pool.x-pool.w,.25,pool.d,mat.band);
 boundary(terrace,[[40.3,15.5],[57.649,15.5],[57.649,24.385],[40.3,24.385]],12.7,1.7,.17,mat.clay);
 const shell=group('roof / pool shell');box(shell,'basin base (hidden approximation)',pool.x,pool.base,pool.z,pool.w,.2,pool.d,mat.core);boundary(shell,[[pool.x+.1,pool.z+.1],[pool.x+pool.w-.1,pool.z+.1],[pool.x+pool.w-.1,pool.z+pool.d-.1],[pool.x+.1,pool.z+pool.d-.1]],pool.base,pool.top-pool.base,.2,mat.core);
 const coping=group('roof / pool coping');plate(coping,'coping ring',[[pool.x,pool.z],[pool.x+pool.w,pool.z],[pool.x+pool.w,pool.z+pool.d],[pool.x,pool.z+pool.d]],pool.top,.07,mat.band,[[[pool.x+.2,pool.z+.2],[pool.x+pool.w-.2,pool.z+.2],[pool.x+pool.w-.2,pool.z+pool.d-.2],[pool.x+.2,pool.z+pool.d-.2]]]);
 const pg=group('roof / pool water');box(pg,'water plane (finish inset provisional)',pool.x+.2,pool.y-.02,pool.z+.2,pool.w-.4,.02,pool.d-.4,mat.pool);
 const fence=group('roof / terrace balustrades');boundary(fence,[[40.3,15.5],[57.649,15.5],[57.649,24.385],[40.3,24.385]],14.4,1.05,.04,mat.rail);
 // Repeated fence posts share a single draw call.
 const postPositions=[];for(let x=40.3;x<=57.65;x+=1.3)for(const z of [15.5,24.385])postPositions.push([x,z]);for(let z=16.8;z<24.385;z+=1.3)for(const x of [40.3,57.649])postPositions.push([x,z]);const posts=new T.InstancedMesh(cube,mat.band,postPositions.length);const dummy=new T.Object3D();postPositions.forEach(([x,z],i)=>{dummy.position.set(x,14.95,z);dummy.scale.set(.045,1.1,.045);dummy.updateMatrix();posts.setMatrixAt(i,dummy.matrix);});posts.name='instanced pool fence posts';fence.add(posts);
 const access=group('roof / access and large service masses');const accessOutline=[[32.525,15.78],[35.622,15.78],[35.622,19.578],[38.513,19.578],[38.513,25.117],[32.525,25.117]];plate(access,'A0905 access body to SSL15290',accessOutline,15.29,.89,mat.clay);boundary(access,accessOutline,15.29,.2,.2,mat.band);plate(access,'A0905 lift head SSL15600',[[29.295,15.78],[32.525,15.78],[32.525,17.83],[29.295,17.83]],15.6,.2,mat.clay);boundary(access,[[29.395,15.88],[32.425,15.88],[32.425,17.73],[29.395,17.73]],15.6,.2,.2,mat.band);access.userData={source:'A0905: grid 5 +2525, +200+5588+200; grid D +2182+200; SSL15290/TOW15490 and SSL15600/TOW15800',status:'dimension-chain reconstruction; no photographic deformation'};box(access,'north service projection',60.1,12.7,6.8,1.5,1.9,1.8,mat.core);box(lobby,'A1034 glazed lobby roof',29.25,14.86,18.2,3.53,.12,5.6,mat.glass);
 const screens=group('B / ground privacy screens');const positions=[];for(let x=1.3;x<29;x+=.085)positions.push([x,28.9]);for(let z=18;z<28.9;z+=.085)positions.push([1.3,z]);const slats=new T.InstancedMesh(cube,mat.core,positions.length);positions.forEach(([x,z],i)=>{dummy.position.set(x,4.977,z);dummy.scale.set(.035,1.8,.06);dummy.updateMatrix();slats.setMatrixAt(i,dummy.matrix);});screens.add(slats);screens.userData={pitch:.085,base:4.077,status:'A0106 exterior RL4.077 plus 1.8m fence; pitch is visual approximation, not fabrication dimensions'};
 // Consolidate repeated cuboids only WITHIN each architectural group and material.
 // A/B levels, slabs, envelope, roof and pool remain independently addressable.
 for(const g of Object.values(groups)){
  const batches=new Map();for(const m of [...g.children])if(m.isMesh&&!m.isInstancedMesh&&m.geometry===cube){if(!batches.has(m.material))batches.set(m.material,[]);batches.get(m.material).push(m);}
  for(const [material,meshes] of batches)if(meshes.length>1){const batch=new T.InstancedMesh(cube,material,meshes.length);batch.name=g.name+' / cuboids';batch.userData.parts=meshes.map(m=>m.name);meshes.forEach((m,i)=>{m.updateMatrix();batch.setMatrixAt(i,m.matrix);g.remove(m);});g.add(batch);}
 }
 root.userData={units:'metres',sources:['A0101–A0105','A0901–A0905','A0301–A0302','A1033'],groups:Object.keys(groups)};
 return {root,groups};
}


