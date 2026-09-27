
/* ============ products, knowledge, client kit, onboarding ============ */
const CATS={
  rmm:{t:'RMM',vend:'rmm'},
  backup:{t:'Backup',vend:'backup',svc:'backup'},
  edr:{t:'Endpoint security',vend:'edr',svc:'security'},
  voice:{t:'Telephony',vend:'carrier',svc:'telecoms'},
  fw:{t:'Firewall',vend:null}
};
const CAT_ORDER=['rmm','backup','edr','voice','fw'];
const PRODS={
  overwatch:{cat:'rmm',name:'Overwatch',base:60,perSeat:1.1,cut:0.25,course:450,desc:'Solid all-rounder. Cuts support tickets by a quarter.'},
  pulsar:{cat:'rmm',name:'Pulsar',base:30,perSeat:0.8,cut:0.18,course:350,desc:'Cheap, but its patching misses more. Cuts support tickets by under a fifth.'},
  meridian:{cat:'rmm',name:'Meridian',base:95,perSeat:1.5,cut:0.32,course:600,desc:'Premium automation. Cuts support tickets by nearly a third.'},
  truesight:{cat:'rmm',name:'TrueSight',foreign:true,course:400},
  vaultline:{cat:'backup',name:'Vaultline',base:50,cost:1.9,tix:1,course:350,desc:'Dependable Microsoft 365 and server backup.'},
  coldvault:{cat:'backup',name:'Coldvault',base:25,cost:1.5,tix:1.3,course:300,desc:'Cheap storage, fiddly restores. More tickets.'},
  arksafe:{cat:'backup',name:'ArkSafe',base:80,cost:2.4,tix:0.7,course:500,desc:'Premium, self-service restores. Fewer tickets.'},
  drivesafe:{cat:'backup',name:'DriveSafe',foreign:true,course:300},
  sentrix:{cat:'edr',name:'Sentrix',base:120,cost:5.2,tix:1,course:700,desc:'Endpoint detection with a 24/7 SOC behind it.'},
  bastion:{cat:'edr',name:'Bastion',base:60,cost:4.3,tix:1.3,course:500,desc:'Budget EDR. Noisier, more alerts to chase.'},
  halcyon:{cat:'edr',name:'Halcyon',base:180,cost:6.1,tix:0.75,course:800,desc:'Top-tier EDR. Quiet and sharp, and pricey.'},
  shieldpro:{cat:'edr',name:'ShieldPro AV',foreign:true,course:300},
  northlink:{cat:'voice',name:'Northlink',base:0,costT:9,costC:195,tix:1,course:400,desc:'Lines, SIP trunks and leased circuits.'},
  voxline:{cat:'voice',name:'Voxline',base:0,costT:8.2,costC:185,tix:1.2,course:400,desc:'A bit cheaper wholesale, a bit flakier.'},
  onprem:{cat:'voice',name:'Old on-site phone system',foreign:true,course:500},
  ironclad:{cat:'fw',name:'Ironclad',course:450},
  gatekeeper:{cat:'fw',name:'Gatekeeper',foreign:true,course:450},
  netwarden:{cat:'fw',name:'NetWarden',foreign:true,course:450}
};
const KIT_POOL={rmm:['truesight','pulsar','meridian'],backup:['drivesafe','coldvault','arksafe'],edr:['shieldpro','bastion','halcyon'],voice:['onprem','voxline'],fw:['gatekeeper','netwarden']};
const KIT_P={rmm:0.45,backup:0.4,edr:0.55,voice:0.3,fw:0.45};
const KIT_TIX={rmm:0.1,backup:0.05,edr:0.12,voice:0.1,fw:0.04};
const KIT_SUBJ={rmm:['Their old monitoring agent is stuck','Patch report missing'],backup:['Their backup job failed','Restore from their old backup'],edr:['AV alert on a laptop','AV blocking a line-of-business app'],voice:['Handset lost its config','Phone system needs a reboot'],fw:['VPN on their firewall dropped','Firewall rule change']};
const ALIGN_H={rmm:s=>1+0.1*s,backup:s=>1+0.1*s,edr:s=>2+0.25*s,voice:s=>4+0.3*s,fw:()=>8};
const OVERLAP={rmm:1.5,backup:1.5,edr:3,voice:8,fw:0};
const VEND_BASE_DESC={};for(const k in VEND)VEND_BASE_DESC[k]=VEND[k].desc;

