
/* ============ build 21: a market of rival MSPs, from sole traders to nationals ============ */
const MKT_TIERS=[
  {k:'sole',t:'Sole trader',staff:[1,2],clients:[4,12],seats:8,price:[0.76,0.9],rep:[35,60],iso:0,grow:[0.006,0.04]},
  {k:'small',t:'Small MSP',staff:[4,12],clients:[15,45],seats:14,price:[0.88,1.0],rep:[45,70],iso:0.2,grow:[0.012,0.032]},
  {k:'mid',t:'Mid-size MSP',staff:[20,60],clients:[60,160],seats:22,price:[0.96,1.07],rep:[55,75],iso:0.7,grow:[0.008,0.024]},
  {k:'nat',t:'National',staff:[150,400],clients:[400,900],seats:35,price:[1.04,1.15],rep:[60,80],iso:1,grow:[0.003,0.013]}
];
const MKT_SUFFIX=['IT','Tech','IT Services','Computer Services','Networks','IT Solutions','Systems','Digital','Support'];
const MKT_NATS=['Brightwave Group','Ardent Technology','Northstar IT','Meridian Managed Services','Albion Tech Partners'];
const MKT_MIDS=['Castlegate IT','Silverline Managed Services','Pinnacle Support','Watling Digital','Nene Valley Tech'];
function mktName(tier){const used=new Set((S.mkt?S.mkt.r:[]).map(r=>r.name));
  const pool=tier===3?MKT_NATS:tier===2?MKT_MIDS:null;
  if(pool){const f=pool.filter(n=>!used.has(n));if(f.length)return pick(f);}
  for(let i=0;i<30;i++){const n=tier===0?pick(FIRST)+' '+pick(LAST)+' IT':pick(PLACES)+' '+pick(MKT_SUFFIX);if(!used.has(n)&&n!==S.co.name)return n;}
  return pick(PLACES)+' '+pick(MKT_SUFFIX)+' '+ri(2,9);}
function mkRival(tier,scale){const T=MKT_TIERS[tier];const clients=Math.round(ri(T.clients[0],T.clients[1])*(scale||1));
  return {id:uid(),name:mktName(tier),tier,clients,staff:Math.max(1,Math.round(clients/(T.clients[1]/T.staff[1]))),price:rnd(T.price[0],T.price[1]),rep:rnd(T.rep[0],T.rep[1]),iso:Math.random()<T.iso,aggr:rnd(0.5,1.5),trend:0,born:S.day};}
function genMarket(){S.mkt={r:[],news:0};const big=Math.max(1,active().length/300);
  // a real regional market has a long tail of small firms and a few larger ones; density is set so the
  // big regions (seeded by SME base in seedRegions) end up genuinely contested rather than empty
  for(const [t,n] of [[0,20],[1,16],[2,9],[3,6]])for(let i=0;i<n;i++)S.mkt.r.push(mkRival(t,t===3?big:1));}
function rivals(){return (S.mkt&&S.mkt.r)||[];}
/* pick a region for a newly-spawned rival: base-weighted, favouring regions below their target density */
function spawnRegion(){if(typeof regBase!=='function'||typeof regRivals!=='function'||typeof REG_ORDER==='undefined')return 'home';
  const tgt=k=>Math.max(1,Math.round(regBase(k)/1000));
  return wpick(REG_ORDER.map(k=>[k,(regBase(k)/1000)*(regRivals(k).length<tgt(k)?4:1)]));}
function rivalById(id){return rivals().find(r=>r.id===id);}
function rSeats(r){return Math.round(r.clients*MKT_TIERS[r.tier].seats);}
function myPriceRatio(){return S.price.support/refPrice('support');}
function sizeTier(){const n=staffOn().length;return n<=3?0:n<=15?1:n<=80?2:3;}
/* who bids for a deal: small deals draw small, cheap firms; big ones draw firms with scale and certificates */
function pickBidders(seats,big){const w=r=>{const t=r.tier;const fit=seats<=15?[3,2,0.4,0.1][t]:seats<=40?[0.5,2,2,0.8][t]:[0,0.4,2,3][t];return fit*r.aggr*(0.5+r.rep/100);};
  const pool=rivals().slice();const out=[];const n=big?ri(2,3):seats<=15?ri(1,2):ri(1,3);
  for(let i=0;i<n&&pool.length;i++){const r=wpick(pool.map(x=>[x,w(x)]));if(!r||w(r)<=0)break;out.push(r.id);pool.splice(pool.indexOf(r),1);}
  return out;}
