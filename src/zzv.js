
/* ============ build 130: deeper SaaS + an active data centre ============
   SaaS is no longer a one-shot coin flip. A live product has a market-fit tier, a marketing
   spend and a price stance that drive it toward a ceiling, and a flop can be reworked for a
   fresh roll (better odds, never worse) or wound down. The data centre's private hosting is
   now a product you actually run: a sales-effort lever, capacity you expand for capex, and an
   option to wholesale idle racks. Balance is deliberately harsh: the DC's £15k/mo run means it
   loses money until you host well over a thousand users, so it only pays back at real scale or
   through its build synergies (own backup platform, cheap SaaS hosting). */

/* ---------------- SaaS ---------------- */
const SAAS_BASE=[2500,20000,70000];        // flop / steady / hit monthly-revenue ceiling
const SAAS_MKT=[0,6000,18000];             // marketing spend per month by level
const SAAS_MKT_LIFT=[1,1.15,1.3];          // and how much it lifts the ceiling
const SAAS_PRICE=[0.85,1,1.2];             // value / standard / premium revenue multiplier
function saasCeiling(sb){return Math.round(SAAS_BASE[sb.fit||0]*SAAS_MKT_LIFT[sb.mkt||0]*SAAS_PRICE[sb.price==null?1:sb.price]);}
function saasTick(sb,n){
  const mc=SAAS_MKT[sb.mkt||0];if(mc)spend(mc/DPM);
  /* rework progress, if the team is on a relaunch */
  if(sb.reworking){sb.reworking.done+=(n||0)/DPM;
    if(sb.reworking.done>=sb.reworking.need){const r=Math.random();const nf=r<0.15?0:r<0.55?1:2;sb.fit=Math.max(sb.fit||0,nf);sb.out=['flop','steady','hit'][sb.fit];sb.reworking=null;sb.rev=Math.max(sb.rev||0,[1500,7000,14000][sb.fit]);
      log('The SaaS relaunch is out. The market now takes it as '+['a niche tool','a steady earner','a real hit'][sb.fit]+'.',sb.fit?'good':'info');}}
  if(S.day%DPM===0){
    const ceil=saasCeiling(sb);const grow=[0.03,0.09,0.14][sb.mkt||0]*[1.15,1,0.85][sb.price==null?1:sb.price]*(n?1:0.8);
    if((sb.rev||0)<ceil)sb.rev=Math.min(ceil,(sb.rev||0)+(ceil-(sb.rev||0))*grow+ceil*0.01);
    else sb.rev=Math.max(ceil,sb.rev*0.99);
    if(!n)sb.rev*=0.94;                       // no DevOps team: it rots
    sb.rev=Math.max(0,Math.round(sb.rev));
  }
  if(sb.rev){const net=sb.rev*(betLive('dc')?0.95:0.8)/DPM;S.co.cash+=net;S.m.soft=(S.m.soft||0)+net;}
}
ACT_EXT.saasMkt=v=>{const sb=build('saas');if(sb)sb.mkt=Math.max(0,Math.min(2,Math.round(+v||0)));};
ACT_EXT.saasPrice=v=>{const sb=build('saas');if(sb)sb.price=Math.max(0,Math.min(2,Math.round(+v||0)));};
ACT_EXT.saasRework=()=>{const sb=build('saas');if(!sb||!sb.live||sb.reworking)return;if(!devTeam()){toast('You need a DevOps team to rework it.');return;}
  const cost=60000;if(S.co.cash-cost<-OD_LIMIT){toast('Not enough cash for the '+gbp(cost)+' rework.');return;}
  spend(cost);sb.reworking={need:BUILDS.saas.dm*0.5*rnd(1,1.4),done:0};
  log('DevOps are reworking the SaaS product for '+gbp(cost)+'. A relaunch re-rolls how the market takes it, and can only improve it.','event');};
ACT_EXT.saasWind=()=>{const sb=build('saas');if(!sb||!sb.live)return;const scrap=Math.round((sb.rev||0)*3);if(scrap){S.co.cash+=scrap;S.m.soft=(S.m.soft||0)+scrap;}delete S.builds.saas;
  log('You wound down the SaaS product'+(scrap?' and sold the IP for '+gbp(scrap):'')+'. DevOps can build a fresh one from scratch.','event');};

