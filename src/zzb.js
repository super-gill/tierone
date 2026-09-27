
/* ============ build 91: active share market — daily prices, candles, chart box ============
   The national MSPs now trade daily: each firm's price moves a little every day
   around its underlying trend, recorded as a daily series. The market panel under
   the office floor plan is a proper trading view — a compact firm menu down the
   side and a full-size line or candle chart of the selected firm. A small dealing
   spread keeps the daily wobble from being a free money printer. */

const MKT_SPREAD=0.006;   /* dealing spread each way, so churning the daily noise isn't free money */

/* ---- ownership model: finite shares, a tradeable float, and price impact ---- */
const SHARES_OUT=1000000;    /* a national is split into a million shares, like a public float, so its price per share sits at the same scale as your own float; ownership % = units / SHARES_OUT */
const IMPACT_K=0.6;       /* holding the whole float lifts the price ~60% (a real control premium) */
const DEF_FLOAT=0.70;     /* the freely traded fraction; the rest sits with insiders until a takeover */
const DISCLOSE=0.30, CONTROL=0.50, SQUEEZE_PREM=0.15;
function floatOf(r){if(r&&r.float==null)r.float=+(0.62+Math.random()*0.16).toFixed(3);return (r&&r.float)||DEF_FLOAT;}
/* the float actually reachable on the market: the board's buybacks (phase 2) shrink it */
function effFloat(r){const cut=(r&&r.def&&r.def.bought)||0;const f=floatOf(r)-cut;return (typeof clamp==='function')?clamp(f,0.28,1):Math.max(0.28,f);}
/* a triggered poison pill (phase 2) makes the remaining shares punishingly dear */
function pillMult(r){return (r&&r.def&&r.def.pill)?1.5:1;}
function ownUnits(rid){const h=S.co&&S.co.shares&&S.co.shares[rid];return h?h.units:0;}
/* whole-firm value: the undisturbed price (your own scarcity premium stripped out) times all the shares */
function firmCap(r){if(!r)return 0;const imp=shareImpact(r)||1;return Math.round(sharePx(r)/imp*SHARES_OUT);}
function ownFrac(r){return r?ownUnits(r.id)/SHARES_OUT:0;}
/* the more of the float you hold, the scarcer and dearer the shares get */
function shareImpact(r){if(!r)return 1;const f=effFloat(r);const held=(typeof clamp==='function'?clamp(ownUnits(r.id)/(SHARES_OUT*f),0,1):0);return (1+IMPACT_K*held+(r.disclosed?0.06:0))*pillMult(r);}

/* the live price: monthly fundamental (size x mood) x daily tick x your scarcity premium */
if(typeof sharePx==='function'){const _sharePx0=sharePx;sharePx=function(r){return Math.max(0.01,Math.round(_sharePx0(r)*((r&&r.shareTick)||1)*shareImpact(r)*100)/100);};}

/* daily market: each national's price random-walks around its fundamental, recorded day by day */
function marketDaily(){
  if(typeof natFirms!=='function')return;
  for(const r of natFirms()){
    let t=(r.shareTick||1);
    t+=(1-t)*0.04;                              // gentle mean reversion to the fundamental
    t*=1+(typeof rnd==='function'?rnd(-0.03,0.03):(Math.random()*2-1)*0.03);   // ~3% daily noise
    if(Math.random()<0.03)t*=1+(Math.random()*2-1)*0.09;                        // the odd bigger move
    r.shareTick=(typeof clamp==='function')?clamp(t,0.72,1.38):Math.max(0.72,Math.min(1.38,t));
    const px=sharePx(r);
    (r.pxDaily=r.pxDaily||[]).push(px);
    if(r.pxDaily.length>280)r.pxDaily.shift();              // ~1 year of daily detail
    // once a month, roll the month's daily prices into a monthly OHLC candle for the long views
    if(S.day%DPM===0){const month=r.pxDaily.slice(-DPM);if(month.length){(r.pxMonthlyC=r.pxMonthlyC||[]).push({o:month[0],h:Math.max.apply(null,month),l:Math.min.apply(null,month),c:month[month.length-1]});if(r.pxMonthlyC.length>150)r.pxMonthlyC.shift();}}
  }
}
/* the timeframes offered on the chart; short ones read daily detail, long ones the monthly candles */
const TFS=[
  {k:'1M',t:'1M',src:'daily',days:21,per:1},
  {k:'3M',t:'3M',src:'daily',days:63,per:2},
  {k:'6M',t:'6M',src:'daily',days:126,per:3},
  {k:'1Y',t:'1Y',src:'daily',days:280,per:5},
  {k:'5Y',t:'5Y',src:'monthly',months:60},
  {k:'ALL',t:'All',src:'monthly'}
];
function resolveTF(){const k=(S.co&&S.co.mktTF)||'6M';return TFS.find(t=>t.k===k)||TFS[2];}
/* resolve the selected timeframe into line points and candles for a firm */
function chartData(r){
  const tf=resolveTF();
  if(tf.src==='monthly'){let mc=(r.pxMonthlyC||[]).slice();if(tf.months)mc=mc.slice(-tf.months);
    if(mc.length>=2)return {linePts:mc.map(c=>c.c),candles:mc};}
  const d=(r.pxDaily||[]).slice(tf.days?-tf.days:0);const series=d.length?d:mktSeries(r);
  return {linePts:series,candles:mktCandles(series,(tf.per||3),90)};
}
if(typeof peopleDaily==='function'){const _pd=peopleDaily;peopleDaily=function(W){_pd.apply(this,arguments);try{marketDaily();}catch(e){}};}

