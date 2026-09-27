
/* ============ build 106: fixed-term deposits — lock cash for a better rate ============
   Instant-access savings you can pull any time. Fixed-term deposits pay more, but you
   promise not to touch the money until it matures. Interest is paid with the principal
   at the end, and counts as investment income (so it's taxed like the payout-mode
   instant-access interest). Deposit protection limits and bank failures are noted for
   a later build, not modelled yet. */
const BOND_TERMS=[{m:3,rate:SAVE_APR+0.007},{m:6,rate:SAVE_APR+0.014},{m:12,rate:SAVE_APR+0.022}];
function bondPayout(b){return Math.round(b.amount*(1+b.rate*b.term/12));}   // simple interest over the term
function bondInterest(b){return bondPayout(b)-b.amount;}
function bondsList(){return (S.co&&S.co.bonds)||[];}
function bondsLocked(){return bondsList().reduce((a,b)=>a+b.amount,0);}

ACT_EXT.bondAsk=term=>{const t=+term;if(!BOND_TERMS.some(x=>x.m===t))return;ui.amtMsg=null;ui.amtVal='';ui.modal={type:'amt',kind:'bond',term:t};};
ACT_EXT.bondOpen=v=>{const [term,amt]=(v||'').split(':');const t=+term;const a=Math.floor(+amt);const bt=BOND_TERMS.find(x=>x.m===t);
  if(!bt)return;
  if(!a||a<1000){ui.amtMsg='Fixed-term deposits start at £1,000.';return;}
  if(a>S.co.cash){ui.amtMsg='You only have '+gbp(S.co.cash)+' in cash.';return;}
  S.co.cash-=a;S.co.bonds=S.co.bonds||[];
  const b={amount:a,rate:bt.rate,term:t,start:S.day,matures:S.day+DPM*t};S.co.bonds.push(b);
  log('Locked '+gbp(a)+' away for '+t+' months at '+rpct(bt.rate)+'. It returns '+gbp(bondPayout(b))+' when it matures.','info');
  ui.modal=null;ui.amtMsg=null;ui.amtVal=null;};

/* each month, mature any deposits that have come due: principal plus interest back to cash */
function bondsMonthly(){if(!S.co||!S.co.bonds||!S.co.bonds.length)return;
  const keep=[];for(const b of S.co.bonds){
    if(S.day>=b.matures){const interest=bondInterest(b);S.co.cash+=b.amount+interest;S.m.invest=(S.m.invest||0)+interest;
      log('A '+b.term+'-month fixed-term deposit matured: '+gbp(b.amount)+' back plus '+gbp(interest)+' interest.','good');}
    else keep.push(b);}
  S.co.bonds=keep;}
if(typeof marketMonthly==='function'){const _mm=marketMonthly;marketMonthly=function(){_mm.apply(this,arguments);try{bondsMonthly();}catch(e){}};}

/* amount dialog for opening a fixed-term deposit */
if(typeof MODAL_EXT!=='undefined'&&MODAL_EXT.amt){const _amt=MODAL_EXT.amt;MODAL_EXT.amt=(M,x)=>{
  if(M&&M.kind==='bond'){const bt=BOND_TERMS.find(z=>z.m===M.term);if(!bt)return null;
    return '<div class="dialog">'+x+'<p class="kick">Investments</p><h2>Lock cash for '+M.term+' months</h2><p>Earns '+rpct(bt.rate)+' a year, better than instant access, but you can’t withdraw it until it matures. Interest is paid with the principal at the end. Only lock money you won’t need for '+M.term+' months.</p>'+
      '<p class="mut" style="font-size:.85rem;margin:0 0 8px">Cash available: <b>'+gbp(S.co.cash)+'</b></p>'+
      '<div class="field"><label for="amtField">Amount to lock (£)</label><input id="amtField" inputmode="numeric" autocomplete="off" placeholder="type any amount" value="'+esc(ui.amtVal||'')+'"></div>'+
      (ui.amtMsg?'<p class="note warn">'+esc(ui.amtMsg)+'</p>':'')+
      '<div class="foot2"><span class="grow"></span><button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="amtGo">Lock it away</button></div></div>';}
  return _amt(M,x);};}
if(ACT_EXT.amtGo){const _amtGo=ACT_EXT.amtGo;ACT_EXT.amtGo=()=>{const M=ui.modal;
  if(M&&M.type==='amt'&&M.kind==='bond'){const el=(typeof $==='function')&&$('amtField');const raw=el?el.value:'';ui.amtVal=raw;const a=Math.floor(+(String(raw).replace(/[^0-9.]/g,''))||0);if(!a||a<=0){ui.amtMsg='Enter an amount.';return;}ACT_EXT.bondOpen(M.term+':'+a);return;}
  return _amtGo();};}

/* fixed-term block on the savings section of the Invest tab */
if(typeof paneInvestSavings==='function'){const _pis=paneInvestSavings;paneInvestSavings=function(){let h=_pis.apply(this,arguments);
  const bonds=bondsList().slice().sort((a,b)=>a.matures-b.matures);
  let b='<div class="sec"><h3 style="font-size:.95rem">Fixed-term deposits</h3><p class="lede">Lock cash away for a set term and earn more than instant access, in return for a promise not to touch it until it matures.'+(bondsLocked()>0?' <b>'+gbp(bondsLocked())+'</b> locked away right now.':'')+'</p>';
  b+='<div class="row" style="gap:6px;flex-wrap:wrap">'+BOND_TERMS.map(bt=>'<button class="btn sm" data-act="bondAsk" data-v="'+bt.m+'" '+(S.co.cash>=1000?'':'disabled')+'>'+bt.m+' months · '+rpct(bt.rate)+'</button>').join('')+'</div>';
  if(bonds.length)b+='<ul class="list" style="margin-top:8px">'+bonds.map(x=>'<li class="item"><span>'+gbp(x.amount)+' at '+rpct(x.rate)+' · '+x.term+' months</span><span class="r mut">matures '+dLabel(x.matures)+' → '+gbp(bondPayout(x))+'</span></li>').join('')+'</ul>';
  b+='</div>';
  return h+b;};}
