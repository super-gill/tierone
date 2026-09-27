
/* ============ build 23: rival relations, phase 1 (above board) ============ */
const PERS={honourable:{t:'Honourable',d:'Keeps its word. A good ally, slow to anger.'},opportunist:{t:'Opportunist',d:'Friendly while it pays. Watch it when you’re weak.'},predatory:{t:'Predatory',d:'Will go for your clients and staff the moment it sees a chance.'}};
function relInit(r){if(r.stance!=null)return;r.stance=r.tier===3?-5:rnd(-10,15);r.trust=rnd(40,60);r.pers=wpick([['honourable',35],['opportunist',45],['predatory',20]]);r.intel=r.tier>=2?1:0;r.mem=[];r.deals={};}
function remember(r,t){(r.mem=r.mem||[]).unshift({d:S.day,t});if(r.mem.length>8)r.mem.pop();}
function shift(r,st,tr){r.stance=clamp((r.stance||0)+(st||0),-100,100);r.trust=clamp((r.trust||50)+(tr||0),0,100);}
function stanceWord(v){return v<=-50?'Hostile':v<=-15?'Wary':v<15?'Neutral':v<50?'Friendly':'Allied';}
function trustWord(v){return v<25?'doesn’t trust you':v<45?'unsure of you':v<70?'trusts you':'trusts you completely';}
function intelWord(i){return ['Rough guesses only','Their public accounts','A good picture','Inside knowledge'][i||0];}
function fuzzy(r,v){const i=r.intel||0;if(i>=2)return String(v);const e=i===1?0.15:0.35;const lo=Math.max(0,Math.round(v*(1-e))),hi=Math.round(v*(1+e));return lo+' to '+hi;}
function agreed(r,k){return !!(r.deals&&r.deals[k]);}
function hostility(r){return Math.max(0,-(r.stance||0))/40+(r.target&&S.day<r.target?2:0)+(r.pers==='predatory'?0.3:0);}

