
/* ============ build 26: regions and the map ============ */
const REGIONS={
  home:{t:'East Midlands',wage:1.0,rent:1.0,size:1.0,prices:1.0,comp:1.0,
    path:'M112,150 L150,150 L150,200 C140,207 123,207 112,200 Z',lx:131,ly:172},
  se:{t:'London & South East',wage:1.32,rent:1.55,size:1.7,prices:1.15,comp:1.5,
    path:'M112,201 C123,208 141,208 150,201 C160,206 173,206 185,201 C197,209 200,224 188,232 C172,242 150,240 134,230 C120,221 110,210 112,201 Z',lx:150,ly:220},
  sw:{t:'South West',wage:0.92,rent:0.9,size:0.7,prices:0.95,comp:0.7,
    path:'M66,201 L112,201 C110,211 105,224 96,235 C82,254 60,280 41,293 C30,300 23,289 29,278 C41,255 52,226 60,210 C62,204 61,201 66,201 Z',lx:74,ly:242},
  east:{t:'East of England',wage:1.05,rent:1.05,size:0.95,prices:1.02,comp:0.95,
    path:'M150,150 L150,200 C158,206 171,206 183,200 C197,193 203,178 195,166 C186,153 169,150 150,150 Z',lx:174,ly:174},
  wales:{t:'Wales & the West',wage:0.85,rent:0.8,size:0.65,prices:0.92,comp:0.65,
    path:'M74,150 L112,150 L112,200 C104,207 91,206 83,199 C71,190 65,175 67,163 C68,154 68,150 74,150 Z',lx:90,ly:175},
  north:{t:'The North',wage:0.9,rent:0.85,size:1.1,prices:0.95,comp:1.15,
    path:'M84,96 L149,96 C163,96 179,101 179,117 C179,135 166,149 148,150 L74,150 C60,150 55,138 57,126 C60,108 70,96 84,96 Z',lx:118,ly:122},
  scot:{t:'Scotland',wage:0.9,rent:0.82,size:0.8,prices:0.96,comp:0.7,
    path:'M92,24 C108,12 138,12 150,26 C158,36 151,47 161,57 C168,65 159,81 149,84 L149,96 L84,96 L84,82 C78,72 84,58 94,52 C86,42 84,32 92,24 Z',lx:120,ly:60}
};
const REG_ORDER=['scot','north','wales','east','home','sw','se'];
function regionOf(){return S.co.region||'home';}
function reg(k){return REGIONS[k]||REGIONS.home;}
function myPresence(k){const out=[];if(regionOf()===k)out.push('hq');for(const b of branches())if((b.region||'home')===k)out.push(b.id);return out;}
function regionsPresent(){const set=new Set([regionOf()]);for(const b of branches())set.add(b.region||'home');return [...set];}
function regRivals(k){return rivals().filter(r=>(r.region||'home')===k);}
function regClients(k){let n=regionOf()===k?active().length:0;for(const b of branches())if((b.region||'home')===k)n+=Math.round(b.clients);return n;}
function regMarket(k){const R=reg(k);let rc=regRivals(k).reduce((a,r)=>a+r.clients,0);return Math.round((120*R.size)+rc+regClients(k));}
function myShare(k){const t=regMarket(k);return t?regClients(k)/t:0;}

/* assign rivals to regions: mostly home and neighbours, a spread elsewhere */
function seedRegions(){
  const baseW=k=>(typeof regBase==='function'?regBase(k):reg(k).size*2000);
  for(const r of rivals())if(!r.region){
    r.region=wpick(REG_ORDER.map(k=>[k,baseW(k)*(k==='home'?1.15:1)]));}
  // every region should be contested in proportion to its SME base: redistribute to a base-scaled minimum
  const target=k=>Math.max(1,Math.round(baseW(k)/1000));
  for(let pass=0;pass<60;pass++){
    const under=REG_ORDER.filter(k=>regRivals(k).length<target(k));if(!under.length)break;
    const k=under[0];
    const over=REG_ORDER.filter(x=>x!==k&&regRivals(x).length>target(x)).sort((a,b)=>regRivals(b).length-regRivals(a).length)[0];
    if(!over)break;regRivals(over)[0].region=k;}
  // the biggest markets should have a mid or national of note
  for(const k of ['se','north']){if(!regRivals(k).some(r=>r.tier>=2)){
    const donor=rivals().filter(r=>r.tier>=2&&r.region!==k).sort((a,b)=>regRivals(b.region).length-regRivals(a.region).length)[0];
    if(donor)donor.region=k;}}
}
const _genMarket26=genMarket;genMarket=function(){_genMarket26();seedRegions();};
const _migrateSave26=migrateSave;migrateSave=function(){_migrateSave26();if(!S.co.region)S.co.region='home';seedRegions();for(const b of branches())if(!b.region)b.region='home';};

