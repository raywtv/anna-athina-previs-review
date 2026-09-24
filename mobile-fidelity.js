// Focused 4:3 construction framing; join the same full-cover blade passage.
export function mobilePose(t,approved,{stages,holdStart,depart,bladeStart}){
 if(t>=depart)return approved(t);
 const keys=[
  {t:0,p:[4,15,49],a:[14,4,20]},
  {t:stages[2].t0,p:[5,15,48],a:[17,6,20]},
  {t:stages[3].t0,p:[18,19,53],a:[27,7,20]},
  {t:stages[4].t0,p:[54,23,62],a:[49,7,19]},
  {t:stages[6].t0,p:[56,30,65],a:[47,11,20]},
  {t:stages[7].t0,p:[15,35,84],a:[35,10,19]},
  {t:holdStart,p:[17,35,84],a:[34,10,18]},
  {t:depart,...approved(depart)}];
 let i=0;while(i<keys.length-2&&t>keys[i+1].t)i++;
 const a=keys[i],b=keys[i+1],dt=b.t-a.t,u=Math.max(0,Math.min(1,(t-a.t)/dt));
 const vel=(n,k,j)=>{if(n>=keys.length-2)return(k==='p'?[-.333,-.083,-.167]:[0,0,0])[j];const x=keys[Math.max(0,n-1)],y=keys[Math.min(keys.length-1,n+1)];return(y[k][j]-x[k][j])/(y.t-x.t)};
 const at=k=>a[k].map((v,j)=>(2*u**3-3*u*u+1)*v+(u**3-2*u*u+u)*dt*vel(i,k,j)+(-2*u**3+3*u*u)*b[k][j]+(u**3-u*u)*dt*vel(i+1,k,j));
 return{p:at('p'),a:at('a'),f:43};
}