/* ---------- actions you can take ---------- */
const RACTS={
  meet:{t:'Take them for lunch',kind:'fair',d:'Half a day of your time. Warms them up, and you learn how they operate. Do it every few weeks to build towards a partnership.',
    ok:r=>S.day-(r.metAt||-999)>=Math.round(DPM*1.5)?'':'You saw them recently.',go:r=>{r.metAt=S.day;S.co.busy=(S.co.busy||0)+4;shift(r,r.pers==='predatory'?7:12,7);r.intel=Math.max(r.intel||0,Math.min(2,(r.intel||0)+1));remember(r,'You met their owner.');log('You met the owner of '+r.name+'. '+(r.pers==='honourable'?'Straight talking, likes to shake on things.':r.pers==='predatory'?'Friendly enough, but asked a lot of questions about your clients.':'Pleasant, and clearly weighing you up.'),'info');}},
  event:{t:'Go to an industry event',kind:'fair',d:'£1,500 and a day out. You pick up gossip on a few firms at once.',
    ok:()=>S.day-(S.co.eventAt||-999)>=DPM*2?'':'You went to one recently.',go:()=>{S.co.eventAt=S.day;spend(1500);S.co.busy=(S.co.busy||0)+7.5;const rs=rivals().slice().sort(()=>Math.random()-0.5).slice(0,3);for(const x of rs){x.intel=Math.max(x.intel||0,Math.min(2,(x.intel||0)+1));shift(x,3,0);}log('At the industry event you caught up with '+rs.map(x=>x.name).join(', ')+'.','info');},all:true},
  refer:{t:'Referral partnership',kind:'fair',d:'You pass each other clients that suit the other better. They send you the odd lead; stance grows while it lasts. Winning their clients strains it.',
    ok:r=>agreed(r,'refer')?'In place.':r.stance<12?'Get them friendlier first (a lunch or two).':r.tier===sizeTier()?'You’re too similar in size to refer to each other.':'',go:r=>{r.deals.refer=S.day;shift(r,8,8);remember(r,'You agreed a referral partnership.');log('You and '+r.name+' agreed to refer clients to each other.','good');},end:r=>{delete r.deals.refer;shift(r,-10,-5);remember(r,'You ended the referral partnership.');}},
  overflow:{t:'Overflow cover',kind:'fair',d:'When your second line is more than a day and a half behind, their engineers take up to six hours a day of it at £60 an hour. When your engineers are idle, you sell them time at £45 an hour.',
    ok:r=>agreed(r,'overflow')?'In place.':r.stance<8?'Get them friendlier first (a lunch or two).':r.tier===0?'Too small to help.':'',go:r=>{r.deals.overflow=S.day;shift(r,5,5);remember(r,'You agreed overflow cover.');log('Overflow cover agreed with '+r.name+'.','good');},end:r=>{delete r.deals.overflow;remember(r,'You ended overflow cover.');}},
  nopoach:{t:'No-poaching agreement',kind:'fair',d:'Neither of you recruits the other’s staff. Breaking it costs a lot of trust.',
    ok:r=>agreed(r,'nopoach')?'In place.':r.stance<10?'Get them friendlier first (a lunch or two).':'',go:r=>{r.deals.nopoach=S.day;shift(r,5,6);remember(r,'You agreed not to poach each other’s staff.');log('No-poaching agreement signed with '+r.name+'.','good');},end:r=>{delete r.deals.nopoach;shift(r,-5,-5);remember(r,'You ended the no-poaching agreement.');}},
  invest:{t:'Buy a 20% stake',kind:'fair',d:'A minority stake in a smaller firm. You share its profits, get first refusal if it’s ever sold, and it warms to you.',
    ok:r=>r.stake?'You own 20%.':r.tier>=3?'Publicly listed — buy its shares in the Markets panel.':r.stance<0?'They don’t want you in their business.':S.co.cash<stakePrice(r)*1.2?'Not enough cash.':'',price:r=>stakePrice(r),go:r=>{const p=stakePrice(r);spend(p);r.stake={p,d:S.day};shift(r,15,10);remember(r,'You bought 20% of the company.');log('You bought 20% of '+r.name+' for '+gbp(p)+'.','good');},end:r=>{const v=Math.round(stakePrice(r));S.co.cash+=v;S.m.setup+=v;remember(r,'You sold your stake back.');delete r.stake;log('You sold your stake in '+r.name+' for '+gbp(v)+'.','info');}},
  buy:{t:'Make an offer for the company',kind:'fair',d:'Offer to buy them outright. Friendlier, smaller firms are more likely to talk, and cheaper.',
    ok:r=>r.tier===3?'Publicly listed — take it over through the share market instead.':r.tier>sizeTier()+1?'They’re far bigger than you.':S.day-(r.offerAt||-999)<DPM*6?'You made an offer recently.':'',go:r=>{r.offerAt=S.day;offerFor(r);}},
  recruit:{t:'Recruit from their team',kind:'hard',d:'Advertise where their staff will see it. £2,000. For a month, candidates from them turn up on your job board. They’ll notice.',
    ok:r=>agreed(r,'nopoach')?'Your no-poaching agreement forbids it.':S.day-(r.recruitAt||-999)<DPM*3?'You ran one recently.':'',go:r=>{r.recruitAt=S.day;spend(2000);shift(r,-10,-5);remember(r,'You advertised for their staff.');log('You’re advertising for '+r.name+'’s staff.','event');}},
  priceWar:{t:'Price campaign on their clients',kind:'hard',d:'£5,000 a month for three months targeting their clients. Brings you their clients as leads. They’ll take it personally and may hit back.',
    ok:r=>r.war&&S.day<r.war?'Running.':'',go:r=>{r.war=S.day+DPM*3;shift(r,-20,-10);remember(r,'You ran a price campaign against their clients.');log('You launched a campaign aimed at '+r.name+'’s clients.','event');if(agreed(r,'refer'))RACTS.refer.end(r);}}
};
function stakePrice(r){return Math.round(rSeats(r)*45*12*0.9*0.2/500)*500;}
function offerFor(r){const my=mrr();const mm=rSeats(r)*S.price.support*0.95;
  const base=r.pers==='honourable'?1.0:r.pers==='opportunist'?1.2:1.45;const warm=1-clamp(r.stance,-50,60)/250;
  if(r.stance<-30||(r.pers==='predatory'&&Math.random()<0.4)){shift(r,-3,0);log(r.name+' won’t discuss selling to you.','bad');return;}
  const n=Math.min(r.clients,160);const cl=[];let m=0;for(let i=0;i<n;i++){const sector=pick(Object.keys(SECTORS));const seats=Math.max(3,Math.round(MKT_TIERS[r.tier].seats*rnd(0.5,1.5)));const svcs=['support','m365'].concat(Math.random()<0.5&&vendOn('backup')?['backup']:[]);cl.push({sector,seats,svcs,name:genName(sector)});for(const k of svcs)m+=S.price[k]*0.9*seats;}
  const staff=[];for(let i=Math.min(r.staff,12);i>0;i--)staff.push(genCand(Math.random()<0.55?'desk':'eng','rec'));
  const price=Math.round(m*12*base*warm*rnd(0.9,1.1)/5000)*5000;
  S.pending={id:'acquire',ctx:{cl,mrr:Math.round(m),gm:rnd(0.3,0.5),churn:ri(6,20),staff,name:r.name,owner:r.pers==='honourable'?'The owners of '+r.name:'The board of '+r.name,price,big:r.tier>=1,rid:r.id,stack:{rmm:pick(['pulsar','meridian','truesight']),backup:pick(['coldvault','arksafe','drivesafe'])}}};
  remember(r,'You made an offer for the company.');shift(r,r.pers==='honourable'?3:-2,0);}
