// Local coherent replacement: A0101/2, A1010/11, A0802 and A1041 details1–6.
// All absolute plan registration is rounded grid tracing, not a measured as-built survey.
export function buildEntryAssembly({T,base,lobby,core,box,plate,solidQuad,mat}){
 const add=(g,n,x,y,z,w,h,d,m,role)=>{const o=box(g,n,x,y,z,w,h,d,m);o.userData.assemblyRole=role;return o};
 const wall=(n,x,y,z,w,h,d)=>add(lobby,n,x,y,z,w,h,d,mat.clay,'entry-walls');
 const frameZ=22.975,glassZ=23.005,doorY=4.600,head=7.000;
 // A1041 vertical glazing/door plane at grid D+~300 (22.735+.300).
 // A0802 L1/D1: 1920 nominal double-leaf width x2400 high.
 const x0=30.04,x1=31.96;
 for(const x of [x0,31,x1])add(lobby,'L1 D1 lobby door frame',x-.04,doorY,frameZ,.08,2.40,.12,mat.band,'entry-doors');
 for(const y of [doorY,head-.08])add(lobby,'L1 D1 lobby transom',30,y,frameZ,2.0,.08,.12,mat.band,'entry-doors');
 for(const x of [30.08,31.04])add(lobby,'L1 D1 main entrance glass',x,doorY+.08,glassZ,.88,2.24,.06,mat.glass,'entry-doors');
 // Feature jambs form the narrow doorway and the broader outer porch; no opaque wall behind glass.
 wall('entry feature left jamb',29.25,3.15,22.915,.75,3.85,.20);
 wall('entry feature right jamb',32,3.15,22.915,.55,3.85,.20);
 const profileSolid=(name,x,w,profile,role)=>{const sh=new T.Shape();profile.forEach(([z,y],i)=>i?sh.lineTo(z,y):sh.moveTo(z,y));sh.closePath();const g=new T.ExtrudeGeometry(sh,{depth:w,bevelEnabled:false});const a=g.attributes.position;for(let i=0;i<a.count;i++){const z=a.getX(i),y=a.getY(i),d=a.getZ(i);a.setXYZ(i,x+w-d,y,z)}g.computeVertexNormals();const o=new T.Mesh(g,mat.clay);o.name=name;o.userData.assemblyRole=role;lobby.add(o);return o};
 for(const[x,w,label]of[[29.25,.36,'left'],[32.39,.16,'right']])profileSolid('entry feature '+label+' return',x,w,[[23.115,3.15],[24.675,3.15],[24.675,7.502],[23.527,7.000],[23.115,7.000]],'entry-walls');
 // Sides from the recessed curtain wall to adjacent staircase/frontage architecture.
 // Upper returns stop at the original adjacent core faces; nothing outside this bay moves.
 for(const [x,w]of[[29.25,.36],[32.39,.16]])add(lobby,'atrium side return',x,7.72,23.115,w,6.56,3.435,mat.clay,'atrium-returns');
 // A1041 clear1920 bays +200 spandrels; existing finish datum -80mm is retained at entrance.
 // Heights at upper spandrels use explicit RL9840 /11958 (not the entrance datum offset).
 const verifiedBays=[[7.72,9.64],[9.84,11.758],[11.958,13.878]];
 for(const [lo,hi]of verifiedBays){for(const x of [29.65,30.55,31.45,32.35])add(lobby,'A1041 atrium mullion',x-.04,lo,frameZ,.08,hi-lo,.12,mat.band,'atrium-glass');
  for(const y of [lo,hi-.08])add(lobby,'A1041 atrium transom',29.61,y,frameZ,2.78,.08,.12,mat.band,'atrium-glass');
  for(const x of [29.69,30.59,31.49])add(lobby,'A1041 atrium glazing bay',x,lo+.08,glassZ,.82,hi-lo-.16,.06,mat.glass,'atrium-glass');}
 for(const[lo,hi]of[[9.64,9.84],[11.758,11.958],[13.878,14.28]])add(lobby,'A1041 atrium spandrel',29.61,lo,22.915,2.78,hi-lo,.20,mat.clay,'atrium-returns');
 // A1041/5 dimensioned canopy profile, extruded across the entry width.
 // A1041 threshold4.60; the covered floor falls gently to locked stair/ramp4.52.
 // 1760 projection =1148 sloping underside +612 flat return; 502 rise to front underside.
 const back=22.915,front=back+1.760,low=head;
 const profile=[[back,low],[back+.612,low],[front,low+.502],[front,low+.617],[back+.600,low+.499],[back+.600,low+.330],[back+.300,low+.330],[back+.300,low+.690],[back+.120,low+.720],[back,low+.720]];
 const sh=new T.Shape();profile.forEach(([z,y],i)=>i?sh.lineTo(z,y):sh.moveTo(z,y));sh.closePath();
 const geo=new T.ExtrudeGeometry(sh,{depth:3.30,bevelEnabled:false});const a=geo.attributes.position;
 for(let i=0;i<a.count;i++){const z=a.getX(i),y=a.getY(i),x=a.getZ(i);a.setXYZ(i,32.55-x,y,z)}geo.computeVertexNormals();
 const canopy=new T.Mesh(geo,mat.clay);canopy.name='A1041 dimensioned sloped main-entry canopy';canopy.userData.assemblyRole='entry-canopy';lobby.add(canopy);
 // Replace projected floor patch with one clean supported main approach.
 solidQuad(base,'local main-entry threshold',[[29.55,4.60,22.80],[32.45,4.60,22.80],[32.45,4.60,23.115],[29.55,4.60,23.115]],3.15,mat.base);
 solidQuad(base,'local main-entry covered floor',[[29.55,4.60,23.115],[32.45,4.60,23.115],[32.45,4.52,27.42],[29.55,4.52,27.42]],3.15,mat.base);
 solidQuad(base,'B fire-stair threshold',[[27.55,4.60,25.10],[29.55,4.60,25.10],[29.55,4.60,25.45],[27.55,4.60,25.45]],3.15,mat.base);
 // B door landing falls gently to the locked ramp arrival; no new ramp topology.
 solidQuad(base,'B fire-stair landing / local fall',[[27.55,4.60,25.45],[29.55,4.60,25.45],[29.55,4.52,26.70],[27.55,4.52,26.70]],3.15,mat.base);
 solidQuad(base,'paired egress thresholds',[[32.55,3.92,24.97],[35.40,3.92,24.97],[35.40,3.92,25.17],[32.55,3.92,25.17]],3.15,mat.base);
 // Egress-side paving connects the two lower door thresholds to the existing footpath grade.
 solidQuad(base,'paired egress landing / local fall',[[32.55,3.92,25.17],[35.40,3.92,25.17],[35.40,3.58,29.15],[32.55,3.8427,29.15]],3.15,mat.base);
 // A0101 landscape pocket alongside the paired exit path; filled terrain meets its side edge.
 solidQuad(base,'local egress garden / retaining infill',[[35.40,3.92,25.17],[37.00,3.92,25.17],[37.00,3.429,29.15],[35.40,3.58,29.15]],3.15,mat.garden);
 // Stair upturn is a continuous supported side wall, not the old short isolated block.
 box(base,'main stair right continuous upturn',32.323,3.40,25.17,.20,1.72,3.00,mat.band);
 // Two separate true apertures in a recessed A fire-stair front wall.
 const openings=[[32.78,33.68,'L1 D7 basement-carpark exit'],[33.993,34.893,'L1 D8 A-block fire-stair exit']];
 let cursor=32.55;for(const[x0,x1,n]of openings){if(x0>cursor)wall('egress front pier',cursor,3.40,24.97,x0-cursor,3.23,.20);wall('egress head over '+n,x0,5.96,24.97,x1-x0,.67,.20);cursor=x1;}wall('egress right wall return',cursor,3.40,24.97,36.50-cursor,3.23,.20);
 wall('egress flank closure to existing facade',36.50,3.40,24.97,.60,3.23,.20);
 const door=(name,x,y,z)=>{
  add(lobby,name+' leaf',x+.04,y+.01,z,.82,2.00,.045,mat.core,'egress-doors');
  for(const u of[x,x+.86])add(lobby,name+' jamb',u,y,z-.03,.04,2.04,.10,mat.clay,'egress-doors');
  add(lobby,name+' head',x,y+2.00,z-.03,.90,.04,.10,mat.clay,'egress-doors');
 };
 door('L1 D2 B-block fire-stair',27.70,4.60,25.16);
 door('L1 D7 basement-carpark exit',32.78,3.92,25.04);
 door('L1 D8 A-block fire-stair exit',33.993,3.92,25.04);
 base.userData.coveredEntry={doorPlane:23.035,upperGlazingPlane:23.035,stairHead:27.42,stairToDoor:4.385,canopyFront:24.675,canopyProjection:1.760,doorSize:[1.920,2.400],doorDatum:4.600,stairDatum:4.520};
 lobby.userData.evidence={source:'A1041/1–6; A0101/2; A0802; A1010/11; IMG_7762–7769',registration:'Grid D+300 rounded; door and upper glazing aligned',doors:'D2 B stair; D7 lower carpark route; D8 upper A stair',slope:'502mm rise over1148mm;115mm outer edge;612mm flat back'};
}
