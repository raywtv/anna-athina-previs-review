// Certification Batch 1 only. Drawing metre coordinates, X grid 1→11, Z A→E.
// Set-outs rounded to 50/100 mm from A0102/03; clear opening sizes A0803/A0811.
// This is an exterior web reconstruction, not a fabrication/CAD export.
const W=(id,c,w,screen=false)=>({id,c,w,sill:.2,head:2.4,type:'window',screen});
const D=(id,c,w)=>({id,c,w,sill:0,head:2.4,type:'slider'});
const edge=(id,a,b,openings=[])=>({id,a,b,openings});
export const aMaps={
 2:[
  edge('rear U7 narrow',[31.35,6.1],[38,6.1],[W('U7 W3',35.05,.6),W('U7 W2',37.4,.6)]),
  edge('rear U7 return',[38,6.1],[38,6.5]),
  edge('rear U7 bedroom',[38,6.5],[41.4,6.5],[W('U7 W1',39.65,1.8,true)]),
  edge('rear U7-U6 return',[41.4,6.5],[41.4,6.1]),
  edge('rear U6 living',[41.4,6.1],[45.3,6.1],[W('U6 W1',43.45,1.8,true)]),
  edge('rear U6 balcony side',[45.3,6.1],[45.3,8.4],[D('U6 D5',7.25,1.8)]),
  edge('rear U6 balcony back',[45.3,8.4],[49,8.4],[D('U6 D4',47.05,2.4)]),
  edge('rear U6-U5 return',[49,8.4],[49,6.1]),
  edge('rear U5 bedroom1',[49,6.1],[53.05,6.1],[W('U5 W4',51.25,1.8,true)]),
  edge('rear U5 return west',[53.05,6.1],[53.05,7.15]),
  edge('rear U5 bedroom2',[53.05,7.15],[56.25,7.15],[W('U5 W3',54.75,1.8,true)]),
  edge('rear U5 return east',[56.25,7.15],[56.25,6.1]),
  edge('rear U5 living',[56.25,6.1],[60.5,6.1],[W('U5 W2',57.3,.9),W('U5 W1',59.5,.9)]),
  edge('east U5',[60.5,6.1],[60.5,14.55],[D('U5 D6',8.9,3.2),D('U5 D7',12.6,2.4)]),
  edge('east corridor shoulder',[60.5,14.55],[62.7,14.55]),
  edge('east U4 bedroom1',[62.7,14.55],[62.7,18.40],[D('U4 D5',16.35,2.4)]),
  edge('east U4 bedroom return',[62.7,18.40],[60.28,18.40]),
  edge('east U4 living',[60.28,18.40],[60.28,22.18],[D('U4 D6',20.166,3.2)]),
  edge('east U4 courtyard shoulder',[60.28,22.18],[57.5,22.18],[W('U4 W2',59.575,.9)]),
  edge('east U4 bedroom2',[57.5,22.18],[57.5,25.55],[W('U4 W1',24.25,.6)]),
  edge('front U4',[57.5,25.55],[53.5,25.55],[D('U4 D8',55.3,2.4)]),
  edge('front stair4 setback east',[53.5,25.55],[53.5,22.7]),
  edge('front stair4 head',[53.5,22.7],[48.3,22.7]),
  edge('front stair4 west',[48.3,22.7],[48.3,25.45]),
  edge('front U3 living',[48.3,25.45],[43.7,25.45],[D('U3 D2',45.8,3.2)]),
  edge('front U3 living return',[43.7,25.45],[43.7,23.35]),
  edge('front U3 bedroom2',[43.7,23.35],[40.15,23.35],[D('U3 D4',41.85,2.4)]),
  edge('front U3 bedroom return',[40.15,23.35],[40.15,24.6]),
  edge('front U3 bedroom1',[40.15,24.6],[36.7,24.6],[D('U3 D6',38.35,2.4)]),
  // The central stair/atrium assembly is separately certified and supplies this side.
  edge('west U7 lower side',[31.95,14.55],[31.95,10.3],[D('U7 D7',12.55,2.4)]),
  edge('west U7 side step',[31.95,10.3],[31.35,10.3]),
  edge('west U7 upper side',[31.35,10.3],[31.35,6.1],[D('U7 D6',8.45,2.4)])
 ],
 3:[
  edge('rear U12 living',[32.35,6.1],[36.65,6.1],[W('U12 W2',33.45,.9),W('U12 W1',35.5,.9)]),
  edge('rear U12 narrow return',[36.65,6.1],[36.65,7.15],[W('U12 W3',6.625,.8)]),
  edge('rear U12 bedroom3',[36.65,7.15],[39.7,7.15],[D('U12 D9',38.2,2.4)]),
  edge('rear U12 balcony step',[39.7,7.15],[39.7,7.75]),
  edge('rear U12 bedroom2-1',[39.7,7.75],[47.85,7.75],[D('U12 D7',42.15,2.4),D('U12 D5',45.95,2.4)]),
  edge('rear U11 bedroom1',[47.85,7.75],[53.15,7.75],[D('U11 D8',51.05,2.4)]),
  edge('rear U11 balcony step',[53.15,7.75],[53.15,7.15]),
  edge('rear U11 bedroom2',[53.15,7.15],[56.25,7.15],[D('U11 D6',54.7,2.4)]),
  edge('rear U11 narrow return',[56.25,7.15],[56.25,6.1],[W('U11 W3',6.625,.8)]),
  edge('rear U11 living',[56.25,6.1],[60.6,6.1],[W('U11 W2',57.3,.9),W('U11 W1',59.5,.9)]),
  edge('east U11',[60.6,6.1],[60.6,14.55],[D('U11 D4',8.9,3.2),D('U11 D3',12.55,2.4)]),
  edge('east corridor shoulder',[60.6,14.55],[63.5,14.55]),
  edge('east U10 bedroom1',[63.5,14.55],[63.5,18.2],[D('U10 D5',16.35,2.4)]),
  edge('east U10 bedroom return',[63.5,18.2],[61.4,18.2]),
  edge('east U10 living',[61.4,18.2],[61.4,22],[D('U10 D6',20.1,3.2)]),
  edge('east U10 bedroom2',[61.4,22],[61.4,25.2],[D('U10 D8',23.6,2.4)]),
  edge('front U10 bedroom2',[61.4,25.2],[57,25.2],[W('U10 W1',59.1,.9)]),
  edge('front U10 bedroom1',[57,25.2],[53.5,25.2],[D('U10 D10',55.25,2.4)]),
  edge('front stair4 setback east',[53.5,25.2],[53.5,22.7]),
  edge('front stair4 head',[53.5,22.7],[48.3,22.7]),
  edge('front stair4 west',[48.3,22.7],[48.3,25.2]),
  edge('front U9 living',[48.3,25.2],[43.7,25.2],[D('U9 D2',45.8,3.2)]),
  edge('front U9 living return',[43.7,25.2],[43.7,23.35]),
  edge('front U9 bedroom2',[43.7,23.35],[40.15,23.35],[D('U9 D4',41.85,2.4)]),
  edge('front U9 bedroom return',[40.15,23.35],[40.15,24.6]),
  edge('front U9 bedroom1',[40.15,24.6],[36.7,24.6],[D('U9 D6',38.35,2.4)]),
  edge('west U12',[32.35,14.55],[32.35,6.1],[D('U12 D10',12.55,2.4),D('U12 D11',8.9,3.2)])
 ]
};
export const bRear=[
 [W('U1 W1',3.7,.9),D('U1 D15',11.16,2.4),D('U1 D8',14.88,2.4),W('U1 W2',17.6,.9),W('U1 W3',20.3,.9),W('U1 W4',25.3,.9)],
 [W('U2 W5',11.2,1.8),W('U2 W4',15.2,1.8),W('U2 W3',17.6,.9),W('U2 W2',20.4,.9),W('U2 W1',25.3,.9)],
 [W('U8 W5',11.2,1.8),W('U8 W4',15.2,1.8),W('U8 W3',17.6,.9),W('U8 W2',20.4,.9),W('U8 W1',25.3,.9)]
];
// Six equal LV apertures A0810; numbering order is not claimed from the untagged plan.
export const carparkLouvres=[32.65,37.75,42.95,48,53.15,58.25].map((c,i)=>({id:'rear LV position '+(i+1),c,w:2,sill:.757,head:1.757,type:'louvre'}));

