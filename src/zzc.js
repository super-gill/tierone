
/* ============ build 94: deferrable acquisition offers ============
   When a firm offers to sell to you, you no longer have to decide on the spot.
   "Think it over" parks the offer on the Market tab with a deadline, so you can
   go and raise the funds — sell shares, stakes or a branch, or borrow — and come
   back to complete it. The seller waits about a month, then moves on. */

/* park a live offer so it can be picked up again later */
function deferAcqOffer(x){
  if(!x)return;if(!x._by)x._by=S.day+ri(25,35);
  S.co.offers=S.co.offers||[];
  if(!S.co.offers.some(o=>o.x===x))S.co.offers.push({x,by:x._by});
  log('You asked '+(x.owner||'the seller')+' for time to think about '+x.name+'. It’s waiting on the Market tab until '+dLabel(x._by)+'.','event');
}

/* add a "Think it over" choice to the acquisition offer, just before "Pass" */
if(typeof EVENTS!=='undefined'&&EVENTS.acquire&&EVENTS.acquire.make){const _am=EVENTS.acquire.make;
  EVENTS.acquire.make=function(x){const e=_am.call(this,x);
    if(e&&e.choices&&e.choices.length&&!e.choices.some(c=>c._defer)){
      const c={label:'Think it over',note:'Park it on the Market tab, raise the funds, and come back. They’ll wait about a month.',_defer:true,go(){deferAcqOffer(x);}};
      e.choices.splice(Math.max(0,e.choices.length-1),0,c);
    }
    return e;};}

/* offers expire if you leave them too long */
function offersDaily(){
  if(!S.co||!S.co.offers||!S.co.offers.length)return;
  const keep=[];for(const o of S.co.offers){if(o.by<=S.day)log((o.x.owner||'The seller')+' got tired of waiting and sold '+o.x.name+' to someone else.','info');else keep.push(o);}
  S.co.offers=keep;
}
if(typeof peopleDaily==='function'){const _pd=peopleDaily;peopleDaily=function(W){_pd.apply(this,arguments);try{offersDaily();}catch(e){}};}

/* reopen a parked offer as a live decision (funded from your current cash/loan) */
ACT_EXT.offerReview=v=>{const i=+v;const o=S.co.offers&&S.co.offers[i];if(!o)return;S.co.offers.splice(i,1);S.pending={id:'acquire',ctx:o.x};ui.modal=null;if(typeof nextModal==='function')nextModal();};
ACT_EXT.offerPass=v=>{const i=+v;const o=S.co.offers&&S.co.offers[i];if(!o)return;S.co.offers.splice(i,1);log('You dropped the offer for '+o.x.name+'.','info');};

/* the "Offers on the table" list, on the Market tab */
function offersSec(){
  const offs=(S.co&&S.co.offers)||[];if(!offs.length)return '';
  let h='<div class="sec"><h3>Offers on the table</h3><p class="lede">Firms that offered to sell to you and are waiting on your answer. Raise the funds — sell shares, stakes or a branch, or borrow — then review and complete.</p><ul class="list">';
  for(let i=0;i<offs.length;i++){const o=offs[i],x=o.x;const need=Math.max(0,Math.round(x.price-S.co.cash));const left=Math.max(0,o.by-S.day);
    h+='<li class="item" style="flex-direction:column;align-items:stretch;gap:4px">'+
      '<div class="row" style="justify-content:space-between"><span><b>'+esc(x.name)+'</b> <span class="mut">'+gbp(x.mrr)+'/mo · '+x.cl.length+' clients</span></span><span class="r">'+gbp(x.price)+'</span></div>'+
      '<div class="row" style="justify-content:space-between;align-items:center"><span style="font-size:.8rem">'+(need>0?'<span class="wrn">'+gbp(need)+' short</span>':'<span class="pos">you can afford it</span>')+' <span class="mut">· '+left+' day'+(left===1?'':'s')+' left</span></span>'+
      '<span class="row" style="gap:6px"><button class="btn sm" data-act="offerPass" data-v="'+i+'">Drop</button><button class="btn sm primary" data-act="offerReview" data-v="'+i+'">Review</button></span></div></li>';}
  return h+'</ul></div>';
}
if(typeof paneMarket==='function'){const _pm=paneMarket;paneMarket=function(){const os=offersSec();return os+_pm.apply(this,arguments);};}

/* a reminder on the Money tab, where you go to raise the funds */
if(typeof paneMoney==='function'){const _pmn=paneMoney;paneMoney=function(){let h=_pmn.apply(this,arguments);const offs=(S.co&&S.co.offers)||[];
  if(offs.length){const o=offs[0],need=Math.max(0,Math.round(o.x.price-S.co.cash));
    h='<div class="sec"><p class="note'+(need>0?' warn':'')+'"><b>Offer on the table:</b> '+esc(o.x.name)+' for '+gbp(o.x.price)+(need>0?' — you’re '+gbp(need)+' short. Raise the funds, then ':' — you can afford it now. ')+'<button class="linkbtn" data-act="tab" data-v="market">review it on the Market tab</button>.</p></div>'+h;}
  return h;};}
