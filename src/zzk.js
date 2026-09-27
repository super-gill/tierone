
/* ============ build 109: a live daily market for the firms you hold a stake in ============
   Public nationals already have a daily-walking share price with charts and timeframes.
   Minority stakes were valued in monthly steps off the firm's size. This gives each staked
   firm the same treatment: a daily sentiment walk around its fundamental value, a daily
   price series and monthly candles, a chart with timeframes, and a live value that selling
   and the portfolio both use. Buying is still at the fundamental (no way to move a private
   valuation by buying more of a fixed 20%). */

/* fundamental stake value, wobbled by a daily sentiment tick */
function stakeValLive(r){const base=(typeof stakePrice==='function')?stakePrice(r):0;return Math.max(500,Math.round(base*((r&&r.stakeTick)||1)/100)*100);}
function stakedFirms(){return (typeof rivals==='function')?rivals().filter(r=>r.stake):[];}

/* daily: walk each staked firm's sentiment, record the value, roll a monthly candle */
function stakesDaily(){
  for(const r of stakedFirms()){
    if(r.stakeTick==null){r.stakeTick=1;}
    let t=r.stakeTick;
    t+=(1-t)*0.04;                                                                   // mean-revert to fundamental
    t*=1+(typeof rnd==='function'?rnd(-0.025,0.025):(Math.random()*2-1)*0.025);      // daily noise
    if(Math.random()<0.03)t*=1+(Math.random()*2-1)*0.08;                             // the odd bigger move
    r.stakeTick=(typeof clamp==='function')?clamp(t,0.7,1.4):Math.max(0.7,Math.min(1.4,t));
    const v=stakeValLive(r);
    (r.stakeD=r.stakeD||[]).push(v);if(r.stakeD.length>280)r.stakeD.shift();
    if(S.day%DPM===0){const m=r.stakeD.slice(-DPM);if(m.length){(r.stakeMC=r.stakeMC||[]).push({o:m[0],h:Math.max.apply(null,m),l:Math.min.apply(null,m),c:m[m.length-1]});if(r.stakeMC.length>150)r.stakeMC.shift();}}
  }
}
if(typeof peopleDaily==='function'){const _pd=peopleDaily;peopleDaily=function(W){_pd.apply(this,arguments);try{stakesDaily();}catch(e){}};}

function stakeSeries(r){const v=stakeValLive(r);const s=(r&&r.stakeD&&r.stakeD.length)?r.stakeD.slice():[v];if(s[s.length-1]!==v)s.push(v);return s;}
function stakeChartData(r){const tf=(typeof resolveTF==='function')?resolveTF():{src:'daily',days:126};
  if(tf.src==='monthly'){let mc=(r.stakeMC||[]).slice();if(tf.months)mc=mc.slice(-tf.months);if(mc.length>=2)return mc.map(c=>c.c);}
  const d=(r.stakeD||[]).slice(tf.days?-tf.days:0);return d.length?d:stakeSeries(r);}

/* seed a little history when a stake is bought, so the chart isn't blank */
function seedStakeHist(r){if(!r||!r.stake)return;r.stakeTick=1;const base=(typeof stakePrice==='function')?stakePrice(r):1000;let t=1+(typeof rnd==='function'?rnd(-0.06,0.06):0);const d=[];
  for(let i=0;i<28;i++){t+=(1-t)*0.05;t*=1+(typeof rnd==='function'?rnd(-0.02,0.02):0);d.push(Math.max(500,Math.round(base*t/100)*100));}
  d.push(stakeValLive(r));r.stakeD=d;}
if(typeof RACTS!=='undefined'&&RACTS.invest&&RACTS.invest.go){const _go=RACTS.invest.go;RACTS.invest.go=r=>{_go(r);try{seedStakeHist(r);}catch(e){}};}