export function buildMappedWall(g,e,y,h,{T,segment,mat},options={}){
 const axis=Math.abs(e.b[0]-e.a[0])>Math.abs(e.b[1]-e.a[1])?0:1;
 const lo=Math.min(e.a[axis],e.b[axis]),hi=Math.max(e.a[axis],e.b[axis]);
 const at=v=>{const t=(v-e.a[axis])/(e.b[axis]-e.a[axis]);return e.a.map((v,i)=>v+(e.b[i]-v)*t)};
 const metal=mat.facadeMetal||(mat.facadeMetal=new T.MeshLambertMaterial({color:0x3d4240}));
 // Actual complementary wall intervals, with no separate piers subsequently
 // overlaid on the glass. Fixed nominal apertures must fit their explicit wall.
 for(const o of e.openings)if(o.c-o.w/2<lo+.099||o.c+o.w/2>hi-.099)throw Error('Scheduled aperture outside wall: '+e.id+' / '+o.id);
 const cuts=[lo,hi,...e.openings.flatMap(o=>[o.c-o.w/2,o.c+o.w/2])].sort((a,b)=>a-b);
 for(let i=1;i<cuts.length;i++){
  const a=cuts[i-1],b=cuts[i];if(b-a<1e-6)continue;
  const o=e.openings.find(o=>(a+b)/2>o.c-o.w/2&&(a+b)/2<o.c+o.w/2),p=at(a),q=at(b);
  if(!o){segment(g,e.id+' / opaque facade',p,q,y,h,.2,mat.clay);continue;}
  if(o.sill)segment(g,o.id+' / window sill wall',p,q,y,o.sill,.2,mat.clay);
  if(h>o.head)segment(g,o.id+' / window head wall',p,q,y+o.head,h-o.head,.2,mat.clay);
  if(o.type==='louvre'){
   // Through wall aperture; reusable narrow slats, no hidden carpark internals.
   for(let k=0;k<9;k++){const m=segment(g,o.id+' / louvre blade',p,q,y+o.sill+.035+k*.11,.045,.1,metal);m.userData.assemblyRole='facade-screens';}
  }else{
   segment(g,o.id+' / scheduled opening',p,q,y+o.sill,o.head-o.sill,.13,mat.glass);
  }
  // Reuse approved aluminium, without adding a material family or interior.
  const role=o.type==='louvre'?'facade-screens':'facade-frames';
  for(const v of [a+.025,b-.025,...(o.w>1.2?[(a+b)/2]:[])]){
   const p0=at(v-.02),p1=at(v+.02),m=segment(g,o.id+' / frame',p0,p1,y+o.sill,o.head-o.sill,.145,metal);m.userData.assemblyRole=role;
  }
  for(const v of [o.sill+.02,o.head-.02]){const m=segment(g,o.id+' / frame',p,q,y+v,.035,.145,metal);m.userData.assemblyRole=role;}
 }
 g.userData.scheduledOpenings??=[];
 g.userData.scheduledOpenings.push(...e.openings.map(o=>({...o,wall:e.id,a:at(o.c-o.w/2),b:at(o.c+o.w/2),rl:y,source:options.source||'A0102/03 + A0803/A0811'})));
}

