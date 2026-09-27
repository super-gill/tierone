
/* ============ build 46: the Market, its own tab and a proper command centre ============ */
/* Everything about the competition in one place: where you sit, who's friend or
   threat, rich detail per firm, alliances and cartels, and the tender board. */
function mktSortKey(){return ui.mktSort||'clients';}
function mktFilter(){return ui.mktFilter||'all';}
ACT_EXT.mktSort=v=>{ui.mktSort=v;};
ACT_EXT.mktFilter=v=>{ui.mktFilter=v;};
function relKnown(r){return (r.intel||0)>=1||r.metAt;}
function rivalChips(r){const c=[];
  if(typeof ally==='function'&&ally(r))c.push(['pos','Ally']);
  else{if(agreed(r,'refer'))c.push(['','Referrals']);if(agreed(r,'overflow'))c.push(['','Overflow']);if(agreed(r,'nopoach'))c.push(['','No-poach']);}
  if(typeof inCartel==='function'&&inCartel(r))c.push(['wrn','Cartel']);
  if(r.stake)c.push(['','20% stake']);
  if(S.co&&S.co.moles&&S.co.moles[r.id])c.push(['wrn','Mole']);
  if(r.target>S.day)c.push(['neg','Targeting you']);
  return c;}
function priceVsYou(r){const my=myPriceRatio();return r.price<my-0.03?['pos','cheaper than you']:r.price>my+0.03?['neg','dearer than you']:['mut','priced like you'];}
function mktStars(v){const n=Math.max(1,Math.round(v/20));return '★'.repeat(n)+'☆'.repeat(5-n);}

