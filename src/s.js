
/* ============ build 20: late-game risk, lawsuits and big bets ============ */
const SEC_PROG=[0,2,5];            // £ a supported user a month
const DEV_COST=5500;               // loaded cost of one DevOps engineer a month
const DEV_SIZES=[0,3,6,10];
function supportSeats(){return svcUsers('support');}
function secProgCost(){return SEC_PROG[S.co.secProg||0]*supportSeats();}
function piPrem(){return Math.round(Math.max(250,mrr()*0.005)*(S.co.piMult||1));}
function secDef(){return clamp((S.co.iso?0.25:0)+[0,0.2,0.4][S.co.secProg||0]+(betLive('soc')?0.35:0)+(S.co.compl?0.05:0)+(buildLive('secstack')?0.1:0),0,0.85);}
function toolCount(){return VEND_ORDER.filter(k=>vendOn(k)).length;}
function breachOdds(){const seats=supportSeats();if(seats<400)return 0;return 0.012*Math.min(4,seats/1000)*(1+0.08*toolCount())*(1-secDef())*(S.diff==='hard'?1.4:S.diff==='easy'?0.6:1);}

/* ---------- MSP-wide breach ---------- */
function breachMonthly(){
  if(S.day-(S.co.breachAt||-9999)<DPM*12)return;
  if(Math.random()<breachOdds()){S.co.breachAt=S.day;const tools=VEND_ORDER.filter(k=>vendOn(k)&&k!=='carrier'&&k!=='dist');
    const tool=buildLive('tools')?S.co.name+'’s own RMM':VEND[pick(tools.length?tools:['rmm'])].name;
    S.hq.push({id:'breach',ctx:{tool,share:rnd(0.25,0.45)*(betLive('soc')?0.6:1)}});x19('breach');}
}
function breachHit(x,open){
  const sup=supported().slice().sort(()=>Math.random()-0.5);const aff=sup.slice(0,Math.max(1,Math.ceil(sup.length*x.share)));
  let seats=0;for(const c of aff){seats+=c.seats;c.sat=Math.max(0,c.sat-rnd(18,32));c.trust=Math.max(0,c.trust-15);bigTickets(c,Math.max(1,Math.ceil(c.seats/12)),rnd(2,4),2,'Breach recovery');}
  const ir=Math.round((40000+12*seats)*(open?1:0.5)/1000)*1000;spend(ir);
  return {aff,ir};
}
function breachFallout(aff,churn,sue,why){
  let left=0,sued=0;
  for(const c of aff){if(c.gone)continue;
    if(c.notice==null&&Math.random()<churn){c.notice=S.day+DPM;c.ending=true;c.why=why||'breach';left++;}
    if(c.seats>=20&&Math.random()<sue){sued++;fileSuit({kind:'breach',cid:c.id,who:c.name,claim:Math.round(clientMRR(c)*12*rnd(0.8,2.5)/1000)*1000,d:S.day+ri(15,150)});}}
  return {left,sued};
}
HUMAN.breach={w:0,ok:()=>false,make:x=>{const n=supported().length;const est=Math.max(1,Math.ceil(n*x.share));
  return {kicker:'Security incident · your own systems',title:'Attackers are inside '+x.tool,
    body:'Someone has used '+x.tool+' to push malware to your clients. About '+est+' of your '+n+' supported clients are hit. Every client is going to ask how this happened. Whatever you choose, the recovery work lands on your team.',
    choices:[
      {label:'Tell every client and call in incident responders',note:'Expensive and humbling. Some clients leave and a few sue, but you keep your name.',go(){const r=breachHit(x,true);const f=breachFallout(r.aff,0.08,0.12);S.co.rep=Math.max(5,S.co.rep-8);if(S.co.reg)log('You reported the breach to the regulator.','info');
        log('You disclosed the breach. Incident response cost '+gbp(r.ir)+'. '+r.aff.length+' clients need recovery work'+(f.left?', and '+f.left+' are leaving':'')+'.','bad');}},
      {label:'Fix it quietly and tell only the worst hit',note:'Half the cost. If it comes out later, it’s far worse: more clients leave, more sue, and a regulator fine if you’re regulated.',go(){const r=breachHit(x,false);S.co.rep=Math.max(5,S.co.rep-2);S.co.cover={d:S.day+ri(25,70),ids:r.aff.map(c=>c.id)};
        log('You cleaned up the breach quietly. Cost so far '+gbp(r.ir)+'.','bad');}}
    ]};}};
