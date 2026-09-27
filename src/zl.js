
/* ============ build 72: tender expansion ============
   Its own tab, richer bids (value-adds, consortium, reference clients, pre-bid
   meeting), framework agreements with call-offs, rare mega tenders, and
   post-loss feedback. Redefines the build-22 tender core where it needs to. */

/* a bigger size on top of small/medium/large */
if(typeof TENDER_SIZES!=='undefined'&&!TENDER_SIZES.some(z=>z.k==='x')){
  TENDER_SIZES.push({k:'x',t:'Major',seats:[500,1200],term:[48,60],reqs:[['ce',1],['iso',1],['iso9001',0.7],['iso20000',0.6],['iso22301',0.5],['iso14001',0.35],['techs',1,20],['turnover',1,2500000],['noc',1],['soc',0.6],['pi',1,5000000],['sector',0.7,4],['years',1,4]],wPrice:[0.3,0.45]});
}

/* ---------- value-adds you can put on a bid ---------- */
const VADD={
  onboard:{t:'Free onboarding',d:'Waive the setup fees. Buyers notice.',q:0.05,cost:x=>Math.round(tenderVal(x)*0.5)},
  transition:{t:'Transition cover',d:'Run their old provider in parallel for a month, on you.',q:0.06,cost:x=>Math.round(tenderVal(x)*0.9)},
  sla:{t:'Enhanced SLA',d:'Tighter response targets, with penalties if you miss them.',q:0.07,cost:x=>0,risk:true},
  lead:{t:'Dedicated account lead',d:'A named senior contact for them.',q:0.04,cost:x=>0,needAm:true}
};
const VADD_ORDER=['onboard','transition','sla','lead'];
function tenderVal(x){return (typeof tenderValue==='function')?tenderValue(x):x.svc.reduce((a,k)=>a+refPrice(k)*(SVC[k].unit==='site'?Math.max(1,Math.ceil(x.seats/30)):x.seats),0);}

/* eligible reference clients: happy, in-sector, not already leaving */
function refCands(x){return active().filter(c=>c.sector===x.sector&&c.sat>=72&&c.notice==null).sort((a,b)=>b.sat-a.sat).slice(0,6);}
/* an ally big/able enough to bid with */
function consortiumCands(x){if(typeof allies!=='function')return [];return allies().filter(r=>r.tier>=1);}

/* quality the player's bid earns, before the field is normalised */
function bidQuality(x,b){
  b=b||x.bid||{};
  let q=S.co.rep/100*0.6+(S.co.iso?0.1:0)+sizeTier()*0.05
    +(S.co.iso9001?0.03:0)+(S.co.iso20000?0.04:0)+(S.co.iso22301?0.03:0)+(S.co.iso14001?0.02:0)
    +Math.min(0.15,active().filter(c=>c.sector===x.sector).length*0.03)
    +(slaPct()>0.95?0.05:0)+(b.writer?0.06:0);
  // value-adds
  for(const k of (b.vadd||[]))if(VADD[k])q+=VADD[k].q;
  // reference clients (diminishing)
  const nref=(b.refs||[]).length;q+=Math.min(0.12,nref*0.045);
  // pre-bid meeting
  if(b.preBid)q+=0.045;
  // a consortium partner lifts credibility with their size and certs
  const p=b.partner&&(typeof rivalById==='function')&&rivalById(b.partner);
  if(p)q+=0.05+p.tier*0.03+(p.iso?0.04:0);
  return q;
}
/* requirements can be met by you OR a consortium partner */
function bidMeetsReqs(x,b){
  const R=(typeof reqList==='function')?reqList(x):[];
  const p=b&&b.partner&&(typeof rivalById==='function')&&rivalById(b.partner);
  return R.every(r=>r.ok||(p&&TREQ[r.k]&&TREQ[r.k].r(p,r.n)));
}