/* region economics feed branches */
const _brRent26=brRent;brRent=function(b){return Math.round(_brRent26(b)*reg(b.region||'home').rent);};
const _marketBrMgr26=marketBrMgr;marketBrMgr=function(b){return Math.round(_marketBrMgr26(b)*reg(b.region||'home').wage/10)*10;};

/* a greenfield branch: cheap, starts almost empty, grows into the local market */
const REG_SHORT={home:'East Midlands',se:'London',sw:'South West',east:'Eastern',wales:'Wales',north:'North',scot:'Scotland'};
function greenCost(k){return Math.round((25000+40000*reg(k).size)*reg(k).rent/1000)*1000;}
function openGreenfield(k){if(myPresence(k).length){if(typeof toast==='function')toast('You already operate in '+reg(k).t+'.');return;}
  const cost=greenCost(k);if(S.co.cash<cost)return;spend(cost);
  const b={id:uid(),name:(REG_SHORT[k]||reg(k).t)+' branch',rid:null,region:k,clients:ri(0,2),price:0.95,invest:true,grow:1.5,
    mgr:{name:pick(FIRST)+' '+pick(LAST),skill:ri(2,4),salary:Math.round(3600*reg(k).wage/10)*10},
    staff:1,sat:70,born:S.day,cash:0,hist:[]};
  branches().push(b);log('You’ve opened a new branch in '+reg(k).t+' for '+gbp(cost)+'. It starts small and grows into the local market.','good');ui.modal=null;x19('greenfield');}
ACT_EXT.greenOpen=k=>{if(REGIONS[k])openGreenfield(k);};

/* local firms come from that region; buying one there makes a branch there */
const _makeBranch26=makeBranch;makeBranch=function(x,rid){const b=_makeBranch26(x,rid);const r=rivalById(rid);b.region=x.region||(r&&r.region)||'home';return b;};
const _offerFor26=offerFor;
/* branch growth room uses the local market, not the global one */
const _branchesMonthly26=branchesMonthly;

/* ---------- the map ---------- */
function regColor(k){const p=myPresence(k);if(p.includes('hq'))return 'var(--p)';if(p.length)return 'var(--good)';const c=reg(k).comp;
  // shade unentered regions by how contested they are: busier markets read a touch darker
  return c>1.25?'var(--fl-r3)':c>1.05?'var(--fl-r2)':'var(--fl-r1)';}
