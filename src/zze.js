
/* ============ build 97: phase 3 — you become the target ============
   Once you're public and looking weak, a predator can come for the company you
   built. They take a position and buy toward control; cross 50% and it's theirs,
   and the run ends. You defend: buy back shares to lift your own stake and squeeze
   their headroom, trigger a poison pill to dilute them (at the cost of your price),
   or call in a white knight to see them off for a fee. */

function raidFrac(){const io=S.co&&S.co.ipo,raid=S.co&&S.co.raid;return (io&&raid)?raid.shares/io.shares:0;}

/* monthly: a raider may emerge, then buys toward control */
function raidStep(){
  if(typeof isPublic!=='function'||!isPublic()||S.over)return;const io=S.co.ipo;
  const floatFrac=(io.shares-io.yourShares)/io.shares;
  if(!S.co.raid){
    if(floatFrac<0.35)return;                                   // too little float to raid
    if(S.day-(io.floatDay||0)<DPM*6)return;                     // grace period after floating
    const rel=io.price/io.floatPrice;
    let p=0.02+(io.misses||0)*0.06+(rel<0.8?0.05:0)+(rel<0.55?0.08:0);
    if(floatFrac>0.55)p*=1.6;
    if(Math.random()<p){
      S.co.raid={name:pick(['Castlegate Group','Northstar Capital','Albion Tech Partners','a private-equity raider','Meridian Managed Services']),shares:Math.round(io.shares*rnd(0.06,0.12)),start:S.day,disclosed:false,price:Math.round(io.price*1.02)};
      log(S.co.raid.name+' has taken a '+Math.round(raidFrac()*100)+'% position in '+S.co.name+' and is buying. You’re in play — defend the company on the Strategy tab.','event');
    }
    return;
  }
  const raid=S.co.raid;
  const maxShares=io.shares-io.yourShares-Math.round(io.shares*0.05);
  raid.shares=Math.min(maxShares,raid.shares+Math.round(io.shares*rnd(0.03,0.07)));
  raid.price=Math.max(raid.price,Math.round(io.price*1.03));
  if(!raid.disclosed&&raidFrac()>=DISCLOSE){raid.disclosed=S.day;log(raid.name+' now holds '+Math.round(raidFrac()*100)+'% of '+S.co.name+' and has gone hostile. Defend it or lose the company.','bad');}
  if(raidFrac()>=CONTROL)raidWin();
}
function raidWin(){const io=S.co.ipo,raid=S.co.raid;if(!io||!raid)return;
  const E=(typeof exitNet==='function')?exitNet(Math.round(raid.price*io.yourShares)+Math.max(0,S.co.cash)-S.co.loan):{net:Math.round(raid.price*io.yourShares),cgt:0,gross:Math.round(raid.price*io.yourShares)};
  S.over={mi:monthOf(S.day),peak:Math.max(...S.hist.map(h=>h.mrr),mrr()),sold:{head:'Taken over',title:raid.name+' has taken control of '+S.co.name,body:raid.name+' crossed 50% on the open market and took control of the company you built. Your remaining shares were bought out at '+gbp(raid.price)+' each. It’s theirs to run now — you didn’t see them off in time.',net:E.net,cgt:E.cgt,gross:E.gross,home:(S.co.home||0)+(S.co.divs||0),offer:Math.round(raid.price*io.shares)}};
}
if(typeof monthEnd==='function'){const _me=monthEnd;monthEnd=function(){_me.apply(this,arguments);try{if(!S.over)raidStep();}catch(e){}};}