function coverCheck(){const cv=S.co.cover;if(!cv||S.day<cv.d)return;S.co.cover=null;
  if(Math.random()<0.55){const aff=cv.ids.map(C).filter(c=>c&&!c.gone);const f=breachFallout(aff,0.2,0.25,'breach');S.co.rep=Math.max(5,S.co.rep-20);
    let fine=0;if(S.co.reg){fine=Math.round(clamp(mrr()*12*0.04,25000,600000)*(insCover()?0.3:1)/1000)*1000;S.co.cash-=fine;S.m.other+=fine;}
    log('The breach you kept quiet is in the trade press. '+f.left+' clients are leaving'+(f.sued?', '+f.sued+' are suing':'')+(fine?', and the regulator fined you '+gbp(fine):'')+'.','bad');x19('coverBlown');}
  else log('The breach never made the news.','info');}

/* ---------- lawsuits ---------- */
function suitWin(kind){const c=S.co.counsel?0.15:0;
  if(kind==='breach')return clamp(0.3+(S.co.iso?0.15:0)+0.1*(S.co.secProg||0)+c,0.1,0.85);
  if(kind==='contract')return clamp(0.45+c+(slaPct()>0.9?0.1:0),0.1,0.85);
  return clamp(0.35+(S.co.counsel?0.2:0),0.1,0.85);}
function covered(kind){return S.co.pi&&S.day-(S.co.piAt||0)>=DPM*3&&(kind==='breach'||kind==='contract');}
function payDamages(kind,amt){if(covered(kind)){const own=Math.min(amt,25000);spend(own);S.co.piMult=(S.co.piMult||1)*1.25;return own;}spend(amt);return amt;}
function fileSuit(o){(S.suitQ=S.suitQ||[]).push(o);}
function suitDaily(){
  for(const o of (S.suitQ||[]).slice())if(S.day>=o.d){S.suitQ=S.suitQ.filter(z=>z!==o);o.id=uid();o.w=suitWin(o.kind);S.hq.push({id:'suit',ctx:o});x19('suit');}
  for(const s of (S.suits||[]).slice()){
    if(!covered(s.kind))spend(s.fee/DPM);
    if(S.day>=s.end){S.suits=S.suits.filter(z=>z!==s);
      if(Math.random()<s.w){log('You won the case '+s.who+' brought against you.','good');}
      else{const paid=payDamages(s.kind,Math.round(s.claim*1.2));S.co.rep=Math.max(5,S.co.rep-4);log('You lost the case '+s.who+' brought. Damages and costs: '+gbp(Math.round(s.claim*1.2))+(paid<s.claim?', '+gbp(paid)+' after insurance':'')+'.','bad');x19('suitLost',s.claim);}}}
}
const SUIT_WHY={breach:'says your breach cost them work, data and money',contract:'says you failed to deliver the service in their contract',tribunal:'claims unfair dismissal at an employment tribunal'};
HUMAN.suit={w:0,ok:()=>false,make:x=>{const settle=Math.round(x.claim*(x.kind==='tribunal'?0.5:0.45)/500)*500;const fee=Math.round(Math.max(4000,x.claim*0.04)*(S.co.counsel?0.5:1)/100)*100;const cov=covered(x.kind);
  return {kicker:'Legal',title:x.who+' is '+(x.kind==='tribunal'?'taking you to a tribunal':'suing you')+' for '+gbp(x.claim),
    body:x.who+' '+SUIT_WHY[x.kind]+'. Your lawyers put your chance of winning at about '+pct(x.w)+'.'+(cov?' Your professional indemnity insurance covers damages and fees above a £25,000 excess.':x.kind!=='tribunal'&&S.co.pi?' Your indemnity policy is too new to cover this one.':''),
    choices:[
      {label:'Settle for '+gbp(settle),note:cov?'You pay the first £25,000; the insurer pays the rest.':'Paid now. It ends today.',go(){const p=payDamages(x.kind,settle);log('You settled with '+x.who+' for '+gbp(settle)+(p<settle?' ('+gbp(p)+' from you)':'')+'.','bad');}},
      {label:'Fight it',note:'Legal fees of about '+gbp(fee)+' a month'+(cov?' (covered)':'')+' for four to nine months. Lose and you pay the claim plus costs.',go(){(S.suits=S.suits||[]).push({kind:x.kind,who:x.who,claim:x.claim,w:x.w,fee,end:S.day+ri(4,9)*DPM});log('You’re defending the claim from '+x.who+'.','event');}}
    ]};}};
