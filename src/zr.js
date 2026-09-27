
/* ============ build 79: more ISO certifications + investment options ============
   - The other ISO standards as buyable certifications (9001, 20000, 22301, 14001),
     alongside the existing ISO 27001, wired into tender requirements and bids.
   - Investment: tradable public shares in the national MSPs, and a business
     savings account. Both live on the Invest tab. */

/* ---------- the new certifications ---------- */
const ISO_CERTS={
  iso9001:{t:'ISO 9001 (quality management)',cost:8000,days:45,rep:2,desc:'The quality-management standard. Steadies your processes and reassures buyers on bigger tenders.'},
  iso20000:{t:'ISO 20000 (IT service management)',cost:10000,days:52,rep:3,desc:'The service-management standard, built on ITIL. Wins service-led tenders and helps you pass audits.'},
  iso22301:{t:'ISO 22301 (business continuity)',cost:9000,days:50,rep:2,desc:'The continuity standard. Softens the hit from incidents, and counts on resilience-minded tenders.'},
  iso14001:{t:'ISO 14001 (environmental)',cost:5000,days:40,rep:1,desc:'The environmental standard. Public-sector and large corporate tenders increasingly ask for it.'}
};

/* rename the existing standard clearly, and register the new ones as tender requirements */
if(typeof TREQ!=='undefined'){
  if(TREQ.iso)TREQ.iso.t='ISO 27001 (information security)';
  TREQ.iso9001={t:'ISO 9001 (quality management)',me:()=>!!S.co.iso9001,r:r=>r.tier>=2||r.iso};
  TREQ.iso20000={t:'ISO 20000 (IT service management)',me:()=>!!S.co.iso20000,r:r=>r.tier>=2||r.iso};
  TREQ.iso22301={t:'ISO 22301 (business continuity)',me:()=>!!S.co.iso22301,r:r=>r.tier>=2};
  TREQ.iso14001={t:'ISO 14001 (environmental)',me:()=>!!S.co.iso14001,r:r=>r.tier>=3||(r.tier>=2&&r.iso)};
}

ACT_EXT.isoCert=v=>{const C=ISO_CERTS[v];if(!C||S.co[v]||S.co[v+'At'])return;
  if(S.co.cash<C.cost){if(typeof toast==='function')toast('Not enough cash for '+C.t+'.');return;}
  spend(C.cost);S.co[v+'At']=S.day;S.co[v+'Done']=S.day+C.days;
  log(C.t+' certification under way. It should complete in about '+Math.max(1,Math.round(C.days/DPM))+' month'+(Math.round(C.days/DPM)>1?'s':'')+'.','event');};

function isoDaily(){for(const k in ISO_CERTS){if(S.co[k+'At']&&!S.co[k]&&S.day>=(S.co[k+'Done']||0)){
  S.co[k]=true;S.co.rep=Math.min(100,(S.co.rep||0)+ISO_CERTS[k].rep);log(ISO_CERTS[k].t+' certified.','good');}}}

/* certs help process/audits and incident resilience, modestly */
if(typeof procScore==='function'){const _ps=procScore;procScore=function(avg){return _ps(avg)+(S.co.iso9001?0.15:0)+(S.co.iso20000?0.15:0);};}
if(typeof secDef==='function'){const _sd=secDef;secDef=function(){return clamp(_sd.apply(this,arguments)+(S.co.iso22301?0.05:0),0,0.9);};}

/* ---------- investments: public shares in the nationals + a savings account ---------- */
const SAVE_APR=0.038;
/* interest rates shown to one decimal, so 4.5% doesn't round to a misleading "5%" (5.0% still shows as "5%") */
function rpct(v){return (Math.round(v*1000)/10).toString().replace(/\.0$/,'')+'%';}
function natFirms(){return (typeof rivals==='function'?rivals():[]).filter(r=>r.tier>=3);}
/* a share is 0.1% of the firm; price tracks its size and a slow market mood */
function shareBase(r){const N=(typeof SHARES_OUT!=='undefined'?SHARES_OUT:1000000);return Math.max(0.01,Math.round(rSeats(r)*45*12*0.9/N*100)/100);}
function sharePx(r){return Math.max(0.01,Math.round(shareBase(r)*(r.shareMood||1)*100)/100);}

