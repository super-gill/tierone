
/* ============ build 88: meetings — the delegation feedback surface ============
   The layer where you see what your team decided and steer them. With managers
   but no execs, a weekly operations meeting; with a full C-suite, a monthly
   board-style exec meeting; with a mix, both. It reports what changed since you
   last met — headcount, morale, pay, budgets, who your managers hired or let go —
   and lets you set the direction from the same place. Reopenable on Strategy. */

const MGR_DEPT={hdm:'desk',sm:'sales',sdm:'sales',bm:'back',tm:'eng',pm:'eng'};

function mtgHasMgrs(){return typeof mgrOn==='function'&&ORG_MGR_ROLES.some(r=>mgrOn(r));}
function mtgHasExecs(){return typeof execAny==='function'&&execAny();}
/* board meeting once execs exist; otherwise a weekly ops meeting once you have managers; nothing while solo */
function mtgMode(){if(mtgHasExecs())return 'board';if(mtgHasMgrs())return 'ops';return null;}
function mtgInterval(mode){return mode==='board'?DPM:7;}

function mtgDeptSnapshot(){const o={};if(typeof DEPTS!=='undefined')for(const d of DEPTS)o[d.k]=(typeof deptHeadcount==='function')?deptHeadcount(d.k):0;return o;}
function deptMorale(k){let t=0,n=0;for(const s of S.staff){if(s.left||!present(s)||s.id==='you'||s.role==='founder')continue;if((typeof roleTeam==='function'?roleTeam(s.role):null)===k){t+=s.morale;n++;}}return n?Math.round(t/n):null;}

/* the shared digest: what has moved since you last met */
function mtgDigest(since,refHead){
  const staff=S.staff.filter(s=>!s.left&&present(s)&&s.id!=='you'&&s.role!=='founder');
  const head=staff.length;
  const mor=staff.length?Math.round(staff.reduce((a,s)=>a+s.morale,0)/staff.length):0;
  const atRisk=staff.filter(s=>s.morale<45).length;
  const underpaid=staff.filter(s=>{const mk=(typeof marketPay==='function')?marketPay(s):s.salary;return mk>0&&s.salary/mk<0.9;}).length;
  const raised=staff.filter(s=>(s.raise||-999)>=since).length;
  const redund=staff.filter(s=>s.why==='redundancy'&&s.leaveOn!=null).length;
  const leaving=staff.filter(s=>s.leaveOn!=null&&s.why!=='redundancy').length;
  const hires=(S.hireLog||[]).filter(h=>h.d>=since).length;
  const departs=(S.exits||[]).filter(d=>d>=since).length;
  const refTot=refHead?Object.values(refHead).reduce((a,b)=>a+b,0):head;
  const dHead=head-refTot;

  let h='<div class="tiles">'+
    '<div class="tile"><span class="k">People</span><span class="v">'+head+'</span><small>'+(dHead>0?'+'+dHead:dHead<0?dHead:'no change')+' since last meeting</small></div>'+
    '<div class="tile"><span class="k">Average morale</span><span class="v '+(mor>=60?'pos':mor>=45?'wrn':'neg')+'">'+mor+'</span><small>'+(atRisk?atRisk+' at risk of leaving':'nobody at risk')+'</small></div>'+
    '<div class="tile"><span class="k">Pay vs market</span><span class="v '+(underpaid?'wrn':'pos')+'">'+(underpaid?underpaid+' behind':'on the money')+'</span><small>'+(raised?raised+' brought up since':'no rises since')+'</small></div>'+
    '<div class="tile"><span class="k">Recurring profit</span><span class="v '+((typeof companyPL==='function'?companyPL().op:0)>=0?'pos':'neg')+'">'+gbp(Math.round(typeof companyPL==='function'?companyPL().op:0))+'</span><small>a month</small></div>'+
    '</div>';

  // what the managers actually did
  const did=[];
  if(hires)did.push(hires+' '+(hires===1?'person':'people')+' hired');
  if(redund)did.push(redund+' role'+(redund===1?'':'s')+' made redundant');
  if(departs&&departs>redund)did.push((departs-redund)+' left of their own accord');
  if(raised)did.push(raised+' pay'+(raised===1?' rise':' rises')+' toward the market');
  h+='<p style="margin-top:12px">'+(did.length?'Since you last met, your team '+joinList(did)+'.':'A quiet stretch. Your team held the line with no hires, exits or pay changes.')+(leaving?' <b class="wrn">'+leaving+' '+(leaving===1?'person is':'people are')+' currently working their notice.</b>':'')+'</p>';

  // budgets, if built
  if(typeof DEPTS!=='undefined'&&typeof overBudget==='function'){
    const over=DEPTS.filter(d=>overBudget(d.k));
    if(over.length)h+='<p class="note warn"><b>Over budget:</b> '+joinList(over.map(d=>d.t.toLowerCase()))+'. Hiring there is being held back until spend comes back in line, or you lift the budget.</p>';
  }
  return h;
}

