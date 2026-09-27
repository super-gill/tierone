
/* ============ build 125: savings buffer + a grace window before the bank ends it ============
   Replaces the old one-click fire sale. Two changes:
   1. Instant savings now auto-cover the current account, so a buffer you keep on purpose is
      actually used before you ever hit the overdraft. Toggle in the savings section.
   2. When savings is gone and you are still over the limit, the bank gives you a grace window
      instead of folding you. The game pauses, and you sell whatever you like at full price
      through the normal Markets/Savings screens. The demand clears the moment you are back
      within the limit. An itemised "sell just enough" option is there as a fallback, and it
      logs every line so you always know what went. All your liquid assets count now:
      savings, fixed-term deposits, public shares, minority stakes and branches. */

const DEMAND_DAYS=14;
const survived=()=>S.co.cash>-OD_LIMIT;

/* everything you could turn into cash in a hurry, at rough forced-sale prices */
function liquidAssets(){
  const lines=[];let total=0;const add=(k,what,v)=>{if(v>0){lines.push({k,what,v});total+=v;}};
  add('savings','Instant savings',Math.round(S.co.savings||0));
  if(typeof bondsLocked==='function')add('deposits','Fixed-term deposits (broken early)',Math.round(bondsLocked()));
  if(S.co.shares)for(const rid in S.co.shares){const r=rivalById(rid);const hd=S.co.shares[rid];if(!r||!hd.units)continue;add('share:'+rid,'Shares in '+r.name,Math.round(hd.units*sharePx(r)*0.97));}
  if(typeof rivals==='function')for(const r of rivals())if(r.stake&&typeof stakePrice==='function')add('stake:'+r.id,'Stake in '+r.name,Math.round(stakePrice(r)*0.85));
  if(typeof branches==='function')for(const b of branches())add('branch:'+b.id,'The '+b.name,Math.round((typeof brValue==='function'?brValue(b):0)*0.8));
  return {total,lines};
}
function bankRescueAvailable(){const fs=liquidAssets().total;return fs>0&&(S.co.cash+fs)>-OD_LIMIT;}

/* sell just enough, best value first, at a distress discount; logs every line */
function autoLiquidate(target){
  target=target||0;const need=()=>target-S.co.cash;
  if(need()<=0)return;
  // 1) instant savings, at par
  if(S.co.savings>0&&need()>0){const d=Math.min(S.co.savings,need());S.co.savings-=d;S.co.cash+=d;log('Drew '+gbp(Math.round(d))+' from savings.','event');}
  // 2) break fixed-term deposits, principal back
  if(S.co.bonds&&S.co.bonds.length){for(const b of S.co.bonds.slice()){if(need()<=0)break;const amt=b.amount;S.co.cash+=amt;S.co.bonds.splice(S.co.bonds.indexOf(b),1);log('Broke a '+gbp(Math.round(amt))+' fixed-term deposit early (forfeited the interest).','event');}}
  // 3) public shares, ~97% of market, partial to the amount needed
  if(S.co.shares)for(const rid in S.co.shares){if(need()<=0)break;const r=rivalById(rid);const hd=S.co.shares[rid];if(!r||!hd.units)continue;const px=sharePx(r)*0.97;const want=Math.min(hd.units,Math.ceil(need()/px));const proceeds=Math.round(want*px);const back=Math.round(hd.paid*(want/hd.units));hd.units-=want;hd.paid=Math.max(0,hd.paid-back);S.co.cash+=proceeds;S.co.capYr=(S.co.capYr||0)+proceeds;if(hd.units<=0)delete S.co.shares[rid];log('Sold '+want.toLocaleString()+' shares in '+r.name+' for '+gbp(proceeds)+'.','event');}
  // 4) minority stakes, 85%
  if(typeof rivals==='function')for(const r of rivals().slice()){if(need()<=0)break;if(r.stake&&typeof stakePrice==='function'){const v=Math.round(stakePrice(r)*0.85);S.co.cash+=v;S.co.capYr=(S.co.capYr||0)+v;delete r.stake;log('Sold your stake in '+r.name+' for '+gbp(v)+'.','event');}}
  // 5) branches, 80%, smallest first
  if(typeof branches==='function'){const bs=branches().slice().sort((a,b)=>brValue(a)-brValue(b));for(const b of bs){if(need()<=0)break;const v=Math.round(brValue(b)*0.8);S.co.cash+=v;S.co.capYr=(S.co.capYr||0)+v;branches().splice(branches().indexOf(b),1);log('Sold the '+b.name+' for '+gbp(v)+'.','event');}}
}

function bankFold(){S.over={mi:monthOf(S.day),peak:Math.max.apply(null,S.hist.map(h=>h.mrr).concat([mrr()]))};}

/* enter the grace window: pause, and demand the overdraft is cleared within a fortnight */
function bankCallIn(){
  if(S.co.demand){if(survived()){S.co.demand=null;S.co.bankCalled=false;S.co.red=0;}return;}
  S.co.demand={at:S.day,due:S.day+DEMAND_DAYS};S.co.bankCalled=true;
  if(typeof V!=='undefined')V.speed=0;
  S.hq.push({id:'bankCall',ctx:{}});
  log('The bank is calling in the overdraft. Clear it within '+DEMAND_DAYS+' days or '+S.co.name+' goes into administration. Sell what you need to.','bad');
}

/* clears the demand the instant you are back within the limit; called from the render path */
function demandCheck(){if(S.co&&S.co.demand&&survived()){S.co.demand=null;S.co.bankCalled=false;S.co.red=0;log('You raised enough to get back within your limit. The bank stands down.','good');}}

