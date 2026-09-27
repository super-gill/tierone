
/* ============ build 73: managers and C-suite that actually take over ============
   - Projects Manager: schedules projects to a policy you set, and runs onboarding
     (auto-plans, keeps jobs on time, sees them live) so nothing waits on you.
   - Technical Manager: real engineering leadership — faster second line, fewer
     reopens, mentoring that grows engineers, tighter project delivery.
   - C-suite: each executive makes the final call in their domain, replacing you
     for the decisions they own once they're hired. */

/* ---------- Projects Manager ---------- */
function pmOn(){return (typeof hasPM==='function')&&hasPM();}
function projPolicy(){return S.co.projPolicy||'deadline';}
function onbPolicy(){return S.co.onbPolicy||'recommended';}
const PROJ_POL={
  deadline:{t:'Hit every deadline',d:'Work the projects closest to their due date first.'},
  margin:{t:'Protect margin',d:'Work the most profitable projects first.'},
  risk:{t:'Rescue clients',d:'Put the least happy clients’ work first.'}
};
const ONB_POL={
  recommended:{t:'Recommended',d:'Align kit where it pays back, keep the rest.'},
  align:{t:'Align to my stack',d:'Move every client onto your standard tools.'},
  asis:{t:'Keep their kit',d:'Support what they already run; cheapest to start.'}
};
/* project work order: default is by deadline; a PM applies your policy */
function projOrder(a,b){
  if(!pmOn())return a.due-b.due;
  const pol=projPolicy();
  if(pol==='margin')return (b.value-(b.cost||0))-(a.value-(a.cost||0));
  if(pol==='risk'){const ca=C(a.cid),cb=C(b.cid);return (ca?ca.sat:100)-(cb?cb.sat:100);}
  return a.due-b.due;
}
/* a PM (or a COO, if there's no PM) plans onboarding the moment discovery ends,
   so it never sits waiting for your decision */
if(typeof discoveryDone==='function'){
  const _dd=discoveryDone;
  discoveryDone=function(o){_dd(o);
    if(o&&o.stage==='plan'&&o.plan&&(pmOn()||(typeof exec==='function'&&exec('coo')))){
      const c=C(o.cid);const pol=onbPolicy();
      for(const cat in o.plan){
        if(pol==='align'){const E=(typeof kitEconomics==='function')?kitEconomics(c,cat):{};o.plan[cat]=E.locked?'renewal':(E.bl?'asis':'align');}
        else if(pol==='asis'){const E=(typeof kitEconomics==='function')?kitEconomics(c,cat):{};o.plan[cat]=E.locked?'renewal':'asis';}
        // 'recommended' keeps what recommend() already chose
      }
      confirmPlan(o);
      log((pmOn()?'Your projects manager':'Your COO')+' set '+(c?c.name:'the')+'’s onboarding plan and started delivery.','info');
    }
  };
}

/* ---------- Technical Manager: engineering leadership ---------- */
function theTM(){return S.staff.find(s=>s.role==='tm'&&present(s));}
function tmPow(){const m=theTM();return m?clamp(0.5+0.1*(m.skill||2),0.5,1):0;}
/* faster second line and project work under a technical manager */
if(typeof speedOf==='function'){const _so=speedOf;speedOf=function(st){let v=_so(st);if(st&&st.role==='eng'&&theTM())v*=1+0.10*tmPow();return v;};}
/* projects slip less (engineers get more done per hour) */
if(typeof projMult==='function'){const _pm=projMult;projMult=function(s){let v=_pm(s);if(theTM())v=Math.min(1.05,v*(1+0.08*tmPow()));return v;};}

/* ---------- C-suite: final decisions in their area ---------- */
/* which executive owns which decision */
const EVENT_EXEC={
  ransomware:'cto',carrier:'cto',hike:'cto',cyberEss:'cto',breach:'cto',incident:'cto',
  msft:'cfo',acquired:'cfo',
  poach:'coo',burnout:'coo',resign:'coo',rival:'coo',mgrAsk:'coo'
};
function execChoiceIdx(id,e,ctx){
  const n=e.choices.length;let i=0;
  switch(id){
    case 'ransomware':i=S.co.cash>20000?1:0;break;   // recover free when you can afford to
    case 'carrier':i=0;break;                          // ring every client, halve the damage
    case 'hike':i=1;break;                             // push back on the vendor
    case 'cyberEss':i=0;break;                         // get certified
    case 'breach':i=0;break;                           // disclose; never bury it
    case 'incident':i=0;break;                         // report it properly
    case 'msft':i=0;break;                             // pass the rise on, protect margin
    case 'acquired':i=1;break;                         // hand over gracefully
    case 'poach':i=S.co.cash>15000?0:n-1;break;        // match if affordable, else let go
    case 'burnout':i=0;break;                          // give them time off
    case 'resign':i=S.co.cash>15000?0:1;break;         // counter, or talk it through
    case 'rival':i=0;break;                            // match the price to keep them
    case 'mgrAsk':i=(ctx&&ctx.need>=0.4)?0:n-1;break;  // approve reasonable asks
    default:i=0;
  }
  return Math.max(0,Math.min(n-1,i));
}
function execResolvePending(){
  if(!S||V._execBusy)return;let guard=0;
  while(S.pending&&EVENT_EXEC[S.pending.id]&&typeof exec==='function'&&exec(EVENT_EXEC[S.pending.id])&&guard++<6){
    const id=S.pending.id,ctx=S.pending.ctx,role=EVENT_EXEC[id];
    V._execBusy=true;
    let e=null;try{e=pendingEvent();}catch(_){e=null;}
    if(!e||!e.choices||!e.choices.length){V._execBusy=false;break;}
    const idx=execChoiceIdx(id,e,ctx);
    S.pending=null;
    try{e.choices[idx].go();}catch(_){}
    const R=EXEC_ROLE[role],nm=(exec(role)||{}).name||R.t;
    log(nm+' ('+R.t+') handled it — '+e.title+': '+e.choices[idx].label+'.','info');
    V._execBusy=false;
  }
}
if(typeof nextModal==='function'){const _nm=nextModal;nextModal=function(){execResolvePending();return _nm.apply(this,arguments);};}