ACT_EXT.shareBuy=v=>{const [rid,amt]=(v||'').split(':');const r=rivalById(rid);if(!r||r.tier<3)return;
  const px=sharePx(r);const a=+amt;if(!a||S.co.cash<a||a<px)return;const u=Math.floor(a/px);if(u<1)return;const cost=u*px;
  S.co.cash-=cost;S.co.shares=S.co.shares||{};const hd=S.co.shares[rid]||{units:0,paid:0};hd.units+=u;hd.paid+=cost;S.co.shares[rid]=hd;
  log('Bought '+u.toLocaleString()+' shares in '+r.name+' for '+gbp(cost)+'.','info');};
ACT_EXT.shareSell=v=>{const r=rivalById(v);const hd=S.co.shares&&S.co.shares[v];if(!r||!hd)return;
  const val=hd.units*sharePx(r);S.co.cash+=val;S.m.setup=(S.m.setup||0)+val;delete S.co.shares[v];
  log('Sold your shares in '+r.name+' for '+gbp(val)+'.','info');};
ACT_EXT.saveDep=v=>{const a=+v;if(!a||a<=0||S.co.cash<a)return;S.co.cash-=a;S.co.savings=(S.co.savings||0)+a;log('Moved '+gbp(a)+' into the business savings account.','info');};
ACT_EXT.saveWith=v=>{const bal=S.co.savings||0;const a=v==='all'?bal:Math.min(+v||0,bal);if(a<=0)return;S.co.savings=bal-a;S.co.cash+=a;log('Withdrew '+gbp(a)+' from savings.','info');};
ACT_EXT.saveMode=v=>{S.co.savingsCompound=(v==='compound');log('Savings interest will now '+(S.co.savingsCompound?'compound in the account':'be paid out to cash each month')+'.','info');};
ACT_EXT.saveSweep=v=>{S.co.saveSweep=Math.max(0,Math.min(0.9,+v||0));log(S.co.saveSweep>0?'Auto-save on: '+pct(S.co.saveSweep)+' of each month’s profit will move into savings.':'Auto-save from profit turned off.','info');};

/* ---------- free-amount modal for shares and savings (any number, not just presets) ---------- */
function amtMax(M){if(!M)return 0;if(M.kind==='saveWith')return S.co.savings||0;return S.co.cash||0;}
ACT_EXT.shareBuyAsk=rid=>{if(!rivalById(rid))return;ui.amtMsg=null;ui.amtVal='';ui.modal={type:'amt',kind:'shareBuy',rid};};
ACT_EXT.saveDepAsk=()=>{ui.amtMsg=null;ui.amtVal='';ui.modal={type:'amt',kind:'saveDep'};};
ACT_EXT.saveWithAsk=()=>{ui.amtMsg=null;ui.amtVal='';ui.modal={type:'amt',kind:'saveWith'};};
ACT_EXT.amtPreset=v=>{const M=ui.modal;if(!M||M.type!=='amt')return;const a=v==='max'?amtMax(M):Math.floor(+v||0);const el=(typeof $==='function')&&$('amtField');if(el){el.value=String(a);ui.keepModal=true;}ui.amtVal=String(a);};
ACT_EXT.amtGo=()=>{const M=ui.modal;if(!M||M.type!=='amt')return;const el=(typeof $==='function')&&$('amtField');const raw=el?el.value:'';ui.amtVal=raw;
  const a=Math.floor(+(String(raw).replace(/[^0-9.]/g,''))||0);
  if(!a||a<=0){ui.amtMsg='Enter an amount.';return;}
  if(M.kind==='shareBuy'){const r=rivalById(M.rid);if(!r){ui.modal=null;return;}const px=sharePx(r);
    if(a<px){ui.amtMsg='That won’t buy a single share ('+spx(px)+' each).';return;}
    if(a>S.co.cash){ui.amtMsg='You only have '+gbp(S.co.cash)+' in cash.';return;}
    ACT_EXT.shareBuy(M.rid+':'+a);}
  else if(M.kind==='saveDep'){if(a>S.co.cash){ui.amtMsg='You only have '+gbp(S.co.cash)+' in cash.';return;}ACT_EXT.saveDep(String(a));}
  else {const bal=S.co.savings||0;if(a>bal){ui.amtMsg='You only have '+gbp(bal)+' on deposit.';return;}ACT_EXT.saveWith(String(a));}
  ui.modal=null;ui.amtMsg=null;ui.amtVal=null;};
