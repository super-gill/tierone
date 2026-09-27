
/* ============ build 49: teaching the new systems ============ */
/* A reusable first-time-tip primitive so every system (and every future one)
   can carry its own short strategic intro, shown once and dismissible. Plus
   log announcements when a whole system unlocks, and glossary terms for the new
   jargon. The rule from here: a new mechanic ships with its teaching. */
function tipSeen(id){return !!(S.tips&&S.tips[id]);}
ACT_EXT.tipOk=id=>{S.tips=S.tips||{};S.tips[id]=S.day;};
function tipBox(id,body){if(tipSeen(id))return '';
  return '<div class="note tip" style="border-left:3px solid var(--p);background:color-mix(in srgb,var(--p) 8%,transparent);margin-bottom:10px"><div class="row" style="justify-content:space-between;align-items:flex-start;gap:8px"><b style="color:var(--p)">New here — a tip</b><button class="linkbtn" data-act="tipOk" data-v="'+id+'">Got it</button></div><span>'+body+'</span></div>';}
function once(id){S.tips=S.tips||{};if(S.tips['u_'+id])return false;S.tips['u_'+id]=S.day;return true;}

/* prepend a one-time tip to each new system's view */
if(typeof paneMarket==='function'){const _f=paneMarket;paneMarket=function(){const h=_f.apply(this,arguments);if(!S.mkt)return h;return tipBox('mkt','Click any firm for its full card, where you can partner and ally, spy on them, or undercut them. Rivals remember how you treat them, and playing dirty builds “heat” that can catch up with you. Big contracts come out to tender here too.')+h;};}
if(typeof teamToolsSec==='function'){const _f=teamToolsSec;teamToolsSec=function(){return tipBox('biz','Ratings tell you how much people like a tool, not how secure it is — a cheap crowd-pleaser can be a real liability, and every tool widens your attack surface (see the Risk tab). Running two or more products from the same vendor earns a loyalty discount across your whole stack.')+_f.apply(this,arguments);};}
if(typeof billingSec==='function'){const _f=billingSec;billingSec=function(){return tipBox('bill','Watch your coverage. You can do the books yourself for about a dozen clients; past that, unbilled work leaks away and debtors drift. A billing clerk pays for itself, and a manager runs a whole department.')+_f.apply(this,arguments);};}
if(typeof leadershipSec==='function'){const _f=leadershipSec;leadershipSec=function(){return tipBox('exec','An executive’s effect is their quality times how well their focus fits their personality. A Visionary set to “Build & innovation” far outperforms the same person forced onto “Security”. Set each one’s focus to play to who they are.')+_f.apply(this,arguments);};}
if(typeof pubSec==='function'){const _f=pubSec;pubSec=function(){return tipBox('ipo','Floating raises capital and puts a public value on the company, but the market then judges you every quarter. Beat its growth expectations and the share price rises; miss them, or take a breach or lawsuit, and it falls. Two bad quarters running and the board can remove you.')+_f.apply(this,arguments);};}
if(typeof paneMapModal==='function'){const _f=paneMapModal;paneMapModal=function(){const h=_f.apply(this,arguments);return h.replace('<p>Each region is its own market',tipBox('reg','You’re well known at home and a nobody the moment you cross a border. A new branch has to build its name slowly before work comes easily, so buying a local firm — and inheriting its reputation — is often the faster, dearer way into a region.')+'<p>Each region is its own market');};}
if(typeof devSec==='function'){const _f=devSec;devSec=function(){return tipBox('dev','Bespoke builds can fail outright, and once live they slowly break without a team maintaining them. They pay off with very low running costs. A CTO focused on “Build” makes them cheaper and far more reliable.')+_f.apply(this,arguments);};}

/* announce whole systems as they unlock, so players notice the new tab or option */
function tutorDaily(){if(!S||S.over)return;const m=mrr();
  if(m>=30000&&once('strategy'))log('You’ve passed £30k MRR and a new Strategy tab has opened: your own facilities and bespoke systems, big growth plays, and the regional map.','good');
  if(m>=40000&&companyPL().op>0&&once('exec'))log('You’re big enough to bring in a C-suite, a CTO, CFO or COO to steer a whole domain. Look for Leadership on the Strategy tab.','good');
  if(typeof ipoElig==='function'&&ipoElig()&&once('ipo'))log('You could now float the company on AIM. See “Going public” on the Strategy tab, a bigger prize than any trade sale.','good');
  if(S.mkt&&rivals&&rivals().some(r=>r.target>S.day)&&once('threat'))log('A rival is going after your clients. The Market tab shows who’s circling and what you can do about them.','event');
  if(S.mkt&&active().length>=18&&once('regions'))log('The country is split into regional markets, each with its own rivals and your own local reputation. Open the map on the Strategy tab to expand beyond home.','info');
  if(typeof surface==='function'&&surface()>=6&&once('surface'))log('Your growing stack of tools is widening your attack surface, more ways in for an attacker. Keep an eye on the Risk tab.','info');
}
if(typeof peopleDaily==='function'){const _pd=peopleDaily;peopleDaily=function(W){_pd(W);if(S.day%3===0)tutorDaily();};}

/* glossary: the new jargon */
if(typeof GLOSS!=='undefined')Object.assign(GLOSS,{
  CTO:'Chief Technology Officer: owns technology strategy — the stack, security and bespoke builds.',
  CFO:'Chief Financial Officer: owns the money — collections, capital and cost.',
  COO:'Chief Operating Officer: owns day-to-day operations across the managers.',
  AIM:'The Alternative Investment Market: the London stock exchange’s market for smaller growing companies.',
  IPO:'Initial public offering: floating the company on a stock market to raise capital.',
  CRM:'Customer relationship management: software for your sales pipeline and client records.',
  BI:'Business intelligence: dashboards and reporting over your whole business.',
  DevOps:'A team that builds and runs bespoke software: your own tools, platforms and products.'
});
if(typeof GLOSS_WORDS!=='undefined')Object.assign(GLOSS_WORDS,{
  'attack surface':'Every tool and system with access to client data is a way in for an attacker. More tools, and cheaper ones, mean a bigger surface and more breach risk.',
  'market cap':'Market capitalisation: a public company’s share price times its number of shares — what the market thinks it’s worth.',
  'flotation':'Floating: selling shares in your company to the public on a stock market for the first time.',
  'secondary placing':'Issuing new shares in an already-public company to raise more money. It dilutes existing owners.',
  'cartel':'An illegal arrangement where competitors agree not to undercut each other, keeping prices and margins high.',
  'alliance':'A formal partnership with a rival: referrals, cover, no poaching, and going after big contracts together.',
  'greenfield':'Opening a brand-new branch from scratch in a region, rather than buying an existing firm there.',
  'branch':'An acquired or newly-opened office in another region that runs itself, with its own staff and P&L.',
  'coverage':'In billing, how much of your client base is properly invoiced and chased. Low coverage leaks revenue.',
  'loyalty discount':'A price cut a vendor gives for running several of their products — a “suite” — across your stack.',
  'bespoke':'Software built specifically for you by your DevOps team, rather than bought from a vendor.',
  'no-poaching':'An agreement with a rival that neither of you recruits the other’s staff.'
});