/* ---------- framework agreements ---------- */
function frameworks(){return (S.fw=S.fw||[]);}
function myFrameworks(){return frameworks().filter(f=>f.member&&f.until>S.day);}
function onFramework(sector){return myFrameworks().some(f=>f.sector===sector);}
function genFramework(){
  const sector=pick(Object.keys(SECTORS));
  const seats=ri(80,260);
  const svc=['support','m365'].concat(Math.random()<0.7?['security']:[]).concat(Math.random()<0.5?['backup']:[]);
  const reqs=[['ce',0],['iso',0]].filter(()=>true);
  const rq=[];if(Math.random()<0.8)rq.push(['ce',0]);if(Math.random()<0.5)rq.push(['iso',0]);if(Math.random()<0.6)rq.push(['years',0,2]);if(Math.random()<0.5)rq.push(['pi',0,1000000]);
  return {id:uid(),framework:true,size:1,name:genName(sector)+' Framework',sector,seats,svc,term:pick([36,48]),reqs:rq,region:(typeof tenderRegion==='function')?tenderRegion(1):'home',wPrice:rnd(0.4,0.55),opened:S.day,close:S.day+ri(18,30),decide:0,bid:null,state:'open',years:wpick([[3,3],[4,2]])};
}
/* a mini-competition that only framework members can bid for */
function genCallOff(f){
  const seats=ri(20,90);
  const svc=f.svc.slice();
  return {id:uid(),callOff:f.id,size:0,name:pick(PLACES)+' '+pick(SECTORS[f.sector].suf),sector:f.sector,seats,svc,term:pick([24,36]),reqs:[],region:f.region,wPrice:rnd(0.5,0.65),opened:S.day,close:S.day+ri(8,16),decide:0,bid:null,state:'open'};
}

/* ---------- generation: weave frameworks + mega into the board ---------- */
if(typeof genTender==='function'){
  const _genT=genTender;
  genTender=function(){
    const big=mrr();
    // a rare mega tender once you're a serious size
    if(big>90000&&Math.random()<0.14){const Z=TENDER_SIZES.find(z=>z.k==='x');const sector=pick(Object.keys(SECTORS));
      const seats=ri(Z.seats[0],Z.seats[1]);const reqs=[];for(const [k,p,n] of Z.reqs)if(Math.random()<p)reqs.push([k,n||0]);
      const svc=['support','m365','security'].concat(Math.random()<0.6?['backup']:[]).concat(Math.random()<0.5?['telecoms']:[]);
      return {id:uid(),size:3,name:genName(sector)+' Group',sector,seats,svc,term:pick(Z.term),reqs,region:(typeof tenderRegion==='function')?tenderRegion(2):'home',wPrice:rnd(Z.wPrice[0],Z.wPrice[1]),opened:S.day,close:S.day+ri(20,34),decide:0,bid:null,state:'open',mega:true};}
    return _genT.apply(this,arguments);
  };
}

/* daily: post frameworks and their call-offs alongside the normal board */
if(typeof tendersDaily==='function'){
  const _tD=tendersDaily;
  tendersDaily=function(){
    _tD.apply(this,arguments);
    const T=tenders();frameworks();
    // occasionally a new framework opportunity (only when you're established)
    if(S.day>DPM*8&&staffOn().length>=6&&Math.random()<0.02&&T.open.filter(z=>z.framework&&z.state==='open').length===0&&myFrameworks().length<4){
      const f=genFramework();T.open.push(f);log('A '+f.years+'-year framework is open: '+f.name+'. Win a place and call-offs come to you.','event');}
    // call-offs from frameworks you're on
    for(const f of myFrameworks()){
      if(f.callNext==null)f.callNext=S.day+ri(12,26);
      if(S.day>=f.callNext&&T.open.filter(z=>z.callOff===f.id&&z.state==='open').length<2){
        const c=genCallOff(f);T.open.push(c);f.callNext=S.day+ri(14,30);
        if(Math.random()<0.6)log('Call-off from the '+f.name+': '+c.name+', '+c.seats+' users.','event');}
    }
  };
}

