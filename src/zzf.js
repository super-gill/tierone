
/* ============ build 98: phase 4 — shorting and activism ============
   Two ways to play the bear side. Short a national: borrow shares, sell them now,
   buy them back later — you profit if the price falls, lose if it rises, and a
   margin call closes you out if it runs 60% against you (plus a daily borrow fee).
   And agitate: on a disclosed stake, push the board for a special dividend or a
   sharpening-up that pops the shares. */

const SHORT_FEE=0.00015;   /* daily borrow fee on the position value */
function shortOf(rid){return S.co&&S.co.shorts&&S.co.shorts[rid];}

ACT_EXT.shortAsk=v=>{if(!rivalById(v))return;ui.amtMsg=null;ui.amtVal='';ui.modal={type:'amt',kind:'short',rid:v};};
/* the profit (or loss) of covering a short right now, spread included */
function shortPL(r,s){s=s||shortOf(r&&r.id);if(!r||!s)return 0;const px=sharePx(r);return Math.round(s.units*(s.openPx*(1-MKT_SPREAD)-px*(1+MKT_SPREAD)));}
ACT_EXT.shortOpen=v=>{const [rid,amt]=(v||'').split(':');const r=rivalById(rid);if(!r||r.tier<3)return;if(shortOf(rid)){if(typeof toast==='function')toast('You already hold a short on '+r.name+'.');return;}
  const px=sharePx(r);const a=+amt;if(!a||a<px){ui.amtMsg='That won’t short a single share ('+spx(px)+' each).';return;}
  let units=Math.floor(a/px);const maxBorrow=Math.floor(SHARES_OUT*floatOf(r)*0.4);units=Math.min(units,maxBorrow);if(units<1)return;
  const margin=Math.round(units*px*0.6);if(S.co.cash<margin){ui.amtMsg='You need '+gbp(margin)+' in cash set aside as margin to cover that short.';return;}
  /* no cash changes hands on opening — the proceeds are held against the shares you owe, so your spendable cash isn't inflated */
  S.co.shorts=S.co.shorts||{};S.co.shorts[rid]={units,openPx:px,opened:S.day};
  log('You opened a short on '+r.name+': '+units.toLocaleString()+' shares at '+spx(px)+'. No cash moves now — you bank the profit (or pay the loss) when you cover. A margin call closes you if it rises 60%.','info');
  ui.modal=null;ui.amtMsg=null;ui.amtVal=null;};
ACT_EXT.shortClose=v=>{const r=rivalById(v);const s=shortOf(v);if(!r||!s)return;const px=sharePx(r);const pl=shortPL(r,s);S.co.cash+=pl;if(pl>=0)S.m.setup=(S.m.setup||0)+pl;else S.m.other=(S.m.other||0)+(-pl);delete S.co.shorts[v];
  log('You covered your short on '+r.name+' at '+spx(px)+'. '+(pl>=0?'Profit '+gbp(pl)+'.':'Loss '+gbp(-pl)+'.'),pl>=0?'good':'bad');};

/* daily: borrow fee, margin calls, and firms that get taken over from under a short — settling only the P/L, never a gross buyback */
function shortsDaily(){
  if(!S.co||!S.co.shorts)return;
  for(const rid in S.co.shorts){const s=S.co.shorts[rid];const r=rivalById(rid);
    if(!r){const loss=Math.round(s.units*s.openPx*0.2);S.co.cash-=loss;S.m.other=(S.m.other||0)+loss;log('A firm you were shorting was taken over; the short closed at a loss of '+gbp(loss)+'.','bad');delete S.co.shorts[rid];continue;}
    const px=sharePx(r);const fee=Math.round(s.units*px*SHORT_FEE);if(fee>0){S.co.cash-=fee;S.m.other=(S.m.other||0)+fee;}
    if(px>s.openPx*1.6){const pl=shortPL(r,s);S.co.cash+=pl;S.m.other=(S.m.other||0)+Math.max(0,-pl);delete S.co.shorts[rid];log('Margin call — '+r.name+' has run 60% against your short. Force-closed at '+spx(px)+', a loss of '+gbp(-pl)+'.','bad');}
  }
}
if(typeof peopleDaily==='function'){const _pd=peopleDaily;peopleDaily=function(W){_pd.apply(this,arguments);try{shortsDaily();}catch(e){}};}

/* the short-position strip on the trading view */
function shortNote(r){const s=shortOf(r&&r.id);if(!s)return '';const pl=shortPL(r,s);
  return '<div class="mkt-def '+(pl>=0?'warn':'bad')+'">Short '+s.units.toLocaleString()+' @ '+spx(s.openPx)+' · P/L if covered now <b>'+(pl>=0?'+':'')+gbp(pl)+'</b> · margin call at '+spx(s.openPx*1.6)+'</div>';}

/* ---- activism: push a firm you hold a disclosed stake in ---- */
ACT_EXT.activist=v=>{const r=rivalById(v);if(!r||ownFrac(r)<DISCLOSE)return;
  if(r.agitAt&&S.day-r.agitAt<DPM*3){if(typeof toast==='function')toast('Give it a few months between campaigns.');return;}
  r.agitAt=S.day;const roll=Math.random();const cl=v=>(typeof clamp==='function')?clamp(v,0.7,1.5):v;
  if(roll<0.4){const div=Math.round(ownUnits(r.id)*sharePx(r)*0.05);S.co.cash+=div;S.m.invest=(S.m.invest||0)+div;r.shareMood=cl((r.shareMood||1)*1.06);log('Your campaign at '+r.name+' forced a special dividend — your '+Math.round(ownFrac(r)*100)+'% took '+gbp(div)+', and the shares popped.','good');}
  else if(roll<0.7){r.shareMood=cl((r.shareMood||1)*1.04);log('Your campaign at '+r.name+' pushed the board to sharpen up. The shares firmed.','info');}
  else{S.co.rep=Math.max(0,(S.co.rep||50)-1);log('Your campaign at '+r.name+' went nowhere and made you look needlessly aggressive.','bad');}};

