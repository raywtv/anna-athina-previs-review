import * as T from './three.module.min.js';

export const lighting={
 coastal:{label:'Coastal daylight',sky:0xb4cddd,ground:0x706b60,sun:0xfff4df,p:[-28,65,60],key:2.55,fill:.78,env:.65,background:0xb5cbd4},
 warm:{label:'Warm afternoon',sky:0xc2cdd3,ground:0x79705f,sun:0xffe1b7,p:[-45,33,58],key:2.4,fill:.75,env:.60,background:0xc6cbd0},
 soft:{label:'Soft daylight',sky:0xc8d5dc,ground:0x77756d,sun:0xf4f6f5,p:[-20,75,45],key:1.05,fill:1.25,env:.75,background:0xbfcdd0}
};
export const views={
 hero:{label:'Hero three-quarter',p:[110,43,90],a:[39,7,18],f:33},
 fascia:{label:'Curved balcony / fascia',p:[80,19,48],a:[59,10,23],f:43},
 glazing:{label:'Glazing and façade',p:[20,10,43],a:[17,9,24],f:44},
 roof:{label:'Roof terrace / pool',p:[67,37,44],a:[46,13,20],f:43},
 blade:{label:'Approved blade approach',t:2.4},
 final:{label:'Last 3D frame / full cover',t:2.96},
 handover:{label:'Approved moving handover',t:0}
};

