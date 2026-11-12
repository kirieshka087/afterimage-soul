import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {inertialStep,flickVelocity} from './motion.mjs';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let auto=!reduced,time=0,frame=0;const views=[],axisX=new T.Vector3(1,0,0),axisY=new T.Vector3(0,1,0),loader=new GLTFLoader();
function studio(){
 const c=document.createElement('canvas');c.width=2048;c.height=1024;const x=c.getContext('2d');
 const bg=x.createLinearGradient(0,0,0,1024);bg.addColorStop(0,'#b1bfd0');bg.addColorStop(.45,'#5b718f');bg.addColorStop(1,'#17253f');x.fillStyle=bg;x.fillRect(0,0,2048,1024);
 x.filter='blur(9px)';for(const [a,b,w,h] of [[80,80,115,800],[780,140,70,680],[1200,90,250,150],[1660,140,150,700],[480,810,1000,70]]){x.fillStyle='#ffffff';x.fillRect(a,b,w,h);}x.filter='none';
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.mapping=T.EquirectangularReflectionMapping;return tex;
}
function cardBackground(){const c=document.createElement('canvas');c.width=64;c.height=512;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,512);g.addColorStop(0,'#090c14');g.addColorStop(.58,'#09101f');g.addColorStop(.85,'#174ac2');g.addColorStop(.97,'#7ca6ff');g.addColorStop(1,'#d6e8ff');x.fillStyle=g;x.fillRect(0,0,64,512);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
const environment=studio(),background=cardBackground();
function enhanceLiquid(mat){
 if(!mat.isMeshPhysicalMaterial)return;
 mat.envMapIntensity=1.8;
 mat.onBeforeCompile=shader=>{
  shader.uniforms.liquidStudio={value:environment};
  shader.fragmentShader='uniform sampler2D liquidStudio;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`vec3 liquidView = normalize(vViewPosition);
float liquidEdge = pow(1.0 - abs(dot(normal, liquidView)), 2.4);
vec3 liquidRay = inverseTransformDirection(refract(-liquidView, normal, 1.0 / 1.333), viewMatrix);
vec2 liquidUV = vec2(atan(liquidRay.z, liquidRay.x) * 0.159154943 + 0.5, asin(clamp(liquidRay.y,-1.0,1.0)) * 0.318309886 + 0.5);
vec3 liquidRefraction = pow(texture2D(liquidStudio, liquidUV).rgb, vec3(2.2));
liquidRefraction.r = pow(texture2D(liquidStudio, liquidUV + vec2(.0025 * liquidEdge,0.0)).r,2.2);
outgoingLight += liquidRefraction * vec3(.38,.47,.59) * (1.0 - liquidEdge * .65);
float liquidCausticA = exp(-pow((dot(normal, normalize(vec3(-.55,.40,.73))) - .88) * 26.0, 2.0));
float liquidCausticB = exp(-pow((dot(normal, normalize(vec3(.68,-.25,.68))) - .91) * 33.0, 2.0));
outgoingLight += vec3(.36,.80,1.55) * liquidEdge;
outgoingLight += vec3(1.8,2.2,2.7) * liquidCausticA * .55;
outgoingLight += vec3(.28,.68,1.2) * liquidCausticB * .5;
#include <opaque_fragment>`);
 };
 mat.customProgramCacheKey=()=> 'afterimage-liquid-refraction-v5';
}
function attachInteraction(v){
 const ray=new T.Raycaster(),pointer=new T.Vector2();
 v.canvas.style.cursor='grab';
 v.canvas.addEventListener('pointerdown',e=>{const r=v.canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,v.camera);if(!ray.intersectObject(v.model,true).length)return;v.velocity.x=v.velocity.y=0;v.drag={x:e.clientX,y:e.clientY,time:e.timeStamp};v.canvas.setPointerCapture(e.pointerId);v.canvas.style.cursor='grabbing';});
 v.canvas.addEventListener('pointermove',e=>{if(!v.drag)return;const dx=e.clientX-v.drag.x,dy=e.clientY-v.drag.y,dt=(e.timeStamp-v.drag.time)/1000;v.model.rotateOnWorldAxis(axisY,dx*.009);v.model.rotateOnWorldAxis(axisX,dy*.009);v.velocity.y=v.velocity.y*.2+flickVelocity(dx,dt)*.8;v.velocity.x=v.velocity.x*.2+flickVelocity(dy,dt)*.8;v.drag={x:e.clientX,y:e.clientY,time:e.timeStamp};});
 v.canvas.addEventListener('pointerup',e=>{if(v.drag){const idle=Math.max(0,(e.timeStamp-v.drag.time)/1000-.06),d=Math.exp(-idle*12);v.velocity.x*=d;v.velocity.y*=d;}v.drag=null;v.canvas.style.cursor='grab';});
 v.canvas.addEventListener('pointercancel',()=>{v.velocity.x=v.velocity.y=0;v.drag=null;v.canvas.style.cursor='grab';});
}
for(const [index,card] of [...document.querySelectorAll('.liquid-view')].entries()){
 const canvas=card.querySelector('canvas'),scene=new T.Scene(),camera=new T.PerspectiveCamera(36,1,.1,40);camera.position.set(0,.2,7.2);camera.lookAt(0,0,0);scene.environment=environment;scene.background=card.dataset.model==='sun'?new T.Color('#050916'):background;scene.environmentIntensity=1.5;
 let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true});}catch(e){card.querySelector('.loading').textContent='Для просмотра нужен WebGL';continue;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.4;
 const key=new T.DirectionalLight(0xe8f4ff,.6);key.position.set(-3,4,5);scene.add(key);const edge=new T.PointLight(0xa9ceff,12);edge.position.set(2,-1,3);scene.add(edge);
 const v={canvas,card,renderer,scene,camera,index,model:null,home:null,velocity:{x:0,y:0},drag:null,surfaces:[],fragments:[],visible:true,compared:false,edge};
 new ResizeObserver(()=>{const w=canvas.clientWidth,h=canvas.clientHeight;if(w&&h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}}).observe(canvas);
 new IntersectionObserver(([e])=>{v.visible=e.isIntersecting;}).observe(card);
 views.push(v);
 try{const asset=await loader.loadAsync(new URL('./models/'+card.dataset.model+'.glb',import.meta.url).href);v.model=asset.scene;if(card.dataset.model==='memory')v.model.scale.setScalar(1.18);scene.add(v.model);v.home=v.model.quaternion.clone();v.model.traverse(o=>{if(!o.isMesh)return;enhanceLiquid(o.material);if(o.name.startsWith('Voice_wave_')||o.name.startsWith('Linked_band_'))v.surfaces.push({mesh:o,base:o.geometry.attributes.position.array.slice(),voice:o.name.startsWith('Voice'),phase:Number(o.name.slice(-1))*.6});if(o.name.startsWith('Memory_fragment_'))v.fragments.push({mesh:o,home:o.position.clone(),phase:v.fragments.length*.7});});card.querySelector('.loading').remove();attachInteraction(v);canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();v.model.rotateOnWorldAxis(e.key==='ArrowLeft'||e.key==='ArrowRight'?axisY:axisX,e.key==='ArrowLeft'||e.key==='ArrowUp'?-.15:.15);}if(e.key==='Home'){v.model.quaternion.copy(v.home);v.velocity.x=v.velocity.y=0;}});}catch(e){card.querySelector('.loading').textContent='Не удалось загрузить модель';console.error(e);}
}
const motion=document.querySelector('#motion');function sync(){motion.textContent=auto?'Остановить движение':'Включить движение';motion.setAttribute('aria-pressed',String(auto));}sync();motion.onclick=()=>{auto=!auto;if(!auto)views.forEach(v=>{v.velocity.x=v.velocity.y=0;});sync();};
const clock=new T.Clock();
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);if(document.hidden)return;if(auto)time+=dt;frame++;
 for(const v of views){if(!v.model||!v.visible||v.compared)continue;
  if(!v.drag){const x=inertialStep(v.velocity.x,dt,reduced?5:1.65),y=inertialStep(v.velocity.y,dt,reduced?5:1.65);v.model.rotateOnWorldAxis(axisX,x.angle);v.model.rotateOnWorldAxis(axisY,y.angle);v.velocity.x=x.speed;v.velocity.y=y.speed;if(auto)v.model.rotateY(dt*(v.card.dataset.model==='sun'?.12:.018));if(v.card.dataset.model==='sun'){v.model.scale.setScalar(1+(auto?.035*Math.sin(time*1.5):0));if(auto)v.model.rotateZ(dt*.022);}}
  if(auto){for(const {mesh,base,voice,phase} of v.surfaces){const p=mesh.geometry.attributes.position;for(let j=0;j<p.count;j++){const k=j*3,x=base[k],y=base[k+1],z=base[k+2];if(voice){p.array[k]=x;p.array[k+1]=y+.075*(Math.sin(x*2-time*.8+phase)-Math.sin(x*2+phase));p.array[k+2]=z+.045*Math.sin(x*1.8+time*.65+phase);}else{const a=Math.atan2(y,x);p.array[k]=x*(1+.006*Math.sin(a*3+time*.6+phase));p.array[k+1]=y*(1+.006*Math.cos(a*3-time*.5+phase));p.array[k+2]=z+.015*Math.sin(a*3+time*.6+phase);}}p.needsUpdate=true;if(frame%3===0)mesh.geometry.computeVertexNormals();}
   for(const {mesh,home,phase} of v.fragments){mesh.position.copy(home).multiplyScalar(1+.09*Math.sin(time*.55+phase));mesh.rotation.y=.012*Math.sin(time*.5+phase);}v.edge.position.x=2+.3*Math.sin(time*.3);}
  v.renderer.render(v.scene,v.camera);
 }
}animate();