function contractSuits(){for(const c of active())if(c.why==='unhappy'&&c.notice!=null&&!c.sued&&c.seats>=30&&c.sat<35){c.sued=true;if(Math.random()<0.25)fileSuit({kind:'contract',cid:c.id,who:c.name,claim:Math.round(clientMRR(c)*rnd(4,9)/500)*500,d:S.day+ri(10,40)});}}
/* microsoft-style licensing audit */
function licAuditCheck(){const u=svcUsers('m365');if(u<250||S.day-(S.co.licAt||-9999)<DPM*24||Math.random()>1/30)return;S.co.licAt=S.day;S.hq.push({id:'licAudit',ctx:{short:Math.round(u*rnd(0.04,0.12))}});}
HUMAN.licAudit={w:0,ok:()=>false,make:x=>{const bill=Math.round(x.short*12.5*12*1.25/100)*100;const w=S.co.counsel?0.6:0.4;
  return {kicker:'Licensing audit',title:'Auditors say you’re '+x.short+' Microsoft licences short',body:'A licensing review of your Microsoft 365 estate found users without the right licences. They want a year’s back-billing plus a penalty: '+gbp(bill)+'.',
    choices:[{label:'Pay '+gbp(bill),note:'Done, and a lesson in licence hygiene.',go(){spend(bill);log('You paid '+gbp(bill)+' to settle the licensing audit.','bad');}},
      {label:'Dispute it',note:'About '+pct(w)+' chance they cut it by 60%. Otherwise you pay it all plus £8,000 in fees.',go(){if(Math.random()<w){spend(Math.round(bill*0.4));log('The dispute worked. You paid '+gbp(Math.round(bill*0.4))+'.','good');}else{spend(bill+8000);log('The dispute failed. You paid '+gbp(bill+8000)+' including fees.','bad');}}}]};}};
/* tribunal claims from careless dismissals now go to court rather than settling themselves */
function claimsToSuits(){for(const c of (S.claims||[]).slice())if(S.day>=c.day){S.claims=S.claims.filter(z=>z!==c);if(S.co.counsel&&Math.random()<0.5){log(c.name+'’s tribunal claim was dropped after your counsel responded.','good');continue;}fileSuit({kind:'tribunal',who:c.name,claim:Math.round(c.amt*1.5/500)*500,d:S.day});}}

