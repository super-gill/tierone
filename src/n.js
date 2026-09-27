
/* ============ build 15: paying yourself, benefits, letting people go, acquisitions, selling up ============ */
const BUILD=138;
const REVIEW_H=4;
const YEAR=DPM*12, PROBATION=DPM*6;
const diaryFull=()=>(S.co.busy||0)>=8;
const founderSt=()=>S.staff.find(s=>s.id==='you');

/* ---- paying yourself ---- */
const OWNER_PAY=[0,2000,3500,5000,8000];
function retained(){return S.hist.reduce((a,h)=>a+(h.profit||0),0)-(S.co.divs||0);}
function divBuffer(){return payroll()+costOfSales()+TIERS[S.office.tier].rent+toolsCost()+perkCost(0).total;}
function divRoom(){return Math.max(0,Math.floor(Math.min(S.co.cash-divBuffer(),retained())/100)*100);}
function ownerSec(){
  const f=founderSt();const room=divRoom();const home=(S.co.home||0)+(S.co.divs||0);
  let h='<div class="sec"><h3>Paying yourself</h3><p class="lede">Taken home so far: <b>'+gbp(home)+'</b> ('+gbp(S.co.home||0)+' salary, '+gbp(S.co.divs||0)+' dividends). Most owners take a modest salary and top it up with dividends once there’s profit to pay them from. Go too long on nothing and it wears you down.</p>';
  h+='<p class="lede" style="margin:0 0 4px">Your salary, a month</p><div class="seg" style="margin-bottom:10px">'+OWNER_PAY.map(v=>'<button data-act="ownerPay" data-v="'+v+'" aria-pressed="'+((f.salary||0)===v)+'">'+(v?gbp(v):'Nothing')+'</button>').join('')+'</div>';
  h+='<p class="lede" style="margin:0 0 4px">Dividend · up to '+gbp(room)+'. That’s the lower of profit kept in the business ('+gbp(Math.max(0,retained()))+') and cash after a month of wages, resold services, rent and tools ('+gbp(Math.max(0,S.co.cash-divBuffer()))+').</p><div class="row">'+[0.25,0.5,1].map(p=>{const v=Math.floor(room*p/100)*100;return '<button class="btn sm" data-act="dividend" data-v="'+v+'" '+(v>=100?'':'disabled')+'>'+(p===1?'All of it':pct(p))+(v>=100?' · '+gbp(v):'')+'</button>';}).join('')+'</div></div>';
  return h;
}
ACT_EXT.ownerPay=v=>{const f=founderSt();const was=f.salary||0;f.salary=+v;if(+v>was)f.morale=Math.min(100,f.morale+4);log(+v?'You now pay yourself '+gbp(+v)+' a month.':'You stop paying yourself.','info');};
ACT_EXT.dividend=v=>{v=+v;if(!(v>=100)||v>divRoom())return;const net=(typeof divNet==='function')?Math.round(divNet(v)):v;(S.co.divLog=S.co.divLog||[]).push({d:S.day,v});S.co.cash-=v;S.co.divs=(S.co.divs||0)+net;const f=founderSt();f.morale=Math.min(100,f.morale+5);log('You took a '+gbp(v)+' dividend'+(net<v?', '+gbp(net)+' after dividend tax':'')+'.','good');};
MILES.push(
  {id:'paid',t:'First pay cheque',d:'Pay yourself a salary.',test:()=>(founderSt()||{}).salary>0},
  {id:'home100',t:'£100k taken home',d:'Salary and dividends, all in.',test:()=>(S.co.home||0)+(S.co.divs||0)>=1e5},
  {id:'home1m',t:'Millionaire',d:'Take home £1m from the business.',test:()=>(S.co.home||0)+(S.co.divs||0)>=1e6});