/* ---------- scoring: levers, consortium, frameworks, feedback ---------- */
if(typeof decideTender==='function'){
  decideTender=function(x){const T=tenders();T.open=T.open.filter(z=>z!==x);
    const reqs=x.reqs||[];const rg=x.region||'home';const bidders=[];
    const streak=S.co.tStreak||0; // the more you win on the trot, the harder rivals come at you
    // who among the rivals competes
    let pool;
    if(x.callOff){const f=frameworks().find(z=>z.id===x.callOff);pool=(f&&f.rivals?f.rivals:[]).map(id=>rivalById(id)).filter(Boolean);}
    else pool=rivals().filter(r=>(r.region||'home')===rg||((x.size>=2)&&r.tier>=2));
    for(const r of pool){if(!reqs.every(([k,n])=>TREQ[k].r(r,n)))continue;
      const keen=(x.mega?0.6:x.framework?0.72:x.callOff?0.72:(0.5+0.2*r.aggr))+Math.min(0.3,streak*0.05);
      if(Math.random()<keen)bidders.push({r,name:r.name,price:r.price*rnd(0.9,1.02),q:r.rep/100*0.62+(r.iso?0.1:0)+r.tier*0.07+(r.tier>=2?0.05:0)+rnd(0,0.12)});}
    if(x.bid){const lowball=Math.max(0,0.8-x.bid.ratio);
      const myb={me:true,name:S.co.name,price:Math.max(0.8,x.bid.ratio),q:Math.max(0.05,bidQuality(x)+rnd(0,0.1)-lowball*2.5)};
      bidders.push(myb);
      // a credible competitor turns up so wins are earned, more so on bigger, more contested work and after a winning run
      const pInject=clamp(0.4+0.12*(x.size||0)+(x.mega?0.2:0)+(x.framework?0.12:0)+Math.min(0.4,streak*0.07),0,0.95);
      const best=bidders.reduce((m,b)=>b.me?m:Math.max(m,b.q),0);
      // a solid competitor at a fixed baseline (stiffened by winning runs), so investing in the bid genuinely helps you beat it
      const compQ=clamp(0.52+(x.mega?0.16:x.size>=2?0.08:0)+Math.min(0.22,streak*0.03)+rnd(0,0.16),0.4,1.06);
      if(best<compQ&&Math.random()<pInject)bidders.push({name:pick(['Northbridge IT','Kestrel Managed','Aldgate Technology','Pennine Systems','Marlow & Vale IT','Cindermill Digital','Foxfield Networks']),price:myb.price*rnd(0.92,1.04),q:compQ});}
    if(!bidders.length){x.state='void';x.winner=null;T.done.unshift(x);T.done=T.done.slice(0,8);log('Nobody qualified for the '+x.name+'. It will be re-run.','info');return;}
    const low=Math.min(...bidders.map(b=>b.price)),topQ=Math.max(...bidders.map(b=>b.q));
    for(const b of bidders)b.score=x.wPrice*(low/b.price)+(1-x.wPrice)*(b.q/topQ);
    bidders.sort((a,b)=>b.score-a.score);
    x.field=bidders.length;x.state='done';
    const mine=bidders.find(b=>b.me);
    if(mine){x.myRank=bidders.indexOf(mine)+1;x.myScore=Math.round(mine.score*100);
      x.myPrice=mine.price;x.myQ=mine.q;}

    // frameworks: the top few qualifiers all get a place
    if(x.framework){
      const places=Math.min(bidders.length,3);const winners=bidders.slice(0,places);
      x.winner=winners.map(b=>b.name).join(', ');
      const f={id:x.id,name:x.name,sector:x.sector,svc:x.svc.slice(),region:x.region,years:x.years||3,until:S.day+DPM*12*(x.years||3),member:!!(mine&&winners.includes(mine)),rivals:winners.filter(b=>!b.me&&b.r).map(b=>b.r.id),callNext:S.day+ri(10,20)};
      frameworks().push(f);
      T.done.unshift(x);T.done=T.done.slice(0,8);
      if(f.member){x.won=true;S.co.tStreak=(S.co.tStreak||0)+1;log('You’re on the '+x.name+' for '+f.years+' years. Call-offs will come to you.','good');if(typeof x19==='function')x19('tenderWon');}
      else {if(mine)S.co.tStreak=0;log(x.name+' places went to '+x.winner+'. You didn’t make the cut'+(mine?' ('+ordinal(x.myRank)+' of '+bidders.length+')':'')+'.','bad');}
      applyBidCosts(x,false);
      return;
    }

    const w=bidders[0];x.winner=w.name;
    T.done.unshift(x);T.done=T.done.slice(0,8);
    if(x.bid)S.co.tStreak=w.me?(S.co.tStreak||0)+1:0;
    if(w.me){
      const b=x.bid;const share=b.partner?0.6:1;const seats=Math.max(1,Math.round(x.seats*share));
      const d={id:uid(),kind:'new',name:x.name,sector:x.sector,seats,svc:x.svc.slice(),created:S.day,exp:S.day,stage:'pitched',pm:b.pm,term:x.term,win:1,big:true,note:'',kit:genKit(x.svc)};
      resolveDeal(d);x.won=true;
      // consortium partner takes the rest
      if(b.partner){const p=rivalById(b.partner);if(p){p.clients++;shift(p,6,4);log(x.name+' won with '+p.name+': you take ~'+pct(share)+', they take the rest.','good');}}
      else log('You won the '+x.name+': '+seats+' users on a '+x.term+'-month contract.','good');
      if(x.mega)log('That is a major contract. Watch your onboarding and desk capacity over the next few months.','event');
      applyBidCosts(x,true);
      if(typeof x19==='function')x19('tenderWon');
    }else{
      if(w.r){w.r.clients++;w.r.beatMe=(w.r.beatMe||0)+(x.bid?1:0);}
      if(mine){const gap=w.price<mine.price-0.02?'on price':(w.q>mine.q?'on quality':'on price');x.lossReason=gap;
        log(w.name+' won the '+x.name+' '+gap+'. You came '+ordinal(x.myRank)+' of '+bidders.length+'.','bad');}
      applyBidCosts(x,false);
    }
  };
}
/* value-add costs land when you win; the bid-writer/pre-bid time was already spent */
function applyBidCosts(x,won){const b=x.bid;if(!b)return;
  if(won){let c=0;for(const k of (b.vadd||[]))if(VADD[k])c+=(VADD[k].cost?VADD[k].cost(x):0);
    if(c){S.co.cash-=c;S.m.other=(S.m.other||0)+c;log('Bid commitments on '+x.name+' cost '+gbp(c)+' up front.','info');}
    if((b.vadd||[]).includes('sla'))x.slaGuarantee=true;}
}

