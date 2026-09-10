import * as T from 'three';
import {Brush,Evaluator,ADDITION} from 'three-bvh-csg';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
// Source-facing silhouettes; unseen thickness and edge radii are explicit visual
// assumptions. These solids do not encode density, PSA axes, or measured CAD.
function oval(x:number,y:number,z:number,cy=0){const g=new T.SphereGeometry(1,32,24);g.scale(x,y,z);g.translate(0,cy,0);return g;}
function box(x:number,y:number,z:number,cy=0){const g=new RoundedBoxGeometry(x,y,z,3,.04);g.translate(0,cy,0);return g;}
function disk(r:number,h:number,cy:number){const g=new T.CylinderGeometry(r,r,h,40);g.translate(0,cy,0);return g;}
function combine(parts:T.BufferGeometry[]){const evalr=new Evaluator();evalr.useGroups=false;const mat=new T.MeshBasicMaterial();let result=new Brush(parts[0],mat);result.updateMatrixWorld();for(const g of parts.slice(1)){const b=new Brush(g,mat);b.updateMatrixWorld();const next=evalr.evaluate(result,b,ADDITION);result.geometry.dispose();g.dispose();result=next;result.updateMatrixWorld();}mat.dispose();return result.geometry;}
export function complexCore(id:string):T.BufferGeometry|null{
 let parts:T.BufferGeometry[];
 if(id==='atomic-ai-v1'){const a=oval(.18,.65,.15),b=a.clone();a.rotateZ(.65);b.rotateZ(-.65);parts=[oval(.32,.65,.28,.05),a,b,oval(.66,.24,.21),disk(.35,.15,-.66),disk(.13,.17,.71)];}
 else if(id==='momentous-ai-v1'){parts=[oval(.49,.68,.32,.10),disk(.42,.16,-.58)];}
 else if(id==='disturbance-ai-v1'){parts=[box(1.18,1.18,.88)];parts[0].rotateY(.25);}
 else if(id==='ellipse-ai-v1'){parts=[oval(.69,.40,.26),box(.58,1.44,.48)];}
 else if(id==='nucleus-ai-v1'){const profile=[[0,-.79],[.31,-.79],[.51,-.71],[.68,-.58],[.67,-.53],[.39,-.29],[.38,.36],[.69,.53],[.68,.58],[.59,.73],[.38,.81],[0,.81]];const g=new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),48);g.scale(1,1,.52);parts=[g,box(1.10,.48,.60,.06)];}
 else if(id==='supercoil-v1'){parts=[disk(.43,1.42,0),box(1.25,.48,.84),box(.64,.53,1.12)];}
 else return null;
 return parts.length===1?parts[0]:combine(parts);
}