function rivalEdge(r,d){const seats=d.kind==='new'?d.seats:0;const mine=typeof catRatio==='function'?catRatio(d)*(d.pm||1):myPriceRatio();
  let e=(r.rep-S.co.rep)/60+(mine-r.price)*1.6;
  if(seats>=30||d.big)e+=(r.tier-sizeTier())*0.18+(r.iso&&!S.co.iso?0.15:0);
  if(seats<=15&&r.tier===0)e+=0.1;
  return e;}
const _addProspect21=addProspect;
addProspect=function(o){const d=_addProspect21(o);if(d&&!d.bidders){d.bidders=pickBidders(d.seats||0,d.big);if(d.kind==='new'&&Math.random()<0.55){const inc=wpick(rivals().map(r=>[r,r.clients]));if(inc&&!d.bidders.includes(inc.id))d.from=inc.id;}}return d;};
const _winChance21=winChance;
winChance=function(d,pm){let p=_winChance21(d,pm);if(d.kind!=='new'||!d.bidders||!d.bidders.length)return p;
  const dd=Object.assign({},d,{pm:pm||1});let s=0;for(const id of d.bidders){const r=rivalById(id);if(r)s+=clamp(rivalEdge(r,dd),-0.6,0.8);}
  return clamp(p-s*0.12,0.03,0.9);};
function competeNote(d){if(d.kind!=='new'||!d.bidders||!d.bidders.length)return '';const rs=d.bidders.map(rivalById).filter(Boolean);if(!rs.length)return '';
  const inc=d.from&&rivalById(d.from);
  return '<p class="note">'+(inc?'They’re with '+esc(inc.name)+' today. ':'')+'Also bidding: '+rs.map(r=>'<button class="linkbtn" style="font-size:inherit;color:inherit;font-weight:700" data-act="rivalCard" data-v="'+r.id+'">'+esc(r.name)+'</button> ('+['sole trader','small MSP','mid-size MSP','national'][r.tier]+', '+priceWord(r.price)+(r.iso?', ISO 27001':'')+')').join(', ')+'.</p>';}
function priceWord(x){return x<0.88?'cheap':x<0.97?'keen on price':x<1.05?'market rate':'premium';}
/* who won when you lost, and what it did to them */
const _lossReason21=lossReason;
lossReason=function(d){const rs=(d.bidders||[]).map(rivalById).filter(Boolean);if(d.kind!=='new'||!rs.length)return _lossReason21(d);
  const dd=Object.assign({},d);const win=wpick(rs.map(r=>[r,Math.max(0.1,1+rivalEdge(r,dd))]));win.clients++;win.won=(win.won||0)+1;win.beatMe=(win.beatMe||0)+1;
  const mine=typeof catRatio==='function'?catRatio(d)*(d.pm||1):1;
  const why=win.price<mine-0.04?'on price':(d.seats>=30||d.big)&&win.tier>sizeTier()?'with a bigger team'+(win.iso&&!S.co.iso?' and ISO 27001':''):win.rep>S.co.rep+8?'on reputation':'';
  return win.name+' won it'+(why?' '+why:'')+'.';};
/* winning a client from a rival */
const _resolveDeal21=resolveDeal;
resolveDeal=function(d){const n=active().length;_resolveDeal21(d);if(active().length>n){for(const id of d.bidders||[]){const r=rivalById(id);if(r)r.lostToMe=(r.lostToMe||0)+1;}if(d.from){const r=rivalById(d.from);if(r){r.clients=Math.max(0,r.clients-1);r.lost=(r.lost||0)+1;r.iTook=(r.iTook||0)+1;}}}};
/* rivals that quote your clients are real firms now */
function rivalFor(c){const mine=priceRatio(c);const w=r=>r.aggr*(r.price<mine?1.5:0.6)*(c.seats<=15?[2,1.5,0.6,0.2][r.tier]:[0.3,1,1.5,1.5][r.tier]);return wpick(rivals().map(r=>[r,w(r)]));}
function rivalWins(name){const r=rivals().find(x=>x.name===name);if(r){r.clients++;r.won=(r.won||0)+1;r.took=(r.took||0)+1;}}