/* a firm's daily price series, guaranteed to hold at least the current price */
function mktSeries(r){const px=sharePx(r);const s=(r&&r.pxDaily&&r.pxDaily.length)?r.pxDaily.slice():[px];if(s[s.length-1]!==px)s.push(px);return s;}
function pxChange(s,back){if(!s||s.length<2)return 0;const base=s.length>back?s[s.length-1-back]:s[0];const last=s[s.length-1];return base?(last-base)/base:0;}

/* ---- dealing: spread, a float cap, and disclosure at 30% ---- */
ACT_EXT.shareBuy=v=>{const [rid,amt]=(v||'').split(':');const r=rivalById(rid);if(!r||r.tier<3)return;
  const maxU=Math.floor(SHARES_OUT*effFloat(r));const cur=ownUnits(rid);
  if(cur>=maxU){if(typeof toast==='function')toast('You already hold all the freely traded shares. Take control to force out the rest.');return;}
  const px=Math.max(0.01,Math.round(sharePx(r)*(1+MKT_SPREAD)*100)/100);const a=+amt;if(!a||a<px)return;
  let u=Math.floor(Math.min(a,S.co.cash)/px);if(u<1)return;u=Math.min(u,maxU-cur);if(u<1)return;const cost=u*px;
  S.co.cash-=cost;S.co.shares=S.co.shares||{};const hd=S.co.shares[rid]||{units:0,paid:0};hd.units+=u;hd.paid+=cost;S.co.shares[rid]=hd;
  log('Bought '+u.toLocaleString()+' shares in '+r.name+' at '+spx(px)+' for '+gbp(cost)+'. You hold '+Math.round(ownFrac(r)*100)+'% now.','info');
  if(!r.disclosed&&ownFrac(r)>=DISCLOSE){r.disclosed=S.day;log('You’ve passed '+Math.round(DISCLOSE*100)+'% of '+r.name+' and had to disclose the holding. The market smells a bid and the price has firmed.','event');}
};
/* selling gets you the fundamental price, never your own scarcity premium — so pumping a stake
   and dumping it always loses (you only make money if the firm has genuinely grown) */
ACT_EXT.shareSell=v=>{const parts=String(v==null?'':v).split(':');const rid=parts[0],nStr=parts[1];const r=rivalById(rid);const hd=S.co.shares&&S.co.shares[rid];if(!r||!hd||!hd.units)return;
  const imp=shareImpact(r)||1;const basePx=Math.max(0.01,Math.round(sharePx(r)/imp*100)/100);   /* price with premiums stripped out */
  const px=Math.max(0.01,Math.round(basePx*(1-MKT_SPREAD)*100)/100);
  let units=(nStr!==undefined&&nStr!=='')?Math.min(hd.units,Math.max(1,Math.floor(+nStr||0))):hd.units;   /* a count sells part; no count sells all */
  if(units<1)return;
  const val=units*px;S.co.cash+=val;S.m.setup=(S.m.setup||0)+val;S.co.capYr=(S.co.capYr||0)+val;
  const paidBack=Math.round(hd.paid*(units/hd.units));hd.units-=units;hd.paid=Math.max(0,hd.paid-paidBack);   /* keep the cost basis on what's left */
  const pctSold=Math.round(units/SHARES_OUT*100);const soldOut=hd.units<=0;if(soldOut)delete S.co.shares[rid];
  log('Sold '+units.toLocaleString()+' share'+(units===1?'':'s')+' ('+pctSold+'%) of '+r.name+' at '+spx(px)+' for '+gbp(val)+'.'+(soldOut?'':' You still hold '+Math.round(hd.units/SHARES_OUT*100)+'%.'),'info');};

