import {useEffect,useRef,useState} from 'react';
import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {BALL_RADIUS,coreGeometry,holeTools,subtractHoles} from '../lib/core-geometry';
import type {Simulation} from '../lib/simulation';
import {SoftwareRenderer} from '../lib/software-renderer';
let noWebGL=false;
type Props={settings:Simulation;diameters:[number,number];bridge:number;left:boolean;model:boolean;drill:boolean;view:'grip'|'core';showRemoved:boolean;shellOpacity:number};
export default function CoreViewer(p:Props){const host=useRef<HTMLDivElement>(null),[error,setError]=useState('');
useEffect(()=>{const el=host.current;if(!el)return;let renderer:T.WebGLRenderer|SoftwareRenderer|undefined,controls:OrbitControls|undefined,resize:ResizeObserver|undefined;const scene=new T.Scene();let disposed=false;setError('');
try{if(!noWebGL){try{renderer=new T.WebGLRenderer({antialias:true,alpha:true});}catch{noWebGL=true;}}renderer??=new SoftwareRenderer();renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(el.clientWidth,el.clientHeight);el.appendChild(renderer.domElement);const camera=new T.PerspectiveCamera(35,el.clientWidth/el.clientHeight,1,2000);camera.position.set(0,35,440);controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.minDistance=250;controls.maxDistance=750;controls.enableDamping=false;
scene.add(new T.AmbientLight(0xffffff,2));const light=new T.DirectionalLight(0xffffff,3);light.position.set(-180,300,350);scene.add(light);const fill=new T.DirectionalLight(0xb6caff,1.7);fill.position.set(220,-70,80);scene.add(fill);
const group=new T.Group();scene.add(group);const coreMat=new T.MeshStandardMaterial({color:0x38b6a4,roughness:.36,metalness:.15}),cutMat=new T.MeshStandardMaterial({color:0xf7a45b,roughness:.45,transparent:true,opacity:.9}),shellMat=new T.MeshPhongMaterial({color:0x7ba6d0,transparent:true,opacity:p.shellOpacity,depthWrite:false,side:T.FrontSide});
const tools=p.drill?holeTools(p.settings,...p.diameters,p.bridge,p.left):[];
if(p.model){const g=coreGeometry(p.settings);if(p.drill){const cut=subtractHoles(g,tools,coreMat,cutMat);group.add(cut.result);for(const rg of cut.removed){if(p.showRemoved){const m=new T.Mesh(rg,cutMat);m.renderOrder=1;group.add(m);}else rg.dispose();}g.dispose();}else group.add(new T.Mesh(g,coreMat));}
const sphere=new T.SphereGeometry(BALL_RADIUS,48,32);let shell:T.Mesh;if(p.drill){const cut=subtractHoles(sphere,tools,shellMat,cutMat);shell=cut.result;cut.removed.forEach(g=>g.dispose());sphere.dispose();}else shell=new T.Mesh(sphere,shellMat);shell.renderOrder=2;group.add(shell);
for(const [i,t] of tools.entries()){const material=new T.MeshBasicMaterial({color:i?0xbea7ff:0x9cdcf1,transparent:true,opacity:.19,depthWrite:false,wireframe:true});const mesh=new T.Mesh(t.geometry,material);group.add(mesh);const dot=new T.Mesh(new T.SphereGeometry(2,12,8),new T.MeshBasicMaterial({color:i?0xbea7ff:0x9cdcf1}));dot.position.copy(t.surface);group.add(dot);}
if(p.model){const pinPos=new T.Vector3(0,BALL_RADIUS,0).applyAxisAngle(new T.Vector3(1,0,0),T.MathUtils.degToRad(p.settings.coreTilt)).applyAxisAngle(new T.Vector3(0,0,1),T.MathUtils.degToRad(p.settings.coreTurn));const pin=new T.Mesh(new T.SphereGeometry(3,16,12),new T.MeshBasicMaterial({color:0xf9d467}));pin.position.copy(pinPos);group.add(pin);}
if(p.view==='core')camera.position.set(260,160,330);else camera.position.set(0,0,450);controls.update();const draw=()=>{if(!disposed)renderer!.render(scene,camera);};controls.addEventListener('change',draw);resize=new ResizeObserver(()=>{camera.aspect=el.clientWidth/el.clientHeight;camera.updateProjectionMatrix();renderer!.setSize(el.clientWidth,el.clientHeight);draw();});resize.observe(el);draw();
}catch{setError('3D 계산에 실패했습니다. 수치를 바꾸거나 WebGL 지원 브라우저에서 다시 열어주세요.');}
return()=>{disposed=true;resize?.disconnect();controls?.dispose();const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();scene.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer?.dispose();renderer?.domElement.remove();};
},[p]);
return <div className="lab-viewport" ref={host}>{error&&<p className="lab-render-error" role="alert">{error}</p>}</div>;
}