function paneMarket(){
  if(!S.mkt)return '<div class="sec"><p class="empty">Your market opens up once you’re trading. Win a client or two first.</p></div>';
  const me={clients:active().length};
  const all=rivals();
  const ranked=all.concat([{me:true,clients:active().length}]).sort((a,b)=>b.clients-a.clients);
  const rank=ranked.findIndex(r=>r.me)+1;
  const alliesN=(typeof allies==='function')?allies().length:0;
  const threatsN=all.filter(r=>r.target>S.day).length;
  const cartelN=(typeof cartelSize==='function')?cartelSize():0;
  let h='<div class="sec"><h3>Your market</h3><p class="lede">The MSPs you compete with for clients. You’re number '+rank+' of '+ranked.length+' by clients. Small deals draw cheap sole traders; big ones draw firms with scale and certificates.</p>'+
    '<div class="tiles"><div class="tile"><span class="k">Your rank</span><span class="v">#'+rank+'</span><small>of '+ranked.length+' by clients</small></div>'+
    '<div class="tile"><span class="k">Allies</span><span class="v '+(alliesN?'pos':'')+'">'+alliesN+'</span><small>'+(cartelN?cartelN+' in your cartel':'formal partnerships')+'</small></div>'+
    '<div class="tile"><span class="k">Threats</span><span class="v '+(threatsN?'neg':'')+'">'+threatsN+'</span><small>'+(threatsN?'going after your clients':'nobody’s circling')+'</small></div></div>';
  // industry event
  if(typeof RACTS!=='undefined'&&RACTS.event){const why=RACTS.event.ok();h+='<p class="mut" style="font-size:.82rem;margin-top:6px">'+(why?'Industry event: '+why:'<button class="linkbtn" data-act="rAct" data-v=":event">Go to an industry event</button> (£1,500, a day out) to learn about several firms at once.')+'</p>';}
  h+='</div>';
  // cartel status
  if(cartelN){h+='<div class="sec"><h3>Your cartel <span class="neg" style="font-weight:400;font-size:.8rem">— illegal</span></h3><p class="lede">Firms holding prices with you: '+cartelIds().map(id=>{const x=rivalById(id);return x?esc(x.name):'a firm';}).join(', ')+'. Margins hold up while it lasts, and the heat builds. <button class="linkbtn" data-act="cartelLeave">Wind it up</button></p></div>';}
  // filter + sort controls
  const F=mktFilter(),SK=mktSortKey();
  h+='<div class="sec"><div class="row" style="gap:6px;flex-wrap:wrap"><span class="seg" style="flex-wrap:wrap">'+
    [['all','All'],['allies','Allies'],['threats','Threats'],['cartel','Cartel'],['friendly','Friendly'],['big','Big fish']].map(([k,l])=>'<button data-act="mktFilter" data-v="'+k+'" aria-pressed="'+(F===k)+'">'+l+'</button>').join('')+'</span></div>'+
    '<div class="row" style="gap:6px;margin-top:6px"><span class="mut" style="font-size:.8rem;align-self:center">Sort:</span><span class="seg">'+
    [['clients','Size'],['price','Price'],['rel','Relationship'],['threat','Threat']].map(([k,l])=>'<button data-act="mktSort" data-v="'+k+'" aria-pressed="'+(SK===k)+'">'+l+'</button>').join('')+'</span></div>';
  // build the list
  let list=all.slice();
  if(F==='allies')list=list.filter(r=>typeof ally==='function'&&ally(r));
  else if(F==='threats')list=list.filter(r=>r.target>S.day);
  else if(F==='cartel')list=list.filter(r=>typeof inCartel==='function'&&inCartel(r));
  else if(F==='friendly')list=list.filter(r=>(r.stance||0)>=15);
  else if(F==='big')list=list.filter(r=>r.tier>=2);
  const my=myPriceRatio();
  list.sort((a,b)=>{if(SK==='price')return a.price-b.price;if(SK==='rel')return (b.stance||0)-(a.stance||0);if(SK==='threat')return ((b.target>S.day?1:0)+hostility(b))-((a.target>S.day?1:0)+hostility(a));return b.clients-a.clients;});
  if(!list.length)h+='<p class="empty">No firms match that filter.</p>';
  else h+='<ul class="list">'+list.map(r=>{const pv=priceVsYou(r);const chips=rivalChips(r);const cl=(r.intel||0)>=2?r.clients:'~'+Math.max(5,Math.round(r.clients/5)*5);
    return '<li class="item"><span><button class="linkbtn" style="font-size:inherit;color:inherit;text-align:left;font-weight:700" data-act="rivalCard" data-v="'+r.id+'">'+esc(r.name)+'</button> <span class="mut">'+MKT_TIERS[r.tier].t+'</span>'+(r.target>S.day?' <span class="chip" style="background:var(--bad);color:#fff">threat</span>':(typeof ally==='function'&&ally(r)?' <span class="chip" style="background:var(--good);color:#fff">ally</span>':''))+'</span>'+
      '<span class="r">'+cl+' clients'+(r.trend?' <span class="'+(r.trend>0?'pos':'neg')+'">'+(r.trend>0?'▲':'▼')+'</span>':'')+'</span>'+
      '<span class="sub"><span class="'+pv[0]+'">'+pv[1]+'</span> · '+mktStars(r.rep)+(r.iso?' · ISO':'')+' · about '+rSeats(r).toLocaleString('en-GB')+' users'+
      (relKnown(r)?' · <b>'+stanceWord(r.stance||0)+'</b>'+((r.intel||0)>=1?', '+trustWord(r.trust||50):''):' · not met')+
      (chips.length?'<span class="chips" style="display:block;margin-top:4px">'+chips.map(c=>'<span class="chip'+(c[0]?' '+c[0]:'')+'">'+c[1]+'</span>').join(' ')+'</span>':'')+
      '</span></li>';}).join('')+'</ul>';
  h+='<p class="mut" style="font-size:.8rem;margin-top:6px">Click a firm for its full card: their story, your history together, and everything you can do with or to them.</p></div>';
  // tenders now have their own tab; keep a short pointer here
  h+='<div class="sec"><p class="mut" style="font-size:.85rem">Formal contracts out to bid live on the <button class="linkbtn" data-act="tab" data-v="tenders">Tenders tab</button> now, with value-adds, consortium bids, reference clients and frameworks.</p></div>';
  return h;
}