/* ---- taking control: buy out the rest and fold the firm into your group ---- */
function takeoverElig(r){return r&&ownFrac(r)>=CONTROL;}
function takeoverCost(r){const hd=S.co.shares&&S.co.shares[r.id];const remaining=SHARES_OUT-((hd&&hd.units)||0);return Math.round(remaining*sharePx(r)*(1+SQUEEZE_PREM));}
function foldNational(r){
  const clients=Math.max(1,Math.round(r.clients||1));
  const seatsPer=(typeof MKT_TIERS!=='undefined'&&MKT_TIERS[r.tier])?MKT_TIERS[r.tier].seats:15;
  const seats=(typeof rSeats==='function')?rSeats(r):clients*seatsPer;
  const monthly=seats*45*0.9;const perClient=monthly/clients;
  const need=Math.max(1,Math.round(seats/(typeof BR_TECH_PER!=='undefined'?BR_TECH_PER:130)*1.05));
  const b={id:uid(),name:r.name,rid:r.id,region:'home',clients,price:1,price0:0.98,perClient,seatsPer,
    mgr:{name:pick(FIRST)+' '+pick(LAST),skill:ri(3,5),salary:Math.round(rnd(4500,6500)/10)*10},
    staff:need,invest:false,grow:1,sat:66,born:S.day,cash:0,hist:[],national:true};
  if(typeof branches==='function')branches().push(b);
  if(S.mkt)S.mkt.r=S.mkt.r.filter(x=>x.id!==r.id);
  return b;
}
ACT_EXT.takeoverGo=v=>{const r=rivalById(v);if(!r||!takeoverElig(r))return;
  const cost=takeoverCost(r);
  if(S.co.cash-cost< -(typeof OD_LIMIT!=='undefined'?OD_LIMIT:10000)){if(typeof toast==='function')toast('You can’t cover the '+gbp(cost)+' to buy out the remaining shareholders.');return;}
  S.co.cash-=cost;S.co.acq=(S.co.acq||0)+cost;delete S.co.shares[r.id];
  foldNational(r);S.co.rep=Math.min(100,(S.co.rep||50)+3);
  log('You’ve taken control of '+r.name+', bought out the last shareholders for '+gbp(cost)+', and folded it into your group as a subsidiary.','event');
  ui.modal=null;};

/* ---- inline SVG sparkline (no text, safe to stretch) ---- */
function sparkSVG(hist,w,h){
  w=w||64;h=h||22;const pts=(hist||[]).slice(-40);
  if(pts.length<2)return '<svg class="spark" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" aria-hidden="true"><line x1="1" y1="'+(h/2)+'" x2="'+(w-1)+'" y2="'+(h/2)+'" stroke="var(--line)" stroke-width="1.5"/></svg>';
  let lo=Math.min.apply(null,pts),hi=Math.max.apply(null,pts);if(hi===lo)hi=lo+1;
  const pad=2,X=i=>pad+i*(w-2*pad)/(pts.length-1),Y=v=>pad+(hi-v)/(hi-lo)*(h-2*pad);
  const d=pts.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)).join(' ');
  const up=pts[pts.length-1]>=pts[0],col=up?'var(--good)':'var(--bad)';
  return '<svg class="spark" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" aria-hidden="true"><path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>';
}

/* ---- line-chart SVG for the buy window ---- */
function priceChartSVG(series,cost){
  const pts=(series||[]).slice(-90);const w=320,h=120;
  if(pts.length<2)return '<p class="mut" style="font-size:.8rem;margin:4px 0 10px">The price chart fills in as the market trades day by day.</p>';
  let lo=Math.min.apply(null,pts),hi=Math.max.apply(null,pts);
  const hasCost=typeof cost==='number'&&cost>0;
  if(hasCost){lo=Math.min(lo,cost);hi=Math.max(hi,cost);}
  if(hi===lo)hi=lo+1;
  const padL=46,padR=8,padT=8,padB=8,X=i=>padL+i*(w-padL-padR)/(pts.length-1),Y=v=>padT+(hi-v)/(hi-lo)*(h-padT-padB);
  const d=pts.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)).join(' ');
  const up=pts[pts.length-1]>=pts[0],col=up?'var(--good)':'var(--bad)';
  let grid='';for(let i=0;i<=2;i++){const v=lo+(hi-lo)*i/2,y=Y(v);grid+='<line x1="'+padL+'" y1="'+y.toFixed(1)+'" x2="'+(w-padR)+'" y2="'+y.toFixed(1)+'" stroke="var(--line)" stroke-width="1"/><text x="2" y="'+(y+3).toFixed(1)+'" font-size="9" fill="var(--muted)">'+(hi<1000?'£'+v.toFixed(2):gbp(Math.round(v)))+'</text>';}
  let costEl='';
  if(hasCost){const cy=Y(cost);const inProfit=pts[pts.length-1]>=cost;const ccol=inProfit?'var(--good)':'var(--bad)';
    costEl='<line x1="'+padL+'" y1="'+cy.toFixed(1)+'" x2="'+(w-padR)+'" y2="'+cy.toFixed(1)+'" stroke="var(--muted)" stroke-width="1" stroke-dasharray="4 3"/><text x="'+(w-padR)+'" y="'+(cy-3).toFixed(1)+'" font-size="9" text-anchor="end" fill="'+ccol+'">paid '+(cost<1000?'£'+cost.toFixed(2):gbp(Math.round(cost)))+'</text>';}
  return '<svg width="100%" viewBox="0 0 '+w+' '+h+'" style="max-width:340px;height:auto;display:block" role="img" aria-label="Share price history">'+grid+costEl+'<path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="2" stroke-linejoin="round"/><circle cx="'+X(pts.length-1).toFixed(1)+'" cy="'+Y(pts[pts.length-1]).toFixed(1)+'" r="2.5" fill="'+col+'"/></svg>';
}

