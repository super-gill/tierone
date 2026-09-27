
/* ============ build 87: departmental budgets ============
   Each department runs to a monthly budget covering its payroll. It's the
   concrete guardrail the workforce brain checks against: pay won't push a team
   over its budget, and an over-budget team cools its hiring. Untouched, a budget
   tracks the team's payroll with headroom, so it never strangles normal play.
   Set one deliberately and it sticks and bites; hire a CFO and they allocate
   them all to your stance. */

const DEPTS=[
  {k:'desk',t:'Service desk',roles:['desk','hdm']},
  {k:'eng',t:'Engineering',roles:['eng','tm','pm']},
  {k:'sales',t:'Sales & accounts',roles:['am','sm','sdm']},
  {k:'back',t:'Back office',roles:['bill','bm']}
];
function roleTeam(role){for(const d of DEPTS)if(d.roles.includes(role))return d.k;return null;}
function teamPayroll(k){let t=0;for(const s of S.staff){if(s.left||!present(s)||s.id==='you')continue;if(roleTeam(s.role)===k)t+=s.salary*(1+ONCOST);}return Math.round(t);}
function deptHeadcount(k){return S.staff.filter(s=>!s.left&&present(s)&&roleTeam(s.role)===k).length;}
function stanceBudgetHeadroom(){return ({grow:1.22,steady:1.10,efficiency:1.02})[(typeof stance==='function')?stance():'steady']||1.10;}
function teamBudget(k){S.co.budgets=S.co.budgets||{};if(S.co.budgets[k]==null)S.co.budgets[k]=Math.round(teamPayroll(k)*stanceBudgetHeadroom()/100)*100;return S.co.budgets[k];}
/* does the team stay within budget with this much extra monthly cost? */
function budgetOK(k,extra){if(!k)return true;return teamPayroll(k)+(extra||0)<=teamBudget(k);}
function overBudget(k){return teamPayroll(k)>teamBudget(k)*1.02;}

/* the CFO allocates budgets to the stance; untouched budgets otherwise track payroll so they never block */
function budgetsMonthly(){
  if(S.day%DPM!==3)return;S.co.budgets=S.co.budgets||{};S.co.budgetSet=S.co.budgetSet||{};
  const cfo=(typeof exec==='function')&&exec('cfo');
  for(const d of DEPTS){const want=Math.round(teamPayroll(d.k)*stanceBudgetHeadroom()/100)*100;
    if(cfo){const cur=S.co.budgets[d.k]!=null?S.co.budgets[d.k]:want;S.co.budgets[d.k]=Math.round((cur*0.4+want*0.6)/100)*100;S.co.budgetSet[d.k]=false;}
    else if(!S.co.budgetSet[d.k])S.co.budgets[d.k]=want;
  }
}
if(typeof peopleDaily==='function'){const _pd=peopleDaily;peopleDaily=function(W){_pd.apply(this,arguments);try{budgetsMonthly();}catch(e){}};}

/* an over-budget team cools its hiring (on top of the stance bias) */
if(typeof teamNeed==='function'){const _tnb=teamNeed;teamNeed=function(){const N=_tnb.apply(this,arguments);if(!N)return N;
  if(N.desk!=null&&overBudget('desk'))N.desk*=0.7;
  if(N.eng!=null&&overBudget('eng'))N.eng*=0.7;
  return N;};}

ACT_EXT.budgetAdj=v=>{const [k,dd]=(v||'').split(':');if(!DEPTS.some(x=>x.k===k))return;S.co.budgets=S.co.budgets||{};S.co.budgetSet=S.co.budgetSet||{};
  const cur=teamBudget(k);S.co.budgets[k]=Math.max(0,Math.round(cur*(1+(+dd))/100)*100);S.co.budgetSet[k]=true;};

function budgetsSec(){
  const cfo=(typeof exec==='function')&&exec('cfo');
  let h='<div class="sec"><h3>Departmental budgets</h3><p class="lede">Each department runs to a monthly budget covering its payroll, and hiring and pay are checked against it. '+(cfo?'Your CFO allocates them to your stance — you set the direction, they divide the money.':'Set them here. Left alone they track payroll; set one and it holds. Hire a CFO and they take over allocating.')+'</p><ul class="list">';
  for(const d of DEPTS){const spend=teamPayroll(d.k);const bud=teamBudget(d.k);const pen=bud?clamp(spend/bud,0,1.3):0;const over=spend>bud;const setBy=(S.co.budgetSet||{})[d.k];
    h+='<li class="item" style="flex-direction:column;align-items:stretch;gap:4px">'+
      '<div class="row" style="justify-content:space-between"><span><b>'+d.t+'</b> <span class="mut">'+deptHeadcount(d.k)+' '+(deptHeadcount(d.k)===1?'person':'people')+'</span></span><span class="r '+(over?'neg':'')+'">'+gbp(spend)+' / '+gbp(bud)+'</span></div>'+
      '<div style="height:6px;border-radius:3px;background:var(--line);overflow:hidden"><div style="height:100%;width:'+Math.round(Math.min(1,pen)*100)+'%;background:var('+(over?'--bad':pen>0.9?'--wrn':'--good')+')"></div></div>'+
      (cfo?'<div class="mut" style="font-size:.76rem">Set by the CFO to your stance.</div>':'<div class="row" style="justify-content:space-between;align-items:center"><span class="mut" style="font-size:.76rem">'+(setBy?'You set this':'Tracking payroll')+'</span><span class="row" style="gap:6px"><button class="btn sm" data-act="budgetAdj" data-v="'+d.k+':-0.05">−5%</button><button class="btn sm" data-act="budgetAdj" data-v="'+d.k+':0.05">+5%</button></span></div>')+
      '</li>';}
  return h+'</ul></div>';
}
/* budgetsSec relocated to the Money tab (see zzr.js) */
