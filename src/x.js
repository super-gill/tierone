
/* ============ build 25: acquired firms as self-running branches ============ */
/* A branch is a permanent asset with its own clients, staff, manager and P&L.
   You set its direction; a manager runs it. The Strategy-tab list is a stub the
   later region map will replace, but this model stays. */
function branches(){return (S.branches=S.branches||[]);}
function branchById(id){return branches().find(b=>b.id===id);}
const BR_SEATS=15, BR_TECH_PER=130, BR_RESOLD=0.34, BR_SAL=2700;
const BR_STAFFPOL=[0.85,1.0,1.2];          // lean / right-sized / generous target staffing vs need
const BR_OVERSIGHT_COST=[0,900,2200];      // £/branch/mo for group oversight: none / light / full
function brOversightLvl(){return (S.co&&S.co.brOversight)||0;}
function brOversightQ(){return [0,0.05,0.12][brOversightLvl()]||0;}
function brOversightRet(){return [0,0.45,0.78][brOversightLvl()]||0;}   // cuts manager churn
/* headquarters synergy: your own platforms, scale and vendor terms cut a branch's cost of sales */
function brSynergy(){let s=0;if(typeof buildLive==='function'){if(buildLive('tools'))s+=0.06;if(buildLive('backup'))s+=0.05;if(buildLive('secstack'))s+=0.05;}
  s+=Math.min(0.12,branches().length*0.025);s+=Math.min(0.08,(typeof mrr==='function'?mrr():0)/1600000);return Math.min(0.4,s);}
function brResold(b){return BR_RESOLD*(1-brSynergy());}
function brStaffPol(b){return b.staffPol==null?1:b.staffPol;}
function brSeats(b){return Math.round(b.clients*(b.seatsPer||BR_SEATS));}
function brMRR(b){const per=b.perClient||(BR_SEATS*refPrice('support')*1.9);return Math.round(b.clients*per*(b.price/(b.price0||0.98)));}
function brRent(b){return b.staff<=3?900:b.staff<=10?2400:b.staff<=24?5200:9500;}
function brCosts(b){return Math.round(brMRR(b)*brResold(b) + b.staff*BR_SAL*(1+ONCOST) + b.mgr.salary*(1+ONCOST) + brRent(b) + (b.invest?brMRR(b)*0.06:0) + BR_OVERSIGHT_COST[brOversightLvl()]);}
function brProfit(b){return brMRR(b)-brCosts(b);}
function brMargin(b){const m=brMRR(b);return m?brProfit(b)/m:0;}
/* a better manager runs the branch leaner for the same quality */
function brNeed(b){return Math.max(1,Math.round(brSeats(b)/(BR_TECH_PER*(0.85+0.06*((b.mgr&&b.mgr.skill)||3)))));}
function brQuality(b){const cap=clamp(b.staff/brNeed(b),0.3,1.4);return clamp(0.35+cap*0.4+((b.mgr&&b.mgr.skill)||3)*0.05+(b.invest?0.12:0)+brOversightQ()-Math.max(0,b.price-1)*0.35,0.1,1);}
/* one-line health read for the card and the tab alert */
function brHealth(b){const p=brProfit(b),q=brQuality(b),need=brNeed(b);
  if(b.mgr&&b.mgr.salary<marketBrMgr(b)*0.9)return {a:1,t:'Manager underpaid, may leave'};
  if(p<0)return {a:1,t:'Losing money'};
  if(b.staff<need*0.9&&q<0.6)return {a:1,t:'Understaffed, quality slipping'};
  if(b.clients>=(120+S.co.rep)*0.93)return {a:0,t:'Near local capacity'};
  if(p>0&&(b.grow||1)>1&&q>=0.6)return {a:0,t:'Well-run and growing'};
  if(q<0.55)return {a:1,t:'Quality is drifting'};
  return {a:0,t:'Ticking along'};}
function brAlerts(){return branches().filter(b=>brHealth(b).a).length;}
function brValue(b){const p=brProfit(b);return Math.max(0,Math.round(Math.max(brMRR(b)*12*0.7,p*12*4.5)/5000)*5000);}
function brName(rid){const r=rivalById(rid);return r?r.name:'A branch';}

function makeBranch(x,rid){const r=rivalById(rid);const clients=Math.max(1,x.cl.length);const seats=x.cl.reduce((a,c)=>a+c.seats,0)||clients*BR_SEATS;
  const perClient=(x.mrr&&clients)?x.mrr/clients:BR_SEATS*refPrice('support')*1.9;
  const need=Math.max(1,Math.round(seats/BR_TECH_PER*1.05));
  const b={id:uid(),name:x.name,rid,region:'home',clients,price:0.98,price0:0.98,perClient,seatsPer:seats/clients,
    mgr:{name:pick(FIRST)+' '+pick(LAST),skill:ri(2,4),salary:Math.round(rnd(3200,4200)/10)*10},
    staff:need,invest:false,grow:1,sat:60-Math.round((x.churn||10)/3),born:S.day,cash:0,hist:[]};
  branches().push(b);return b;}