function joinList(a){if(!a.length)return '';if(a.length===1)return a[0];return a.slice(0,-1).join(', ')+' and '+a[a.length-1];}

/* the direction control, inline, so you steer from the meeting */
function mtgDirection(){
  if(typeof STANCE==='undefined')return '';
  const cur=(typeof stance==='function')?stance():'steady';
  return '<h3 style="font-size:.98rem;margin:14px 0 6px">Set the direction</h3>'+
    '<div class="seg">'+Object.keys(STANCE).map(k=>'<button data-act="stanceSet" data-v="'+k+'" aria-pressed="'+(cur===k)+'">'+STANCE[k].t+'</button>').join('')+'</div>'+
    '<p class="mut" style="font-size:.8rem;margin-top:6px">'+esc(STANCE[cur].d)+'</p>';
}

function meetingHTML(withX){
  const mode=mtgMode();
  if(!mode)return '<div class="dialog"><button class="x" data-act="close" aria-label="Close">×</button><p class="kick">Meetings</p><h2>Nobody to meet yet</h2><p class="mut">Hire a manager or an executive and you’ll start holding regular meetings to review how they’re running things.</p></div>';
  const m=S.co.mtg||{};
  const since=(m.since!=null)?m.since:(S.day-mtgInterval(mode));
  const refHead=m.refHead||null;
  const x=withX?'<button class="x" data-act="close" aria-label="Close">×</button>':'';

  let h='<div class="dialog wide">'+x;
  if(mode==='board'){
    h+='<p class="kick">Board meeting · '+mLabel(monthOf(S.day))+'</p><h2>Monthly review with your executives</h2>';
    h+='<p>Your C-suite runs the company day to day. This is where they report and you set the direction and sign off the big calls.</p>';
  }else{
    h+='<p class="kick">Operations meeting · week '+(Math.floor(S.day/7)+1)+'</p><h2>Weekly review with your managers</h2>';
    h+='<p>Your managers run their teams to the direction you set. This is where you see what they did and steer them.</p>';
  }

  h+=mtgDigest(since,refHead);

  // who's round the table
  if(mode==='board'){
    h+='<h3 style="font-size:.98rem;margin:14px 0 6px">Your executives</h3><ul class="list">';
    for(const r of EXEC_ORDER){const e=exec(r);if(!e)continue;const R=EXEC_ROLE[r];
      h+='<li class="item" style="flex-direction:column;align-items:stretch;gap:2px"><div class="row" style="justify-content:space-between"><span>'+roleDot('founder')+'<b>'+esc(e.name)+'</b> <span class="mut">'+R.t+'</span></span><span class="r mut">'+gbp(e.sal)+'/mo</span></div><span class="sub">'+((typeof execEffectLine==='function')?execEffectLine(r):'')+'</span></li>';
    }
    h+='</ul>';
    if(typeof isPublic==='function'&&isPublic()&&S.co.ipo){const io=S.co.ipo;
      {const left=(typeof OUST_STRIKES!=='undefined'?OUST_STRIKES:4)-(io.misses||0);const near=io.misses>=1;
       h+='<p class="note'+(near?' warn':'')+'"><b>The board:</b> market cap '+gbp(marketCap())+' against a '+gbp(io.target)+' target'+(near?', and you’re '+left+' bad quarter'+(left===1?'':'s')+' from being removed':', in good standing')+'. The full quarterly report is on the Strategy tab.</p>';}
    }
  }else{
    h+='<h3 style="font-size:.98rem;margin:14px 0 6px">Your managers</h3><ul class="list">';
    let any=false;
    for(const mk of ORG_MGR_ROLES){const mg=mgrOn(mk);if(!mg)continue;any=true;const dept=MGR_DEPT[mk];const dm=deptMorale(dept);
      h+='<li class="item"><span>'+roleDot(mg.role)+'<b>'+esc(mg.name)+'</b> <span class="mut">'+ROLES[mg.role].short+'</span></span><span class="r">'+dots(mg.skill)+'</span><span class="sub">'+(dm!=null?'team morale '+dm:'no team yet')+' · morale '+Math.round(mg.morale)+'</span></li>';
    }
    if(!any)h+='<li class="item"><span class="mut">No managers in post.</span></li>';
    h+='</ul>';
    if(typeof exec==='function'&&exec('coo'))h+='<p class="mut" style="font-size:.82rem">Your COO oversees the managers and runs teams that have none.</p>';
  }

  h+=mtgDirection();

  h+='<div class="foot2"><button class="btn" data-act="mtgStrategy">Open Strategy</button><span class="grow"></span><button class="btn primary" data-act="close">Noted</button></div></div>';
  return h;
}