export function buildAEnvelope(g,level,y,h,helpers){
 const {segment,mat}=helpers;
 for(const e of aMaps[level])buildMappedWall(g,e,y,h,helpers);
 // Front dividing wall shown on A0102/03 and IMG_7761; a solid return,
 // independent of the protected paired feature blades and outer balcony band.
 segment(g,'front privacy return / opaque facade',[53.5,25.55],[53.5,27.05],y,h,.2,mat.clay);
 // Rear screen set-outs: window screens on A2 and discrete sliding privacy
 // panels along the recessed A3 balconies. Slat pitch is simplified for web.
 const screens=level===2?aMaps[2].flatMap(e=>e.openings.filter(o=>o.screen).map(o=>({c:o.c,w:o.w,z:Math.min(e.a[1],e.b[1])-.32}))):[38.2,42.2,46.3,50.2,54.7].map(c=>({c,w:1.55,z:6.1}));
 for(const [i,s] of screens.entries()){
  for(let k=0;k<20;k++){const m=segment(g,'rear privacy screen '+i,[s.c-s.w/2,s.z],[s.c+s.w/2,s.z],y+.15+k*.112,.04,.075,mat.band);m.userData.assemblyRole='facade-screens';}
  for(const x of [s.c-s.w/2,s.c+s.w/2]){const m=segment(g,'rear privacy screen jamb',[x-.025,s.z],[x+.025,s.z],y+.13,2.22,.08,mat.band);m.userData.assemblyRole='facade-screens';}
 }
 // U6/11/12 balcony recessed boundaries: no new slab, no change to outer
 // balcony perimeter (AA-006 remains a separate batch). Add the evidenced
 // local guard at the actual balcony threshold, supported on the existing slab.
 const guards=level===2?[[[45.3,6.1],[49,6.1]]]:[[[36.65,6.1],[56.25,6.1]],[[47.85,6.1],[47.85,7.75]]];
 for(const [a,b] of guards){const m=segment(g,'rear recessed balcony / local glass guard',a,b,y+.1,1.0,.035,mat.rail);m.userData.assemblyRole='facade-guards';}
 g.userData.facade='Batch1 A0102/03 level-specific exterior partition; scheduled clear sizes; rounded plan registration';
}
