
/* ============ build 43: rival relations, phase 3 ============ */
/* Deeper ties between firms: formal alliances, illegal price-fixing cartels,
   betrayal with a reputation that follows you, and a mole for ongoing spying.
   Fictional firms, and the design point stands: the dirtiest moves pay now and
   cost later. */
function ally(r){return !!(r&&r.deals&&r.deals.alliance);}
function allies(){return rivals().filter(ally);}
function cartel(){return S.co.cartel;}
function cartelIds(){const c=cartel();return c&&c.members?c.members:[];}
function inCartel(r){return r&&cartelIds().includes(r.id);}
function cartelSize(){return cartelIds().length;}
function cartelPow(){return clamp(cartelSize()/3,0,1);}
function betrayer(){return S.co.betrayer>S.day;}
function moleOn(r){return r&&S.co.moles&&S.co.moles[r.id];}

/* willingness by character: honourable firms won't fix prices or betray */
function willCartel(r){return r.pers!=='honourable'&&(r.stance>=20||inCartel(r))&&r.tier>=Math.max(1,sizeTier()-1);}
function willAlly(r){const need=r.pers==='predatory'?70:r.pers==='opportunist'?58:50;return r.stance>=need&&r.trust>=(r.pers==='predatory'?70:60)&&!betrayer();}

/* ---------- alliance: a deep, above-board partnership ---------- */
RACTS.alliance={t:'Propose a formal alliance',kind:'fair',d:'A deep partnership: you refer to each other, cover overflow, don’t poach, share intel and warn each other of predators. It unlocks going after big contracts together. Betraying it is remembered across the whole market.',
  ok:r=>ally(r)?'Allied.':r.tier===0?'Too small to be a real partner.':!willAlly(r)?(betrayer()?'Your reputation for betrayal precedes you.':'They need to be Allied and trust you first (keep meeting and dealing straight).'):'',
  go:r=>{r.deals.alliance=S.day;r.deals.refer=S.day;r.deals.overflow=S.day;r.deals.nopoach=S.day;shift(r,12,12);r.allyFloor=1;remember(r,'You formed a formal alliance.');log('You and '+r.name+' are formal allies now. You’ll refer to each other, cover overflow, leave each other’s staff alone, and can go after big contracts together.','good');},
  end:r=>{delete r.deals.alliance;delete r.deals.refer;delete r.deals.overflow;delete r.deals.nopoach;r.allyFloor=0;shift(r,-15,-12);remember(r,'The alliance ended amicably.');log('Your alliance with '+r.name+' has ended. No hard feelings, but no more favours.','event');}};

/* ---------- betrayal: turn on an ally for a quick win ---------- */
RACTS.betray={t:'Betray them',kind:'hard',d:'Use an ally’s trust against them: take a run of their clients and staff at once. A big grab now, but they turn hostile, and every other firm hears you can’t be trusted.',
  ok:r=>!ally(r)&&!inCartel(r)?'Only worth it against an ally or cartel partner.':'',
  go:r=>{const took=Math.min(8,Math.max(3,Math.round(r.clients*0.14)));r.clients=Math.max(1,r.clients-took);
    for(let i=0;i<took;i++){const d=addProspect({note:'A '+r.name+' client, brought over when the alliance broke.'});if(d){d.from=r.id;d.warm=1;d.bidders=[];}}
    if(r.tier>=1&&freeDesk()>=0){const c=genCand(Math.random()<0.5?'eng':'am','rec');c.skill=Math.max(4,c.skill);c.from=r.id;cands(c.role);S.cands[c.role].rec.unshift(c);}
    delete r.deals.alliance;delete r.deals.refer;delete r.deals.overflow;delete r.deals.nopoach;
    if(inCartel(r))S.co.cartel.members=cartelIds().filter(x=>x!==r.id);
    r.stance=-70;r.trust=0;r.target=S.day+DPM*ri(3,5);r.allyFloor=0;
    // word gets around: every other firm trusts you less, and alliances close to you for a while
    for(const o of rivals())if(o!==r){shift(o,-6,-12);}
    S.co.betrayer=S.day+YEAR;S.co.rep=Math.max(5,S.co.rep-6);
    remember(r,'You betrayed the alliance and raided them.');
    log('You turned on '+r.name+': '+took+' of their clients are coming to you. They’re out for blood, and the market has noticed you’ll betray a partner.','event');}};