if(typeof MODAL_EXT!=='undefined')MODAL_EXT.meeting=(M,x)=>meetingHTML(true);
ACT_EXT.meetingOpen=()=>{if(mtgMode())ui.modal={type:'meeting'};};
ACT_EXT.mtgStrategy=()=>{ui.tab='strategy';ui.subtab=ui.subtab||{};if(typeof groupOf==='function')ui.subtab[groupOf('strategy').k]='strategy';ui.modal=null;};

/* hold the meeting on its cadence, once nothing more urgent is queued */
if(typeof nextModal==='function'){const _nm=nextModal;nextModal=function(){_nm.apply(this,arguments);
  if(ui.modal||!S||S.intro||S.over)return;
  const mode=mtgMode();if(!mode)return;
  S.co.mtg=S.co.mtg||{};const m=S.co.mtg;
  const iv=mtgInterval(mode);
  if(m.lastHeld==null){m.lastHeld=S.day;m.since=S.day-iv;m.refHead=mtgDeptSnapshot();return;}   // don't ambush on the first tick after hiring
  if(S.day-m.lastHeld<iv)return;
  m.since=m.lastHeld;m.lastHeld=S.day;                 // window is from the last meeting to now
  ui.modal={type:'meeting'};
  // snapshot for the next meeting's deltas, taken as this one opens
  m.refHead=mtgDeptSnapshot();
};}

/* a reopenable Meetings section on the Strategy tab */
function meetingsSec(){
  const mode=mtgMode();if(!mode)return '';
  let h='<div class="sec"><h3>Meetings</h3><p class="lede">'+(mode==='board'?'Every month you meet your executives to review how the company is being run and set the direction. ':'Every week you meet your managers to review how the teams are being run and set the direction. ')+'Reopen the latest review here any time.</p>';
  h+='<div class="row"><button class="btn" data-act="meetingOpen">Open the '+(mode==='board'?'board':'operations')+' meeting</button></div></div>';
  return h;
}
/* meetingsSec relocated to the Ownership tab (see zzr.js) */