/* ---------- big bets ---------- */
const BETS={
  soc:{t:'Build your own SOC',need:60000,cost:200000,months:6,run:28000,d:'A 24/7 security operations centre of your own. Much harder to breach, you can charge about a third more for managed security, and it’s needed before DevOps can build your own security stack.'},
  dc:{t:'Build a data centre',need:80000,cost:400000,months:8,run:15000,d:'Your own racks and power. On its own it sells private hosting to clients. Tied into bespoke systems by a DevOps team, it makes your own backup platform and cheap SaaS hosting possible.'},
  campaign:{t:'National marketing campaign',need:30000,cost:120000,months:6,run:0,d:'Six months of national advertising and events. Brings in a wave of leads and reputation, if it lands.'},
  rival:{t:'Buy a large rival',need:100000,cost:0,months:0,run:0,d:'Approach a much bigger MSP than the retiring owners who usually call. Big clients, big staff, big integration risk.'}
};
function bet(k){return (S.bets=S.bets||{})[k];}
function betLive(k){const b=bet(k);return !!(b&&b.live);}
function betsDaily(){
  for(const k of ['soc','dc','campaign']){const b=bet(k);if(!b||b.done)continue;
    if(k==='campaign'){spend(BETS.campaign.cost/(BETS.campaign.months*DPM));if(S.deals.length<18&&Math.random()<(b.flop?1.5:3.5)/DPM){addProspect({note:'Saw your national campaign.'});b.leads=(b.leads||0)+1;}if(S.day%DPM===0)S.co.rep=Math.min(100,S.co.rep+(b.flop?0.5:1.3));if(S.day>=b.end){b.done=true;log('The national campaign has ended'+(b.flop?'. It never really landed':'')+': '+(b.leads||0)+' leads and a lift in reputation for '+gbp(BETS.campaign.cost)+'.',b.flop?'bad':'good');}continue;}
    spend(BETS[k].run/DPM);
    if(!b.live&&S.day>=b.end){b.live=true;if(k==='soc'){S.co.rep=Math.min(100,S.co.rep+5);log('Your SOC is live. Managed security is now a premium product.','good');}else log('Your data centre is live. Private hosting is on sale to your clients.','good');}
    if(b.live&&k==='dc'){if(typeof dcTick==='function')dcTick(b);else{if(S.day%DPM===0){b.users=Math.min(supportSeats()*0.4,(b.users||0)+supportSeats()*0.035);}const rev=(b.users||0)*9/DPM;S.co.cash+=rev;S.m.soft=(S.m.soft||0)+rev;}}
  }
}
function dLabelY(day){const m=monthOf(day);return (Math.floor((day%DPM)*30/DPM)+1)+' '+MON3[m%12]+' '+(START_Y+Math.floor(m/12));}
function canBet(k){const b=bet(k);if(!b)return true;if(k==='rival')return S.day-b.d>=DPM*6;if(k==='campaign')return !!b.done&&S.day-b.end>=DPM*6;return false;}
ACT_EXT.betGo=k=>{const B=BETS[k];if(!B||!canBet(k)||mrr()<B.need)return;
  if(k==='rival'){bigRival();return;}
  const over=k!=='campaign'&&Math.random()<0.35;const months=B.months+(over?3:0);const cost=Math.round(B.cost*(over?1.5:1));
  if(k==='campaign'){S.bets.campaign={start:S.day,end:S.day+B.months*DPM,flop:Math.random()<0.3};log('The national campaign has started: '+gbp(B.cost)+' over six months.','event');return;}
  S.bets[k]={start:S.day,end:S.day+months*DPM,cost,over};spend(Math.round(cost*0.5));S.bets[k].rest=cost-Math.round(cost*0.5);
  log(B.t+' is under way. '+gbp(Math.round(cost*0.5))+' paid now'+(over?'. Early signs are it will run over.':'.'),'event');};
function betPayments(){for(const k of ['soc','dc']){const b=bet(k);if(b&&!b.live&&b.rest>0){const m=Math.max(1,Math.round((b.end-b.start)/DPM));const p=Math.min(b.rest,Math.round(b.cost*0.5/m));spend(p);b.rest-=p;}}}
/* a much bigger acquisition */
function bigRival(){const my=mrr();const n=ri(25,60);const cl=[];let m=0;
  for(let i=0;i<n;i++){const sector=pick(Object.keys(SECTORS));const seats=ri(10,80);const svcs=['support','m365'].concat(Math.random()<0.6&&vendOn('backup')?['backup']:[]).concat(Math.random()<0.4&&vendOn('edr')?['security']:[]);cl.push({sector,seats,svcs,name:genName(sector)});for(const k of svcs)m+=S.price[k]*0.9*(SVC[k].unit==='site'?1:seats);}
  const scale=clamp(my*rnd(0.2,0.35)/Math.max(1,m),0.3,3);for(const c of cl)c.seats=Math.max(5,Math.round(c.seats*scale));m*=scale;
  const staff=[];for(let i=ri(6,14);i>0;i--)staff.push(genCand(Math.random()<0.55?'desk':'eng','rec'));
  const gm=rnd(0.3,0.5),churn=ri(8,22),price=Math.round(m*12*rnd(1.1,1.6)/5000)*5000;
  S.pending={id:'acquire',ctx:{cl,mrr:Math.round(m),gm,churn,staff,name:pick(RIVALS),owner:'The board of '+pick(RIVALS),price,big:true,stack:{rmm:pick(['pulsar','meridian','truesight']),backup:pick(['coldvault','arksafe','drivesafe'])}}};
  S.bets.rival={d:S.day};log('You approached a large rival about buying them.','event');}

