import * as T from 'three';

export const glass = new T.MeshPhysicalMaterial({
  name:'Sculpted clear liquid', color:0xf4faff, metalness:0,
  roughness:0.024, transmission:1, thickness:.55, ior:1.333,
  attenuationColor:0xe4f4ff, attenuationDistance:12,
  clearcoat:.3, clearcoatRoughness:0.025, dispersion:0.012,
  side:T.FrontSide
});

function sweep(sample, steps, closed, width, depth, twist=()=>0) {
  const sides=24, positions=[], indices=[];
  for(let i=0;i<=steps;i++){
    const t=i/steps, c=sample(t), a=sample(t-.0001), b=sample(t+.0001);
    const tangent=b.clone().sub(a).normalize();
    const n=new T.Vector3(-tangent.y,tangent.x,0).normalize();
    const bin=new T.Vector3().crossVectors(tangent,n).normalize();
    const angle=twist(t),ribbonN=n.clone().multiplyScalar(Math.cos(angle)).addScaledVector(bin,Math.sin(angle));
    const ribbonB=bin.clone().multiplyScalar(Math.cos(angle)).addScaledVector(n,-Math.sin(angle));
    for(let j=0;j<=sides;j++){
      const q=j/sides*Math.PI*2;
      const taper=closed?1:.08+.92*Math.pow(Math.max(0,Math.sin(Math.PI*t)),.45);
      const p=c.clone().addScaledVector(ribbonN,width*taper*Math.cos(q)).addScaledVector(ribbonB,depth*taper*Math.sin(q));
      positions.push(p.x,p.y,p.z);
    }
  }
  for(let i=0;i<steps;i++)for(let j=0;j<sides;j++){
    const a=i*(sides+1)+j,b=a+sides+1;
    indices.push(a,b,a+1,b,b+1,a+1);
  }
  if(!closed){
    for(let end=0;end<2;end++){
      const ci=positions.length/3,c=sample(end);positions.push(c.x,c.y,c.z);
      const base=end*steps*(sides+1);
      for(let j=0;j<sides;j++)indices.push(...(end?[ci,base+j+1,base+j]:[ci,base+j,base+j+1]));
    }
  }
  for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  g.setIndex(indices);g.computeVertexNormals();return g;
}

export function proximity(){
  const root=new T.Group();root.name='Proximity';
  for(let i=0;i<2;i++){
    const ring=new T.Mesh(sweep(t=>new T.Vector3(1.01*Math.cos(t*Math.PI*2),1.01*Math.sin(t*Math.PI*2),0),160,true,.10,.37,t=>.10*Math.sin(t*Math.PI*2)),glass);
    ring.name='Linked_band_'+i;ring.position.x=i?.54:-.54;
    ring.rotation.set(i?-.65:.78,i?.52:-.30,i?-.12:.12);root.add(ring);
  }
  root.rotation.set(.12,-.2,-.52);root.scale.y=.84;root.userData.description='Близость — две переплетённые стеклянные ленты';return root;
}

export function voice(){
  const root=new T.Group();root.name='InnerVoice';
  for(let i=0;i<3;i++){
    const curve=t=>{const x=(t-.5)*3.65;return new T.Vector3(x,(.95+(i-1)*.04)*Math.sin(t*Math.PI*2+.12+i*.10)+x*.30,.22*Math.cos(t*Math.PI*2)+(i-1)*.31);};
    const wave=new T.Mesh(sweep(curve,160,false,.25,.09,t=>.68*Math.sin(t*Math.PI*2-.35)+i*.12),glass);wave.name='Voice_wave_'+i;
    wave.position.y=(i-1)*.19;root.add(wave);
  }
  root.rotation.set(.52,-.18,0);root.userData.description='Внутренний голос — три объёмные волны';return root;
}