/* extend the short amount modal (reuses the amt dialog) */
if(typeof MODAL_EXT!=='undefined'&&MODAL_EXT.amt){const _amt=MODAL_EXT.amt;MODAL_EXT.amt=(M,x)=>{
  if(M&&M.kind==='short'){const r=rivalById(M.rid);if(!r)return null;const px=sharePx(r);
    return '<div class="dialog">'+x+'<p class="kick">Investments</p><h2>Short '+esc(r.name)+'</h2><p>Bet the price falls. No cash changes hands now — you set aside 60% of the position as margin, and you bank the profit or pay the loss when you cover. A margin call closes you out if it runs 60% against you, plus a small daily borrow fee.</p>'+
      '<p class="mut" style="font-size:.85rem;margin:0 0 8px">Price <b>'+spx(px)+'</b> · market cap <b>'+gbp(firmCap(r))+'</b> · cash <b>'+gbp(S.co.cash)+'</b></p>'+
      '<div class="mkt-chart">'+priceChartSVG(mktSeries(r))+'</div>'+
      '<div class="field"><label for="amtField">Amount to short (£)</label><input id="amtField" inputmode="numeric" autocomplete="off" placeholder="type any amount" value="'+esc(ui.amtVal||'')+'"></div>'+
      (ui.amtMsg?'<p class="note warn">'+esc(ui.amtMsg)+'</p>':'')+
      '<div class="foot2"><span class="grow"></span><button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="amtGo">Short it</button></div></div>';}
  return _amt(M,x);};}
/* route the amt dialog's confirm to shortOpen when it's a short */
if(ACT_EXT.amtGo){const _amtGo=ACT_EXT.amtGo;ACT_EXT.amtGo=()=>{const M=ui.modal;
  if(M&&M.type==='amt'&&M.kind==='short'){const el=(typeof $==='function')&&$('amtField');const raw=el?el.value:'';ui.amtVal=raw;const a=Math.floor(+(String(raw).replace(/[^0-9.]/g,''))||0);if(!a||a<=0){ui.amtMsg='Enter an amount.';return;}ACT_EXT.shortOpen(M.rid+':'+a);return;}
  return _amtGo();};}

/* short positions appear in the Investments-tab summary */
if(typeof paneInvestShares==='function'){const _pis=paneInvestShares;paneInvestShares=function(){let h=_pis.apply(this,arguments);
  const sh=(S.co&&S.co.shorts)||{};const rids=Object.keys(sh);if(!rids.length)return h;
  let rows='';for(const rid of rids){const r=rivalById(rid);if(!r)continue;const s=sh[rid];const px=sharePx(r);const pl=shortPL(r,s);
    rows+='<tr><td>'+esc(r.name)+'</td><td class="r">'+s.units.toLocaleString()+' sh</td><td class="r">'+spx(s.openPx)+'</td><td class="r">'+spx(px)+'</td><td class="r '+(pl>=0?'pos':'neg')+'">'+(pl>=0?'+':'')+gbp(pl)+'</td></tr>';}
  if(!rows)return h;
  return h+'<div class="sec"><h3 style="font-size:.95rem">Short positions</h3><p class="lede">Bets that a firm will fall. You profit as the price drops, and a margin call closes you out if it rises 60% against you. Cover them from the Markets panel.</p><table><thead><tr><th>Firm</th><th class="r">Size</th><th class="r">Opened</th><th class="r">Now</th><th class="r">P/L</th></tr></thead><tbody>'+rows+'</tbody></table></div>';};}

/* warn if you sell out of your longs while a short is still open (selling shares doesn't close a short) */
if(ACT_EXT.shareSell){const _ss=ACT_EXT.shareSell;ACT_EXT.shareSell=v=>{_ss(v);
  const longs=(S.co&&S.co.shares)?Object.keys(S.co.shares).length:0;const shorts=(S.co&&S.co.shorts)?Object.keys(S.co.shorts).length:0;
  if(!longs&&shorts){if(typeof toast==='function')toast('You still have an open short — selling shares doesn’t close it.');log('Heads up: you still have '+shorts+' short position'+(shorts>1?'s':'')+' open. Selling shares doesn’t close a short — cover it in the Markets panel, or a margin call may catch you.','bad');}
};}

/* diagnostics: expose share holdings, short positions, and this month's market cash flows */
if(typeof diagReport==='function'){const _dg=diagReport;diagReport=function(){let t=_dg();
  const sh=(S.co&&S.co.shares)||{},shorts=(S.co&&S.co.shorts)||{},m=S.m||{};
  const holdings=Object.keys(sh).map(rid=>{const r=rivalById(rid);return {firm:r?r.name:rid,units:sh[rid].units,pct:Math.round(sh[rid].units/SHARES_OUT*100),paid:Math.round(sh[rid].paid),now:r?Math.round(sh[rid].units*sharePx(r)):null};});
  const shortPos=Object.keys(shorts).map(rid=>{const r=rivalById(rid);const s=shorts[rid];return {firm:r?r.name:rid,units:s.units,openPx:s.openPx,plIfCovered:r?shortPL(r,s):null};});
  return t+'\n'+JSON.stringify({shareHoldings:holdings,shortPositions:shortPos,monthSoFar:{shareSalesEtc:Math.round(m.setup||0),lossesFeesEtc:Math.round(m.other||0),dividendsInterest:Math.round(m.invest||0),branch:Math.round(m.branch||0)}});
};}