/* ---------- the bid modal, rebuilt with the new levers ---------- */
if(typeof ACT_EXT!=='undefined'){
  ACT_EXT.tender=v=>{ui.modal={type:'tender',id:v,pm:1,writer:false,vadd:[],refs:[],partner:null,preBid:false};};
  ACT_EXT.tPm=v=>{if(ui.modal)ui.modal.pm=+v;};
  ACT_EXT.tWriter=()=>{if(ui.modal)ui.modal.writer=!ui.modal.writer;};
  ACT_EXT.tVadd=v=>{const M=ui.modal;if(!M)return;M.vadd=M.vadd||[];const i=M.vadd.indexOf(v);if(i<0)M.vadd.push(v);else M.vadd.splice(i,1);};
  ACT_EXT.tRef=v=>{const M=ui.modal;if(!M)return;M.refs=M.refs||[];const i=M.refs.indexOf(v);if(i<0){if(M.refs.length<3)M.refs.push(v);}else M.refs.splice(i,1);};
  ACT_EXT.tPartner=v=>{const M=ui.modal;if(!M)return;M.partner=M.partner===v?null:v;};
  ACT_EXT.tPreBid=()=>{const M=ui.modal;if(!M)return;const x=(tenders().open||[]).find(z=>z.id===M.id);if(!x||M.preBid)return;
    const am=ams().find(s=>present(s));const hrs=4;if(am)am.busyH=(am.busyH||0)+hrs;else S.co.busy=(S.co.busy||0)+hrs;
    M.preBid=true;M.hint=x.wPrice>=0.55?'price':x.wPrice<=0.42?'quality':'a balance of price and quality';
    log('You met the buyer behind '+x.name+' before bidding.','info');};
  ACT_EXT.tBid=()=>{const M=ui.modal;const x=(tenders().open||[]).find(z=>z.id===M.id);if(!x||x.state!=='open'||x.bid)return;
    if(!bidMeetsReqs(x,M))return;
    const size=x.size||0;const am=ams().find(s=>present(s));const hrs=8+size*8;if(am)am.busyH=(am.busyH||0)+hrs;else S.co.busy=(S.co.busy||0)+hrs;
    if(M.writer)spend(1500+size*1500);
    x.bid={pm:M.pm,ratio:myPriceRatio()*M.pm,writer:M.writer,vadd:(M.vadd||[]).slice(),refs:(M.refs||[]).slice(),partner:M.partner||null,preBid:!!M.preBid,d:S.day};
    if(typeof x19==='function')x19('tenderBid');
    log('Bid submitted for the '+x.name+'.','info');ui.modal=null;};
}

