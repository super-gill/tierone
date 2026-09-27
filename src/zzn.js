
/* ============ build 115: market pricing research ============
   Pricing was set on the Stack tab with almost no view of what the market charges. This adds a
   commissioned market survey: pay for it and you see the going rate and a competitor price band
   for each service, and where your own list price sits. It's a snapshot — the market drifts as
   the price index rises and rivals shift, so it ages over about a year and wants refreshing.
   Sits on the Stack tab, right above your catalogue, so you research and price in one place. */

function commissionCost(){return Math.round(clamp(2500+(typeof mrr==='function'?mrr():0)*0.02,2500,12000)/100)*100;}
function resFresh(){const R=S.co&&S.co.res;if(!R)return 0;return clamp(1-(S.day-R.day)/(DPM*12),0,1);}
function resWord(){if(!(S.co&&S.co.res))return 'none';const f=resFresh();return f>0.66?'fresh':f>0.33?'aging':'stale';}
/* rival price ratios (1.0 = market) split into a low / typical / high band */
function rivalPricePctls(){const rs=(typeof rivals==='function')?rivals().map(r=>r.price).filter(x=>x>0).sort((a,b)=>a-b):[];
  if(rs.length<3)return {r25:0.85,r50:1,r75:1.15};
  const q=p=>rs[Math.min(rs.length-1,Math.floor(p*rs.length))];
  return {r25:q(0.25),r50:q(0.5),r75:q(0.75)};}
/* the market rate for a service as the survey snapshot saw it */
function resRef(k){const R=S.co&&S.co.res;const idx=R?R.idx:((S.mktIdx)||1);const base=(SVC[k].price||0)*(k==='m365'?(S.vend.dist.pm||1):1);return base*((k==='support'||k==='security')?idx:1);}
/* going rate = the market reference; the competitor band is the spread of rival prices around it */
function resBand(k){const R=S.co&&S.co.res;if(!R||!SVC[k]||!SVC[k].price)return null;const mid=resRef(k);return {lo:mid*R.r25,mid:mid,hi:mid*R.r75};}

ACT_EXT.commissionRes=()=>{const c=commissionCost();if((S.co.cash||0)<c){if(typeof toast==='function')toast('You can’t afford the '+gbp(c)+' survey right now.');return;}
  S.co.cash-=c;S.m.other=(S.m.other||0)+c;
  const P=rivalPricePctls();
  S.co.res={day:S.day,idx:S.mktIdx||1,r25:P.r25,r50:P.r50,r75:P.r75};
  log('You commissioned a market pricing survey for '+gbp(c)+'. The findings are on the Stack tab.','info');};

function marketPricingSec(){
  const R=S.co&&S.co.res;const cost=commissionCost();
  let h='<div class="sec"><h3>Market pricing</h3>';
  if(!R){
    h+='<p class="lede">Right now you set prices blind. A market survey shows the going rate and the spread of competitor prices for each service, and where your list price sits — so you can price to win volume or to hold margin on purpose, rather than guess.</p>'+
      '<div class="row"><button class="btn" data-act="commissionRes">Commission a market survey · '+gbp(cost)+'</button><span class="mut" style="font-size:.8rem">A one-off study. It ages as the market moves, so refresh it every year or so.</span></div></div>';
    return h;
  }
  const f=resFresh();const fw=resWord();const fcls=f>0.66?'pos':f>0.33?'wrn':'neg';
  h+='<p class="lede">Survey from '+((typeof dLabel==='function')?dLabel(R.day):'recently')+', <span class="'+fcls+'">'+fw+'</span>'+(f<=0.33?'. The market has moved on since — worth refreshing.':'.')+' The going rate, the competitor band, and where your list price sits.</p>';
  h+='<table><thead><tr><th>Service</th><th class="r">Competitor band</th><th class="r">Going rate</th><th class="r">You</th><th>Position</th></tr></thead><tbody>';
  for(const k of SVC_ORDER){const B=resBand(k);if(!B)continue;const you=S.price[k]||0;const ratio=B.mid?you/B.mid:1;const pos=(typeof priceWord==='function')?priceWord(ratio):'';
    const pcls=ratio<0.9?'pos':ratio>1.05?'neg':'';
    h+='<tr><td>'+SVC[k].name+'</td><td class="r mut">£'+B.lo.toFixed(2)+'–£'+B.hi.toFixed(2)+'</td><td class="r">£'+B.mid.toFixed(2)+'</td><td class="r"><b>£'+you.toFixed(2)+'</b></td><td class="'+pcls+'">'+pos+'</td></tr>';}
  h+='</tbody></table>';
  const above=SVC_ORDER.filter(k=>{const B=resBand(k);return B&&B.mid&&(S.price[k]||0)/B.mid>1.05;});
  const below=SVC_ORDER.filter(k=>{const B=resBand(k);return B&&B.mid&&(S.price[k]||0)/B.mid<0.9;});
  const parts=[];
  if(above.length)parts.push('above market on '+above.map(k=>SVC[k].short.toLowerCase()).join(', ')+' — fatter margin, but you’ll lose price-sensitive work');
  if(below.length)parts.push('keen on '+below.map(k=>SVC[k].short.toLowerCase()).join(', ')+' — you win more but leave margin on the table');
  h+='<p class="note'+(above.length?' warn':'')+'">'+(parts.length?'You’re '+parts.join('; ')+'.':'You’re priced about market across the board.')+' Adjust your list prices in the catalogue below.</p>';
  h+='<div class="row" style="margin-top:6px"><button class="btn sm" data-act="commissionRes">Refresh the survey · '+gbp(cost)+'</button></div></div>';
  return h;
}

/* drop the market-pricing panel in above the catalogue on the Stack tab */
if(typeof paneStack==='function'){const _ps=paneStack;paneStack=function(){let h=_ps.apply(this,arguments);
  const anchor='<div class="sec"><h3>Your catalogue</h3>';
  if(h.indexOf(anchor)>=0)h=h.replace(anchor,marketPricingSec()+anchor);else h+=marketPricingSec();
  return h;};}
