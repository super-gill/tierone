
/* ============ build 80: the board — quarterly report + visible targets ============
   Once the company is public, the board reviews you every quarter. A proper
   report opens at results time and stays reopenable on the Strategy tab, and a
   compact targets strip sits under the top bar so you always know what you’re
   being judged against. */

/* ---------- the quarterly board report ---------- */
function boardVerdict(r){
  if(r.hitTargetNew)return {cls:'',text:'The board is delighted. You’ve passed the market-cap target — ring the bell and call it a win whenever you like.'};
  if(r.misses>=1)return {cls:'bad',text:'The board is losing patience. One more quarter with the shares below '+gbp(r.floatPrice*0.45)+' and they will vote to remove you as CEO.'};
  if(r.delta>=0.12)return {cls:'',text:'The board is pleased. Keep beating expectations and the share price will keep climbing.'};
  if(r.delta<=-0.06)return {cls:'warn',text:'The board is concerned about the direction of travel. They want growth back above expectations next quarter.'};
  return {cls:'',text:'The board is broadly satisfied. Steady as she goes.'};
}
function boardReportHTML(io,withX){
  const r=io.lastReport;
  if(!r)return '<div class="dialog"><button class="x" data-act="close" aria-label="Close">×</button><p class="kick">Board</p><h2>No results yet</h2><p class="mut">Your first quarterly results land at the next quarter end.</p></div>';
  const v=boardVerdict(r);
  const relFloat=r.price/r.floatPrice;
  const capPct=r.target?Math.min(100,Math.round(r.cap/r.target*100)):0;
  const priceTxt=(r.delta>=0?'up':'down')+' '+pct(Math.abs(r.delta))+' to '+gbp(r.price);
  let h='<div class="dialog wide">'+(withX?'<button class="x" data-act="close" aria-label="Close">×</button>':'')+'<p class="kick">Board report · '+mLabel(r.mo)+'</p><h2>Quarterly results</h2>';
  h+='<div class="tiles"><div class="tile"><span class="k">Share price</span><span class="v '+(relFloat>=1?'pos':relFloat>=0.7?'wrn':'neg')+'">'+gbp(r.price)+'</span><small>'+priceTxt+'</small></div>'+
    '<div class="tile"><span class="k">Market cap</span><span class="v">'+gbp(r.cap)+'</span><small>'+capPct+'% of '+gbp(r.target)+' target</small></div>'+
    '<div class="tile"><span class="k">MRR vs expected</span><span class="v '+(r.growthPerf>=0?'pos':'neg')+'">'+gbp(r.cur)+'</span><small>market wanted '+gbp(r.exp)+'</small></div>'+
    '<div class="tile"><span class="k">'+(r.profitable?'Profit':'Loss')+'</span><span class="v '+(r.profitable?'pos':'neg')+'">'+gbp(Math.abs(r.op))+'</span><small>operating, per month</small></div></div>';
  h+='<p style="margin-top:12px">You '+(r.growthPerf>=0?'beat':'missed')+' the market’s growth expectation by '+pct(Math.abs(r.growthPerf))+', and the quarter was '+(r.profitable?'profitable':'loss-making')+'. '+(r.inc?'The quarter’s incidents ('+r.inc+') knocked the price. ':'')+'The shares closed '+priceTxt+', '+(relFloat>=1?pct(relFloat-1)+' above':pct(1-relFloat)+' below')+' the float price.</p>';
  h+='<p class="note'+(v.cls?' '+v.cls:'')+'"><b>The board:</b> '+v.text+'</p>';
  h+='<p class="mut" style="font-size:.82rem">Two quarters running with the shares below '+gbp(r.floatPrice*0.45)+' and the board removes you'+(r.misses?'. You’ve had '+r.misses+' such quarter'+(r.misses>1?' in a row':''):'')+'.</p>';
  h+='<div class="foot2"><button class="btn" data-act="reportMoney">See the numbers</button><span class="grow"></span>'+(r.hitTarget?'<button class="btn primary" data-act="ipoWin">Ring the bell</button>':'')+'<button class="btn primary" data-act="close">Noted</button></div></div>';
  return h;
}
if(typeof MODAL_EXT!=='undefined')MODAL_EXT.board=(M,x)=>{const io=S.co&&S.co.ipo;if(!io)return null;return boardReportHTML(io,true);};
ACT_EXT.boardOpen=()=>{if(typeof isPublic==='function'&&isPublic())ui.modal={type:'board'};};

