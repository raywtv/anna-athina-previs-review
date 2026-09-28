// AA-002 Decision C, A0102 / A0203 / A0902 detail 4-C.
// Local exterior top is 100 mm below occupied floor; not a rectangular void.
// Existing outer perimeter, other holes and representative underside retained.
export const unit4Slab={
 interior:6.63,courtyard:6.53,bottom:6.24,
 // From front/right, follow the preserved raised-terrace inner edge, then
 // the exterior faces of the re-registered U4 walls, back to the front edge.
 joint:[[62.5,28.915],[62.5,26.1],[65.4,19.2],[65.736,18.4],
        [60.4,18.4],[60.4,22.3],[57.6,22.3],[57.6,25.65],
        [53.6,25.65],[53.6,28.915]],
 source:'A0203 grid-registered U4 wall; A0902 SSL6630/6530, detail4-C; existing outer terrace edge retained',
 simplification:'Rounded external slab/set-out; 390/290 mm representative depth to unchanged underside; not structural reinforcement design'
};

export function buildUnit4Slab({T,group,shape,outline,holes,material}){
 const s=unit4Slab,notched=[...outline.slice(0,3),...s.joint,...outline.slice(3)];
 const points=p=>shape(p).extractPoints(6).shape;
 const unique=p=>p.filter((v,i)=>!i||v.distanceToSquared(p[i-1])>1e-12);
 const ring=p=>{const r=unique(p);if(r[0].distanceToSquared(r.at(-1))<1e-12)r.pop();return r};
 const whole=ring(points(outline)),main=ring(points(notched)),court=ring(s.joint.map(p=>new T.Vector2(...p))),voids=holes.map(h=>h.map(p=>new T.Vector2(...p)));
 const positions=[],tri=(a,b,c)=>positions.push(...a,...b,...c);
 function face(contour,holes,y,up){
  const verts=[...contour,...holes.flat()],faces=T.ShapeUtils.triangulateShape(contour,holes);
  for(const f of faces){let v=f.map(i=>[verts[i].x,y,verts[i].y]);
   const cross=(v[1][2]-v[0][2])*(v[2][0]-v[0][0])-(v[1][0]-v[0][0])*(v[2][2]-v[0][2]);
   if((cross>0)!==up)[v[1],v[2]]=[v[2],v[1]];tri(...v);
  }
 }
 face(main,voids,s.interior,true);face(court,[],s.courtyard,true);face(whole,voids,s.bottom,false);
 function sides(r,hole=false){
  // Split the front boundary at the two courtyard datums; preserve its line.
  const expanded=[];for(let i=0;i<r.length;i++){const a=r[i],b=r[(i+1)%r.length];expanded.push(a);
   if(!hole&&Math.abs(a.y-28.915)<1e-5&&Math.abs(b.y-28.915)<1e-5){
    const xs=[53.6,62.5].filter(x=>x>Math.min(a.x,b.x)+1e-5&&x<Math.max(a.x,b.x)-1e-5).sort((x,y)=>a.x>b.x?y-x:x-y);
    xs.forEach(x=>expanded.push(new T.Vector2(x,28.915)));
   }
  }
  const cw=T.ShapeUtils.isClockWise(expanded);
  for(let i=0;i<expanded.length;i++){const a=expanded[i],b=expanded[(i+1)%expanded.length],mid=(a.x+b.x)/2,
   h=!hole&&Math.abs(a.y-28.915)<1e-5&&Math.abs(b.y-28.915)<1e-5&&mid>53.6&&mid<62.5?s.courtyard:s.interior;
   let q=[[a.x,s.bottom,a.y],[b.x,s.bottom,b.y],[b.x,h,b.y],[a.x,h,a.y]];
   if(cw!==hole)q.reverse();tri(q[0],q[1],q[2]);tri(q[0],q[2],q[3]);
  }
 }
 sides(whole);voids.forEach(h=>sides(h,true));
 // Only the exposed 100 mm riser is made at the interior/courtyard joint.
 // No duplicate full-height internal faces, coplanar patch or overlapping plates.
 for(let i=1;i<s.joint.length;i++){const a=s.joint[i-1],b=s.joint[i],q=[[a[0],s.courtyard,a[1]],[b[0],s.courtyard,b[1]],[b[0],s.interior,b[1]],[a[0],s.interior,a[1]]];tri(q[2],q[1],q[0]);tri(q[3],q[2],q[0]);}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.computeVertexNormals();
 const mesh=new T.Mesh(geo,material);mesh.name='A2 slab / A0902 Unit4 continuous stepped footprint';mesh.userData.unit4Slab=s;group.add(mesh);return mesh;
}
