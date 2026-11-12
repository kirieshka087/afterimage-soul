export function inertialStep(speed,dt,damping=1.65){
 const decay=Math.exp(-damping*dt);
 return {angle:speed*(1-decay)/damping,speed:Math.abs(speed*decay)<.0005?0:speed*decay};
}
export function flickVelocity(deltaPixels,dtSeconds){
 return Math.max(-9,Math.min(9,deltaPixels*.009/Math.max(.008,dtSeconds)));
}