/* ---------- the market moves every month ---------- */
function marketMonthly(){if(!S.mkt)genMarket();const M=S.mkt;const news=[];M.gone=[];
  for(const r of M.r.slice()){const T=MKT_TIERS[r.tier];
    let g=rnd(T.grow[0],T.grow[1])+(r.rep-60)/1500+rnd(-0.015,0.015)-(S.mktIdx&&r.price>1.1?0.005:0);
    // a firm you hold a stake in grows faster: your capital and referrals behind it
    if(r.stake)g+=0.009;
    // rivals draw from the same finite base: a rival in a filling region runs out of easy in-play work too
    if(g>0&&typeof regServedFrac==='function')g*=clamp(1-regServedFrac(r.region||'home')*0.6,0.25,1);
    const before=r.clients;const fc=Math.max(0,r.clients*(1+g));r.clients=Math.floor(fc)+(Math.random()<fc%1?1:0);r.trend=r.clients-before;(r.hist=r.hist||[]).push(r.clients);if(r.hist.length>12)r.hist.shift();
    r.rep=clamp(r.rep+rnd(-1.2,1.2),20,95);r.price=clamp(r.price+rnd(-0.01,0.01),0.7,1.25);r.staff=Math.max(1,Math.round(r.clients/(T.clients[1]/T.staff[1])));
    // tiers move with size
    if(r.tier<3&&r.clients>MKT_TIERS[r.tier].clients[1]*1.4){r.tier++;news.push(r.name+' has grown into a '+MKT_TIERS[r.tier].t.toLowerCase()+'.');}
    // small firms fold or retire
    let fold=r.tier===0?0.03:r.tier===1?0.008:0;
    if(r.stake)fold*=0.35;   // a backer keeps a firm from going under
    if(r.clients<2||Math.random()<fold){M.gone.push({id:r.id,reason:'fold'});M.r=M.r.filter(z=>z!==r);news.push(r.name+(r.tier===0?' has retired and closed down.':' has gone out of business.'));continue;}
  }
  // nationals buy smaller firms
  const nats=M.r.filter(r=>r.tier===3);if(nats.length&&Math.random()<0.02){const t=pick(M.r.filter(r=>r.tier===1||r.tier===2)||[]);if(t){const n=pick(nats);n.clients+=t.clients;M.gone.push({id:t.id,reason:'bought'});M.r=M.r.filter(z=>z!==t);news.push(n.name+' has bought '+t.name+'.');}}
  // new firms start up
  if(Math.random()<0.2){const r=mkRival(0);r.clients=ri(1,4);r.region=spawnRegion();M.r.push(r);news.push('A new one-person MSP, '+r.name+', has set up locally.');}
  if(M.r.filter(r=>r.tier>=2).length<3&&Math.random()<0.05){const r=mkRival(2);r.region=spawnRegion();M.r.push(r);news.push(r.name+' has opened an office in the area.');}
  // keep every region contested in proportion to its base as firms fold and get bought
  if(typeof regBase==='function'&&Math.random()<0.18){const need=REG_ORDER.filter(k=>regRivals(k).length<Math.max(1,Math.round(regBase(k)/1000)));if(need.length){const k=pick(need);const r=mkRival(regBase(k)>=2500&&Math.random()<0.35?2:Math.random()<0.6?0:1);r.region=k;M.r.push(r);news.push(r.name+' has set up in '+reg(k).t+'.');}}
  for(const t of news.slice(0,2))log('Market: '+t,'info');
}
const _monthEnd21=monthEnd;monthEnd=function(){_monthEnd21();marketMonthly();};
const _migrateSave21=migrateSave;migrateSave=function(){_migrateSave21();if(!S.mkt)genMarket();};
const _newState21=newState;newState=function(a,b){const r=_newState21(a,b);genMarket();return r;};
/* retiring owners who sell to you are real firms; so is a large rival you approach */
const _acqCtx21=EVENTS.acquire.ctx;
EVENTS.acquire.ctx=function(){const x=_acqCtx21();const r=pick(rivals().filter(z=>z.tier<=1&&z.clients>=4));if(r){x.name=r.name;x.rid=r.id;if(r.tier===0){x.owner=r.name.replace(/ IT$/,'');}}return x;};
const _doAcq21=doAcq;doAcq=function(x,p){_doAcq21(x,p);if(x.rid&&S.mkt){S.mkt.r=S.mkt.r.filter(r=>r.id!==x.rid);}};
const _bigRival21=bigRival;bigRival=function(){_bigRival21();const my=mrr();const cand=rivals().filter(r=>r.tier>=1&&rSeats(r)*45<my*0.8).sort((a,b)=>b.clients-a.clients)[0];
  if(cand&&S.pending&&S.pending.id==='acquire'){const x=S.pending.ctx;x.name=cand.name;x.owner='The board of '+cand.name;x.rid=cand.id;}};

