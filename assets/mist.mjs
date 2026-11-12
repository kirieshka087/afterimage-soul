// Persistent inertial smoke particles; pointer input changes velocity, never position.
export class MistField {
 constructor(random=Math.random){this.random=random;this.fields=[];this.time=0;this.particles=Array.from({length:64},(_,i)=>{const p={violet:i>=50,head:i%3===0};this.reset(p);p.age=random()*p.life;p.y-=p.age*.023;return p})}
 reset(p){const r=this.random;p.life=7+r()*5;p.age=0;p.x=(p.violet?.635:.52)+(r()-.5)*.05;p.y=(p.head?.29:.73)+(r()-.5)*.08;p.vx=(r()-.5)*.007;p.vy=-.019-r()*.009;p.phase=r()*6.28}
 disturb(x,y,vx,vy){this.fields.push({x,y,vx:Math.max(-.7,Math.min(.7,vx)),vy:Math.max(-.5,Math.min(.5,vy)),life:.75});if(this.fields.length>18)this.fields.shift()}
 update(dt){dt=Math.min(.05,dt);const steps=Math.ceil(dt/.0167),s=dt/steps;for(let n=0;n<steps;n++){this.time+=s;for(const f of this.fields)f.life-=s;this.fields=this.fields.filter(f=>f.life>0);for(const p of this.particles){p.age+=s;if(p.age>=p.life){this.reset(p);continue}let ax=Math.sin(this.time*.7+p.phase+p.y*11)*.004,ay=0;for(const f of this.fields){const dx=p.x-f.x,dy=p.y-f.y,d=Math.hypot(dx,dy),w=Math.max(0,1-d/.14)**2*f.life/.75;ax+=(f.vx*.7+dx*.2)*w;ay+=(f.vy*.4+dy*.15)*w}p.vx+=(ax-p.vx*.85)*s;p.vy+=(ay+(-.024-p.vy)*.7)*s;const speed=Math.hypot(p.vx,p.vy);if(speed>.13){p.vx*=.13/speed;p.vy*=.13/speed}p.x+=p.vx*s;p.y+=p.vy*s}}}
}
