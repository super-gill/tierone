
/* ============ build 84: operating stance + people care (delegation foundation) ============
   The first brick of the delegation layer. You set an operating stance (the
   direction your managers and execs run to), and every managed team is actually
   looked after: its people's morale is tended toward a decent floor by their
   manager (or the COO). Unmanaged teams stay your job. Right-sizing, considered
   pay and departmental budgets build on this next. */

const STANCE={
  grow:{t:'Grow',d:'Hire ahead of demand and push for scale. Costs run hotter.',hire:1.12,care:1.0},
  steady:{t:'Steady',d:'Keep pace with demand, balanced on cost and growth.',hire:1.0,care:1.0},
  efficiency:{t:'Efficiency',d:'Run lean and sweat the team. Cheaper, but harder on morale.',hire:0.85,care:0.8}
};
function stance(){return (S.co&&STANCE[S.co.stance])?S.co.stance:'steady';}
ACT_EXT.stanceSet=v=>{if(STANCE[v]&&S.co){S.co.stance=v;log('Operating stance set to '+STANCE[v].t.toLowerCase()+'. Your managers and execs run to it.','event');}};

/* stance biases how eagerly the team hires: grow hires ahead of demand, efficiency waits */
if(typeof teamNeed==='function'){const _tn=teamNeed;teamNeed=function(){const N=_tn.apply(this,arguments);if(!N)return N;const h=STANCE[stance()].hire;if(h!==1){if(N.desk!=null)N.desk*=h;if(N.eng!=null)N.eng*=h;}return N;};}

/* which manager looks after a given team's people, with the COO as a company-wide backstop */
function teamManager(role){
  const map={desk:'hdm',am:'sm',sdm:'sm',bill:'bm'};
  const mk=map[role];
  if(mk&&typeof mgrOn==='function'){const m=mgrOn(mk);if(m)return m;}
  if(typeof exec==='function'&&exec('coo'))return {coo:true,skill:4,name:exec('coo').name};
  return null;
}
/* a managed team's people are looked after: morale held toward a floor set by the manager,
   softened under an Efficiency stance. Unmanaged teams get nothing here — that's the player's job. */
function peopleCareDaily(){
  const care=STANCE[stance()].care;
  for(const s of S.staff){
    if(s.id==='you'||s.left||!present(s)||s.role==='founder')continue;
    if(s.role==='eng')continue;                 // engineers are tended by the Technical Manager
    const m=teamManager(s.role);if(!m)continue;
    const skill=m.skill||3;
    const floor=Math.min(74,54+skill*4)*care;
    // a manager actively holds their people up: a proportional daily pull toward a decent floor
    if(s.morale<floor)s.morale=Math.min(floor,s.morale+(floor-s.morale)*(0.02+0.006*skill)*care);
  }
}
if(typeof peopleDaily==='function'){const _pd=peopleDaily;peopleDaily=function(W){_pd.apply(this,arguments);try{peopleCareDaily();}catch(e){}};}

/* the Direction (operating stance) control, at the top of the Strategy tab */
function stanceSec(){
  const cur=stance();const mgrs=(typeof mgrOn==='function')?['hdm','sm','tm','sdm','bm','pm'].filter(k=>mgrOn(k)).length:0;
  const coo=(typeof exec==='function')&&exec('coo');
  let h='<div class="sec"><h3>Direction</h3><p class="lede">Set the operating stance your managers and executives run to. It steers how hard they hire and how they look after the team, and it will drive budgets and right-sizing as we build those out. You can always take any decision back by hand.</p><div class="seg">'+
    Object.keys(STANCE).map(k=>'<button data-act="stanceSet" data-v="'+k+'" aria-pressed="'+(cur===k)+'">'+STANCE[k].t+'</button>').join('')+'</div>'+
    '<p class="mut" style="font-size:.8rem;margin-top:6px">'+esc(STANCE[cur].d)+'</p>'+
    '<p class="mut" style="font-size:.8rem;margin-top:4px">Running it: '+(coo?'your COO, across '+mgrs+' manager'+(mgrs===1?'':'s'):mgrs?mgrs+' manager'+(mgrs===1?'':'s')+' — teams without one are yours to run':'you, hands-on — hire managers to hand teams over')+'.</p></div>';
  return h;
}
if(typeof paneStrategy==='function'){const _ps=paneStrategy;paneStrategy=function(){return stanceSec()+_ps.apply(this,arguments);};}
