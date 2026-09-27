
/* ============ build 86: considered pay ============
   Managed teams keep their people's pay near the market rate, so it stops
   quietly falling behind and driving resignations. But it's a considered call,
   not a blanket rise: only underpaid people, never above market, capped per
   step, gated by the stance and whether the company can afford it. Grow pays up
   to retain talent; Steady holds pay at market; Efficiency freezes it and only
   fixes pay severe enough to lose someone. Unmanaged teams stay the player's job. */

/* who looks after a person's pay: their line manager, or the COO as backstop */
function payMgr(role){
  const map={desk:'hdm',eng:'tm',am:'sm',sdm:'sm',bill:'bm',pm:'tm'};
  const mk=map[role];
  if(mk&&typeof mgrOn==='function'&&mgrOn(mk))return mgrOn(mk);
  if(typeof exec==='function'&&exec('coo'))return {coo:true,name:exec('coo').name};
  return null;
}
function payManagedMonthly(){
  if(S.day%DPM!==17)return;                       // once a month, its own day
  const st=(typeof stance==='function')?stance():'steady';
  const P=(typeof companyPL==='function')?companyPL():{op:0};
  const profitable=(P.op||0)>0;
  const cfg=({grow:{trig:0.99,to:1.0,needProfit:false},steady:{trig:0.96,to:0.99,needProfit:false},efficiency:{trig:0.9,to:0.95,needProfit:true}})[st];
  for(const s of S.staff){
    if(s.id==='you'||s.left||!present(s)||s.role==='founder')continue;
    const m=payMgr(s.role);if(!m)continue;         // unmanaged: player's call
    if((s.raise||-999)+DPM*6>S.day)continue;       // not too often per person
    const mkt=(typeof marketPay==='function')?marketPay(s):s.salary;if(!mkt||mkt<=0)continue;
    const ratio=s.salary/mkt;
    if(ratio>=cfg.trig)continue;                   // already near or above market
    const atRisk=s.morale<45||ratio<0.85;          // about to walk
    if(cfg.needProfit&&!profitable&&!atRisk)continue;   // Efficiency: only act if we can afford it, unless we're losing them
    if(!profitable&&!atRisk&&st!=='grow')continue;      // don't raise into a loss unless retaining someone
    const target=Math.min(mkt*cfg.to,mkt);         // never above market
    const newSal=Math.round(Math.min(target,s.salary*1.08)/10)*10;   // move toward market, at most +8% a step
    if(newSal<=s.salary)continue;
    // keep the team within its budget, unless we're about to lose someone
    if(typeof budgetOK==='function'&&typeof roleTeam==='function'&&!atRisk){const extra=(newSal-s.salary)*(1+ONCOST);if(!budgetOK(roleTeam(s.role),extra))continue;}
    s.salary=newSal;s.raise=S.day;s.morale=Math.min(100,s.morale+5);
    const who=m.coo?'Your COO':(m.name?m.name.split(' ')[0]:'A manager');
    log(who+' brought '+s.name+'’s pay closer to the market rate, to '+gbp(newSal)+' a month.','info');
  }
}
if(typeof peopleDaily==='function'){const _pd=peopleDaily;peopleDaily=function(W){_pd.apply(this,arguments);try{payManagedMonthly();}catch(e){}};}