/* ---------- DevOps: bespoke systems that are costly to build and cheap to run ---------- */
const BUILDS={
  tools:{t:'Your own RMM, PSA and documentation',dm:30,fail:0.2,d:'Replace Overwatch, Ticketwise and Keybook with tools built for your desk. Those tool bills almost vanish and the desk works 5% faster.'},
  auto:{t:'Automation and client portal',dm:24,fail:0.2,d:'Self-service and scripted fixes. About 15% fewer tickets across every client.'},
  backup:{t:'Your own backup platform',dm:36,fail:0.25,req:'dc',d:'Backup on your own data centre. Backup costs you a sixth of what Vaultline charges.'},
  secstack:{t:'Your own security stack',dm:48,fail:0.35,req:'soc',d:'Your SOC runs your own detection tooling. Security costs you about a fifth of Sentrix, and you’re harder to breach.'},
  saas:{t:'A SaaS product to sell',dm:40,fail:0,d:'A product for the wider market. It might flop, earn steadily or take off. Cheaper to host on your own data centre.'}
};
function build(k){return (S.builds=S.builds||{})[k];}
function buildLive(k){const b=build(k);return !!(b&&b.live);}
function devTeam(){return DEV_SIZES[S.co.dev||0];}
function devDaily(){
  const n=devTeam();if(n)spend(n*DEV_COST/DPM);
  const act=Object.keys(S.builds||{}).filter(k=>{const b=build(k);return !b.live&&!b.failed;});
  if(n&&act.length){const per=n/DPM/act.length;for(const k of act){const b=build(k);b.done+=per;
    if(b.done>=b.need){const B=BUILDS[k];
      if(k==='saas'){b.live=true;const r=Math.random();b.fit=r<0.35?0:r<0.8?1:2;b.out=['flop','steady','hit'][b.fit];b.mkt=0;b.price=1;b.rev=b.fit?4000:900;log(b.fit===0?'Your SaaS product launched to a cool reception. Almost nobody is buying. You can rework it for another shot, or put marketing behind it.':'Your SaaS product has launched and the first customers are paying.',b.fit===0?'bad':'good');}
      else if(Math.random()<B.fail*(typeof buildFailMod==='function'?buildFailMod():1)*(b.failMod||1)){b.failed=true;log(B.t+' never worked well enough to trust. The team scrapped it, but you can take another run at it.','bad');x19('buildFail');}
      else{b.live=true;applyBuild(k);log(B.t+' is live.','good');}}}}
  // live bespoke systems need looking after: with no team they start to break
  if(S.day%DPM===9){const live=Object.keys(S.builds||{}).filter(k=>buildLive(k)&&k!=='saas');for(const k of live){const p=n>=3?0.01:n?0.03:0.08;if(Math.random()<p)bespokeOutage(k);}}
  const sb=build('saas');
  if(sb&&sb.live){if(typeof saasTick==='function')saasTick(sb,n);else{if(sb.out!=='flop'&&S.day%DPM===0){const cap=sb.out==='hit'?80000:15000;sb.rev=Math.min(cap,sb.rev*(sb.out==='hit'?1.1:1.05));if(!n)sb.rev*=0.93;}if(sb.rev){const net=sb.rev*(betLive('dc')?0.95:0.8)/DPM;S.co.cash+=net;S.m.soft=(S.m.soft||0)+net;}}}
}
function applyBuild(k){
  /* your own build replaces the resold tool: no licence fee, run by your DevOps team */
  if(k==='tools')for(const v of ['rmm','psa','docs']){S.vend[v].pm=0;S.vend[v].inhouse=true;}
  if(k==='backup'){S.vend.backup.pm=0;S.vend.backup.inhouse=true;}
  if(k==='secstack'){S.vend.edr.pm=0;S.vend.edr.inhouse=true;}
}
function bespokeOutage(k){const cs=active().filter(c=>c.svc.support).sort(()=>Math.random()-0.5).slice(0,Math.ceil(active().length*0.3));
  for(const c of cs){c.sat=Math.max(0,c.sat-6);bigTickets(c,Math.max(1,Math.ceil(c.seats/20)),rnd(1,2.5),2,'Outage: '+BUILDS[k].t.replace(/^Your own /,'').replace(/^A /,''));}
  log('A bad update to '+BUILDS[k].t.toLowerCase().replace(/^your own/,'your own')+' took down service for '+cs.length+' clients.'+(devTeam()<3?' A bigger DevOps team would catch these.':''),'bad');x19('bespokeOutage');}
