
/* ============ build 22: the tender market ============ */
const TREQ={
  ce:{t:'Cyber Essentials Plus',me:()=>!!S.co.ce,r:r=>r.tier>=1||r.iso},
  iso:{t:'ISO 27001',me:()=>!!S.co.iso,r:r=>r.iso},
  techs:{t:n=>'At least '+n+' technical staff',me:n=>staffOn().filter(s=>techRole(s)).length>=n,r:(r,n)=>r.staff*0.7>=n},
  turnover:{t:n=>'Annual turnover of '+gbp(n)+' or more',me:n=>groupMRR()*12>=n,r:(r,n)=>rSeats(r)*45*12>=n},
  years:{t:n=>n+' years trading',me:n=>S.day>=n*YEAR,r:(r,n)=>S.day-(r.born||-9999)>=n*YEAR||r.born<=0},
  sector:{t:(n,x)=>'At least '+n+' existing '+x.sector.toLowerCase()+' clients',me:(n,x)=>active().filter(c=>c.sector===x.sector).length>=n,r:(r,n)=>r.tier>=1&&Math.random()<0.7},
  noc:{t:'24/7 monitoring (a NOC)',me:()=>!!S.office.rooms.noc,r:r=>r.tier>=2},
  soc:{t:'Your own security operations centre',me:()=>typeof betLive==='function'&&betLive('soc'),r:r=>r.tier>=3},
  pi:{t:n=>'Professional indemnity cover of '+gbp(n),me:()=>!!S.co.pi,r:r=>r.tier>=1}
};
const TENDER_SIZES=[
  {k:'s',t:'Small',seats:[20,60],term:[36],reqs:[['ce',0.6],['years',0.4,1],['sector',0.4,1]],wPrice:[0.55,0.7]},
  {k:'m',t:'Medium',seats:[60,200],term:[36,48],reqs:[['ce',0.9],['iso',0.35],['iso9001',0.3],['techs',0.7,5],['turnover',0.6,300000],['sector',0.5,2],['pi',0.4,1000000],['years',0.5,2]],wPrice:[0.45,0.6]},
  {k:'l',t:'Large',seats:[200,700],term:[48,60],reqs:[['ce',1],['iso',1],['iso9001',0.55],['iso20000',0.4],['iso22301',0.3],['techs',1,15],['turnover',1,1500000],['noc',0.5],['soc',0.25],['pi',0.8,5000000],['sector',0.5,4],['years',0.7,3]],wPrice:[0.35,0.5]}
];
function tenders(){return (S.tend=S.tend||{open:[],done:[],next:0});}
function reqList(x){return x.reqs.map(([k,n])=>{const R=TREQ[k];const t=typeof R.t==='function'?R.t(n,x):R.t;return {k,n,t,ok:R.me(n,x)};});}
function genTender(){const big=mrr();const pool=[[0,4],[1,big>20000?3:1.5],[2,big>100000?2:0.6]];const zi=wpick(pool.map(([i,w])=>[i,w]));const Z=TENDER_SIZES[zi];
  const sector=pick(Object.keys(SECTORS));const seats=ri(Z.seats[0],Z.seats[1]);
  const reqs=[];for(const [k,p,n] of Z.reqs)if(Math.random()<p)reqs.push([k,n||0]);
  const svc=['support','m365'].concat(Math.random()<0.6?['security']:[]).concat(Math.random()<0.5?['backup']:[]);
  const name=genName(sector)+(zi===2?' Group':'');
  return {id:uid(),size:zi,name,sector,seats,svc,term:pick(Z.term),reqs,region:tenderRegion(zi),wPrice:rnd(Z.wPrice[0],Z.wPrice[1]),opened:S.day,close:S.day+ri(15,30),decide:0,bid:null,state:'open'};}