/* ---------- where you stand ---------- */
function marketSec(){if(!S.mkt)return '';
  const me={name:S.co.name,tier:sizeTier(),clients:active().length,price:myPriceRatio(),rep:S.co.rep,iso:!!S.co.iso,me:true,trend:0};
  const all=rivals().concat([me]).sort((a,b)=>b.clients-a.clients);const rank=all.indexOf(me)+1;
  const stars=v=>'★'.repeat(Math.max(1,Math.round(v/20)))+'☆'.repeat(5-Math.max(1,Math.round(v/20)));
  const shown=ui.mktAll?all:all.filter((r,i)=>i<10||r.me);const rows=shown.map(r=>'<tr'+(r.me?' style="font-weight:700"':'')+'><td>'+(r.me?esc(r.name)+' (you)':'<button class="linkbtn" style="font-size:inherit;color:inherit;text-align:left" data-act="rivalCard" data-v="'+r.id+'">'+esc(r.name)+'</button>')+'</td><td>'+MKT_TIERS[r.tier].t+'</td><td class="r">'+(r.me||(r.intel||0)>=2?r.clients:'~'+Math.max(1,Math.round(r.clients/5)*5))+(r.trend?' <span class="'+(r.trend>0?'pos':'neg')+'">'+(r.trend>0?'▲':'▼')+'</span>':'')+'</td><td>'+priceWord(r.price)+'</td><td>'+stars(r.rep)+'</td><td>'+(r.iso?'ISO':'')+'</td><td>'+(r.me?'':stanceWord(r.stance||0))+'</td></tr>').join('');
  return '<div class="sec"><h3>Your market</h3><p class="lede">The MSPs you compete with for clients. Small deals draw cheap sole traders and small firms; big ones draw firms with bigger teams and certificates. You’re number '+rank+' of '+all.length+' by clients.</p><table><thead><tr><th>MSP</th><th>Size</th><th class="r">Clients</th><th>Price</th><th>Reputation</th><th></th><th>Stance</th></tr></thead><tbody>'+rows+'</tbody></table>'+(all.length>11?'<p style="margin-top:6px"><button class="linkbtn" data-act="mktAll">'+(ui.mktAll?'Show the top ten':'Show all '+all.length)+'</button></p>':'')+'<p class="mut" style="font-size:.8rem">Click a firm to see more.</p></div>';}

/* ---------- a card for each rival ---------- */
function rivalStyle(r){const out=[];
  if(r.price<0.88)out.push('Cheap and aggressive on price.');else if(r.price>1.06)out.push('Charges a premium and rarely discounts.');
  if(r.tier>=2&&r.iso)out.push('Strong on big contracts: scale and certificates.');
  if(r.aggr>1.2)out.push('Chases every deal going.');else if(r.aggr<0.75)out.push('Picks its battles.');
  const h=r.hist||[];if(h.length>=4){const g=(h[h.length-1]-h[0])/Math.max(1,h[0]);if(g>0.15)out.push('Growing fast.');else if(g<-0.1)out.push('Struggling: losing clients.');}
  if(r.rep<45)out.push('Clients grumble about them.');else if(r.rep>75)out.push('Well thought of locally.');
  return out.join(' ')||'Steady and unremarkable.';}
