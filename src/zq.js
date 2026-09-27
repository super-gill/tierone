
/* ============ build 78: a fire sale before the bank ends it ============
   When the overdraft is called in, the player gets one last chance to sell
   assets (investment stakes and branches) at distress prices to clear it and
   keep the company, rather than folding instantly. */

function fireSaleValue(){
  let t=0;
  if(typeof branches==='function')for(const b of branches())t+=Math.round((typeof brValue==='function'?brValue(b):0)*0.8);
  if(typeof rivals==='function')for(const r of rivals())if(r.stake&&typeof stakePrice==='function')t+=Math.round(stakePrice(r)*0.85);
  return t;
}
function bankRescueAvailable(){const fs=fireSaleValue();return fs>0&&(S.co.cash+fs)>-OD_LIMIT;}
/* sell stakes first, then the smallest branches, at distress prices, until clear */
function fireSaleRun(target){
  if(typeof rivals==='function')for(const r of rivals().slice()){if(S.co.cash>=target)break;if(r.stake&&typeof stakePrice==='function'){const v=Math.round(stakePrice(r)*0.85);S.co.cash+=v;delete r.stake;log('Fire sale: sold your stake in '+r.name+' for '+gbp(v)+'.','event');}}
  if(typeof branches==='function'){const bs=branches().slice().sort((a,b)=>brValue(a)-brValue(b));
    for(const b of bs){if(S.co.cash>=target)break;const v=Math.round(brValue(b)*0.8);S.co.cash+=v;branches().splice(branches().indexOf(b),1);log('Fire sale: sold the '+b.name+' for '+gbp(v)+'.','event');}}
}

if(typeof HUMAN!=='undefined'){
  HUMAN.bankCall={w:0,ok:()=>false,make:x=>{
    const short=Math.round(-S.co.cash);const fs=fireSaleValue();
    const assets=[];
    if(typeof branches==='function')for(const b of branches())assets.push('the '+b.name+' (~'+gbp(Math.round(brValue(b)*0.8))+')');
    if(typeof rivals==='function')for(const r of rivals())if(r.stake)assets.push('your stake in '+r.name+' (~'+gbp(Math.round(stakePrice(r)*0.85))+')');
    const end=()=>{S.over={mi:monthOf(S.day),peak:Math.max(...S.hist.map(h=>h.mrr).concat([mrr()]))};};
    return {kicker:'The bank · final notice',title:'The bank is calling in the overdraft',
      body:'You’re '+gbp(short)+' overdrawn and out of time. The bank will put '+S.co.name+' into administration unless you clear it now. You could hold a fire sale — '+(assets.length?assets.join(', '):'nothing much left to sell')+' — though forced sales fetch less than the assets are worth. It would raise about '+gbp(fs)+'.',
      choices:[
        {label:'Hold a fire sale to survive',note:'Sell assets at a discount to clear the overdraft and keep the company.',go(){fireSaleRun(0);
          if(S.co.cash>-OD_LIMIT){S.co.red=0;S.co.bankCalled=false;log('You cleared the overdraft with a fire sale. '+S.co.name+' survives, smaller but standing.','good');}
          else{end();log('Even the fire sale wasn’t enough. '+S.co.name+' goes into administration.','bad');}}},
        {label:'Let it go into administration',note:'The company folds.',go(){end();log('You let '+S.co.name+' go into administration.','bad');}}
      ]};}};
}
