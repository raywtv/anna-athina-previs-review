// A0101 / A0802 / A1012 / A0301 and September IMG_7760–7761.
// Nominal sizes are scheduled; X/Z wall traces are rounded grid registrations.
export const serviceOpenings=[
 {id:'D9',function:'vehicle garage / vented panel lift',x:37.55,w:5.52,z:25.12,y:4.05,h:2.20,type:'panel-lift'},
 {id:'D10',function:'carpark pedestrian / fire-rated door',x:44.28,w:1,z:25.12,y:4.05,h:2.04,type:'hinged'},
 {id:'D12',function:'A Block Fire Stair 03 exit',x:48.60,w:1,z:27.80,y:3.95,h:2.04,type:'hinged'},
 {id:'D13',function:'paired louvred service access',x:49.94,w:1.64,z:26.98,y:3.95,h:2.04,type:'louvred-pair'},
 {id:'D14',function:'paired louvred service access',x:51.63,w:1.64,z:26.98,y:3.95,h:2.04,type:'louvred-pair'},
 {id:'D31',function:'residential garbage room roller door',x:54.04,w:1.50,z:28.90,y:3.95,h:2.10,type:'roller'},
 {id:'D32',function:'retail garbage room roller door',x:56.74,w:1.50,z:28.90,y:3.95,h:2.10,type:'roller'}
];
export const serviceTrace=[[37.1,23],[37.1,25.12],[45.6,25.12],[45.6,22.735],[47.88,22.735],[47.88,27.8],[49.88,27.8],[49.88,26.98],[53.50,26.98],[53.50,28.9],[59.8,28.9],[59.8,26.98]];
export function buildServiceFrontage({T,g,base,box,segment,solidQuad,mat}){
 const metal=new T.MeshLambertMaterial({color:0x3d4240});
 const mark=(o,role)=>{o.userData.assemblyRole=role;return o};
 const wall=(name,x,y,z,w,h,d)=>mark(box(g,name,x,y,z,w,h,d,mat.clay),'service-walls');
 // Actual aperture complements: no solid wall or glass behind door leaves.
 for(let i=1;i<serviceTrace.length;i++){
  const a=serviceTrace[i-1],b=serviceTrace[i];
  if(a[1]!==b[1]){const m=segment(g,'service wall return '+i,a,b,3.4,2.93,.20,mat.clay);mark(m,'service-walls');continue;}
  const lo=Math.min(a[0],b[0]),hi=Math.max(a[0],b[0]);
  const doors=serviceOpenings.filter(o=>o.z===a[1]&&o.x>=lo&&o.x+o.w<=hi);
  const cuts=[lo,hi,...doors.flatMap(o=>[o.x,o.x+o.w])].sort((a,b)=>a-b);
  for(let j=1;j<cuts.length;j++){const x=cuts[j-1],w=cuts[j]-x;if(w<.0001)continue;const o=doors.find(o=>x+w/2>o.x&&x+w/2<o.x+o.w);
   if(!o)wall('service solid pier '+i+'-'+j,x,3.4,a[1]-.1,w,2.93,.2);
   else{wall(o.id+' below-threshold support',x,3.4,a[1]-.1,w,o.y-3.4,.2);wall(o.id+' opening head',x,o.y+o.h,a[1]-.1,w,6.33-o.y-o.h,.2);}
  }
 }
 for(const o of serviceOpenings){
  const z=o.z-.055; // frame recessed inside 200 mm wall thickness
  const make=(n,x,y,zz,w,h,d,m=metal)=>mark(box(g,o.id+' '+n,x,y,zz,w,h,d,m),'service-doors');
  const frame=o.type==='hinged'?mat.clay:metal;
  const clearH=Math.min(o.h,6.235-o.y); // clear existing representative slab underside; nominal schedule retained above
  make('jamb L',o.x,o.y,z,.04,clearH,.045,frame);make('jamb R',o.x+o.w-.04,o.y,z,.04,clearH,.045,frame);make('frame head',o.x+.04,o.y+clearH-.04,z,o.w-.08,.04,.045,frame);
  make('recessed leaf',o.x+.04,o.y+.01,z-.035,o.w-.08,o.h-.05,.035,frame);
  if(o.type==='hinged')continue;
  if(o.type==='panel-lift'){
   // Restrained vertical ventilation rhythm, matching IMG_7761; no mechanics.
   for(let x=o.x+.10;x<o.x+o.w-.06;x+=.11)make('vented panel rib',x,o.y+.07,z+.006,.012,o.h-.15,.013);
   for(const t of [.72,1.44])make('panel joint',o.x+.04,o.y+t,z+.003,o.w-.08,.018,.018);
  }else{
   for(let y=o.y+.08;y<o.y+o.h-.05;y+=.085)make('horizontal shutter louvre',o.x+.04,y,z+.002,o.w-.08,.025,.018);
   if(o.type==='louvred-pair')make('paired-door meeting stile',o.x+o.w/2-.018,o.y+.02,z+.023,.036,o.h-.06,.025);
  }
 }
 // Supported, discrete circulation surfaces. The entrance ramp is untouched.
 const slab=(name,x0,x1,z0,z1,y0,y1,m=mat.base)=>solidQuad(base,name,[[x0,y0,z0],[x1,y0,z0],[x1,y1,z1],[x0,y1,z1]],3.15,m);
 slab('D9 garage threshold',37.45,43.17,25.02,25.22,4.05,4.05);
 slab('D9 garage driveway / near 1:20 local arrival',37.45,43.17,25.22,28.90,4.05,3.866);
 slab('D10 pedestrian threshold',44.18,45.38,25.02,25.22,4.05,4.05);
 slab('D10 pedestrian arrival',44.18,45.38,25.22,28.90,4.05,3.866);
 slab('D12 stair03 threshold',48.50,49.88,27.70,27.90,3.95,3.95);
 slab('D12 stair03 landing',48.50,49.88,27.90,28.90,3.95,3.852);
 slab('D13 D14 service threshold',49.88,53.50,26.88,27.08,3.95,3.95);
 slab('D13 D14 recessed service apron',49.88,53.50,27.08,28.90,3.95,3.852);
 slab('D31 D32 bin-room threshold',53.50,59.80,28.75,28.98,3.95,3.95);
 slab('D31 D32 bin-room apron',53.50,59.80,28.98,30.15,3.95,3.852);
 slab('service frontage footpath continuation',37.45,59.80,28.90,31.86,3.852,3.852);
 // Immediate kerb/road tie only: the former generic RL3.15 context otherwise
 // makes the evidenced threshold levels look like a raised podium. This is
 // restrained context grading, not surveyed civil levels or altered entry paths.
 solidQuad(base,'service-frontage kerb and road tie',[[37.45,3.702,31.86],[59.8,3.702,31.86],[59.8,3.0,40],[37.45,3.237,40]],2.8,mat.core);
 solidQuad(base,'service west footpath tie',[[34.9,3.624,28.9],[37.45,3.852,28.9],[37.45,3.852,31.86],[34.9,3.624,31.86]],3.15,mat.base);
 solidQuad(base,'service east footpath tie',[[59.8,3.852,28.9],[65.8,3.15,28.9],[65.8,3.15,31.86],[59.8,3.852,31.86]],3.15,mat.base);
 solidQuad(base,'service west road tie',[[34.9,3.474,31.86],[37.45,3.702,31.86],[37.45,3.237,40],[34.9,3.474,40]],2.8,mat.core);
 solidQuad(base,'service east road tie',[[59.8,3.702,31.86],[65.8,3.0,31.86],[65.8,3.0,40],[59.8,3.0,40]],2.8,mat.core);
 // Narrow kerbs/planting beds frame paths; no speculative decorative planting.
 for(const [x0,x1,z0]of [[43.25,44.08,25.15],[45.65,47.75,25.15]]){
  slab('service garden retained ground',x0,x1,z0,28.88,3.91,3.856,mat.garden);
 }
 g.userData.serviceFrontage={sources:['A0101 rev13','A0802 rev3','A1012','A0301','IMG_7760','IMG_7761'],openings:serviceOpenings,wallTrace:serviceTrace,certainty:'scheduled nominal sizes; rounded plan registration; louvres visually corroborated',retainedEntrance:'D1/D2/D7/D8 and ramp unchanged'};
}