function saasProductSec(){
  const sb=build('saas');if(!sb||!sb.live)return '';
  const ceil=saasCeiling(sb);const mc=SAAS_MKT[sb.mkt||0];const net=Math.round(sb.rev*(betLive('dc')?0.95:0.8)-mc);
  let h='<div class="sec"><h3 style="font-size:.95rem">Your SaaS product</h3>'+
    '<div class="tiles"><div class="tile"><span class="k">Revenue</span><span class="v">'+gbp(Math.round(sb.rev))+'</span><small>a month, ceiling '+gbp(ceil)+'</small></div>'+
    '<div class="tile"><span class="k">Net to you</span><span class="v '+(net<0?'neg':'')+'">'+gbp(net)+'</span><small>after hosting'+(mc?' &amp; marketing':'')+'</small></div>'+
    '<div class="tile"><span class="k">Market fit</span><span class="v">'+['Niche','Steady','Hit'][sb.fit||0]+'</span><small>'+(betLive('dc')?'95% margin (own DC)':'80% margin')+'</small></div></div>';
  h+='<p class="lede" style="margin:10px 0 4px">Marketing</p><div class="seg">'+['Off','Modest','Heavy'].map((t,i)=>'<button data-act="saasMkt" data-v="'+i+'" aria-pressed="'+((sb.mkt||0)===i)+'">'+t+'<small>'+(SAAS_MKT[i]?gbp(SAAS_MKT[i])+'/mo':'no spend')+'</small></button>').join('')+'</div>';
  h+='<p class="lede" style="margin:10px 0 4px">Pricing</p><div class="seg">'+['Value','Standard','Premium'].map((t,i)=>'<button data-act="saasPrice" data-v="'+i+'" aria-pressed="'+((sb.price==null?1:sb.price)===i)+'">'+t+'<small>'+['grows fast, less per user','balanced','more per user, slower'][i]+'</small></button>').join('')+'</div>';
  if(sb.reworking){const pc=Math.round(sb.reworking.done/sb.reworking.need*100);h+='<p class="note">Relaunch under way: '+pc+'% of the rework done.</p>';}
  else h+='<div class="row" style="margin-top:10px"><button class="btn sm" data-act="saasRework">Rework for a relaunch · '+gbp(60000)+'</button><button class="btn sm danger" data-act="saasWind">Wind it down</button></div>'+
    '<p class="mut" style="font-size:.78rem;margin-top:6px">'+(sb.fit<2?'A rework re-rolls market fit with better odds and can only improve it. ':'')+'Marketing lifts the ceiling and speeds growth; premium pricing earns more per user but grows slower.</p>';
  return h+'</div>';
}

/* ---- retry a failed non-SaaS build: cheaper second run, better odds, never worse ---- */
ACT_EXT.buildRetry=k=>{const B=BUILDS[k];const b=build(k);if(!B||!b||!b.failed)return;if(!devTeam()){toast('You need a DevOps team to try again.');return;}
  const cost=Math.round(B.dm*1500);if(S.co.cash-cost<-OD_LIMIT){toast('Not enough cash to take another run at '+B.t.toLowerCase()+' ('+gbp(cost)+').');return;}
  spend(cost);
  S.builds[k]={need:B.dm*0.5*rnd(1,1.4),est:Math.round(B.dm*0.5),done:0,start:S.day,failMod:0.5,retry:true};
  log('DevOps are taking another run at '+B.t.toLowerCase()+' for '+gbp(cost)+', building on what went wrong. Roughly half the failure risk this time.','event');};

/* ---------------- Data centre hosting ---------------- */
const DC_PRICE=9;            // £/user/month retail private hosting
const DC_WHOLESALE=2;        // £/idle slot/month if you wholesale spare capacity
const DC_EXPAND=120000;      // capex per +3,000 slots
const DC_SLOTS=3000;
function dcCap(b){return b.cap||DC_SLOTS;}
function dcSell(b){return b.sell==null?1:b.sell;}
function dcCeiling(b){const eff=[0,0.35,0.6][dcSell(b)];return Math.min(dcCap(b),Math.round(supportSeats()*eff*(0.6+clamp(S.co.rep,0,100)/250)));}
function dcTick(b){
  if(S.day%DPM===0){const ceil=dcCeiling(b);const u=b.users||0;
    if(u<ceil)b.users=Math.min(ceil,u+(ceil-u)*0.15+supportSeats()*0.008);
    else b.users=Math.max(ceil,u*0.97);
    b.users=Math.max(0,Math.round(b.users));}
  const rev=(b.users||0)*DC_PRICE/DPM;S.co.cash+=rev;S.m.soft=(S.m.soft||0)+rev;
  if(b.wholesale){const spare=Math.max(0,dcCap(b)-(b.users||0));const wr=spare*DC_WHOLESALE/DPM;S.co.cash+=wr;S.m.soft=(S.m.soft||0)+wr;}
}
ACT_EXT.dcSell=v=>{const b=bet('dc');if(b)b.sell=Math.max(0,Math.min(2,Math.round(+v||0)));};
ACT_EXT.dcWholesale=v=>{const b=bet('dc');if(b)b.wholesale=(v==='1');};
ACT_EXT.dcExpand=()=>{const b=bet('dc');if(!b||!b.live)return;if(S.co.cash-DC_EXPAND<-OD_LIMIT){toast('Not enough cash to expand the data centre ('+gbp(DC_EXPAND)+').');return;}spend(DC_EXPAND);b.cap=dcCap(b)+DC_SLOTS;log('You expanded the data centre: +'+DC_SLOTS.toLocaleString()+' hosting slots for '+gbp(DC_EXPAND)+'.','event');};

