
/* ============ build 18: fixes from the third alpha round ============ */
/* price matters: clients compare your prices with the market */
function refPrice(k){return SVC[k].price*(k==='m365'?S.vend.dist.pm:1);}
function priceRatio(c){let r=0,b=0;for(const k in c.svc){const u=units(c,k);r+=svcPrice(c,k)*u;b+=refPrice(k)*u;}return b?r/b:1;}
function catRatio(d){if(d.kind==='project')return 1;const seats=dealSeats(d);let r=0,b=0;for(const k of d.svc){const u=SVC[k].unit==='site'?Math.max(1,Math.ceil(seats/30)):seats;r+=S.price[k]*u;b+=refPrice(k)*u;}return b?r/b:1;}
const _winChance18=winChance;
winChance=function(d,pm){let p=_winChance18(d,pm);const cr=catRatio(d);if(cr>1)p-=(cr-1)*1.1;else p+=(1-cr)*0.5;return clamp(p,0.03,0.85);};
const tAgeNow=t=>S.day*HD-bornAt(t);
/* contracts bind: a client leaving mid-term pays part of what's left */
function payOut(c){if(!(c.term>1)||c.termEnd<=S.day+DPM)return;const months=Math.min(12,Math.ceil((c.termEnd-S.day)/DPM));const fee=Math.round(clientMRR(c)*months*0.5/10)*10;S.co.cash+=fee;S.m.setup+=fee;log(c.name+' is paying '+gbp(fee)+' to leave their contract early.','good');}
/* one valuation for the broker estimate and for buyers' offers */
function valProfit(){const h=S.hist.slice(-12);if(!h.length)return 0;const f=founderSt();return Math.max(0,h.reduce((a,x)=>a+x.profit,0)*12/h.length+Math.max(0,((f&&f.salary)||0)-3000)*12);}
function valParts(){
  const arr=groupMRR()*12,recent=(S.co.acqLog||[]).filter(a=>S.day-a.d<DPM*6).reduce((a,x)=>a+x.mrr*12,0),arrQ=Math.max(0,arr-recent*0.5);
  const P=companyPL(),cs=contractedShare();const mult=4.5+2*cs+(P.gpct>0.45?1:P.gpct<0.3?-1:0);
  return {arr,arrQ,prof:valProfit(),mult,cs,gp:P.gpct,rep:0.85+S.co.rep/400,sla:clamp(slaPct()+0.1,0.85,1.05)};
}
function valuation(){const v=valParts();let x=Math.max(v.arrQ*0.6,v.prof*v.mult)*v.rep*v.sla;x=Math.min(x,v.arrQ*2.5);return Math.max(0,Math.round(x/10000)*10000);}
function valWhy(){const v=valParts();return 'a year’s profit of '+gbp(Math.round(v.prof/1000)*1000)+' at '+v.mult.toFixed(1)+'× (more for contracted revenue, now '+pct(v.cs)+', and gross margin, now '+pct(v.gp)+'), adjusted for reputation and service'+(v.arrQ<v.arr?', with recently bought revenue only half counted until it’s been kept six months':'');}
ACT_EXT.forSaleOff=()=>{S.co.forSale=false;log('You ended the broker’s mandate.','info');};
/* marketing: a steady, paid-for trickle of leads */
const MKT=[0,500,1500,3000];
function marketingSec(){const L=S.co.mkt||0;return '<div class="sec"><h3>Marketing</h3><p class="lede">Local networking, a decent website, events and the odd campaign. It brings in a steady trickle of leads on top of what selling time finds, and more once your reputation is good.</p><div class="seg">'+MKT.map((v,i)=>'<button data-act="mkt" data-v="'+i+'" aria-pressed="'+(L===i)+'">'+(v?gbp(v)+'/mo':'None')+'<small>'+['','about 1 lead a month','about 2 a month','about 3 a month'][i]+'</small></button>').join('')+'</div></div>';}
ACT_EXT.mkt=v=>{v=Math.round(+v);if(!(v>=0&&v<MKT.length))return;S.co.mkt=v;log(+v?'Marketing budget set to '+gbp(MKT[+v])+' a month.':'Marketing stopped.','info');};
/* founder morale: going unpaid wears you down */
function founderMorale(){const f=founderSt();if(!f)return;const yr=(S.co.divLog||[]).filter(x=>S.day-x.d<YEAR).reduce((a,x)=>a+x.v,0)+(f.salary||0)*12;
  let t=85;if(S.day>YEAR)t-=clamp((30000-yr)/30000,0,1)*25;if((f.util||0)>0.97)t-=10;f.morale=clamp(f.morale+(t-f.morale)*0.02,0,100);}
ACT_EXT.toMarket=()=>{const s=ST(ui.modal&&ui.modal.id);if(!s||s.id==='you'||(s.raise||-999)+60>S.day)return;const m=Math.round(marketPay(s)/10)*10;if(s.salary>=m)return;s.salary=m;s.raise=S.day;s.morale=Math.min(100,s.morale+8);log(s.name+' is now paid the going rate, '+gbp(m)+'.','good');};
/* daily */
const _peopleDaily18=peopleDaily;
peopleDaily=function(W){_peopleDaily18(W);founderMorale();
  const lvl=S.co.mkt||0;if(lvl){spend(MKT[lvl]/DPM);if(S.deals.length<14&&Math.random()<[0,1,2,3][lvl]*(0.6+S.co.rep/100)*marketRoom()/DPM)addProspect({note:'Came in through your marketing.'});}
  for(const d of S.deals)if(d.stage==='open'&&d.exp-S.day===3&&!d.warned){d.warned=true;log('The proposal for '+dealName(d)+' expires in 3 days.','bad');}
  if(!S.flags.saleNote&&mrr()>=40000){S.flags.saleNote=1;log('Buyers are starting to notice you. The Money tab now shows what the company might sell for.','event');}
};