/* ---- defences ---- */
ACT_EXT.raidBuyback=()=>{const io=S.co.ipo,raid=S.co.raid;if(!io||!raid)return;
  const n=Math.round(io.shares*0.05),cost=Math.round(n*io.price*1.02);
  if(S.co.cash<cost){if(typeof toast==='function')toast('You need '+gbp(cost)+' in cash to buy back that block.');return;}
  S.co.cash-=cost;io.yourShares+=n;raid.shares=Math.max(0,raid.shares-Math.round(n*0.6));io.price=Math.round(io.price*1.02);
  log('You bought back '+pct(n/io.shares)+' of '+S.co.name+' for '+gbp(cost)+', lifting your stake and squeezing '+raid.name+'’s headroom.','good');
  if(raidFrac()<0.12){log(raid.name+' has given up and sold out of '+S.co.name+'.','good');S.co.raid=null;}};
ACT_EXT.raidPill=()=>{const io=S.co.ipo,raid=S.co.raid;if(!io||!raid)return;
  if(S.co.pillAt&&S.day-S.co.pillAt<DPM*6){if(typeof toast==='function')toast('You can only trigger a pill every few months.');return;}
  S.co.pillAt=S.day;const newShares=Math.round(io.shares*0.25);io.shares+=newShares;io.price=Math.round(io.price*0.92);S.co.rep=Math.max(0,(S.co.rep||50)-3);
  log('You’ve triggered a poison pill — new shares to friendly investors dilute '+raid.name+' down to '+Math.round(raidFrac()*100)+'%. Your share price took a knock, but the raider is on the back foot.','event');
  if(raidFrac()<0.2){log(raid.name+' has been diluted out and moved on.','good');S.co.raid=null;}};
ACT_EXT.raidKnight=()=>{const io=S.co.ipo,raid=S.co.raid;if(!io||!raid)return;
  const cost=Math.max(50000,Math.round(marketCap()*0.01));
  if(S.co.cash<cost){if(typeof toast==='function')toast('Advisers and a friendly placing would cost about '+gbp(cost)+'.');return;}
  S.co.cash-=cost;S.co.rep=Math.min(100,(S.co.rep||50)+1);
  log('A friendly investor took a blocking stake and saw '+raid.name+' off. It cost '+gbp(cost)+' in fees and favours, but '+S.co.name+' stays yours.','good');S.co.raid=null;};

/* ---- the "Under attack" section, at the top of the Strategy tab while public ---- */
function raidSec(){
  if(typeof isPublic!=='function'||!isPublic()||!S.co.raid)return '';const io=S.co.ipo,raid=S.co.raid,f=raidFrac();
  const bbCost=Math.round(Math.round(io.shares*0.05)*io.price*1.02);const pillReady=!(S.co.pillAt&&S.day-S.co.pillAt<DPM*6);
  return '<div class="sec" style="border:1px solid var(--bad);border-radius:12px;padding:12px;background:color-mix(in srgb,var(--bad) 7%,transparent)">'+
    '<h3 style="color:var(--bad)">Under attack</h3><p class="lede"><b>'+esc(raid.name)+'</b> holds <b>'+Math.round(f*100)+'%</b> of '+esc(S.co.name)+' and is buying toward control. Cross 50% and they take the company and end your run. Defend it.</p>'+
    '<div class="mkt-bar" style="height:9px;margin:8px 0"><i style="width:'+Math.round((typeof clamp==='function'?clamp(f,0,1):f)*100)+'%;background:var(--bad)"></i><u style="left:'+Math.round(DISCLOSE*100)+'%"></u><u style="left:50%"></u></div>'+
    '<div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn sm primary" data-act="raidBuyback" '+(S.co.cash>=bbCost?'':'disabled')+'>Buy back 5% · '+gbp(bbCost)+'</button><button class="btn sm" data-act="raidPill" '+(pillReady?'':'disabled')+'>Poison pill</button><button class="btn sm" data-act="raidKnight">White knight · '+gbp(Math.max(50000,Math.round(marketCap()*0.01)))+'</button></div>'+
    '<p class="mut" style="font-size:.78rem;margin-top:6px">Buybacks lift your stake and squeeze their headroom. A pill dilutes them but knocks your share price. A white knight ends it for a fee.</p></div>';
}
/* raidSec relocated to the Ownership tab (see zzr.js) */