function mapSVG(){
  const defs='<defs>'+
    '<linearGradient id="mSea" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" style="stop-color:var(--fl-sea1)"/><stop offset="1" style="stop-color:var(--fl-sea2)"/></linearGradient>'+
    '<filter id="mGlowP" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="0" stdDeviation="3.5" flood-color="var(--p)" flood-opacity="0.6"/></filter>'+
    '<filter id="mGlowG" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="var(--good)" flood-opacity="0.55"/></filter>'+
    '<filter id="mLift" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="1.2" stdDeviation="1.4" flood-color="#000" flood-opacity="0.18"/></filter>'+
  '</defs>';
  const sea='<rect x="0" y="0" width="240" height="320" rx="14" fill="url(#mSea)"/>';
  // non-present regions are flat so the country reads as one landmass; your regions glow and pop
  const flat=REG_ORDER.filter(k=>!myPresence(k).length).map(k=>{const R=reg(k);
    return '<path class="rgn" d="'+R.path+'" data-act="regionPick" data-v="'+k+'" fill="'+regColor(k)+'" stroke="var(--fl-coast)" stroke-width="0.8" stroke-linejoin="round"><title>'+R.t+' — '+regClients(k)+' clients</title></path>';}).join('');
  const mineP=REG_ORDER.filter(k=>myPresence(k).length).map(k=>{const R=reg(k),hq=myPresence(k).includes('hq');
    return '<path class="rgn mine" d="'+R.path+'" data-act="regionPick" data-v="'+k+'" fill="'+regColor(k)+'" stroke="'+(hq?'var(--p)':'var(--good)')+'" stroke-width="2" stroke-linejoin="round" filter="url(#'+(hq?'mGlowP':'mGlowG')+')"><title>'+R.t+' — '+regClients(k)+' clients</title></path>';}).join('');
  const parts=flat+mineP;
  // client-count pills sit on each region
  const labels=REG_ORDER.map(k=>{const R=reg(k),p=myPresence(k);const n=regClients(k);const w=n>=100?20:n>=10?16:12;
    const badge=p.length?'<circle cx="'+(R.lx)+'" cy="'+(R.ly-9)+'" r="2.6" fill="'+(p.includes('hq')?'var(--p)':'var(--good)')+'" stroke="var(--surface)" stroke-width="1"/>':'';
    return '<g style="pointer-events:none">'+badge+'<rect x="'+(R.lx-w/2)+'" y="'+(R.ly-2)+'" width="'+w+'" height="13" rx="6.5" fill="var(--surface)" opacity="0.92"/><text x="'+R.lx+'" y="'+(R.ly+7.5)+'" text-anchor="middle" font-size="8.5" font-weight="700" fill="var(--ink)">'+n+'</text></g>';}).join('');
  return '<svg viewBox="0 0 240 320" style="width:100%;max-width:320px;display:block;margin:2px auto">'+defs+sea+parts+labels+'</svg>'+
    '<div class="row" style="justify-content:center;gap:14px;flex-wrap:wrap;margin-top:2px;font-size:.78rem" class="mut">'+
    '<span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:var(--p);vertical-align:-1px"></i> Home</span>'+
    '<span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:var(--good);vertical-align:-1px"></i> Your branch</span>'+
    '<span class="mut"><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:var(--fl-r3);vertical-align:-1px"></i> Busier market</span></div>';
}
function paneMapModal(){
  let h='<div class="dialog wide"><p class="kick">The market across the country</p><h2>Regions</h2><p>Each region is its own market with its own rivals, wages and rent. Blue is your home; green is where you have a branch. The number on each is how many clients you serve there. Tap a region to expand into it.</p>';
  h+=mapSVG();
  h+='<table style="margin-top:10px"><thead><tr><th>Region</th><th class="r">Your clients</th><th>Known here</th><th class="r">Rivals</th><th class="r">Wages</th><th class="r">Rent</th><th></th></tr></thead><tbody>';
  for(const k of REG_ORDER){const R=reg(k),p=myPresence(k);const rr=typeof regRep==='function'?Math.round(regRep(k)):0;
    h+='<tr><td><button class="linkbtn" style="font-size:inherit;color:inherit;text-align:left;font-weight:'+(p.length?700:400)+'" data-act="regionPick" data-v="'+k+'">'+R.t+(p.includes('hq')?' (home)':p.length?' (branch)':'')+'</button></td><td class="r">'+regClients(k)+'</td><td class="'+(rr<38?'mut':rr>65?'pos':'')+'" style="font-size:.82rem">'+(typeof repWord==='function'?repWord(rr):rr)+'</td><td class="r">'+regRivals(k).length+'</td><td class="r">'+pctd(R.wage)+'</td><td class="r">'+pctd(R.rent)+'</td><td class="r"><button class="linkbtn" data-act="regionPick" data-v="'+k+'">view</button></td></tr>';}
  return h+'</tbody></table></div>';
}
function pctd(v){return (v>=1?'+':'')+Math.round((v-1)*100)+'%';}
function paneRegionModal(k){const R=reg(k),p=myPresence(k),rr=regRivals(k).sort((a,b)=>b.clients-a.clients);
  const cost=greenCost(k);
  let h='<div class="dialog"><button class="linkbtn" data-act="mapOpen" style="margin-bottom:8px">← All regions</button><p class="kick">'+(p.includes('hq')?'Home region':p.length?'You have a branch here':'A region you’re not in yet')+'</p><h2>'+R.t+'</h2>';
  h+='<div class="tiles"><div class="tile"><span class="k">SME base</span><span class="v" style="font-size:1rem">~'+(typeof regBase==='function'?regBase(k).toLocaleString():regMarket(k))+'</span><small>~'+(typeof regInPlay==='function'?regInPlay(k):0)+' in play a year</small></div><div class="tile"><span class="k">Your share</span><span class="v">'+pct(typeof regYoursShare==='function'?regYoursShare(k):myShare(k))+'</span><small>'+regClients(k)+' clients · rivals hold '+pct(typeof regRivalsShare==='function'?regRivalsShare(k):0)+'</small></div><div class="tile"><span class="k">Competition</span><span class="v" style="font-size:1rem">'+(R.comp>1.2?'Fierce':R.comp<0.8?'Light':'Normal')+'</span><small>'+rr.length+' rivals</small></div><div class="tile"><span class="k">Costs</span><span class="v" style="font-size:.95rem">wages '+pctd(R.wage)+'</span><small>rent '+pctd(R.rent)+'</small></div></div>'+(typeof regCeiling==='function'?(()=>{const cap=Math.max(1,regCeiling(k)),pen=clamp(regClients(k)/cap,0,1);return '<div class="note" style="margin:8px 0 0;padding:8px 10px"><div class="row" style="justify-content:space-between;font-size:.82rem;margin-bottom:4px"><span class="mut">Room to grow here</span><span><b>'+regClients(k)+'</b> of ~'+cap+' a firm your size can realistically hold'+(pen>0.85?' · near your ceiling':pen<0.4?' · plenty of room':'')+'</span></div><div style="height:6px;border-radius:3px;background:var(--line);overflow:hidden"><div style="height:100%;width:'+Math.round(pen*100)+'%;background:var('+(pen>0.85?'--bad':pen>0.6?'--wrn':'--p')+')"></div></div></div>';})():'');
  if(!p.length){h+='<h3 style="font-size:.95rem;margin:14px 0 6px">Move in</h3><ul class="list">'+
    '<li class="item"><span><b>Open a branch here</b></span><span class="r">'+(S.co.cash>=cost?'<button class="btn sm" data-act="greenOpen" data-v="'+k+'">Open · '+gbp(cost)+'</button>':'<span class="mut" style="font-size:.8rem">need '+gbp(cost)+'</span>')+'</span><span class="sub">A new office and a small team. Starts with barely any clients and grows into the local market. Cheapest way in, slowest to pay off.</span></li>'+
    '<li class="item"><span><b>Buy a local firm</b></span><span class="r"><span class="mut" style="font-size:.8rem">'+(rr.filter(r=>r.tier<=1).length?'see rivals below':'none small enough')+'</span></span><span class="sub">Instant clients and staff. Approach one of the firms below, buy it, and run it as a branch here.</span></li></ul>';}
  h+='<h3 style="font-size:.95rem;margin:14px 0 6px">Firms here</h3>'+(rr.length?'<ul class="list">'+rr.slice(0,8).map(r=>'<li class="item click" data-act="rivalCard" data-v="'+r.id+'"><span>'+esc(r.name)+' <span class="mut">'+['sole trader','small MSP','mid-size','national'][r.tier]+'</span></span><span class="r">'+(r.intel>=2?r.clients:'~'+Math.round(r.clients/5)*5)+' clients</span></li>').join('')+'</ul>':'<p class="mut">No rivals of note here.</p>');
  return h+'</div>';}
