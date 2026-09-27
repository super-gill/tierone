
/* ============ build 17: contracts, pay and morale drivers ============ */

/* ---- market pay and what drives morale ---- */
function marketPay(s){const R=ROLES[s.role];if(!R||!R.sal)return s.salary||1;if(s.appr)return s.salary;const [lo,hi]=R.sal;return (lo+(hi-lo)*((s.skill||1)-1)/4)*(S.infl||1);}
const techRole=s=>s.role==='desk'||s.role==='eng';
function moraleTarget(s){
  const P=S.perks||{},parts=[];const add=(l,v)=>{if(Math.abs(v)>=0.5)parts.push([l,v]);};
  const soft=v=>v<0&&hasT(s,'steady')?v*0.5:v;
  const ratio=s.salary/marketPay(s);
  add(ratio<0.97?'Paid below the going rate':ratio>1.06?'Paid well for the role':'Paid about the going rate',soft(ratio<0.97?-(0.97-ratio)*180:ratio>1.06?Math.min(8,(ratio-1.06)*100):0));
  if(techRole(s)){const u=s.util||0;add(u>0.97?(s.hotDays>20?'Flat out for weeks':'Flat out'):u<0.5?'Not enough to do':'Workload is manageable',soft(u>0.97?(s.hotDays>20?-20:-10):u<0.5?-6:3));}
  if(s.role==='am'){const cap=amCap(s),ld=amLoad(s);if(ld>cap)add('Book is overloaded',soft(-8));if(s.perf!=null)add(s.perf>=1?'Hitting their sales target':'Behind on their sales target',soft(clamp((s.perf-0.8)*15,-10,8)));}
  const m=techRole(s)?mgrOn('hdm'):s.role==='am'?mgrOn('sm'):null;
  if(m){const e=effort(m);let v=[0,-4,-10][e]*(hasT(m,'driver')?1.5:1)*(hasT(m,'protective')?0.4:1);add(e?'Pressure from '+m.name.split(' ')[0]+'’s targets':'Steady management',soft(v||2));}
  if(P.social)add('Socials and perks',4);if(P.health)add('Private healthcare',2);if(P.pension&&S.day-s.start>YEAR)add('Enhanced pension',3);if(P.cars&&carRole(s))add('Car allowance',5);
  if(P.bonus)add('Profit share',S.last&&S.last.profit>0?4:-2);
  if(S.office.rooms.kitchen)add('A decent kitchen',4);else if(TIERS[S.office.tier].shared)add('Shared office facilities',1);
  if(S.office.rooms.training)add('Room to learn',2);
  if(s.role!=='founder'&&S.day-(s.skillAt||s.start)>YEAR*2&&(s.skill||1)<5)add('No progression in two years',soft(-6));
  const ex=(S.exits||[]).filter(d=>S.day-d<60).length;if(ex)add('Colleagues leaving',soft(-Math.min(8,ex*3)));
  const t=clamp(70+parts.reduce((a,p)=>a+p[1],0),5,100);
  return {t,parts:parts.sort((a,b)=>a[1]-b[1])};
}
function moraleDaily(){
  for(const s of S.staff){if(s.id==='you'||s.left||!started(s))continue;const M=moraleTarget(s);s.morale=clamp(s.morale+(M.t-s.morale)*0.03+rnd(-0.4,0.4),0,100);}
}
function moraleWhy(s){
  if(s.id==='you'||!started(s))return '';const M=moraleTarget(s);
  return '<h3 style="font-size:.95rem;margin:14px 0 6px">What’s driving their morale</h3><p class="mut" style="font-size:.8rem;margin:0 0 6px">Morale drifts towards '+Math.round(M.t)+' at the moment. Market pay for this role and skill is about '+gbp(Math.round(marketPay(s)/10)*10)+' a month.</p><ul class="list">'+M.parts.map(p=>'<li class="item" style="padding:5px 0"><span>'+esc(p[0])+'</span><span class="r '+(p[1]<0?'neg':'pos')+'">'+(p[1]>0?'+':'')+Math.round(p[1])+'</span></li>').join('')+'</ul>';
}
/* ---- wage inflation and the annual pay review ---- */
const _genCand17=genCand;
genCand=function(role,src){const c=_genCand17(role,src);c.salary=Math.round(c.salary*(S.infl||1)/10)*10;return c;};
const _monthEnd17=monthEnd;
monthEnd=function(){_monthEnd17();if(monthOf(S.day)%12===0&&S.day>0){S.infl=(S.infl||1)*1.03;log('New year: market pay for IT staff is up about 3%. Anyone you don’t review falls a little further behind.','event');}};
function payReviewSec(){
  const n=staffOn().filter(s=>s.id!=='you').length;if(!n)return '';const ok=S.day-(S.co.payAt||-999)>=DPM*11&&S.day>=DPM*6;
  const behind=staffOn().filter(s=>s.id!=='you'&&s.salary<marketPay(s)*0.97).length;
  return '<div class="sec"><h3>Annual pay review</h3><p class="lede">'+(behind?'<b class="wrn">'+behind+' of '+n+'</b> are paid below the going rate for their role and skill.':'Everyone is paid around the going rate.')+' Market pay rises about 3% a year. One review a year, for everyone at once.</p><div class="seg">'+[0,2,3,5].map(v=>'<button data-act="payReview" data-v="'+v+'" '+(ok?'':'disabled')+'>'+(v?'+'+v+'%':'Freeze')+'<small>'+(v?'+'+gbp(Math.round(staffOn().filter(s=>s.id!=='you').reduce((a,s)=>a+s.salary,0)*(1+ONCOST)*v/100))+'/mo':'morale dips')+'</small></button>').join('')+'</div>'+(ok?'':'<p class="mut" style="font-size:.78rem;margin-top:4px">Next review from '+dLabel(Math.max(DPM*6,(S.co.payAt||-999)+DPM*11))+'.</p>')+'</div>';
}
ACT_EXT.payReview=v=>{v=+v;if(![0,2,3,5].includes(v)||S.day-(S.co.payAt||-999)<DPM*11)return;S.co.payAt=S.day;for(const s of staffOn()){if(s.id==='you')continue;if(v){s.salary=Math.round(s.salary*(1+v/100)/10)*10;s.morale=Math.min(100,s.morale+v);}else s.morale=Math.max(0,s.morale-6);}log(v?'Pay review: everyone gets '+v+'%.':'Pay freeze this year. The team isn’t happy.',v?'good':'bad');};
/* ---- resignations are a conversation ---- */
HUMAN.resign={w:0,ok:()=>false,make:x=>{const s=ST(x.sid);if(!s||s.left||s.leaveOn!=null)throw 0;const M=moraleTarget(s);const worst=M.parts.filter(p=>p[1]<0)[0];const pay=worst&&/Paid below/.test(worst[0]);const first=s.name.split(' ')[0];
  const go=()=>{s.leaveOn=S.day+ri(15,21);s.resignQ=false;log(s.name+' is leaving in about a month.','bad');};
  return {kicker:'Team',title:s.name+' has resigned',body:first+' has handed in their notice'+(worst?'. Reading between the lines: '+worst[0].toLowerCase():'')+'. They’d leave in about a month.',
    choices:[
      {label:'Counter-offer: +12% salary',note:pay?'Pay is the problem, so this usually works.':'Money may not be what this is about.',go(){if(Math.random()<(pay?0.8:0.35)){s.salary=Math.round(s.salary*1.12/10)*10;s.morale=Math.min(100,s.morale+15);s.resignQ=false;log(s.name+' accepted your counter-offer and is staying.','good');}else{log(s.name+' turned down your counter-offer.','bad');go();}}},
      {label:'Sit down and talk it through',note:'Half a day of your time. Works when the problem is something you can change.',go(){S.co.busy=(S.co.busy||0)+4;if(Math.random()<(pay?0.25:0.5)){s.morale=Math.min(100,s.morale+12);s.resignQ=false;log(s.name+' has agreed to stay, for now. They’ll be watching whether things change.','good');}else{log('The conversation didn’t change '+s.name+'’s mind.','bad');go();}}},
      {label:'Accept their notice',note:'Wish them well.',go}]};}};