/* monthly: the branch runs itself */
function branchesMonthly(){for(const b of branches().slice()){
  const need=brNeed(b),q=brQuality(b);
  b.sat=clamp(b.sat+(q*100-b.sat)*0.18,0,100);
  if(brOversightLvl())spend(BR_OVERSIGHT_COST[brOversightLvl()]);
  // an underpaid manager may leave; group oversight makes that far less likely
  const fair=marketBrMgr(b);if(b.mgr.salary<fair*0.9&&Math.random()<0.08*(1-brOversightRet())){log(b.name+'’s manager, '+b.mgr.name+', has left for a better offer. Appoint a new one on the Branches tab.','bad');b.mgr={name:pick(FIRST)+' '+pick(LAST),skill:ri(1,3),salary:fair,green:S.day};b.sat=Math.max(0,b.sat-8);}
  // clients churn (proportional) and win new business (absolute), so a small
  // branch actually grows into the local market rather than stalling near zero
  const churn=clamp(0.015+(60-b.sat)/60*0.06+Math.max(0,b.price-1)*0.12,0,0.16);
  const room=clamp(1-b.clients/(120+S.co.rep),0.05,1);
  const intake=Math.max(0,(b.invest?1.3:0.5)*(b.grow||1)*(0.4+q*0.6)*room*(0.7+clamp(S.co.rep,0,100)/200));
  let n=Math.max(0,b.clients*(1-churn)+intake);
  const ic=Math.floor(n)+(Math.random()<(n%1)?1:0);b.clients=Math.max(0,ic);
  // staffing follows the policy you set, and converges quickly so it stays responsive
  const want=Math.max(1,Math.round(need*BR_STAFFPOL[brStaffPol(b)]));
  const step=Math.max(1,Math.ceil(Math.abs(want-b.staff)*0.34));
  if(b.staff<want&&brProfit(b)>-b.staff*2500)b.staff=Math.min(want,b.staff+step);
  else if(b.staff>want)b.staff=Math.max(want,b.staff-step);
  // the money flows to you
  const p=brProfit(b);S.co.cash+=p;S.m.branch=(S.m.branch||0)+p;
  b.lastP=p;(b.hist=b.hist||[]).push(Math.round(b.clients));if(b.hist.length>12)b.hist.shift();
  if(b.clients<1){log(b.name+' has withered away to nothing and closed. A branch needs looking after.','bad');branches().splice(branches().indexOf(b),1);x19('branchLost');}
}}
function marketBrMgr(b){return Math.round((3000+brSeats(b)*0.4)/10)*10;}

/* how you steer it */
ACT_EXT.brPrice=v=>{const [id,p]=v.split(':');const b=branchById(id);if(b)b.price=+p;};
ACT_EXT.brGrow=v=>{const [id,g]=v.split(':');const b=branchById(id);if(b)b.grow=+g;};
ACT_EXT.brInvest=v=>{const b=branchById(v);if(b)b.invest=!b.invest;};
ACT_EXT.brMgr=v=>{const b=branchById(v);if(!b)return;const cost=8000;if(S.co.cash<cost)return;spend(cost);b.mgr={name:pick(FIRST)+' '+pick(LAST),skill:ri(3,5),salary:marketBrMgr(b),green:S.day};b.sat=Math.min(100,b.sat+5);log('You brought in a new manager for '+b.name+'.','info');};
ACT_EXT.brPayMgr=v=>{const b=branchById(v);if(b){b.mgr.salary=marketBrMgr(b);b.sat=Math.min(100,b.sat+4);log(b.mgr.name+' is now paid the going rate.','good');}};
ACT_EXT.brSell=v=>{const b=branchById(v);if(!b)return;if(S.day-b.born<DPM*3){if(typeof toast==='function')toast('Give it a few months before selling.');return;}const val=Math.round(brValue(b)*0.9/1000)*1000;S.co.cash+=val;S.m.setup+=val;S.co.capYr=(S.co.capYr||0)+val;branches().splice(branches().indexOf(b),1);log('You sold '+b.name+' for '+gbp(val)+'.','good');x19('branchSold');ui.modal=null;};
ACT_EXT.brAbsorb=v=>{const b=branchById(v);if(!b)return;if(freeDesk()<0){log('No room at your main office to absorb '+b.name+'. You need a bigger office first.','bad');return;}
  const n=Math.min(b.clients,Math.max(0,cap()-staffOn().length)*8+20);let added=0;
  for(let i=0;i<b.clients&&i<200;i++){const sector=pick(Object.keys(SECTORS));const c=makeClient(genName(sector),sector,Math.max(3,Math.round(BR_SEATS*rnd(0.5,1.5))),[]);c.svc.support={since:S.day,pm:b.price};c.svc.m365={since:S.day,pm:b.price};c.sat=b.sat;c.trust=30;c.term=12;c.termEnd=S.day+ri(1,12)*DPM;S.clients.push(c);autoAssign(c);added++;}
  for(const _ of Array(Math.min(b.staff,Math.max(0,cap()-staffOn().length)))){if(freeDesk()<0)break;const cd=genCand(Math.random()<0.6?'desk':'eng','board');cd.now=true;cands(cd.role);hire(cd);}
  branches().splice(branches().indexOf(b),1);log('You’ve folded '+b.name+' into your main office: '+added+' clients and its team join you.','event');ui.modal=null;};