/* ---- group a daily series into OHLC candles ---- */
function mktCandles(daily,per,maxC){
  const out=[];for(let end=daily.length;end>0;end-=per){const chunk=daily.slice(Math.max(0,end-per),end);if(!chunk.length)continue;
    out.unshift({o:chunk[0],c:chunk[chunk.length-1],h:Math.max.apply(null,chunk),l:Math.min.apply(null,chunk)});if(out.length>=maxC)break;}
  return out;
}
/* ---- the full-size canvas chart (line or candle), sized to its box ---- */
function drawMktChart(cv,r){
  if(!cv||!r||!V.col)return;const K=V.col;
  const dpr=window.devicePixelRatio||1,w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;
  cv.width=w*dpr;cv.height=h*dpr;const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
  const type=(S.co&&S.co.mktChart)==='candle'?'candle':'line';
  const data=chartData(r);const padL=48,padR=10,padT=10,padB=8;
  let lo,hi,candles=null,pts=null;
  if(type==='candle'){candles=data.candles;if(!candles.length)candles=[{o:sharePx(r),h:sharePx(r),l:sharePx(r),c:sharePx(r)}];let a=[];candles.forEach(k=>{a.push(k.h,k.l);});lo=Math.min.apply(null,a);hi=Math.max.apply(null,a);}
  else{pts=data.linePts.length?data.linePts:[sharePx(r)];lo=Math.min.apply(null,pts);hi=Math.max.apply(null,pts);}
  if(!(hi>lo))hi=lo+1;
  const hd=S.co&&S.co.shares&&S.co.shares[r.id];const costPx=(hd&&hd.units>0)?hd.paid/hd.units:0;
  if(costPx>0){lo=Math.min(lo,costPx);hi=Math.max(hi,costPx);}
  const pv=(hi-lo)*0.08;lo-=pv;hi+=pv;
  const Y=v=>padT+(hi-v)/(hi-lo)*(h-padT-padB);
  c.font='10px '+(K.mono||'monospace');c.textAlign='left';c.lineWidth=1;
  for(let i=0;i<=3;i++){const v=lo+(hi-lo)*i/3,y=Y(v);c.strokeStyle=K.line;c.beginPath();c.moveTo(padL,y);c.lineTo(w-padR,y);c.stroke();c.fillStyle=K.muted;c.fillText(hi<1000?'£'+v.toFixed(2):gbp(Math.round(v)),2,y+3);}
  if(costPx>0){const cy=Y(costPx);const inProfit=sharePx(r)>=costPx;c.save();c.strokeStyle=K.muted;c.setLineDash([4,3]);c.lineWidth=1;c.beginPath();c.moveTo(padL,cy);c.lineTo(w-padR,cy);c.stroke();c.setLineDash([]);c.fillStyle=inProfit?K.good:K.bad;c.textAlign='right';c.fillText('paid '+(costPx<1000?'£'+costPx.toFixed(2):gbp(Math.round(costPx))),w-padR,cy-3);c.textAlign='left';c.restore();}
  if(type==='candle'){
    const n=candles.length||1,bw=Math.max(2,(w-padL-padR)/n*0.6);
    candles.forEach((k,i)=>{const x=padL+(i+0.5)*(w-padL-padR)/n,up=k.c>=k.o,col=up?K.good:K.bad;
      c.strokeStyle=col;c.fillStyle=col;c.beginPath();c.moveTo(x,Y(k.h));c.lineTo(x,Y(k.l));c.stroke();
      const yo=Y(k.o),yc=Y(k.c),top=Math.min(yo,yc),bh=Math.max(1.5,Math.abs(yc-yo));c.fillRect(x-bw/2,top,bw,bh);});
  }else{
    const X=i=>padL+i*(w-padL-padR)/Math.max(1,pts.length-1),up=pts[pts.length-1]>=pts[0];
    c.strokeStyle=up?K.good:K.bad;c.lineWidth=2;c.beginPath();pts.forEach((v,i)=>{const X_=X(i),Y_=Y(v);i?c.lineTo(X_,Y_):c.moveTo(X_,Y_);});c.stroke();
    c.fillStyle=c.strokeStyle;c.beginPath();c.arc(X(pts.length-1),Y(pts[pts.length-1]),2.5,0,7);c.fill();
  }
}

