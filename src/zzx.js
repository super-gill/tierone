
/* ============ build 134: fuller exec delegation + per-exec toggle + monthly digest ============
   Late game, a heavy group runs at 256x and a forced-choice modal was firing every couple of
   seconds. The C-suite already auto-handled the core domain events (breach, poach, rival...),
   but a long tail still stopped the clock: lawsuits, licensing audits, data requests, tool
   leaks, client downturns, staff awards. Those now route to the owning exec too. Each exec
   gets a "Handle it / Ask me first" switch (default: Handle it), so you can pull any domain
   back onto your own desk when you want the call. And once a month your execs report what they
   took care of, so delegation isn't a black box. Nothing here delegates a decision that is
   yours alone: M&A, going public, the board, the bank calling in the overdraft, a partner
   walking, a scandal or a conviction all still stop and ask you. */

/* extend the routing table (defined in zm.js) with the noisy long tail */
if(typeof EVENT_EXEC==='object'&&EVENT_EXEC){
  Object.assign(EVENT_EXEC,{
    suit:'cfo', licAudit:'cfo',        // legal cost and licensing sit with finance
    dsar:'cto', toolLeak:'cto',        // data requests and product security sit with technology
    downturn:'coo', award:'coo'        // client relationships and people sit with operations
  });
}

/* per-exec delegation switch: default on (Handle it). Ask me first pulls that exec's
   domain events back to blocking modals so you make the call yourself. */
function execDelegOn(r){return !(S&&S.co&&S.co.execDeleg&&S.co.execDeleg[r]===false);}
ACT_EXT.execDeleg=v=>{const [r,on]=v.split(':');if(!EXEC_ROLE[r])return;S.co.execDeleg=S.co.execDeleg||{};S.co.execDeleg[r]=(on==='1');
  const R=EXEC_ROLE[r];log('Your '+R.t+' will '+(on==='1'?'handle their domain events for you.':'bring their domain decisions to you.'),'info');};

/* smarter default picks for the newly-delegated events (others fall through to zm's execChoiceIdx,
   whose default of choice 0 already lands on the sensible option: settle, pay, handle properly,
   report and switch, scale the client down). */
if(typeof execChoiceIdx==='function'){
  const _eci=execChoiceIdx;
  execChoiceIdx=function(id,e,ctx){
    const n=(e&&e.choices)?e.choices.length:1;
    if(id==='suit'){const i=(ctx&&ctx.w>=0.62&&S.co.cash>0)?1:0;return Math.max(0,Math.min(n-1,i));}   // fight only when the odds are good
    if(id==='award'){const i=S.co.cash>8000?0:1;return Math.max(0,Math.min(n-1,i));}                    // make a proper fuss if the cash is there
    return _eci(id,e,ctx);
  };
}

/* redefine the resolver (zm.js version) to honour the toggle and tally the month's work.
   This declaration loads after zm.js, so it wins; the nextModal wrapper calls it by name. */
function execResolvePending(){
  if(!S||V._execBusy)return;let guard=0;
  while(S.pending&&EVENT_EXEC[S.pending.id]&&typeof exec==='function'&&exec(EVENT_EXEC[S.pending.id])&&execDelegOn(EVENT_EXEC[S.pending.id])&&guard++<8){
    const id=S.pending.id,ctx=S.pending.ctx,role=EVENT_EXEC[id];
    V._execBusy=true;
    let e=null;try{e=pendingEvent();}catch(_){e=null;}
    if(!e||!e.choices||!e.choices.length){V._execBusy=false;break;}
    const idx=execChoiceIdx(id,e,ctx);
    S.pending=null;
    try{e.choices[idx].go();}catch(_){}
    const R=EXEC_ROLE[role],nm=(exec(role)||{}).name||R.t;
    log(nm+' ('+R.t+') handled it — '+e.title+': '+e.choices[idx].label+'.','info');
    S.execMonth=S.execMonth||{};S.execMonth[role]=(S.execMonth[role]||0)+1;
    V._execBusy=false;
  }
}

/* monthly digest: a single line summarising what the C-suite took off your desk */
if(typeof monthEnd==='function'){
  const _me=monthEnd;
  monthEnd=function(){_me.apply(this,arguments);try{execDigest();}catch(e){}};
}
function execDigest(){
  const m=S.execMonth;if(!m)return;
  const parts=[];let total=0;
  for(const r of EXEC_ORDER){const n=m[r]||0;if(n){total+=n;const e=exec(r);parts.push(n+' by '+(e?e.name.split(' ')[0]:EXEC_ROLE[r].t)+' ('+EXEC_ROLE[r].t+')');}}
  S.execMonth=null;
  if(!total)return;
  log('Your execs handled '+total+' thing'+(total>1?'s':'')+' this month without troubling you: '+parts.join(', ')+'.','info');
}

/* the Handle it / Ask me first switch on each hired exec's card (leadershipSec lives in zc.js).
   Injected just before the "Let them go" row, per exec, by matching the fire button. */
if(typeof leadershipSec==='function'){
  const _ls=leadershipSec;
  const EDOM={cto:'breaches, incidents, data requests, tool leaks, stack and cert calls',
              cfo:'price rises, lawsuits, licensing audits, buy-out offers',
              coo:'manager asks, poaching, rivals, client downturns, staff awards'};
  function execDelegSeg(r){const on=execDelegOn(r);
    return '<div class="seg" style="margin-top:8px"><button data-act="execDeleg" data-v="'+r+':1" aria-pressed="'+on+'">Handle it<small>resolves their events</small></button>'+
      '<button data-act="execDeleg" data-v="'+r+':0" aria-pressed="'+(!on)+'">Ask me first<small>brings them to you</small></button></div>'+
      '<span class="mut" style="display:block;font-size:.76rem;margin-top:4px">'+(on?'Handles '+(EDOM[r]||'their domain')+' for you.':'Brings '+(EDOM[r]||'their domain')+' to you.')+'</span>';
  }
  leadershipSec=function(){
    let h=_ls.apply(this,arguments);
    h=h.replace(/<span class="row" style="margin-top:4px"><button class="btn sm danger" data-act="execFire" data-v="([a-z]+)">/g,
      (m,r)=>execDelegSeg(r)+m);
    return h;
  };
}