/* ---- staff benefits ---- */
const carRole=s=>['eng','am','sdm','hdm','sm'].includes(s.role);
const heads=()=>staffOn().filter(s=>s.id!=='you'&&started(s));
const PERKS={
  pension:{t:'Enhanced pension',d:'6% employer pension instead of the legal 3%. People who’ve been here a year or more settle in and stay.',cost:()=>heads().reduce((a,s)=>a+s.salary,0)*0.03},
  health:{t:'Private healthcare',d:'Fewer sick days and shorter ones when they happen. Candidates notice it.',cost:()=>heads().length*58},
  cars:{t:'Car allowance',d:'£450 a month for engineers, account managers and managers. They’re out on site anyway, and it’s hard to poach someone with a car.',cost:()=>heads().filter(carRole).length*450},
  bonus:{t:'Profit share',d:'5% of last month’s profit, projects included, goes to the team. Morale rises and falls with the numbers.',cost:()=>Math.max(0,(S.last&&S.last.profit)||0)*0.05},
  social:{t:'Socials and perks',d:'Nights out, an away day, decent coffee. Cheap, steady morale.',cost:()=>heads().length*35}
};
function perkCost(op){const P=S.perks||{};const lines={};let total=0;for(const k in PERKS)if(P[k]){const c=PERKS[k].cost(op||0);lines[k]=c;total+=c;}return {total,lines};}
function appeal(){const P=S.perks||{};return Object.keys(PERKS).filter(k=>P[k]).length;}
function perksSec(){
  const P=S.perks||{};const C0=perkCost(companyPL().gross-(companyPL().over-companyPL().perks));
  let h='<div class="sec"><h3>Staff benefits</h3><p class="lede">Money you spend on the team rather than yourself. Each one helps morale and retention in its own way, and together they make you easier to hire for: candidates ask for less base pay and better people apply.</p><ul class="list">';
  for(const k in PERKS){const on=!!P[k];const c=on?C0.lines[k]:PERKS[k].cost(Math.max(0,companyPL().op));
    h+='<li class="item"><span><b>'+PERKS[k].t+'</b></span><span class="r">'+(on?gbp(c)+'/mo':'≈'+gbp(c)+'/mo')+'</span><span class="sub">'+PERKS[k].d+'<span class="row" style="margin-top:6px"><button class="btn sm'+(on?'':' primary')+'" data-act="perk" data-v="'+k+'">'+(on?'Stop it':'Start it')+'</button></span></span></li>';}
  return h+'</ul><p class="mut" style="font-size:.8rem;margin-top:6px">Cutting a benefit people have got used to costs morale.</p></div>';
}
ACT_EXT.perk=k=>{S.perks=S.perks||{};const on=!S.perks[k];S.perks[k]=on;
  if(!on)for(const s of heads())if(k!=='cars'||carRole(s))s.morale=Math.max(0,s.morale-8);
  else for(const s of heads())if(k!=='cars'||carRole(s))s.morale=Math.min(100,s.morale+4);
  log((on?'Started: ':'Stopped: ')+PERKS[k].t.toLowerCase()+'.',on?'good':'bad');};
/* benefits make you easier to hire for; a revolving door does the opposite */
const _genCand15=genCand;
genCand=function(role,src){const c=_genCand15(role,src);const a=appeal(),rv=revolving();
  if(a&&c.skill<5&&Math.random()<0.07*a)c.skill++;
  if(rv&&c.skill>1&&Math.random()<0.4)c.skill--;
  c.salary=Math.round(c.salary*(1-0.015*a)*(rv?1.06:1)/10)*10;return c;};
Object.defineProperty(EVENTS.poach,'w',{configurable:true,get(){const P=S.perks||{};return Math.max(0.15,0.55-0.06*appeal()-(P.pension?0.1:0)-(P.cars?0.06:0));}});
const _winChance15=winChance;
winChance=function(d,pm){const P=S.perks||{};return clamp(_winChance15(d,pm)+(P.cars&&ams().length?0.02:0),0.05,0.92);};

