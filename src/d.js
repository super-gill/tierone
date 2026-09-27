
/* ============ office visuals ============ */
const V={speed:16,acc:0,last:0,actors:{},visitors:[],pops:[],sched:[],plan:[],meetings:[],rt:0,L:null,T:32,ox:0,oy:0,cw:0,ch:0,col:{},hover:null,
  reduced:window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches,dpr:1};
const WORKQ=['IT support, how can I help?','Have you tried restarting it?','I’ll remote in now','Is it plugged in?','Password reset, done','Let me get that logged','Printer again…','Which button did you press?','That’s a P1, on it','Can you see my screen?','Clearing the queue'];
const BUSYQ=['The queue is mental today','We need another pair of hands','Phones won’t stop','I haven’t had lunch','Who’s on P1s?'];
const IDLEQ=['Quiet one today','Anyone want a brew?','Queue’s empty!','Updating the docs'];
const SALESQ=['Let’s talk SLAs','We can bundle backup in','What keeps you up at night?','Happy to sharpen the pencil','Who looks after your IT now?'];
function readColors(){
  const cs=getComputedStyle(document.documentElement);const g=n=>cs.getPropertyValue(n).trim();
  const keys=['fl-ground','fl-grid','carpet','carpet2','wall','glass','desk','desk-edge','monitor','screen','chair','kitchen','meeting','noc','training','plant','bubble','rug','ink','muted','line','surface','surface2','p','good','bad','warn','p1','p2','p3','p4','r-founder','r-desk','r-eng','r-am','r-sdm','r-hdm','r-sm','body','mono','display'];
  V.col={};for(const k of keys)V.col[k]=g('--'+k);
  V.dark=/^#[0-3]/.test(V.col['fl-ground']);
}
function buildLayout(tier){
  const T=TIERS[tier],W=T.W,H=T.H,RB=T.RB;
  const L={W,H,RB,tier,desks:[],rooms:[],reception:null};
  const band=RB>0;
  L.corrY=band?RB+0.9:H-0.65;L.spineX=0.9;
  const y0=band?RB+1.8:0.55,yMax=band?H-0.4:L.corrY-0.6;
  const rows=[];for(let y=y0;y+2.0<=yMax+0.001;y+=2.4)rows.push(y);
  const per=Math.floor((W-0.5-2.2-1.6)/2.1)+1;
  const nDesks=Math.min(T.cap,(typeof VIS_DESK_CAP!=='undefined'?VIS_DESK_CAP:T.cap));
  outer:for(const y of rows)for(let i=0;i<per;i++){if(L.desks.length>=nDesks)break outer;const x=2.2+i*2.1;L.desks.push({x,y,w:1.6,h:0.8,seat:{x:x+0.8,y:y+1.25},aisle:y+2.0});}
  if(band){const sw=5,start=W-T.slots*sw;for(let i=0;i<T.slots;i++){const x=start+i*sw;L.rooms.push({x,y:0,w:sw,h:RB,door:{x:x+sw/2,y:RB}});}L.reception={x:0,y:0,w:start,h:RB};}
  return L;
}
function roomSpots(j,key){
  const r=V.L.rooms[j];const x=r.x,y=r.y;
  if(key==='kitchen')return [{x:x+1.1,y:y+1.8},{x:x+2.3,y:y+1.8},{x:x+3.5,y:y+1.8}];
  if(key==='meeting')return [{x:x+0.8,y:y+2.05},{x:x+4.2,y:y+2.05},{x:x+2.5,y:y+3.3}];
  if(key==='noc')return [{x:x+1.6,y:y+2.9},{x:x+3.4,y:y+2.9}];
  return [{x:x+1.4,y:y+3.2},{x:x+3.6,y:y+3.2}];
}
function chain(loc){
  const L=V.L;
  if(loc.t==='desk'){const d=L.desks[loc.i]||L.desks[0];return {lane:d.aisle,pts:[{x:d.seat.x,y:d.aisle},{x:d.seat.x,y:d.seat.y}]};}
  if(loc.t==='room'){const r=L.rooms[loc.j];return {lane:L.corrY,pts:[{x:r.door.x,y:L.corrY},{x:r.door.x,y:r.h-0.35},loc.p]};}
  if(loc.t==='print'){return {lane:L.corrY,pts:[{x:1.3,y:L.corrY},{x:1.3,y:L.RB-0.45}]};}
  if(loc.t==='out')return {lane:L.corrY,pts:[{x:-0.7,y:L.corrY}]};
  return {lane:L.corrY,pts:[{x:0.4,y:L.corrY}]};
}
function route(a,b){
  const A=chain(a),B=chain(b);
  const out=A.pts.slice().reverse().slice(1);
  if(Math.abs(A.lane-B.lane)>0.01){out.push({x:V.L.spineX,y:A.lane},{x:V.L.spineX,y:B.lane});}
  return out.concat(B.pts);
}
function goTo(a,dest,after){if(fastMo()&&!V.reduced){a.fadeIn=0;if(dest.t==='out'){a.path=[];a.after=null;a.loc=dest;a.state='walk';if(after)after();return;}const p=chain(dest).pts;const e=p[p.length-1];a.x=e.x;a.y=e.y;a.path=[];a.loc=dest;a.state='walk';a.alpha=0;a.fadeIn=performance.now();a.after=null;if(after)after();else a.state=dest.t==='desk'?'sit':'idle';return;}a.path=V.reduced?[]:route(a.loc,dest);if(V.reduced){const p=chain(dest).pts;const e=p[p.length-1];a.x=e.x;a.y=e.y;}a.loc=dest;a.state='walk';a.after=after||null;}
function trip(a,dest,stay){
  if(a.state!=='sit')return;const home=a.loc;
  goTo(a,dest,()=>{a.state='idle';a.wait=performance.now()+stay;a.then=()=>goTo(a,home,()=>{a.state='sit';a.face='n';});});
}
function brewLoc(){
  const j=S.office.slots?S.office.slots.indexOf('kitchen'):-1;
  if(j>=0&&j<V.L.rooms.length)return {t:'room',j,p:pick(roomSpots(j,'kitchen'))};
  if(V.L.reception)return {t:'print'};
  return {t:'out'};
}
function say(a,text,ms){const now=performance.now();if(!a.bubble&&V.actors&&Object.values(V.actors).concat(V.visitors||[]).filter(x=>x.bubble&&x.bubble.until>now).length>=3)return;a.bubble={text,until:now+(ms||2400)};}
function tag(a,text){a.tag={text,until:performance.now()+1400};}
function at(delay,fn){V.sched.push({at:performance.now()+delay,fn});}
/* ---------- the working day: 08:00 to 18:00, one game day ---------- */
const DAY_H0=8,DAY_HN=10;
/* a game day runs 05:00 to 05:00. Office hours (08:00 to 18:00) at the chosen speed; the night runs twice as fast */
const NU=0.5,CYC_U=3*NU+10+11*NU;
const cycleMs=()=>dayMs()*CYC_U/DAY_HN;
function hToU(h){return (Math.min(h,8)-5)*NU+clamp(h-8,0,10)+Math.max(0,h-18)*NU;}
const hf=h=>clamp(hToU(h)/CYC_U,0,0.9999);
function dayFrac(){return V.speed>0?clamp(V.acc/cycleMs(),0,0.9999):(V.lastFrac||0);}
function uToH(u){return u<3*NU?5+u/NU:u<3*NU+10?8+(u-3*NU):18+(u-3*NU-10)/NU;}
function hourNow(){return uToH(dayFrac()*CYC_U);}
function isNight(){const h=hourNow();return h>=18||h<8;}
function clockText(){const h=Math.floor(hourNow());const d=h>=24?S.day+1:S.day;const st=(V.speed||1)<=1?5:(V.speed||1)<=16?15:60;const m=Math.floor((hourNow()-Math.floor(hourNow()))*60/st)*st;return ['Mon','Tue','Wed','Thu','Fri'][d%5]+' '+String(h%24).padStart(2,'0')+':'+String(m).padStart(2,'0');}
/* a natural walking pace; everything, walking included, scales with game speed */
function walkSpeed(){return (V.speed||1)<=1?4.5:7;}
const fastMo=()=>(V.speed||1)>=64;
function lightLevel(){const h=hourNow();return h<5.8?0:h<6.8?h-5.8:h<19.2?1:h<20.2?20.2-h:0;}
function onCourseHere(s){return !!(S.office.rooms&&S.office.rooms.training&&roomIdx('training')>=0&&s.course>S.day&&s.away>S.day&&started(s)&&!s.left);}
function roomIdx(key){const j=(S.office.slots||[]).indexOf(key);return j>=0&&V.L&&j<V.L.rooms.length?j:-1;}
function spot(j,key,i){const sp=roomSpots(j,key);const p=sp[i%sp.length],k=Math.floor(i/sp.length);return {x:p.x+(k%2?0.55:-0.55)*Math.ceil(k/2),y:p.y+(k?0.25:0)};}
function pathLen(a,b){const pts=route(a,b);let d=0,x=pts.length?pts[0].x:0,y=pts.length?pts[0].y:0;for(const p of pts){d+=Math.hypot(p.x-x,p.y-y);x=p.x;y=p.y;}const s=chain(a).pts;const f=s[s.length-1];if(pts.length)d+=Math.hypot(pts[0].x-f.x,pts[0].y-f.y);return d;}
function syncActors(){
  const L=V.L;
  const want=new Set();
  for(const s of S.staff){
    if(!(present(s)||onCourseHere(s))||s.desk>=L.desks.length)continue;
    want.add(s.id);
    let a=V.actors[s.id];
    if(!a){const d=L.desks[s.desk];a=V.actors[s.id]={id:s.id,x:d.seat.x,y:d.seat.y,loc:{t:'desk',i:s.desk},path:[],state:'sit',face:'n',phase:Math.random()*6,look:s.look};}
    a.look=s.look;
    if(a.state==='sit'&&a.loc.t==='desk'&&a.loc.i!==s.desk){const d=L.desks[s.desk];a.loc={t:'desk',i:s.desk};a.x=d.seat.x;a.y=d.seat.y;}
  }
  if(S.partner){const used=new Set(S.staff.filter(s=>!s.left&&present(s)).map(s=>s.desk));let di=-1;for(let i=L.desks.length-1;i>=0;i--)if(!used.has(i)){di=i;break;}
    if(di>=0){want.add('partner');let a=V.actors.partner;const base={t:'desk',i:di};
      if(!a){const d=L.desks[di];a=V.actors.partner={id:'partner',x:d.seat.x,y:d.seat.y,loc:base,path:[],state:'sit',face:'n',phase:Math.random()*6,look:S.partner.look||(S.partner.look=Object.assign(look(),{top:'#7A4FB0'}))};}
      a.base=base;if(a.state==='sit'&&a.loc.t==='desk'&&a.loc.i!==di){const d=L.desks[di];a.loc=base;a.x=d.seat.x;a.y=d.seat.y;}}}
  for(const id in V.actors)if(!want.has(id))delete V.actors[id];
}
function stepActor(a,dt,now){
  a.phase+=dt*11;
  const go=running();
  if(a.path&&a.path.length){
    const sp=(go?walkSpeed():0)*dt;
    const p=a.path[0];const dx=p.x-a.x,dy=p.y-a.y,dist=Math.hypot(dx,dy);
    if(Math.abs(dx)>Math.abs(dy))a.face=dx>0?'e':'w';else a.face=dy>0?'s':'n';
    if(dist<=sp){a.x=p.x;a.y=p.y;a.path.shift();}else if(sp>0){a.x+=dx/dist*sp;a.y+=dy/dist*sp;}
    a.moving=sp>0;
    if(!a.path.length){a.moving=false;const f=a.after;a.after=null;if(f)f();else a.state=a.loc.t==='desk'?'sit':'idle';}
  }else a.moving=false;
  if(a.fadeOut){a.alpha=1-(now-a.fadeOut)/700;if(a.alpha<=0){a.fadeOut=0;a.alpha=1;a.loc={t:'out'};a.path=[];a.x=-0.7;a.y=V.L.corrY;a.stayUntil=0;a.then=null;a.trip=false;a.after=null;a.state='walk';}}
  if(a.fadeIn){a.alpha=Math.min(1,(now-a.fadeIn)/250);if(a.alpha>=1){a.fadeIn=0;a.alpha=1;}}
  if(a.stayUntil&&V.rt>=a.stayUntil){a.stayUntil=0;const f=a.then;a.then=null;if(f)f();}
  if(a.bubble&&now>a.bubble.until)a.bubble=null;
}
/* where someone belongs when they're at work: their desk, the NOC or the training room */
function homeLoc(a){return a.base||{t:'desk',i:(ST(a.id)||{}).desk||0};}
function sitAt(a,face){return ()=>{a.state='sit';a.face=face||'n';};}
function atHome(a){const b=homeLoc(a);return !a.path.length&&a.loc.t===b.t&&(b.t==='desk'?a.loc.i===b.i:a.loc.j===b.j);}
function free(a){return a&&atHome(a)&&!a.stayUntil&&!a.trip;}
function goHome(a){a.trip=false;if(a.leaving){goTo(a,{t:'out'},()=>{a.state='walk';});return;}const b=homeLoc(a);goTo(a,b,b.t==='desk'?sitAt(a):sitAt(a,b.face||'n'));}
/* place someone at their desk instantly, no walk-in: used when the day is already underway (e.g. a fresh load) */
function snapHome(a){a.trip=false;a.leaving=false;const b=homeLoc(a);const pts=chain(b).pts;const e=pts[pts.length-1];a.x=e.x;a.y=e.y;a.loc=b;a.path=[];a.after=null;a.alpha=1;a.fadeIn=0;a.state=b.t==='desk'?'sit':'idle';a.face=b.face||'n';}
/* stay somewhere for a while: game hours, but never so short you can't see it */
function stay(a,hours,then){a.stayUntil=V.rt+Math.max(hours*dayMs()/DAY_HN,fastMo()?400:1800);a.then=then;}
function tripTo(a,dest,face,hours,onArrive,onLeave){a.trip=true;goTo(a,dest,()=>{if(face==='stand'){a.state='idle';a.face='n';}else sitAt(a,face)();if(onArrive)onArrive();stay(a,hours,()=>{if(onLeave)onLeave();goHome(a);});});}
function planAt(h,fn){V.plan.push({f:hf(h),fn});}
function scheduleDay(r){
  V.plan=[];
  syncActors();
  if(V.reduced){V.meetings=[];return;}
  const L=V.L;const OUT={t:'out'};
  const kitchen=roomIdx('kitchen'),meet=roomIdx('meeting'),noc=roomIdx('noc'),train=roomIdx('training');
  const act=Object.values(V.actors);const W={};for(const w of r.W)W[w.st.id]=w;
  // 05:00: the office is empty. Anyone still about (a late one, or a fresh load) goes home now
  for(const a of act){a.late=false;a.leaving=false;a.fadeOut=0;a.fadeIn=0;a.alpha=1;a.loc={t:'out'};a.path=[];a.after=null;a.trip=false;a.stayUntil=0;a.then=null;a.state='walk';a.x=-0.7;a.y=L.corrY;a.bubble=null;}
  V.visitors=[];
  // today's bases: the NOC rota changes on Mondays; people on a course sit in the training room
  if(noc>=0&&(S.day%5===0||!act.some(a=>a.base&&a.base.j===noc))){const pool=act.filter(a=>{const s=ST(a.id);return s&&present(s)&&(s.role==='eng'||s.role==='desk');}).sort((x,y)=>x.id<y.id?-1:1);
    const pref=pool.filter(a=>ST(a.id).role==='eng');const pl=pref.length?pref:pool;
    for(const a of act)if(a.base&&a.base.j===noc)a.base=null;
    if(pl.length){const a=pl[Math.floor(S.day/5)%pl.length];a.base={t:'room',j:noc,p:spot(noc,'noc',0),face:'n'};}}
  let ti=0;for(const a of act){const s=ST(a.id);if(s&&onCourseHere(s)){a.base={t:'room',j:train,p:spot(train,'training',ti++),face:'n'};a.course=true;}else if(a.course){a.course=false;a.base=null;}}
  const short=(from,to,max)=>pathLen(from,to)<=max;
  // everyone walks in; the further from the door, the earlier they set off. But if the day is
  // already underway (a fresh load, or catching up), anyone past their arrival is simply already in.
  const f0=dayFrac();
  for(const a of act){const s=ST(a.id);if(!s)continue;const d=pathLen(OUT,homeLoc(a));
    const due=s.role==='founder'?rnd(7.6,8):ROLES[s.role].mgr?rnd(8.1,8.7):rnd(7.8,8.6);
    if(hf(due)<=f0){snapHome(a);continue;}
    const u0=hToU(due)-(d/walkSpeed()*1000)/(dayMs()/DAY_HN);
    planAt(Math.max(5.1,uToH(u0)),()=>goHome(a));}
  const arr=[];
  // Monday team meeting
  if(meet>=0&&S.day%5===0){const mg=act.filter(a=>{const s=ST(a.id);return s&&!a.course&&!(a.base)&&(ROLES[s.role].mgr||s.role==='am'||s.role==='sdm'||s.role==='founder');}).slice(0,5);
    if(mg.length>=3){mg.forEach((a,i)=>planAt(9.2+i*0.1,()=>{if(free(a))tripTo(a,{t:'room',j:meet,p:spot(meet,'meeting',i)},i%2?'w':'e',1);}));
      planAt(10,()=>{const a=mg[0];if(a&&a.loc.t==='room')say(a,pick(['Right, numbers for the week','What’s on fire?','Pipeline first','Any escalations?']),1600);});}}
  // client meetings: a pitch or an account review, in the meeting room with a visitor
  const ms=V.meetings.splice(0);
  let shown=0;
  for(const m of ms){if(shown>=2)break;
    const pool=S.staff.filter(s=>s.role==='am'&&present(s));const sid=m&&m.sid?m.sid:(pool.length?pick(pool).id:'you');const a=V.actors[sid];if(!a||a.course)continue;shown++;
    const h=rnd(9.5,14.5);
    if(meet>=0)planAt(h,()=>{if(!free(a))return;
      const v={id:'v'+uid(),x:-0.7,y:L.corrY,loc:{t:'out'},path:[],state:'walk',face:'e',phase:0,look:Object.assign(look(),{top:pick(['#2C3E50','#3B3B3B','#5B8FA8','#7F8C8D'])}),visitor:true};
      V.visitors.push(v);goTo(v,{t:'room',j:meet,p:spot(meet,'meeting',1)},sitAt(v,'w'));
      tripTo(a,{t:'room',j:meet,p:spot(meet,'meeting',0)},'e',1,()=>say(a,m&&m.kind==='review'?pick(['How’s the service been?','Let’s look at your tickets','Anything coming up this year?']):pick(SALESQ)),()=>goTo(v,{t:'out'},()=>{v.dead=true;}));});
    else planAt(h,()=>{if(!free(a))return;say(a,'Off to see a client',1600);a.trip=true;goTo(a,OUT,()=>{a.state='walk';stay(a,2,()=>goHome(a));});});
  }
  // lunch and brews: only a few, and only where the walk is short
  if(kitchen>=0){const kd=act.filter(a=>!a.course&&short(homeLoc(a),{t:'room',j:kitchen,p:spot(kitchen,'kitchen',0)},14)).sort(()=>Math.random()-0.5).slice(0,3);
    kd.forEach((a,i)=>{const lunch=i<2;const h=lunch?rnd(12,13.2):(Math.random()<0.5?rnd(10,11):rnd(14.5,15.5));
      planAt(h,()=>{if(free(a))tripTo(a,{t:'room',j:kitchen,p:spot(kitchen,'kitchen',i)},'stand',lunch?0.7:0.3,()=>{if(Math.random()<0.5)say(a,pick(lunch?['Anyone else starving?','Leftovers again']:['Anyone want a brew?','Milk’s gone again','Kettle’s on']),1400);});});});}
  else{const a=act.filter(a=>!a.course&&short(homeLoc(a),OUT,10))[0];if(a&&Math.random()<0.5)planAt(rnd(12,13),()=>{if(free(a)){say(a,'Popping out for lunch',1400);a.trip=true;goTo(a,OUT,()=>stay(a,0.8,()=>goHome(a)));}});}
  // after hours: the lights go out, most have gone, a few work late
  const late=act.filter(a=>{const s=ST(a.id);return s&&((s.util||0)>0.97&&S.tickets.length>6||(s.role==='founder'&&Math.random()<0.3));}).slice(0,3);
  for(const a of late)a.late=true;
  for(const a of act){if(a.late)continue;const s=ST(a.id);const t=s&&ROLES[s.role]&&ROLES[s.role].mgr?rnd(17.3,18.4):rnd(17,18.2);
    planAt(t,()=>{a.leaving=true;if(free(a))goHome(a);});}
  planAt(18.6,()=>{for(const v of V.visitors)v.dead=true;});
  for(const a of late){planAt(rnd(18.5,20),()=>{if(a.state==='sit'&&a.loc.t==='desk')say(a,pick(['Just one more ticket','Where did everyone go?','Nearly there']),1600);});
    planAt(rnd(20,22.5),()=>{a.late=false;a.leaving=true;a.stayUntil=0;a.then=null;goHome(a);});}
  // chatter while working: more of it when you're watching slowly
  const rep=(V.speed||1)<=1?8:(V.speed||1)<=16?2:1;
  for(let k=0;k<rep;k++)for(const a of act){const s=ST(a.id);const w=W[s&&s.id];if(!s||!w)continue;const role=s.role;const slammed=(s.util||0)>0.97&&S.tickets.length>6;
    if(w.done>0&&Math.random()<0.55)planAt(rnd(10,17),()=>{if(a.state==='sit'&&a.loc.t==='desk')tag(a,'✓ '+w.done);});
    if((role==='desk'||role==='eng'||role==='founder')&&w.used>0.5&&Math.random()<0.26)planAt(rnd(9.3,16.5),()=>{if(a.state==='sit'&&a.loc.t==='desk')say(a,pick(WORKQ));});
    if(slammed&&Math.random()<0.3)planAt(rnd(10,16),()=>{if(a.state==='sit')say(a,pick(Math.random()<0.3?['I haven’t had lunch']:BUSYQ));});
    if(role==='desk'&&s.util<0.45&&Math.random()<0.25)planAt(rnd(10,16),()=>{if(a.state==='sit')say(a,pick(IDLEQ));});
    if(role==='am'&&Math.random()<0.25)planAt(rnd(9.5,16),()=>{if(a.state==='sit'&&a.loc.t==='desk')say(a,pick(['Chasing that proposal','Following up with '+(active().length?pick(active()).name.split(' ')[0]:'a lead'),'Pipeline’s looking healthy']));});
    if(a.course&&Math.random()<0.4)planAt(rnd(10,16),()=>{if(a.state==='sit')say(a,pick(['Taking notes','This bit’s actually useful','Lab time']),1400);});
    if(a.base&&a.base.j===noc&&S.tickets.some(t=>t.pri===1)&&Math.random()<0.5)planAt(rnd(9.5,15),()=>say(a,'P1 on the board',1400));
  }
  const ringers=r.W.filter(w=>w.st.role!=='am'&&w.st.role!=='sdm');
  for(let k=0;k<rep;k++)r.made.slice(0,8).forEach(t=>{const cand=ringers.filter(w=>t.lvl===2?w.st.role!=='desk':true);if(!cand.length)return;const w=pick(cand);const a=V.actors[w.st.id];if(a)planAt(rnd(9,17),()=>{if(a.state==='sit'){a.ring=performance.now()+900;a.ringP=t.pri;}});});
  V.visitors=V.visitors.filter(v=>!v.dead);
  V.plan.sort((x,y)=>x.f-y.f);
}
function runPlan(){if(!V.plan||!V.plan.length||!running())return;const f=dayFrac();V.lastFrac=f;while(V.plan.length&&V.plan[0].f<=f){const p=V.plan.shift();try{p.fn();}catch(e){}}}
function sizeCanvas(){
  const cv=$('cv'),stage=$('stage');const L=V.L;if(!L)return;
  const cw=stage.clientWidth||600;
  const availH=stage.clientHeight||0;const wide=(window.innerWidth||0)>=1101;
  let T,ch;
  if(wide&&availH>140){
    // desktop: the stage flexes to fill the space left by the fixed markets window, so scale
    // the whole floor to fit that height and width, keeping it entirely visible
    T=Math.min((cw-24)/L.W,(availH-14)/L.H,64);ch=availH;
  }else{
    T=Math.min((cw-32)/L.W,64);ch=clamp(Math.round(L.H*T+90),280,640);T=Math.min(T,(ch-32)/L.H);
  }
  V.cw=cw;V.ch=ch;V.dpr=window.devicePixelRatio||1;
  cv.width=Math.round(cw*V.dpr);cv.height=Math.round(ch*V.dpr);cv.style.height=ch+'px';
  V.T=T;
  V.ox=(cw-L.W*V.T)/2;V.oy=(ch-L.H*V.T)/2;
  V.ctx=cv.getContext('2d');V.ctx.setTransform(V.dpr,0,0,V.dpr,0,0);
}
function setLayout(){V.L=buildLayout(S.office.tier);V.actors={};V.visitors=[];V.needPlan=true;sizeCanvas();}
const X=x=>V.ox+x*V.T, Y=y=>V.oy+y*V.T;
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function box(c,x,y,w,h,col,r){c.fillStyle=col;if(r){rr(c,X(x),Y(y),w*V.T,h*V.T,r*V.T);c.fill();}else c.fillRect(X(x),Y(y),w*V.T,h*V.T);}
function draw(now){
  const c=V.ctx,L=V.L,T=V.T,K=V.col;if(!c)return;
  c.clearRect(0,0,V.cw,V.ch);
  c.fillStyle=K['fl-ground'];c.fillRect(0,0,V.cw,V.ch);
  // blueprint grid
  c.strokeStyle=K['fl-grid'];c.lineWidth=1;c.beginPath();
  const g=T/2;for(let x=V.ox%g;x<V.cw;x+=g){c.moveTo(Math.round(x)+0.5,0);c.lineTo(Math.round(x)+0.5,V.ch);}
  for(let y=V.oy%g;y<V.ch;y+=g){c.moveTo(0,Math.round(y)+0.5);c.lineTo(V.cw,Math.round(y)+0.5);}c.stroke();
  // floor
  if(L.tier===0){
    box(c,0,0,L.W,L.H,K.meeting);
    c.strokeStyle='rgba(0,0,0,.08)';c.lineWidth=1;c.beginPath();for(let y=0.5;y<L.H;y+=0.5){c.moveTo(X(0),Y(y));c.lineTo(X(L.W),Y(y));}c.stroke();
    box(c,1.3,2.9,3.2,1.5,K.rug,0.15);
    // bed
    box(c,4.9,2.9,1.9,1.9,V.dark?'#3C4654':'#EDEFF3',0.12);box(c,4.9,2.9,1.9,0.5,V.dark?'#56657A':'#FFFFFF',0.1);box(c,4.9,3.55,1.9,1.25,V.dark?'#4A5D7A':'#8FA9D6',0.1);
    // bookshelf
    box(c,5.7,0.1,1.2,0.5,K['desk-edge'],0.05);
  }else{
    box(c,0,0,L.W,L.H,K.carpet);
    c.fillStyle=K.carpet2;for(let i=0;i<Math.ceil(L.W);i++)for(let j=0;j<Math.ceil(L.H);j++)if((i+j)%2)c.fillRect(X(i),Y(j),Math.min(T,X(L.W)-X(i)),Math.min(T,Y(L.H)-Y(j)));
  }
  // rooms
  const slots=S.office.slots||[];
  L.rooms.forEach((r,j)=>drawRoom(c,r,j,slots[j],now));
  if(L.reception){const r=L.reception;
    box(c,r.x+0.3,r.y+r.h-1.6,0.9,0.7,V.dark?'#39424D':'#D9DEE4',0.08);box(c,r.x+0.45,r.y+r.h-1.5,0.6,0.25,K.monitor,0.05);// printer
    if(r.w>=4){box(c,r.x+1.8,r.y+0.9,2.4,0.7,K['desk-edge'],0.1);c.font='700 '+Math.max(8,T*0.28)+'px '+K.body;c.fillStyle=K.muted;c.fillText(S.co.name.toUpperCase().slice(0,22),X(r.x+0.3),Y(r.y+0.55));}
    plant(c,r.x+0.5,r.y+0.6);
  }
  if(L.tier===1){c.font='700 '+Math.max(8,T*0.26)+'px '+K.mono;c.fillStyle=K.muted;c.fillText('SUITE 4',X(L.W-2),Y(L.H-0.25));}
  // walls
  const lw=Math.max(3,T*0.15);c.strokeStyle=K.wall;c.lineWidth=lw;c.lineCap='square';c.beginPath();
  c.moveTo(X(0),Y(L.corrY-0.6));c.lineTo(X(0),Y(0));c.lineTo(X(L.W),Y(0));c.lineTo(X(L.W),Y(L.H));c.lineTo(X(0),Y(L.H));c.lineTo(X(0),Y(L.corrY+0.6));
  if(L.RB>0){
    L.rooms.forEach(r=>{c.moveTo(X(r.x),Y(0));c.lineTo(X(r.x),Y(r.h));c.moveTo(X(r.x),Y(r.h));c.lineTo(X(r.door.x-0.6),Y(r.h));c.moveTo(X(r.door.x+0.6),Y(r.h));c.lineTo(X(r.x+r.w),Y(r.h));});
  }
  c.stroke();
  // windows
  c.strokeStyle=K.glass;c.lineWidth=Math.max(2,lw*0.5);c.beginPath();
  const wy=L.RB>0?L.H:0;for(let x=1.5;x<L.W-1.5;x+=3){c.moveTo(X(x),Y(wy));c.lineTo(X(x+1.6),Y(wy));}
  if(L.RB>0&&L.reception&&L.reception.w>=4){c.moveTo(X(1.2),Y(0));c.lineTo(X(L.reception.w-0.8),Y(0));}
  c.stroke();
  // door mat
  box(c,0.05,L.corrY-0.5,0.35,1.0,K['desk-edge'],0.05);
  // plants
  if(L.tier>=1){plant(c,L.W-0.6,L.H-0.6);if(L.tier>=2)plant(c,0.6,L.H-0.6);}
  // team zones (bigger offices)
  if(typeof drawZones==='function')drawZones(c,now);
  // desks
  const byDesk={};for(const s of S.staff)if(!s.left)byDesk[s.desk]=s;
  L.desks.forEach((d,i)=>drawDesk(c,d,i,byDesk[i],now));
  // night
  {const k=1-lightLevel();if(k>0){c.fillStyle='rgba(8,12,28,'+(0.62*k)+')';c.fillRect(X(0),Y(0),L.W*T,L.H*T);
    for(const a of Object.values(V.actors))if(a.loc.t==='desk'&&a.state==='sit'&&!a.path.length){const g=c.createRadialGradient(X(a.x),Y(a.y-0.7),0,X(a.x),Y(a.y-0.7),T*1.4);g.addColorStop(0,'rgba(255,214,140,'+(0.35*k)+')');g.addColorStop(1,'rgba(255,214,140,0)');c.fillStyle=g;c.fillRect(X(a.x-1.5),Y(a.y-2.2),T*3,T*3);}}}
  // actors
  const all=Object.values(V.actors).concat(V.visitors).filter(a=>!(a.loc.t==='out'&&!a.path.length)).sort((a,b)=>a.y-b.y);
  for(const a of all)drawActor(c,a,now);
  for(const a of all){if(a.bubble)drawBubble(c,X(a.x),Y(a.y)-T*0.95,a.bubble.text);}
  // clock
  if(!S.intro){const t=clockText()+(isNight()?'  ☾':'');c.font='700 13px '+K.mono;const w=c.measureText(t).width+16,hh=24;c.fillStyle=K.surface;c.globalAlpha=0.92;rr(c,8,8,w,hh,6);c.fill();c.globalAlpha=1;c.strokeStyle=K.line;c.lineWidth=1;rr(c,8.5,8.5,w-1,hh-1,6);c.stroke();c.fillStyle=K.ink;c.textBaseline='middle';c.fillText(t,15,8+hh/2+1);c.textBaseline='alphabetic';}
  // pops
  V.pops=V.pops.filter(p=>now-p.born<2600);
  const np=V.pops.length,baseY=V.oy+V.T*Math.max(L.RB+2,L.H*0.55);
  V.pops.forEach((p,i)=>{const t=(now-p.born)/2600;c.globalAlpha=1-t*t;c.font='700 '+Math.max(13,T*0.5)+'px '+K.mono;c.textAlign='center';
    const spread=((p.born%5)-2)*T*0.9;
    const tx=V.cw/2+spread,ty=baseY+(i-np+1)*T*0.85-t*T*1.6;c.lineWidth=4;c.strokeStyle=K['fl-ground'];c.strokeText(p.text,tx,ty);c.fillStyle=p.good?K.good:K.bad;c.fillText(p.text,tx,ty);c.textAlign='left';c.globalAlpha=1;});
}
function plant(c,x,y){const T=V.T;box(c,x-0.22,y-0.1,0.44,0.36,V.dark?'#6B5A48':'#B98C5E',0.08);c.fillStyle=V.col.plant;c.beginPath();c.arc(X(x),Y(y-0.12),T*0.32,0,7);c.fill();c.fillStyle='rgba(255,255,255,.15)';c.beginPath();c.arc(X(x-0.1),Y(y-0.22),T*0.12,0,7);c.fill();}
function drawRoom(c,r,j,key,now){
  const K=V.col,T=V.T;const hov=V.hover&&V.hover.type==='room'&&V.hover.j===j;
  if(!key){
    box(c,r.x,r.y,r.w,r.h,K.carpet2);
    c.save();c.setLineDash([T*0.18,T*0.14]);c.strokeStyle=hov?K.p:K.muted;c.lineWidth=hov?2:1;c.strokeRect(X(r.x+0.35),Y(r.y+0.35),(r.w-0.7)*T,(r.h-0.7)*T);c.restore();
    c.font='700 '+Math.max(10,T*0.34)+'px '+K.body;c.textAlign='center';c.fillStyle=hov?K.p:K.muted;c.fillText('+ Fit out',X(r.x+r.w/2),Y(r.y+r.h/2)+4);c.textAlign='left';
    return;
  }
  const floor={kitchen:K.kitchen,meeting:K.meeting,noc:K.noc,training:K.training}[key];
  box(c,r.x,r.y,r.w,r.h,floor);
  if(key==='kitchen'){
    c.fillStyle='rgba(0,0,0,.06)';for(let i=0;i<r.w*2;i++)for(let k=0;k<r.h*2;k++)if((i+k)%2)c.fillRect(X(r.x+i/2),Y(r.y+k/2),T/2,T/2);
    box(c,r.x+0.15,r.y+0.15,r.w-1.2,0.7,V.dark?'#56606B':'#AEB6BF',0.06);box(c,r.x+r.w-0.95,r.y+0.15,0.8,1.0,V.dark?'#7A8591':'#E9EDF1',0.08);
    box(c,r.x+1.9,r.y+0.3,0.5,0.35,'#2B2B2B',0.05);// coffee machine
    c.fillStyle=K['desk-edge'];c.beginPath();c.arc(X(r.x+2.5),Y(r.y+2.9),T*0.55,0,7);c.fill();
  }else if(key==='meeting'){
    box(c,r.x+1.2,r.y+1.35,2.6,1.1,K['desk-edge'],0.5);
    box(c,r.x+1.5,r.y+0.12,2,0.22,K.monitor,0.04);
    [[1.6,1.05],[3.4,1.05],[1.6,2.75],[3.4,2.75]].forEach(([dx,dy])=>{c.fillStyle=K.chair;c.beginPath();c.arc(X(r.x+dx),Y(r.y+dy),T*0.2,0,7);c.fill();});
  }else if(key==='noc'){
    for(let i=0;i<4;i++){box(c,r.x+0.35+i*1.1,r.y+0.15,0.95,0.55,'#0A0E12',0.04);
      const f=(Math.sin(now/600+i*1.7)+1)/2;c.fillStyle=i===2&&S.tickets.some(t=>t.pri===1)?K.p1:(f>0.5?'#3FA36B':'#2F7FC4');c.globalAlpha=0.75;c.fillRect(X(r.x+0.42+i*1.1),Y(r.y+0.22),0.81*T,0.4*T);c.globalAlpha=1;}
    box(c,r.x+0.6,r.y+1.7,3.8,0.7,K['desk-edge'],0.08);
  }else{
    box(c,r.x+0.8,r.y+0.12,3.4,0.22,V.dark?'#DDE3EA':'#FFFFFF',0.04);
    [[0.8,2.2],[2.9,2.2]].forEach(([dx,dy])=>box(c,r.x+dx,r.y+dy,1.3,0.5,K['desk-edge'],0.06));
  }
  c.font='700 '+Math.max(8,T*0.24)+'px '+K.mono;c.fillStyle=key==='noc'?'#9FB0C0':K.muted;c.fillText(ROOMS[key].t.toUpperCase(),X(r.x+0.2),Y(r.y+r.h-0.18));
  if(hov){c.strokeStyle=K.p;c.lineWidth=2;c.strokeRect(X(r.x)+2,Y(r.y)+2,r.w*T-4,r.h*T-4);}
}
function drawDesk(c,d,i,s,now){
  const K=V.col,T=V.T;const hov=V.hover&&V.hover.type==='desk'&&V.hover.i===i;
  box(c,d.x,d.y,d.w,d.h,K.desk,0.08);
  c.fillStyle=K['desk-edge'];c.fillRect(X(d.x),Y(d.y+d.h)-Math.max(2,T*0.07),d.w*T,Math.max(2,T*0.07));
  const on=s&&V.actors[s.id]&&V.actors[s.id].state==='sit'&&V.actors[s.id].loc.t==='desk'&&!V.actors[s.id].path.length;
  box(c,d.x+0.45,d.y+0.08,0.7,0.36,K.monitor,0.04);
  c.fillStyle=on?K.screen:(V.dark?'#1B232B':'#56616C');c.fillRect(X(d.x+0.5),Y(d.y+0.12),0.6*T,0.26*T);
  if(on&&s.role!=='am'&&s.role!=='sdm'&&(Math.floor(now/180+i)%3===0)){c.fillStyle='rgba(255,255,255,.55)';c.fillRect(X(d.x+0.55),Y(d.y+0.2),0.3*T,0.04*T);}
  box(c,d.x+0.55,d.y+0.52,0.5,0.12,V.dark?'#3A4550':'#E4E8EC',0.03);
  if(s&&s.role==='am'){box(c,d.x+1.2,d.y+0.2,0.22,0.3,V.dark?'#DDE3EA':'#FFFFFF',0.03);}
  if(!on){c.fillStyle=K.chair;c.beginPath();c.arc(X(d.seat.x),Y(d.seat.y-0.35),T*0.24,0,7);c.fill();}
  if(s&&!started(s)){box(c,d.x+0.1,d.y+0.1,0.45,0.45,'#B98C5E',0.04);c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=1;c.beginPath();c.moveTo(X(d.x+0.1),Y(d.y+0.32));c.lineTo(X(d.x+0.55),Y(d.y+0.32));c.stroke();}
  if(!s){
    if(hov){c.save();c.setLineDash([4,3]);c.strokeStyle=K.p;c.lineWidth=2;c.strokeRect(X(d.x-0.1),Y(d.y-0.1),(d.w+0.2)*T,(d.h+1.1)*T);c.restore();
      c.font='700 '+Math.max(10,T*0.3)+'px '+K.body;c.fillStyle=K.p;c.textAlign='center';c.fillText('+ Hire',X(d.seat.x),Y(d.seat.y+0.1));c.textAlign='left';}
  }
}
function drawActor(c,a,now){
  const K=V.col,T=V.T,k=T/24;const px=X(a.x),py=Y(a.y);const lk=a.look;
  const st=a.visitor?null:ST(a.id);const hov=V.hover&&V.hover.type==='staff'&&V.hover.id===a.id;
  c.save();if(a.alpha!=null&&a.alpha<1)c.globalAlpha=Math.max(0,a.alpha);c.translate(px,py);c.scale(k,k);
  const seated=a.state==='sit'&&!a.path.length;
  if(hov){c.fillStyle=K.p;c.globalAlpha=0.25;c.beginPath();c.ellipse(0,0,8,3,0,0,7);c.fill();c.globalAlpha=1;}
  if(seated){
    const bob=st&&(st.role==='desk'||st.role==='eng'||st.role==='founder')?Math.sin(a.phase*0.6)*0.4:0;
    c.fillStyle=lk.top;rr(c,-3.6,-15+bob,7.2,9.5,2.2);c.fill();
    c.fillStyle=lk.hair;c.beginPath();c.arc(0,-18.5+bob,3.6,0,7);c.fill();
    if(lk.long){c.fillRect(-3.6,-18.5+bob,7.2,5);}
    c.fillStyle=K.chair;rr(c,-4.8,-9,9.6,6,2);c.fill();
  }else{
    c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(0,0,4.6,1.6,0,0,7);c.fill();
    const sw=a.moving?Math.sin(a.phase)*2.2:0;
    c.strokeStyle=lk.legs;c.lineWidth=2.2;c.lineCap='round';c.beginPath();c.moveTo(-1.2,-6);c.lineTo(-1.2+sw,-0.5);c.moveTo(1.2,-6);c.lineTo(1.2-sw,-0.5);c.stroke();
    c.fillStyle=lk.top;rr(c,-3.4,-15,6.8,9.5,2.2);c.fill();
    if(st&&a.face!=='n'){c.fillStyle=K[ROLES[st.role].col.slice(2)];c.fillRect(0.6,-13,2,3);}
    c.fillStyle=lk.skin;c.beginPath();c.arc(0,-18,3.4,0,7);c.fill();
    c.fillStyle=lk.hair;c.beginPath();
    if(a.face==='n'){c.arc(0,-18,3.5,0,7);c.fill();if(lk.long)c.fillRect(-3.5,-18,7,5);}
    else{c.arc(0,-18.6,3.5,Math.PI,0);c.fill();if(a.face==='e')c.fillRect(-3.5,-18.6,2,3);else if(a.face==='w')c.fillRect(1.5,-18.6,2,3);if(lk.long&&a.face==='s'){c.fillRect(-3.8,-18.6,1.6,5.5);c.fillRect(2.2,-18.6,1.6,5.5);}}
  }
  if(a.ring&&now<a.ring){const col=K['p'+(a.ringP||3)];c.fillStyle=col;rr(c,4,-29,9,7,1.5);c.fill();c.fillStyle='#fff';c.fillRect(6,-26.5,5,1.2);c.fillRect(6,-24.5,3.5,1.2);}
  c.restore();
  if(a.tag&&now<a.tag.until){const t=1-(a.tag.until-now)/1400;c.globalAlpha=1-t;c.font='700 '+Math.max(10,T*0.32)+'px '+K.mono;c.fillStyle=K.good;c.textAlign='center';c.fillText(a.tag.text,px,py-T*1.05-t*T*0.5);c.textAlign='left';c.globalAlpha=1;}
  if((st||a.id==='partner')&&hov){const nm=st?st.name:(S.partner?S.partner.name:'Partner');c.font='700 '+Math.max(10,T*0.3)+'px '+K.body;c.textAlign='center';const w=c.measureText(nm).width+10;c.fillStyle=K.surface;rr(c,px-w/2,py+3,w,T*0.45,4);c.fill();c.fillStyle=K.ink;c.fillText(nm,px,py+3+T*0.33);c.textAlign='left';}
}
function drawBubble(c,x,y,text){
  const K=V.col;c.font='600 11px '+K.body;const tw=c.measureText(text).width,bw=tw+12,bh=18;
  const bx=clamp(x-bw/2,2,V.cw-bw-2),by=Math.max(2,y-bh);
  c.fillStyle=K.bubble;c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=1;rr(c,bx,by,bw,bh,8);c.fill();c.stroke();
  c.beginPath();c.moveTo(clamp(x-4,bx+6,bx+bw-12),by+bh-0.5);c.lineTo(clamp(x,bx+8,bx+bw-8),by+bh+5);c.lineTo(clamp(x+3,bx+10,bx+bw-5),by+bh-0.5);c.fill();
  c.fillStyle='#1B1F24';c.fillText(text,bx+6,by+12.5);
}
function hitTest(mx,my){
  const L=V.L,T=V.T;if(!L)return null;
  const wx=(mx-V.ox)/T,wy=(my-V.oy)/T;
  const all=Object.values(V.actors).filter(a=>!(a.loc.t==='out'&&!a.path.length)).sort((a,b)=>b.y-a.y);
  for(const a of all)if(Math.abs(wx-a.x)<0.42&&wy<a.y+0.15&&wy>a.y-1.0)return {type:'staff',id:a.id};
  for(let i=0;i<L.desks.length;i++){const d=L.desks[i];if(wx>=d.x-0.1&&wx<=d.x+d.w+0.1&&wy>=d.y-0.1&&wy<=d.y+d.h+1.0){const s=S.staff.find(x=>x.desk===i&&!x.left);return s?{type:'staff',id:s.id}:{type:'desk',i};}}
  for(let j=0;j<L.rooms.length;j++){const r=L.rooms[j];if(wx>=r.x&&wx<=r.x+r.w&&wy>=r.y&&wy<=r.y+r.h)return {type:'room',j};}
  return null;
}
