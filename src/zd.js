
/* ============ build 42: going public ============ */
/* The endgame for a battlecruiser MSP: float on AIM, raise capital, and live
   with a share price that moves every quarter on whether you beat the market's
   expectations. New win condition (build a big enough public company and ring
   the bell) and new ways to lose (two bad quarters and the board removes you).
   Incidents that were once a nuisance now hit your share price. */
const PUB_MULT=1.6;                 // public markets pay a premium over a trade sale
const PUB_TARGET_FLOOR=50000000;    // the "tier one" bar
const IPO_SHARES=1000000;
const OUST_STRIKES=4;                // bad quarters (share price under 45% of float) before the board removes you
function isPublic(){return !!(S.co&&S.co.ipo);}
function lastQProfit(){const h=S.hist.slice(-3);if(h.length<3)return false;return h.reduce((a,x)=>a+x.profit,0)>0;}
function ipoElig(){return !isPublic()&&!S.over&&groupMRR()>=150000&&lastQProfit();}
function ipoValue(){return Math.round((typeof valuation==='function'?valuation():mrr()*24)*PUB_MULT/10000)*10000;}
function marketCap(){const io=S.co.ipo;return io?Math.round(io.price*io.shares):0;}
function yourStake(){const io=S.co.ipo;return io?Math.round(io.price*io.yourShares):0;}
function yourStakePct(){const io=S.co.ipo;return io?io.yourShares/io.shares:0;}
function ipoLocked(){const io=S.co.ipo;return io&&S.day-io.floatDay<DPM*12;}

ACT_EXT.ipoGo=v=>{const f=+v/100;if(!ipoElig()||!(f>0.05&&f<0.6))return;
  const mc=ipoValue();const price=Math.round(mc/IPO_SHARES*100)/100;
  const gross=Math.round(mc*f);const fees=Math.round(gross*0.06);const net=gross-fees;
  const peq=(typeof partner==='function'&&partner())?partner().equity:0;
  const yourFrac=(1-peq)*(1-f);
  S.co.ipo={floatDay:S.day,floatMonth:monthOf(S.day),price,floatPrice:price,shares:IPO_SHARES,
    yourShares:Math.round(IPO_SHARES*yourFrac),floatPct:f,priceHist:[price],
    expMRR:Math.round(groupMRR()*1.03),misses:0,raised:net,incSnap:0,lastQ:monthOf(S.day),
    target:Math.max(PUB_TARGET_FLOOR,Math.round(mc*3/1000000)*1000000)};
  S.co.cash+=net;S.m.setup=(S.m.setup||0)+net;S.co.capYr=(S.co.capYr||0)+net;
  log(S.co.name+' has floated on AIM at '+spx(price)+' a share, valuing it at '+gbp(mc)+'. You sold '+pct(f)+' and raised '+gbp(net)+' net of fees. You’re a public company now, and the market is watching every quarter.','event');
  if(typeof x19==='function')x19('ipo');ui.modal=null;};