function spark(h){if(!h||h.length<2)return '<span class="mut" style="font-size:.8rem">Not enough history yet.</span>';const w=220,ht=48,mx=Math.max(...h),mn=Math.min(...h),sp=Math.max(1,mx-mn);
  const pts=h.map((v,i)=>(i*w/(h.length-1)).toFixed(1)+','+(ht-4-(v-mn)/sp*(ht-8)).toFixed(1)).join(' ');
  return '<svg width="'+w+'" height="'+ht+'" viewBox="0 0 '+w+' '+ht+'" role="img" aria-label="Clients over the last '+h.length+' months"><polyline points="'+pts+'" fill="none" stroke="var(--p)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg><div class="mut" style="font-size:.76rem">'+h[0]+' to '+h[h.length-1]+' clients over '+h.length+' months</div>';}
MODAL_EXT.rival=(M,x)=>{const r=rivalById(M.id);if(!r)return null;const T=MKT_TIERS[r.tier];
  const back=M.back?'<button class="linkbtn" data-act="deal" data-v="'+M.back+'" style="margin-bottom:8px">← Back to the deal</button>':'';
  const stars=v=>'★'.repeat(Math.max(1,Math.round(v/20)))+'☆'.repeat(5-Math.max(1,Math.round(v/20)));
  const vs=(a,b)=>'<tr><td>'+a+'</td><td class="r">'+b+'</td></tr>';
  return '<div class="dialog">'+x+back+'<p class="kick">'+T.t+'</p><h2>'+esc(r.name)+'</h2><p>'+rivalStyle(r)+'</p>'+
    '<div class="tiles"><div class="tile"><span class="k">Clients</span><span class="v">'+r.clients+'</span><small>about '+rSeats(r).toLocaleString('en-GB')+' users</small></div><div class="tile"><span class="k">Staff</span><span class="v">'+r.staff+'</span><small>roughly</small></div><div class="tile"><span class="k">Price</span><span class="v" style="font-size:1rem">'+priceWord(r.price)+'</span><small>'+(r.price<myPriceRatio()-0.03?'cheaper than you':r.price>myPriceRatio()+0.03?'dearer than you':'about what you charge')+'</small></div><div class="tile"><span class="k">Reputation</span><span class="v" style="font-size:1rem">'+stars(r.rep)+'</span><small>'+(r.iso?'ISO 27001':'no ISO 27001')+'</small></div></div>'+
    '<h3 style="font-size:.95rem;margin:12px 0 4px">Clients over time</h3>'+spark(r.hist)+
    '<h3 style="font-size:.95rem;margin:12px 0 4px">You and them</h3><table><tbody>'+vs('Deals they beat you to',r.beatMe||0)+vs('Deals you beat them to',r.lostToMe||0)+vs('Your clients they took',r.took||0)+vs('Their clients you took',r.iTook||0)+'</tbody></table>'+
    '<p class="mut" style="font-size:.8rem;margin-top:10px">Partnering with, targeting or buying other MSPs comes in a later build.</p></div>';};
ACT_EXT.rivalCard=v=>{if(!rivalById(v)){if(typeof toast==='function')toast('That firm is no longer trading.');return;}const back=ui.modal&&ui.modal.type==='deal'?ui.modal.id:null;ui.modal={type:'rival',id:v,back};};
ACT_EXT.mktAll=()=>{ui.mktAll=!ui.mktAll;};
function backfill(r){const h=[r.clients];let c=r.clients;const T=MKT_TIERS[r.tier];for(let i=0;i<7;i++){c=Math.max(1,Math.round(c/(1+rnd(T.grow[0],T.grow[1])+rnd(-0.02,0.02))));h.unshift(c);}r.hist=h;}
const _migrateSave21b=migrateSave;migrateSave=function(){_migrateSave21b();for(const r of rivals())if(!r.hist)backfill(r);};
const _genMarket21=genMarket;genMarket=function(){_genMarket21();for(const r of rivals())backfill(r);};