/* ---- letting people go ---- */
const service=s=>Math.max(0,(S.day-s.start)/YEAR);
function exitCosts(s){
  const y=service(s),wk=s.salary*12/52;const noticeW=S.day-s.start<DPM?0:Math.max(1,Math.min(12,Math.floor(y)));
  return {y,wk,probation:S.day-s.start<PROBATION,noticeW,notice:Math.round(noticeW*wk),probationCost:Math.round(wk),
    settle:Math.round(s.salary*(y>=2?3:2)+(y>=2?1500:750)),
    redund:y>=2?Math.round(noticeW*wk+Math.min(Math.floor(y),20)*Math.min(wk,700)):null};
}
const revolving=()=>(S.exits||[]).filter(d=>S.day-d<DPM*6).length>=3;
function noteExit(s){
  S.exits=(S.exits||[]).filter(d=>S.day-d<DPM*6);S.exits.push(S.day);
  const hit=(service(s)>=1?6:3)+(hasT(s,'people')?2:0);
  for(const o of S.staff)if(o!==s&&!o.left&&o.id!=='you')o.morale=Math.max(0,o.morale-hit);
  if(S.exits.length===3)log('Word is getting round that '+S.co.name+' has a revolving door. Candidates will want more, and the good ones are warier.','bad');
}
function removeStaff(s){s.left=true;unassign(s.id);S.staff=S.staff.filter(z=>z!==s);}
const lenStr=y=>y<1/12?'under a month':y<1?Math.max(1,Math.round(y*12))+(Math.max(1,Math.round(y*12))===1?' month':' months'):(Math.round(y*10)/10)+' years';
MODAL_EXT.letgo=(M,x)=>{
  const s=ST(M.id);if(!s)return null;const X=exitCosts(s);const first=s.name.split(' ')[0];
  const ch=(act,t,sub,dis)=>'<button class="choice" data-act="'+act+'" '+(dis?'disabled':'')+'><b>'+t+'</b><span>'+sub+'</span></button>';
  let h='<div class="dialog">'+x+'<p class="kick">Letting someone go</p><h2>'+esc(s.name)+'</h2><p>'+ROLES[s.role].t+' · here '+lenStr(X.y)+' · '+gbp(s.salary)+' a month. However you do it, the rest of the team notices'+(X.y>=1?', more so for someone who’s been here a while':'')+'.</p><div class="choices">';
  if(X.probation){h+=ch('lgProb','End their probation · '+gbp(X.probationCost),'A week’s notice, paid. The cheap, clean exit, and why probation exists.');}
  else{
    h+=ch('lgProc',s.proc?'Performance process under way':'Start a performance process','About six weeks of warnings and reviews. They slow down and may resign first. At the end you pay their notice ('+X.noticeW+' week'+(X.noticeW===1?'':'s')+', '+gbp(X.notice)+').'+(X.y>=2?' Two years in, there’s an outside chance of an unfair dismissal claim.':''),!!s.proc);
    h+=ch('lgSettle','Settlement agreement · '+gbp(X.settle),'They leave today with a payment and sign away any claim. Fast, and the most expensive.');
    if(X.redund!=null)h+=ch('lgRedund','Make the role redundant · '+gbp(X.redund),'Notice plus statutory redundancy pay. You can’t hire another '+ROLES[s.role].short.toLowerCase()+' for six months or it isn’t really redundant.');
  }
  h+=ch('close','Keep '+first,'Nothing changes.');
  return h+'</div></div>';
};
ACT_EXT.lgProb=()=>{const s=ST(ui.modal.id);if(!s)return;spend(exitCosts(s).probationCost);noteExit(s);removeStaff(s);log(s.name+' didn’t pass probation.','bad');ui.modal=null;};
ACT_EXT.lgSettle=()=>{const s=ST(ui.modal.id);if(!s)return;const c=exitCosts(s).settle;spend(c);noteExit(s);removeStaff(s);log(s.name+' left on a settlement agreement ('+gbp(c)+').','bad');ui.modal=null;};
ACT_EXT.lgRedund=()=>{const s=ST(ui.modal.id);if(!s)return;const c=exitCosts(s).redund;spend(c);S.noHire=S.noHire||{};S.noHire[s.role]=S.day+DPM*6;noteExit(s);removeStaff(s);log(s.name+'’s role is redundant. Redundancy and notice: '+gbp(c)+'.','bad');ui.modal=null;};
ACT_EXT.lgProc=()=>{const s=ST(ui.modal.id);if(!s||s.proc)return;s.proc={start:S.day,end:S.day+30};s.morale=Math.max(0,s.morale-15);note(s,'Put on a formal performance process.');log('You started a performance process with '+s.name+'.','event');ui.modal={type:'staff',id:s.id};};
const _hire15=hire;
hire=function(c){if(S.noHire&&S.noHire[c.role]>S.day){log('You made a '+ROLES[c.role].short.toLowerCase()+' role redundant recently. Hiring one now would undo it.','bad');return;}_hire15(c);};
const _speedOf15=speedOf;
speedOf=function(st){return Math.min(1.45,_speedOf15(st)*(st.proc?0.9:1));};