MODAL_EXT.map=()=>paneMapModal();
MODAL_EXT.region=M=>paneRegionModal(M.k);
ACT_EXT.mapOpen=()=>{ui.modal={type:'map'};};
ACT_EXT.regionPick=k=>{if(REGIONS[k])ui.modal={type:'region',k};};

/* a button into the map from the Strategy tab, above the branches */
const _paneStrategy26=paneStrategy;
paneStrategy=function(){let h=_paneStrategy26();const m=mrr();
  const here=regionsPresent().length;
  const mapBtn='<div class="sec"><h3>Sites and regions</h3><p class="lede">You’re in '+here+' region'+(here>1?'s':'')+'. The country is split into markets, each with its own rivals, wages and rent. Open a branch somewhere new, or buy a local firm.</p><button class="btn" data-act="mapOpen">Open the map</button></div>';
  // place it just before branches (or before Coming later)
  if(h.indexOf('Your branches')>=0)return h.replace('<div class="sec"><h3>Your branches</h3>',mapBtn+'<div class="sec"><h3>Your branches</h3>');
  if(h.indexOf('Coming later')>=0)return h.replace('<div class="sec"><h3>Coming later</h3>',mapBtn+'<div class="sec"><h3>Coming later</h3>');
  return h+mapBtn;};
