<script>
(function(){
"use strict";
/* ============ helpers ============ */
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const wpick=list=>{let t=0;for(const x of list)t+=x[1];let r=Math.random()*t;for(const x of list){r-=x[1];if(r<=0)return x[0];}return list[0][0];};
const uid=()=>Math.random().toString(36).slice(2,9);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function gbp(n){const neg=n<0;n=Math.abs(n);let s;
  if(n>=1e6)s='£'+(n/1e6).toFixed(2)+'m';
  else s='£'+Math.round(n).toLocaleString('en-GB');
  return (neg?'−':'')+s;}
const sgbp=n=>(n>=0?'+':'')+gbp(n);
/* a share price: show the pence while it's small, fall back to the compact format when large */
function spx(n){n=+n||0;const neg=n<0;n=Math.abs(n);const s=n<1000?'£'+n.toFixed(2):gbp(Math.round(n));return (neg?'−':'')+s;}
const aN=w=>(/^[aeiou]/i.test(w)?'an ':'a ')+w;
const pct=v=>Math.round(v*100)+'%';

/* ============ constants ============ */
const DPM=21, START_Y=2027;
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
const MON3=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const monthOf=day=>Math.floor(day/DPM);
const mLabel=mi=>MONTHS[mi%12]+' '+(START_Y+Math.floor(mi/12));
const mShort=mi=>MON3[mi%12]+' '+String(START_Y+Math.floor(mi/12)).slice(2);
const dLabel=day=>(Math.floor((day%DPM)*30/DPM)+1)+' '+MON3[monthOf(day)%12]+(Math.floor(monthOf(day)/12)!==Math.floor(monthOf(S?S.day:0)/12)?' ’'+String(START_Y+Math.floor(monthOf(day)/12)).slice(2):'');
const SAVE_KEY='tierone.v1';
const OD_LIMIT=10000, LOAN_APR=0.09, OD_APR=0.19;

const SVC={
  telecoms:{name:'Hosted telephony',short:'Telephony',unit:'seat',price:16,cost:9,vendor:'carrier',tix:0.1,l2:0.3},
  connect:{name:'Connectivity',short:'Connectivity',unit:'site',price:290,cost:195,vendor:'carrier',tix:0.35,l2:0.6,setup:350},
  support:{name:'Managed support',short:'Support',unit:'user',price:42,cost:0,vendor:null,tix:0.9,l2:0.2,setup:45},
  m365:{name:'Microsoft 365 licensing',short:'M365',unit:'user',price:12.5,cost:10.8,vendor:'dist',tix:0.05,l2:0.1},
  backup:{name:'Cloud backup',short:'Backup',unit:'user',price:4.5,cost:1.9,vendor:'backup',tix:0.04,l2:0.5},
  security:{name:'Managed security (EDR + SOC)',short:'Security',unit:'user',price:11,cost:5.2,vendor:'edr',tix:0.07,l2:0.5,needEng:true}
};
const SVC_ORDER=['telecoms','connect','support','m365','backup','security'];
const VEND={
  carrier:{name:'Northlink',kind:'Telecoms carrier',base:0,desc:'Lines, SIP trunks and leased circuits. You resell their telephony and connectivity.',svc:['telecoms','connect']},
  dist:{name:'Crestline',kind:'Microsoft distributor',base:0,desc:'Microsoft 365 licences at partner rates. Margins are thin.',svc:['m365']},
  psa:{name:'Ticketwise',kind:'PSA and ticketing',base:45,perStaff:29,desc:'Proper ticket queues and SLA clocks. Everyone on the desk works about 12% faster.'},
  rmm:{name:'Overwatch',kind:'RMM',base:60,perSeat:1.1,desc:'Remote monitoring and patching for supported users. Cuts support tickets by a quarter.'},
  docs:{name:'Keybook',kind:'Documentation',base:15,perStaff:16,desc:'Client documentation and passwords in one place. Desk works 8% faster and onboarding surges are smaller.'},
  backup:{name:'Vaultline',kind:'Backup',base:50,desc:'Microsoft 365 and server backup. Needed to sell cloud backup.',svc:['backup']},
  edr:{name:'Sentrix',kind:'EDR and SOC',base:120,desc:'Endpoint detection with a 24/7 SOC behind it. Needed to sell managed security.',svc:['security']}
};
const VEND_ORDER=['carrier','dist','psa','rmm','docs','backup','edr'];
const ROLES={
  founder:{t:'Founder',short:'Founder',col:'--r-founder'},
  desk:{t:'Service Desk Analyst',short:'Service desk',sal:[1900,2450],col:'--r-desk',blurb:'First line. Password resets, printers, new starters. Only senior analysts (level 4+) can help with second line, and slowly.'},
  eng:{t:'Engineer',short:'Engineer',sal:[2600,3700],col:'--r-eng',blurb:'Second line and projects. Takes escalations, security work and project hours.'},
  am:{t:'Account Manager',short:'Account manager',sal:[2700,3700],col:'--r-am',blurb:'Looks after a book of clients: runs their quarterly reviews, spots and sends cross-sells, and finds new business with spare time. Better ones can carry more clients.'},
  sdm:{t:'Service Delivery Manager',short:'Service delivery',sal:[3400,4400],col:'--r-sdm',blurb:'Runs client reviews and keeps satisfaction up. Takes stack admin off your plate.'}
};
const ROLE_ORDER=['desk','eng','am','sdm'];
const MODES={
  hands:{t:'Hands-on',d:'On the tools',tix:0.8,sales:0.1,mgmt:0.1},
  mixed:{t:'Both',d:'Tools by day, calls after',tix:0.55,sales:0.35,mgmt:0.1},
  sell:{t:'Selling',d:'Out finding work',tix:0.35,sales:0.55,mgmt:0.1},
  manage:{t:'Running it',d:'Clients and team',tix:0.3,sales:0.2,mgmt:0.5}
};
const SENIOR_L2=0.7;
const FOCUS={desk:{t:'Desk first',f:0.8},balanced:{t:'Balanced',f:0.5},projects:{t:'Projects first',f:0.2}};
const TIERS=[
  {name:'Spare room',addr:'Upstairs at home',W:7,H:5,RB:0,cap:2,rent:0,move:0,slots:0},
  {name:'Serviced office',addr:'Suite 4, Moat Lane Business Centre',W:10,H:6.2,RB:0,cap:6,rent:950,move:1500,slots:0,shared:true},
  {name:'Small unit',addr:'Unit 3, Tove Valley Park',W:15,H:12.4,RB:4,cap:12,rent:2400,move:9000,slots:2},
  {name:'Office floor',addr:'First floor, Watling House',W:22,H:15,RB:4,cap:24,rent:5200,move:22000,slots:4},
  {name:'Headquarters',addr:'Leased building, Silverstone Park',W:28,H:17.5,RB:4,cap:45,rent:10500,move:50000,slots:4},
  {name:'Riverside HQ',addr:'Riverside Quarter, Northampton',W:34,H:20,RB:4,cap:70,rent:19000,move:95000,slots:4},
  {name:'Business park campus',addr:'Grange Park Campus',W:42,H:25,RB:4,cap:110,rent:32000,move:190000,slots:4},
  {name:'Flagship campus',addr:'Silverstone Technology Park',W:50,H:30,RB:4,cap:170,rent:55000,move:360000,slots:4},
  {name:'Landmark tower',addr:'Vantage Tower, Northampton Waterside',W:60,H:34,RB:4,cap:250,rent:88000,move:620000,slots:4},
  {name:'National campus',addr:'Catalyst Park, Milton Keynes',W:60,H:34,RB:4,cap:360,rent:140000,move:1050000,slots:4},
  {name:'Corporate estate',addr:'Meridian Quarter, Birmingham',W:60,H:34,RB:4,cap:520,rent:225000,move:1750000,slots:4},
  {name:'Metropolitan HQ',addr:'Canary Wharf, London',W:60,H:34,RB:4,cap:1040,rent:375000,move:3000000,slots:4},
  {name:'Global headquarters',addr:'The Shard, London',W:60,H:34,RB:4,cap:2080,rent:630000,move:5200000,slots:4}
];
/* the drawn floor tops out here: past this many people the sim keeps hiring, but the office
   shows a full, busy room of this size rather than animating a thousand figures at once */
const VIS_DESK_CAP=300;
const ROOMS={
  kitchen:{t:'Kitchen',cost:4000,d:'Morale recovers faster and people stop leaving for coffee runs.'},
  meeting:{t:'Meeting room',cost:6000,d:'Clients come to you. Proposals are 8% more likely to land.'},
  noc:{t:'NOC wall',cost:9000,d:'Screens on every alert. P1 breaches hurt half as much and reputation grows faster.'},
  training:{t:'Training room',cost:5000,d:'Training costs half as much and staff slowly improve on their own.'}
};
const ROOM_ORDER=['kitchen','meeting','noc','training'];
const SECTORS={
  Manufacturing:{tix:1.0,suf:['Precision Engineering','Joinery','Fabrications','Plastics']},
  Legal:{tix:1.15,suf:['& Co Solicitors','Law','Legal LLP']},
  Accountancy:{tix:1.05,suf:['Accountants','& Partners','Tax Advisers']},
  Dental:{tix:0.95,suf:['Dental Practice','Dental Care','Orthodontics']},
  Veterinary:{tix:0.95,suf:['Vets','Veterinary Centre']},
  Logistics:{tix:1.1,suf:['Logistics','Haulage','Freight']},
  Charity:{tix:1.2,suf:['Trust','Foundation','Community Trust']},
  Property:{tix:0.9,suf:['Estates','Lettings','Property Group']},
  Motorsport:{tix:1.25,suf:['Motorsport','Racing','Performance']},
  Architecture:{tix:1.1,suf:['Architects','Design Studio']},
  Care:{tix:1.15,suf:['Care Homes','Home Care']}
};
const PLACES=['Brackley','Towcester','Silverstone','Weedon','Blisworth','Hanslope','Stowe','Olney','Brixworth','Daventry','Buckingham','Roade','Deanshanger','Yardley','Byfield','Kislingbury','Harpole','Long Buckby','Woodford','Middleton','Ashby','Denton','Whitmore','Kingsley','Oakridge','Pembroke','Radford','Tove','Nene Valley','Watling'];
const WANTS=[[['telecoms'],3],[['telecoms','connect'],2],[['support'],2.2],[['support','m365'],2],[['m365'],1.2],[['support','m365','backup'],1],[['connect'],1],[['security'],0.5]];
const PROJ=[
  {n:'Microsoft 365 migration',h:s=>12+s*0.7,v:s=>(12+s*0.7)*95},
  {n:'Firewall and Wi-Fi refresh',h:s=>20+s*0.3,v:s=>(20+s*0.3)*100+700+s*12},
  {n:'Laptop rollout',h:s=>6+s*0.9,v:s=>(6+s*0.9)*90+s*30},
  {n:'Server to Azure migration',h:s=>40+s*0.8,v:s=>(40+s*0.8)*105},
  {n:'Office move',h:s=>24+s*0.45,v:s=>(24+s*0.45)*95},
  {n:'Cyber Essentials Plus readiness',h:s=>16+s*0.25,v:s=>(16+s*0.25)*110},
  {n:'Intune device rollout',h:s=>12+s*0.5,v:s=>(12+s*0.5)*100}
];
const SUBJ={
  support:['Outlook keeps asking for a password','Can’t print to the office printer','New starter needs a laptop','Teams keeps crashing','Password reset','Shared drive has vanished','Laptop running slow','Clicked a link in a dodgy email','MFA not working on new phone','Wi-Fi drops in the meeting room','Excel file locked for editing','OneDrive not syncing','Leaver: disable account','Monitor flickering','VPN won’t connect','Scanner to email broken'],
  telecoms:['Handset not registering','Call queue not ringing','Voicemail to email broken','Divert needed for bank holiday','One-way audio on calls','Add a hunt group'],
  connect:['Internet down at site','Broadband crawling','Leased line flapping','Static IP request'],
  m365:['Need an extra licence','Shared mailbox access','Licence still on a leaver'],
  backup:['Restore a deleted folder','Backup job failed','Restore an old email'],
  security:['EDR alert on a laptop','Sign-in from abroad','Release quarantined file','Isolate infected device']
};
const FIRST=['Amelia','Josh','Priya','Tom','Hannah','Callum','Sophie','Ryan','Megan','Dan','Aisha','Liam','Chloe','Ben','Zara','Kieran','Ellie','Marcus','Grace','Owen','Nadia','Jack','Holly','Sam','Freya','Adam','Leah','Rob','Imogen','Harvey','Tariq','Jess','Kofi','Lucy'];
const LAST=['Shah','Turner','Walsh','Clarke','Hughes','Patel','Morgan','Bennett','Doyle','Price','Khan','Barnes','Fletcher','Reid','Nolan','Ellis','Pearce','Singh','Hart','Lowe','Okafor','Byrne'];
const CLOTHES=['#C0504D','#4F81BD','#8FB352','#8064A2','#E8913F','#2C3E50','#D98C9A','#7F8C8D','#D9A441','#3B7A57','#5B8FA8','#A0522D'];
const SKIN=['#F1C9A5','#E0AC7E','#C68642','#8D5524','#5C3A21'];
const HAIR=['#2B1B10','#5A3825','#A0522D','#D8B25A','#8A8A8A','#111111','#B5462F'];
const LEGS=['#2C3440','#3B3B3B','#4A5568','#5B4636','#1F2A44'];
const look=()=>({top:pick(CLOTHES),skin:pick(SKIN),hair:pick(HAIR),legs:pick(LEGS),long:Math.random()<0.4});

/* ============ state ============ */
let S=null;
const ui={tab:'desk',modal:null,confirm:false,flash:''};
const blankLedger=()=>({comm:0,rec:0,setup:0,proj:0,vend:0,tools:0,sal:0,rent:0,other:0,int:0,invest:0,branch:0,leads:0,won:0,lost:0,newc:0,gone:0});
function vstate(on){return {on:!!on,disc:0,pm:1,neg:-999};}
function newState(founder,company){
  S={v:1,day:0,co:{name:company,founder,cash:6000,loan:0,rep:30,red:0,mode:'hands',ce:false},
    office:{tier:0,rooms:{}},
    staff:[{id:'you',role:'founder',name:founder,skill:3,salary:0,morale:85,start:0,desk:0,focus:'balanced',look:Object.assign(look(),{top:'#2156C9'}),util:0,hot:0,away:0}],
    clients:[],tickets:[],projects:[],deals:[],cands:{},
    vend:{carrier:Object.assign(vstate(1),{prod:'northlink'}),dist:vstate(1),psa:vstate(0),rmm:Object.assign(vstate(0),{prod:'overwatch'}),docs:vstate(0),backup:Object.assign(vstate(0),{prod:'vaultline'}),edr:Object.assign(vstate(0),{prod:'sentrix'})},onb:[],
    price:Object.fromEntries(SVC_ORDER.map(k=>[k,SVC[k].price])),
    m:blankLedger(),last:null,hist:[],log:[],sla:[],miles:{},nextEvent:16,pending:null,over:null,seq:0,seen:0,flags:{},used:{}};
  const c1=makeClient('Brackley Joinery','Manufacturing',14,['telecoms']);c1.sat=74;c1.trust=46;
  const c2=makeClient('Greens Norton Vets','Veterinary',8,['telecoms','connect']);c2.sat=68;c2.trust=34;
  S.clients.push(c1,c2);
  c1.svc.telecoms.since=-200;c2.svc.telecoms.since=-200;c2.svc.connect.since=-200;
  migrateSave();
  S.deals.push({id:uid(),kind:'cross',cid:c1.id,svc:['support'],created:0,exp:30,stage:'open',kit:{edr:{p:'shieldpro',left:4,state:'new'},fw:{p:'gatekeeper',left:0,state:'new'}},note:'Their office manager asked if you “do computers too”.'});
  addProspect({name:'Towcester Lettings',sector:'Property',seats:7,wants:['support','m365'],exp:24});
  log('You quit your job, cleared the spare room and started '+company+'. Two telephony clients came with you.','info');
  return S;
}
function makeClient(name,sector,seats,svcs){
  const c={id:uid(),name,sector,seats,svc:{},sat:70,trust:30,since:S.day,notice:null,review:-999};
  svcs.forEach(k=>c.svc[k]={since:S.day,pm:1});
  S.used[name]=1;return c;
}
function genName(sector){
  for(let i=0;i<30;i++){const n=pick(PLACES)+' '+pick(SECTORS[sector].suf);if(!S.used[n]){S.used[n]=1;return n;}}
  return pick(PLACES)+' '+pick(SECTORS[sector].suf)+' '+ri(2,9);
}
const C=id=>S.clients.find(c=>c.id===id);
const ST=id=>S.staff.find(s=>s.id===id);
const units=(c,k)=>SVC[k].unit==='site'?Math.max(1,Math.ceil(c.seats/30)):c.seats;
const svcPrice=(c,k)=>S.price[k]*(c.svc[k]?c.svc[k].pm:1);
const clientMRR=c=>Object.keys(c.svc).reduce((a,k)=>a+svcPrice(c,k)*units(c,k),0);
const active=()=>S.clients.filter(c=>!c.gone);
const mrr=()=>active().reduce((a,c)=>a+clientMRR(c),0);
const started=st=>S.day>=st.start;
const present=st=>started(st)&&!(st.away>S.day)&&!st.left;
const staffOn=()=>S.staff.filter(s=>!s.left);
const hasRole=r=>S.staff.some(s=>s.role===r&&started(s)&&!s.left);
const vendOn=k=>S.vend[k].on;
const toolsOn=()=>VEND_ORDER.filter(k=>S.vend[k].on).length;
const cap=()=>TIERS[S.office.tier].cap;
const svcUsers=k=>active().reduce((a,c)=>a+(c.svc[k]?units(c,k):0),0);
function csat(){const a=active();if(!a.length)return 0;let w=0,t=0;for(const c of a){const m=Math.max(50,clientMRR(c));w+=m;t+=c.sat*m;}return t/w;}
function slaPct(){let ok=0,br=0;for(const d of S.sla.slice(-DPM)){ok+=d.ok;br+=d.br;}return ok+br?ok/(ok+br):1;}
function log(text,kind){S.seq++;S.log.unshift({d:S.day,text,kind:kind||'info',n:S.seq});if(S.log.length>120)S.log.pop();}
function spend(v){S.co.cash-=v;S.m.other+=v;}
function vendMonthly(k){
  const v=VEND[k],s=S.vend[k];if(!s.on)return 0;
  let t=v.base*s.pm;
  if(v.perStaff)t+=v.perStaff*staffOn().length*s.pm*(1-s.disc);
  if(v.perSeat)t+=v.perSeat*svcUsers('support')*s.pm*(1-s.disc);
  return t;
}
function svcCost(k){const v=SVC[k].vendor;const s=v?S.vend[v]:null;return SVC[k].cost*(s?s.pm*(1-s.disc):1);}
function costOfSales(){let t=0;for(const c of active())for(const k in c.svc)t+=svcCost(k)*units(c,k);return t;}
const ONCOST=0.15;
function payroll(){return staffOn().filter(started).reduce((a,s)=>a+s.salary,0)*(1+ONCOST);}
function toolsCost(){return VEND_ORDER.reduce((a,k)=>a+vendMonthly(k),0);}
function burn(){return costOfSales()+payroll()+toolsCost()+TIERS[S.office.tier].rent+S.co.loan*LOAN_APR/12;}
function loanLimit(){return Math.floor((15000+groupMRR()*4)/5000)*5000;}
function speedOf(st){
  const ramp=st.id!=="you"&&S.day-st.start<15?0.6+0.4*(S.day-st.start)/15:1;
  const psaM=(typeof psaMult==='function')?psaMult():(vendOn('psa')?1.12:1);
  const docM=(typeof docsMult==='function')?docsMult():(vendOn('docs')?1.08:1);
  return (0.62+0.12*st.skill)*(0.7+0.3*st.morale/100)*ramp*psaM*docM*traitSpeed(st)*mgrSpeed(st);
}
function hoursOf(st){
  const sp=speedOf(st);
  if(st.role==='founder'){const H=9*sp,f=MODES[S.co.mode];return {total:H,tix:H*f.tix,proj:0,sales:H*f.sales,mgmt:H*f.mgmt};}
  const H=7.5*sp;
  if(st.role==='desk')return {total:H,tix:H,proj:0,sales:0,mgmt:0};
  if(st.role==='eng'){const f=FOCUS[st.focus||'balanced'].f;return {total:H,tix:H*f,proj:H*(1-f),sales:0,mgmt:0};}
  if(st.role==='am')return {total:H,tix:0,proj:0,sales:H,mgmt:0};
  if(st.role==='hdm')return {total:H,tix:H*0.25,proj:0,sales:0,mgmt:0};
  if(st.role==='sm'){const team=ams().filter(a=>present(a)).length;return {total:H,tix:0,proj:0,sales:H*(team>=3?0.35:team>=1?0.5:0.7),mgmt:0};}
  return {total:H,tix:0,proj:0,sales:0,mgmt:H};
}

/* ============ tickets ============ */
const HD=7.5,SLA_H={1:4,2:8,3:22.5,4:37.5},RESP_H={1:0.5,2:1,3:4,4:7.5};
const bornAt=t=>t.born*HD+(t.bh||0);
const tAge=t=>(S.day+1)*HD-bornAt(t);
function mkTicket(c,k){
  const d=SVC[k];const lvl=Math.random()<d.l2?2:1;
  const pri=k==='security'?wpick([[1,.15],[2,.35],[3,.4],[4,.1]]):wpick([[1,.04],[2,.2],[3,.56],[4,.2]]);
  const hrs=lvl===1?rnd(.15,0.9):rnd(.6,1.8);
  let prod=null;const kp=cat=>{const x=c.kit&&c.kit[cat];return x&&x.state!=='aligned'&&x.state!=='new'?x.p:(catLive(cat)?stdProd(cat):null);};
  if(k==='telecoms'||k==='connect')prod=kp('voice');else if(k==='backup')prod=kp('backup');else if(k==='security')prod=kp('edr');
  else if(k==='support'){const r=Math.random();if(r<0.2)prod=kp('rmm');else if(r<0.3)prod=kp('fw');}
  const subj=pick(SUBJ[k]);let P=pri,H=hrs,Lv=lvl;
  if(/dodgy|abroad|Isolate|infected|EDR alert|Internet down|Leased line flapping/.test(subj))P=Math.min(P,2);
  if(/Internet down|Isolate infected/.test(subj))P=1;
  if(/Password reset|Leaver|New starter|licence|Static IP|hunt group|Divert|Monitor|printer|Scanner|Shared mailbox/i.test(subj))P=Math.max(P,3);
  if(/Password reset|MFA|Shared mailbox|licence|Leaver/i.test(subj)){Lv=1;H=Math.min(H,rnd(0.15,0.4));}
  return {id:uid(),cid:c.id,svc:k,lvl:Lv,pri:P,hrs:H,left:H,born:S.day,br:false,subj,prod};
}
function genTickets(){
  const made=[];
  for(const c of active()){
    for(const k in c.svc){
      let rate=SVC[k].tix*units(c,k)*SECTORS[c.sector].tix/DPM;
      if(k==='support'){if(vendOn('rmm')&&c.rmmDone&&!(c.kit&&c.kit.rmm&&c.kit.rmm.state!=='aligned'))rate*=1-rmmCut();rate*=onbEffects(c);}
      if(k==='backup')rate*=PRODS[stdProd('backup')].tix||1;if(k==='security')rate*=PRODS[stdProd('edr')].tix||1;if(k==='telecoms'||k==='connect')rate*=PRODS[stdProd('voice')].tix||1;
      let n=Math.floor(rate)+(Math.random()<rate%1?1:0);
      while(n-->0){const t=mkTicket(c,k);S.tickets.push(t);made.push(t);}
    }
    kitTickets(c,made);
  }
  return made;
}
function backlogHours(){return S.tickets.reduce((a,t)=>a+t.left,0);}
function deskCapacity(){let h=0;for(const s of S.staff)if(present(s)){const x=hoursOf(s);h+=x.tix+(s.role==='eng'?x.proj*0.5:0);}return h;}

/* ============ the day ============ */
function step(){
  const today={ok:0,br:0,made:0};
  const made=genTickets();for(const t of made)if(t.bh==null)t.bh=rnd(0,HD);today.made=made.length;today.mh=0;today.l1in=0;today.l2in=0;today.bySvc={};for(const t of made){today.mh+=t.hrs;today[t.lvl===2?'l2in':'l1in']+=t.hrs;const k=t.prod&&PRODS[t.prod]&&PRODS[t.prod].foreign?'kit':t.svc;today.bySvc[k]=(today.bySvc[k]||0)+t.hrs;}
  // staff returning / leaving
  for(const s of S.staff){if(s.leaveOn!=null&&S.day>=s.leaveOn&&!s.left){s.left=true;S.qs.leavers++;log(s.name+' has left '+S.co.name+'.','bad');unassign(s.id);}}
  S.staff=S.staff.filter(s=>!s.left||s.id==='you');
  const W=S.staff.filter(present).map(st=>{const h=hoursOf(st);return {st,rate:hourRate(st,h.total),tix:h.tix,proj:h.proj,sales:h.sales,mgmt:h.mgmt,total:h.total,used:0,l2:st.role==='eng'||st.role==='founder',done:0,projDone:0};});
  // time already committed: account reviews, meetings
  for(const w of W){if(w.st.busyH>0&&w.st.role!=='founder'){const a=Math.min(w.sales+w.mgmt,w.st.busyH);const fromS=Math.min(w.sales,a);w.sales-=fromS;w.mgmt-=a-fromS;w.used+=a;w.st.busyH-=a;}if(w.st.qcH>0){const q=Math.min(w.tix,w.st.qcH);w.tix-=q;w.used+=q;w.st.qcH-=q;}}
  // stack admin
  let admin=toolsOn()*0.3+Object.keys(kitInUse()).length*0.15;
  const sdmW=W.filter(w=>w.st.role==='sdm'),fW=W.find(w=>w.st.role==='founder');
  for(const w of sdmW){const a=Math.min(admin,w.mgmt);w.mgmt-=a;w.used+=a;admin-=a;}
  if(fW&&admin>0){let a=Math.min(admin,fW.mgmt);fW.mgmt-=a;fW.used+=a;admin-=a;a=Math.min(admin,fW.tix);fW.tix-=a;fW.used+=a;}
  if(fW&&S.co.busy){let b=Math.min(3.5,S.co.busy);for(const f of ['sales','mgmt','tix']){const a=Math.min(b,fW[f]);fW[f]-=a;fW.used+=a;b-=a;}}
  // tickets pass 1
  S.tickets.sort((a,b)=>a.pri-b.pri||a.born-b.born);
  const desk=W.filter(w=>w.st.role==='desk'||w.st.role==='hdm'),eng=W.filter(w=>w.st.role==='eng'),fo=W.filter(w=>w.st.role==='founder');
  const lab={},learned={};
  // acknowledging new tickets: easy when there's slack, slips when the desk is saturated
  {let cap=0;for(const w of W)cap+=w.tix;const load=S.tickets.reduce((a,t)=>a+t.left,0)||1;const r=cap/load;for(const t of made){if(t.oneoff||t.first!=null)continue;if(Math.random()<Math.min(1,r*(t.pri===1?3:t.pri===2?2:1.2))){t.first=0.2;today.rOk=(today.rOk||0)+1;}}}
  const sen=desk.filter(w=>w.st.role==='desk'&&(w.st.skill||0)>=4);
  const byFam=(arr,p)=>arr.slice().sort((x,y)=>(p?fam(y.st,p)-fam(x.st,p):0)||(x.used/(x.total||1)-y.used/(y.total||1)));
  const work=(field)=>{
    for(const t of S.tickets){
      if(t.left<=0)continue;
      const order=t.lvl===2?byFam(eng,t.prod).concat(byFam(sen,t.prod),fo):byFam(desk,t.prod).concat(byFam(eng,t.prod),fo);
      for(const w of order){if(t.left<=0)break;if(w[field]<=0.01)continue;const sp=speedOn(w.st,t.prod)*(t.lvl===2&&w.st.role==='desk'?SENIOR_L2:1);const a=Math.min(w[field],t.left/sp);const st0=Math.max(S.day*HD+Math.min(w.used,HD),bornAt(t));if(t.first==null){t.first=st0-bornAt(t);if(!t.oneoff){if(t.first<=RESP_H[t.pri])today.rOk=(today.rOk||0)+1;else today.rBr=(today.rBr||0)+1;}}w[field]-=a;t.left-=a*sp;w.used+=a;t.res=st0+a-bornAt(t);if(!t.oneoff&&t.cid){const lb=lab[t.cid]||(lab[t.cid]={h:0,c:0});lb.h+=a;lb.c+=a*w.rate;}
        if(t.prod){const L=learned[w.st.id]||(learned[w.st.id]={});L[t.prod]=(L[t.prod]||0)+a;}
        if(t.left<=0.001){w.done++;w.last=t;onClose(w.st,t,null);}}
    }
  };
  work('tix');
  // urgent work comes before project time
  if(S.tickets.some(t=>t.left>0.001&&t.pri<=2&&!t.oneoff)){for(const w of eng.concat(fo)){w.tix+=w.proj;w.proj=0;}work('tix');}
  // projects
  for(const w of eng.concat(fo)){w.proj+=w.tix;w.tix=0;}
  onbWork(eng.concat(fo),learned,lab);
  S.projects.sort(typeof projOrder==='function'?projOrder:(a,b)=>a.due-b.due);
  for(const p of S.projects){
    for(const w of eng.concat(fo)){const need=p.actual-p.done;if(need<=0)break;if(w.proj<=0.01)continue;const a=Math.min(w.proj,need);w.proj-=a;const pm_=projMult(w.st);p.done+=a*pm_;if(hasT(w.st,'goldplater'))p.gold=true;if(pm_<1){w.st.slip=(w.st.slip||0)+a*(1-pm_);}w.used+=a;w.projDone+=a;p.cost=(p.cost||0)+a*w.rate;}
  }
  onbWork(eng.concat(fo),learned,lab,true);
  // leftover project hours back to tickets
  work('proj');
  // close tickets
  const keep=[];
  const slaHit=t=>{t.br=true;if(t.oneoff)return;today.br++;const c=C(t.cid);if(c){let hit={1:6,2:3,3:1.4,4:0.7}[t.pri];if(t.pri===1&&S.office.rooms.noc)hit/=2;if(S.staff.some(s=>s.role==='sdm'&&present(s)&&hasT(s,'process')))hit*=0.7;c.sat=Math.max(0,c.sat-hit);}};
  for(const t of S.tickets){if(t.left<=0.001){if(t.br||t.oneoff){}else if((t.res||0)>SLA_H[t.pri])slaHit(t);else{today.ok++;const c=C(t.cid);if(c)c.sat=Math.min(100,c.sat+0.12);}}else keep.push(t);}
  S.tickets=keep;
  // breaches
  for(const t of S.tickets){
    if(!t.br&&tAge(t)>SLA_H[t.pri])slaHit(t);
    if(t.first==null&&!t.rb&&!t.oneoff&&tAge(t)>RESP_H[t.pri]){t.rb=true;today.rBr=(today.rBr||0)+1;}
  }
  S.sla.push(today);if(S.sla.length>DPM*2)S.sla.shift();
  // tickets left rotting keep annoying the client every day, not just once
  for(const t of S.tickets){if(t.br&&t.cid&&!t.oneoff&&tAge(t)>SLA_H[t.pri]*2){const c=C(t.cid);if(c)c.sat=Math.max(0,c.sat-0.04);}}
  S.qs.ok+=today.ok;S.qs.br+=today.br;
  today.cap={};for(const w of W){const r=w.st.role;const c=today.cap[r]||(today.cap[r]={n:0,tot:0,used:0,tix:0,proj:0});c.n++;c.tot+=w.total;c.used+=w.used;c.tix+=w.tix;c.proj+=w.proj;}today.backlog=backlogHours();today.pj=W.filter(w=>w.st.role==='desk'||w.st.role==='eng').reduce((a,w)=>a+(w.projDone||0),0);today.tu=W.filter(w=>w.st.role==='desk'||w.st.role==='eng').reduce((a,w)=>a+w.used,0);
  knowLearn(learned);renewals();peopleDaily(W);mgrDaily();
  // rolling monthly labour per client (exponential average of the last month or so)
  for(const c of active()){const x=lab[c.id]||{h:0,c:0};c.lc=(c.lc||0)*(1-1/DPM)+x.c;c.lh=(c.lh||0)*(1-1/DPM)+x.h;}
  // utilisation and morale
  for(const w of W){
    const u=w.total>0?w.used/w.total:0;const s=w.st;
    const effU=(s.role==='am'||s.role==='sdm'||s.role==='hdm'||s.role==='sm'||s.role==='pm'||s.role==='tm'||s.role==='bill'||s.role==='bm')?0.85:u;
    s.util=s.util*0.85+effU*0.15;
    s.hotDays=s.util>0.97?(s.hotDays||0)+1:Math.max(0,(s.hotDays||0)-2);
    if(S.office.rooms.training&&s.role!=='founder'){s.xp=(s.xp||0)+(hasT(s,'quick')?0.02:0.01);if(s.xp>=1&&s.skill<5){s.xp=0;s.skill++;s.skillAt=S.day;log(s.name+' has grown into a level '+s.skill+' '+ROLES[s.role].short.toLowerCase()+'.','good');}}
    if(s.role!=='founder'&&s.morale<30&&s.leaveOn==null&&!s.resignQ&&Math.random()<0.01){s.resignQ=true;S.hq.push({id:'resign',ctx:{sid:s.id}});}
  }
  // management cover
  const mgmtH=W.reduce((a,w)=>a+w.mgmt,0);
  const cover=active().length?clamp(mgmtH*DPM/(active().length*3),0,1):1;
  S.cover=cover;
  // client drift
  for(const c of active()){
    const pm=Object.values(c.svc).reduce((a,x)=>Math.max(a,x.pm),0);
    const pr=priceRatio(c);const target=60+12*cover+(S.office.rooms.noc?2:0)-Math.max(0,pr-1.05)*45+Math.max(0,1-pr)*20;
    const ob=onbFor(c.id);const drag=ob&&!ob.live&&ob.kind==='full'&&S.day-ob.created>((typeof pmOn==='function'&&pmOn())?32:15)?8:0;
    c.sat+=(target+(amOf(c)?3:0)-drag-c.sat)*0.025;
    c.trust=clamp(c.trust+(c.sat-55)/300,0,100);
    c.sat=clamp(c.sat,0,100);
  }
  const cs=csat();
  // reputation drifts towards what clients actually experience: satisfaction, dragged down hard by missed SLAs
  {const slaNow=slaPct();const tgt=clamp(cs*0.95-Math.max(0,0.9-slaNow)*150,5,95);S.co.rep=clamp(S.co.rep+(tgt-S.co.rep)*0.003*(S.office.rooms.noc?1.3:1),5,100);}
  // projects due / complete
  for(const p of S.projects.slice()){
    if(p.done>=p.actual-0.01&&S.day-p.start>=(p.min||0)){finishProject(p);continue;}
    if(!p.late&&S.day>p.due){p.late=true;const c=C(p.cid);if(c){c.sat=Math.max(0,c.sat-8);c.trust=Math.max(0,c.trust-5);}log(p.name+' for '+(c?c.name:'a client')+' has missed its deadline.','bad');}
  }
  // sales: account managers spend what their book leaves them on new business
  const salesH=W.reduce((a,w)=>{let h=w.sales*(hasT(w.st,'hunter')?1.3:1)*(hasT(w.st,'farmer')?0.7:1)*(w.st.role==='am'?smSales():1)*(w.st.role==='founder'&&active().length<10?1.6:1);if(w.st.role==='am'){const cap=amCap(w.st);h*=1-0.6*Math.min(1,amLoad(w.st)/cap);}return a+h*(0.7+0.1*w.st.skill);},0);
  S.salesH=salesH;
  const room=marketRoom();
  let lead=salesH*LEAD_K*(0.6+S.co.rep/100);
  for(const c of active())if(c.sat>80)lead+=0.003;   // referrals from happy clients
  lead*=room;   // saturation gates both your selling and word-of-mouth: a full region has few businesses left to refer
  // a young firm still gets the odd inbound enquiry through word of mouth, even with nobody actively selling — so a new player left on Hands-on isn't stuck with a dead pipeline
  if(S.day<DPM*4&&active().length<10)lead=Math.max(lead,0.06);
  if(S.deals.length<14&&Math.random()<lead){addProspect();}
  for(const c of active()){
    if(c.notice!=null||S.deals.length>=14)continue;
    const am=amOf(c);
    const f=am&&present(am)?1.6+0.15*am.skill:1+(S.co.mode==='manage'?0.2:0);
    if(!S.deals.some(d=>d.cid===c.id&&d.kind!=='project')&&Math.random()<0.0035*(0.4+c.trust/100)*f*(typeof attachRoom==='function'?attachRoom(c):1))addCross(c);
    if(c.svc.support&&!S.deals.some(d=>d.cid===c.id&&d.kind==='project')&&!S.projects.some(p=>p.cid===c.id)&&Math.random()<0.002*(0.4+c.trust/100)*f)addProjectDeal(c);
    // quarterly account review by the client's account manager
    if(am&&present(am)&&S.day-c.review>=63&&Math.random()<0.25)doReview(c,am);
  }
  // account managers write up proposals, then ask you to sign them off
  for(const d of S.deals){
    if(d.stage!=='open'||d.draft)continue;
    if(d.drafter){const am=ST(d.drafter);if(!am||am.left){d.drafter=null;continue;}
      if(S.day>=d.draftDue&&present(am))finishDraft(d,am);continue;}
    const c=d.cid?C(d.cid):null;let am=c?amOf(c):null;
    if(!am&&d.kind==='new'){const pool=ams().filter(s=>present(s));if(pool.length)am=pool.sort((a,b)=>amLoad(a)/amCap(a)-amLoad(b)/amCap(b))[0];}
    if(am&&present(am)){d.drafter=am.id;d.draftDue=S.day+ri(1,2);}
  }
  // deals
  for(const d of S.deals.slice()){
    if(d.stage==='pitched'&&S.day>=d.resolve)resolveDeal(d);
    else if(d.stage==='open'&&S.day>=d.exp){if(d.draft&&!d.chased){d.chased=true;d.exp=S.day+7;log((d.kind==='new'?d.name:(C(d.cid)||{}).name||'A client')+' is still waiting on your proposal. Sign it off soon or they’ll look elsewhere.','bad');}else{S.deals=S.deals.filter(x=>x!==d);S.m.expired=(S.m.expired||0)+1;log((d.kind==='new'?d.name:(C(d.cid)||{}).name||'A client')+' went elsewhere while the proposal sat in your inbox.','info');}}
  }
  // day advances
  V.lastW=W;
  S.day++;
  if(S.day%DPM===0)monthEnd();
  checkMiles();
  if(!S.over&&!S.pending&&S.day>=S.nextEvent)fireEvent();
  return {W,made,today};
}
function finishProject(p){
  S.projects=S.projects.filter(x=>x!==p);
  const c=C(p.cid);
  const fin=Math.max(0,p.value-(p.paid!=null?p.paid:p.value*0.5));S.co.cash+=fin;S.m.proj+=fin;
  const over=p.actual/p.est;
  if(c){if(!p.late){c.sat=Math.min(100,c.sat+4);c.trust=Math.min(100,c.trust+6);}if(p.gold){c.sat=Math.min(100,c.sat+4);log(c.name+' loved the finish on the '+p.name.toLowerCase()+'.','good');}}
  log(p.name+' for '+(c?c.name:'a client')+' is done'+(over>1.15?', '+Math.round((over-1)*100)+'% over on hours':'')+'. Final invoice '+gbp(fin)+'.',over>1.25||p.late?'event':'good');
}

/* ============ sales ============ */
function addProspect(o){
  o=o||{};
  const sector=o.sector||pick(Object.keys(SECTORS));
  // the big local businesses go first, so as the home patch saturates the prospects left are smaller
  const sat=(typeof homeSaturation==='function')?homeSaturation():0;
  const maxSeats=(14+Math.min(S.co.rep,60)*0.6+Math.min(S.office.tier,2)*12)*(1-0.4*sat);
  const seats=o.seats||Math.max(3,Math.round(rnd(4,maxSeats)*rnd(0.55,1)));
  const wants=o.wants||wpick(WANTS);
  const d={id:uid(),kind:'new',name:o.name||genName(sector),sector,seats,svc:wants.slice(),created:S.day,exp:S.day+(o.exp||18),stage:'open',note:o.note||'',kit:genKit(wants)};
  S.deals.push(d);S.m.leads++;
  if(!o.silent)log('New lead: '+d.name+' ('+seats+' users) wants '+wants.map(k=>SVC[k].short.toLowerCase()).join(' and ')+'.','info');
  return d;
}
function nextFor(c){
  const has=k=>!!c.svc[k];const w=[];
  if(!has('support'))w.push(['support',has('telecoms')?4:2]);
  if(has('support')&&!has('m365'))w.push(['m365',3]);
  if(has('m365')&&!has('backup'))w.push(['backup',3]);
  if(has('support')&&!has('security'))w.push(['security',2]);
  if(!has('telecoms'))w.push(['telecoms',1.5]);
  if(!has('connect'))w.push(['connect',1]);
  return w.length?wpick(w):null;
}
function addCross(c,k,note){
  if(c.notice!=null)return null;
  k=k||nextFor(c);if(!k)return null;
  const d={id:uid(),kind:'cross',cid:c.id,svc:[k],created:S.day,exp:S.day+25,stage:'open',note:note||'',kit:k==='support'?genKit(['support'].concat(Object.keys(c.svc))):null};
  S.deals.push(d);S.m.leads++;
  const am=amOf(c);
  log((am?am.name+' spotted that '+c.name+' could use ':c.name+' is interested in ')+SVC[k].short.toLowerCase()+'.','info');
  return d;
}
/* account manager drafts */
function amPick(d,am){
  const byRev=comm().basis==='rev';
  const val=p=>{const E=dealEstimate(d,p);return winChance(d,p)*(E.project?(byRev?E.q:E.margin):(byRev?E.rev:E.margin)*12);};
  let i=PM_OPTS.reduce((b,p,j)=>val(p)>val(PM_OPTS[b])?j:b,2);
  if(Math.random()<(5-am.skill)*0.12)i=clamp(i+(Math.random()<0.5?-1:1),0,PM_OPTS.length-1);
  if(hasT(am,'hunter'))i=Math.max(0,i-1);
  return PM_OPTS[i];
}
function finishDraft(d,am){
  const bl=blockers(d);const pm=amPick(d,am);
  d.draft={by:am.id,pm,blocked:bl[0]||''};
  if(!bl.length&&smApproves(d,pm)){const sm=mgrOn('sm');d.by=am.id;sendDeal(d,pm);log(sm.name+' signed off '+am.name+'’s proposal for '+dealName(d)+(pm<1?' at '+pct(1-pm)+' off':'')+'.','info');return;}
  const c=d.cid?C(d.cid):null;
  if(!bl.length&&am.auto===true&&d.kind==='cross'){d.by=am.id;sendDeal(d,pm);log(am.name+' sent '+dealName(d)+' a proposal for '+SVC[d.svc[0]].short.toLowerCase()+'.','info');return;}
  log(am.name+' has a proposal for '+dealName(d)+' ready for your sign-off'+(bl.length?', but flags a problem: '+bl[0]:'')+'.','info');
}
/* account manager books */
const amCap=s=>5+s.skill*5;
const amLoad=s=>active().filter(c=>c.am===s.id).length;
function amOf(c){if(!c.am)return null;const s=ST(c.am);if(!s||s.left){c.am=null;return null;}return s;}
const ams=()=>S.staff.filter(s=>s.role==='am'&&!s.left);
const reviewDue=c=>!amOf(c)&&c.notice==null&&S.day-c.review>=63;
const amName=c=>{const a=amOf(c);return a?a.name:'You';};
function unassign(sid){let n=0;for(const c of S.clients)if(c.am===sid){c.am=null;n++;}if(n)log(n+' client'+(n>1?'s have':' has')+' no account manager now.','bad');}
function autoAssign(c){const free=ams().filter(s=>amLoad(s)<amCap(s)).sort((a,b)=>(amCap(b)-amLoad(b))-(amCap(a)-amLoad(a)));if(free.length){c.am=free[0].id;return free[0];}return null;}
function doReview(c,by){
  c.review=S.day;if(by&&(by.role==='am'||by.role==='sdm'))by.busyH=(by.busyH||0)+REVIEW_H;else S.co.busy=(S.co.busy||0)+REVIEW_H;const sdm=hasRole('sdm');
  const k=by&&by.role==='am'?0.7+0.1*by.skill:1;
  c.trust=Math.min(100,c.trust+(sdm?10:7)*k);c.sat=Math.min(100,c.sat+(sdm?8:5)*k);
  const r=Math.random();let out='';
  if(r<0.45){if(!S.deals.some(d=>d.cid===c.id&&d.kind!=='project')){const d=addCross(c);if(d)out=' They want to hear about '+SVC[d.svc[0]].short.toLowerCase()+'.';}}
  else if(r<0.7&&c.svc.support&&!S.deals.some(d=>d.cid===c.id&&d.kind==='project')){if(addProjectDeal(c))out=' They have a project in mind.';}
  log((by?by.name+' ran':'You ran')+' an account review with '+c.name+'.'+out,'good');
  V.meetings.push({sid:by?by.id:'you',kind:'review'});
}
function addProjectDeal(c){
  const pool=PROJ.filter(p=>!(c.projHist||[]).includes(p.n)&&!(p.n==='Microsoft 365 migration'&&c.svc.m365));if(!pool.length||c.notice!=null)return null;
  const t=pick(pool);const est=Math.round(t.h(c.seats));
  const d={id:uid(),kind:'project',cid:c.id,proj:{name:t.n,est,value:Math.round(t.v(c.seats)/50)*50},created:S.day,exp:S.day+25,stage:'open'};
  S.deals.push(d);S.m.leads++;
  log(c.name+' wants a quote for '+aN(/^(Cyber|Microsoft|Intune|Azure|Windows|SharePoint|Office 365)/.test(t.n)?t.n:t.n[0].toLowerCase()+t.n.slice(1))+'.','info');return d;
}
function dealSeats(d){return d.kind==='new'?d.seats:(C(d.cid)||{seats:0}).seats;}
function dealMRR(d,pm){
  if(d.kind==='project')return 0;
  const seats=dealSeats(d);let t=0;
  for(const k of d.svc){const u=SVC[k].unit==='site'?Math.max(1,Math.ceil(seats/30)):seats;t+=S.price[k]*pmFor(k,pm||1)*u;}
  return t;
}
function dealSetup(d){if(d.kind==='project')return 0;const seats=dealSeats(d);let t=0;for(const k of d.svc){if(SVC[k].setup)t+=SVC[k].setup*(SVC[k].unit==='site'?Math.max(1,Math.ceil(seats/30)):seats);}return t;}
function dealName(d){return d.kind==='new'?d.name:(C(d.cid)||{name:'Former client'}).name;}
function blockers(d){
  const out=[];
  if(d.kind==='project'){if(!hasRole('eng')&&S.co.mode!=='hands'&&S.co.mode!=='mixed')out.push('Project work needs an engineer, or you hands-on.');return out;}
  for(const k of d.svc){const v=SVC[k].vendor;if(v&&!vendOn(v))out.push(SVC[k].short+' needs '+VEND[v].name+' ('+VEND[v].kind+') in your stack.');
    if(SVC[k].needEng&&!hasRole('eng')&&S.co.mode!=='hands'&&S.co.mode!=='mixed')out.push('Managed security needs at least one engineer on staff.');}
  return out;
}
const PM_OPTS=[0.8,0.9,1,1.1,1.2];
function winChance(d,pm){
  let p=d.kind==='new'?0.33:d.kind==='cross'?0.52:0.48;
  p+=(S.co.rep-50)/250;
  const c=d.cid?C(d.cid):null;
  if(c)p+=(c.trust-50)/200;
  if(S.office.rooms.meeting)p+=0.08;else if(TIERS[S.office.tier].shared)p+=0.03;
  const own=c?amOf(c):null;
  const pool=own?[own]:S.staff.filter(s=>s.role==='am'&&present(s));
  if(pool.length)p+=0.02*Math.max(...pool.map(s=>s.skill))+(pool.some(s=>hasT(s,'closer'))?0.04:0)+(pool.some(s=>hasT(s,'overpromiser'))?0.06:0)+(pool.some(s=>hasT(s,'hunter'))?0.03:0)+(own?0.04:0);
  else if(S.co.mode==='sell')p+=0.05;
  if(S.co.ce&&d.svc&&d.svc.includes('security'))p+=0.06;
  if(d.big)p-=0.28-(S.co.iso?0.1:0);
  p+={0.8:0.12,0.9:0.06,1:0,1.1:-0.12,1.2:-0.25}[pm];
  return clamp(p,0.05,d.kind==='new'?0.72:0.85);
}
function sendDeal(d,pm){
  S.qs.disc+=1-pm;S.qs.sent++;
  d.stage='pitched';d.pm=pm;d.win=winChance(d,pm);d.won=Math.random()<d.win;d.resolve=S.day+ri(3,6);d.pitchDay=S.day;
  const c=d.cid?C(d.cid):null;const own=c?amOf(c):null;V.meetings.push({sid:own&&present(own)?own.id:null});
}
function resolveDeal(d){
  S.deals=S.deals.filter(x=>x!==d);
  const won=d.won!=null?d.won:(Math.random()<d.win);
  if(!won){S.m.lost++;S.qs.lost++;const c=d.cid?C(d.cid):null;if(c)c.trust=Math.max(0,c.trust-2);
    log(dealName(d)+' said no. '+lossReason(d),'bad');return;}
  S.m.won++;S.qs.won++;
  let byAm=ST(d.by||(d.draft&&d.draft.by)||'');if((!byAm||byAm.role!=='am')&&d.cid){const oc=C(d.cid);const oa=oc&&amOf(oc);if(oa)byAm=oa;}const credit=(mrrAdd,proj)=>{if(byAm&&byAm.role==='am'){byAm.sales=byAm.sales||[];byAm.sales.push({d:S.day,mrr:mrrAdd||0,proj:proj||0});}};
  if(d.kind==='project'){
    const c=C(d.cid);if(!c)return;
    const skill=avgEngSkill();
    const actual=d.proj.est*rnd(0.85,1.45)*(1.18-0.07*skill);
    const val=Math.round(d.proj.value*d.pm);
    const due=S.day+Math.ceil(d.proj.est/4)+12;
    S.projects.push({id:uid(),cid:c.id,name:d.proj.name,est:d.proj.est,actual,done:0,value:val,paid:val*0.5,due,late:false,start:S.day,min:Math.max(3,Math.ceil(d.proj.est/8))});(c.projHist=c.projHist||[]).push(d.proj.name);
    S.co.cash+=val*0.5;S.m.proj+=val*0.5;credit(0,val);payCommission(byAm,d,d.pm,c.id);afterWin(d,c,byAm);
    log('Won: '+d.proj.name+' for '+c.name+', '+gbp(val)+'. Half invoiced up front.','good');
    V.pops.push({text:'+'+gbp(val),good:true,born:performance.now()});
    return;
  }
  let c;
  if(d.kind==='new'){c=makeClient(d.name,d.sector,d.seats,[]);c.sat=72;c.trust=30;S.clients.push(c);S.m.newc++;const am=autoAssign(c);if(am)log(c.name+' goes into '+am.name+'’s book.','info');}
  else{c=C(d.cid);if(!c)return;}
  for(const k of d.svc){c.svc[k]={since:S.day,pm:pmFor(k,d.pm)};}
  if(d.kit){for(const cat in d.kit){const k=d.kit[cat];if(k.until==null)k.until=S.day+(k.left||0)*DPM;}c.kit=Object.assign(c.kit||{},d.kit);if(c.svc.telecoms)delete c.kit.voice;}
  c.kit=c.kit||{};
  startOnboarding(c,d.svc,d.kind==='new');
  const setup=dealSetup(d);if(setup){S.co.cash+=setup;S.m.setup+=setup;}
  const add=dealMRR(d,d.pm);credit(add,0);payCommission(byAm,d,d.pm,c.id);S.qs.newmrr+=add;if(d.kind==='cross')S.qs.cross++;
  log('Won: '+c.name+' signs up for '+d.svc.map(k=>SVC[k].short.toLowerCase()).join(' and ')+'. '+sgbp(add)+' a month'+(setup?', '+gbp(setup)+' onboarding':'')+'.','good');
  V.pops.push({text:sgbp(add)+'/mo',good:true,born:performance.now()});
  afterWin(d,c,byAm);
}
/* ============ unit economics ============ */
const FOUNDER_M=4200; // your own time, valued as if you paid yourself
function hourRate(st,total){total=total||hoursOf(st).total;if(!total)return 0;return (st.role==='founder'?FOUNDER_M:st.salary*(1+ONCOST))/(DPM*total);}
const avgTixHrs=k=>{const l2=SVC[k].l2;return (1-l2)*0.525+l2*1.2;};
function estHours(k,u,sector){let r=SVC[k].tix*u*((SECTORS[sector]||{tix:1}).tix)*avgTixHrs(k);if(k==='support'&&vendOn('rmm'))r*=0.75;return r;}
function blendedRate(l2only){let h=0,c=0;for(const s of S.staff){if(!present(s)||s.role==='am'||s.role==='sdm'||s.role==='pm'||s.role==='tm'||s.role==='bill'||s.role==='bm'||(l2only&&s.role==='desk'))continue;const x=hoursOf(s);const th=x.tix+x.proj;if(!th)continue;h+=th;c+=th*hourRate(s,x.total);}return (h?c/h:35)*1.2;} // ×1.2: paid time is never fully billable — admin, training and idle hours load onto the productive ones
const deskLoadM=()=>active().reduce((a,c)=>a+(c.lh||0),0);
const deskCapM=()=>{let h=0;for(const s of S.staff)if(present(s)&&s.role!=='am'&&s.role!=='sdm'){const x=hoursOf(s);h+=x.tix+x.proj;}return h*DPM;};
function clientPL(c){
  const lines=SVC_ORDER.filter(k=>c.svc[k]).map(k=>({k,rev:svcPrice(c,k)*units(c,k),cost:svcCost(k)*units(c,k)}));
  const rev=lines.reduce((a,l)=>a+l.rev,0),vend=lines.reduce((a,l)=>a+l.cost,0);
  const warm=Math.min(1,(S.day-c.since)/DPM);
  // until a new client has a month of history, blend in the estimate
  const est=SVC_ORDER.filter(k=>c.svc[k]).reduce((a,k)=>a+estHours(k,units(c,k),c.sector),0);
  const hrs=S.day-c.since<DPM&&c.since>0?(c.lh||0)+est*(1-warm):(c.lh||0);
  const lab=S.day-c.since<DPM&&c.since>0?(c.lc||0)+est*(1-warm)*blendedRate():(c.lc||0);
  const am=amOf(c);const amc=am?am.salary/Math.max(1,amLoad(am)):0;
  const margin=rev-vend-lab;
  const svcRev=rev-vend;const ehr=hrs>=0.5?svcRev/hrs:null;const ov=overheadPct();
  return {lines,rev,vend,lab,hrs,amc,am,margin,pct:rev?margin/rev:0,ehr,svcRev,loaded:rev?(margin-rev*ov)/rev:0,ov,settling:S.day-c.since<DPM&&c.since>0};
}
/* company P&L at the current run rate, layered the way an MSP finance lead reads it */
function companyPL(){
  const rev=mrr(),resold=costOfSales();
  const techPay=staffOn().filter(s=>started(s)&&(s.role==='desk'||s.role==='eng')).reduce((a,s)=>a+s.salary,0)*(1+ONCOST)*(1-projShare());
  const gross=rev-resold-techPay;
  const people=staffOn().filter(s=>started(s)&&(s.role==='am'||s.role==='sdm'||s.role==='hdm'||s.role==='sm'||s.role==='pm'||s.role==='tm'||s.role==='bill'||s.role==='bm')).reduce((a,s)=>a+s.salary,0)*(1+ONCOST);
  const founder=((S.staff.find(s=>s.id==='you')||{}).salary||0)*(1+ONCOST);
  const rent=TIERS[S.office.tier].rent,tools=toolsCost(),fin=S.co.loan*LOAN_APR/12;
  const commission=lastComm();
  const over0=people+founder+rent+tools+fin+commission;
  const perks=perkCost(gross-over0).total;
  const over=over0+perks;
  return {rev,resold,techPay,gross,gpct:rev?gross/rev:0,people,founder,perks,rent,tools,fin,commission,over,opct:rev?over/rev:0,op:gross-over,oppct:rev?(gross-over)/rev:0};
}
function projShare(){let pj=0,tu=0;for(const d of S.sla.slice(-DPM)){pj+=d.pj||0;tu+=d.tu||0;}return tu>0?clamp(pj/tu,0,0.8):0;}
function overheadPct(){const r=mrr();if(!r)return 0;const P=companyPL();return Math.max(0,P.over/r);}
const ehrCls=(e)=>{if(e==null)return 'mut';const r=blendedRate()||30;return e>=r*3?'pos':e>=r*1.6?'wrn':'neg';};
function dealEstimate(d,pm){
  if(d.kind==='project'){const r=blendedRate(true);const sk=1.18-0.07*avgEngSkill();const lo=d.proj.est*0.85*sk*r,hi=d.proj.est*1.45*sk*r,mid=d.proj.est*1.15*sk*r;const q=d.proj.value*pm;return {project:true,q,rate:r,lo,hi,mid,margin:q-mid,pct:(q-mid)/q};}
  const seats=dealSeats(d);const sector=d.kind==='new'?d.sector:C(d.cid).sector;
  const lines=d.svc.map(k=>{const u=SVC[k].unit==='site'?Math.max(1,Math.ceil(seats/30)):seats;return {k,u,rev:S.price[k]*pmFor(k,pm)*u,cost:svcCost(k)*u,hrs:estHours(k,u,sector)};});
  const rev=lines.reduce((a,l)=>a+l.rev,0),vend=lines.reduce((a,l)=>a+l.cost,0),hrs=lines.reduce((a,l)=>a+l.hrs,0);
  const rate=blendedRate();const lab=hrs*rate;
  const onboard=onbHoursEstimate(d);
  const capM=deskCapM(),load=deskLoadM();
  const newTools=[...new Set(d.svc.map(k=>SVC[k].vendor).filter(v=>v&&!vendOn(v)))].map(v=>({name:VEND[v].name,fee:VEND[v].base*(S.vend[v].pm||1)}));const toolFee=newTools.reduce((a,t)=>a+t.fee,0);
  const margin=rev-vend-lab-toolFee;
  return {newTools,toolFee,lines,rev,vend,hrs,rate,lab,margin,pct:rev?margin/rev:0,onboard,capM,load,after:load+hrs};
}
const LEAD_K=0.007;
// the local market is finite: the more of it you already serve, the harder new logos are to find
function marketRoom(){return 1/(1+Math.pow(active().length/90,1.4));}
function avgEngSkill(){const e=S.staff.filter(s=>s.role==='eng'&&!s.left);return e.length?e.reduce((a,s)=>a+s.skill,0)/e.length:3;}

/* ============ staff ============ */
function genCand(role,src){
  const skill=src==='rec'?wpick([[2,2],[3,3],[4,2],[5,1]]):wpick([[1,3],[2,3],[3,1.5]]);
  const [lo,hi]=ROLES[role].sal;
  const salary=Math.round((lo+(hi-lo)*(skill-1)/4+rnd(-120,160))/10)*10;
  const traits=ROLES[role].mgr?mgrTraits():rollTraits(role),cons=src==='rec'?rnd(0.55,0.98):rnd(0.35,0.95);
  let nm;for(let i=0;i<20;i++){nm=pick(FIRST)+' '+pick(LAST);if(!S.staff.some(s=>s.name===nm))break;}
  return {id:uid(),name:nm,role,skill,salary,traits,cons,look:look(),src,fam:candFam(role,skill,src)};
}
const TRAITS={steady:'Steady: burns out half as fast',quick:'Quick learner: grows skills faster',closer:'Closer: wins more deals'};
function cands(role){
  const mi=monthOf(S.day);
  if(!S.cands[role]||S.cands[role].mi!==mi)S.cands[role]={mi,board:[genCand(role,'board'),genCand(role,'board'),genCand(role,'board')],rec:[genCand(role,'rec'),genCand(role,'rec'),genCand(role,'rec')]};
  return S.cands[role];
}
function freeDesk(){const used=new Set(S.staff.filter(s=>!s.left).map(s=>s.desk));for(let i=0;i<cap();i++)if(!used.has(i))return i;return -1;}
function hire(c){
  const desk=freeDesk();if(desk<0)return;
  const fee=c.src==='rec'?Math.round(c.salary*12*0.15):250;
  spend(fee);
  const st={id:uid(),role:c.role,name:c.name,skill:c.skill,salary:c.salary,traits:(c.traits||[]).slice(),known:Object.assign({},c.known||{}),cons:c.cons||0.7,form:1,rec:[],morale:78,start:S.day+(c.now?0:DPM),desk,focus:'balanced',look:c.look,util:0.5,xp:0,away:0,fam:Object.assign({},c.fam||{})};
  if(ROLES[c.role].mgr){defaultTargets(st);st.lim=c.role==='hdm'?{max:3,cap:2600,train:1000,focus:true}:{disc:0.1,deal:1500,hire:0,assign:true};S.mq.push({type:'targets',sid:st.id});}
  S.staff.push(st);
  const pool=S.cands[c.role];pool[c.src]=pool[c.src].filter(x=>x.id!==c.id);
  log('Hired '+c.name+' as '+ROLES[c.role].t.toLowerCase()+(c.now?'. ':'. Starts in about a month, once they’ve worked their notice. ')+(c.src==='rec'?'Recruiter fee ':'Job ad ')+gbp(fee)+'.','good');
}
function reassignDesks(){S.staff.filter(s=>!s.left).forEach((s,i)=>s.desk=i);}

/* ============ month end ============ */
function monthEnd(){
  const mi=monthOf(S.day)-1;const L=S.m;
  const rec=mrr(),cos=costOfSales(),pay=payroll(),tools=toolsCost(),rent=TIERS[S.office.tier].rent;
  const int=S.co.intAcc!=null?S.co.intAcc:S.co.loan*LOAN_APR/12+(S.co.cash<0?-S.co.cash*OD_APR/12:0);S.co.intAcc=0;
  L.rec=rec;L.vend=cos;L.sal=pay;L.tools=tools;L.rent=rent;L.int=int;
  L.perks=Math.round(perkCost(companyPL().gross-(companyPL().over-companyPL().perks)).total);
  S.co.cash+=rec-cos-pay-tools-rent-int-L.perks;
  // pro-rate the first partial month: clients and hires that started mid-month aren't billed or paid a whole month
  {const ms=S.day-DPM;let dRev=0,dCos=0,dPay=0;
   for(const c of active())if((c.since||0)>ms&&c.since>0){const fr=Math.max(0,Math.min(1,(S.day-c.since)/DPM));dRev+=clientMRR(c)*(1-fr);dCos+=clientPL(c).vend*(1-fr);}
   for(const s of staffOn())if(started(s)&&(s.start||0)>ms&&(s.start||0)>0){const fr=Math.max(0,Math.min(1,(S.day-s.start)/DPM));dPay+=s.salary*(1+ONCOST)*(1-fr);}
   S.co.cash+=-dRev+dCos+dPay;L.rec-=dRev;L.vend-=dCos;L.sal-=dPay;L.proRev=Math.round(dRev);}
  {const f=S.staff.find(s=>s.id==='you');if(f&&f.salary){const net=(typeof salaryNet==='function')?salaryNet(f.salary*12)/12:f.salary;S.co.home=(S.co.home||0)+net;L.self=f.salary;}}
  // tool usage per vendor for the report
  commMonthEnd(L);
  const income=L.rec+L.setup+L.proj+(L.soft||0)+(L.invest||0)+(L.branch||0),costs=L.vend+L.sal+L.tools+L.rent+L.other+L.int+(L.comm||0)+(L.perks||0);
  const profit=income-costs;
  // churn
  const gone=[];
  for(const c of active()){
    if(c.notice!=null&&c.notice<=S.day){if(c.exitFee){c.exitFee=false;payOut(c);}c.gone=true;gone.push(c);clawback(c);{const a=amOf(c);if(a){a.lost=a.lost||[];a.lost.push({d:S.day,mrr:clientMRR(c)});}}S.tickets=S.tickets.filter(t=>t.cid!==c.id);S.projects=S.projects.filter(p=>p.cid!==c.id);S.deals=S.deals.filter(d=>d.cid!==c.id);S.onb=S.onb.filter(o=>o.cid!==c.id);L.gone++;log(c.name+' has left. '+gbp(clientMRR(c))+' a month walks out the door.','bad');continue;}
    if(c.notice==null){const p=c.sat<20?0.7:c.sat<35?0.35:c.sat<45?0.1:c.sat<55?0.03:0;
      if(p&&!canLeave(c)){if(!c.riskAt||S.day-c.riskAt>DPM*3){c.riskAt=S.day;log(c.name+' is unhappy (satisfaction '+Math.round(c.sat)+') but tied in until '+dLabel(c.termEnd)+'. Fix it before the renewal.','bad');}continue;}
      if(Math.random()<p){c.notice=noticeDay(c);c.why='unhappy';log(c.name+' has served notice. Satisfaction '+Math.round(c.sat)+'. They leave on '+dLabel(c.notice)+' unless you get satisfaction back above 62.','bad');}}
  }
  S.clients=S.clients.filter(c=>!c.gone);
  // notice rescue: if sat recovered above 60, withdraw
  const dip=S.staff.some(s=>s.role==='sdm'&&present(s)&&hasT(s,'diplomat'));
  for(const c of S.clients)if(c.notice!=null&&!c.ending&&c.sat>=(dip?52:62)){c.notice=null;log(c.name+' has withdrawn their notice.','good');}
  const sla=slaPct(),cs=csat();
  const rep={mi,label:mLabel(mi),L:Object.assign({},L),income,costs,profit,mrr:mrr(),recur:Math.round(companyPL().op),signoff:S.deals.filter(d=>d.stage==='open'&&d.draft).length,notices:active().filter(c=>c.notice!=null).map(c=>[c.name,dLabel(c.notice),Math.round(c.sat),c.ending?(c.why||'you'):'unhappy']),oneoff:L.setup+L.proj,cash:S.co.cash,sla,cs,staff:staffOn().length,clients:S.clients.length,gone:gone.map(c=>c.name)};
  S.last=rep;
  for(const a of ams()){a.snaps=a.snaps||[];a.snaps.push({mi,mrr:active().filter(c=>c.am===a.id).reduce((x,c)=>x+clientMRR(c),0)});if(a.snaps.length>12)a.snaps.shift();}
  S.hist.push({mi,mrr:rec,cash:Math.round(S.co.cash),profit:Math.round(profit),sla,cs,staff:staffOn().length});
  if(S.hist.length>120)S.hist.shift();
  log(mLabel(mi)+': MRR '+gbp(rec)+', '+(profit>=0?'profit ':'loss ')+gbp(Math.abs(profit))+', SLA '+pct(sla)+'.','month');
  S.m=blankLedger();
  // overdraft
  if(S.co.cash<-OD_LIMIT){S.co.red++;
    if(S.co.red>=2){
      if(typeof bankCallIn==='function')bankCallIn();
      else if(!S.co.bankCalled){S.co.bankCalled=true;S.hq.push({id:'bankCall',ctx:{}});log('The bank is calling in the overdraft. You have one last chance to raise the cash.','bad');}
    }
    else log('You are past your £10,000 overdraft. The bank wants it fixed by next month end.','bad');
  }else {S.co.red=0;S.co.bankCalled=false;S.co.demand=null;}
  if(S.co.mode==='manage'&&sla>=0.9)S.flags.offTools=(S.flags.offTools||0)+1;
  rep.tips=tips(rep);
  if((mi+1)%3===0)quarterEnd();
  if(!S.over)S.report=rep;
}
function tips(r){
  const t=[];
  const bl=backlogHours(),capH=deskCapacity();
  if(bl>capH*1.5)t.push('Your desk is drowning: '+Math.round(bl)+' hours of tickets are waiting against '+Math.round(capH)+' hours a day of capacity. Hire before you sell more support.');
  if(r.sla<0.85)t.push('SLA fell to '+pct(r.sla)+'. Every breach chips at satisfaction, and unhappy clients serve notice at month end.');
  const idle=(V.lastW||[]).filter(w=>w.st.role==='eng'&&w.st.util<0.55);
  if(idle.length&&!S.projects.length)t.push('Your engineers have spare hours. Projects come from account reviews and cross-sells, and that is where spare time turns into money.');
  const unused=VEND_ORDER.filter(k=>vendOn(k)&&VEND[k].svc&&!VEND[k].svc.some(s=>svcUsers(s)>0)&&VEND[k].base>0);
  if(unused.length)t.push('You pay for '+unused.map(k=>VEND[k].name).join(' and ')+' but no client uses '+(unused.length>1?'them':'it')+'. Sell it or drop it.');
  {const op=companyPL().op;if(op<0&&r.cash>0){const months=Math.floor(r.cash/Math.max(1,-op));t.push('Recurring work is losing '+gbp(-op)+' a month. At that rate the cash lasts '+(months<1?'less than a month':'about '+months+' month'+(months===1?'':'s'))+'.');}}
  if(r.L.leads<2&&S.co.mode==='hands'&&!hasRole('am'))t.push('Only '+r.L.leads+' new opportunit'+(r.L.leads===1?'y':'ies')+'. While you are hands-on nobody is selling. Try Selling mode or hire an account manager.');
  const planN=S.onb.filter(o=>o.stage==='plan').length;if(planN)t.push(planN+' onboarding plan'+(planN>1?'s are':' is')+' waiting for your decisions on the Projects tab. Nothing moves until you decide.');
  const loss=active().filter(c=>S.day-c.since>DPM&&clientPL(c).margin<0);if(loss.length)t.push(loss.slice(0,2).map(c=>c.name).join(' and ')+(loss.length>2?' and others':'')+' cost more to look after than they pay. Check their P&L on the Clients tab: raise prices, add RMM, or let them go.');
  const low=S.clients.filter(c=>c.sat<45);if(low.length)t.push(low.map(c=>c.name).slice(0,2).join(' and ')+(low.length>2?' and others':'')+' '+(low.length>1?'are':'is')+' unhappy. An account review or a service delivery manager helps.');
  const un=active().filter(c=>!c.am).length;if(ams().length&&un&&ams().some(s=>amLoad(s)<amCap(s)))t.push(un+' client'+(un>1?'s are':' is')+' still in your own book while your account managers have room. Hand them over from the client or the account manager.');
  const due=active().filter(reviewDue).length;if(due>=2)t.push(due+' of your own clients are due an account review. Reviews build trust and turn up new work.');
  if(S.co.mode==='hands'&&staffOn().length>=4)t.push('You still spend most of your day on tickets. Running the business pays off once the team can cover the desk.');
  if(mgrOn('sm')&&ams().filter(a=>present(a)).length<=1)t.push('Your sales manager has almost no team to lead. The role earns its salary by multiplying account managers, so hire a few under them or the money is better spent elsewhere.');
  return t.slice(0,3);
}

/* ============ milestones ============ */
const MILES=[
  {id:'support',t:'Proper IT support',d:'Win your first managed support client.',test:()=>active().some(c=>c.svc.support)},
  {id:'hire',t:'First hire',d:'Take someone on.',test:()=>S.staff.length>1},
  {id:'moved',t:'Out of the spare room',d:'Move into an office.',test:()=>S.office.tier>=1},
  {id:'mrr10',t:'£10k MRR',d:'Reach £10,000 a month recurring.',test:()=>mrr()>=10000},
  {id:'stack',t:'Full stack',d:'Sell all six services.',test:()=>SVC_ORDER.every(k=>svcUsers(k)>0)},
  {id:'ten',t:'Ten on the payroll',d:'Grow to ten people including you.',test:()=>staffOn().length>=10},
  {id:'tools',t:'Off the tools',d:'Run the business with the desk hitting 90% SLA.',test:()=>(S.flags.offTools||0)>=1},
  {id:'mrr50',t:'£50k MRR',d:'Reach £50,000 a month recurring.',test:()=>mrr()>=50000},
  {id:'arr1m',t:'Million-pound run rate',d:'£1m a year in recurring revenue.',test:()=>mrr()*12>=1e6}
];
function checkMiles(){for(const m of MILES){if(!S.miles[m.id]&&m.test()){S.miles[m.id]=S.day;log('Milestone: '+m.t+'.','good');}}}