/* daily: sweep savings to cover the current account, and enforce the demand deadline */
if(typeof peopleDaily==='function'){const _pd=peopleDaily;peopleDaily=function(W){_pd.apply(this,arguments);
  try{
    if(S.co.savingsCover!==false&&(S.co.savings||0)>0&&S.co.cash<0){const d=Math.min(S.co.savings,-S.co.cash);S.co.savings-=d;S.co.cash+=d;S.co.sweptMo=(S.co.sweptMo||0)+d;}
    if(S.day%DPM===0&&(S.co.sweptMo||0)>0){log('Drew '+gbp(Math.round(S.co.sweptMo))+' from savings this month to keep the current account out of the overdraft.','info');S.co.sweptMo=0;}
    if(S.co.demand){if(survived()){demandCheck();}else if(S.day>=S.co.demand.due){bankFold();log('Time ran out. The bank has put '+S.co.name+' into administration.','bad');}}
  }catch(e){}
};}

/* rewrite the bank event into the grace-window demand */
if(typeof HUMAN!=='undefined'){
  HUMAN.bankCall={w:0,ok:()=>false,make:x=>{
    const la=liquidAssets();const over=Math.round(-S.co.cash-OD_LIMIT);const clear=Math.round(-S.co.cash);
    const canCover=(S.co.cash+la.total)>-OD_LIMIT;
    const tally=la.lines.slice(0,6).map(l=>l.what+' ~'+gbp(l.v)).join(', ');
    return {kicker:'The bank · final demand',title:'The bank is calling in the overdraft',
      body:'You’re '+gbp(over)+' past your '+gbp(OD_LIMIT)+' limit. The bank will put '+S.co.name+' into administration unless you get back within it, and they’ve given you '+DEMAND_DAYS+' days. '+
        (la.total>0?'You can raise about '+gbp(la.total)+' from what you hold'+(tally?' ('+tally+')':'')+'. '+(canCover?'That’s more than enough — sell what you like on the Markets and Savings screens (you’ll get full price), and this clears the moment you’re back within the limit.':'It may not be enough on its own, but it buys you room while you win work.'):'You’ve nothing much left to sell.'),
      choices:[
        {label:'Give me time to raise it',note:'The game stays paused. Sell assets yourself at full price; the demand lifts as soon as you clear the limit.',go(){log('You’ve bought some time. Clear the overdraft before the '+DEMAND_DAYS+' days are up.','event');}},
        {label:'Sell just enough now, automatically',note:'A quick forced sale at a discount, smallest hit first, only as much as it takes. Every line is logged.',go(){autoLiquidate(0);if(survived()){S.co.demand=null;S.co.bankCalled=false;S.co.red=0;log('The forced sale cleared it. '+S.co.name+' survives, lighter but standing.','good');}else{bankFold();log('Even selling everything liquid wasn’t enough. '+S.co.name+' goes into administration.','bad');}}},
        {label:'Let it fold',note:'Walk away. The company goes into administration.',go(){bankFold();log('You let '+S.co.name+' go into administration.','bad');}}
      ]};}};
}

/* re-open the demand from the banner */
ACT_EXT.demandOpen=()=>{if(S.co&&S.co.demand)S.hq.push({id:'bankCall',ctx:{}});};

/* a persistent red banner while a demand is live, on whatever tab you’re on */
if(typeof renderPane==='function'){const _rp=renderPane;renderPane=function(){
  demandCheck();
  _rp.apply(this,arguments);
  try{
    if(S&&S.co&&S.co.demand){const p=$('pane');if(p){const over=Math.round(-S.co.cash-OD_LIMIT);const days=Math.max(0,S.co.demand.due-S.day);
      const banner='<div class="sec" style="border:1px solid var(--bad);border-radius:12px;padding:12px;background:color-mix(in srgb,var(--bad) 9%,transparent);margin-bottom:12px"><div class="row" style="justify-content:space-between;align-items:flex-start;gap:8px"><b style="color:var(--bad)">The bank is calling in the overdraft</b><button class="btn sm" data-act="demandOpen">Options</button></div><p class="mut" style="font-size:.84rem;margin:6px 0 0">'+gbp(over)+' over the limit, about '+days+' day'+(days===1?'':'s')+' to clear it. Sell holdings on the Markets and Savings screens (full price), or take the quick forced sale. It lifts the moment you’re back within your limit.</p></div>';
      p.innerHTML=banner+p.innerHTML;}}
  }catch(e){}
};}

/* savings section: a toggle for using the buffer to cover the current account */
if(typeof paneInvestSavings==='function'){const _ps=paneInvestSavings;paneInvestSavings=function(){let h=_ps.apply(this,arguments);
  const on=S.co.savingsCover!==false;
  h+='<div class="sec" style="padding-top:0"><p class="mut" style="font-size:.82rem;margin:0 0 4px">Cover the current account from savings</p><p class="lede" style="margin:0 0 4px">When cash would go into the red, top it up from this buffer automatically, so the overdraft (and the bank) only come into play once savings is gone.</p><div class="seg"><button data-act="saveCover" data-v="1" aria-pressed="'+on+'">On</button><button data-act="saveCover" data-v="0" aria-pressed="'+(!on)+'">Off</button></div></div>';
  return h;};}
ACT_EXT.saveCover=v=>{S.co.savingsCover=(v==='1');log(S.co.savingsCover?'Savings will now top up the current account before you hit the overdraft.':'Savings will no longer auto-cover the current account.','info');};
