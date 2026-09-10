import * as T from 'three';
/** Canvas triangle renderer for devices without WebGL. Uses the same CSG geometry. */
export class SoftwareRenderer {
 domElement=document.createElement('canvas');private ctx=this.domElement.getContext('2d')!;private width=1;private height=1;private ratio=1;
 setPixelRatio(ratio:number){this.ratio=Math.min(ratio,1.5);}
 setSize(w:number,h:number){this.width=w;this.height=h;this.domElement.width=w*this.ratio;this.domElement.height=h*this.ratio;this.domElement.style.width=w+'px';this.domElement.style.height=h+'px';}
 dispose(){}
 render(scene:T.Scene,camera:T.Camera){
  const ctx=this.ctx,w=this.width,h=this.height;if(!ctx)return;ctx.setTransform(this.ratio,0,0,this.ratio,0,0);ctx.clearRect(0,0,w,h);scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  const faces:{xy:number[];z:number;color:string;alpha:number;wire:boolean}[]=[];
  const light=new T.Vector3(-.4,.65,1).normalize(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),normal=new T.Vector3(),edge=new T.Vector3();
  scene.traverse(obj=>{if(!(obj instanceof T.Mesh)||!obj.visible)return;const m=(Array.isArray(obj.material)?obj.material[0]:obj.material) as T.MeshStandardMaterial;if(!m.visible||m.opacity===0)return;const p=obj.geometry.getAttribute('position');if(!p)return;const ix=obj.geometry.index;const count=ix?.count??p.count;const projected:number[][]=[];const world:number[][]=[];
   for(let i=0;i<p.count;i++){a.fromBufferAttribute(p,i).applyMatrix4(obj.matrixWorld);world.push([a.x,a.y,a.z]);a.project(camera);projected.push([(a.x+1)*w/2,(1-a.y)*h/2,a.z]);}
   for(let i=0;i<count;i+=3){const ia=ix?ix.getX(i):i,ib=ix?ix.getX(i+1):i+1,ic=ix?ix.getX(i+2):i+2;const pa=projected[ia],pb=projected[ib],pc=projected[ic];if(!pc||pa[2]>1||pa[2]<-1)continue;const area=(pb[0]-pa[0])*(pc[1]-pa[1])-(pb[1]-pa[1])*(pc[0]-pa[0]);if(m.side===T.FrontSide&&area>=0)continue;
    a.fromArray(world[ia]);b.fromArray(world[ib]);c.fromArray(world[ic]);normal.crossVectors(b.sub(a),edge.copy(c).sub(a)).normalize();const strength=m instanceof T.MeshBasicMaterial?1:.48+.52*Math.max(0,normal.dot(light));const color=(m.color??new T.Color(0x82bfb5)).clone().multiplyScalar(strength).getStyle();faces.push({xy:[pa[0],pa[1],pb[0],pb[1],pc[0],pc[1]],z:(pa[2]+pb[2]+pc[2])/3,color,alpha:m.opacity,wire:m.wireframe??false});
   }
  });
  faces.sort((a,b)=>b.z-a.z);for(const f of faces){ctx.globalAlpha=f.alpha;ctx.beginPath();ctx.moveTo(f.xy[0],f.xy[1]);ctx.lineTo(f.xy[2],f.xy[3]);ctx.lineTo(f.xy[4],f.xy[5]);ctx.closePath();if(f.wire){ctx.strokeStyle=f.color;ctx.lineWidth=.35;ctx.stroke();}else{ctx.fillStyle=f.color;ctx.fill();}}ctx.globalAlpha=1;
 }
}
