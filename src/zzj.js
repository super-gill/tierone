
/* ============ build 107: the Investments tab becomes a portfolio hub ============
   A stock-market-style window: types of investment down the side, a detail view for each
   (charts where value actually moves — shares, stakes; a fixed-income view for savings and
   deposits), and a collective Overview showing the whole portfolio and its performance.
   The live Markets panel under the office floor plan stays as the glanceable quick-trade. */

/* ---- totals across the investment types ---- */
function invShareTotals(){const sh=(S.co&&S.co.shares)||{};let val=0,paid=0,n=0,div=0;
  for(const rid in sh){const r=rivalById(rid);if(!r)continue;const px=sharePx(r);val+=sh[rid].units*px;paid+=sh[rid].paid;div+=Math.round(sh[rid].units*px*0.0022);n++;}
  return {val,paid,n,div};}
function invSaveTotals(){const bal=(S.co&&S.co.savings)||0;const dep=(typeof bondsLocked==='function')?bondsLocked():0;return {bal,dep};}
function invShortTotals(){const so=(S.co&&S.co.shorts)||{};let pl=0,n=0;for(const rid in so){const r=rivalById(rid);if(!r)continue;pl+=shortPL(r,so[rid]);n++;}return {pl,n};}
function portValueNow(){const sh=invShareTotals();const st=(typeof investPerf==='function')?investPerf():{value:0};const sv=invSaveTotals();const so=invShortTotals();
  return Math.round(sh.val+(st.value||0)+sv.bal+sv.dep+so.pl);}
/* record total portfolio value each month so the overview can draw a performance line */
if(typeof marketMonthly==='function'){const _mm=marketMonthly;marketMonthly=function(){_mm.apply(this,arguments);try{(S.co.portHist=S.co.portHist||[]).push(portValueNow());if(S.co.portHist.length>120)S.co.portHist.shift();}catch(e){}};}

ACT_EXT.invSel=v=>{ui.invSel=v;};

/* ---- collective overview ---- */
function invOverview(){
  const sh=invShareTotals();const st=(typeof investPerf==='function')?investPerf():{value:0,paid:0,mo:0,h:[]};const sv=invSaveTotals();const so=invShortTotals();
  const val=sh.val+(st.value||0)+sv.bal+sv.dep+so.pl;
  const invested=sh.paid+(st.paid||0)+sv.bal+sv.dep;
  const unreal=(sh.val-sh.paid)+((st.value||0)-(st.paid||0))+so.pl;const uc=unreal>=0?'pos':'neg';
  const saveInt=(S.co.savingsCompound?0:Math.round(sv.bal*(typeof SAVE_APR!=='undefined'?SAVE_APR:0.038)/12));
  const income=(st.mo||0)+sh.div+saveInt;
  let h='<div class="sec"><h3>Portfolio overview</h3><p class="lede">Everything you hold outside the business itself: public shares, minority stakes, cash on deposit and any short positions.</p>';
  if(val<=0&&invested<=0)return h+'<p class="empty">You’re not holding any investments yet. Buy shares in a national from the Markets panel, take a 20% stake in a smaller firm from its card on the Market tab, or park cash in Savings &amp; deposits.</p></div>';
  h+='<div class="tiles"><div class="tile"><span class="k">Portfolio value</span><span class="v">'+gbp(Math.round(val))+'</span><small class="'+uc+'">'+(unreal>=0?'+':'')+gbp(Math.round(unreal))+' vs '+gbp(Math.round(invested))+' in</small></div>'+
    '<div class="tile"><span class="k">Monthly income</span><span class="v">'+gbp(Math.round(income))+'</span><small>dividends &amp; interest</small></div>'+
    '<div class="tile"><span class="k">On deposit</span><span class="v">'+gbp(Math.round(sv.bal+sv.dep))+'</span><small>'+gbp(Math.round(sv.bal))+' instant · '+gbp(Math.round(sv.dep))+' locked</small></div>'+
    '<div class="tile"><span class="k">Holdings</span><span class="v">'+(sh.n+((st.h&&st.h.length)||0))+'</span><small>'+sh.n+' shares · '+((st.h&&st.h.length)||0)+' stakes'+(so.n?' · '+so.n+' short':'')+'</small></div></div>';
  const parts=[['Public shares',sh.val,'var(--p)'],['Minority stakes',st.value||0,'var(--good)'],['Instant savings',sv.bal,'var(--warn)'],['Fixed-term',sv.dep,'var(--muted)']];
  const tot=parts.reduce((a,p)=>a+p[1],0)||1;
  h+='<h3 style="font-size:.95rem;margin:14px 0 4px">Allocation</h3><div class="inv-alloc">'+parts.filter(p=>p[1]>0).map(p=>'<span style="width:'+(p[1]/tot*100).toFixed(1)+'%;background:'+p[2]+'"></span>').join('')+'</div>';
  h+='<div class="row" style="flex-wrap:wrap;gap:12px;font-size:.8rem">'+parts.map(p=>'<span class="mut"><span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:'+p[2]+';margin-right:5px;vertical-align:middle"></span>'+p[0]+' '+gbp(Math.round(p[1]))+'</span>').join('')+(so.pl?'<span class="'+(so.pl>=0?'pos':'neg')+'">Short P/L '+(so.pl>=0?'+':'')+gbp(Math.round(so.pl))+'</span>':'')+'</div>';
  const ph=(S.co.portHist||[]).concat([Math.round(val)]);
  if(ph.length>=2)h+='<h3 style="font-size:.95rem;margin:16px 0 4px">Portfolio value over time</h3><div class="mkt-chart">'+priceChartSVG(ph)+'</div>';
  else h+='<p class="mut" style="font-size:.82rem;margin-top:12px">A performance line builds up here as the months pass.</p>';
  return h+'</div>';
}