/* the office header notes how many sites you run */
const _renderTop26=typeof renderTop==='function'?renderTop:null;

/* leads lean toward regions where you have branches, so expanding pays off */
const _addProspect26=addProspect;
addProspect=function(o){o=o||{};const d=_addProspect26(o);if(!d)return d;
  if(d.kind==='new'&&!d.region){const rp=regionsPresent();d.region=rp.length>1&&Math.random()<0.35?pick(rp):'home';}
  if(d.kind==='new'&&d.region){const rg=d.region;const local=rivals().filter(r=>(r.region||'home')===rg);
    const seats=d.seats||0;const n=d.big?ri(2,3):seats<=15?ri(1,2):ri(1,3);
    const w=r=>{const t=r.tier;const fit=seats<=15?[3,2,0.4,0.1][t]:seats<=40?[0.5,2,2,0.8][t]:[0,0.4,2,3][t];return fit*r.aggr*(0.5+r.rep/100)*((r.region||'home')===rg?3:0.4);};
    const pool=rivals().slice();const out=[];for(let i=0;i<n&&pool.length;i++){const r=wpick(pool.map(x=>[x,w(x)]));if(!r||w(r)<=0)break;out.push(r.id);pool.splice(pool.indexOf(r),1);}
    d.bidders=out;
    if(Math.random()<0.6){const inc=wpick((local.length?local:rivals()).map(r=>[r,r.clients+1]));if(inc){d.from=inc.id;d.bidders=d.bidders.filter(x=>x!==inc.id);}}else d.from=null;}
  return d;};

/* show each rival's region on its card, so the map and cards agree */
const _rivalModalY=MODAL_EXT.rival;
MODAL_EXT.rival=(M,x)=>{let h=_rivalModalY(M,x);if(h===null)return null;const r=rivalById(M.id);if(!r)return h;
  return h.replace('</p><h2>',' · based in '+reg(r.region||'home').t+'</p><h2>');};
/* a real fail-state: run the service into the ground for long enough and clients flee */
const _monthEndFail=monthEnd;
monthEnd=function(){_monthEndFail();
  if(S.over)return;
  const bad=slaPct()<0.4&&S.co.rep<25&&active().length>=6;
  S.co.collapse=bad?(S.co.collapse||0)+1:0;
  if(S.co.collapse>=1){const lose=active().filter(c=>c.notice==null&&!c.ending&&canLeave(c)).sort((a,b)=>a.sat-b.sat).slice(0,Math.ceil(active().length*(0.1+0.06*S.co.collapse)));
    for(const c of lose){c.notice=S.day+DPM;c.ending=true;c.why='unhappy';}
    log('Your service has collapsed (SLA '+pct(slaPct())+', reputation '+Math.round(S.co.rep)+'). '+lose.length+' clients are walking, and word is spreading.','bad');}
  if(S.co.collapse>=4){S.over={mi:monthOf(S.day),peak:Math.max(...S.hist.map(h=>h.mrr),mrr())};log('Months of failed service finished '+S.co.name+': the clients have gone and the name is worthless.','bad');}
};