/* ---- contracts ---- */
const TERMS={1:{t:'Rolling monthly',s:'easier to sign, a month’s notice',win:0.05},12:{t:'12 months',s:'the usual, 3 months’ notice at renewal',win:0},36:{t:'36 months',s:'harder to sign, locked in, buyers pay more for it',win:-0.1}};
const canLeave=c=>!c.term||c.term===1||S.day>=c.termEnd-63;
const noticeDay=c=>(!c.term||c.term===1)?S.day+DPM:Math.max(c.termEnd,S.day+DPM);
function termSeg(d){
  if(d.kind==='project')return '';const c=d.cid?C(d.cid):null;if(d.term==null)d.term=c&&c.term>1?c.term:12;const cur=d.term;
  return '<h3 style="font-size:.95rem;margin:14px 0 6px">Contract</h3><div class="seg">'+[1,12,36].map(t=>'<button data-act="term" data-v="'+t+'" aria-pressed="'+(cur===t)+'">'+TERMS[t].t+'<small>'+TERMS[t].s+'</small></button>').join('')+'</div>'+(c&&c.term>1?'<p class="mut" style="font-size:.8rem;margin-top:4px">They’re on '+c.term+' months to '+dLabel(c.termEnd)+'. Signing adds this to their contract. A longer term re-starts it; a shorter one leaves their current end date alone.</p>':'')+(ams().length&&d.kind!=='project'?'<p class="mut" style="font-size:.8rem;margin-top:4px">Commission if it’s won: about '+gbp(Math.round(commFor(d,(ui.modal&&ui.modal.pm)||1)))+', paid at month end.</p>':'');
}
ACT_EXT.term=v=>{const d=S.deals.find(z=>z.id===ui.modal.id);if(d)d.term=+v;};
const _winChance17=winChance;
winChance=function(d,pm){let p=_winChance17(d,pm);if(d.kind!=='project')p+=(TERMS[d.term||12]||TERMS[12]).win*(d.kind==='cross'?0.5:1);return clamp(p,0.05,0.85);};
const _finishDraft17=finishDraft;
finishDraft=function(d,am){if(d.term==null&&d.kind!=='project')d.term=hasT(am,'hunter')?1:12;_finishDraft17(d,am);};
const _afterWin17=afterWin;
afterWin=function(d,c,am){if(d.kind!=='project'&&c){const t=d.term||12,end=S.day+t*DPM;if(!(c.term>1&&c.termEnd>=end)){c.term=t;c.termEnd=end;}}
  if(d.replaces){const o=C(d.replaces);if(o&&o!==c){o.gone=true;S.clients=S.clients.filter(z=>z!==o);S.tickets=S.tickets.filter(t=>t.cid!==o.id);S.onb=S.onb.filter(z=>z.cid!==o.id);log(o.name+' is now part of '+c.name+'.','good');}}
  _afterWin17(d,c,am);};
