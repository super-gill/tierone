
/* ============ build 16: fixes from the second alpha round ============ */
/* discounts come off your own services; resold lines never go below cost plus 5% */
function pmFor(k,pm){if(!SVC[k].cost||pm>=1)return pm;return Math.max(pm,Math.min(1,svcCost(k)*1.05/S.price[k]));}
/* price rises: once a year per client, capped at 30% over list */
const upliftOk=c=>S.day-(c.upAt||-999)>=DPM*12&&Object.values(c.svc).some(x=>x.pm<1.3);
/* catalogue prices apply to new business; existing clients keep what they pay */
ACT_EXT.catPrice=v=>{const [k,d]=v.split(':');const p0=S.price[k];const ref=refPrice(k);const step=Math.round(0.05*ref*100)/100;const p1=clamp(Math.round((p0+step*(+d))*100)/100,Math.max(SVC[k].cost?svcCost(k)*1.02:1,ref*0.7),ref*1.5);if(Math.abs(p1-p0)<0.005)return;
  S.price[k]=p1;for(const c of S.clients)if(c.svc[k])c.svc[k].pm*=p0/p1;log(SVC[k].name+' list price is now £'+p1.toFixed(2)+' a '+SVC[k].unit+' for new deals.','info');};
/* the yearly price review across the whole book */
function annualSec(){
  if(!active().length)return '';const ok=S.day-(S.co.reviewAt||-999)>=DPM*12&&S.day>=DPM*6;
  return '<div class="sec"><div class="row" style="justify-content:space-between"><span class="lede" style="margin:0">Annual price review: 3% across every client, the way contracts usually allow. Clients barely notice; skipping it lets costs eat your margin.</span><button class="btn sm" data-act="annualReview" '+(ok?'':'disabled')+'>'+(ok?'Apply 3% uplift':S.day<DPM*6?'From your first July':'Next '+dLabel((S.co.reviewAt||0)+DPM*12))+'</button></div></div>';
}
ACT_EXT.annualReview=()=>{if(S.day-(S.co.reviewAt||-999)<DPM*12)return;S.co.reviewAt=S.day;let n=0;for(const c of active()){let any=false;for(const k in c.svc)if(c.svc[k].pm<1.3){c.svc[k].pm=Math.min(1.3,c.svc[k].pm*1.03);any=true;}if(any){n++;c.sat=Math.max(0,c.sat-1.5);}}log('Annual price review: 3% uplift for '+n+' clients.','event');};
/* office moves need a confirm */
MODAL_EXT.moveAsk=(M,x)=>{const T=TIERS[M.t];const fits=staffOn().length<=T.cap;
  return '<div class="dialog">'+x+'<p class="kick">Office</p><h2>Move to '+T.name.toLowerCase()+'?</h2><p>'+T.addr+'. '+T.cap+' desks'+(T.slots?', '+T.slots+' rooms':'')+'. Rent '+(T.rent?gbp(T.rent)+' a month':'free')+(T.move?', fit-out and move '+gbp(T.move)+' now':'')+'. Rooms you’ve fitted out come with you if there’s space.</p>'+(fits?'':'<p class="note warn">The team won’t fit.</p>')+'<div class="foot2"><span class="grow"></span><button class="btn" data-act="close">Stay put</button><button class="btn primary" data-act="moveGo" data-v="'+M.t+'" '+(fits?'':'disabled')+'>Move</button></div></div>';};
/* selling up: valuation on trailing profit; you can appoint a broker */
function trailingEbitda(){const h=S.hist.slice(-6);const avg=h.length?h.reduce((a,x)=>a+x.profit,0)/h.length:0;return Math.max(0,companyPL().op*12,avg*12*0.85);}
function saleSec(){
  if(mrr()<40000||S.over)return '';
  return '<div class="sec"><h3>Selling the company</h3><p class="lede">Buyers value an MSP on recurring revenue and a year of profit, then adjust for margin, reputation and service. At today’s numbers that’s roughly '+gbp(valuation())+': '+valWhy()+'. A broker finds you a buyer within a month or two, for a £15,000 retainer.</p>'+(S.co.forSale?'<button class="btn sm" data-act="forSaleOff">Broker is looking for buyers · end the mandate</button>':'<button class="btn sm" data-act="forSale">Appoint a broker · £15,000</button>')+'</div>';
}
ACT_EXT.forSale=()=>{if(S.co.forSale)return;spend(15000);S.co.forSale=true;S.co.saleDay=S.day+ri(12,30);log('You appointed a broker to find a buyer.','event');};
/* HDM also buys skills training when the stack is covered */
function hdmTrain(){if(typeof mgrTrainRun==='function')return;const h=mgrOn('hdm');if(!h||S.day%DPM!==8)return;const L=h.lim||{};const cost=S.office.rooms.training?600:1200;if((h.spent||0)+cost>(L.train||0))return;
  const t=S.staff.filter(s=>present(s)&&(s.role==='desk'||s.role==='eng')&&s.skill<4&&(s.trained||-999)+40<=S.day).sort((a,b)=>a.skill-b.skill)[0];if(!t)return;
  spend(cost);h.spent=(h.spent||0)+cost;t.away=S.day+3;t.trained=S.day;t.skill++;log(h.name+' sent '+t.name+' on a skills course.','info');}
/* daily housekeeping */
const _peopleDaily16=peopleDaily;
peopleDaily=function(W){_peopleDaily16(W);
  for(const o of S.onb){if(o.stage!=='plan')continue;if(o.planAt==null)o.planAt=S.day;
    if(S.day-o.planAt>=10&&o.plan){confirmPlan(o);const c=C(o.cid);log('Nobody decided on '+(c?c.name:'a client')+'’s onboarding plan, so the team went with the recommended options.','info');}}
  if(S.co.forSale&&S.day>=(S.co.saleDay||0)&&!S.pending&&!S.over&&mrr()>0){S.pending={id:'exitOffer',ctx:EVENTS.exitOffer.ctx()};}
  hdmTrain();
};