ACT_EXT.devSize=v=>{v=Math.round(+v);if(v>=0&&v<DEV_SIZES.length){S.co.dev=v;log(v?'Your DevOps team is now '+DEV_SIZES[v]+' engineers ('+gbp(DEV_SIZES[v]*DEV_COST)+' a month).':'You disbanded the DevOps team.','info');}};
ACT_EXT.buildGo=k=>{const B=BUILDS[k];if(!B||build(k)||!devTeam()||(B.req&&!betLive(B.req)))return;S.builds[k]={need:B.dm*rnd(1,1.6),est:B.dm,done:0,start:S.day};log('DevOps started work on '+B.t.toLowerCase()+'.','event');};
ACT_EXT.buildStop=k=>{const b=build(k);if(!b||b.live)return;delete S.builds[k];log('You cancelled '+BUILDS[k].t.toLowerCase()+'. The work so far is written off.','bad');};
/* in-house tools don't get vendor price rises */
/* a tailored stack makes the desk quicker */
const _speedOf20=speedOf;speedOf=function(st){return _speedOf20(st)*(buildLive('tools')?1.05:1);};
/* automation removes a share of tickets */
const _genTickets20=genTickets;genTickets=function(){const m=_genTickets20();if(!buildLive('auto'))return m;const keep=m.filter(t=>t.oneoff||Math.random()>0.15);const gone=new Set(m.filter(t=>!keep.includes(t)).map(t=>t.id));S.tickets=S.tickets.filter(t=>!gone.has(t.id));return keep;};
/* SOC: clients pay more for managed security */
const _refPrice20=refPrice;refPrice=k=>_refPrice20(k)*(k==='security'&&betLive('soc')?1.35:1);

/* ---------- Risk tab ---------- */
const _paneRisk20=paneRisk;
paneRisk=function(){let h=_paneRisk20();const o=breachOdds();
  h+='<div class="sec"><h3>Security of your own systems</h3><p class="lede">The bigger you get, the more attackers want into your tools, because one way in reaches every client. More tools means more ways in.</p><div class="tiles"><div class="tile"><span class="k">Breach chance</span><span class="v '+(o*12>0.25?'neg':o*12>0.1?'wrn':'pos')+'">'+(supportSeats()<400?'low':pct(Math.min(0.99,1-Math.pow(1-o,12))))+'</span><small>'+(supportSeats()<400?'too small to be a target yet':'in the next year')+'</small></div><div class="tile"><span class="k">Defences</span><span class="v">'+pct(secDef())+'</span><small>ISO, programme, SOC</small></div><div class="tile"><span class="k">Tools exposed</span><span class="v">'+toolCount()+'</span><small>systems with access to clients</small></div></div>';
  h+='<p class="lede" style="margin:10px 0 4px">Internal security programme: hardening, privileged access, red-team tests.</p><div class="seg">'+['None','Standard','Advanced'].map((t,i)=>'<button data-act="secProg" data-v="'+i+'" aria-pressed="'+((S.co.secProg||0)===i)+'">'+t+'<small>'+(i?gbp(SEC_PROG[i])+' a user, '+gbp(SEC_PROG[i]*supportSeats())+'/mo':'nothing')+'</small></button>').join('')+'</div></div>';
  return h;};