function contractLine(c){
  const t=c.term||1;const due=t>1?dLabel(c.termEnd):'';
  return '<p class="mut" style="font-size:.84rem;margin:0 0 8px">Contract: <b>'+(t===1?'rolling monthly':t+' months, renews '+due)+'</b>'+(c.ending?' · <span class="neg">'+(c.why&&c.why!=='you'?'leaving':'you’ve given notice')+'</span>':c.notice==null?' · <button class="linkbtn" data-act="endClient">give notice to end it</button>':'')+'</p>';
}
ACT_EXT.endClient=()=>{const c=C(ui.modal.id);if(!c||c.notice!=null)return;c.ending=true;c.why='you';c.notice=noticeDay(c);S.co.rep=Math.max(5,S.co.rep-1);log('You’ve given '+c.name+' notice. They leave on '+dLabel(c.notice)+'.','event');};
function contractedShare(){const m=mrr();if(!m)return 0;return active().filter(c=>c.term>1&&c.termEnd-S.day>DPM*6).reduce((a,c)=>a+clientMRR(c),0)/m;}
const _newState17=newState;
newState=function(a,b){const r=_newState17(a,b);for(const c of S.clients){c.term=12;c.termEnd=ri(3,11)*DPM;}S.infl=1;return r;};
function respPct(){let ok=0,br=0;for(const d of S.sla.slice(-DPM)){ok+=d.rOk||0;br+=d.rBr||0;}return ok+br?ok/(ok+br):1;}

/* ---- daily ---- */
const _peopleDaily17=peopleDaily;
peopleDaily=function(W){_peopleDaily17(W);moraleDaily();
  for(const c of active()){if(c.term>1&&c.notice==null&&S.day>=c.termEnd){c.termEnd+=c.term*DPM;log(c.name+' renewed for another '+c.term+' months.','good');}}
};
