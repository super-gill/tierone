
/* ============ build 104: life as a public company — board pay and real dividends ============
   Once you float, three things change:
   1. The board puts you on a market CEO salary that scales with the group, and pays a
      performance bonus after a good quarter. You no longer set your own pay by hand.
   2. The company declares a dividend each quarter, ~30% of the quarter's profit, and it is
      split across ALL shareholders. You receive only your stake's share; the rest genuinely
      leaves the company to the public float. (Previously you pocketed the entire pot.)
   3. The "pay yourself" panel becomes a board-package summary while public. */

/* market CEO salary, scaling with group size — roughly £150k to £700k a year */
function ceoPay(){if(!isPublic())return 0;const g=(typeof groupMRR==='function')?groupMRR():mrr();
  return clamp(Math.round((12000+g*0.03)/500)*500,12500,58000);}
function setCeoSalary(){if(!isPublic())return;const f=founderSt();if(f)f.salary=ceoPay();}

/* put the CEO straight onto the board package the moment the float completes */
if(ACT_EXT.ipoGo){const _go=ACT_EXT.ipoGo;ACT_EXT.ipoGo=v=>{_go(v);try{setCeoSalary();}catch(e){}};}
/* a save that is already public picks the package up on load */
if(typeof migrateSave==='function'){const _m=migrateSave;migrateSave=function(){_m.apply(this,arguments);try{if(isPublic()){const f=founderSt();if(f&&(f.salary||0)<ceoPay())f.salary=ceoPay();}}catch(e){}};}

/* each quarter: refresh salary, pay a bonus on a good quarter, and declare a split dividend */
if(typeof ipoQuarter==='function'){const _q=ipoQuarter;ipoQuarter=function(){
  const prev=S.co.ipo&&S.co.ipo.lastReport;
  _q.apply(this,arguments);
  const io=S.co.ipo;if(!io||S.over)return;
  const rep=io.lastReport;if(!rep||rep===prev)return;   // only when a fresh quarter has just reported
  setCeoSalary();
  const f=founderSt();
  const buffer=(typeof divBuffer==='function')?divBuffer():0;
  const oncost=(typeof ONCOST!=='undefined')?ONCOST:0.15;
  /* performance bonus — paid only after a profitable, non-declining quarter, and only if affordable */
  if(f&&rep.profitable&&(rep.delta||0)>=0){
    const gross=Math.round((f.salary||ceoPay())*(1+clamp((rep.delta||0)*4,0,2)));   // 1x to 3x monthly salary
    const withOncost=Math.round(gross*(1+oncost));
    if(gross>0&&S.co.cash-withOncost>buffer){
      const annSal=(f.salary||0)*12;
      const marg=(typeof incomeTaxNI==='function')?(incomeTaxNI(annSal+gross)-incomeTaxNI(annSal)):gross*0.45;
      const net=Math.max(0,Math.round(gross-marg));
      S.co.cash-=withOncost;S.m.sal=(S.m.sal||0)+withOncost;
      S.co.home=(S.co.home||0)+net;S.co.ceoBonus=(S.co.ceoBonus||0)+net;
      log('The board awarded you a '+gbp(gross)+' bonus for the quarter'+(net<gross?' ('+gbp(net)+' after tax)':'')+'.','good');
    }
  }
  /* quarterly dividend to ALL shareholders, ~30% of the quarter's profit, capped by a cash buffer */
  const qProfit=S.hist.slice(-3).reduce((a,h)=>a+(h.profit||0),0);
  let pot=Math.round(Math.max(0,qProfit)*0.30);
  pot=Math.min(pot,Math.max(0,Math.floor((S.co.cash-buffer)/100)*100));
  if(pot>=100){
    const stake=(typeof yourStakePct==='function')?yourStakePct():1;
    const yours=Math.round(pot*stake);const ext=pot-yours;
    const yoursNet=(typeof divNet==='function')?Math.round(divNet(yours)):yours;
    S.co.cash-=pot;S.co.divs=(S.co.divs||0)+yoursNet;
    (S.co.divLog=S.co.divLog||[]).push({d:S.day,v:yours});
    log('Quarterly dividend of '+gbp(pot)+' declared: '+gbp(yours)+' to your '+pct(stake)+' stake'+(yoursNet<yours?' ('+gbp(yoursNet)+' after tax)':'')+', '+gbp(ext)+' to the outside shareholders.','good');
  }
};}

/* manual dividends, if ever called while public, are split across shareholders too (no more pocketing the lot) */
if(ACT_EXT.dividend){const _div=ACT_EXT.dividend;ACT_EXT.dividend=v=>{
  if(!isPublic())return _div(v);
  v=+v;if(!(v>=100)||v>divRoom())return;
  const stake=(typeof yourStakePct==='function')?yourStakePct():1;
  const yours=Math.round(v*stake);const yoursNet=(typeof divNet==='function')?Math.round(divNet(yours)):yours;
  (S.co.divLog=S.co.divLog||[]).push({d:S.day,v:yours});
  S.co.cash-=v;S.co.divs=(S.co.divs||0)+yoursNet;
  const f=founderSt();if(f)f.morale=Math.min(100,f.morale+4);
  log('Dividend of '+gbp(v)+' declared: '+gbp(yours)+' to your '+pct(stake)+' stake, '+gbp(v-yours)+' to the outside shareholders.','good');
};}

/* while public, the "pay yourself" panel becomes a board-package summary */
if(typeof ownerSec==='function'){const _own=ownerSec;ownerSec=function(){
  if(!isPublic())return _own.apply(this,arguments);
  const home=(S.co.home||0)+(S.co.divs||0);const sal=ceoPay();const stake=(typeof yourStakePct==='function')?yourStakePct():1;
  let h='<div class="sec"><h3>Your board package</h3>';
  h+='<p class="lede">You’re a public-company CEO now, so the board sets your pay and the company declares dividends to every shareholder. Taken home so far: <b>'+gbp(home)+'</b>.</p>';
  h+='<div class="tiles">'+
    '<div class="tile"><span class="k">CEO salary</span><span class="v">'+gbp(sal)+'</span><small>a month · '+gbp(sal*12)+' a year, board-set</small></div>'+
    '<div class="tile"><span class="k">Bonuses paid</span><span class="v pos">'+gbp(S.co.ceoBonus||0)+'</span><small>after tax, on good quarters</small></div>'+
    '<div class="tile"><span class="k">Dividends to you</span><span class="v pos">'+gbp(S.co.divs||0)+'</span><small>your '+pct(stake)+' stake, after tax</small></div>'+
    '</div>';
  h+='<p class="mut" style="font-size:.82rem;margin-top:8px">Dividends are declared quarterly to all shareholders, about 30% of the quarter’s profit. You receive your stake’s share automatically; the rest goes to the public float. Sell down or exit from the Strategy tab.</p></div>';
  return h;
};}