if(typeof MODAL_EXT!=='undefined')MODAL_EXT.amt=(M,x)=>{
  let title,lede,ctx,presets,confirmLabel;const maxV=amtMax(M);
  if(M.kind==='shareBuy'){const r=rivalById(M.rid);if(!r)return null;const px=sharePx(r);
    title='Buy shares in '+esc(r.name);lede=spx(px)+' a share. Buy any amount you can afford — it’s rounded down to whole shares. No control, just the price and a token dividend.';
    ctx='Cash available: <b>'+gbp(S.co.cash)+'</b>';presets=[25000,100000,250000];confirmLabel='Buy';}
  else if(M.kind==='saveDep'){title='Deposit into savings';lede='Earns '+rpct(SAVE_APR)+' a year and is available whenever you want it back.';
    ctx='Cash available: <b>'+gbp(S.co.cash)+'</b>';presets=[50000,250000,1000000];confirmLabel='Deposit';}
  else {title='Withdraw from savings';lede='Move money back into your current account.';
    ctx='On deposit: <b>'+gbp(S.co.savings||0)+'</b>';presets=[50000,250000];confirmLabel='Withdraw';}
  const chips=presets.filter(p=>p<=maxV).map(p=>'<button class="btn sm" data-act="amtPreset" data-v="'+p+'">'+gbp(p)+'</button>').join('')+(maxV>0?'<button class="btn sm" data-act="amtPreset" data-v="max">Max · '+gbp(maxV)+'</button>':'');
  return '<div class="dialog">'+x+'<p class="kick">Investments</p><h2>'+title+'</h2><p>'+lede+'</p>'+
    '<p class="mut" style="font-size:.85rem;margin:0 0 8px">'+ctx+'</p>'+
    '<div class="field"><label for="amtField">Amount (£)</label><input id="amtField" inputmode="numeric" autocomplete="off" placeholder="type any amount" value="'+esc(ui.amtVal||'')+'"></div>'+
    (chips?'<div class="row" style="gap:6px;flex-wrap:wrap;margin:6px 0 2px">'+chips+'</div>':'')+
    (ui.amtMsg?'<p class="note warn">'+esc(ui.amtMsg)+'</p>':'')+
    '<div class="foot2"><span class="grow"></span><button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="amtGo">'+confirmLabel+'</button></div></div>';
};

function investMonthly(){
  if((S.co.savings||0)>0){const int=Math.round(S.co.savings*SAVE_APR/12);if(int>0){if(S.co.savingsCompound){S.co.savings+=int;}else{S.co.cash+=int;S.m.invest=(S.m.invest||0)+int;}}}
  /* auto-save: sweep a set share of the month's profit into savings, only from cash spare after
     a month of wages, resold services, rent and tools, so it never starves the business */
  if(S.co.saveSweep>0){const prof=(S.last&&S.last.profit)||0;
    if(prof>0){const buffer=(typeof divBuffer==='function')?divBuffer():0;
      const avail=Math.max(0,Math.floor((S.co.cash-buffer)/100)*100);
      const amt=Math.min(Math.round(prof*S.co.saveSweep),avail);
      if(amt>=100){S.co.cash-=amt;S.co.savings=(S.co.savings||0)+amt;log('Auto-saved '+gbp(amt)+' ('+pct(S.co.saveSweep)+' of the month’s profit) into the savings account.','info');}}}
  const sh=S.co.shares||{};
  for(const rid in sh){const r=rivalById(rid);
    if(!r){const back=Math.round((sh[rid].last||sh[rid].paid)*0.9);S.co.cash+=back;S.m.setup=(S.m.setup||0)+back;S.co.capYr=(S.co.capYr||0)+back;log('A firm you held shares in is no longer listed; your holding returned '+gbp(back)+'.','info');delete sh[rid];continue;}
    const px=sharePx(r);sh[rid].last=sh[rid].units*px;
    const div=Math.round(sh[rid].units*px*0.0022);if(div>0){S.co.cash+=div;S.m.invest=(S.m.invest||0)+div;}}
  for(const r of natFirms())r.shareMood=clamp((r.shareMood||1)*rnd(0.95,1.06)+(r.trend>0?0.015:r.trend<0?-0.02:0),0.7,1.45);
}

/* daily/monthly hooks */
if(typeof peopleDaily==='function'){const _pd=peopleDaily;peopleDaily=function(W){_pd.apply(this,arguments);isoDaily();};}
if(typeof marketMonthly==='function'){const _mm=marketMonthly;marketMonthly=function(){_mm.apply(this,arguments);investMonthly();};}