/* COO signs off proposals of any size once hired (you set the managers' limits;
   the COO is the backstop above them) */
if(typeof finishDraft==='function'){
  const _fd=finishDraft;
  finishDraft=function(d,am){
    if(typeof exec==='function'&&exec('coo')){
      const bl=blockers(d);
      if(!bl.length){const pm=amPick(d,am);if(d.term==null&&d.kind!=='project')d.term=hasT(am,'hunter')?1:12;d.draft={by:am.id,pm,blocked:''};d.by=am.id;sendDeal(d,pm);
        const sm=(typeof mgrOn==='function')&&mgrOn('sm');
        log((sm?sm.name+' signed off':'Your COO cleared')+' '+am.name+'’s proposal for '+dealName(d)+(pm<1?' at '+pct(1-pm)+' off':'')+'.','info');return;}
    }
    return _fd(d,am);
  };
}

/* daily operations the C-suite handles for you */
if(typeof peopleDaily==='function'){
  const _pd=peopleDaily;
  peopleDaily=function(W){
    _pd(W);
    // technical manager mentoring: engineers grow and hold morale
    if(theTM()){const pw=tmPow();for(const s of S.staff)if(s.role==='eng'&&present(s)){s.xp=(s.xp||0)+0.006*pw;if(s.xp>=1&&s.skill<5){s.xp-=1;s.skill++;s.skillAt=S.day;log(s.name+' has grown under your technical manager to level '+s.skill+'.','good');}if(s.morale<70)s.morale=Math.min(70,s.morale+0.15*pw);}}
    execDailyOps();
  };
}
function execDailyOps(){
  if(typeof exec!=='function')return;
  // COO clears the manager quarterly queue (targets and reviews)
  if(exec('coo')&&S.mq&&S.mq.length){let n=0;for(const q of S.mq.slice()){const m=ST(q.sid);if(m&&q.type==='targets'&&typeof defaultTargets==='function')defaultTargets(m);if(m&&q.type==='review')m.pip=false;n++;}S.mq=[];if(n)log('Your COO agreed targets and reviews with the managers.','info');}
  // CFO steadies cash: draws down before an overdraft bust, repays when flush
  if(exec('cfo')&&S.day-(S.co.cfoActedAt||-999)>=4){
    if(S.co.cash<-OD_LIMIT*0.5&&S.co.loan+5000<=loanLimit()){S.co.loan+=5000;S.co.cash+=5000;S.co.cfoActedAt=S.day;log('Your CFO drew £5,000 from the facility to steady cash.','info');}
    else if(S.co.cash>burn()*3&&S.co.loan>=5000){S.co.loan-=5000;S.co.cash-=5000;S.co.cfoActedAt=S.day;log('Your CFO repaid £5,000 of the loan.','info');}
  }
}

/* ---------- Projects Manager controls on the Projects tab ---------- */
ACT_EXT.projPol=v=>{if(PROJ_POL[v])S.co.projPolicy=v;};
ACT_EXT.onbPol=v=>{if(ONB_POL[v])S.co.onbPolicy=v;};
if(typeof paneProjects==='function'){
  const _pp=paneProjects;
  paneProjects=function(){
    let h='';
    if(pmOn()){const pp=projPolicy(),op=onbPolicy();
      h+='<div class="sec"><h3>Projects manager</h3><p class="lede">Your projects manager schedules delivery and runs onboarding to the policy you set here, then keeps jobs on time without waiting on you.</p>'+
        '<p class="mut" style="font-size:.82rem;margin:0 0 4px">Project priority</p><div class="seg">'+Object.entries(PROJ_POL).map(([k,v])=>'<button data-act="projPol" data-v="'+k+'" aria-pressed="'+(pp===k)+'">'+v.t+'</button>').join('')+'</div>'+
        '<p class="mut" style="font-size:.82rem;margin:10px 0 4px">Onboarding approach</p><div class="seg">'+Object.entries(ONB_POL).map(([k,v])=>'<button data-act="onbPol" data-v="'+k+'" aria-pressed="'+(op===k)+'">'+v.t+'</button>').join('')+'</div>'+
        '<p class="mut" style="font-size:.78rem;margin-top:6px">'+esc(PROJ_POL[pp].d)+' '+esc(ONB_POL[op].d)+'</p></div>';
    }
    return h+_pp.apply(this,arguments);
  };
}