/* region-appropriate place names, so firm names suit where they are */
const REG_PLACES={
  home:['Towcester','Silverstone','Brackley','Daventry','Kettering','Corby','Wellingborough','Rushden'],
  se:['Croydon','Bromley','Guildford','Woking','Maidstone','Reading','Slough','Watford'],
  sw:['Exeter','Taunton','Truro','Yeovil','Barnstaple','Bodmin','Bridgwater'],
  east:['Norwich','Ipswich','Cambridge','Colchester','Peterborough','Chelmsford','Bury St Edmunds'],
  wales:['Cardiff','Newport','Swansea','Wrexham','Bangor','Merthyr','Bridgend'],
  north:['Leeds','Bolton','Preston','Halifax','Rochdale','Wigan','Harrogate','Ripon'],
  scot:['Falkirk','Perth','Stirling','Paisley','Kirkcaldy','Dundee','Ayr']
};
function nameToRegion(){const used=new Set(rivals().map(r=>r.name));
  for(const r of rivals()){if(r.tier>=2)continue;const pl=REG_PLACES[r.region||'home']||REG_PLACES.home;
    for(let i=0;i<20;i++){const n=pick(pl)+' '+pick(MKT_SUFFIX);if(!used.has(n)){r.name=n;used.add(n);break;}}}
}
const _genMarketName=genMarket;genMarket=function(){_genMarketName();nameToRegion();S.mkt.named=1;};
const _migrateName=migrateSave;migrateSave=function(){_migrateName();if(S.mkt&&!S.mkt.named){nameToRegion();S.mkt.named=1;}};
/* clients carry a region, so rival quotes on them stay local */
const _resolveDealRegion=resolveDeal;
resolveDeal=function(d){const before=active().length;_resolveDealRegion(d);if(active().length>before){const c=active()[active().length-1];if(c&&!c.region)c.region=d.region||'home';}};
const _rivalForRegion=rivalFor;
rivalFor=function(c){const rg=c.region||'home';const base=_rivalForRegion(c);
  const local=rivals().filter(r=>(r.region||'home')===rg);
  if(local.length&&Math.random()<0.7)return wpick(local.map(r=>[r,r.aggr*(1+hostility(r))]));
  return base;};
/* show a tender's region on its screen and in the list */
const _tenderModalRegion=MODAL_EXT.tender;
MODAL_EXT.tender=(M,x0)=>{let h=_tenderModalRegion(M,x0);if(h===null)return null;const t=(S.tend&&S.tend.open||[]).find(z=>z.id===M.id);if(t&&t.region)h=h.replace(' tender · '+t.sector+'</p>',' tender · '+t.sector+' · '+reg(t.region).t+'</p>');return h;};
/* the Team tab is the hub: show the DevOps team and branch managers here too, steered on Strategy */
function otherTeamsSec(){const n=typeof devTeam==='function'?devTeam():0;const bs=branches();
  if(!n&&!bs.length)return '';
  let h='<div class="sec"><h3>Elsewhere in the company</h3><p class="lede">These teams are set up on the Strategy tab, but they are your people too.</p><ul class="list">';
  if(n)h+='<li class="item"><span>'+roleDot('eng')+'<b>DevOps team</b> <span class="mut">building bespoke systems</span></span><span class="r">'+n+' engineers</span><span class="sub">Set the team size and what they build on the <button class="linkbtn" data-act="tab" data-v="strategy">Strategy tab</button>.</span></li>';
  for(const b of bs)h+='<li class="item"><span>'+roleDot('hdm')+'<b>'+esc(b.mgr.name)+'</b> <span class="mut">manages '+esc(b.name)+'</span></span><span class="r">'+b.staff+' staff</span><span class="sub">'+Math.round(b.clients)+' clients in '+reg(b.region||'home').t+'. Steer this branch on the <button class="linkbtn" data-act="tab" data-v="strategy">Strategy tab</button>.</span></li>';
  return h+'</ul></div>';}