function incidentsSince(io){const x=S.x19||{};const cur=(x.breach||0)+(x.suit||0)+(x.scandal||0)+(x.toolLeak||0)+(x.bespokeOutage||0);const d=Math.max(0,cur-(io.incSnap||0));io.incSnap=cur;return d;}
function ipoRecentGrowth(){const h=S.hist.slice(-4);if(h.length<4)return 0.03;return h[h.length-1].mrr/Math.max(1,h[0].mrr)-1;}
function ipoQuarter(){const io=S.co.ipo;if(!io)return;const mo=monthOf(S.day);
  if(mo%3!==0||mo<=io.lastQ)return;io.lastQ=mo;
  const prevPrice=io.price;
  const cur=groupMRR();const exp=io.expMRR||cur;const growthPerf=exp>0?cur/exp-1:0;
  const P=companyPL();const profPerf=P.op>0?0.06:-0.14;
  const inc=incidentsSince(io);
  let delta=clamp(growthPerf*2.2+profPerf-inc*0.07+rnd(-0.04,0.04),-0.45,0.5);
  io.price=Math.max(0.05,Math.round(io.price*(1+delta)*100)/100);
  io.priceHist.push(io.price);if(io.priceHist.length>32)io.priceHist.shift();
  io.expMRR=Math.round(cur*(1+clamp(ipoRecentGrowth(),0,0.12)));
  io.misses=(io.price<io.floatPrice*0.45)?(io.misses||0)+1:0;
  io.lastReport={mo,cur,exp,growthPerf,profitable:P.op>0,op:Math.round(P.op),inc,prevPrice,price:io.price,delta,cap:marketCap(),target:io.target,misses:io.misses,floatPrice:io.floatPrice,hitTargetNew:false,hitTarget:!!io.hitTarget};
  log('Quarterly results: shares '+(delta>=0?'up':'down')+' '+pct(Math.abs(delta))+' to '+spx(io.price)+', '+(growthPerf>=0?'beating':'missing')+' the market’s growth expectations'+(inc?' (and knocked by the quarter’s incidents)':'')+'. Market cap '+gbp(marketCap())+'.',delta>=0?'good':'bad');
  if(io.misses>=OUST_STRIKES){ipoOust();return;}
  if(marketCap()>=io.target&&!io.hitTarget){io.hitTarget=true;io.lastReport.hitTarget=true;io.lastReport.hitTargetNew=true;log('Your market cap has passed '+gbp(io.target)+'. You’ve built a genuine tier-one MSP. Ring the bell on the Strategy tab whenever you’re ready to call it.','good');}
  io.reportDue=true;   // the board wants to see you: a report modal opens once the queue is clear
}
function ipoOust(){const io=S.co.ipo;const E=exitNet(Math.round(io.price*io.yourShares*0.9)+Math.max(0,S.co.cash)-S.co.loan);
  S.over={mi:monthOf(S.day),peak:Math.max(...S.hist.map(h=>h.mrr),mrr()),sold:{head:'Ousted',title:'The board has removed you',body:'After two bad quarters running, the board lost patience and voted you out as CEO of '+S.co.name+'. You keep your shares, sold down at '+spx(io.price)+', but the company is someone else’s to run now.',net:E.net,cgt:E.cgt,gross:E.gross,home:(S.co.home||0)+(S.co.divs||0),offer:marketCap()}};
  log('The board has removed you as CEO after two bad quarters.','bad');}
ACT_EXT.ipoWin=()=>{const io=S.co.ipo;if(!io||!io.hitTarget||S.over)return;
  const E=exitNet(Math.round(io.price*io.yourShares)+Math.max(0,S.co.cash)-S.co.loan);
  S.over={mi:monthOf(S.day),peak:Math.max(...S.hist.map(h=>h.mrr),mrr()),sold:{head:'Tier One',title:'You built a tier-one MSP',body:'You rang the bell on a '+gbp(marketCap())+' public company. From two telephony clients and a laptop in the spare room to this. Your '+pct(yourStakePct())+' stake is worth '+gbp(Math.round(io.price*io.yourShares))+'.',net:E.net,cgt:E.cgt,gross:E.gross,home:(S.co.home||0)+(S.co.divs||0),offer:marketCap()}};
  log('You rang the bell. From a spare room to a '+gbp(marketCap())+' public company.','good');ui.modal=null;};
ACT_EXT.ipoRaise=()=>{const io=S.co.ipo;if(!io||S.over)return;if(io.price<io.floatPrice*0.6){if(typeof toast==='function')toast('The market won’t take a placing while the share price is this weak.');return;}
  if(io.lastRaise!=null&&S.day-io.lastRaise<DPM*12){if(typeof toast==='function')toast('The market won’t stomach another placing so soon, roughly once a year.');return;}
  io.lastRaise=S.day;const newShares=Math.round(io.shares*0.15);const gross=Math.round(newShares*io.price);const fees=Math.round(gross*0.04);
  io.shares+=newShares;S.co.cash+=gross-fees;S.m.setup=(S.m.setup||0)+gross-fees;S.co.capYr=(S.co.capYr||0)+(gross-fees);
  io.price=Math.round(io.price*0.97*100)/100;   // placings price at a discount and dilute the price
  log('Secondary placing: raised '+gbp(gross-fees)+' net by issuing 15% new shares at a discount. Everyone’s stake, including yours, is diluted, and the price softened a little.','event');};
ACT_EXT.ipoSell=v=>{const io=S.co.ipo;if(!io||S.over)return;if(ipoLocked()){if(typeof toast==='function')toast('Your shares are locked up for the first year after floating.');return;}
  const frac=+v;if(!(frac>0&&frac<=1))return;const sell=Math.round(io.yourShares*frac);const gross=Math.round(sell*io.price);const E=exitNet(gross);
  io.yourShares-=sell;S.co.home=(S.co.home||0)+E.net;
  log('You sold '+pct(frac)+' of your holding for '+gbp(gross)+(E.cgt?', '+gbp(E.net)+' after capital gains tax':'')+', banked personally.','good');
  if(io.yourShares<=0){const F=exitNet(Math.max(0,S.co.cash)-S.co.loan);S.over={mi:monthOf(S.day),peak:Math.max(...S.hist.map(h=>h.mrr),mrr()),sold:{head:'Cashed out',title:'You sold the last of your shares',body:'You’ve sold your entire stake in '+S.co.name+' and walked away. It trades on without you.',net:F.net,cgt:F.cgt,gross:F.gross,home:S.co.home||0,offer:marketCap()}};}
};