ACT_EXT.rAct=v=>{const [id,k]=v.split(':');const r=rivalById(id),A=RACTS[k];if(!A)return;if(!A.all&&!r)return;const why=A.ok(r);if(why)return;A.go(r);if(k==='buy'&&S.pending){ui.modal=null;}};
ACT_EXT.rEnd=v=>{const [id,k]=v.split(':');const r=rivalById(id),A=RACTS[k];if(r&&A&&A.end)A.end(r);};

/* ---------- running the relationships ---------- */
function relDaily(){
  for(const r of rivals()){relInit(r);
    if(r.deals.overflow){
      if(l2Days()>1.5){const take=Math.min(6,tixSplit().l2);if(take>0.5){let left=take;for(const t of S.tickets){if(left<=0)break;if(t.lvl===2&&t.left>0){const d=Math.min(t.left,left);t.left-=d;left-=d;}}spend((take-left)*60);r.earned=(r.earned||0)+(take-left)*60;}}
      else{const idle=S.staff.filter(s=>s.role==='eng'&&present(s)&&(s.util||1)<0.6);if(idle.length){const h=Math.min(4,idle.length*2);idle[0].busyH=(idle[0].busyH||0)+h;S.co.cash+=h*45;S.m.proj+=h*45;}}}
    if(r.stake&&S.day%DPM===0){const div=Math.round(rSeats(r)*45*0.1*0.2);S.co.cash+=div;S.m.invest=(S.m.invest||0)+div;}
    if(r.war&&S.day<r.war){spend(5000/DPM);if(Math.random()<1.8/DPM&&S.deals.length<18){const d=addProspect({note:'One of '+r.name+'’s clients, answering your campaign.'});if(d){d.from=r.id;d.bidders=(d.bidders||[]).filter(x=>x!==r.id);}}}
  }
  if(S.day%DPM===5)relMonthly();
}
function relMonthly(){const weak=S.co.cash<burn()*1.5||slaPct()<0.85||S.co.rep<40;const agg={easy:0,normal:1,hard:3}[S.diff||'normal'];
  for(const r of rivals()){
    r.stance+=(0-r.stance)*0.012;
    if(r.deals.refer){shift(r,2,1);if(Math.random()<0.45){const d=addProspect({note:'Referred by '+r.name+'.'});if(d)d.bidders=(d.bidders||[]).filter(x=>x!==r.id);}}
    if(r.deals.nopoach)shift(r,1,0.5);
    // their clients you took this month sour the relationship
    const took=(r.iTook||0)-(r.iTookSeen||0);if(took>0){r.iTookSeen=r.iTook;shift(r,-6*took,agreed(r,'refer')?-8*took:0);if(agreed(r,'refer')&&took>=2){RACTS.refer.end(r);log(r.name+' ended your referral partnership: you keep winning their clients.','bad');}}
    // retaliation, or an unprompted attack from a predatory firm when you look weak
    const provoked=r.stance<-35;const unprompted=r.pers==='predatory'&&agg&&(weak?0.03:0.006)*agg>Math.random();
    if(!(r.target>S.day)&&(provoked&&Math.random()<0.25||unprompted)&&!(S.diff==='easy'&&!provoked)){r.target=S.day+DPM*ri(2,4);remember(r,provoked?'They started going after your clients in retaliation.':'They started going after your clients.');
      const ally=rivals().find(a=>a!==r&&a.stance>=50&&a.trust>=60);
      log(ally?ally.name+' tipped you off: '+r.name+' is going after your clients.':'Word is '+r.name+' is going after your clients.','bad');}
  }
}
/* rivals that target you quote your clients far more often */
const _rivalFor23=rivalFor;
rivalFor=function(c){const mine=priceRatio(c);const w=r=>r.aggr*(r.price<mine?1.5:0.6)*(c.seats<=15?[2,1.5,0.6,0.2][r.tier]:[0.3,1,1.5,1.5][r.tier])*(1+hostility(r))*(agreed(r,'refer')?0.3:1);return wpick(rivals().map(r=>[r,w(r)]));};
const _rivalDaily23=rivalDaily;
rivalDaily=function(){_rivalDaily23();if(S.day%DPM===7&&rivals().some(r=>r.target>S.day)){const c=pick(active().filter(c=>c.notice==null&&!c.ending&&canLeave(c)));if(c&&Math.random()<0.5)_rivalDaily23();}};
/* poaching comes from a real firm, and not from one you have an agreement with */
const _poachCtx23=EVENTS.poach.ctx;
EVENTS.poach.ctx=function(){const x=_poachCtx23();const pool=rivals().filter(r=>!agreed(r,'nopoach')&&r.tier>=Math.max(1,sizeTier()));const r=pool.length?wpick(pool.map(z=>[z,1+hostility(z)+(z.pers==='predatory'?1:0)])):null;if(r)x.rid=r.id;return x;};
const _poachMake23=EVENTS.poach.make;
EVENTS.poach.make=function(x){const e=_poachMake23(x);const r=x.rid&&rivalById(x.rid);if(!r||!e)return e;const s=ST(x.sid);
  e.title=r.name+' wants '+(s?s.name:'one of your staff');e.body=e.body.replace('They like it here',(r.stance<-15?'It looks deliberate. ':'')+'They like it here');
  e.choices=e.choices.map(ch=>Object.assign({},ch,{go(){const before=s&&s.leaveOn;ch.go();if(s&&s.leaveOn!=null&&before==null){remember(r,'They hired '+s.name+' from you.');r.staff++;}}}));return e;};
