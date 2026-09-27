
/* ============ build 82: group MRR + recurring investment income ============
   MRR was head-office client revenue only. Branch (and later subsidiary)
   revenue is operating recurring revenue too, so the valuation, the loan, the
   board's expectation and tender turnover now read "group MRR". Investment
   dividends and savings interest are recurring but non-operating, so they get
   their own line and stay out of the MRR that drives the valuation multiple. */

/* recurring revenue from branches (gross, at their run rate) */
function branchMRR(){let t=0;if(typeof branches==='function')for(const b of branches())t+=(typeof brMRR==='function'?brMRR(b):0);return Math.round(t);}
/* the whole operating company: head office plus branches (subsidiaries slot in here later) */
function groupMRR(){return mrr()+branchMRR();}
/* current monthly run rate of recurring investment income: stake dividends, share dividends, savings interest */
function investIncomeM(){
  let t=0;
  if(typeof rivals==='function')for(const r of rivals())if(r.stake)t+=Math.round(rSeats(r)*45*0.1*0.2);
  const sh=(S.co&&S.co.shares)||{};
  for(const rid in sh){const r=(typeof rivalById==='function')&&rivalById(rid);if(r&&typeof sharePx==='function')t+=Math.round(sh[rid].units*sharePx(r)*0.0022);}
  if(S.co&&S.co.savings>0&&!S.co.savingsCompound&&typeof SAVE_APR!=='undefined')t+=Math.round(S.co.savings*SAVE_APR/12);
  return t;
}