function tenderValue(x){return x.svc.reduce((a,k)=>a+refPrice(k)*(SVC[k].unit==='site'?Math.max(1,Math.ceil(x.seats/30)):x.seats),0);}
function tendersDaily(){const T=tenders();
  if(S.day>=T.next&&T.open.filter(x=>x.state==='open').length<4&&S.day>DPM*2){T.open.push(genTender());T.next=S.day+ri(10,22);if(T.open.length===1||Math.random()<0.4)log('A new tender is out: '+T.open[T.open.length-1].name+'. It’s on the Sales tab.','event');}
  for(const x of T.open.slice()){
    if(x.state==='open'&&S.day>=x.close){x.state='eval';x.decide=S.day+ri(8,15);}
    if(x.state==='eval'&&S.day>=x.decide)decideTender(x);
  }
}
/* scoring: price against quality, weighted by what the buyer cares about */
function decideTender(x){const T=tenders();T.open=T.open.filter(z=>z!==x);
  const reqs=x.reqs;const bidders=[];const rg=x.region||'home';const pool=rivals().filter(r=>(r.region||'home')===rg||(x.size===2&&r.tier>=2));
  for(const r of pool){if(!reqs.every(([k,n])=>TREQ[k].r(r,n)))continue;if(Math.random()<(0.35+0.15*r.aggr))bidders.push({r,name:r.name,price:r.price*rnd(0.92,1.02),q:r.rep/100*0.6+(r.iso?0.1:0)+r.tier*0.05+rnd(0,0.1)});}
  if(x.bid){const lowball=Math.max(0,0.8-x.bid.ratio);bidders.push({me:true,name:S.co.name,price:Math.max(0.8,x.bid.ratio),q:Math.max(0.05,S.co.rep/100*0.6+(S.co.iso?0.1:0)+sizeTier()*0.05+Math.min(0.15,active().filter(c=>c.sector===x.sector).length*0.03)+(slaPct()>0.95?0.05:0)+(x.bid.writer?0.06:0)+rnd(0,0.1)-lowball*2.5)});}
  if(!bidders.length){x.state='void';x.winner=null;T.done.unshift(x);T.done=T.done.slice(0,6);log('Nobody qualified for the '+x.name+' tender. It will be re-run.','info');return;}
  const low=Math.min(...bidders.map(b=>b.price)),topQ=Math.max(...bidders.map(b=>b.q));
  for(const b of bidders)b.score=x.wPrice*(low/b.price)+(1-x.wPrice)*(b.q/topQ);
  bidders.sort((a,b)=>b.score-a.score);const w=bidders[0];x.winner=w.name;x.field=bidders.length;x.state='done';
  if(x.bid){const mine=bidders.find(b=>b.me);x.myRank=bidders.indexOf(mine)+1;}
  T.done.unshift(x);T.done=T.done.slice(0,6);
  if(w.me){const d={id:uid(),kind:'new',name:x.name,sector:x.sector,seats:x.seats,svc:x.svc.slice(),created:S.day,exp:S.day,stage:'pitched',pm:x.bid.pm,term:x.term,win:1,big:true,note:'',kit:genKit(x.svc)};
    resolveDeal(d);x.won=true;log('You won the '+x.name+' tender: '+x.seats+' users on a '+x.term+'-month contract.','good');x19('tenderWon');}
  else{if(w.r){w.r.clients++;w.r.beatMe=(w.r.beatMe||0)+(x.bid?1:0);}
    if(x.bid){const mine=bidders.find(b=>b.me);const why=w.price<mine.price-0.02?'on price':'on quality';log(w.name+' won the '+x.name+' tender '+why+'. You came '+ordinal(x.myRank)+' of '+bidders.length+'.','bad');}}
}
function ordinal(n){return n+(n%10===1&&n!==11?'st':n%10===2&&n!==12?'nd':n%10===3&&n!==13?'rd':'th');}
ACT_EXT.tender=v=>{ui.modal={type:'tender',id:v,pm:1,writer:false};};
ACT_EXT.tPm=v=>{if(ui.modal)ui.modal.pm=+v;};
ACT_EXT.tWriter=()=>{if(ui.modal)ui.modal.writer=!ui.modal.writer;};
ACT_EXT.tBid=()=>{const M=ui.modal;const x=tenders().open.find(z=>z.id===M.id);if(!x||x.state!=='open'||x.bid)return;const R=reqList(x);if(R.some(r=>!r.ok))return;
  const am=ams().find(s=>present(s));const hrs=8+x.size*8;if(am)am.busyH=(am.busyH||0)+hrs;else S.co.busy=(S.co.busy||0)+hrs;if(M.writer)spend(1500+x.size*1500);
  x.bid={pm:M.pm,ratio:myPriceRatio()*M.pm,writer:M.writer,d:S.day};log('Bid submitted for the '+x.name+' tender.','info');ui.modal=null;};