/* ---- daily: benefits, sickness, your own morale, processes, claims ---- */
const _peopleDaily15=peopleDaily;
peopleDaily=function(W){_peopleDaily15(W);
  const P=S.perks||{};
  for(const s of S.staff){if(s.id==='you'||s.left||!started(s))continue;
    if(present(s)&&Math.random()<(P.health?0.006:0.01)){const d=Math.random()<(P.health?0.1:0.2)?ri(3,8):ri(1,2);s.away=Math.max(s.away||0,S.day+d);if(d>=3)log(s.name+' is off sick for '+d+' days.','info');}
    if(s.proc){s.morale=Math.max(0,s.morale-0.2);
      if(s.leaveOn==null&&Math.random()<0.012){s.leaveOn=S.day+5;s.proc=null;log(s.name+' resigned rather than go through the process.','info');}
      else if(S.day>=s.proc.end){const X=exitCosts(s);spend(X.notice);noteExit(s);if(X.y>=2&&Math.random()<0.15)(S.claims=S.claims||[]).push({day:S.day+ri(40,80),amt:Math.round(s.salary*4),name:s.name});removeStaff(s);log('The performance process ended. '+s.name+' has gone, with '+gbp(X.notice)+' notice pay.','bad');}}
  }
  const f=founderSt();if(f){if(S.day>YEAR&&!f.salary)f.morale=Math.max(0,f.morale-0.05);else if(f.salary>=3500)f.morale=Math.min(100,f.morale+0.02);}
  for(const c of (S.claims||[]).slice())if(S.day>=c.day){spend(c.amt);S.claims=S.claims.filter(z=>z!==c);log(c.name+' took you to a tribunal for unfair dismissal. Settled for '+gbp(c.amt)+'.','bad');}
};

