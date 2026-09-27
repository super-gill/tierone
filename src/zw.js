
/* ============ build 85: stance-driven right-sizing (trim & shrinkage) ============
   Teams no longer just grow and go stale. Under the operating stance, a managed
   team that's carrying more people than the work needs gets trimmed: attrition
   first (the hire logic already declines to backfill under a lean stance), then a
   managed redundancy when it's genuinely overstaffed. Grow never trims; Steady
   only when clearly over; Efficiency keeps the team tight. Redundancies cost
   severance and dent morale and reputation, so it's a real decision. */

function teamTargetCount(role){
  if(role==='am'){const a=S.staff.filter(s=>s.role==='am'&&!s.left);const capAvg=a.length?a.reduce((x,s)=>x+((typeof amCap==='function')?amCap(s):14),0)/a.length:14;return active().length/Math.max(1,capAvg);}
  const N=(typeof teamNeed==='function')?teamNeed():null;if(!N)return null;
  if(role==='desk')return N.desk;if(role==='eng')return N.eng;return null;
}
function rightSizeMonthly(){
  if(S.day%DPM!==11)return;                     // once a month
  const st=(typeof stance==='function')?stance():'steady';
  if(st!=='efficiency')return;                  // only an Efficiency stance actively makes redundancies; Grow and Steady rely on attrition
  S.co.rsAt=S.co.rsAt||{};S.noHire=S.noHire||{};
  for(const role of ['desk','eng','am']){
    const mgr=(typeof teamManager==='function')?teamManager(role):null;if(!mgr)continue;   // unmanaged: player's call
    const tgt=teamTargetCount(role);if(tgt==null)continue;
    const team=S.staff.filter(s=>s.role===role&&present(s));const n=team.length;
    if(n<=1)continue;                            // never cut a team to nothing here
    if(S.day-(S.co.rsAt[role]||-999)<DPM*2)continue;   // cooldown, no thrash
    if(S.noHire[role]>S.day)continue;            // already trimmed this role recently, let it settle
    const leaving=team.filter(s=>s.leaveOn!=null).length;
    const trimPool=team.filter(s=>s.leaveOn==null);if(!trimPool.length)continue;
    // attrition first: only make a redundancy if the team is over target even after those already leaving
    const over=(n-leaving)-(tgt+0.4);
    if(over<=0.4)continue;
    // let the weakest go: those on a performance process first, then lowest skill, then least busy
    const cand=trimPool.slice().sort((a,b)=>((a.proc?0:1)-(b.proc?0:1))||((a.skill||0)-(b.skill||0))||((a.util||0)-(b.util||0)))[0];
    if(!cand||cand.id==='you')continue;
    const sev=Math.round(cand.salary);
    cand.leaveOn=S.day+7;cand.why='redundancy';cand.redundant=true;
    S.co.cash-=sev;S.m.other=(S.m.other||0)+sev;S.co.rsAt[role]=S.day;S.noHire[role]=S.day+DPM*3;
    for(const s of team)if(s.id!==cand.id)s.morale=Math.max(0,s.morale-4);   // the team feels it
    S.co.rep=Math.max(0,(S.co.rep||50)-0.5);(S.exits=S.exits||[]).push(S.day);
    const who=mgr.coo?'Your COO':(mgr.name||'Your manager');
    log(who+' made '+cand.name+' redundant — the '+(ROLES[role]?ROLES[role].short.toLowerCase():role)+' team is carrying more than the work needs. '+gbp(sev)+' severance.','event');
  }
}
if(typeof peopleDaily==='function'){const _pd=peopleDaily;peopleDaily=function(W){_pd.apply(this,arguments);try{rightSizeMonthly();}catch(e){}};}