/* ---------- Invest tab: shares + savings sections ---------- */
function paneInvestShares(){
  const nats=natFirms();const sh=S.co.shares||{};
  let held=0,val=0,paid=0;for(const rid in sh){const r=rivalById(rid);if(!r)continue;val+=sh[rid].units*sharePx(r);paid+=sh[rid].paid;held++;}
  let h='<div class="sec"><h3 style="font-size:.95rem">Public shares in the nationals</h3><p class="lede">The big national MSPs are listed. Buy shares to ride their growth, or sell when they slow. Prices move with the firm’s size and the market’s mood. No control and only a token dividend, just the share price.</p>';
  if(held)h+='<div class="tiles"><div class="tile"><span class="k">Shares value</span><span class="v">'+gbp(val)+'</span><small class="'+(val-paid>=0?'pos':'neg')+'">'+(val-paid>=0?'+':'')+gbp(val-paid)+' vs '+gbp(paid)+' in</small></div><div class="tile"><span class="k">Listings held</span><span class="v">'+held+'</span><small>firm'+(held===1?'':'s')+'</small></div></div>';
  if(!nats.length)return h+'<p class="empty">No national-scale firms are listed right now.</p></div>';
  h+='<ul class="list">';
  for(const r of nats){const px=sharePx(r);const hd=sh[r.id];const mine=hd?hd.units*px:0;const gain=hd?mine-hd.paid:0;
    const trend=r.trend>0?'▲ rising':r.trend<0?'▼ slipping':'– steady';
    h+='<li class="item" style="flex-direction:column;align-items:stretch;gap:5px">'+
      '<div class="row" style="justify-content:space-between"><span><b>'+esc(r.name)+'</b> <span class="mut">'+spx(px)+'/share · '+trend+'</span></span><span class="r">'+(hd?gbp(mine)+' <span class="'+(gain>=0?'pos':'neg')+'" style="font-size:.8rem">'+(gain>=0?'+':'')+gbp(gain)+'</span>':'<span class="mut">no holding</span>')+'</span></div>'+
      '<div class="row" style="justify-content:flex-end;gap:6px">'+
      '<button class="btn sm" data-act="shareBuyAsk" data-v="'+r.id+'" '+(S.co.cash>=sharePx(r)?'':'disabled')+'>Buy shares…</button>'+
      (hd?'<button class="btn sm danger" data-act="shareSellAsk" data-v="'+r.id+'">Sell · '+gbp(mine)+'</button>':'')+
      '</div></li>';}
  return h+'</ul></div>';
}
function paneInvestSavings(){
  const bal=S.co.savings||0;const comp=!!S.co.savingsCompound;
  let h='<div class="sec"><h3 style="font-size:.95rem">Business savings</h3><p class="lede">Park spare cash at '+rpct(SAVE_APR)+' a year. Safe, and available whenever you need it back. Interest can compound in the account or be paid out to cash each month.</p>';
  h+='<div class="tiles"><div class="tile"><span class="k">On deposit</span><span class="v">'+gbp(bal)+'</span><small>earning about '+gbp(Math.round(bal*SAVE_APR))+' a year, '+(comp?'compounding':'paid to cash')+'</small></div></div>';
  h+='<p class="mut" style="font-size:.82rem;margin:8px 0 4px">Interest</p><div class="seg">'+
    '<button data-act="saveMode" data-v="payout" aria-pressed="'+(!comp)+'">Pay out to cash<small>counts as recurring income</small></button>'+
    '<button data-act="saveMode" data-v="compound" aria-pressed="'+comp+'">Compound in the account<small>grows the balance, untaxed until drawn</small></button></div>';
  const sweep=S.co.saveSweep||0;
  h+='<p class="mut" style="font-size:.82rem;margin:10px 0 4px">Auto-save from profit</p><p class="lede" style="margin:0 0 4px">Move a share of each month’s profit into savings automatically, taken only from cash spare after wages, resold services, rent and tools.</p><div class="seg">'+
    [['0','Off','no auto-save'],['0.1','10%','of monthly profit'],['0.25','25%','of monthly profit'],['0.5','50%','of monthly profit']].map(o=>'<button data-act="saveSweep" data-v="'+o[0]+'" aria-pressed="'+(sweep==+o[0])+'">'+o[1]+'<small>'+o[2]+'</small></button>').join('')+'</div>';
  h+='<div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">'+
    '<button class="btn sm" data-act="saveDepAsk" '+(S.co.cash>0?'':'disabled')+'>Deposit…</button>'+
    (bal>0?'<button class="btn sm" data-act="saveWithAsk">Withdraw…</button><button class="btn sm" data-act="saveWith" data-v="all">Withdraw all</button>':'')+
    '</div></div>';
  return h;
}
if(typeof paneInvest==='function'){const _pi=paneInvest;paneInvest=function(){return _pi.apply(this,arguments)+paneInvestShares()+paneInvestSavings();};}

/* News tab filter (registered here, where ACT_EXT exists) */
ACT_EXT.newsFilter=v=>{ui.newsFilter=v;};