/* ---------- cartel: illegal price-fixing ---------- */
ACT_EXT.cartelInvite=id=>{const r=rivalById(id);if(!r||inCartel(r))return;
  if(!willCartel(r)){toast&&toast(r.pers==='honourable'?r.name+' won’t touch price-fixing.':r.name+' isn’t interested right now.');shift(r,-2,0);return;}
  S.co.cartel=S.co.cartel||{since:S.day,members:[]};if(!S.co.cartel.members.includes(id))S.co.cartel.members.push(id);
  shift(r,5,3);remember(r,'They joined your pricing arrangement.');addHeat(6,'Price-fixing arrangement with '+r.name,1);
  log(r.name+' has joined a quiet understanding not to undercut each other. Prices hold up, margins improve, and it is very much illegal.','event');};
ACT_EXT.cartelDrop=id=>{const r=rivalById(id);if(!inCartel(r))return;S.co.cartel.members=cartelIds().filter(x=>x!==id);
  shift(r,-4,-2);remember(r,'You dropped them from the arrangement.');if(!cartelSize())S.co.cartel=null;log('You dropped '+r.name+' from the pricing arrangement.','info');};
ACT_EXT.cartelLeave=()=>{if(!cartel())return;for(const id of cartelIds()){const r=rivalById(id);if(r){shift(r,-3,-2);}}S.co.cartel=null;log('You wound up the pricing arrangement. Back to competing on price.','info');};

/* ---------- mole: an ongoing inside source ---------- */
ACT_EXT.moleStart=id=>{const r=rivalById(id);if(!r||moleOn(r))return;if(r.tier<1){toast&&toast('Too small to bother planting a source.');return;}
  const fee=Math.round(rnd(1500,3000)/100)*100;S.co.moles=S.co.moles||{};S.co.moles[r.id]={since:S.day,fee};
  r.intel=3;r.leaked=S.day+YEAR*3;markKnows(insider());addHeat(10,'Planted a source inside '+r.name,1);
  log('You’ve a source inside '+r.name+' now. £'+fee+' a month keeps their pricing and plans on your desk. Bribery and data theft, if it ever comes out.','event');};
ACT_EXT.moleStop=id=>{const r=rivalById(id);if(!moleOn(r))return;delete S.co.moles[r.id];log('You’ve cut your source inside '+(r?r.name:'that firm')+' loose.','info');};

/* ---------- effects ---------- */
/* cartel: members don't undercut you, so high prices lose fewer deals */
const _wc_ze=winChance;winChance=function(d,pm){let p=_wc_ze(d,pm);
  if(cartelSize()>=1){const cr=(typeof catRatio==='function')?catRatio(d):1;if(cr>1)p+=Math.min(0.14,(cr-1)*0.6)*cartelPow();}
  return clamp(p,0.03,0.95);};
/* joint reach: an ally a size up lets you land the occasional big client together */
function jointDaily(){if(S.day%DPM!==11)return;const big=allies().filter(a=>a.tier>=sizeTier()+1||a.tier>=2);if(!big.length)return;
  if(Math.random()<0.5){const a=pick(big);const d=addProspect({note:'A larger contract '+a.name+' brought you in on together.'});if(d){d.warm=1;d.joint=a.id;d.bidders=[];d.seats=Math.round((d.seats||20)*rnd(1.4,2.2));shift(a,3,2);log('You and '+a.name+' are bidding together on a larger contract than either of you could take alone.','good');}}}

/* monthly upkeep: cartel heat and exposure, defections, mole cost and discovery */
function tiesDaily(){
  // mole retainers
  if(S.co.moles)for(const id in S.co.moles){const r=rivalById(id);if(!r){delete S.co.moles[id];continue;}spend((S.co.moles[id].fee||2000)/DPM);r.leaked=S.day+YEAR;}
  if(S.day%DPM!==19)return;
  // cartel: it leaves a trail, and grows harder to hide the bigger it is
  if(cartelSize()){addHeat(2+cartelSize(),'Running a price-fixing cartel',1);
    // a member may defect: opportunists and predators, especially when you're weak
    for(const id of cartelIds().slice()){const r=rivalById(id);if(!r){S.co.cartel.members=cartelIds().filter(x=>x!==id);continue;}
      const pd=(r.pers==='predatory'?0.05:r.pers==='opportunist'?0.03:0.01)*(S.co.rep<40?1.6:1);
      if(Math.random()<pd){S.co.cartel.members=cartelIds().filter(x=>x!==id);r.stance=clamp(r.stance-20,-100,100);r.target=S.day+DPM*ri(2,4);remember(r,'They broke ranks and undercut you.');
        if(Math.random()<0.5){addHeat(14,r.name+' blew the whistle on the cartel',1);log(r.name+' has broken the pricing arrangement and gone to the regulator. This could get very expensive.','bad');}
        else log(r.name+' has broken ranks and is undercutting everyone again.','bad');}}
    if(!cartelSize())S.co.cartel=null;
  }
  // mole discovery risk
  if(S.co.moles)for(const id in S.co.moles){const r=rivalById(id);if(!r)continue;if(Math.random()<(r.pers==='predatory'?0.05:0.03)){delete S.co.moles[id];r.stance=clamp(r.stance-25,-100,100);addHeat(16,'Source inside '+r.name+' was exposed',1);log(r.name+' found your source and has gone to the authorities. They know exactly what you did.','bad');}}
}
const _peopleDaily_ze=peopleDaily;peopleDaily=function(W){_peopleDaily_ze(W);if(S.mkt){jointDaily();tiesDaily();}};

