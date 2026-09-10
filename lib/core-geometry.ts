import * as T from 'three';
import {complexCore} from './complex-cores.ts';
import {Brush,Evaluator,SUBTRACTION,INTERSECTION} from 'three-bvh-csg';
import {fingerAngles,type Simulation} from './simulation.ts';
export const BALL_RADIUS=108.5;
export const c3Profile=[[0,-.72],[.19,-.71],[.29,-.68],[.36,-.64],[.377,-.61],[.377,-.51],[.40,-.50],[.408,-.46],[.40,-.435],[.403,-.41],[.385,-.37],[.35,-.33],[.405,-.25],[.447,-.18],[.488,-.10],[.519,0],[.537,.10],[.539,.19],[.525,.29],[.50,.39],[.46,.49],[.407,.575],[.343,.645],[.27,.688],[.18,.707],[.08,.712],[0,.712]];
// Rotational silhouettes traced from manufacturer renders. Dimensions of the new
// models are illustrative, not measured production dimensions or mass models.
const profiles={
 'capacitor-v1':[[0,-.78],[.17,-.78],[.18,-.76],[.18,-.67],[.24,-.65],[.58,.17],[.56,.31],[.50,.46],[.40,.60],[.28,.69],[.18,.72],[.18,.76],[0,.76]],
 'hustle-v1':[[0,-.76],[.39,-.76],[.45,-.71],[.45,-.46],[.41,-.43],[.27,-.43],[.28,-.31],[.31,-.29],[.55,-.27],[.60,-.22],[.61,-.10],[.59,.08],[.53,.24],[.52,.42],[.47,.49],[.31,.52],[.29,.61],[.23,.66],[0,.68]],
 'surge-v1':[[0,-.79],[.16,-.78],[.30,-.73],[.31,-.69],[.31,-.59],[.24,-.58],[.29,-.38],[.41,-.34],[.48,-.15],[.54,.03],[.53,.08],[.48,.11],[.56,.14],[.57,.35],[.54,.52],[.45,.67],[.29,.76],[.12,.79],[0,.79]],
 'id-ai-v1':[[0,-.72],[.20,-.72],[.25,-.69],[.25,-.61],[.34,-.59],[.37,-.55],[.37,-.42],[.40,-.34],[.52,-.31],[.58,-.26],[.59,-.18],[.59,.25],[.56,.32],[.42,.35],[.37,.42],[.37,.57],[.33,.62],[.25,.63],[.25,.70],[.19,.73],[0,.73]],
 'c3-ai-v1':[[0,-.63],[.24,-.61],[.41,-.55],[.42,-.41],[.44,-.39],[.44,-.33],[.40,-.29],[.44,-.23],[.53,-.08],[.58,.12],[.58,.28],[.54,.48],[.46,.64],[.34,.71],[.17,.74],[0,.74]],
 'centripetal-hd-ai-v1':[[0,-.63],[.24,-.61],[.41,-.55],[.42,-.41],[.44,-.39],[.44,-.33],[.40,-.29],[.44,-.23],[.53,-.08],[.58,.12],[.58,.28],[.54,.48],[.46,.64],[.34,.71],[.17,.74],[0,.74]],
 'ikon-ai-v1':[[0,-.78],[.30,-.78],[.37,-.75],[.37,-.52],[.23,-.50],[.31,-.41],[.47,-.18],[.57,.02],[.61,.20],[.59,.34],[.54,.50],[.53,.65],[.47,.72],[.31,.73],[.29,.82],[.22,.86],[0,.87]],
 'wrecker-ai-v1':[[0,-.69],[.39,-.69],[.42,-.66],[.42,-.49],[.47,-.41],[.53,-.15],[.68,.19],[.67,.24],[.59,.41],[.50,.62],[.39,.68],[.16,.72],[0,.73]],
 'meditate-ai-v1':[[0,-.72],[.16,-.71],[.25,-.68],[.36,-.48],[.46,-.24],[.51,.01],[.54,.26],[.53,.49],[.48,.65],[.34,.73],[.17,.76],[0,.77]],
} as const;
export function coreGeometry(s:Simulation){const profile=s.modelVersion&&s.modelVersion!=='c3-v1'?profiles[s.modelVersion as keyof typeof profiles]:null;const points=profile?profile.map(([r,y])=>new T.Vector2(r*BALL_RADIUS,y*BALL_RADIUS)):c3Profile.map(([r,y])=>new T.Vector2(r*(.63/.539)*BALL_RADIUS,(y*(1.6/1.432)+.05)*BALL_RADIUS));const complex=complexCore(s.modelVersion??'');const g=complex?complex.scale(BALL_RADIUS,BALL_RADIUS,BALL_RADIUS):new T.LatheGeometry(points,64);g.rotateX(T.MathUtils.degToRad(s.coreTilt));g.rotateZ(T.MathUtils.degToRad(s.coreTurn));return g;}
export function holeTools(s:Simulation,d1:number,d2:number,bridge:number,left=true){const angles=fingerAngles(d1,d2,bridge);return angles.map((a,i)=>{a*=left?1:-1;const n=new T.Vector3(Math.sin(a),0,Math.cos(a));const across=new T.Vector3(Math.cos(a),0,-Math.sin(a));const forward=s.pitchMode==='degrees'?(i?s.ringForward:s.middleForward):0,side=s.pitchMode==='degrees'?(i?s.ringSide:s.middleSide):0;
const direction=n.clone().negate().addScaledVector(new T.Vector3(0,1,0),Math.tan(T.MathUtils.degToRad(forward))).addScaledVector(across,Math.tan(T.MathUtils.degToRad(side))).normalize();
const depth=i?s.ringDepth:s.middleDepth;const surface=n.clone().multiplyScalar(BALL_RADIUS);const start=surface.clone().addScaledVector(direction,-4);const center=start.clone().addScaledVector(direction,(depth+4)/2);const g=new T.CylinderGeometry((i?d2:d1)/2,(i?d2:d1)/2,depth+4,32);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),direction));g.translate(center.x,center.y,center.z);return {geometry:g,surface,bottom:surface.clone().addScaledVector(direction,depth)};});}
export function subtractHoles(geometry:T.BufferGeometry,tools:{geometry:T.BufferGeometry}[],material:T.Material,cutMaterial:T.Material){const evaluator=new Evaluator();evaluator.useGroups=false;let result=new Brush(geometry,material);result.updateMatrixWorld();const removed:T.BufferGeometry[]=[];for(const tool of tools){const cutter=new Brush(tool.geometry,cutMaterial);cutter.updateMatrixWorld();const cut=evaluator.evaluate(result,cutter,INTERSECTION);removed.push(cut.geometry);const next=evaluator.evaluate(result,cutter,SUBTRACTION);if(result.geometry!==geometry)result.geometry.dispose();result=next;result.updateMatrixWorld();}result.material=material;return {result,removed};}