const stdProd=cat=>cat==='fw'?'ironclad':S.vend[CATS[cat].vend].prod;
const catLive=cat=>cat==='fw'||cat==='voice'||vendOn(CATS[cat].vend);
function applyProducts(){
  const set=(k,p)=>{const P=PRODS[p];VEND[k].name=P.name;VEND[k].base=P.base;if(P.perSeat)VEND[k].perSeat=P.perSeat;VEND[k].desc=P.desc||VEND_BASE_DESC[k];};
  set('rmm',S.vend.rmm.prod);set('backup',S.vend.backup.prod);set('edr',S.vend.edr.prod);set('carrier',S.vend.carrier.prod);
  SVC.backup.cost=PRODS[S.vend.backup.prod].cost;SVC.security.cost=PRODS[S.vend.edr.prod].cost;
  SVC.telecoms.cost=PRODS[S.vend.carrier.prod].costT;SVC.connect.cost=PRODS[S.vend.carrier.prod].costC;
}
const rmmCut=()=>PRODS[S.vend.rmm.prod].cut;
function migrateSave(){
  const d={rmm:'overwatch',backup:'vaultline',edr:'sentrix',carrier:'northlink'};
  for(const k in d)if(!S.vend[k].prod)S.vend[k].prod=d[k];
  S.onb=S.onb||[];
  for(const s of S.staff){if(!s.fam){s.fam={};if(s.id==='you')Object.assign(s.fam,{northlink:0.9,ironclad:0.6});else for(const k in d)if(S.vend[k].on)s.fam[d[k]]=0.7;}}
  for(const c of S.clients){c.kit=c.kit||{};if(c.rmmDone==null)c.rmmDone=true;for(const cat in c.kit){const k=c.kit[cat];if(k.until==null)k.until=k.state==='renewal'&&k.due?k.due:S.day+(k.left||0)*DPM;}}
  applyProducts();migratePeople();migrateMgrs();
}
/* knowledge */
const fam=(st,p)=>(st.fam&&st.fam[p])||0;
const speedOn=(st,p)=>p?0.55+0.45*fam(st,p):1;
const tech=st=>st.role==='desk'||st.role==='eng'||st.role==='founder'||st.role==='hdm';
function bestFam(p){let b=0;for(const s of S.staff)if(!s.left&&tech(s))b=Math.max(b,fam(s,p));return b;}
function coreProds(){return CAT_ORDER.filter(catLive).map(stdProd);}
function kitInUse(){const m={};for(const c of active())for(const cat in (c.kit||{})){const k=c.kit[cat];if(k.state!=='aligned')m[k.p]=(m[k.p]||0)+1;}return m;}
function knowLearn(learned){
  const core=coreProds(),docs=vendOn('docs');
  for(const s of S.staff){if(!present(s)||!tech(s))continue;s.fam=s.fam||{};
    const q=hasT(s,'quick')?1.4:1;
    for(const p of core){const f=s.fam[p]||0;if(f<0.95)s.fam[p]=f+(1-f)*0.05*(docs?1.5:1)*q;}
    const L=learned[s.id]||{};for(const p in L){const f=s.fam[p]||0;s.fam[p]=Math.min(0.95,f+(1-f)*0.03*L[p]*q);}
  }
}
function courseCost(p){return Math.round((PRODS[p].course||400)*(S.office.rooms.training?0.5:1));}
function relevantProds(){
  const set=new Set(coreProds());for(const p in kitInUse())set.add(p);return [...set];
}
/* client kit */
function genKit(wants){
  const kit={};if(!wants.includes('support'))return kit;
  for(const cat of CAT_ORDER){
    if(cat==='voice'&&wants.includes('telecoms'))continue;
    if(Math.random()<KIT_P[cat]){const p=pick(KIT_POOL[cat]);if(p===stdProd(cat))continue;const left=cat==='fw'?0:ri(0,12);kit[cat]={p,left,state:'new',lock:left>0&&Math.random()<0.3};}
  }
  return kit;
}
function monthsLeft(k){return k.until!=null?Math.max(0,Math.ceil((k.until-S.day)/DPM)):(k.left||0);}
const kitLocked=k=>!!k.lock&&monthsLeft(k)>0;
const kitLabel=(cat,k)=>PRODS[k.p].name+(cat==='fw'?' firewall':cat==='voice'?'':' '+CATS[cat].t.toLowerCase());
/* estimates for a kit decision */
function kitEconomics(c,cat){
  const k=c.kit[cat],s=c.seats,r=blendedRate(true)||35;
  const alignH=ALIGN_H[cat](s);
  const labour=alignH*r;
  const overlap=Math.round(monthsLeft(k)*OVERLAP[cat]*s);
  const svc=CATS[cat].svc;const gain=svc&&!c.svc[svc]?(S.price[svc]-svcCost(svc))*units(c,svc):0;
  const hw=cat==='fw'?{cost:900,bill:1150}:cat==='voice'?{cost:60*s,bill:75*s}:null;
  const bf=bestFam(k.p);
  const asisH=KIT_TIX[cat]*s*1.4;
  const asisNow=asisH/(0.55+0.45*bf)*r+(cat==='rmm'&&vendOn('rmm')?SVC.support.tix*s*rmmCut()*0.94*r:0);
  const asisLater=asisH/(0.55+0.45*0.8)*r+(cat==='rmm'&&vendOn('rmm')?SVC.support.tix*s*rmmCut()*0.94*r:0);
  const alignedH=KIT_TIX[cat]*s*1.4*0.3;const alignedCost=alignedH*r;
  const monthly=gain+Math.max(0,asisNow-alignedCost);
  const upfront=labour+overlap;
  return {alignH,labour,overlap,gain,hw,asisNow,asisLater,bf,upfront,payback:monthly>1?upfront/monthly:99,svc,bl:alignBlock(c,cat),locked:kitLocked(k),left:monthsLeft(k)};
}
function alignBlock(c,cat){
  const v=CATS[cat].vend;
  if(v&&v!=='carrier'&&!vendOn(v))return 'Needs '+VEND[v].name+' in your stack first.';
  if(cat==='edr'&&!hasRole('eng'))return 'Needs an engineer on staff to run managed security.';
  return '';
}
function recommend(c,cat){const E=kitEconomics(c,cat);if(E.bl)return 'asis';if(E.locked)return 'renewal';if(E.payback<=4)return 'align';if(E.left>0&&E.left<=6)return 'renewal';return E.payback<=8?'align':'asis';}
/* onboarding */
function onbFor(cid){return S.onb.find(o=>o.cid===cid);}
function newOnb(c,kind,tasks){
  let o=onbFor(c.id);
  if(o){if(kind==='full'&&o.kind!=='full'){o.kind='full';o.stage='discovery';o.live=false;o.created=S.day;}o.tasks.push(...tasks);return o;}
  o={id:uid(),cid:c.id,kind,stage:kind==='full'?'discovery':'deliver',tasks,created:S.day,found:[],live:kind!=='full'};
  S.onb.push(o);return o;
}
function task(n,hrs,key,prod){return {id:uid(),n,hrs:Math.round(hrs*10)/10,done:0,key,prod:prod||null};}
function startOnboarding(c,svcs,isNew){
  const s=c.seats;
  if(svcs.includes('support')){
    c.rmmDone=false;
    newOnb(c,'full',[task('Discovery audit',4+0.12*s,'disc')]);
    log('Onboarding '+c.name+' has started. Discovery first.','info');
  }
  const light=[];
  for(const k of svcs){
    if(k==='telecoms')light.push(task('Port numbers and set up handsets',2+0.1*s,'svc',stdProd('voice')));
    if(k==='connect')light.push(task('Install the line',3,'svc',stdProd('voice')));
    if(k==='backup')light.push(task('Configure '+VEND.backup.name+' backups',1+0.05*s,'svc',stdProd('backup')));
    if(k==='security')light.push(task('Deploy '+VEND.edr.name+' agents',1+0.1*s,'svc',stdProd('edr')));
    if(k==='m365')light.push(task('Move their Microsoft licences over',1+0.03*s,'svc'));
  }
  if(light.length)newOnb(c,'light',light);
}
function onbHoursEstimate(d){
  const s=dealSeats(d);let h=0;
  if(d.svc.includes('support'))h+=4+0.12*s+(4+0.18*s)*((typeof docsOnb==='function')?docsOnb():(vendOn('docs')?0.8:1))+(vendOn('rmm')?1+0.06*s:0)+2+0.08*s;
  if(d.svc.includes('telecoms'))h+=2+0.1*s;if(d.svc.includes('connect'))h+=3;if(d.svc.includes('backup'))h+=1+0.05*s;if(d.svc.includes('security'))h+=1+0.1*s;if(d.svc.includes('m365'))h+=1+0.03*s;
  return h;
}
function discoveryDone(o){
  const c=C(o.cid);if(!c)return;
  const s=c.seats,skill=avgEngSkill();
  const extra=[];
  if(Math.random()<0.25+0.04*skill){extra.push('Nobody knows the admin passwords');o.tasks.push(task('Recover admin access',3,'extra'));}
  if(Math.random()<0.25+0.04*skill){extra.push('The network is undocumented');o.docMult=1.5;}
  if(c.svc.support&&!(c.projHist||[]).includes('Server to Azure migration')&&!S.deals.some(d=>d.cid===c.id&&d.kind==='project')&&Math.random()<0.2+0.05*skill){extra.push('Their file server is out of support');const d=addProjectDeal(c);if(d){d.proj=Object.assign(d.proj,{name:'Server to Azure migration',est:Math.round(50+s*0.45),value:Math.round((7800+s*110)/50)*50});d.note='Found during discovery.';}}
  o.found=extra;
  const kits=Object.keys(c.kit||{}).filter(cat=>c.kit[cat].state==='new');
  if(kits.length){o.stage='plan';o.plan={};for(const cat of kits)o.plan[cat]=recommend(c,cat);
    log('Discovery at '+c.name+' is done'+(extra.length?' ('+extra.join('; ').toLowerCase()+')':'')+'. They run '+kits.map(cat=>kitLabel(cat,c.kit[cat])).join(', ')+'. The onboarding plan needs your decisions.','event');}
  else{log('Discovery at '+c.name+' is done'+(extra.length?' ('+extra.join('; ').toLowerCase()+')':'')+'. Their kit matches your stack.','info');confirmPlan(o);}
}
function confirmPlan(o){
  const c=C(o.cid);if(!c)return;const s=c.seats;
  o.tasks.push(task('Document the environment',(4+0.18*s)*((typeof docsOnb==='function')?docsOnb():(vendOn('docs')?0.8:1))*(o.docMult||1),'docs'));
  if(vendOn('rmm')&&!(c.kit.rmm&&c.kit.rmm.state==='new'&&o.plan&&o.plan.rmm!=='align'))o.tasks.push(task('Deploy '+VEND.rmm.name+' agents',1+0.06*s,'rmm',stdProd('rmm')));
  o.tasks.push(task('Set up users and welcome pack',2+0.08*s,'users'));
  for(const cat in (o.plan||{})){
    const ch=o.plan[cat],k=c.kit[cat];
    if(ch==='align'){
      k.state='aligning';const E=kitEconomics(c,cat);
      if(E.overlap){spend(E.overlap);}
      if(E.hw){S.co.cash+=E.hw.bill-E.hw.cost;S.m.setup+=E.hw.bill-E.hw.cost;c.sat-=3;}
      o.tasks.push(task('Move them from '+PRODS[k.p].name+' to '+PRODS[stdProd(cat)].name,E.alignH,'align:'+cat,stdProd(cat)));
    }else if(ch==='renewal'){k.state='renewal';k.due=S.day+monthsLeft(k)*DPM;}
    else if(ch==='adopt'){switchStandard(cat,k.p,true);k.state='aligned';}
    else k.state='asis';
  }
  o.stage='deliver';o.plan=null;
}
function taskDone(o,t){
  const c=C(o.cid);if(!c)return;
  if(t.key==='disc')discoveryDone(o);
  if(t.key==='rmm')c.rmmDone=true;
  if(t.key&&t.key.indexOf('align:')===0){const cat=t.key.slice(6);const k=c.kit[cat];if(k){k.state='aligned';const svc=CATS[cat].svc;
    if(cat==='rmm')c.rmmDone=true;
    if(svc&&!c.svc[svc]&&!alignBlock(c,cat)){c.svc[svc]={since:S.day,pm:1};log(c.name+' is now on your '+PRODS[stdProd(cat)].name+'. '+sgbp((S.price[svc])*units(c,svc))+' a month for '+SVC[svc].short.toLowerCase()+'.','good');}
    else log(c.name+' is now on your '+PRODS[stdProd(cat)].name+'.','good');}}
}
function goLive(o){
  const c=C(o.cid);o.live=true;
  const left=o.tasks.filter(t=>t.done<t.hrs-0.01);
  if(c&&left.some(t=>t.key==='users'))c.sat-=6;
  if(c)log(c.name+' is live'+(left.length?' with '+left.length+' task'+(left.length>1?'s':'')+' still to finish':'')+'.',left.length?'event':'good');
}
function onbWork(pool,learned,lab,tidy){
  // onboarding and migrations come before projects; tidy-up after a rushed go-live comes after them
  const order=tidy?S.onb.filter(o=>o.live&&o.kind==='full'):S.onb.filter(o=>o.stage!=='plan'&&!(o.live&&o.kind==='full'));
  for(const o of order){
    for(const t of o.tasks){
      if(t.done>=t.hrs-0.01)continue;
      if(o.stage==='discovery'&&t.key!=='disc')continue;
      for(const w of pool){
        if(w.proj<=0.01)continue;const sp=speedOn(w.st,t.prod);
        const a=Math.min(w.proj,(t.hrs-t.done)/sp);w.proj-=a;t.done+=a*sp;w.used+=a;w.projDone+=a;
        if(t.prod){const L=learned[w.st.id]||(learned[w.st.id]={});L[t.prod]=(L[t.prod]||0)+a;}
        const lb=lab[o.cid]||(lab[o.cid]={h:0,c:0,onb:0});lb.onb=(lb.onb||0)+a*w.rate;
        if(t.done>=t.hrs-0.01){taskDone(o,t);break;}
      }
    }
  }
  // finished onboardings
  for(const o of S.onb.slice()){
    if(o.stage==='plan'||o.stage==='discovery')continue;
    if(o.tasks.every(t=>t.done>=t.hrs-0.01)){S.onb=S.onb.filter(x=>x!==o);const c=C(o.cid);if(c&&!o.live)log(c.name+' is fully onboarded and live.','good');else if(c&&o.kind==='full')log('Onboarding tidy-up for '+c.name+' is finished.','good');}
  }
}
function onbEffects(c){
  // ticket multiplier for a client from their onboarding state
  const o=onbFor(c.id);if(!o)return 1;
  if(!o.live&&o.kind==='full')return 1.3;
  const docsLeft=o.tasks.some(t=>t.key==='docs'&&t.done<t.hrs-0.01);
  return docsLeft?1.25:1;
}
function kitTickets(c,made){
  if(!c.svc.support)return;
  for(const cat in (c.kit||{})){const k=c.kit[cat];if(k.state==='aligned'||k.state==='new')continue;
    const rate=KIT_TIX[cat]*c.seats/DPM;let n=Math.floor(rate)+(Math.random()<rate%1?1:0);
    while(n-->0){const lvl=Math.random()<0.6?2:1;const hrs=lvl===1?rnd(.3,1.1):rnd(1,2.6);const t={id:uid(),cid:c.id,svc:'support',lvl,pri:wpick([[1,.06],[2,.24],[3,.5],[4,.2]]),hrs,left:hrs,born:S.day,br:false,subj:pick(KIT_SUBJ[cat])+' ('+PRODS[k.p].name+')',prod:k.p};S.tickets.push(t);made.push(t);}
  }
}
function renewals(){
  for(const c of active())for(const cat in (c.kit||{})){const k=c.kit[cat];
    if(k.state==='renewal'&&S.day>=k.due){k.state='aligning';k.left=0;newOnb(c,'light',[task('Move them from '+PRODS[k.p].name+' to '+PRODS[stdProd(cat)].name,ALIGN_H[cat](c.seats),'align:'+cat,stdProd(cat))]);log(c.name+'’s '+PRODS[k.p].name+' contract is up. Migration added to onboarding.','event');}}
}
function alignNow(c,cat){
  const k=c.kit[cat];if(!k||k.state==='aligned'||k.state==='aligning')return;
  const E=kitEconomics(c,cat);if(E.bl||E.locked)return;
  if(E.overlap)spend(E.overlap);
  if(E.hw){S.co.cash+=E.hw.bill-E.hw.cost;S.m.setup+=E.hw.bill-E.hw.cost;c.sat-=3;}
  k.state='aligning';
  newOnb(c,'light',[task('Move them from '+PRODS[k.p].name+' to '+PRODS[stdProd(cat)].name,E.alignH,'align:'+cat,stdProd(cat))]);
  log('Migrating '+c.name+' off '+PRODS[k.p].name+(E.overlap?'. Licence overlap '+gbp(E.overlap)+'.':'.'),'info');
}
function switchStandard(cat,p,free){
  const v=CATS[cat].vend;if(!v)return;
  const old=stdProd(cat);if(old===p)return;
  if(!free&&vendOn(v))spend(500);
  S.vend[v].prod=p;S.vend[v].pm=1;S.vend[v].disc=0;S.vend[v].neg=-999;S.vend[v].lock=0;
  applyProducts();
  let n=0;
  for(const c of active()){
    const k=c.kit&&c.kit[cat];
    if(k&&k.p===p){k.state='aligned';continue;}
    const uses=CATS[cat].svc?c.svc[CATS[cat].svc]||(cat==='voice'&&c.svc.connect):(cat==='rmm'&&c.svc.support&&c.rmmDone);
    if(uses&&(!k||k.state==='aligned')){n++;newOnb(c,'light',[task('Migrate to '+PRODS[p].name,ALIGN_H[cat](c.seats)*0.6,'swap',p)]);}
  }
  log('Switched your '+CATS[cat].t.toLowerCase()+' standard from '+PRODS[old].name+' to '+PRODS[p].name+(n?'. '+n+' client migration'+(n>1?'s':'')+' queued, and the team needs to learn it.':'.'),'event');
}
function candFam(role,skill,src){
  const f={};if(role!=='desk'&&role!=='eng'&&role!=='hdm')return f;
  for(const p in PRODS){const P=PRODS[p];let ch=(0.04+0.06*skill)*(src==='rec'?1.3:1)*(P.foreign?0.6:1)*(role==='desk'&&(P.cat==='edr'||P.cat==='fw')?0.5:1);
    if(Math.random()<ch)f[p]=Math.round(rnd(0.5,0.9)*100)/100;}
  return f;
}