/* ---- the shared market listing for the Investments tab ---- */
function marketRowsHTML(){
  const nats=(typeof natFirms==='function')?natFirms():[];const sh=(S.co&&S.co.shares)||{};
  if(!nats.length)return '<p class="empty">No national-scale firms are listed right now.</p>';
  return '<ul class="list mkt-list">'+nats.map(r=>{
    const px=sharePx(r),series=mktSeries(r),hd=sh[r.id],mine=hd?hd.units*px:0,gain=hd?mine-hd.paid:0,chg=pxChange(series,30);
    const arrow=chg>0.002?'<span class="pos">▲</span>':chg<-0.002?'<span class="neg">▼</span>':'<span class="mut">–</span>';
    return '<li class="item mkt-row" style="align-items:center;gap:8px">'+
      '<span style="min-width:0;flex:1"><b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(r.name)+'</b><span class="mut" style="font-size:.75rem">'+spx(px)+' '+arrow+' <span class="'+(chg>=0?'pos':'neg')+'">'+(chg>=0?'+':'')+Math.round(chg*100)+'%</span> 30d</span></span>'+
      sparkSVG(series,64,22)+
      (hd?'<span class="r" style="font-size:.78rem;line-height:1.25">'+gbp(mine)+'<br><span class="'+(gain>=0?'pos':'neg')+'">'+(gain>=0?'+':'')+gbp(gain)+'</span> <span class="mut">'+Math.round(hd.units/SHARES_OUT*100)+'%</span></span>':'')+
      '<span class="row" style="gap:4px">'+
        '<button class="btn sm" data-act="shareBuyAsk" data-v="'+r.id+'" '+(S.co.cash>=px?'':'disabled')+'>Buy</button>'+
        (hd?'<button class="btn sm danger" data-act="shareSellAsk" data-v="'+r.id+'">Sell</button>':'')+
      '</span></li>';
  }).join('')+'</ul>';
}

/* ---- Investments-tab shares section: a performance summary (trading lives in the market dock) ---- */
paneInvestShares=function(){
  const sh=(S.co&&S.co.shares)||{};const rows=[];let val=0,paid=0;
  for(const rid in sh){const r=rivalById(rid);if(!r||!sh[rid].units)continue;const v=sh[rid].units*sharePx(r);val+=v;paid+=sh[rid].paid;rows.push({r,units:sh[rid].units,v,cost:sh[rid].paid});}
  let h='<div class="sec"><h3 style="font-size:.95rem">Public share holdings</h3><p class="lede">Your positions in the listed national MSPs. Trade them, watch the charts and build toward a takeover in the Markets panel under the office floor plan.</p>';
  if(!rows.length)return h+'<p class="empty">You hold no shares. The national MSPs trade live in the Markets panel under the office floor plan — buy in to ride their growth, and once you pass 50% you can take a firm over outright.</p></div>';
  const pl=val-paid;
  h+='<div class="tiles"><div class="tile"><span class="k">Value</span><span class="v">'+gbp(val)+'</span><small>'+rows.length+' holding'+(rows.length===1?'':'s')+'</small></div>'+
    '<div class="tile"><span class="k">Invested</span><span class="v">'+gbp(paid)+'</span><small>cost of your stakes</small></div>'+
    '<div class="tile"><span class="k">Unrealised</span><span class="v '+(pl>=0?'pos':'neg')+'">'+(pl>=0?'+':'')+gbp(pl)+'</span><small>'+(paid?(pl>=0?'+':'')+Math.round(pl/paid*100)+'% on cost':'')+'</small></div></div>';
  h+='<table style="margin-top:10px"><thead><tr><th>Firm</th><th class="r">Owned</th><th class="r">Value</th><th class="r">P/L</th><th class="r">Status</th></tr></thead><tbody>'+
    rows.sort((a,b)=>b.v-a.v).map(o=>{const f=o.units/SHARES_OUT,g=o.v-o.cost,gp=o.cost?g/o.cost:0;
      const status=f>=CONTROL?'<span class="pos">control ready</span>':f>=DISCLOSE?'<span class="wrn">disclosed</span>':'<span class="mut">building</span>';
      return '<tr><td>'+esc(o.r.name)+'</td><td class="r">'+Math.round(f*100)+'%</td><td class="r">'+gbp(o.v)+'</td><td class="r '+(g>=0?'pos':'neg')+'">'+(g>=0?'+':'')+gbp(g)+' <span class="mut">'+(gp>=0?'+':'')+Math.round(gp*100)+'%</span></td><td class="r">'+status+'</td></tr>';}).join('')+
    '</tbody></table>';
  return h+'</div>';
};