if(typeof MODAL_EXT!=='undefined'){
  MODAL_EXT.tender=(M,x0)=>{const x=(tenders().open||[]).find(z=>z.id===M.id)||(tenders().done||[]).find(z=>z.id===M.id);if(!x)return null;
    const R=(typeof reqList==='function')?reqList(x):[];const okAll=bidMeetsReqs(x,M);const Z=TENDER_SIZES[x.size]||{t:'Tender'};
    const val=tenderVal(x);const rname=(typeof reg==='function'&&x.region)?reg(x.region).t:null;
    let h='<div class="dialog wide">'+x0+'<p class="kick">'+(x.mega?'Major ':x.framework?'Framework · ':x.callOff?'Call-off · ':'')+Z.t+' · '+x.sector+(rname?' · '+rname:'')+'</p><h2>'+esc(x.name)+'</h2>';
    h+='<p>'+x.seats+' users wanting '+x.svc.map(k=>k==='m365'?'Microsoft 365':SVC[k].short.toLowerCase()).join(', ')+' on a '+x.term+'-month contract. Worth about '+gbp(Math.round(val))+' a month at market prices.'+(x.framework?' Winning a place puts you in the running for its call-offs for '+(x.years||3)+' years.':'')+' Scored '+pct(x.wPrice)+' on price, '+pct(1-x.wPrice)+' on quality.</p>';
    // requirements
    h+='<h3 style="font-size:.95rem;margin:10px 0 4px">Requirements</h3>'+(R.length?'<ul class="list">'+R.map(r=>{const partnerCovers=!r.ok&&M.partner&&rivalById(M.partner)&&TREQ[r.k]&&TREQ[r.k].r(rivalById(M.partner),r.n);return '<li class="item"><span>'+(r.ok?'<b class="pos">✓</b> ':partnerCovers?'<b class="pos">✓</b> ':'<b class="neg">✗</b> ')+esc(r.t)+(partnerCovers?' <span class="mut">(via partner)</span>':'')+'</span></li>';}).join('')+'</ul>':'<p class="mut">No formal requirements.</p>');
    h+='<p class="mut" style="font-size:.84rem;margin-top:6px">'+(x.state==='open'?'Bids close '+dLabel(x.close)+'.':'Bids have closed.')+'</p>';
    if(x.bid)return h+'<p class="note">Your bid is in'+(x.bid.pm!==1?' at '+(x.bid.pm<1?pct(1-x.bid.pm)+' under':pct(x.bid.pm-1)+' over')+' catalogue':' at catalogue price')+(x.bid.partner&&rivalById(x.bid.partner)?', with '+esc(rivalById(x.bid.partner).name):'')+((x.bid.vadd||[]).length?', plus '+x.bid.vadd.map(k=>VADD[k].t.toLowerCase()).join(', '):'')+'.</p></div>';
    if(x.state!=='open')return h+'<p class="note warn">Bids have closed on this one and you didn’t get an offer in.</p></div>';
    if(!okAll)return h+'<p class="note warn">You don’t meet every requirement yet.'+(consortiumCands(x).length?' A consortium partner below may cover some.':'')+'</p>'+consortiumBlock(x,M)+'</div>';
    // price
    const pm=M.pm||1;
    h+='<h3 style="font-size:.95rem;margin:12px 0 4px">Your price</h3><div class="seg">'+[0.85,0.9,0.95,1,1.05].map(pp=>'<button data-act="tPm" data-v="'+pp+'" aria-pressed="'+(pm===pp)+'">'+(pp===1?'Catalogue':pp<1?pct(1-pp)+' under':pct(pp-1)+' over')+'</button>').join('')+'</div>';
    // value adds
    h+='<h3 style="font-size:.95rem;margin:14px 0 4px">Strengthen the bid</h3><div class="choices">'+VADD_ORDER.map(k=>{const v=VADD[k];const on=(M.vadd||[]).includes(k);const c=v.cost?v.cost(x):0;const dis=v.needAm&&!ams().some(s=>present(s));return '<button class="choice" data-act="tVadd" data-v="'+k+'" aria-pressed="'+on+'" '+(dis?'disabled':'')+'><b>'+v.t+' · +'+Math.round(v.q*100)+' quality'+(c?' · '+gbp(c)+' if won':v.risk?' · penalties if missed':dis?' · needs an account manager':'')+'</b><span>'+v.d+'</span></button>';}).join('')+'</div>';
    // reference clients
    const refs=refCands(x);
    if(refs.length){h+='<h3 style="font-size:.95rem;margin:14px 0 4px">Reference clients <span class="mut" style="font-size:.78rem">up to 3, +quality each</span></h3><div class="chips">'+refs.map(c=>'<button class="chip'+((M.refs||[]).includes(c.id)?' p':'')+'" data-act="tRef" data-v="'+c.id+'">'+esc(c.name)+' · '+Math.round(c.sat)+'</button>').join('')+'</div>';}
    else h+='<p class="mut" style="font-size:.82rem;margin-top:10px">No happy '+x.sector.toLowerCase()+' clients to reference yet (need satisfaction 72+).</p>';
    // consortium
    h+=consortiumBlock(x,M);
    // pre-bid
    h+='<h3 style="font-size:.95rem;margin:14px 0 4px">Pre-bid meeting</h3>'+(M.preBid?'<p class="note">You met the buyer. They seem to weight '+(M.hint||'price and quality')+' most. +quality on your bid.</p>':'<div class="row"><button class="btn sm" data-act="tPreBid">Meet the buyer · half a day</button><span class="mut" style="font-size:.8rem">A quality bump, and a read on what they want.</span></div>');
    // writer + submit
    const wr=1500+(x.size||0)*1500;
    h+='<div class="seg" style="margin-top:12px"><button data-act="tWriter" aria-pressed="'+!!M.writer+'">Use a bid writer<small>'+gbp(wr)+', +quality</small></button></div>';
    const projQ=Math.round(bidQuality(x,M)*100);
    h+='<div class="foot2"><span class="grow mut" style="font-size:.8rem">Projected quality score ~'+projQ+'. Writing takes ~'+(8+(x.size||0)*8)+'h of '+(ams().some(s=>present(s))?'an account manager’s':'your')+' time.</span><button class="btn primary" data-act="tBid">Submit bid</button></div></div>';
    return h;};
}
function consortiumBlock(x,M){const cc=consortiumCands(x);if(!cc.length)return '';
  return '<h3 style="font-size:.95rem;margin:14px 0 4px">Consortium bid <span class="mut" style="font-size:.78rem">an ally covers gaps; you split the contract ~60/40</span></h3><div class="chips">'+cc.map(r=>'<button class="chip'+(M.partner===r.id?' p':'')+'" data-act="tPartner" data-v="'+r.id+'">'+esc(r.name)+' · '+MKT_TIERS[r.tier].t.toLowerCase()+'</button>').join('')+'</div>';}