/* quarterly results at month end */
const _monthEnd_ipo=monthEnd;monthEnd=function(){_monthEnd_ipo();if(!S.over)ipoQuarter();};

/* the Public markets section on the Strategy tab */
function pubSec(){
  if(!isPublic()){
    if(!ipoElig()){const need=[];if(groupMRR()<150000)need.push('£150k MRR (you’re at '+gbp(groupMRR())+')');if(!lastQProfit())need.push('a profitable last quarter');
      return '<div class="sec"><h3>Going public</h3><p class="lede">Float the company on AIM to raise capital and put a public value on what you’ve built. It opens a whole new game of quarterly expectations and a share price, and a bigger prize than any trade sale.</p><p class="mut" style="font-size:.84rem">Needs '+need.join(' and ')+'.</p></div>';}
    const mc=ipoValue();
    return '<div class="sec"><h3>Going public</h3><p class="lede">You’re big enough to float on AIM. Sell a slice of the company to the market for cash, at a public-market valuation of about '+gbp(mc)+'. You keep control, but from then on the market judges you every quarter, and a bad run can cost you the top job.</p><div class="row">'+[15,25,35].map(f=>'<button class="btn'+(f===25?' primary':'')+'" data-act="ipoGo" data-v="'+f+'">Float '+f+'% · raise ~'+gbp(Math.round(mc*f/100*0.94))+'</button>').join('')+'</div><p class="mut" style="font-size:.76rem;margin-top:6px">Fees take about 6% of the raise. Your shares are locked up for the first year.</p></div>';
  }
  const io=S.co.ipo;const rel=io.price/io.floatPrice;const relCls=rel>=1.15?'pos':rel>=0.7?'wrn':'neg';
  const nextQ=3-(monthOf(S.day)%3);
  let h='<div class="sec"><h3>Public markets</h3><div class="tiles"><div class="tile"><span class="k">Share price</span><span class="v '+relCls+'">'+spx(io.price)+'</span><small>floated at '+spx(io.floatPrice)+' ('+pctd(rel)+')</small></div><div class="tile"><span class="k">Market cap</span><span class="v">'+gbp(marketCap())+'</span><small>target '+gbp(io.target)+'</small></div><div class="tile"><span class="k">Your stake</span><span class="v">'+gbp(yourStake())+'</span><small>'+pct(yourStakePct())+' of the company</small></div></div>';
  h+='<p class="lede" style="margin-top:8px">Next results in '+(nextQ===0?'this month':nextQ+' month'+(nextQ>1?'s':''))+'. The market expects about '+gbp(io.expMRR)+' MRR (you’re at '+gbp(groupMRR())+') and a profit. Beat it and the price rises; miss it, or take a breach or a lawsuit, and it falls. '+OUST_STRIKES+' bad quarters under '+gbp(io.floatPrice*0.45)+' and the board removes you'+(io.misses?' — you’ve had '+io.misses+' already':'')+'.</p>';
  h+='<div class="row">'+(io.hitTarget?'<button class="btn primary" data-act="ipoWin">Ring the bell (call it a win)</button>':'')+
    '<button class="btn" data-act="ipoRaise" '+(io.price<io.floatPrice*0.6?'disabled title="Share price too weak"':'')+'>Secondary raise (+15% shares)</button>'+
    (ipoLocked()?'<button class="btn" disabled title="Locked up for the first year">Sell shares</button>':'<button class="btn" data-act="ipoSell" data-v="0.25">Sell 25% of your shares</button><button class="btn" data-act="ipoSell" data-v="1">Sell all &amp; exit</button>')+
    '</div>';
  if(io.priceHist.length>2)h+='<p class="mut" style="font-size:.78rem;margin-top:8px">Price history: '+io.priceHist.slice(-10).map(p=>gbp(p)).join(' → ')+'</p>';
  h+='</div>';
  return h;
}
/* pubSec relocated to the Ownership tab (see zzr.js) */
