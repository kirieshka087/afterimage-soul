import {writeFile} from 'node:fs/promises';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import * as T from 'three';
import {makers} from './models.mjs';
globalThis.FileReader=class{
  readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}
  readAsDataURL(blob){blob.arrayBuffer().then(b=>{this.result='data:'+blob.type+';base64,'+Buffer.from(b).toString('base64');this.onloadend?.();});}
};
const report=[];
for(const [name,make] of Object.entries(makers)){
  const model=make(),container=new T.Group();container.name='Afterimage_'+name;container.add(model);
  const axis=new T.Vector3(0,1,0),values=[];
  for(let i=0;i<=4;i++)new T.Quaternion().setFromAxisAngle(axis,i*Math.PI/2).toArray(values,i*4);
  const clip=new T.AnimationClip('Slow_rotation',32,[new T.QuaternionKeyframeTrack(container.name+'.quaternion',[0,8,16,24,32],values)]);
  const glb=await new GLTFExporter().parseAsync(container,{binary:true,animations:[clip]});
  await writeFile(new URL('../assets/models/'+name+'.glb',import.meta.url),Buffer.from(glb));
  let triangles=0,meshes=0;model.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
  report.push({name,file:name+'.glb',bytes:glb.byteLength,meshes,triangles});
}
await writeFile(new URL('manifest.json',import.meta.url),JSON.stringify(report,null,2));console.log(report);