/* the report opens on its own once nothing more urgent is queued */
if(typeof nextModal==='function'){const _nm=nextModal;nextModal=function(){_nm.apply(this,arguments);
  if(!ui.modal&&S&&!S.intro&&!S.over&&typeof isPublic==='function'&&isPublic()&&S.co.ipo&&S.co.ipo.reportDue){S.co.ipo.reportDue=false;ui.modal={type:'board'};}};}

/* ---------- a standing Board section on the Strategy tab ---------- */
function boardPanelHTML(io){
  const r=io.lastReport;
  const OUST=(typeof OUST_STRIKES!=='undefined'?OUST_STRIKES:4);
  let h='<div class="sec"><h3>The board</h3><p class="lede">Every quarter the board reviews your results against the market’s expectations. Beat them and the shares rise; let the price stay collapsed for '+OUST+' quarters and they remove you as CEO.</p>';
  h+='<div class="tiles"><div class="tile"><span class="k">MRR vs expected</span><span class="v '+(groupMRR()>=io.expMRR?'pos':'neg')+'">'+gbp(groupMRR())+'</span><small>market wants '+gbp(io.expMRR)+'</small></div>'+
    '<div class="tile"><span class="k">Market cap</span><span class="v">'+gbp(marketCap())+'</span><small>target '+gbp(io.target)+'</small></div>'+
    '<div class="tile"><span class="k">Standing</span><span class="v '+(io.misses>=1?'neg':'pos')+'">'+(io.misses>=1?io.misses+' bad quarter'+(io.misses>1?'s':''):'Good standing')+'</span><small>'+(io.misses>=1?(OUST-io.misses)+' more and you’re out':'no strikes against you')+'</small></div></div>';
  if(r)h+='<div class="row" style="margin-top:10px"><button class="btn" data-act="boardOpen">Open the latest board report</button></div>';
  else h+='<p class="mut" style="font-size:.84rem;margin-top:8px">Your first board report lands at the next quarter end.</p>';
  return h+'</div>';
}
/* boardPanelHTML relocated to the Ownership tab (see zzr.js) */

/* ---------- the targets strip under the top bar (public only) ---------- */
function updateBoardStrip(){
  const pub=typeof isPublic==='function'&&isPublic();
  let el=document.getElementById('boardStrip');
  if(!pub){if(el)el.hidden=true;return;}
  if(!el){const t=document.querySelector('.top .ticker');if(!t||!t.parentNode)return;
    el=document.createElement('button');el.id='boardStrip';el.className='ticker';el.setAttribute('data-act','boardOpen');el.setAttribute('title','Open the board report');
    t.parentNode.insertBefore(el,t.nextSibling);}
  el.hidden=false;
  const io=S.co.ipo;const cap=marketCap();const capPct=io.target?Math.round(cap/io.target*100):0;const relFloat=io.price/io.floatPrice;
  const chip=(k,val,cls)=>'<span style="white-space:nowrap;margin-right:14px"><span class="mut" style="font-size:.66rem;text-transform:uppercase;letter-spacing:.06em">'+k+'</span> <b class="num '+(cls||'')+'">'+val+'</b></span>';
  const parts=[
    chip('MRR',gbp(groupMRR())+' / '+gbp(io.expMRR),groupMRR()>=io.expMRR?'pos':'neg'),
    chip('Cap',gbp(cap)+' / '+gbp(io.target)+' ('+capPct+'%)',cap>=io.target?'pos':''),
    chip('Share',spx(io.price),relFloat>=1?'pos':relFloat>=0.7?'wrn':'neg'),
    chip('Board',io.misses>=1?(io.misses+' bad qtr'+(io.misses>1?'s':'')+' · '+((typeof OUST_STRIKES!=='undefined'?OUST_STRIKES:4)-io.misses)+' from out'):'good standing',io.misses>=1?'neg':'pos')
  ];
  el.innerHTML='<span class="mast" style="color:var(--warn)">TARGETS</span><span class="txt" style="display:flex;flex-wrap:nowrap;overflow:hidden">'+parts.join('')+'</span>';
}
if(typeof renderTop==='function'){const _rt=renderTop;renderTop=function(){_rt.apply(this,arguments);try{updateBoardStrip();}catch(e){}};}