/* ---- minority stakes (charts, because their value moves) ---- */
function invStakes(){const P=(typeof investPerf==='function')?investPerf():{h:[]};
  let h='<div class="sec"><h3 style="font-size:.95rem">Minority stakes</h3><p class="lede">20% stakes in smaller firms. Each pays a monthly dividend; you share the upside if they’re acquired and lose most of it if they fold. Buy a stake from a smaller firm’s card on the Market tab.</p>';
  if(!P.h||!P.h.length)return h+'<p class="empty">No stakes yet. Open the Market tab, pick a smaller firm and buy a 20% stake in it.</p></div>';
  h+='<div class="list">';
  for(const x of P.h){const r=rivalById(x.rid);if(!r)continue;const gain=x.value-x.paid,gcx=gain>=0?'pos':'neg';const trend=r.trend>0?'growing':r.trend<0?'shrinking':'steady';
    h+='<div class="item" style="flex-direction:column;align-items:stretch;gap:5px">'+
      '<div class="row" style="justify-content:space-between"><span><b>'+esc(r.name)+'</b> <span class="mut">20% · '+MKT_TIERS[r.tier].t.toLowerCase()+'</span></span><span class="r">'+gbp(x.value)+' <span class="'+gcx+'" style="font-size:.8rem">'+(gain>=0?'+':'')+gbp(gain)+'</span></span></div>'+
      (typeof spark==='function'?spark(r.hist):'')+
      '<div class="row mut" style="justify-content:space-between;font-size:.82rem"><span>~'+r.clients+' clients · '+trend+'</span><span>'+gbp(x.monthly)+'/mo dividend · paid '+gbp(x.paid)+'</span></div>'+
      '<div class="row" style="justify-content:flex-end;gap:8px"><button class="btn sm" data-act="rivalCard" data-v="'+r.id+'">Their card</button><button class="btn sm danger" data-act="rEnd" data-v="'+r.id+':invest">Sell · '+gbp(x.value)+'</button></div>'+
    '</div>';}
  return h+'</div></div>';
}

/* ---- short positions ---- */
function invShorts(){const so=(S.co&&S.co.shorts)||{};const ids=Object.keys(so);
  let h='<div class="sec"><h3 style="font-size:.95rem">Short positions</h3><p class="lede">Bets that a national will fall. You profit as the price drops, and a margin call closes you out if it rises 60% against you. Open and cover shorts from a firm’s trading view in the Markets panel.</p>';
  if(!ids.length)return h+'<p class="empty">No open shorts.</p></div>';
  h+='<table><thead><tr><th>Firm</th><th class="r">Size</th><th class="r">Opened</th><th class="r">Now</th><th class="r">P/L</th><th></th></tr></thead><tbody>';
  for(const id of ids){const r=rivalById(id);if(!r)continue;const s=so[id];const px=sharePx(r);const pl=shortPL(r,s);
    h+='<tr><td>'+esc(r.name)+'</td><td class="r">'+s.units.toLocaleString()+'</td><td class="r">'+gbp(s.openPx)+'</td><td class="r">'+gbp(px)+'</td><td class="r '+(pl>=0?'pos':'neg')+'">'+(pl>=0?'+':'')+gbp(pl)+'</td><td class="r"><button class="btn sm" data-act="shortClose" data-v="'+id+'">Cover</button></td></tr>';}
  return h+'</tbody></table></div>';
}

/* ---- your own company, once public ---- */
function invCompany(){const io=S.co&&S.co.ipo;if(!io)return '<div class="sec"><p class="empty">Your company isn’t public yet. Float it from the Strategy tab once you’re big enough.</p></div>';
  const stake=(typeof yourStakePct==='function')?yourStakePct():1;const val=Math.round(io.price*io.yourShares);
  let h='<div class="sec"><h3 style="font-size:.95rem">Your company · '+esc(S.co.name)+'</h3><p class="lede">You’re listed on AIM. Your own shareholding and what the market makes of the company.</p>';
  h+='<div class="tiles"><div class="tile"><span class="k">Share price</span><span class="v">'+gbp(io.price)+'</span><small>float '+gbp(io.floatPrice)+'</small></div>'+
    '<div class="tile"><span class="k">Your stake</span><span class="v">'+pct(stake)+'</span><small>worth '+gbp(val)+'</small></div>'+
    '<div class="tile"><span class="k">Market cap</span><span class="v">'+gbp((typeof marketCap==='function'?marketCap():0))+'</span><small>target '+gbp(io.target)+'</small></div>'+
    '<div class="tile"><span class="k">Dividends to you</span><span class="v pos">'+gbp(S.co.divs||0)+'</span><small>your stake, after tax</small></div></div>';
  if(io.priceHist&&io.priceHist.length>1)h+='<h3 style="font-size:.95rem;margin:14px 0 4px">Share price</h3><div class="mkt-chart">'+priceChartSVG(io.priceHist)+'</div>';
  h+='<p class="mut" style="font-size:.82rem;margin-top:8px">Placings, selling down and ringing the bell are on the Strategy tab.</p></div>';
  return h;
}

/* ---- the Investments tab is now the collective overview; buying, selling and managing
   each type happens in the tabbed Markets panel under the office floor plan ---- */
paneInvest=function(){
  return invOverview()+'<div class="sec" style="padding-top:0"><p class="mut" style="font-size:.84rem">Buy, sell and manage each of these in the <b>Markets</b> panel under the office floor plan, now tabbed by type: Shares, Stakes, Savings and Shorts.</p></div>';
};