// Material-space surface response only: no positions, geometry or camera changes.
function finishShader(material,mode){
 material.onBeforeCompile=s=>{
  s.vertexShader='varying vec3 surfacePoint; varying vec3 worldPoint; varying vec3 panelSize; varying vec3 facadeTangent; varying vec3 facadeUp;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   surfacePoint=position; vec4 wp=vec4(position,1.);panelSize=vec3(1.);
   #ifdef USE_INSTANCING
    wp=instanceMatrix*wp;panelSize=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));
   #endif
   worldPoint=(modelMatrix*wp).xyz;
   mat4 basis=modelMatrix;
   #ifdef USE_INSTANCING
    basis=modelMatrix*instanceMatrix;
   #endif
   facadeTangent=normalize(basis[0].xyz);facadeUp=normalize(basis[1].xyz);`);
  s.fragmentShader='varying vec3 surfacePoint; varying vec3 worldPoint; varying vec3 panelSize; varying vec3 facadeTangent; varying vec3 facadeUp;\n'+s.fragmentShader;
  // No high-frequency colour noise: it aliases at the architectural viewing distances.
  const renderTexture='';
  const glazing=`
   float panes=max(1.,floor(panelSize.x/2.2+.5));
   float u=(surfacePoint.x+.5)*panes;
   float seam=min(fract(u),1.-fract(u))*panelSize.x/panes;
   float aa=max(.006,fwidth(seam));
   float frame=1.-smoothstep(.038-aa,.038+aa,seam);
   float edgeY=(.5-abs(surfacePoint.y))*panelSize.y;
   float ay=max(.007,fwidth(edgeY));
   float horizontal=1.-smoothstep(.039-ay,.039+ay,edgeY);
   float frameMask=max(frame,horizontal);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.050,.056,.053),frameMask);`;
  const band=`
   float level=worldPoint.x<30.? (worldPoint.y<9.?7.92:11.24) : (worldPoint.y<8.7?6.63:9.63);
   float lower=1.-smoothstep(level+.04,level+.08,worldPoint.y);
   diffuseColor.rgb*=mix(vec3(1.),vec3(.82,.83,.81),lower);`;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+renderTexture+(mode==='glazing'?glazing:mode==='band'?band:''));
  if(mode==='glazing')s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`
   // Surface-only room-box approximation. No vertices, interiors or camera changes.
   vec3 V=normalize(vViewPosition);vec3 N=normalize(normal);
   float incidence=clamp(dot(N,V),0.,1.);
   float fresnel=.04+.96*pow(1.-incidence,5.);
   vec3 W=inverseTransformDirection(V,viewMatrix);
   vec3 wn=inverseTransformDirection(N,viewMatrix);
   vec3 tangent=normalize(facadeTangent),up=normalize(facadeUp);
   // Refraction reduces apparent room parallax; local axes follow each facade.
   vec3 ray=vec3(-dot(W,tangent),-dot(W,up),-sqrt(max(.01,2.25-1.+incidence*incidence)));
   float rooms=max(1.,floor(panes*.5));float roomWidth=panelSize.x/rooms;
   vec3 roomP=vec3((fract((surfacePoint.x+.5)*rooms)-.5)*roomWidth,surfacePoint.y*panelSize.y,0.);
   vec3 bounds=vec3(roomWidth*.5,panelSize.y*.5,3.2);
   vec2 raySign=mix(vec2(-1.),vec2(1.),step(vec2(0.),ray.xy));
   vec3 distanceTo=vec3((raySign.x*bounds.x-roomP.x)/(ray.x+raySign.x*.00001),(raySign.y*bounds.y-roomP.y)/(ray.y+raySign.y*.00001),-bounds.z/ray.z);
   float travel=min(distanceTo.x,min(distanceTo.y,distanceTo.z));
   vec3 hit=roomP+ray*travel;
   float sideWall=1.-step(distanceTo.z,min(distanceTo.x,distanceTo.y));
   float ceiling=step(distanceTo.y,distanceTo.x)*step(distanceTo.y,distanceTo.z)*step(0.,ray.y);
   float floorHit=step(distanceTo.y,distanceTo.x)*step(distanceTo.y,distanceTo.z)*step(ray.y,0.);
   vec3 interior=mix(vec3(.027,.030,.029),vec3(.082,.076,.063),sideWall);
   interior=mix(interior,vec3(.15,.148,.13),ceiling);
   interior=mix(interior,vec3(.075,.057,.038),floorHit);
   // Natural falloff into an unoccupied recess, not alternating pane colours.
   interior*=mix(.55,1.,exp(hit.z*.28));
   // A recessed sheer at one side of each room, continuous across its panes.
   // Based on visible pale sheers; position/pleats are an authored approximation.
   float rear=step(distanceTo.z,min(distanceTo.x,distanceTo.y));
   float sheer=rear*smoothstep(bounds.x*.23,bounds.x*.32,hit.x);
   float pleat=.88+.12*cos(hit.x*74.)*(1.-smoothstep(.7,2.5,fwidth(hit.x*74.)));
   interior=mix(interior,vec3(.20,.184,.149)*pleat,sheer*.55);
   float corner=min(bounds.x-abs(hit.x),bounds.y-abs(hit.y));
   interior*=mix(.76,1.,smoothstep(0.,.2,corner));
   vec3 R=inverseTransformDirection(reflect(-V,N),viewMatrix);
   float horizon=smoothstep(-.07,.10,R.y);
   vec3 reflectedSky=mix(vec3(.10,.12,.105),vec3(.70,.88,1.02),horizon);
   float cloud=pow(.5+.5*sin(R.x*8.+R.z*3.+sin(R.y*9.)),6.)*smoothstep(.03,.4,R.y);
   reflectedSky+=cloud*vec3(.20,.17,.12);
   // Shared directional horizon information, never randomised by window.
   // Soft vegetation-like silhouettes represent unmeasured coastal surroundings.
   float az=atan(R.z,R.x);
   float crown=.12+.085*sin(az*13.)+.055*sin(az*29.+.7)+.027*sin(az*61.);
   float foliage=(1.-smoothstep(crown-.025,crown+.025,R.y))*smoothstep(-.16,-.04,R.y);
   float lightLeaf=.5+.5*sin(az*93.+R.y*38.)*sin(az*41.-R.y*59.);
   reflectedSky=mix(reflectedSky,mix(vec3(.065,.092,.073),vec3(.18,.225,.145),lightLeaf),foliage*.83);
   // Nearby balcony soffit cuts the reflected sky, creating a coherent edge.
   // Representative projection only; no assertion of measured reflection geometry.
   float outward=max(.06,dot(R,wn));
   float riseToSoffit=(.5-surfacePoint.y)*panelSize.y;
   float soffit=step(.001,R.y)*(1.-smoothstep(1.45,1.75,riseToSoffit/R.y*outward));
   reflectedSky=mix(reflectedSky,vec3(.105,.112,.107),soffit);
   float reflectionWeight=clamp(.11+fresnel*.88,.11,.92);
   vec3 glassLight=interior*(1.-reflectionWeight)+reflectedSky*reflectionWeight;
   // Retain a bounded physical-light response, including facade shading.
   glassLight+=outgoingLight*.10;
   outgoingLight=mix(glassLight,outgoingLight,frameMask);
   #include <opaque_fragment>`);
  if(mode==='render'||mode==='band')s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`
   // Suppress excessive hemisphere fill on sheltered undersides, not black AO.
   vec3 wn=inverseTransformDirection(normal,viewMatrix);
   outgoingLight*=mix(.80,1.,smoothstep(-.85,-.05,wn.y));
   #include <opaque_fragment>`);
  if(mode==='water')s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`
   float edge=min((.5-abs(surfacePoint.x))*panelSize.x,(.5-abs(surfacePoint.z))*panelSize.z);
   float edgeShade=mix(.74,1.,smoothstep(0.,.45,edge));
   vec3 V=normalize(vViewPosition);float f=.02+.98*pow(1.-clamp(dot(normal,V),0.,1.),5.);
   vec3 R=inverseTransformDirection(reflect(-V,normal),viewMatrix);
   vec3 sky=mix(vec3(.12,.22,.23),vec3(.42,.58,.67),smoothstep(-.05,.6,R.y));
   outgoingLight=mix(outgoingLight*edgeShade,sky,clamp(f*.9,.04,.75));
   #include <opaque_fragment>`);
 };
 material.customProgramCacheKey=()=>mode;
 return material;
}
export function applyLook(model){
 const standard=(name,color,roughness,extra={})=>new T.MeshStandardMaterial({name,color,roughness,...extra});
 const materials={
  wall:finishShader(standard('Silver Chest / digital approximation',0xa9aaa1,.82),'render'),
  pale:finishShader(standard('Surfmist / digital approximation',0xddddd2,.70,{side:T.DoubleSide}),'render'),
  band:finishShader(standard('Surfmist upper / Silver Chest lower',0xdadbd0,.68,{side:T.DoubleSide}),'band'),
  glass:finishShader(new T.MeshPhysicalMaterial({name:'Window dielectric / dark recess',color:0x303d40,roughness:.10,metalness:0,ior:1.5,clearcoat:.24,clearcoatRoughness:.15,envMapIntensity:3.0}),'glazing'),
  rail:new T.MeshPhysicalMaterial({name:'Clear balustrade / no refraction',color:0xd7e2dd,roughness:.12,metalness:0,ior:1.5,transparent:true,opacity:.22,depthWrite:false,side:T.DoubleSide,forceSinglePass:true,envMapIntensity:.65}),
  metal:standard('Monument coated aluminium',0x3d4240,.44,{metalness:.25}),
  screen:standard('White coated battens',0xe2e3da,.5,{metalness:.12}),
  tile:finishShader(standard('Terrace mineral finish / inferred',0x96968c,.88),'render'),
  coping:standard('Pool pale mineral edge / inferred',0xc5c3b4,.65),
  pool: finishShader(new T.MeshPhysicalMaterial({name:'Water / static inexpensive surface',color:0x396f70,roughness:.095,metalness:0,ior:1.333,clearcoat:.35,clearcoatRoughness:.12,envMapIntensity:2.2}),'water'),
  base:standard('Neutral mineral base',0x92978f,.94),
  garden:standard('A0106 planted-ground abstraction',0x788274,1)
 };
 const rippleData=new Uint8Array(128*128*4);
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4;const u=x/128*Math.PI*2,v=y/128*Math.PI*2;rippleData[i]=128+Math.round(18*Math.cos(u*5+Math.sin(v*3)));rippleData[i+1]=128+Math.round(14*Math.sin(v*4+Math.sin(u*2)));rippleData[i+2]=253;rippleData[i+3]=255;}
 const ripples=new T.DataTexture(rippleData,128,128);ripples.wrapS=ripples.wrapT=T.RepeatWrapping;ripples.repeat.set(4,2);ripples.magFilter=T.LinearFilter;ripples.minFilter=T.LinearMipmapLinearFilter;ripples.generateMipmaps=true;ripples.needsUpdate=true;materials.pool.normalMap=ripples;materials.pool.normalScale.set(.55,.55);
 materials.band.polygonOffset=true;materials.band.polygonOffsetFactor=-1;materials.band.polygonOffsetUnits=-1;
 const assignments=[];
 for(const [name,g] of Object.entries(model.groups))for(const o of g.children){if(!o.isMesh)continue;const old=o.material.color?.getHex();let m=materials.wall;
  if(old===0xe8e5dc)m=materials.pale;
  if(old===0x586770)m=materials.glass;
  if(old===0xaebbc0)m=materials.rail;
  if(name.includes('balcony bands'))m=materials.band;
  if(name.includes('privacy screens'))m=materials.screen;
  if(name==='roof / pool shell'||name==='roof / pool coping')m=materials.coping;
  if(name==='roof / pool water')m=materials.pool;
  if(name==='roof / raised terrace'&&old===0xe8e5dc)m=materials.tile;
  if(name.includes('site /'))m=materials.base;
  if(old===0x788274)m=materials.garden;
  if(name==='connection / glazing and roof'&&old===0xe8e5dc)m=materials.metal;
  o.material=m;o.castShadow=m!==materials.rail&&m!==materials.pool;o.receiveShadow=m!==materials.rail;
  assignments.push({group:name,mesh:o.name,material:m.name});
 }
 return {materials,assignments};
}
export function setupLighting(renderer,world,foreground){
 const ground=new T.Mesh(new T.PlaneGeometry(2000,2000),new T.MeshStandardMaterial({name:'Untextured architectural ground',color:0x9b9e96,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.set(38,2.89,17);ground.receiveShadow=true;ground.name='Environment ground (not building geometry)';world.add(ground);
 const pmrem=new T.PMREMGenerator(renderer);pmrem.compileEquirectangularShader();
 const envCache=new Map();
 const rigs=[world,foreground].map(scene=>{const hemi=new T.HemisphereLight(),sun=new T.DirectionalLight();sun.target.position.set(38,6,17);scene.add(hemi,sun,sun.target);return {hemi,sun};});
 const sun=rigs[0].sun;sun.castShadow=true;sun.shadow.mapSize.set(innerWidth<760?1024:2048,innerWidth<760?1024:2048);Object.assign(sun.shadow.camera,{left:-50,right:50,top:35,bottom:-35,near:1,far:180});sun.shadow.bias=-.0015;sun.shadow.normalBias=.065;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
 function environment(key){if(envCache.has(key))return envCache.get(key);const p=lighting[key],w=512,h=256,data=new Float32Array(w*h*4),sky=new T.Color(p.sky),ground=new T.Color(p.ground),horizon=new T.Color(0xe6e5da);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const elev=Math.cos(y/(h-1)*Math.PI);let c=elev>0?horizon.clone().lerp(sky,Math.pow(elev,.45)):horizon.clone().lerp(ground,Math.pow(-elev,.28));const highlight=Math.exp(-((x/w-.22)**2/.026+(y/h-.30)**2/.045));const cloud=Math.pow(.5+.5*Math.sin(x/w*Math.PI*8+Math.sin(y/h*14)),4)*Math.exp(-((y/h-.38)**2)/.012);c.multiplyScalar((elev>0?.95:.32)+highlight*.6+cloud*.5);const i=(y*w+x)*4;data[i]=c.r;data[i+1]=c.g;data[i+2]=c.b;data[i+3]=1;}
  const texture=new T.DataTexture(data,w,h,T.RGBAFormat,T.FloatType);texture.mapping=T.EquirectangularReflectionMapping;texture.needsUpdate=true;const rt=pmrem.fromEquirectangular(texture);texture.dispose();envCache.set(key,rt);return rt;
 }
 return function select(key){const p=lighting[key],env=environment(key);for(const [i,r] of rigs.entries()){r.hemi.color.set(p.sky);r.hemi.groundColor.set(p.ground);r.hemi.intensity=p.fill;r.sun.color.set(p.sun);r.sun.intensity=p.key;r.sun.position.set(...p.p).add(new T.Vector3(38,0,17));const scene=i?foreground:world;scene.environment=env.texture;scene.environmentIntensity=p.env;}
  world.fog=new T.Fog(p.background,200,650);
  renderer.shadowMap.needsUpdate=true;return p;
 };
}