/* ---------- the card: a "Deeper ties" section ---------- */
const _rivalModal_ze=MODAL_EXT.rival;
MODAL_EXT.rival=(M,x)=>{let h=_rivalModal_ze(M,x);if(h===null)return null;const r=rivalById(M.id);if(!r)return h;
  let g='<h3 style="font-size:.95rem;margin:14px 0 4px">Deeper ties</h3>';
  // alliance / betrayal
  const aWhy=RACTS.alliance.ok(r);
  g+='<ul class="list">';
  g+='<li class="item"><span><b>'+RACTS.alliance.t+'</b></span><span class="r">'+(ally(r)?'<button class="btn sm" data-act="rEnd" data-v="'+r.id+':alliance">Dissolve</button>':aWhy?'<span class="mut" style="font-size:.8rem">'+aWhy+'</span>':'<button class="btn sm" data-act="rAct" data-v="'+r.id+':alliance">Propose</button>')+'</span><span class="sub">'+RACTS.alliance.d+'</span></li>';
  if(ally(r)||inCartel(r))g+='<li class="item"><span><b>'+RACTS.betray.t+'</b> <span class="neg" style="font-size:.76rem">— burns your reputation</span></span><span class="r"><button class="btn sm" data-act="rAct" data-v="'+r.id+':betray">Do it</button></span><span class="sub">'+RACTS.betray.d+'</span></li>';
  // cartel
  const cIn=inCartel(r);
  g+='<li class="item"><span><b>Pricing arrangement (cartel)</b> <span class="neg" style="font-size:.76rem">— illegal</span></span><span class="r">'+(cIn?'<button class="btn sm" data-act="cartelDrop" data-v="'+r.id+'">Drop them</button>':'<button class="btn sm" data-act="cartelInvite" data-v="'+r.id+'">Invite</button>')+'</span><span class="sub">Agree not to undercut each other. Your prices hold up and margins rise, but it fixes the market and builds serious heat. Honourable firms refuse.</span></li>';
  // mole
  const mg=moleOn(r);
  g+='<li class="item"><span><b>Plant a source (mole)</b> <span class="neg" style="font-size:.76rem">— illegal</span></span><span class="r">'+(mg?'<button class="btn sm" data-act="moleStop" data-v="'+r.id+'">Cut them loose</button>':'<button class="btn sm" data-act="moleStart" data-v="'+r.id+'">Plant one</button>')+'</span><span class="sub">'+(mg?'Costing you '+gbp(mg.fee)+'/mo. Their pricing and plans stay on your desk.':'An inside source for a monthly retainer: their pricing and plans, ongoing. Bribery and data theft if exposed.')+'</span></li>';
  g+='</ul>';
  if(cartelSize())g+='<p class="mut" style="font-size:.8rem">Your cartel: '+cartelIds().map(id=>{const x=rivalById(id);return x?esc(x.name):'a firm';}).join(', ')+'. <button class="linkbtn" data-act="cartelLeave">Wind it up</button></p>';
  if(betrayer())g+='<p class="neg" style="font-size:.8rem">Your reputation for betrayal is still fresh, alliances are hard to form for now.</p>';
  // insert before the "come in later builds" note if present, else before history/end
  if(h.indexOf('Greyer tactics, alliances and worse come in later builds.')>=0)h=h.replace(/<p class="mut"[^>]*>Greyer tactics, alliances and worse come in later builds\.<\/p>/,g);
  else h=h.replace(/<\/div>$/,g+'</div>');
  return h;};