/* choosing how to run a firm you buy */
function offerBranch(x,price){S.co.cash-=price;S.co.acq=(S.co.acq||0)+price;(S.co.acqLog=S.co.acqLog||[]).push({d:S.day,mrr:x.mrr});
  const b=makeBranch(x,x.rid);if(x.rid&&S.mkt)S.mkt.r=S.mkt.r.filter(r=>r.id!==x.rid);
  S.co.rep=Math.min(100,S.co.rep+1);log('You bought '+x.name+' and are running it as a branch: '+b.clients+' clients under '+b.mgr.name+'. It appears on the Strategy tab.','good');}
MODAL_EXT.acqHow=(M,x0)=>{const c=M.ctx;const p=M.price;
  return '<div class="dialog">'+x0+'<p class="kick">'+esc(c.name)+'</p><h2>How will you run it?</h2><p>'+c.cl.length+' clients, about '+gbp(c.mrr)+' a month, '+c.staff.length+' staff. You’re paying '+gbp(p)+'.</p><div class="choices">'+
    '<button class="choice" data-act="acqAbsorb"><b>Absorb into your main office</b><span>Its clients and staff join you. They need desks and onboarding, and you run them directly. Best for a small, local firm.</span></button>'+
    '<button class="choice" data-act="acqAsBranch"><b>Run it as a branch</b><span>It keeps its own office, staff and clients under a manager. You set its direction and take its profit, but don’t work its desk. Best for anything sizeable or far away.</span></button>'+
    '</div></div>';};
ACT_EXT.acqAbsorb=()=>{const M=ui.modal;if(!M||!M.ctx)return;doAcq(M.ctx,M.price);ui.modal=null;};
ACT_EXT.acqAsBranch=()=>{const M=ui.modal;if(!M||!M.ctx)return;offerBranch(M.ctx,M.price);ui.modal=null;};
/* route the purchase through the choice */
const _doAcqRoute=doAcq;
function buyAcq(x,p){ui.modal={type:'acqHow',ctx:x,price:p};}

