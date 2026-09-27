
/* ============ managers: targets, delegation, quarterly reviews ============ */
Object.assign(ROLES,{
  hdm:{t:'Helpdesk Manager',short:'Helpdesk manager',sal:[3500,4700],col:'--r-hdm',blurb:'Runs the desk for you. Hires analysts, books training and balances engineers within limits you set, against targets you agree each quarter.',mgr:true},
  sm:{t:'Sales Manager',short:'Sales manager',sal:[3700,5100],col:'--r-sm',blurb:'Runs the account managers. Signs off proposals, shares out clients and handles discounts within your limits, against quarterly sales targets.',mgr:true}
});
ROLE_ORDER.push('hdm','sm');
MODES.lead={t:'Leading',d:'Managers and strategy',tix:0,sales:0.3,mgmt:0.7};
Object.assign(TR,{
  sandbagger:{t:'Sandbagger',d:'Calls stretch targets unrealistic, so the bar stays low and they beat it.',q:'Every answer came with a caveat about “managing expectations”.'},
  overreacher:{t:'Overreacher',d:'Says everything is comfortable, then misses the hard ones.',q:'Promised to transform your numbers in the first quarter.'},
  straight:{t:'Straight talker',d:'Their read on a target is honest. When they say stretch, it is.',q:'Told you plainly which of your goals they thought were daft.'},
  driver:{t:'Driver',d:'Squeezes more out of the team on hard targets, and burns them out doing it.',q:'Talked about “no passengers” twice.'},
  protective:{t:'Protective',d:'Team morale holds up, but they ease off on hard targets.',q:'Spent most of the interview asking how you look after people.'}
});
const MGR_HONESTY=['sandbagger','overreacher','straight'];
const MGR_STYLE=['driver','protective','steady'];
const LV=['Hold','Stretch','Aggressive'];
const QD=DPM*3;
const isMgr=s=>s&&(s.role==='hdm'||s.role==='sm');
const mgrOf=r=>S.staff.find(s=>s.role===r&&!s.left);
const mgrOn=r=>{const m=mgrOf(r);return m&&present(m)?m:null;};
function mgrTraits(){const t=[pick(MGR_HONESTY)];if(Math.random()<0.5)t.push(pick(MGR_STYLE));return t;}
/* targets */
const TGT={
  hdm:{
    sla:{t:'SLA',fmt:v=>pct(v),hi:true,base:()=>qSla(true),val:(b,l)=>{const h=clamp(b,0.85,0.95);return Math.min(0.99,[h,h+0.03,h+0.06][l]);},now:()=>qSla()},
    csat:{t:'Client satisfaction',fmt:v=>Math.round(v)+'',hi:true,base:()=>csat(),val:(b,l)=>Math.min(95,[b,b+4,b+8][l]),now:()=>csat()},
    reopen:{t:'Reopened tickets',fmt:v=>pct(v),hi:false,base:()=>Math.max(0.03,qReopen(true)),val:(b,l)=>[b,b*0.7,b*0.4][l],now:()=>qReopen()},
    backlog:{t:'Backlog',fmt:v=>v.toFixed(1)+' days',hi:false,base:()=>Math.max(0.6,backlogDays()),val:(b,l)=>{const h=Math.max(b,1);return [h,h*0.7,h*0.5][l];},now:()=>backlogDays()},
    train:{t:'Knows the core stack',fmt:v=>pct(v),hi:true,base:()=>trainCover(),val:(b,l)=>{const h=Math.max(b,0.4);return Math.min(1,[h,h+0.2,h+0.4][l]);},now:()=>trainCover()}
  },
  sm:{
    newmrr:{t:'New monthly revenue sold',fmt:v=>gbp(v),hi:true,base:()=>Math.max(600,(S.qlast&&S.qlast.newmrr)||0),val:(b,l)=>Math.round([b,b*1.3,b*1.6][l]/50)*50,now:()=>S.qs.newmrr},
    cross:{t:'Cross-sells won',fmt:v=>Math.round(v)+'',hi:true,base:()=>Math.max(1,(S.qlast&&S.qlast.cross)||1),val:(b,l)=>Math.ceil([b,b*1.5,b*2][l]),now:()=>S.qs.cross},
    winrate:{t:'Win rate',fmt:v=>pct(v),hi:true,base:()=>Math.max(0.4,(S.qlast&&S.qlast.winrate)||0.45),val:(b,l)=>Math.min(0.85,[b,b+0.07,b+0.14][l]),now:()=>S.qs.won+S.qs.lost?S.qs.won/(S.qs.won+S.qs.lost):0},
    discount:{t:'Average discount',fmt:v=>v<0?'none, '+pct(-v)+' over list':pct(v),hi:false,base:()=>0.1,val:(b,l)=>[0.1,0.06,0.03][l],now:()=>S.qs.sent?S.qs.disc/S.qs.sent:0},
    growth:{t:'Book growth',fmt:v=>(v>=0?'+':'')+pct(v),hi:true,base:()=>0.02,val:(b,l)=>[0.02,0.06,0.1][l],now:()=>{const b0=S.qs.book0||0;const b=bookMRR();return b0?(b-b0)/b0:0;}}
  }
};
function qSla(base){if(base)return slaPct();const q=S.qs;return q.ok+q.br?q.ok/(q.ok+q.br):slaPct();}
function qReopen(base){if(base)return S.qlast&&S.qlast.reopenRate!=null?S.qlast.reopenRate:0.06;const q=S.qs;return q.closed?q.reopen/q.closed:0;}
function backlogDays(){const c=deskCapacity();return c>0?backlogHours()/c:0;}
function trainCover(){const ppl=staffOn().filter(s=>tech(s)&&s.id!=='you');const core=coreProds();if(!ppl.length||!core.length)return 1;return ppl.filter(s=>core.every(p=>fam(s,p)>=0.6)).length/ppl.length;}
function bookMRR(){return active().filter(c=>c.am).reduce((a,c)=>a+clientMRR(c),0);}
function newQuarterStats(){
  if(S.qs){const q=S.qs;S.qlast={newmrr:q.newmrr,cross:q.cross,winrate:q.won+q.lost?q.won/(q.won+q.lost):null,reopenRate:q.closed?q.reopen/q.closed:null};}
  S.qs={start:S.day,ok:0,br:0,closed:0,reopen:0,won:0,lost:0,newmrr:0,cross:0,disc:0,sent:0,book0:bookMRR(),seats0:svcUsers('support'),events:0,leavers:0};
}
/* how hard a target really is, and what the manager says */
function pressure(m){if(m.role==='hdm'){const cap=deskCapM();return cap?deskLoadM()/cap:1.5;}const n=S.staff.filter(s=>s.role==='am'&&!s.left).length;return n?1:1.3;}
function truth(m,lvl){return clamp(lvl+(pressure(m)>1.05?1:0),0,2);}
function readOf(m,lvl){const t=truth(m,lvl);if(hasT(m,'sandbagger'))return clamp(t+1,0,2);if(hasT(m,'overreacher'))return clamp(t-1,0,1);return t;}
const READ=['Comfortable','A stretch','Unrealistic'];
function effort(m){const tg=m.tg;if(!tg)return 0;return Math.max(...tg.items.map(i=>i.lvl));}
/* passive effects while a manager is present */
function mgrSpeed(st){
  const h=mgrOn('hdm');if(!h||!(st.role==='desk'||st.role==='eng'))return 1;
  const e=effort(h);let boost=0.03+0.01*h.skill+[0,0.04,0.08][e];
  if(hasT(h,'driver'))boost*=1.3;if(hasT(h,'protective'))boost*=0.6;
  if(S.co.mode==='lead')boost*=1.1;
  return 1+boost;
}
function mgrDaily(){
  const h=mgrOn('hdm'),sm=mgrOn('sm');
  if(h){
    const e=effort(h);let mc=[0,0.1,0.25][e];if(hasT(h,'driver'))mc*=1.5;if(hasT(h,'protective'))mc*=0.4;
    const L=h.lim||(h.lim={max:3,eng:2,cap:2600,train:1000,focus:true});
    const nEng=S.staff.filter(s=>s.role==='eng'&&!s.left).length;if(L.eng==null)L.eng=Math.max(1,nEng);
    // engineers where they're needed
    if(L.focus&&S.day%5===0){const bd=backlogDays();for(const s of S.staff)if(s.role==='eng'&&!s.left)s.focus=l2Days()>1.5?'desk':l2Days()<0.5&&(S.projects.length||S.onb.length)?'projects':'balanced';}
    // training within budget
    if(typeof mgrTrainRun!=='function'&&S.day%DPM===5&&(h.spent||0)<L.train){const core=coreProds();let best=null;for(const s of S.staff)if(present(s)&&(s.role==='desk'||s.role==='eng'))for(const p of core){const f=fam(s,p);if(f<0.6&&(!best||f<best.f))best={s,p,f};}
      if(best){const cost=courseCost(best.p);if((h.spent||0)+cost<=L.train){spend(cost);h.spent=(h.spent||0)+cost;best.s.away=S.day+1;best.s.course=best.s.away;best.s.fam[best.p]=Math.max(fam(best.s,best.p),0.85);log(h.name+' booked '+best.s.name+' on '+aN(PRODS[best.p].name)+' course.','info');}}}
    // hiring within limits
    const nDesk=S.staff.filter(s=>s.role==='desk'&&!s.left).length;
    const N=teamNeed();
    // second line first: analysts can't clear it, so more analysts won't help
    const eu=S.staff.filter(s=>s.role==='eng'&&present(s));const engBusy=eu.length&&eu.every(s=>(s.util||0)>0.95)&&projQueueDays()>15;
    h.hotE=N&&(N.eng>nEng+0.5||engBusy)?(h.hotE||0)+1:0;
    if(h.hotE>=5&&nEng<L.eng&&freeDesk()>=0&&S.co.cash>4000){const pool=cands('eng').board.filter(c=>c.salary<=L.cap+ENG_PREMIUM).sort((a,b)=>b.skill-a.skill);if(pool.length){const c=pool[0];hire(c);log(h.name+' hired '+c.name+' as an engineer to take second line and projects.','info');h.hotE=0;}}
    const dz=S.staff.filter(s=>s.role==='desk'&&present(s));const deskBusy=dz.length&&dz.reduce((a,s)=>a+(s.util||0),0)/dz.length>0.93;
    h.hot=(l1Days()>1||(N&&N.desk>nDesk+0.3)||deskBusy||respPct()<0.85)&&!(N&&N.desk<nDesk-0.5)?(h.hot||0)+1:0;
    if((h.hot>=5||h.hotE>=5)&&freeDesk()<0&&S.day-(h.deskMsg||-999)>30){h.deskMsg=S.day;log(h.name+' wants to hire but there’s no free desk. Time to think about a bigger office.','bad');}
    if(h.hot>=5&&nDesk<L.max&&freeDesk()>=0&&S.co.cash>2000){const pool=cands('desk').board.filter(c=>c.salary<=L.cap).sort((a,b)=>b.skill-a.skill);if(pool.length){const c=pool[0];hire(c);log(h.name+' hired '+c.name+' to help with the first-line backlog.','info');h.hot=0;}}
  }
  if(sm){
    const L=sm.lim||(sm.lim={disc:0.1,deal:1500,hire:0,assign:true});
    if(L.assign&&S.day%5===0){for(const c of active()){if(c.am)continue;const a=autoAssign(c);if(a)log(sm.name+' put '+c.name+' in '+a.name+'’s book.','info');}}
    const amsL=ams();
    if(L.hire>amsL.length&&amsL.length&&amsL.every(a=>amLoad(a)>=amCap(a)*0.9)&&freeDesk()>=0&&S.co.cash>3000&&S.day%10===0){const pool=cands('am').board.sort((a,b)=>b.skill-a.skill);if(pool.length){hire(pool[0]);log(sm.name+' hired '+pool[0].name+' as an account manager.','info');}}
  }
}
/* sales manager sign-off */
function smApproves(d,pm){
  const sm=mgrOn('sm');if(!sm)return false;const L=sm.lim||{disc:0.1,deal:1500};
  if(1-pm>L.disc+1e-6)return false;
  const v=d.kind==='project'?d.proj.value*pm/12:dealMRR(d,pm);
  return v<=L.deal;
}
function smSales(){const sm=mgrOn('sm');if(!sm)return 1;const e=effort(sm);return 1+0.04+0.01*sm.skill+[0,0.1,0.2][e]*(hasT(sm,'driver')?1.3:hasT(sm,'protective')?0.6:1);}
/* quarter end */
function quarterEnd(){
  for(const m of S.staff.filter(s=>isMgr(s)&&!s.left&&started(s))){
    if(m.tg&&S.day-m.tg.set>=DPM&&S.day-m.start>=42){
      const items=m.tg.items.map(i=>{const T=TGT[m.role][i.k];const now=T.now();const eps=Math.abs(i.val)*0.004+1e-9;const hit=T.hi?now>=i.val-eps:now<=i.val+eps;const close=T.hi?now>=i.val*0.93:now<=i.val*1.12;return Object.assign({},i,{now,res:hit?'hit':close?'close':'miss'});});
      const ctx=[];const q=S.qs;const seats=svcUsers('support');
      if(m.role==='hdm'){if(q.seats0&&seats>q.seats0*1.2)ctx.push('Supported users rose from '+q.seats0+' to '+seats+' this quarter.');if(q.leavers)ctx.push(q.leavers+' of the team left during the quarter.');}
      if(m.role==='sm'){const n=ams().length;if(!n)ctx.push('They had no account managers to lead.');}
      if(q.events)ctx.push(q.events+' outages and incidents landed this quarter.');
      m.hist=m.hist||[];m.hist.unshift({q:qLabel(),items});if(m.hist.length>8)m.hist.pop();
      S.mq.push({type:'review',sid:m.id,items,ctx});
    }
    S.mq.push({type:'targets',sid:m.id});
  }
  for(const m of S.staff)if(isMgr(m))m.spent=0;
  newQuarterStats();
}
const qLabel=()=>{const mi=monthOf(S.day)-1;return 'Q'+(Math.floor((mi%12)/3)+1)+' '+(START_Y+Math.floor(mi/12));};
function defaultTargets(m){
  const keys=m.role==='hdm'?['sla','backlog']:['newmrr','winrate'];
  m.tg={set:S.day,items:keys.map(k=>{const T=TGT[m.role][k];const b=T.base();return {k,lvl:0,base:b,val:T.val(b,0)};})};
}
function migrateMgrs(){
  S.mq=S.mq||[];if(!S.qs)newQuarterStats();
  for(const s of S.staff){if(isMgr(s)&&!s.tg)defaultTargets(s);if(isMgr(s)&&!s.lim)s.lim=s.role==='hdm'?{max:3,cap:2600,train:1000,focus:true}:{disc:0.1,deal:1500,hire:0,assign:true};}
}
/* UI */
function mgrBlock(s){
  if(!isMgr(s))return '';
  const T=TGT[s.role],L=s.lim||{};
  let h='<h3 style="font-size:.95rem;margin:14px 0 6px">This quarter’s targets</h3>';
  if(s.tg)h+='<table><thead><tr><th>Target</th><th class="r">Level</th><th class="r">Aim</th><th class="r">Now</th></tr></thead><tbody>'+s.tg.items.map(i=>{const t=T[i.k];const now=t.now();const ok=t.hi?now>=i.val:now<=i.val;return '<tr><td>'+t.t+'</td><td class="r">'+LV[i.lvl]+'</td><td class="r">'+t.fmt(i.val)+'</td><td class="r '+(ok?'pos':'wrn')+'">'+t.fmt(now)+'</td></tr>';}).join('')+'</tbody></table>';
  h+='<div class="row" style="margin-top:8px"><button class="btn sm" data-act="mgrTargets" data-v="'+s.id+'">Change targets</button></div>';
  h+='<h3 style="font-size:.95rem;margin:14px 0 6px">What they can do without you</h3>';
  const seg=(key,opts,fmt)=>'<div class="seg" style="margin-bottom:8px">'+opts.map(o=>'<button data-act="mgrLim" data-v="'+key+':'+o+'" aria-pressed="'+(String(L[key])===String(o))+'">'+fmt(o)+'</button>').join('')+'</div>';
  if(s.role==='hdm'){
    h+='<p class="lede" style="margin:0 0 4px">Service desk analysts they can have in total</p>'+seg('max',[1,2,3,5,8,12,20],o=>String(o));
    h+='<p class="lede" style="margin:0 0 4px">Engineers they can have in total</p>'+seg('eng',[0,1,2,3,5,8,12,20],o=>String(o));
    h+='<p class="lede" style="margin:0 0 4px">Highest salary they can offer (engineers get '+gbp(ENG_PREMIUM)+' more)</p>'+seg('cap',[2300,2600,2900],o=>gbp(o));
    h+='<p class="lede" style="margin:0 0 4px">Move engineers between desk and projects</p>'+seg('focus',[true,false],o=>o?'Yes':'No, I will');
  }else{
    h+='<p class="lede" style="margin:0 0 4px">Deepest discount they can sign off</p>'+seg('disc',[0,0.05,0.1,0.15,0.2],o=>o?pct(o):'None');
    h+='<p class="lede" style="margin:0 0 4px">Largest deal they can sign off (a month)</p>'+seg('deal',[500,1500,5000,20000],o=>gbp(o));
    h+='<p class="lede" style="margin:0 0 4px">Account managers they can have in total</p>'+seg('hire',[0,1,2,3,5],o=>o?String(o):'No hiring');
    h+='<p class="lede" style="margin:0 0 4px">Share out clients to account managers</p>'+seg('assign',[true,false],o=>o?'Yes':'No, I will');
  }
  if((s.hist||[]).length)h+='<h3 style="font-size:.95rem;margin:14px 0 6px">Past quarters</h3><ul class="list">'+s.hist.map(q=>'<li class="item"><span><b>'+q.q+'</b></span><span class="r">'+q.items.filter(i=>i.res==='hit').length+' of '+q.items.length+' hit</span><span class="sub">'+q.items.map(i=>TGT[s.role][i.k].t+' ('+LV[i.lvl].toLowerCase()+'): <span class="'+(i.res==='hit'?'pos':i.res==='close'?'wrn':'neg')+'">'+TGT[s.role][i.k].fmt(i.now)+'</span> vs '+TGT[s.role][i.k].fmt(i.val)).join(' · ')+'</span></li>').join('')+'</ul>';
  return h;
}
function mqModal(x){
  const q=S.mq[0];if(!q)return null;const m=ST(q.sid);if(!m){S.mq.shift();return null;}
  if(q.type==='review'){
    const hit=q.items.filter(i=>i.res==='hit').length;
    return '<div class="dialog"><p class="kick">Quarterly review · '+ROLES[m.role].t+'</p><h2>'+esc(m.name)+'</h2><p>'+hit+' of '+q.items.length+' targets hit.'+(m.pip?' They were on an improvement plan.':'')+'</p>'+
      '<table><thead><tr><th>Target</th><th class="r">Aim</th><th class="r">Result</th></tr></thead><tbody>'+q.items.map(i=>{const T=TGT[m.role][i.k];return '<tr><td>'+T.t+' <span class="mut">('+LV[i.lvl].toLowerCase()+', they said “'+READ[i.read!=null?i.read:0].toLowerCase()+'”)</span></td><td class="r">'+T.fmt(i.val)+'</td><td class="r '+(i.res==='hit'?'pos':i.res==='close'?'wrn':'neg')+'">'+T.fmt(i.now)+'</td></tr>';}).join('')+'</tbody></table>'+
      (q.ctx.length?'<p class="note">Worth knowing: '+q.ctx.map(esc).join(' ')+'</p>':'<p class="note">Nothing unusual happened this quarter. The results are theirs.</p>')+
      '<div class="choices">'+
      '<button class="choice" data-act="mRev" data-v="bonus"><b>Bonus · '+gbp(Math.round(m.salary*0.5/50)*50)+'</b><span>Morale and loyalty up. They’ll expect it again.</span></button>'+
      '<button class="choice" data-act="mRev" data-v="keep"><b>Keep going</b><span>No change.</span></button>'+
      '<button class="choice" data-act="mRev" data-v="pip"><b>Improvement plan</b><span>Next quarter’s targets are the test. Morale drops.</span></button>'+
      '<button class="choice" data-act="mRev" data-v="down"><b>Step them down</b><span>Back to '+(m.role==='hdm'?'the desk':'account management')+' on a lower salary. They may leave.</span></button>'+
      '<button class="choice" data-act="mRev" data-v="go"><b>Let them go</b><span>'+(exitCosts(m).probation?'Still in probation: a week’s pay, '+gbp(exitCosts(m).probationCost):'Settlement '+gbp(exitCosts(m).settle))+'. The team notices.</span></button></div></div>';
  }
  const T=TGT[m.role];const cur=(ui.tdraft&&ui.tdraft.sid===m.id)?ui.tdraft:(ui.tdraft={sid:m.id,sel:Object.fromEntries((m.tg?m.tg.items:[]).map(i=>[i.k,i.lvl]))});
  const chosen=Object.keys(cur.sel);
  return '<div class="dialog wide"><p class="kick">Targets for next quarter · '+ROLES[m.role].t+'</p><h2>'+esc(m.name)+'</h2><p>Pick two or three targets and how hard to push. '+esc(m.name.split(' ')[0])+' gives you their honest read, or what passes for it.</p>'+
    Object.keys(T).map(k=>{const t=T[k];const b=t.base();const on=k in cur.sel;const lvl=on?cur.sel[k]:0;
      return '<div class="plan"><div class="row" style="justify-content:space-between"><b>'+t.t+'</b><span class="mut" style="font-size:.8rem">now '+t.fmt(t.now())+'</span></div><div class="seg" style="margin-top:6px"><button data-act="tSet" data-v="'+k+':off" aria-pressed="'+(!on)+'">Not this quarter</button>'+
        [0,1,2].map(l=>'<button data-act="tSet" data-v="'+k+':'+l+'" aria-pressed="'+(on&&lvl===l)+'" '+(!on&&chosen.length>=3?'disabled':'')+'>'+LV[l]+' · '+t.fmt(t.val(b,l))+'<small>“'+READ[readOf(m,l)]+'”</small></button>').join('')+'</div></div>';}).join('')+
    '<div class="foot2"><span class="grow mut">'+chosen.length+' of 3 chosen</span><button class="btn primary" data-act="tGo" '+(chosen.length<1?'disabled':'')+'>Agree targets</button></div></div>';
}
const ACT_MGR={
  mgrTargets:v=>{S.mq.unshift({type:'targets',sid:v});ui.tdraft=null;ui.modal={type:'mq'};},
  mgrLim:v=>{const s=ST(ui.modal.id);if(!s)return;const [k,raw]=v.split(':');s.lim=s.lim||{};s.lim[k]=raw==='true'?true:raw==='false'?false:+raw;},
  tSet:v=>{const [k,l]=v.split(':');if(!ui.tdraft)return;if(l==='off')delete ui.tdraft.sel[k];else{if(!(k in ui.tdraft.sel)&&Object.keys(ui.tdraft.sel).length>=3)return;ui.tdraft.sel[k]=+l;}},
  tGo:()=>{const q=S.mq[0];const m=q&&ST(q.sid);if(m&&ui.tdraft){const T=TGT[m.role];m.tg={set:S.day,items:Object.entries(ui.tdraft.sel).map(([k,l])=>{const b=T[k].base();return {k,lvl:l,base:b,val:T[k].val(b,l),read:readOf(m,l)};})};log('Targets agreed with '+m.name+': '+m.tg.items.map(i=>(/^[A-Z]{2}/.test(T[i.k].t)?T[i.k].t:T[i.k].t.toLowerCase())+' ('+LV[i.lvl].toLowerCase()+')').join(', ')+'.','info');
      for(const i of m.tg.items){if(i.read!==truth(m,i.lvl)&&Math.random()<0.25){const t=MGR_HONESTY.find(z=>hasT(m,z));if(t)reveal(m,t);}}}
    S.mq.shift();ui.tdraft=null;ui.modal=null;nextModal();},
  mRev:v=>{const q=S.mq[0];const m=q&&ST(q.sid);if(m){const first=m.name.split(' ')[0];
    if(v==='bonus'){const b=Math.round(m.salary*0.5/50)*50;spend(b);m.morale=Math.min(100,m.morale+15);m.pip=false;note(m,q.items.filter(i=>i.res==='hit').length+' of '+q.items.length+' targets hit. Bonus paid.','good');log('You paid '+m.name+' a '+gbp(b)+' bonus.','good');}
    else if(v==='keep'){m.pip=false;note(m,q.items.filter(i=>i.res==='hit').length+' of '+q.items.length+' targets hit.',q.items.every(i=>i.res!=='miss')?'good':'bad');}
    else if(v==='pip'){m.pip=true;m.morale=Math.max(0,m.morale-12);note(m,'Put on an improvement plan.');log(m.name+' is on an improvement plan.','event');}
    else if(v==='down'){m.role=m.role==='hdm'?'desk':'am';m.salary=Math.round(m.salary*0.78/10)*10;m.morale=Math.max(0,m.morale-25);m.tg=null;m.pip=false;log('You stepped '+m.name+' down to '+ROLES[m.role].short.toLowerCase()+'.','event');if(Math.random()<0.35){m.leaveOn=S.day+10;log(first+' has handed in their notice.','bad');}S.mq=S.mq.filter(z=>z.sid!==m.id);S.mq.unshift(q);}
    else if(v==='go'){const X=exitCosts(m);spend(X.probation?X.probationCost:X.settle);noteExit(m);m.left=true;S.staff=S.staff.filter(z=>z!==m);log('You let '+m.name+' go.','bad');S.mq=S.mq.filter(z=>z.sid!==m.id);S.mq.unshift(q);}}
    S.mq.shift();ui.modal=null;nextModal();}
};
Object.assign(ACT_EXT,ACT_MGR);
MODAL_EXT.mq=(M,x)=>mqModal(x);