function shellPatch(theta0,theta1,phi0,phi1,r){
  const u=32,v=18,p=[],ix=[];
  const vertex=(theta,phi,radius)=>new T.Vector3(radius*Math.sin(theta)*Math.cos(phi),radius*Math.cos(theta),radius*Math.sin(theta)*Math.sin(phi));
  for(let side=0;side<2;side++)for(let y=0;y<=v;y++)for(let x=0;x<=u;x++){
    const taper=.10+.90*Math.pow(Math.sin(Math.PI*x/u),.65);
    const t=(theta0+theta1)/2+(theta1-theta0)*(y/v-.5)*taper+.08*Math.sin(x/u*Math.PI*2),f=phi0+(phi1-phi0)*x/u+(t-(theta0+theta1)/2)*.68;
    const round=Math.pow(Math.max(0,Math.sin(Math.PI*y/v)),.55);
    const a=vertex(t,f,r+(side?-1:1)*(.012+.046*round*taper));p.push(a.x,a.y,a.z);
  }
  const layer=(u+1)*(v+1);
  for(let side=0;side<2;side++)for(let y=0;y<v;y++)for(let x=0;x<u;x++){
    const a=side*layer+y*(u+1)+x,b=a+u+1;
    ix.push(...(side?[a,a+1,b,b,a+1,b+1]:[a,b,a+1,b,b+1,a+1]));
  }
  const join=(a,b)=>ix.push(a,b,a+layer,b,b+layer,a+layer);
  for(let x=0;x<u;x++){join(x,x+1);join(v*(u+1)+x+1,v*(u+1)+x);}
  for(let y=0;y<v;y++){join((y+1)*(u+1),y*(u+1));join(y*(u+1)+u,(y+1)*(u+1)+u);}
  for(let i=0;i<ix.length;i+=3)[ix[i+1],ix[i+2]]=[ix[i+2],ix[i+1]];
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return g;
}

export function memory(){
  const root=new T.Group();root.name='Memory';
  let k=0;
  for(let band=0;band<3;band++)for(let segment=0;segment<3;segment++){
    const theta0=.10+band*.94,theta1=theta0+.96;
    const phi0=segment*Math.PI*2/3+band*.48+.08,phi1=phi0+1.85;
    const shard=new T.Mesh(shellPatch(theta0,theta1,phi0,phi1,1.03),glass);
    shard.name='Memory_fragment_'+k++;
    const theta=(theta0+theta1)/2,phi=(phi0+phi1)/2;
    const normal=new T.Vector3(Math.sin(theta)*Math.cos(phi),Math.cos(theta),Math.sin(theta)*Math.sin(phi));
    shard.position.copy(normal.multiplyScalar(.09+.035*(segment%2)));shard.userData.home=shard.position.toArray();root.add(shard);
  }
  const core=new T.Mesh(new T.SphereGeometry(.69,48,32),glass.clone());core.material.name='Clear water memory core';
  core.name='Memory_core';root.add(core);root.rotation.set(.2,.3,-.22);
  root.userData.description='Память — стеклянная сфера из отдельных фрагментов';return root;
}

export function sun(){
 const root=new T.Group();root.name='SolarStar';
 const ico=new T.IcosahedronGeometry(1,0),a=ico.attributes.position,dirs=[],seen=new Set();
 for(let i=0;i<a.count;i++){const d=new T.Vector3().fromBufferAttribute(a,i).normalize(),k=d.toArray().map(n=>n.toFixed(4)).join(',');if(!seen.has(k)){seen.add(k);dirs.push(d);}}
 ico.dispose();
 const geometry=new T.SphereGeometry(1,128,96),p=geometry.attributes.position;
 for(let i=0;i<p.count;i++){const d=new T.Vector3().fromBufferAttribute(p,i).normalize();let peak=0;for(const axis of dirs)peak=Math.max(peak,d.dot(axis));const radius=.67+.77*Math.pow(peak,25);p.setXYZ(i,d.x*radius,d.y*radius,d.z*radius);}
 geometry.computeVertexNormals();const star=new T.Mesh(geometry,glass);star.name='Solar_surface';root.add(star);
 const core=new T.Mesh(new T.SphereGeometry(.32,32,24),glass.clone());core.name='Solar_core';root.add(core);root.rotation.set(.25,.3,.1);
 root.userData.description='Объёмное стеклянное солнце с двенадцатью округлыми лучами';return root;
}
export const makers={proximity,voice,memory,sun};