function betsList(keys,title,lede){const m=mrr();let h='<div class="sec"><h3>'+title+'</h3><p class="lede">'+lede+'</p><ul class="list">'+keys.map(k=>{const B=BETS[k],b=bet(k);let st='';
    const again=canBet(k);
    if(k==='rival')st=b?(again?'last approach '+dLabelY(b.d):'approached '+dLabelY(b.d)+', next chance '+dLabelY(b.d+DPM*6)):m<B.need?'from '+gbp(B.need)+' MRR':'';
    else if(b)st=b.live?'live, '+gbp(B.run)+'/mo':b.done?(again?'last ran to '+dLabelY(b.end):'finished, can run again from '+dLabelY(b.end+DPM*6)):k==='campaign'?'running until '+dLabelY(b.end):'building, ready '+dLabelY(b.end);
    else st=m<B.need?'from '+gbp(B.need)+' MRR':gbp(B.cost)+(B.run?' + '+gbp(B.run)+'/mo':'');
    return '<li class="item"><span><b>'+B.t+'</b></span><span class="r">'+st+'</span><span class="sub">'+B.d+(again&&m>=B.need?'<span class="row" style="margin-top:6px"><button class="btn sm" data-act="betGo" data-v="'+k+'">'+(k==='rival'?'Make an approach':'Commit')+'</button></span>':'')+'</span></li>';}).join('')+'</ul></div>';
  return h;}
function paneStrategy(){const m=mrr();
  let h='<div class="sec"><p class="lede">Long-term moves: facilities, bespoke systems and big growth plays. They cost a lot up front, take months, and might not pay back.</p></div>';
  if(m<30000)return h+'<div class="sec"><p class="empty">Strategy opens up from about £30k MRR. Until then, the money is better spent on people and clients.</p></div>';
  h+=betsList(['soc','dc'],'Facilities','Things you own and run. Builds can run over time and budget.');
  h+=devSec();
  h+=betsList(['campaign','rival'],'Growth','Big pushes for more clients.');
  h+='<div class="sec"><h3>Coming later</h3><p class="mut" style="font-size:.84rem">Deeper rival relations: alliances, joint bids and cartels among the wider market of MSPs.</p></div>';
  return h;}
function devSec(){const n=devTeam();
  let h='<div class="sec"><h3>DevOps</h3><p class="lede">A remote team of developers who build bespoke systems: your own tools, your own platforms, even products to sell. Expensive and slow to build, very cheap to run. Once something is live they have to keep looking after it, or it starts to break.</p><div class="seg">'+DEV_SIZES.map((v,i)=>'<button data-act="devSize" data-v="'+i+'" aria-pressed="'+((S.co.dev||0)===i)+'">'+(v?v+' engineers':'No team')+'<small>'+(v?gbp(v*DEV_COST)+'/mo':'')+'</small></button>').join('')+'</div><ul class="list" style="margin-top:10px">';
  h+=Object.keys(BUILDS).map(k=>{const B=BUILDS[k],b=build(k);let st,btn='';
    if(b&&b.live)st=k==='saas'?(b.out==='flop'?'launched, flopped':gbp(Math.round(b.rev))+'/mo revenue'):'live';
    else if(b&&b.failed){st='scrapped';if(n)btn='<button class="btn sm" data-act="buildRetry" data-v="'+k+'">Try again · '+gbp(Math.round(B.dm*1500))+'</button>';}
    else if(b){const pc=Math.round(b.done/b.est*100);const rate=n/Math.max(1,Object.keys(S.builds).filter(z=>!build(z).live&&!build(z).failed).length);const ml=Math.max(1,Math.ceil((b.est-b.done)/Math.max(0.01,rate)));st=pc+'% of the estimate'+(!n?', stalled':pc>=100?', running over':', about '+ml+' month'+(ml===1?'':'s')+' left');btn='<button class="btn sm" data-act="buildStop" data-v="'+k+'">Cancel</button>';}
    else{st='about '+B.dm+' developer-months';if(B.req&&!betLive(B.req))btn='<span class="mut" style="font-size:.8rem">Needs '+(B.req==='dc'?'a data centre':'your own SOC')+' first.</span>';else if(n)btn='<button class="btn sm" data-act="buildGo" data-v="'+k+'">Start</button>';}
    return '<li class="item"><span><b>'+B.t+'</b></span><span class="r">'+st+'</span><span class="sub">'+B.d+(B.fail?' Roughly '+pct(B.fail)+' chance it never works.':'')+(btn?'<span class="row" style="margin-top:6px">'+btn+'</span>':'')+'</span></li>';}).join('');
  return h+'</ul></div>';}
