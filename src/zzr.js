
/* ============ build 123: right-hand control panel reorganisation ============
   - Investments tab retired; its portfolio overview now lives in the Markets widget (zzb.js).
   - Legal tab merged into Risk, renamed "Risk & Legal"; paneLegal() appended onto the Risk pane.
   - Strategy split: a new Ownership tab holds going-public, the board, raid defence and meetings;
     Leadership moves to Team, Departmental budgets moves to Money.
   The section-builder functions (pubSec, boardPanelHTML, raidSec, meetingsSec, leadershipSec,
   budgetsSec, paneLegal) are unchanged; only where they render has moved. */

(function(){
  const g=(typeof GROUPS!=='undefined')&&GROUPS.find(x=>x.k==='business');
  if(g){
    g.tabs=g.tabs.filter(t=>t!=='invest'&&t!=='legal');
    if(!g.tabs.includes('ownership')){const i=g.tabs.indexOf('strategy');g.tabs.splice(i>=0?i+1:g.tabs.length,0,'ownership');}
    if(!g.tabs.includes('branches')){const i=g.tabs.indexOf('strategy');g.tabs.splice(i>=0?i+1:g.tabs.length,0,'branches');}
  }
  if(typeof TAB_LABEL!=='undefined'){TAB_LABEL.ownership='Ownership';TAB_LABEL.branches='Branches';TAB_LABEL.risk='Risk & Legal';delete TAB_LABEL.invest;delete TAB_LABEL.legal;}
  if(typeof TABS!=='undefined'){for(let i=TABS.length-1;i>=0;i--)if(TABS[i][0]==='legal'||TABS[i][0]==='invest')TABS.splice(i,1);if(!TABS.some(t=>t[0]==='ownership'))TABS.push(['ownership','Ownership']);if(!TABS.some(t=>t[0]==='branches'))TABS.push(['branches','Branches']);}
})();

/* Ownership tab: you as owner, listed company and governance */
function paneOwnership(){
  let h='';
  if(typeof raidSec==='function')h+=raidSec();
  if(typeof meetingsSec==='function')h+=meetingsSec();
  const pub=(typeof isPublic==='function')&&isPublic();
  const canFloat=pub||(typeof mrr==='function'&&mrr()>=100000);
  h+='<div class="sec"><h3>Ownership</h3><p class="lede">You as the owner: taking '+esc(S.co.name)+' public, the board once you are listed, defending against takeovers, and selling down your stake.</p></div>';
  if(typeof pubSec==='function'&&canFloat)h+=pubSec();
  if(pub&&S.co&&S.co.ipo&&typeof boardPanelHTML==='function')h+=boardPanelHTML(S.co.ipo);
  if(!canFloat)h+='<div class="sec"><p class="empty">Once the company is larger (around '+gbp(100000)+' MRR) you can look at floating it on the market. Until then there is nothing to manage here.</p></div>';
  return h;
}

/* Branches tab: the MSPs you own and run as separate sites */
function paneBranches(){
  const bs=(typeof branchesSec==='function')?branchesSec():'';
  if(bs)return bs;
  return '<div class="sec"><h3>Your branches</h3><p class="lede">MSPs you own and run as separate sites, each with its own manager, that you set the direction for and take the profit from.</p><p class="empty">You don’t run any branches yet. You pick them up by acquiring a rival outright and keeping it standalone, or by expanding into a new region from <button class="linkbtn" data-act="tab" data-v="strategy">Strategy → Sites and regions</button>.</p></div>';
}

/* route the new tabs, and steer any stale Investments/Legal selection to its new home */
if(typeof renderPane==='function'){const _rp=renderPane;renderPane=function(){
  if(ui.tab==='invest')ui.tab='money';
  if(ui.tab==='legal')ui.tab='risk';
  if(ui.tab==='ownership'){const p=$('pane');if(p){const top=p.scrollTop;p.innerHTML=paneOwnership();p.scrollTop=top;}return;}
  if(ui.tab==='branches'){const p=$('pane');if(p){const top=p.scrollTop;p.innerHTML=paneBranches();p.scrollTop=top;}return;}
  return _rp.apply(this,arguments);};}

/* Leadership → Team (scaled companies only, as before) */
if(typeof paneTeam==='function'){const _pt=paneTeam;paneTeam=function(){let h=_pt.apply(this,arguments);
  if(typeof leadershipSec==='function'&&typeof mrr==='function'&&mrr()>=40000){try{h+=leadershipSec();}catch(e){}}
  return h;};}

/* Departmental budgets → Money */
if(typeof paneMoney==='function'){const _pm=paneMoney;paneMoney=function(){let h=_pm.apply(this,arguments);
  if(typeof budgetsSec==='function'){try{const b=budgetsSec();if(b)h+=b;}catch(e){}}
  return h;};}

/* Legal → Risk (merged into one tab) */
if(typeof paneRisk==='function'&&typeof paneLegal==='function'){const _prk=paneRisk;paneRisk=function(){let h=_prk.apply(this,arguments);
  try{h+=paneLegal();}catch(e){}
  return h;};}
