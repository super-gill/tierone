
/* ============ build 110: partial share selling ============
   Selling a public shareholding used to be all-or-nothing. Now the Sell button opens an
   amount dialog so you can sell as many or as few shares as you like; the rest of the
   holding (and its cost basis) stays put. Stakes remain a single 20% block by nature. */

ACT_EXT.shareSellAsk=v=>{const r=rivalById(v);const hd=S.co.shares&&S.co.shares[v];if(!r||!hd||!hd.units)return;ui.amtMsg=null;ui.amtVal='';ui.modal={type:'amt',kind:'shareSell',rid:v};};

function sellPxOf(r){const imp=(typeof shareImpact==='function'?shareImpact(r):1)||1;return Math.max(0.01,Math.round(sharePx(r)/imp*(1-MKT_SPREAD)*100)/100);}

/* the sell dialog reuses the amount modal */
if(typeof MODAL_EXT!=='undefined'&&MODAL_EXT.amt){const _amt=MODAL_EXT.amt;MODAL_EXT.amt=(M,x)=>{
  if(M&&M.kind==='shareSell'){const r=rivalById(M.rid);const hd=S.co.shares&&S.co.shares[M.rid];if(!r||!hd||!hd.units)return null;
    const px=sellPxOf(r);const heldVal=hd.units*px;const pctHeld=Math.round(hd.units/SHARES_OUT*100);
    const chips=[['25%',Math.floor(heldVal*0.25/100)*100],['50%',Math.floor(heldVal*0.5/100)*100],['All',heldVal]].filter(c=>c[1]>=px).map(c=>'<button class="btn sm" data-act="amtPreset" data-v="'+c[1]+'">'+c[0]+'</button>').join('');
    return '<div class="dialog">'+x+'<p class="kick">Investments</p><h2>Sell shares in '+esc(r.name)+'</h2><p>You hold <b>'+hd.units.toLocaleString()+'</b> share'+(hd.units===1?'':'s')+' ('+pctHeld+'%), worth about <b>'+gbp(heldVal)+'</b> at '+spx(px)+' a share. Sell as much or as little as you like. It’s rounded down to whole shares, and the rest stays invested.</p>'+
      '<div class="field"><label for="amtField">Amount to raise (£)</label><input id="amtField" inputmode="numeric" autocomplete="off" placeholder="type any amount" value="'+esc(ui.amtVal||'')+'"></div>'+
      (chips?'<div class="row" style="gap:6px;flex-wrap:wrap;margin:6px 0 2px">'+chips+'</div>':'')+
      (ui.amtMsg?'<p class="note warn">'+esc(ui.amtMsg)+'</p>':'')+
      '<div class="foot2"><span class="grow"></span><button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="amtGo">Sell</button></div></div>';}
  return _amt(M,x);};}

/* route the confirm to a partial shareSell */
if(ACT_EXT.amtGo){const _amtGo=ACT_EXT.amtGo;ACT_EXT.amtGo=()=>{const M=ui.modal;
  if(M&&M.type==='amt'&&M.kind==='shareSell'){const r=rivalById(M.rid);const hd=S.co.shares&&S.co.shares[M.rid];if(!r||!hd||!hd.units){ui.modal=null;return;}
    const el=(typeof $==='function')&&$('amtField');const raw=el?el.value:'';ui.amtVal=raw;const a=Math.floor(+(String(raw).replace(/[^0-9.]/g,''))||0);
    if(!a||a<=0){ui.amtMsg='Enter an amount to sell.';return;}
    const px=sellPxOf(r);let units=Math.min(hd.units,Math.floor(a/px));
    if(units<1){ui.amtMsg='That’s less than one share ('+spx(px)+' each).';return;}
    ACT_EXT.shareSell(M.rid+':'+units);ui.modal=null;ui.amtMsg=null;ui.amtVal=null;return;}
  return _amtGo();};}

/* rescale legacy saves: the old model split a firm into 1,000 shares, the new one into a million.
   Multiply old holdings and shorts by the factor (value is preserved, since price/share drops the
   same amount) and divide the stored per-share prices, so nothing jumps when an old save loads. */
(function(){
  const FACTOR=SHARES_OUT/1000;
  function rescaleLegacy(){
    if(!S||!S.co)return;
    if(S.co.shareScale!=null)return;                 // already on the new scale (or a new game)
    const sh=S.co.shares||{};for(const id in sh){if(sh[id])sh[id].units=Math.round((sh[id].units||0)*FACTOR);}
    const so=S.co.shorts||{};for(const id in so){if(so[id]){so[id].units=Math.round((so[id].units||0)*FACTOR);so[id].openPx=(so[id].openPx||0)/FACTOR;}}
    if(typeof rivals==='function')for(const r of rivals()){
      if(r.def&&r.def.knight&&r.def.knight.price)r.def.knight.price=r.def.knight.price/FACTOR;
      if(Array.isArray(r.pxDaily))r.pxDaily=r.pxDaily.map(x=>x/FACTOR);
      if(Array.isArray(r.pxMonthlyC))r.pxMonthlyC=r.pxMonthlyC.map(c=>({o:c.o/FACTOR,h:c.h/FACTOR,l:c.l/FACTOR,c:c.c/FACTOR}));
    }
    S.co.shareScale=SHARES_OUT;
  }
  if(typeof migrateSave==='function'){const _m=migrateSave;migrateSave=function(){_m.apply(this,arguments);try{rescaleLegacy();}catch(e){}};}
  if(typeof newState==='function'){const _n=newState;newState=function(){const r=_n.apply(this,arguments);try{if(S&&S.co)S.co.shareScale=SHARES_OUT;}catch(e){}return r;};}
})();