/* the branches section on the Strategy tab (temporary; the region map will replace it) */
function branchesSec(){const bs=branches();if(!bs.length)return '';
  const spark=h=>{if(!h||h.length<2)return '';const w=120,ht=26,mx=Math.max(...h),mn=Math.min(...h),sp=Math.max(1,mx-mn);return '<svg width="'+w+'" height="'+ht+'" style="vertical-align:middle"><polyline points="'+h.map((v,i)=>(i*w/(h.length-1)).toFixed(0)+','+(ht-3-(v-mn)/sp*(ht-6)).toFixed(0)).join(' ')+'" fill="none" stroke="var(--p)" stroke-width="1.5"/></svg>';};
  const tot=bs.reduce((a,b)=>a+brProfit(b),0),alerts=brAlerts(),syn=brSynergy(),ol=brOversightLvl();
  let h='<div class="sec"><h3>Your branches</h3><p class="lede">MSPs you own and run as separate sites. Set each one’s policy and a good manager runs it; you take the profit. Left unmanaged, a branch drifts toward its fundamentals, so set oversight and pay the managers rather than babysitting each site.</p>';
  h+='<div class="tiles" style="margin-bottom:10px"><div class="tile"><span class="k">Branches</span><span class="v">'+bs.length+'</span><small>'+(alerts?'<span class="neg">'+alerts+' need attention</span>':'all steady')+'</small></div>'+
    '<div class="tile"><span class="k">Total profit</span><span class="v '+(tot<0?'neg':'pos')+'">'+sgbp(tot)+'</span><small>a month, after oversight</small></div>'+
    '<div class="tile"><span class="k">HQ synergy</span><span class="v pos">'+pct(syn)+'</span><small>off branch cost of sales</small></div></div>';
  h+='<p class="lede" style="margin:0 0 4px">Group oversight <span class="mut" style="font-size:.8rem">· keeps branches sharp and managers in post, so you don’t tend each one at speed</span></p><div class="seg" style="margin-bottom:12px">'+
    ['None','Light','Full'].map((t,i)=>'<button data-act="brOversee" data-v="'+i+'" aria-pressed="'+(ol===i)+'">'+t+'<small>'+(BR_OVERSIGHT_COST[i]?gbp(BR_OVERSIGHT_COST[i])+'/branch':'hands-off')+'</small></button>').join('')+'</div>';
  for(const b of bs){const p=brProfit(b),q=brQuality(b),fair=marketBrMgr(b),underpaid=b.mgr.salary<fair*0.9,hl=brHealth(b),sp=brStaffPol(b);
    h+='<div class="plan" style="margin-bottom:12px"><div class="row" style="justify-content:space-between"><b>'+esc(b.name)+'</b><span class="'+(p>=0?'pos':'neg')+'">'+sgbp(p)+'/mo <span class="mut" style="font-size:.8rem">'+pct(brMargin(b))+'</span></span></div>'+
      '<div class="'+(hl.a?'wrn':'mut')+'" style="font-size:.8rem;margin:2px 0 4px">'+(hl.a?'▲ ':'')+esc(hl.t)+'</div>'+
      '<div class="mut" style="font-size:.82rem;margin:0 0 6px">'+Math.round(b.clients)+' clients · '+b.staff+' staff (needs '+brNeed(b)+') · SLA feel '+pct(q)+' · satisfaction '+Math.round(b.sat)+' '+spark(b.hist)+'</div>'+
      '<div class="mut" style="font-size:.82rem;margin-bottom:6px">Manager: '+esc(b.mgr.name)+' (skill '+b.mgr.skill+'/5, '+gbp(b.mgr.salary)+'/mo)'+(underpaid?' <span class="neg">underpaid</span> <button class="linkbtn" data-act="brPayMgr" data-v="'+b.id+'">pay the rate</button>':'')+' · <button class="linkbtn" data-act="brMgr" data-v="'+b.id+'">replace (£8k)</button></div>'+
      '<div class="row" style="gap:8px;flex-wrap:wrap"><span class="mut" style="font-size:.8rem;min-width:62px">Staffing</span><div class="seg" style="flex:1">'+['Lean','Right-sized','Generous'].map((t,i)=>'<button data-act="brStaff" data-v="'+b.id+':'+i+'" aria-pressed="'+(sp===i)+'">'+t+'</button>').join('')+'</div></div>'+
      '<div class="row" style="gap:8px;flex-wrap:wrap;margin-top:6px"><span class="mut" style="font-size:.8rem;min-width:62px">Price</span><div class="seg" style="flex:1">'+[0.9,0.98,1.08].map(pr=>'<button data-act="brPrice" data-v="'+b.id+':'+pr+'" aria-pressed="'+(Math.abs(b.price-pr)<0.02)+'">'+(pr<0.95?'Keen':pr>1.03?'Premium':'Market')+'</button>').join('')+'</div></div>'+
      '<div class="row" style="gap:8px;flex-wrap:wrap;margin-top:6px"><span class="mut" style="font-size:.8rem;min-width:62px">Ambition</span><div class="seg" style="flex:1">'+[[0.6,'Hold'],[1,'Steady'],[1.5,'Grow']].map(([g,t])=>'<button data-act="brGrow" data-v="'+b.id+':'+g+'" aria-pressed="'+(Math.abs(b.grow-g)<0.05)+'">'+t+'</button>').join('')+'</div></div>'+
      '<div class="row" style="gap:8px;margin-top:8px"><button class="btn sm" data-act="brInvest" data-v="'+b.id+'" aria-pressed="'+!!b.invest+'">'+(b.invest?'Investing (6%, growth push)':'Invest for growth')+'</button><span class="grow"></span><button class="btn sm" data-act="brAbsorb" data-v="'+b.id+'">Absorb</button><button class="btn sm" data-act="brSell" data-v="'+b.id+'">Sell · '+gbp(brValue(b))+'</button></div>'+
      '</div>';}
  return h+'</div>';}
ACT_EXT.brStaff=v=>{const [id,p]=(v||'').split(':');const b=branchById(id);if(b)b.staffPol=Math.max(0,Math.min(2,+p||0));};
ACT_EXT.brOversee=v=>{if(S.co)S.co.brOversight=Math.max(0,Math.min(2,+v||0));log('Branch oversight set to '+['none','light','full'][S.co.brOversight]+'.','info');};
/* branchesSec relocated to its own Branches tab under Business (see zzr.js) */
/* branch profit shows on the Money tab summary too */
const _peopleDaily25=peopleDaily;peopleDaily=function(W){_peopleDaily25(W);};
const _monthEnd25=monthEnd;monthEnd=function(){_monthEnd25();branchesMonthly();};