function dcHostingSec(){
  const b=bet('dc');if(!b||!b.live)return '';
  const cap=dcCap(b),u=Math.round(b.users||0),ceil=dcCeiling(b);
  const rev=Math.round(u*DC_PRICE);const spare=Math.max(0,cap-u);const wrev=b.wholesale?Math.round(spare*DC_WHOLESALE):0;
  const net=rev+wrev-15000;
  let h='<div class="sec"><h3 style="font-size:.95rem">Private hosting</h3>'+
    '<div class="tiles"><div class="tile"><span class="k">Hosted users</span><span class="v">'+u.toLocaleString()+'</span><small>of '+cap.toLocaleString()+' slots</small></div>'+
    '<div class="tile"><span class="k">Hosting revenue</span><span class="v">'+gbp(rev+wrev)+'</span><small>'+gbp(rev)+' retail'+(wrev?' · '+gbp(wrev)+' wholesale':'')+'/mo</small></div>'+
    '<div class="tile"><span class="k">After the '+gbp(15000)+' run</span><span class="v '+(net<0?'neg':'pos')+'">'+gbp(net)+'</span><small>a month</small></div></div>';
  h+='<p class="lede" style="margin:10px 0 4px">Sales effort · '+DC_PRICE+' a user a month</p><div class="seg">'+['Off','Standard','Push'].map((t,i)=>'<button data-act="dcSell" data-v="'+i+'" aria-pressed="'+(dcSell(b)===i)+'">'+t+'<small>'+['let it drift','steady take-up','win hosting hard'][i]+'</small></button>').join('')+'</div>';
  if(u>=ceil&&ceil>=cap)h+='<p class="note warn">You’re at capacity. Expand to host more.</p>';
  h+='<div class="row" style="margin-top:10px"><button class="btn sm" data-act="dcExpand">Expand · +'+DC_SLOTS.toLocaleString()+' slots · '+gbp(DC_EXPAND)+'</button>'+
    '<button class="btn sm" data-act="dcWholesale" data-v="'+(b.wholesale?'0':'1')+'" aria-pressed="'+!!b.wholesale+'">'+(b.wholesale?'Wholesaling spare':'Wholesale spare racks')+'</button></div>'+
    '<p class="mut" style="font-size:.78rem;margin-top:6px">Idle racks can be wholesaled to other MSPs at '+gbp(DC_WHOLESALE)+' a slot, a thin margin that just softens the run cost. Hosting only clears the '+gbp(15000)+'/mo run above about '+Math.ceil(15000/DC_PRICE).toLocaleString()+' users.</p>';
  return h+'</div>';
}

/* ---- attach the controls next to their sections on the Strategy tab ---- */
if(typeof devSec==='function'){const _ds=devSec;devSec=function(){let h=_ds.apply(this,arguments);try{h+=saasProductSec();}catch(e){}return h;};}
if(typeof betsList==='function'){const _bl=betsList;betsList=function(keys,title,lede){let h=_bl(keys,title,lede);try{if(keys&&keys.indexOf('dc')>=0&&betLive('dc'))h+=dcHostingSec();}catch(e){}return h;};}

/* ---- migrate older saves ---- */
if(typeof migrateSave==='function'){const _m=migrateSave;migrateSave=function(){_m.apply(this,arguments);try{
  const sb=S.builds&&S.builds.saas;if(sb&&sb.live&&sb.fit==null){sb.fit=sb.out==='hit'?2:sb.out==='steady'?1:0;if(sb.mkt==null)sb.mkt=0;if(sb.price==null)sb.price=1;}
  const dc=S.bets&&S.bets.dc;if(dc&&dc.live){if(dc.cap==null)dc.cap=Math.max(DC_SLOTS,Math.round((dc.users||0)*1.3/DC_SLOTS)*DC_SLOTS||DC_SLOTS);if(dc.sell==null)dc.sell=1;}
}catch(e){}};}