/* ---- line chart inside the share buy window ---- */
if(typeof MODAL_EXT!=='undefined'&&MODAL_EXT.amt){const _amt=MODAL_EXT.amt;MODAL_EXT.amt=(M,x)=>{let h=_amt(M,x);
  if(h&&M&&M.kind==='shareBuy'){const r=rivalById(M.rid);if(r){const f=ownFrac(r),cap=floatOf(r);
    const note='<p class="mut" style="font-size:.8rem;margin:0 0 6px">Market cap about <b>'+gbp(firmCap(r))+'</b>. '+(f>0?'You own <b>'+Math.round(f*100)+'%</b>. ':'')+'The tradeable float is about '+Math.round(cap*100)+'%; past 30% you must disclose, at 50% you can take control. Dealing carries a small spread and heavy buying lifts the price.</p>';
    h=h.replace('<div class="field">','<div class="mkt-chart">'+priceChartSVG(mktSeries(r))+'</div>'+note+'<div class="field">');}}
  return h;};}

/* ---- the market dock: collapsed ticker, or the full trading view ---- */
ACT_EXT.mktToggle=()=>{if(S&&S.co)S.co.mktOpen=!S.co.mktOpen;};
ACT_EXT.mktSel=v=>{if(S&&S.co)S.co.mktSel=v;};
ACT_EXT.mktTab=v=>{if(S&&S.co)S.co.mktTab=v;};
ACT_EXT.mktChart=v=>{if(S&&S.co)S.co.mktChart=(v==='candle')?'candle':'line';};
ACT_EXT.mktTF=v=>{if(S&&S.co&&TFS.some(t=>t.k===v))S.co.mktTF=v;};
function renderMarketDock(){
  const el=(typeof $==='function')&&$('marketDock');if(!el)return;
  if(!S||S.intro||S.over){el.hidden=true;el.innerHTML='';return;}
  const open=!!(S.co&&S.co.mktOpen),nats=(typeof natFirms==='function')?natFirms():[],held=S.co.shares?Object.keys(S.co.shares).length:0;
  let sel=S.co&&S.co.mktSel;if(open&&nats.length&&!nats.some(r=>r.id===sel)){sel=nats[0].id;if(S.co)S.co.mktSel=sel;}
  const chart=(S.co&&S.co.mktChart)==='candle'?'candle':'line';
  const tab=(S.co&&S.co.mktTab)||'overview';
  /* hold the view steady between frames at high speed unless something changed */
  const sig=open+'|'+tab+'|'+sel+'|'+chart+'|'+held+'|'+nats.length+'|'+((S.co&&S.co.mktTF)||'6M')+'|'+((S.co&&S.co.shorts)?Object.keys(S.co.shorts).length:0)+'|'+((S.co&&S.co.savings)||0)+'|'+((S.co&&S.co.bonds)?S.co.bonds.length:0)+'|'+((S.co&&S.co.stakeSel)||'')+'|'+(typeof stakedFirms==='function'?stakedFirms().length:0)+'|'+(S.deals?S.deals.length:0)+'|'+((typeof tenders==='function'&&tenders().open)?tenders().open.length:0)+'|'+((typeof oppTenderAlert==='function'&&oppTenderAlert())?1:0)+'|'+((typeof oppPipeAlert==='function'&&oppPipeAlert())?1:0);
  const now=(typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();
  if(open&&V.speed>4&&V._mktSig===sig&&now-(V._mktAt||0)<130){return;}
  V._mktSig=sig;V._mktAt=now;
  const menuEl0=el.querySelector('#mktMenu');const mTop=menuEl0?menuEl0.scrollTop:0;
  const paneEl0=el.querySelector('.mkt-pane');const pTop=paneEl0?paneEl0.scrollTop:0;   /* keep the scrolled position across the daily re-render */
  el.hidden=false;el.classList.toggle('open',open);
  const mover=nats.slice().sort((a,b)=>Math.abs(b.trend||0)-Math.abs(a.trend||0))[0];
  const shortN=(S.co&&S.co.shorts)?Object.keys(S.co.shorts).length:0;
  const tAlert=(typeof oppTenderAlert==='function')&&oppTenderAlert();
  const oAlert=(typeof oppPipeAlert==='function')&&oppPipeAlert();
  const DOT='<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--bad);margin-left:5px;vertical-align:middle"></span>';
  let h='<div class="mkt-head"><button class="mkt-toggle" data-act="mktToggle" aria-expanded="'+open+'"><span class="mkt-caret">'+(open?'▾':'▸')+'</span> <b>Markets</b>'+(!open&&(tAlert||oAlert)?DOT:'')+' <span class="mut">'+nats.length+' listed'+(held?' · '+held+' held':'')+'</span>'+(shortN?' <span class="neg" style="font-weight:600">· '+shortN+' short open</span>':'')+'</button>';
  if(!open&&mover){const px=sharePx(mover);h+='<span class="mkt-tick">'+esc(mover.name.split(' ')[0])+' <span class="mut">'+spx(px)+'</span> '+(mover.trend>0?'<span class="pos">▲</span>':mover.trend<0?'<span class="neg">▼</span>':'')+'</span>';}
  h+='</div>';
  if(open){
    const tabs=[['overview','Overview'],['tenders','Tenders'],['opps','Opportunities'],['shares','Shares'],['stakes','Stakes'],['savings','Savings'],['shorts','Shorts']];
    if(typeof isPublic==='function'&&isPublic())tabs.push(['company','Company']);
    h+='<div class="mkt-tabs">'+tabs.map(t=>'<button data-act="mktTab" data-v="'+t[0]+'" aria-pressed="'+(tab===t[0])+'">'+t[1]+((t[0]==='tenders'&&tAlert)||(t[0]==='opps'&&oAlert)?DOT:'')+'</button>').join('')+'</div>';
   if(tab==='stakes'){
    h+=(typeof invStakes==='function'?invStakes():'');
   } else if(tab!=='shares'){
    const body=tab==='overview'?((typeof invOverview==='function'?invOverview():'')+(typeof invNotesSec==='function'?invNotesSec():'')):tab==='tenders'?(typeof invTenders==='function'?invTenders():''):tab==='opps'?(typeof invOpps==='function'?invOpps():''):tab==='savings'?(typeof paneInvestSavings==='function'?paneInvestSavings():''):tab==='shorts'?(typeof invShorts==='function'?invShorts():''):tab==='company'?(typeof invCompany==='function'?invCompany():''):'';
    h+='<div class="mkt-pane">'+body+'</div>';
   } else if(!nats.length){
    h+='<div class="mkt-pane"><p class="empty">No national-scale firms are listed right now. Your other holdings are in the tabs above.</p></div>';
   } else {
    const menu=nats.map(r=>{const px=sharePx(r),series=mktSeries(r),chg=pxChange(series,5);
      const ar=chg>0.002?'<span class="pos">▲</span>':chg<-0.002?'<span class="neg">▼</span>':'<span class="mut">–</span>';
      const owned=!!(S.co.shares&&S.co.shares[r.id]&&S.co.shares[r.id].units>0);
      return '<button class="mkt-mi'+(r.id===sel?' sel':'')+(owned?' held':'')+'" data-act="mktSel" data-v="'+r.id+'"><b>'+(owned?'● ':'')+esc(r.name)+'</b><span class="mkt-mi-l">'+spx(px)+' '+ar+' '+sparkSVG(series,44,14)+'</span></button>';}).join('');
    const selR=rivalById(sel),px=sharePx(selR),series=mktSeries(selR),chgD=pxChange(series,5),hd=S.co.shares&&S.co.shares[sel];
    const head='<div class="mkt-cap"><span style="min-width:0;flex:1"><b>'+esc(selR.name)+'</b> <span class="mut">'+spx(px)+'</span> <span class="'+(chgD>=0?'pos':'neg')+'" style="font-size:.8rem">'+(chgD>=0?'+':'')+Math.round(chgD*100)+'%</span> <span class="mut" style="font-size:.76rem">· '+gbp(firmCap(selR))+' cap</span>'+(hd?' <span class="mut" style="font-size:.76rem">· '+gbp(hd.units*px)+' held</span>':'')+'</span>'+
      '<span class="seg mkt-seg"><button data-act="mktChart" data-v="line" aria-pressed="'+(chart==='line')+'">Line</button><button data-act="mktChart" data-v="candle" aria-pressed="'+(chart==='candle')+'">Candle</button></span>'+
      '<button class="btn sm" data-act="shareBuyAsk" data-v="'+sel+'" '+(S.co.cash>=px?'':'disabled')+'>Buy</button>'+(hd?'<button class="btn sm danger" data-act="shareSellAsk" data-v="'+sel+'">Sell</button>':'')+
      ((typeof shortOf==='function'&&shortOf(sel))?'<button class="btn sm" data-act="shortClose" data-v="'+sel+'">Cover</button>':'<button class="btn sm" data-act="shortAsk" data-v="'+sel+'">Short</button>')+'</div>';
    const f=ownFrac(selR),ctrlEl=takeoverElig(selR);
    const own=hd?'<div class="mkt-own"><span class="mut">You own <b class="'+(f>=CONTROL?'pos':'')+'">'+Math.round(f*100)+'%</b></span>'+
      '<div class="mkt-bar" title="30% must be disclosed, 50% takes control"><i style="width:'+Math.round((typeof clamp==='function'?clamp(f,0,1):f)*100)+'%"></i><u style="left:'+Math.round(DISCLOSE*100)+'%"></u><u style="left:'+Math.round(CONTROL*100)+'%"></u></div>'+
      (ctrlEl?'<button class="btn sm primary" data-act="takeoverGo" data-v="'+sel+'" title="Buy out the rest at '+gbp(takeoverCost(selR))+' and fold it into your group">Take control</button>':'<span class="mut" style="font-size:.72rem;white-space:nowrap">'+(f>=DISCLOSE?'disclosed · ':'')+'50% to control</span>')+'</div>':'';
    const curTF=(S.co&&S.co.mktTF)||'6M';
    const tfRow='<div class="mkt-tf">'+TFS.map(t=>'<button data-act="mktTF" data-v="'+t.k+'" aria-pressed="'+(curTF===t.k)+'">'+t.t+'</button>').join('')+'</div>';
    const defs=(typeof defNote==='function')?defNote(selR):'';
    const shn=(typeof shortNote==='function')?shortNote(selR):'';
    const agit=(f>=DISCLOSE&&f<CONTROL)?'<div class="row" style="margin:0 0 5px"><button class="btn sm" data-act="activist" data-v="'+sel+'" title="Push the board for a special dividend or a shake-up">Agitate the board</button></div>':'';
    h+='<div class="mkt-body"><div id="mktMenu" class="mkt-menu">'+menu+'</div><div class="mkt-main">'+head+own+defs+shn+agit+tfRow+'<canvas id="mktCanvas" class="mkt-cv" aria-label="Share price chart"></canvas></div></div>';
   }
  }
  el.innerHTML=h;
  if(open){const me=el.querySelector('#mktMenu');if(me)me.scrollTop=mTop;const pe=el.querySelector('.mkt-pane');if(pe&&pTop)pe.scrollTop=pTop;const cv=el.querySelector('#mktCanvas');if(cv){try{drawMktChart(cv,rivalById(sel));}catch(e){}}}
}
if(typeof renderTop==='function'){const _rt=renderTop;renderTop=function(){_rt.apply(this,arguments);try{renderMarketDock();}catch(e){}};}

/* ---- a listed rival's card points you at the share market instead of a private stake/offer ---- */
ACT_EXT.mktGoto=v=>{const r=rivalById(v);if(!r||r.tier<3)return;if(S.co){S.co.mktSel=v;S.co.mktOpen=true;}ui.modal=null;if(typeof toast==='function')toast('Trading '+r.name+' in the Markets panel, under the office floor plan.');};
if(typeof MODAL_EXT!=='undefined'&&MODAL_EXT.rival){const _rv=MODAL_EXT.rival;MODAL_EXT.rival=(M,x)=>{let h=_rv(M,x);if(h===null||!h)return h;const r=rivalById(M.id);
  if(r&&r.tier>=3){const own=ownFrac(r);const note='<div class="note" style="margin:12px 0 2px"><b>'+esc(r.name)+' is publicly listed.</b> You take a position in it on the open market, not by private offer'+(own>0?' — you hold <b>'+Math.round(own*100)+'%</b> so far':'')+'. Build a stake and, past 50%, take it over.<div class="row" style="margin-top:6px"><button class="btn sm primary" data-act="mktGoto" data-v="'+r.id+'">Trade its shares</button></div></div>';
    const anchor='<h3 style="font-size:.95rem;margin:14px 0 4px">Above board</h3>';
    if(h.indexOf(anchor)>=0)h=h.replace(anchor,note+anchor);}
  return h;};}
