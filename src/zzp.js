
/* ============ build 119: portfolio health notes on the Investments overview ============
   The Investments overview showed the numbers but never said anything about them. This adds a
   short "Worth a look" section that flags weak or losing holdings and points to where you'd act:
   stakes in shrinking firms or down on cost, shares underwater, shorts running against you, and
   idle cash that would earn more on deposit. When nothing looks weak it says so, and names your
   strongest holding. Hints only, no automation. */

function invWeakNotes(){
  const notes=[];const push=(s,t)=>notes.push({s,t});
  const apr=(typeof SAVE_APR!=='undefined')?SAVE_APR:0.038;

  /* minority stakes */
  const P=(typeof investPerf==='function')?investPerf():{h:[]};
  for(const x of (P.h||[])){
    const r=rivalById(x.rid);if(!r)continue;
    const gain=x.value-x.paid,pctg=x.paid?gain/x.paid:0,yld=x.value?x.monthly*12/x.value:0;
    const shrinking=r.trend<0;
    if(shrinking&&gain<0)
      push(3,'<b>'+esc(r.name)+'</b> is losing clients and your stake is down '+gbp(-gain)+' ('+Math.round(-pctg*100)+'%). The dividend tends to follow. You can sell from its card on the Market tab.');
    else if(shrinking)
      push(2,'<b>'+esc(r.name)+'</b> is shrinking. The stake is still up, but its value and the '+gbp(x.monthly)+'/mo dividend usually slide with the client base. Worth watching, or selling into strength.');
    else if(pctg<=-0.12)
      push(2,'Your stake in <b>'+esc(r.name)+'</b> is down '+gbp(-gain)+' ('+Math.round(-pctg*100)+'%).');
    else if(yld>0&&yld<apr&&gain<=0)
      push(1,'<b>'+esc(r.name)+'</b> yields about '+Math.round(yld*100)+'% and is not growing, less than the '+rpct(apr)+' cash earns on deposit. The money may work harder elsewhere.');
  }

  /* public shares */
  const sh=(S.co&&S.co.shares)||{};
  for(const rid in sh){
    const r=rivalById(rid);if(!r)continue;const u=sh[rid].units;if(!u)continue;
    const val=Math.round(u*sharePx(r)),paid=sh[rid].paid,gain=val-paid,pctg=paid?gain/paid:0;
    const px=r.pxDaily||[];const dir=(px.length>=6)?(px[px.length-1]-px[px.length-6]):(r.trend||0);
    if(pctg<=-0.2)
      push(3,'You are down '+gbp(-gain)+' ('+Math.round(-pctg*100)+'%) on <b>'+esc(r.name)+'</b>'+(dir<0?', and it is still sliding':'')+'. You can trim or exit it in the Markets panel under Shares.');
    else if(pctg<=-0.08)
      push(1,'<b>'+esc(r.name)+'</b> is down '+Math.round(-pctg*100)+'% on what you paid'+(dir<0?' and still falling':'')+'.');
    else if(dir<0&&gain>0)
      push(1,'<b>'+esc(r.name)+'</b> has turned down lately. Still in profit, but you might lock some of it in.');
  }

  /* short positions */
  const so=(S.co&&S.co.shorts)||{};
  for(const id in so){
    const r=rivalById(id);if(!r)continue;const s=so[id];const px=sharePx(r);
    const adverse=s.openPx?px/s.openPx-1:0;const pl=(typeof shortPL==='function')?shortPL(r,s):0;
    if(adverse>=0.4)
      push(3,'Your short on <b>'+esc(r.name)+'</b> is '+Math.round(adverse*100)+'% against you (P/L '+gbp(pl)+'). A margin call closes it at +60%. Consider covering in the Markets panel.');
    else if(pl<0&&adverse>=0.2)
      push(2,'Your short on <b>'+esc(r.name)+'</b> is underwater ('+gbp(pl)+') and moving the wrong way.');
  }

  /* idle cash */
  const sv=(typeof invSaveTotals==='function')?invSaveTotals():{bal:0,dep:0};
  if(sv.bal>=25000&&sv.dep<=sv.bal*0.25)
    push(0,gbp(Math.round(sv.bal))+' is sitting in instant savings. If you will not need it for a few months, a fixed-term deposit pays a little more.');

  notes.sort((a,b)=>b.s-a.s);
  return notes;
}

/* the strongest holding, for the all-clear case */
function invStrongest(){
  let best=null;
  const P=(typeof investPerf==='function')?investPerf():{h:[]};
  for(const x of (P.h||[])){if(x.paid<=0)continue;const p=(x.value-x.paid)/x.paid;if(!best||p>best.p)best={name:x.name,p};}
  const sh=(S.co&&S.co.shares)||{};
  for(const rid in sh){const r=rivalById(rid);if(!r||!sh[rid].units)continue;const paid=sh[rid].paid;if(paid<=0)continue;const val=sh[rid].units*sharePx(r);const p=(val-paid)/paid;if(!best||p>best.p)best={name:r.name,p};}
  return best;
}

function invNotesSec(){
  const riskHolds=((S.co&&S.co.shares&&Object.keys(S.co.shares).some(k=>S.co.shares[k].units>0))||
    ((typeof investPerf==='function')&&(investPerf().h||[]).length>0)||
    (S.co&&S.co.shorts&&Object.keys(S.co.shorts).length>0));
  const notes=invWeakNotes();
  if(!notes.length){
    if(!riskHolds)return '';
    const b=invStrongest();
    return '<div class="sec"><h3 style="font-size:.95rem">Worth a look</h3><p class="mut" style="font-size:.84rem;margin:0">Nothing in the portfolio looks weak right now'+(b&&b.p>0.05?'. Your strongest is <b>'+esc(b.name)+'</b>, up '+Math.round(b.p*100)+'%':'')+'.</p></div>';
  }
  const cls=s=>s>=3?'neg':s>=2?'wrn':'mut';
  const rows=notes.slice(0,4).map(n=>'<li class="item" style="grid-template-columns:1fr"><span class="sub '+cls(n.s)+'" style="font-size:.84rem;line-height:1.4">'+n.t+'</span></li>').join('');
  return '<div class="sec"><h3 style="font-size:.95rem">Worth a look</h3><p class="lede" style="margin:0 0 6px">Holdings that are losing money, slipping, or working too hard for too little. Hints, not instructions.</p><ul class="list">'+rows+'</ul></div>';
}

/* append the notes as a sibling section under the portfolio overview */
if(typeof invOverview==='function'){const _io=invOverview;invOverview=function(){let h=_io.apply(this,arguments);try{h+=invNotesSec();}catch(e){}return h;};}