/* candidates from rival firms on your job board */
const _genCand23=genCand;
genCand=function(role,src){const c=_genCand23(role,src);const hot=rivals().filter(r=>r.recruitAt&&S.day-r.recruitAt<DPM&&r.tier>=1);
  if(hot.length&&Math.random()<0.6)c.from=pick(hot).id;else if(Math.random()<0.15){const r=wpick(rivals().filter(z=>z.tier>=1).map(z=>[z,z.staff]));if(r)c.from=r.id;}return c;};
const _hire23=hire;
hire=function(c){const n=S.staff.length;_hire23(c);if(S.staff.length>n&&c.from){const r=rivalById(c.from);if(r){S.staff[S.staff.length-1].from=r.id;r.staff=Math.max(1,r.staff-1);r.intel=Math.max(r.intel||0,2);remember(r,'You hired '+c.name+' from them.');
  if(agreed(r,'nopoach')){shift(r,-30,-35);delete r.deals.nopoach;log('Hiring '+c.name+' broke your no-poaching agreement with '+r.name+'. They’re furious.','bad');}else shift(r,-4,0);}}};
/* intel from public accounts each January */
const _marketMonthly23=marketMonthly;
marketMonthly=function(){_marketMonthly23();for(const r of rivals())relInit(r);if(monthOf(S.day)%12===0)for(const r of rivals())if(r.tier>=1)r.intel=Math.max(r.intel||0,1);};
/* a firm you hold a stake in is bought (you share the upside at its current value) or folds (you lose most of it) */
const _mm23=marketMonthly;
marketMonthly=function(){const before=rivals().filter(r=>r.stake).map(r=>({id:r.id,name:r.name,p:r.stake.p,v:stakePrice(r)}));_mm23();
  for(const b of before)if(!rivalById(b.id)){const g=(S.mkt.gone||[]).find(x=>x.id===b.id);
    if(g&&g.reason==='fold'){const back=Math.round(b.p*0.3);S.co.cash+=back;S.m.setup+=back;S.co.capYr=(S.co.capYr||0)+back;log(b.name+' has gone under. Your 20% stake returned only '+gbp(back)+' of the '+gbp(b.p)+' you put in.','bad');}
    else{const back=Math.max(b.p,Math.round(b.v));S.co.cash+=back;S.m.setup+=back;S.co.capYr=(S.co.capYr||0)+back;const gain=back-b.p;log(b.name+' has been acquired. Your 20% stake paid out '+gbp(back)+(gain>0?', a '+gbp(gain)+' gain on the '+gbp(b.p)+' you invested':'')+'.',gain>0?'good':'info');}}};