ACT_EXT.secProg=v=>{v=Math.round(+v);if(v>=0&&v<=2)S.co.secProg=v;};
ACT_EXT.piToggle=()=>{S.co.pi=!S.co.pi;if(S.co.pi)S.co.piAt=S.day;log(S.co.pi?'Professional indemnity cover in place.':'Professional indemnity cover cancelled.','info');};
ACT_EXT.counselToggle=()=>{S.co.counsel=!S.co.counsel;log(S.co.counsel?'You hired in-house legal counsel.':'Your legal counsel has gone.','info');};

/* ---------- daily and monthly ---------- */
const _peopleDaily20=peopleDaily;
peopleDaily=function(W){claimsToSuits();_peopleDaily20(W);
  if(S.co.secProg)spend(secProgCost()/DPM);if(S.co.pi)spend(piPrem()/DPM);if(S.co.counsel)spend(7500/DPM);
  suitDaily();betsDaily();devDaily();coverCheck();
  if(S.day%DPM===13){breachMonthly();licAuditCheck();contractSuits();betPayments();}
};

/* ---------- year one: say why a deal was lost, and more small clients for small firms ---------- */
function lossReason(d){
  const cr=typeof catRatio==='function'?catRatio(d):1;const small=staffOn().length<=3;const seats=d.kind==='new'?d.seats:0;
  const opts=[];
  if(d.pm>1||cr>1.05)opts.push(['Your price was higher than the firm they picked.',3]);
  if(small&&seats>=20)opts.push(['They worried a one or two person firm couldn’t cover them when someone’s off.',3]);
  if(d.big)opts.push(['A bigger MSP with more certifications won the tender.',3]);
  if(d.kind==='cross')opts.push(['They’re happy as they are for now. Ask again after a review.',2]);
  if(d.kind==='project')opts.push(['They’ve parked the project for this year.',2]);
  opts.push(['A local rival knew someone on their board.',1],['They went with someone else and didn’t say why.',1],['They decided to stay with their current provider for another year.',1]);
  return wpick(opts);}
const _addProspect20=addProspect;
addProspect=function(o){o=o||{};if(!o.seats&&staffOn().length<=3&&Math.random()<0.55)o.seats=ri(4,14);return _addProspect20(o);};
const _winChance20=winChance;
winChance=function(d,pm){let p=_winChance20(d,pm);if(d.kind==='new'&&staffOn().length<=3){if(d.seats<=15){p+=0.12;if((pm||1)<=1)p+=0.08;}else if(d.seats>=30)p-=0.08;}return clamp(p,0.03,0.9);};
/* month-end reports and events wait until the office opens at 08:00 */
function deferModal(){return V.speed>0&&typeof hourNow==='function'&&hourNow()<8&&!V.reduced;}
const _nextModal20=nextModal;
nextModal=function(){if(S&&!S.intro&&!S.over&&!ui.modal&&(S.report||S.pending)&&deferModal()){if(S.mq&&S.mq.length)ui.modal={type:'mq'};return;}_nextModal20();};
const _migrateSave20=migrateSave;migrateSave=function(){_migrateSave20();if(S.co.reg&&!regulated()){S.co.reg=0;S.co.aud=S.co.aud||S.day;}};