/* ============ manager requests: occasional, tied to real conditions ============ */
TR.builder={t:'Empire builder',d:'Always has a reason for more people and budget. Not always a good one.',q:'Asked how big the team could get before asking about the job.'};
MGR_STYLE.push('builder');
const STEP={max:[1,2,3,5,8,12,20],eng:[0,1,2,3,5,8,12,20],cap:[2300,2600,2900],train:[0,1000,2500,5000],deal:[500,1500,5000,20000]};
const nextStep=(k,v)=>{const a=STEP[k];const i=a.findIndex(x=>x>v);return i<0?null:a[i];};
function needs(m){
  const L=m.lim||{};const out=[];
  if(m.role==='hdm'){
    const bd=backlogDays();const ds=S.staff.filter(s=>(s.role==='desk'||s.role==='eng')&&present(s));const util=ds.length?ds.reduce((a,s)=>a+(s.util||0),0)/ds.length:0;
    const nDesk=S.staff.filter(s=>s.role==='desk'&&!s.left).length;
    const N=teamNeed();const nEng=S.staff.filter(s=>s.role==='eng'&&!s.left).length;
    if(N&&nextStep('eng',L.eng!=null?L.eng:nEng)!=null&&nEng>=(L.eng!=null?L.eng:nEng)){const stalled=S.projects.filter(p=>p.done<0.5&&S.day-p.start>10).length;out.push({type:'engineers',need:clamp((N.eng-nEng)/2+stalled*0.06+(l2Days()>2?0.2:0),0,1),facts:'Second line '+Math.round(tixSplit().l2)+'h queued ('+l2Days().toFixed(1)+' days) · '+stalled+' project'+(stalled===1?'':'s')+' not started · roughly '+N.eng.toFixed(1)+' engineers of work for '+nEng});}
    if(nextStep('max',L.max)!=null&&nDesk>=L.max&&!(N&&N.desk<nDesk))out.push({type:'headcount',need:clamp((l1Days()-0.8)/2+(util-0.9)*3+S.qs.leavers*0.15,0,1),facts:'First-line backlog '+l1Days().toFixed(1)+' days · desk utilisation '+pct(util)+' · '+nDesk+' of '+L.max+' analysts allowed'+(S.qs.leavers?' · '+S.qs.leavers+' left this quarter':'')});
    const board=cands('desk').board.concat(cands('desk').rec);const over=board.filter(c=>c.salary>L.cap).length/Math.max(1,board.length);
    if(nextStep('cap',L.cap)!=null)out.push({type:'salary',need:clamp((over-0.4)*1.6,0,1),facts:pct(over)+' of candidates this month want more than your '+gbp(L.cap)+' cap'});
    const tc=trainCover();
    if(nextStep('train',L.train)!=null)out.push({type:'training',need:clamp((0.8-tc)*1.5+((m.spent||0)>=L.train*0.8?0.2:0),0,1),facts:pct(tc)+' of the team know the core stack · '+gbp(m.spent||0)+' of '+gbp(L.train)+' training budget used'});
    const miss=[['rmm',svcUsers('support')>=25,0.8],['psa',staffOn().length>=3,0.7],['docs',staffOn().length>=4,0.5]].filter(([k,ok])=>ok&&!vendOn(k));
    if(miss.length){const [k,,n]=miss[0];out.push({type:'tool',tool:k,need:n,facts:VEND[k].name+' ('+VEND[k].kind+') isn’t in your stack'});}
  }else{
    const A=ams();const full=A.length&&A.every(a=>amLoad(a)>=amCap(a)*0.9);const un=active().filter(c=>!c.am).length;
    if((L.hire||0)<=A.length)out.push({type:'am',need:clamp((full?0.5:0)+un/8,0,1),facts:A.length+' account manager'+(A.length===1?'':'s')+(full?', every book over 90% full':'')+' · '+un+' client'+(un===1?'':'s')+' with nobody'});
    const q=S.qs;const wr=q.won+q.lost?q.won/(q.won+q.lost):null;
    if((L.disc||0)<0.2&&wr!=null&&q.won+q.lost>=3)out.push({type:'discount',need:clamp((0.45-wr)*3+q.lost/12,0,1),facts:'Win rate this quarter '+pct(wr)+' · '+q.lost+' lost'});
    const stuck=S.deals.filter(d=>d.stage==='open'&&d.draft&&!smApproves(d,d.draft.pm)).length;
    if(nextStep('deal',L.deal)!=null)out.push({type:'dealsize',need:clamp(stuck/3,0,1),facts:stuck+' proposal'+(stuck===1?'':'s')+' waiting on you because they’re over the sign-off limit'});
  }
  return out;
}
function askThreshold(m,type){
  let t=hasT(m,'straight')?0.6:hasT(m,'sandbagger')?0.4:hasT(m,'overreacher')?0.8:0.55;
  if(hasT(m,'builder'))t=0.15;
  if(hasT(m,'protective')&&(type==='training'||type==='headcount'))t-=0.1;
  if(hasT(m,'driver')&&type==='headcount')t+=0.15;
  return t;
}
function mgrRequests(){
  if(S.pending||S.hq.length)return;
  for(const m of S.staff){
    if(!isMgr(m)||!present(m)||S.day-m.start<DPM||S.day-(m.lastAsk||-999)<60)continue;
    const ns=needs(m).filter(n=>n.need>=askThreshold(m,n.type)).sort((a,b)=>b.need-a.need);
    if(!ns.length)continue;
    const n=ns[0];m.lastAsk=S.day;S.hq.push({id:'mgrAsk',ctx:{sid:m.id,type:n.type,need:n.need,facts:n.facts,tool:n.tool}});return;
  }
}
const ASK_TXT={
  headcount:{t:'wants another analyst',strong:'The backlog is getting away from us and the team is flat out. I need another analyst to keep SLAs.',weak:'The team feels stretched. Another pair of hands would give us some breathing room.'},
  engineers:{t:'wants another engineer',strong:'Second line is stuck behind one pair of hands and projects haven’t started. More analysts won’t fix that. I need an engineer.',weak:'An engineer would take pressure off the analysts and get projects moving.'},
  salary:{t:'wants a higher salary cap',strong:'Everyone worth hiring is asking above our cap. All I’m seeing are juniors.',weak:'I think we’d attract better people if we paid a bit more.'},
  training:{t:'wants a bigger training budget',strong:'Too many of the team still don’t know the core stack properly, and the budget’s nearly gone.',weak:'I’d like more budget for courses. Development is important for keeping people.'},
  tool:{t:'wants a new tool',strong:'We’re losing hours every week without it. It’ll pay for itself in desk time.',weak:'Every other MSP uses one. We should too.'},
  am:{t:'wants another account manager',strong:'Every book is full and clients are sitting with nobody looking after them.',weak:'One more account manager and I’d hit target easily.'},
  discount:{t:'wants more room on discounts',strong:'We’re losing deals on price. Give me a bit more room and I’ll close more.',weak:'Competitors are discounting. We should be able to match them.'},
  dealsize:{t:'wants to sign off bigger deals',strong:'Proposals are stuck waiting for you because they’re over my limit. It’s slowing us down.',weak:'It would speed things up if I could sign off bigger deals.'}
};
function askApply(m,x){
  const L=m.lim;let what='';
  if(x.type==='headcount'){L.max=nextStep('max',L.max)||L.max;what='can now have '+L.max+' analysts';}
  if(x.type==='engineers'){L.eng=nextStep('eng',L.eng||0)||L.eng;what='can now have '+L.eng+' engineers';}
  if(x.type==='salary'){L.cap=nextStep('cap',L.cap)||L.cap;what='can now offer up to '+gbp(L.cap);}
  if(x.type==='training'){L.train=nextStep('train',L.train)||L.train;what='has a '+gbp(L.train)+' training budget each quarter';}
  if(x.type==='tool'){S.vend[x.tool].on=true;what='gets '+VEND[x.tool].name;}
  if(x.type==='am'){L.hire=Math.max(L.hire||0,ams().length+1);what='can hire up to '+L.hire+' account managers';}
  if(x.type==='discount'){L.disc=Math.min(0.2,(L.disc||0)+0.05);what='can now sign off up to '+pct(L.disc)+' off';}
  if(x.type==='dealsize'){L.deal=nextStep('deal',L.deal)||L.deal;what='can now sign off deals up to '+gbp(L.deal)+' a month';}
  return what;
}
HUMAN.mgrAsk={w:0,ok:()=>false,make:x=>{
  const m=ST(x.sid);if(!m||!isMgr(m))throw 0;const A=ASK_TXT[x.type];const first=m.name.split(' ')[0];
  const tone=hasT(m,'sandbagger')?'strong':hasT(m,'overreacher')?(x.need>=0.8?'strong':'weak'):(x.need>=0.5?'strong':'weak');
  const strength=x.need>=0.65?'Strong':x.need>=0.4?'Reasonable':'Weak';
  const body='“'+A[tone]+'”'+(x.type==='tool'?' ('+VEND[x.tool].name+', '+gbp(Math.round(vendMonthly(x.tool)||VEND[x.tool].base))+'+ a month.)':'')+' What the numbers say: '+x.facts+'.'+(x.cased?' Having made their case properly, it looks '+strength.toLowerCase()+'.':'');
  const decline=()=>{const hit=hasT(m,'builder')?5:x.need>=0.6?8:3;m.morale=Math.max(0,m.morale-hit);note(m,'Asked for '+A.t.replace('wants ','')+'. You said no.',x.need>=0.6?'bad':'good');log('You turned down '+m.name+'’s request.','info');};
  const approve=()=>{const w=askApply(m,x);m.morale=Math.min(100,m.morale+5);note(m,'Asked for '+A.t.replace('wants ','')+'. You agreed.',x.need>=0.4?'good':'bad');log('You agreed: '+m.name+' '+w+'.','event');};
  const ch=[{label:'Approve it',note:'They get what they asked for.',go:approve},{label:'Say no',note:x.need>=0.6?'If they’re right, the problem stays yours.':'Some disappointment.',go:decline}];
  if(!x.cased)ch.splice(1,0,{label:'Ask them to make the case',note:'They come back with the detail. You may learn something about how they operate.',go(){if(Math.random()<0.5){const t=MGR_HONESTY.concat(['builder']).find(z=>hasT(m,z));if(t)reveal(m,t);}S.pending={id:'mgrAsk',ctx:Object.assign({},x,{cased:true})};}});
  return {kicker:'Request from your '+ROLES[m.role].short.toLowerCase(),title:first+' '+A.t,body,choices:ch};
}};
const _mgrDaily=mgrDaily;
mgrDaily=function(){_mgrDaily();if(S.day%5===2)mgrRequests();};