/* ---- buying another MSP ---- */
EVENTS.acquire={w:0.9,ok:()=>mrr()>=8000&&active().length>=6&&S.day-(S.co.lastAcq||-999)>DPM*7&&!S.over,
  ctx:()=>{S.co.lastAcq=S.day;const n=ri(5,14);const cl=[];let m=0;
    for(let i=0;i<n;i++){const sector=pick(Object.keys(SECTORS));const seats=ri(6,40);const svcs=['support','m365'].concat(Math.random()<0.5&&vendOn('backup')?['backup']:[]).concat(Math.random()<0.3?['telecoms']:[]);cl.push({sector,seats,svcs,name:genName(sector)});for(const k of svcs)m+=S.price[k]*0.9*(SVC[k].unit==='site'?1:seats);}
    const staff=[];for(let i=ri(1,3);i>0;i--)staff.push(genCand(Math.random()<0.5?'desk':'eng','rec'));
    const gm=rnd(0.25,0.5),churn=ri(4,18),price=Math.round(m*12*rnd(0.9,1.4)*(1+(gm-0.35))/500)*500;
    return {cl,mrr:Math.round(m),gm,churn,staff,name:pick(PLACES)+' IT Services',owner:pick(FIRST)+' '+pick(LAST),price,stack:{rmm:pick(['pulsar','meridian','truesight']),backup:pick(['coldvault','arksafe','drivesafe'])}};},
  make:x=>{const offer=Math.round(x.price*0.8/500)*500;const fin=p=>Math.max(0,p-S.co.cash+5000);const canFund=p=>fin(p)<=Math.max(0,loanLimit()-S.co.loan)&&fin(p)<=p*0.5&&!bankNervous();const why=p=>bankNervous()?'The bank won’t lend while you’re losing money.':fin(p)>p*0.5?'The bank will only lend half the price, and you’d need '+gbp(fin(p))+'.':'You’d need '+gbp(fin(p))+' from the bank, more than your remaining limit of '+gbp(Math.max(0,loanLimit()-S.co.loan))+'.';const buy=p=>{if(canFund(p))buyAcq(x,p);else log('The bank wouldn’t fund '+gbp(fin(p))+' towards '+x.name+'. '+x.owner+' sold to someone else.','bad');};
    const st=x.stack;return {kicker:'Acquisition',title:x.big?x.name+' is open to an offer':x.owner+' wants to sell '+x.name,
    body:(x.big?'Their board is open to offers. ':'They’re retiring. ')+x.cl.length+' clients paying about '+gbp(x.mrr)+' a month, and '+x.staff.length+' of their team ('+x.staff.map(c=>ROLES[c.role].short.toLowerCase()).join(', ')+') would come with it if you have desks. They run '+PRODS[st.rmm].name+' and '+PRODS[st.backup].name+', not your stack. Their books show about '+pct(x.gm||0.35)+' gross margin and '+(x.churn||10)+'% of clients lost last year. The asking price is '+gbp(x.price)+', '+(x.price/(x.mrr*12)).toFixed(1)+'× annual revenue. Every client needs taking on properly, and some will wobble in the handover.',
    choices:[
      {label:'Buy it for '+gbp(x.price),note:!fin(x.price)?'Paid from cash.':canFund(x.price)?'The bank lends '+gbp(fin(x.price))+' against the book you’re buying.':why(x.price),go(){buy(x.price);}},
      {label:'Offer '+gbp(offer),note:'Under half the time they take it. Otherwise they sell to someone else.'+(canFund(offer)?'':' '+why(offer)),go(){if(Math.random()<0.45)buy(offer);else log(x.owner+' turned down your offer and sold '+x.name+' to someone else.','info');}},
      {label:'Pass',note:'There will be others.',go(){log('You passed on '+x.name+'.','info');}}]};}};
function doAcq(x,price){
  const loan=Math.ceil(Math.max(0,price-S.co.cash+5000)/1000)*1000;if(loan){S.co.loan+=loan;S.co.cash+=loan;}
  S.co.cash-=price;S.co.acq=(S.co.acq||0)+price;(S.co.acqLog=S.co.acqLog||[]).push({d:S.day,mrr:x.mrr});
  for(const o of x.cl){const c=makeClient(o.name,o.sector,o.seats,o.svcs);S.clients.push(c);c.term=12;c.termEnd=S.day+ri(1,12)*DPM;c.sat=ri(50,70)-Math.round((x.churn||10)/3);c.trust=30;c.rmmDone=false;for(const k in c.svc)c.svc[k].pm=0.9;
    c.kit={rmm:{p:x.stack.rmm,left:ri(0,10),state:'asis'}};if(c.svc.backup)c.kit.backup={p:x.stack.backup,left:ri(0,10),state:'asis'};
    for(const cat in c.kit){const k=c.kit[cat];k.until=S.day+k.left*DPM;}
    newOnb(c,'light',[task('Take over their documentation',2+0.08*o.seats,'docs'),task('Handover calls with their users',1+0.02*o.seats,'users')]);
    autoAssign(c);}
  let joined=0;for(const c of x.staff){if(freeDesk()<0)break;const cash=S.co.cash;c.src='board';c.now=true;cands(c.role);hire(c);S.co.cash=cash;joined++;}
  S.co.rep=Math.min(100,S.co.rep+1);
  log('You bought '+x.name+' for '+gbp(price)+(loan?', '+gbp(loan)+' of it borrowed':'')+'. '+x.cl.length+' clients join'+(x.staff.length?', and '+joined+' of '+x.staff.length+' staff'+(joined<x.staff.length?' (the rest had no desk and went elsewhere)':''):'')+'.','good');
}

