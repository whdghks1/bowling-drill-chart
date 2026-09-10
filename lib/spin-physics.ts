import * as T from 'three';
// Exact polynomial integration over signed origin-to-face tetrahedra.
// Density is relative; tensors are about the sphere's fixed geometric centre.
export function meshInertia(g:T.BufferGeometry){
 const p=g.getAttribute('position'),ix=g.index;let volume=0;const second=Array(9).fill(0);
 for(let k=0;k<(ix?.count??p.count);k+=3){const v=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(p,ix?ix.getX(k+j):k+j));const vol=v[0].dot(v[1].clone().cross(v[2]))/6;volume+=vol;const a=v.map(x=>x.toArray());for(let i=0;i<3;i++)for(let j=0;j<3;j++){const si=a.reduce((s,x)=>s+x[i],0),sj=a.reduce((s,x)=>s+x[j],0);second[i*3+j]+=vol*(si*sj+a.reduce((s,x)=>s+x[i]*x[j],0))/20;}}
 if(Math.abs(volume)<1e-8)throw Error('질량 형상이 비어 있습니다');const sign=Math.sign(volume);const trace=second[0]+second[4]+second[8];return new T.Matrix3().set(...second.map((x,i)=>sign*((i%4===0?trace:0)-x)) as [number,number,number,number,number,number,number,number,number]);
}
export function principalAxes(m:T.Matrix3){const a=Array.from({length:3},(_,i)=>Array.from({length:3},(_,j)=>m.elements[j*3+i])),v=[[1,0,0],[0,1,0],[0,0,1]];
 for(let it=0;it<40;it++){let p=0,q=1;for(const [i,j] of [[0,2],[1,2]])if(Math.abs(a[i][j])>Math.abs(a[p][q])){p=i;q=j;}if(Math.abs(a[p][q])<1e-10*Math.max(...a.map((x,i)=>Math.abs(x[i]))))break;const theta=.5*Math.atan2(2*a[p][q],a[q][q]-a[p][p]),c=Math.cos(theta),s=Math.sin(theta);const ap=a[p][p],aq=a[q][q],off=a[p][q];a[p][p]=c*c*ap-2*s*c*off+s*s*aq;a[q][q]=s*s*ap+2*s*c*off+c*c*aq;a[p][q]=a[q][p]=0;for(let k=0;k<3;k++){if(k!==p&&k!==q){const x=a[k][p],y=a[k][q];a[k][p]=a[p][k]=c*x-s*y;a[k][q]=a[q][k]=s*x+c*y;}const x=v[k][p],y=v[k][q];v[k][p]=c*x-s*y;v[k][q]=s*x+c*y;}}
 return a.map((row,i)=>({value:row[i],axis:new T.Vector3(v[0][i],v[1][i],v[2][i]).normalize()})).sort((a,b)=>a.value-b.value);
}
export type SpinFrame={axis:T.Vector3;angle:number;energy:number};
// Illustrative constrained energy relaxation, NOT a calibrated spinner contact
// solver: |L| stays one and E=.5 L.I^-1.L decreases. Playback time is arbitrary.
export function relaxation(tensor:T.Matrix3,start:T.Vector3,damping:number,duration=16){const axes=principalAxes(tensor);if(axes[0].value<=0)throw Error('관성 계산 실패');const top=axes[2].value,stable=axes.filter(x=>(top-x.value)/top<1e-4),inv=tensor.clone().multiplyScalar(1/top).invert();let n=start.clone().applyMatrix3(tensor).normalize();const gap=top/axes[0].value-1,dt=1/120;const frames:SpinFrame[]=[];
 const derivative=(x:T.Vector3)=>{const w=x.clone().applyMatrix3(inv);return x.clone().multiplyScalar(x.dot(w)).sub(w).multiplyScalar(gap>1e-8?damping*2/gap:0);};
 for(let k=0;k<=duration*120;k++){if(k%4===0){const axis=n.clone().applyMatrix3(inv).normalize();const projection=stable.reduce((s,x)=>s+axis.dot(x.axis)**2,0);frames.push({axis,angle:T.MathUtils.radToDeg(Math.acos(Math.sqrt(Math.min(1,projection)))),energy:.5*n.dot(n.clone().applyMatrix3(inv))});}const k1=derivative(n),mid=n.clone().addScaledVector(k1,dt/2).normalize();n.addScaledVector(derivative(mid),dt).normalize();}
 return {frames,axes,unique:stable.length===1};
}