/* the portfolio and the sale both use the live market value */
if(typeof holdings==='function'){const _h=holdings;holdings=function(){const o=_h();for(const x of o)if(x&&x.kind==='stake'){const r=rivalById(x.rid);if(r)x.value=stakeValLive(r);}return o;};}
if(typeof RACTS!=='undefined'&&RACTS.invest){RACTS.invest.end=r=>{const v=Math.round(stakeValLive(r));S.co.cash+=v;S.m.setup=(S.m.setup||0)+v;S.co.capYr=(S.co.capYr||0)+v;if(typeof remember==='function')remember(r,'You sold your stake back.');delete r.stake;log('You sold your stake in '+r.name+' for '+gbp(v)+'.','info');};}

ACT_EXT.stakeSel=v=>{if(S&&S.co)S.co.stakeSel=v;};

/* Stakes tab: the same list-plus-chart two-pane the Shares tab uses */
invStakes=function(){
  const list=stakedFirms();
  if(!list.length)return '<div class="mkt-pane"><div class="sec"><h3 style="font-size:.95rem">Minority stakes</h3><p class="lede">20% stakes in smaller firms. Each pays a monthly dividend and now carries a live market value that moves day to day, like the listed nationals.</p><p class="empty">No stakes yet. Buy a 20% stake from a smaller firm’s card on the Market tab.</p></div></div>';
  let sel=S.co&&S.co.stakeSel;if(!list.some(r=>r.id===sel)){sel=list[0].id;if(S.co)S.co.stakeSel=sel;}
  const menu=list.map(r=>{const v=stakeValLive(r);const s=stakeSeries(r);const chg=(typeof pxChange==='function')?pxChange(s,5):0;
    const ar=chg>0.002?'<span class="pos">▲</span>':chg<-0.002?'<span class="neg">▼</span>':'<span class="mut">–</span>';
    return '<button class="mkt-mi'+(r.id===sel?' sel':'')+'" data-act="stakeSel" data-v="'+r.id+'"><b>'+esc(r.name)+'</b><span class="mkt-mi-l">'+gbp(v)+' '+ar+' '+((typeof sparkSVG==='function')?sparkSVG(s,44,14):'')+'</span></button>';}).join('');
  const r=rivalById(sel)||list[0];const v=stakeValLive(r);const s=stakeSeries(r);const chg=(typeof pxChange==='function')?pxChange(s,5):0;const paid=r.stake?r.stake.p:0;const gain=v-paid;
  const head='<div class="mkt-cap"><span style="flex:1;min-width:0"><b>'+esc(r.name)+'</b> <span class="mut">'+gbp(v)+'</span> <span class="'+(chg>=0?'pos':'neg')+'" style="font-size:.8rem">'+(chg>=0?'+':'')+Math.round(chg*100)+'%</span> <span class="mut" style="font-size:.76rem">· 20% stake · paid '+gbp(paid)+' · <span class="'+(gain>=0?'pos':'neg')+'">'+(gain>=0?'+':'')+gbp(gain)+'</span></span></span>'+
    '<button class="btn sm danger" data-act="rEnd" data-v="'+r.id+':invest">Sell · '+gbp(v)+'</button></div>';
  const curTF=(S.co&&S.co.mktTF)||'6M';
  const tfRow='<div class="mkt-tf">'+((typeof TFS!=='undefined')?TFS.map(t=>'<button data-act="mktTF" data-v="'+t.k+'" aria-pressed="'+(curTF===t.k)+'">'+t.t+'</button>').join(''):'')+'</div>';
  const chart='<div class="mkt-chart">'+((typeof priceChartSVG==='function')?priceChartSVG(stakeChartData(r),r.stake?r.stake.p:0):'')+'</div>';
  const dividend=Math.round(rSeats(r)*45*0.1*0.2);
  const info='<div class="row mut" style="font-size:.8rem;justify-content:space-between;margin-top:2px"><span>~'+r.clients+' clients · '+(r.trend>0?'growing':r.trend<0?'shrinking':'steady')+'</span><span>'+gbp(dividend)+'/mo dividend</span></div>';
  return '<div class="mkt-body"><div id="mktMenu" class="mkt-menu">'+menu+'</div><div class="mkt-main">'+head+tfRow+chart+info+'<div style="margin-top:6px"><button class="btn sm" data-act="rivalCard" data-v="'+r.id+'">Their card</button></div></div></div>';
};