/* ---------- the Tenders tab ---------- */
function paneTenders(){
  const T=tenders();const open=(T.open||[]).slice();frameworks();
  const board=open.filter(z=>!z.framework&&!z.callOff).sort((a,b)=>(b.opened||0)-(a.opened||0));
  const fwOpen=open.filter(z=>z.framework);
  const calls=open.filter(z=>z.callOff);
  const done=(T.done||[]);
  const bids=done.filter(z=>z.myRank);const wins=bids.filter(z=>z.won).length;
  const lifeWon=(S.x19&&S.x19.tenderWon)||wins,lifeBid=(S.x19&&S.x19.tenderBid)||bids.length;
  let h='<div class="sec"><h3>Tenders</h3><p class="lede">Formal contracts put out to bid. Strengthen a bid with value-adds, reference clients, a consortium partner or a pre-bid meeting. Win a framework place and call-offs come to you.</p>';
  h+='<div class="tiles"><div class="tile"><span class="k">Open now</span><span class="v">'+(board.length+fwOpen.length+calls.length)+'</span><small>'+board.length+' open · '+calls.length+' call-off'+(calls.length===1?'':'s')+'</small></div>'+
    '<div class="tile"><span class="k">Frameworks</span><span class="v '+(myFrameworks().length?'pos':'')+'">'+myFrameworks().length+'</span><small>places held</small></div>'+
    '<div class="tile"><span class="k">Bids won</span><span class="v">'+lifeWon+' / '+lifeBid+'</span><small>lifetime</small></div>'+
    '<div class="tile"><span class="k">CE Plus</span><span class="v '+(S.co.ce?'pos':'neg')+'">'+(S.co.ce?'Yes':'No')+'</span><small>'+(S.co.iso?'ISO 27001 too':'most tenders ask for it')+'</small></div></div></div>';

  const card=(x,tag)=>{const R=(typeof reqList==='function')?reqList(x):[];const miss=R.filter(r=>!r.ok).length;const rname=(typeof reg==='function'&&x.region)?reg(x.region).t:'';
    return '<li class="item click" data-act="tender" data-v="'+x.id+'"><span><b>'+esc(x.name)+'</b> <span class="mut">'+(tag?tag+' · ':'')+x.seats+' users · '+x.term+'m'+(rname?' · '+rname:'')+'</span></span><span class="r">~'+gbp(Math.round(tenderVal(x)))+'/mo</span><span class="sub">'+(x.bid?'<b class="pos">Bid in.</b> ':'')+(x.state==='open'?'Closes '+dLabel(x.close):'Decision '+dLabel(x.decide))+' · '+(R.length?(miss?'<span class="neg">'+miss+' of '+R.length+' requirements to meet</span>':'<span class="pos">you meet all requirements</span>'):'no set requirements')+'</span></li>';};

  if(fwOpen.length)h+='<div class="sec"><h3 style="font-size:.98rem">Framework opportunities</h3><ul class="list">'+fwOpen.map(x=>card(x,x.years+'yr framework')).join('')+'</ul></div>';
  if(calls.length)h+='<div class="sec"><h3 style="font-size:.98rem">Call-offs <span class="mut" style="font-size:.78rem">members only, better odds</span></h3><ul class="list">'+calls.map(x=>card(x,'call-off')).join('')+'</ul></div>';
  h+='<div class="sec"><h3 style="font-size:.98rem">Open tenders</h3>'+(board.length?'<ul class="list">'+board.map(x=>card(x,x.mega?'MAJOR':TENDER_SIZES[x.size].t)).join('')+'</ul>':'<p class="empty">No open tenders right now. New ones appear every few weeks.</p>')+'</div>';

  if(myFrameworks().length)h+='<div class="sec"><h3 style="font-size:.98rem">Your frameworks</h3><ul class="list">'+myFrameworks().map(f=>'<li class="item"><span><b>'+esc(f.name)+'</b> <span class="mut">'+f.sector+'</span></span><span class="r mut">to '+dLabel(f.until)+'</span><span class="sub">Call-offs come to you here. '+(typeof reg==='function'&&f.region?reg(f.region).t:'')+'</span></li>').join('')+'</ul></div>';

  if(done.length)h+='<div class="sec"><h3 style="font-size:.98rem">Recent results</h3><ul class="list">'+done.slice(0,8).map(x=>{
    const you=x.myRank?(x.won?'<span class="pos">Won</span>':'<span class="neg">'+ordinal(x.myRank)+' of '+x.field+'</span>'+(x.lossReason?' · lost '+x.lossReason:'')):'<span class="mut">didn’t bid</span>';
    return '<li class="item"><span><b>'+esc(x.name)+'</b> <span class="mut">'+(x.framework?'framework':x.mega?'major':x.callOff?'call-off':(TENDER_SIZES[x.size]||{t:''}).t.toLowerCase())+'</span></span><span class="r">'+you+'</span><span class="sub">'+(x.won?'You won it.':'Won by '+esc(x.winner||'nobody')+'.')+(x.myScore?' Your score '+x.myScore+'.':'')+'</span></li>';}).join('')+'</ul></div>';
  return h;
}