/* ---- selling up ---- */
EVENTS.exitOffer={w:0.5,ok:()=>(mrr()>=50000&&S.day>=DPM*24&&S.day-(S.co.lastOffer||-999)>DPM*8||S.co.forSale)&&!S.over,
  ctx:()=>{S.co.lastOffer=S.day;if(S.co.forSale)S.co.saleDay=S.day+ri(25,45);const ebitda=valProfit(),arr=mrr()*12;const v=valuation()*rnd(0.9,1.12);
    return {buyer:pick(['Castlegate Group','Northstar IT, backed by private equity','Albion Tech Partners','Meridian Managed Services']),offer:Math.round(v/10000)*10000,arr:Math.round(arr),ebitda:Math.round(ebitda)};},
  make:x=>({kicker:'An offer for the company',title:x.buyer+' wants to buy '+S.co.name,
    body:'They’re offering '+gbp(x.offer)+' for the whole business. That’s '+(x.offer/x.arr).toFixed(1)+'× annual recurring revenue'+(x.ebitda?' and '+(x.offer/x.ebitda).toFixed(1)+'× a year’s operating profit':', and you aren’t making a profit to multiply')+'. You keep the '+gbp(Math.max(0,S.co.cash))+' in the bank on top; the loan ('+gbp(S.co.loan)+') is paid off out of it. Taken home so far: '+gbp((S.co.home||0)+(S.co.divs||0))+'.',
    choices:[{label:'Sell for '+gbp(x.offer),note:'The game ends here. Your result is what you took home plus the sale price and the cash in the bank, less the loan.',go(){sellCo(x);}}]
      .concat(x.pushed?[]:[{label:'Push for more',note:'Maybe 10 to 15% more. Some buyers walk.',go(){if(Math.random()<0.7){const y=Object.assign({},x,{offer:Math.round(x.offer*rnd(1.1,1.15)/10000)*10000,pushed:true});S.pending={id:'exitOffer',ctx:y};log(x.buyer+' came back with '+gbp(y.offer)+'.','event');}else log(x.buyer+' walked away.','bad');}}])
      .concat([{label:'Not for sale',note:'They, or someone else, may come back.',go(){log('You turned down '+x.buyer+'.','info');}}])})};
function sellCo(x){
  const E=exitNet(x.offer+S.co.cash-S.co.loan);
  S.over={mi:monthOf(S.day),peak:Math.max(...S.hist.map(h=>h.mrr),mrr()),sold:{buyer:x.buyer,offer:x.offer,net:E.net,cgt:E.cgt,gross:E.gross,home:(S.co.home||0)+(S.co.divs||0)}};
  log('You sold '+S.co.name+' to '+x.buyer+' for '+gbp(x.offer)+'.','good');
}


/* ---- build label and diagnostics ---- */
const _diag15=diagReport;
diagReport=function(){return _diag15().replace('TIER ONE DIAGNOSTICS v1','TIER ONE DIAGNOSTICS v1 build '+BUILD)+'\n'+JSON.stringify({home:Math.round(S.co.home||0),divs:Math.round(S.co.divs||0),founderPay:(founderSt()||{}).salary||0,perks:Object.keys(S.perks||{}).filter(k=>S.perks[k]),exits:(S.exits||[]).length,acquired:Math.round(S.co.acq||0)});};
{const el=document.querySelector('.foot span');if(el)el.textContent='Build '+BUILD+' · saves in this browser as you play.';}