MODAL_EXT.tender=(M,x0)=>{const x=tenders().open.find(z=>z.id===M.id);if(!x)return null;const R=reqList(x);const okAll=R.every(r=>r.ok);const Z=TENDER_SIZES[x.size];
  const val=tenderValue(x);const elig=rivals().filter(r=>x.reqs.every(([k,n])=>k==='sector'?r.tier>=1:TREQ[k].r(r,n))).length;
  const pm=M.pm||1;const hrs=8+x.size*8;const wr=1500+x.size*1500;
  let h='<div class="dialog wide">'+x0+'<p class="kick">'+Z.t+' tender · '+x.sector+'</p><h2>'+esc(x.name)+'</h2><p>'+x.seats+' users wanting '+x.svc.map(k=>k==='m365'?'Microsoft 365':SVC[k].short.toLowerCase()).join(', ')+' on a '+x.term+'-month contract. Worth about '+gbp(Math.round(val))+' a month at market prices. Scored '+pct(x.wPrice)+' on price and '+pct(1-x.wPrice)+' on quality (reputation, certificates, size, sector experience and your service record).</p>';
  h+='<h3 style="font-size:.95rem;margin:10px 0 4px">Requirements</h3>'+(R.length?'<ul class="list">'+R.map(r=>'<li class="item"><span>'+(r.ok?'<b class="pos">✓</b> ':'<b class="neg">✗</b> ')+esc(r.t)+'</span></li>').join('')+'</ul>':'<p class="mut">No formal requirements. Anyone can bid.</p>');
  h+='<p class="mut" style="font-size:.84rem;margin-top:6px">About '+elig+' firm'+(elig===1?'':'s')+' in your market could meet these. '+(x.state==='open'?'Bids close '+dLabel(x.close)+'.':'Bids have closed; a decision is due '+dLabel(x.decide)+'.')+'</p>';
  if(x.bid)return h+'<p class="note">Your bid is in at '+(x.bid.pm===1?'your catalogue price':x.bid.pm<1?pct(1-x.bid.pm)+' under your catalogue':pct(x.bid.pm-1)+' over your catalogue')+(x.bid.writer?', written with a bid writer':'')+'.</p></div>';
  if(x.state!=='open')return h+'<p class="note warn">Bids have closed on this one and you didn’t get an offer in. Watch the board and get your bid in before the closing date next time.</p></div>';
  if(!okAll)return h+'<p class="note warn">You can’t bid until you meet every requirement.</p></div>';
  h+='<h3 style="font-size:.95rem;margin:12px 0 4px">Your price</h3><div class="seg">'+[0.9,0.95,1,1.05].map(p=>'<button data-act="tPm" data-v="'+p+'" aria-pressed="'+(pm===p)+'">'+(p===1?'Catalogue':p<1?pct(1-p)+' under':pct(p-1)+' over')+'<small>'+priceWord(myPriceRatio()*p)+'</small></button>').join('')+'</div>';
  h+='<div class="seg" style="margin-top:8px"><button data-act="tWriter" aria-pressed="'+!!M.writer+'">Use a bid writer<small>'+gbp(wr)+', a stronger quality score</small></button></div>';
  h+='<div class="foot2"><span class="grow mut" style="font-size:.8rem">Writing the bid takes about '+hrs+' hours of '+(ams().some(s=>present(s))?'an account manager’s':'your')+' time.</span><button class="btn primary" data-act="tBid">Submit bid</button></div></div>';
  return h;};
function tenderSec(){const T=tenders();const open=T.open;
  let h='<div class="sec"><h3>Tenders</h3><p class="lede">Formal contracts put out to bid. Bigger ones ask for certificates, staff, turnover and sector experience, and firms from your market compete for them.</p>';
  if(!open.length&&!T.done.length)return h+'<p class="empty">No tenders out right now. They appear every few weeks.</p></div>';
  if(open.length)h+='<ul class="list">'+open.map(x=>{const R=reqList(x);const miss=R.filter(r=>!r.ok).length;return '<li class="item click" data-act="tender" data-v="'+x.id+'"><span><b>'+esc(x.name)+'</b> <span class="mut">'+TENDER_SIZES[x.size].t.toLowerCase()+' · '+x.seats+' users · '+x.term+' months</span></span><span class="r">~'+gbp(Math.round(tenderValue(x)))+'/mo</span><span class="sub">'+(x.bid?'<b>Bid in.</b> ':'')+(x.state==='open'?'Closes '+dLabel(x.close):'Decision '+dLabel(x.decide))+' · '+(R.length?(miss?'<span class="neg">'+miss+' of '+R.length+' requirements not met</span>':'<span class="pos">you meet all '+R.length+' requirements</span>'):'no requirements')+'</span></li>';}).join('')+'</ul>';
  if(T.done.length)h+='<p class="mut" style="font-size:.84rem;margin-top:8px">Recent results: '+T.done.slice(0,4).map(x=>esc(x.name)+' → '+(x.winner?esc(x.winner)+(x.won?' (you)':''):'nobody qualified')).join('; ')+'.</p>';
  return h+'</div>';}
/* the old tender invitation event is replaced by the tender board */
EVENTS.rfp.w=0;
/* Cyber Essentials Plus on demand, since tenders ask for it */
ACT_EXT.getCE=()=>{if(S.co.ce)return;spend(2400);S.co.ce=true;S.co.rep=Math.min(100,S.co.rep+3);log(S.co.name+' is now Cyber Essentials Plus certified.','good');};
const _paneRisk22=paneRisk;
paneRisk=function(){let h=_paneRisk22();const ce='<li class="item"><span><b>Cyber Essentials Plus</b></span><span class="r">'+(S.co.ce?'certified':gbp(2400))+'</span><span class="sub">The UK baseline security certificate. Most tenders ask for it.'+(S.co.ce?'':'<span class="row" style="margin-top:6px"><button class="btn sm" data-act="getCE">Get certified</button></span>')+'</span></li>';
  return h.replace('<div class="sec"><h3>Certifications and cover</h3><ul class="list">','<div class="sec"><h3>Certifications and cover</h3><ul class="list">'+ce);};
const _peopleDaily22=peopleDaily;peopleDaily=function(W){_peopleDaily22(W);tendersDaily();};
/* tenders come from regions you operate in, sometimes a neighbour you could expand into */
function tenderRegion(zi){const pres=typeof regionsPresent==='function'?regionsPresent():['home'];
  if(zi===2)return Math.random()<0.5?'se':pick(pres);
  return Math.random()<0.75?pick(pres):pick(REG_ORDER);}
