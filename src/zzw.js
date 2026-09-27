
/* ============ build 133: branch value maturation + cost scaling ============
   Branches were frozen at their acquisition per-client value while HQ clients grew, so a big
   branch looked like a rounding error next to headquarters. Now a branch's revenue per seat
   matures over time toward a fraction of your own HQ per-seat value (simulating its managers
   cross-selling), gated by how well it's run. To keep that honest, a richer service mix also
   raises the branch's cost of sales and its staffing need, so a maturing branch grows bigger
   AND costs more to run, landing at a realistic net margin rather than free money. */

function brSupportRef(){return (typeof refPrice==='function'?refPrice('support'):45);}
function brPerSeat(b){return (b.perClient||0)/(b.seatsPer||BR_SEATS);}
function brSvcMix(b){return clamp(brPerSeat(b)/brSupportRef(),0.6,4.5);}   // ~1.9 at acquisition, in units of a support seat
function hqPerSeat(){const cl=(typeof active==='function')?active():[];if(!cl.length)return brSupportRef()*1.9;let s=0;for(const c of cl)s+=(c.seats||BR_SEATS);return s?mrr()/s:brSupportRef()*1.9;}
/* how much of your HQ per-seat value a well-run branch captures over time */
function brFrac(b){return clamp(0.50+0.06*((b.mgr&&b.mgr.skill)||3)+(b.invest?0.06:0)+brOversightQ()*0.6,0.50,0.90);}
function brTargetPer(b){return Math.max(b.perClient||0,Math.round(hqPerSeat()*brFrac(b)*(b.seatsPer||BR_SEATS)));}

/* richer service mix means more products to support: more staff needed. Normalised so a
   just-acquired branch (mix ~1.0, roughly support + one product) matches the old need. */
function brNeed(b){const svc=brSvcMix(b);const load=0.7+0.3*svc;return Math.max(1,Math.round(brSeats(b)*load/(BR_TECH_PER*(0.85+0.06*((b.mgr&&b.mgr.skill)||3)))));}
/* and higher cost of sales (the extra services carry vendor cost), before HQ synergy */
function brResold(b){const svc=brSvcMix(b);const base=clamp(0.34*Math.pow(svc,0.55),0.30,0.6);return base*(1-brSynergy());}

/* each month a well-run branch cross-sells its clients up toward the target value */
function matureBranch(b){const tgt=brTargetPer(b);const cur=b.perClient||0;if(cur>=tgt)return;
  const q=(typeof brQuality==='function')?brQuality(b):0.7;
  const rate=0.02*(1+(b.invest?0.7:0)+(((b.grow||1)>1)?0.5:0))*(0.5+q*0.5);
  b.perClient=Math.min(tgt,cur+(tgt-cur)*rate);}
if(typeof branchesMonthly==='function'){const _bm=branchesMonthly;branchesMonthly=function(){_bm.apply(this,arguments);try{for(const b of branches())matureBranch(b);}catch(e){}};}