/* ---------- investments: your holdings, shown on the Money tab (public shares will slot in here later) ---------- */
function holdings(){const out=[];
  for(const r of rivals())if(r.stake)out.push({kind:'stake',rid:r.id,name:r.name,tier:MKT_TIERS[r.tier].t,paid:r.stake.p,value:stakePrice(r),monthly:Math.round(rSeats(r)*45*0.1*0.2)});
  return out;}
function investPerf(){const h=holdings();const value=h.reduce((a,x)=>a+x.value,0),paid=h.reduce((a,x)=>a+x.paid,0),mo=h.reduce((a,x)=>a+x.monthly,0);return {h,value,paid,mo,gain:value-paid,yield:value?mo*12/value:0};}
function paneInvest(){
  const P=investPerf();
  let h='<div class="sec"><h3>Investments</h3><p class="lede">Minority stakes in other firms. Each pays a monthly dividend; if a firm you hold is acquired you share the upside at its current value, and if it folds you lose most of it. Buy a 20% stake from a smaller rival’s card on the Market tab.</p>';
  if(!P.h.length)return h+'<p class="empty">You don’t hold any investments yet. Open the Market tab, pick a smaller firm and buy a 20% stake in it. Public shares in the bigger MSPs will be tradable here later.</p></div>';
  const gc=P.gain>=0?'pos':'neg';
  h+='<div class="tiles"><div class="tile"><span class="k">Portfolio value</span><span class="v">'+gbp(P.value)+'</span><small class="'+gc+'">'+(P.gain>=0?'+':'')+gbp(P.gain)+' vs '+gbp(P.paid)+' in</small></div>'+
    '<div class="tile"><span class="k">Dividends</span><span class="v">'+gbp(P.mo)+'/mo</span><small>'+gbp(P.mo*12)+' a year</small></div>'+
    '<div class="tile"><span class="k">Yield</span><span class="v">'+pct(P.yield)+'</span><small>a year, on value</small></div>'+
    '<div class="tile"><span class="k">Holdings</span><span class="v">'+P.h.length+'</span><small>firm'+(P.h.length===1?'':'s')+'</small></div></div>';
  h+='<h3 style="font-size:.95rem;margin:16px 0 6px">Your holdings</h3><div class="list">';
  for(const x of P.h){const r=rivalById(x.rid);if(!r)continue;const gain=x.value-x.paid,gcx=gain>=0?'pos':'neg';
    const trend=r.trend>0?'growing':r.trend<0?'shrinking':'steady';
    h+='<div class="item" style="flex-direction:column;align-items:stretch;gap:5px">'+
      '<div class="row" style="justify-content:space-between"><span><b>'+esc(r.name)+'</b> <span class="mut">20% · '+MKT_TIERS[r.tier].t.toLowerCase()+' · '+reg(r.region||'home').t+'</span></span><span class="r">'+gbp(x.value)+' <span class="'+gcx+'" style="font-size:.8rem">'+(gain>=0?'+':'')+gbp(gain)+'</span></span></div>'+
      '<div class="row mut" style="justify-content:space-between;font-size:.82rem"><span>~'+r.clients+' clients · '+(typeof repWord==='function'?repWord(r.rep):Math.round(r.rep))+' · '+trend+'</span><span>'+gbp(x.monthly)+'/mo dividend · paid '+gbp(x.paid)+'</span></div>'+
      '<div class="row" style="justify-content:flex-end;gap:8px;margin-top:2px"><button class="btn sm" data-act="rivalCard" data-v="'+r.id+'">Their card</button><button class="btn sm danger" data-act="rEnd" data-v="'+r.id+':invest">Sell · '+gbp(x.value)+'</button></div>'+
    '</div>';}
  h+='</div></div>';
  return h;}

