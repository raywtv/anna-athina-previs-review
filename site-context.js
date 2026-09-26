// Longitudinal frontage context, not an accessibility ramp or civil survey model.
// 8200J height-label trend / A0101, A1013, A1016 / IMG_7765,7770,7773.
// Preserve approved ramp/stair arrival RL3.852; other context knots are rounded.
export const gradeKnots=[[-25,3.63],[-11,3.70],[7.5,3.77],[22.932,3.852],[32.45,3.852],[43.17,3.866],[59.8,3.90],[79,3.97],[100,4.04]];
export const frontageY=x=>{for(let i=1;i<gradeKnots.length;i++)if(x<=gradeKnots[i][0]){const a=gradeKnots[i-1],b=gradeKnots[i];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}return gradeKnots.at(-1)[1]};
export function buildSiteContext({base,solidQuad,mat}){
 const quad=(n,x0,x1,z0,z1,a,b,c,d,m=mat.base)=>solidQuad(base,n,[[x0,a,z0],[x1,b,z0],[x1,c,z1],[x0,d,z1]],2.70,m);
 const xs=[...new Set([...gradeKnots.map(p=>p[0]),17.1,24.132,29.8,32.323,37.45,43.17,44.18,45.38,48.5,49.88,53.5,59.8,65.8,90])].sort((a,b)=>a-b);
 for(let i=1;i<xs.length;i++){
  const a=xs[i-1],b=xs[i],m=(a+b)/2,ya=frontageY(a),yb=frontageY(b);
  const back=m>=53.5&&m<=59.8?30.15:m>=37.45&&m<=53.5?28.9:29.15;
  quad('continuous footpath / longitudinal B-beach fall',a,b,back,31.86,ya,yb,yb,ya);
  quad('continuous kerb / 150mm',a,b,31.86,32,ya,yb,yb,ya);
  quad('continuous street / same longitudinal fall',a,b,32,80,ya-.15,yb-.15,yb-.15,ya-.15,mat.core);
 }
 const threshold=(n,x0,x1,z0,z1,y)=>quad(n,x0,x1,z0,z1,y,y,y,y);
 const arrival=(n,x0,x1,z0,z1,y)=>quad(n,x0,x1,z0,z1,y,y,frontageY(x1),frontageY(x0));
 threshold('D9 garage threshold',37.45,43.17,25.02,25.22,4.05);
 arrival('D9 discrete driveway / threshold to footpath',37.45,43.17,25.22,28.9,4.05);
 threshold('D10 pedestrian threshold',44.18,45.38,25.02,25.22,4.05);
 arrival('D10 pedestrian arrival',44.18,45.38,25.22,28.9,4.05);
 threshold('D12 stair03 threshold',48.5,49.88,27.70,27.90,3.95);
 arrival('D12 stair03 landing',48.5,49.88,27.90,28.90,3.95);
 threshold('D13 D14 service threshold',49.88,53.5,26.88,27.08,3.95);
 arrival('D13 D14 recessed service apron',49.88,53.5,27.08,28.9,3.95);
 threshold('D31 D32 bin-room threshold',53.5,59.8,28.75,28.98,3.95);
 arrival('D31 D32 bin-room apron',53.5,59.8,28.98,30.15,3.95);
 for(const[a,b]of [[43.17,44.18],[45.38,48.5]])quad('service garden to longitudinal path',a,b,25.22,28.9,3.91,3.91,frontageY(b),frontageY(a),mat.garden);
 // Narrow exterior support strip below the unchanged retained garden, not a
 // sheet connecting different building datums. The fence/cap stays at RL4.6.
 quad('B retained-edge footpath shoulder',-11,17.1,28.9,29.15,frontageY(-11),frontageY(17.1),frontageY(17.1),frontageY(-11));
 base.userData.street={gradeKnots,fall:'decreasing X toward B / beach',rampAnchor:3.852,certainty:'survey trend plus as-built topology; rounded context grades, not certification'};
}
