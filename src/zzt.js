
/* ============ build 126: in-house builds shown in the stack at £0 ============
   When a DevOps build replaces a resold tool, it now reads as "Your own X" in the stack at
   no licence cost (see zz.js coreStackSec / applyBuild). This migrates older saves where an
   in-house tool still carried a fraction of the vendor cost, and adds a note in the catalogue
   so switching back to a vendor is a clear choice. */

const IH_LABEL={rmm:'RMM',psa:'PSA',docs:'documentation',backup:'backup platform',edr:'security stack'};

if(typeof migrateSave==='function'){const _m=migrateSave;migrateSave=function(){_m.apply(this,arguments);
  try{for(const k in S.vend){if(S.vend[k]&&S.vend[k].inhouse)S.vend[k].pm=0;}}catch(e){}
};}

if(typeof MODAL_EXT!=='undefined'&&MODAL_EXT.coreShop){const _cs=MODAL_EXT.coreShop;MODAL_EXT.coreShop=(M,x)=>{
  let h=_cs(M,x);const s=S.vend[M.k];
  if(s&&s.inhouse){const note='<p class="note">You run your own '+(IH_LABEL[M.k]||'tool')+' here, built by your DevOps team, at no licence cost. Picking a vendor below drops it and the bill comes back.</p>';
    h=h.replace('<ul class="list">',note+'<ul class="list">');}
  return h;};}