/* ---------- the card ---------- */
const _rivalModal21=MODAL_EXT.rival;
MODAL_EXT.rival=(M,x)=>{const r=rivalById(M.id);if(!r)return null;relInit(r);let h=_rivalModal21(M,x);
  h=h.replace(/<span class="v">(\d+)<\/span><small>about ([\d,]+) users<\/small>/,(m0,a,b)=>'<span class="v" style="font-size:1rem">'+fuzzy(r,+a)+'</span><small>'+(r.intel>=2?'about '+b+' users':'estimate')+'</small>');
  h=h.replace('<p class="mut" style="font-size:.8rem;margin-top:10px">Partnering with, targeting or buying other MSPs comes in a later build.</p>','');
  const pers=r.intel>=1||r.metAt?PERS[r.pers].t+'. '+PERS[r.pers].d:'You don’t know them well enough to say.';
  let rel='<h3 style="font-size:.95rem;margin:14px 0 4px">Relationship</h3><table><tbody><tr><td>Stance</td><td class="r"><b>'+stanceWord(r.stance)+'</b></td></tr><tr><td>Trust</td><td class="r">'+trustWord(r.trust)+'</td></tr><tr><td>Character</td><td class="r" style="text-align:right">'+pers+'</td></tr><tr><td>What you know</td><td class="r">'+intelWord(r.intel)+'</td></tr>'+(r.stake?'<tr><td>Your stake</td><td class="r">20%, worth about '+gbp(stakePrice(r))+'</td></tr>':'')+(r.target>S.day?'<tr><td class="neg">Going after your clients</td><td class="r neg">until '+dLabel(r.target)+'</td></tr>':'')+'</tbody></table>';
  const deals=Object.keys(r.deals||{}).concat(r.stake?['invest']:[]);
  if(deals.length)rel+='<p class="mut" style="font-size:.84rem;margin:6px 0 0">In place: '+deals.map(k=>(k==='invest'?'a 20% stake':RACTS[k].t.toLowerCase())+' <button class="linkbtn" data-act="rEnd" data-v="'+r.id+':'+k+'">'+(k==='invest'?'sell':'end')+'</button>').join(' · ')+'</p>';
  const btn=k=>{const A=RACTS[k];const why=A.ok(r);const pr=A.price?' · '+gbp(A.price(r)):'';return '<li class="item"><span><b>'+A.t+'</b>'+pr+'</span><span class="r">'+(why?'<span class="mut" style="font-size:.8rem">'+why+'</span>':'<button class="btn sm" data-act="rAct" data-v="'+r.id+':'+k+'">Do it</button>')+'</span><span class="sub">'+A.d+'</span></li>';};
  rel+='<h3 style="font-size:.95rem;margin:14px 0 4px">Above board</h3><ul class="list">'+['meet','refer','overflow','nopoach','invest','buy'].map(btn).join('')+'</ul>';
  rel+='<h3 style="font-size:.95rem;margin:14px 0 4px">Playing hard</h3><ul class="list">'+['recruit','priceWar'].map(btn).join('')+'</ul>';
  rel+='<p class="mut" style="font-size:.8rem;margin-top:8px">Greyer tactics, alliances and worse come in later builds.</p>';
  if((r.mem||[]).length)rel+='<h3 style="font-size:.95rem;margin:14px 0 4px">History</h3><ul class="list">'+r.mem.map(m=>'<li class="item"><span>'+esc(m.t)+'</span><span class="r mut">'+dLabel(m.d)+'</span></li>').join('')+'</ul>';
  return h.replace(/<\/div>$/,rel+'</div>');};
/* the market table offers an industry event */
const _marketSec23=marketSec;
marketSec=function(){const h=_marketSec23();if(!h)return h;const why=RACTS.event.ok();
  return h.replace('<p class="mut" style="font-size:.8rem">Click a firm to see more.</p>','<p class="mut" style="font-size:.8rem">Click a firm to see more. Clients marked ~ are estimates. '+(why?why:'<button class="linkbtn" data-act="rAct" data-v=":event">Go to an industry event</button> (£1,500, a day out) to learn about a few firms at once.')+'</p>');};
const _migrateSave23=migrateSave;migrateSave=function(){_migrateSave23();for(const r of rivals())relInit(r);};
const _genMarket23=genMarket;genMarket=function(){_genMarket23();for(const r of rivals())relInit(r);};
const _peopleDaily23=peopleDaily;peopleDaily=function(W){_peopleDaily23(W);if(S.mkt)relDaily();};
