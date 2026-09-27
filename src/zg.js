
/* ============ build 48: deeper regions — local reputation ============ */
/* Your reputation is no longer one national number for expansion: you're known
   at home and a nobody the moment you cross a border. A new branch has to build
   its name locally before work comes easily, which is why greenfield is a slow
   grind and buying a local firm (inheriting their standing) leaps you ahead.
   Local standing drives how hard deals are to win in each region. */
function regRep(k){S.co.regRep=S.co.regRep||{};if(S.co.regRep[k]==null){
    S.co.regRep[k]=(k===regionOf())?(S.co.rep||45):clamp((S.co.rep||45)*0.12+ri(2,10),4,22);}
  return S.co.regRep[k];}
function repWord(v){return v<18?'Unknown':v<38?'Barely known':v<58?'Getting known':v<78?'Well known':'Dominant';}
function regRepMonthly(){S.co.regRep=S.co.regRep||{};
  for(const k of REG_ORDER){const cur=regRep(k);const present=myPresence(k).length;let target;
    if(present){const share=myShare(k);target=clamp(38+share*260+((typeof slaPct==='function'?slaPct():0.9)-0.9)*120,18,96);}
    else{target=clamp((S.co.rep||45)*0.12+ri(0,6),3,24);}
    S.co.regRep[k]=clamp(cur+(target-cur)*0.16,0,100);}
  // a national campaign lifts your name everywhere
  if(typeof betLive==='function'&&betLive('campaign'))for(const k of REG_ORDER)S.co.regRep[k]=clamp(S.co.regRep[k]+1.6,0,100);
}
const _monthEnd_reg=monthEnd;monthEnd=function(){_monthEnd_reg();if(!S.over)regRepMonthly();};

/* local standing makes deals in a region easier or harder to win */
const _wc_reg=winChance;winChance=function(d,pm){let p=_wc_reg(d,pm);
  if(d&&d.region&&typeof regRep==='function'){p+=(regRep(d.region)-50)/320;}
  return clamp(p,0.03,0.95);};

/* buying a local firm hands you their standing in that region */
const _makeBranch_reg=makeBranch;makeBranch=function(x,rid){const b=_makeBranch_reg(x,rid);
  if(b&&b.region){S.co.regRep=S.co.regRep||{};const boost=clamp(40+(b.clients||0)*0.4,40,70);S.co.regRep[b.region]=Math.max(regRep(b.region),boost);
    log('Buying into '+reg(b.region).t+' gives you their local reputation, '+repWord(S.co.regRep[b.region]).toLowerCase()+' from day one.','good');}
  return b;};

/* richer region card: your standing and the local tender pipeline */
const _paneRegionModal_reg=paneRegionModal;
paneRegionModal=function(k){let h=_paneRegionModal_reg(k);const rr=Math.round(regRep(k));const present=myPresence(k).length;
  const open=(typeof tenders==='function')?tenders().open.filter(x=>(x.region||'home')===k):[];
  const trend=present?'grows as you serve clients and win work locally':(rr<18?'nobody here has heard of you':'you’re barely known here');
  const sec='<h3 style="font-size:.95rem;margin:14px 0 6px">Your standing here</h3>'+
    '<div class="tiles"><div class="tile"><span class="k">Reputation here</span><span class="v" style="font-size:1rem">'+repWord(rr)+'</span><small>'+rr+'/100</small></div>'+
    '<div class="tile"><span class="k">Open tenders</span><span class="v '+(open.length?'pos':'')+'">'+open.length+'</span><small>in this region</small></div></div>'+
    '<p class="mut" style="font-size:.82rem">Your name here '+trend+'. Deals are '+(rr<40?'<span class="neg">harder</span>':rr>65?'<span class="pos">easier</span>':'about average')+' to win until it climbs, which is why a fresh branch starts slow and buying a local firm jumps you ahead.</p>';
  return h.indexOf('>Firms here</h3>')>=0?h.replace(/<h3 style="[^"]*">Firms here<\/h3>/,sec+'$&'):h+sec;};
