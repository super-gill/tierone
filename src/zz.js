
/* ============ build 31: projects + technical managers, and team tools ============ */
/* Two operational managers the org was missing, and a proper tooling layer. */
Object.assign(ROLES,{
  pm:{t:'Projects Manager',short:'Projects manager',sal:[3600,4900],col:'--r-sdm',blurb:'Runs project delivery and onboarding: keeps work on time and on budget, schedules the engineers’ project hours, and takes the churn of running jobs off you.'},
  tm:{t:'Technical Manager',short:'Technical manager',sal:[3900,5400],col:'--r-eng',blurb:'Runs the engineering team day to day: mentoring, standards and escalations. Fewer mistakes on second line, faster fixes, happier engineers. (Technology strategy sits with a CTO, later.)'}
});
ROLE_ORDER.push('pm','tm');
const hasPM=()=>hasRole('pm');
const hasTM=()=>hasRole('tm');
const _resolveDeal_zz=resolveDeal;
resolveDeal=function(d){const n=S.projects.length;_resolveDeal_zz(d);
  if(d&&d.kind==='project'&&hasPM()&&S.projects.length>n){const pj=S.projects[S.projects.length-1];pj.actual=pj.est*(1+(pj.actual/pj.est-1)*0.5);}};
function tmReopenCut(){return hasTM()?0.5:0;}
const _speedOf_zz=speedOf;speedOf=function(st){return _speedOf_zz(st)*(hasTM()&&st.role==='eng'?1.06:1);};

/* ============ business software: an app store with contracts, ratings and ecosystems ============ */
/* The rest of the business runs on software too. You browse a catalogue, open a
   product's page like an app store listing (copy, rating breakdown, reviews),
   and sign up. Nobody's marketing admits weak security; ratings tell you how
   much people like a tool, not how safe it is. Products carry a minimum term
   (a buyout to leave early). Some vendors are "families" that span several
   categories: run two or more and the whole family is discounted, but you're
   then knitted into their ecosystem and unpicking it costs. */
const TEAMTOOLS={
  crm:{t:'CRM',team:'Sales & account managers',d:'Pipeline, contacts and renewals in one place.',benefit:'more leads and better-kept clients'},
  portal:{t:'Client portal & reporting',team:'Service delivery',d:'Self-service, live reports and review packs.',benefit:'happier, better-informed clients'},
  billing:{t:'Billing & finance',team:'Billing',d:'Invoicing, collections and the books.',benefit:'fewer billing errors, less admin'},
  bi:{t:'Reporting & BI',team:'You and the leadership',d:'Dashboards over the whole business.',benefit:'sharper decisions'},
  devtools:{t:'DevOps toolchain',team:'DevOps',d:'Source control, pipelines and cloud.',benefit:'faster, safer builds',needs:()=>typeof devTeam==='function'&&devTeam()>0}
};
const TT_ORDER=['crm','portal','billing','bi','devtools'];
const TT_BASE={crm:260,portal:220,billing:300,bi:180,devtools:420};
/* vendor families that span categories: own >=2 and the whole family is discounted */
const FAM={
  vantage:{name:'Vantage Systems',disc:0.12,line:'The all-in enterprise suite. Consolidate and save across the range, but once you’re in, moving off means unpicking the lot.'},
  northstar:{name:'Northstar',disc:0.10,line:'One mid-market vendor across sales, service and reporting. Genuinely good value as a bundle, and comfortable enough that you stop shopping around.'}
};
/* Each product: mult (× base), term (months, 1=rolling), sec (0..1, hidden),
   rat/rev (visible), certd (audit certs), fam?, long (advert copy), reviews. */
const TT_SHOP={
  crm:[
    {id:'crm_quick',name:'QuickContact',vendor:'QuickContact Ltd',mult:0.3,term:1,sec:0.25,rat:4.6,rev:3300,certd:false,blurb:'Start selling in five minutes. No setup, no contract, no fuss.',long:'The CRM that gets out of your way. No consultants, no six-week rollout, no contract. Import your contacts, connect your inbox and you’re selling by lunchtime. Loved by thousands of small businesses who just want to get on with it.',reviews:[{s:5,by:'A happy founder',t:'Cheap as chips and we were up and running the same morning. What’s not to love?'},{s:5,by:'Sales lead, 12-seat MSP',t:'Does everything we need without the enterprise faff.'},{s:2,by:'Cautious IT buyer',t:'Fast to set up, but the security and admin controls are thin. Fine for a shop, nervous about it for an MSP.'}]},
    {id:'crm_ledger',name:'LedgerLine',vendor:'LedgerLine',mult:0.5,term:12,sec:0.62,rat:4.4,rev:2100,certd:true,blurb:'Everything a growing MSP needs, without the enterprise price tag.',long:'Built for firms that have outgrown a spreadsheet but aren’t ready to remortgage for a CRM. Proper pipelines, renewal tracking and role-based access, all certified and audit-friendly, at a price that still makes sense.',reviews:[{s:5,by:'Ops manager',t:'Does 90% of what the big names do for a third of the cost. Our hidden gem.'},{s:4,by:'Account manager',t:'Not the flashiest, but solid and it passed our client’s security questionnaire without drama.'}]},
    {id:'crm_north',name:'Northstar CRM',vendor:'Northstar',mult:0.75,term:12,sec:0.72,fam:'northstar',rat:4.3,rev:3100,certd:true,blurb:'The sales hub of the Northstar suite. Better with the rest of the family.',long:'A capable, well-supported CRM that clicks neatly into Northstar’s portal and reporting tools. On its own it’s a strong mid-market choice; alongside its siblings it shares data cleanly and the whole suite gets cheaper.',reviews:[{s:5,by:'MSP director',t:'We run Northstar across sales and service now. One login, one bill, and a proper discount.'},{s:4,by:'Service delivery lead',t:'Good product. Just be aware that once you’re on two of their tools, leaving any of them stings.'}]},
    {id:'crm_pipe',name:'Pipeline Pro',vendor:'Pipeline Pro',mult:1.0,term:12,sec:0.78,rat:4.2,rev:5400,certd:true,blurb:'The dependable choice. Powerful pipelines and thousands of integrations.',long:'The CRM most people end up on. Deep pipeline management, a huge integration marketplace, and a support team that actually answers. Not the cheapest and not the most exciting, but nobody ever got fired for choosing it.',reviews:[{s:4,by:'Head of sales',t:'Solid. Not exciting, but it never lets us down and it connects to everything.'},{s:4,by:'RevOps',t:'Configurable to a fault. Give it a week and it does exactly what you want.'}]},
    {id:'crm_vantage',name:'Vantage360',vendor:'Vantage Systems',mult:1.8,term:24,sec:0.95,fam:'vantage',rat:3.8,rev:760,certd:true,blurb:'Enterprise-grade CRM trusted by the Fortune 500. SOC 2 and ISO 27001.',long:'The customer platform for organisations that take governance seriously. Bank-grade security, full certification, and one throat to choke across your whole Vantage estate. Powerful and safe; nobody would ever call it nimble.',reviews:[{s:5,by:'CISO',t:'Rock solid and audit-ready. The security team finally stopped worrying.'},{s:2,by:'Frustrated AM',t:'Interface feels like 2009 and support tickets take days. Secure, sure, but painful to live in.'}]},
    {id:'crm_spark',name:'SparkCRM',vendor:'Spark Software',mult:0.45,term:6,sec:0.5,rat:4.1,rev:1500,certd:false,blurb:'A bright, cheap CRM from a scrappy young vendor.',long:'A fresh, good-looking CRM from a fast-moving startup. Keenly priced, quick to improve, and a joy to use. Just remember it’s a young company still finding its feet, and young companies don’t always make it.',reviews:[{s:5,by:'Early adopter',t:'Lovely to use and the team ship new features weekly.'},{s:3,by:'Wary buyer',t:'Great value, but they’re tiny. I’d keep an export of my data handy.'}]}
  ],
  portal:[
    {id:'por_glass',name:'GlassDesk',vendor:'GlassDesk',mult:0.35,term:1,sec:0.3,rat:4.7,rev:1900,certd:false,blurb:'Beautiful client portals in minutes. Your clients will love it.',long:'Stunning, on-brand client portals with almost no effort. Live reports, ticket views and review packs that make you look far bigger than you are. Cancel any time. Your clients will assume you spent a fortune.',reviews:[{s:5,by:'MSP owner',t:'Gorgeous and cheap. Clients keep complimenting the reports.'},{s:2,by:'Security-minded MD',t:'Looks the part, but I couldn’t get a straight answer about how client data is stored.'}]},
    {id:'por_clear',name:'ClearView',vendor:'ClearView MSP',mult:0.55,term:12,sec:0.6,rat:4.3,rev:1400,certd:true,blurb:'Built by MSPs, for MSPs. Live dashboards and review packs out of the box.',long:'Made by people who’ve run a service desk. Sensible defaults, live SLA dashboards and quarterly-review packs that write themselves, all certified and reasonably priced. Underrated and quietly excellent.',reviews:[{s:5,by:'Service manager',t:'Cheaper than the big platforms and does exactly what we need.'},{s:4,by:'vCIO',t:'The review packs alone justify it. Clients take us more seriously.'}]},
    {id:'por_north',name:'Northstar Portal',vendor:'Northstar',mult:0.8,term:12,sec:0.72,fam:'northstar',rat:4.2,rev:1700,certd:true,blurb:'Service delivery’s window into the Northstar suite.',long:'A polished client portal that shares data with Northstar’s CRM and reporting out of the box. Strong on its own, seamless as part of the family, and cheaper the more of the suite you run.',reviews:[{s:4,by:'Delivery lead',t:'Slots straight into our Northstar stack. No integration project needed.'},{s:4,by:'Ops',t:'Comfortable and capable. We’ve rather stopped looking elsewhere, which I suspect is the point.'}]},
    {id:'por_beam',name:'Beam Portal',vendor:'Beam',mult:1.0,term:12,sec:0.8,rat:4.1,rev:3600,certd:true,blurb:'The industry standard for client self-service and reporting.',long:'The portal you see at most established MSPs. Deep, configurable and thoroughly certified. Setup takes a little patience, but once it’s in it runs for years without a second thought.',reviews:[{s:4,by:'IT manager',t:'Reliable workhorse. Setup took a while but it just works now.'},{s:4,by:'CSM',t:'Does everything. The admin console is a bit much, mind.'}]},
    {id:'por_atlas',name:'Atlas Experience Cloud',vendor:'Atlas',mult:1.8,term:24,sec:0.95,rat:3.9,rev:520,certd:true,blurb:'Enterprise client-experience platform. Fully certified, white-glove onboarding.',long:'The client-experience platform for firms that treat the portal as a product. Fully certified, endlessly customisable, with a white-glove onboarding team. Superb, if you can stomach the price and the project.',reviews:[{s:5,by:'Enterprise architect',t:'Extremely secure and the auditors love it.'},{s:2,by:'SMB owner',t:'Wonderful, and wildly over-specced for us. We paid for a Ferrari to do the school run.'}]},
    {id:'por_hub',name:'HubView',vendor:'HubView',mult:0.4,term:6,sec:0.42,rat:4.0,rev:900,certd:false,blurb:'A cheerful budget portal from a small vendor.',long:'A friendly, affordable portal that covers the basics well. Great for firms watching every pound. It’s a small operation behind it, so don’t expect enterprise certifications or a 24/7 hotline.',reviews:[{s:4,by:'Small MSP',t:'Bang for buck it’s hard to beat.'},{s:3,by:'Careful buyer',t:'Fine, but the roadmap is one developer and a lot of optimism.'}]}
  ],
  billing:[
    {id:'bil_snap',name:'SnapInvoice',vendor:'SnapInvoice',mult:0.35,term:1,sec:0.28,rat:4.5,rev:4200,certd:false,blurb:'Invoicing so simple you’ll wonder why you ever paid more.',long:'Get invoices out the door in minutes. Clean, quick and dirt cheap, with just enough automation to chase the stragglers. No contract, no training, no finance degree required.',reviews:[{s:5,by:'Solo MSP',t:'Cheap, quick, gets invoices out. Can’t fault it.'},{s:2,by:'Finance-minded owner',t:'Reconciliation is fiddly and I wouldn’t trust it with real audit trails.'}]},
    {id:'bil_tally',name:'TallyBooks',vendor:'TallyBooks',mult:0.55,term:12,sec:0.65,rat:4.4,rev:2600,certd:true,blurb:'Proper billing and accounts for growing firms. PSA-friendly.',long:'Grown-up billing without the enterprise weight. Contract and usage billing, collections, clean reconciliation and a tidy PSA sync, all certified. The best-value serious billing tool most MSPs never think to try.',reviews:[{s:5,by:'Finance lead',t:'Best-value billing platform we’ve used, and it reconciles cleanly.'},{s:4,by:'MD',t:'Cut our debtor days noticeably once the chasing was automated.'}]},
    {id:'bil_merid',name:'Meridian Billing',vendor:'Meridian',mult:1.0,term:12,sec:0.82,rat:4.0,rev:3100,certd:true,blurb:'The finance platform MSPs grow into. Contracts, usage billing, collections.',long:'A deep, well-certified finance platform that handles everything from complex contracts to usage billing and collections. Powerful once you’ve learned it, which does take a manual and a bit of patience.',reviews:[{s:4,by:'Financial controller',t:'Does everything, once you’ve read the manual twice.'},{s:4,by:'Ops director',t:'The engine room of our billing now. Steep at first.'}]},
    {id:'bil_vantage',name:'Vantage Ledger',vendor:'Vantage Systems',mult:1.8,term:24,sec:0.94,fam:'vantage',rat:3.7,rev:480,certd:true,blurb:'The finance module of the Vantage suite. Governance-first.',long:'Enterprise finance that plugs into the rest of your Vantage estate. Immaculate audit trails, deep controls, one vendor for the lot. Heavy and dear on its own, but the suite discount makes the maths work if you’re already all-in.',reviews:[{s:5,by:'Group FD',t:'One vendor across CRM, BI and finance. Our auditors are delighted.'},{s:2,by:'Reluctant admin',t:'Capable, but we only really keep it because leaving the suite would cost more.'}]},
    {id:'bil_sterl',name:'Sterling Finance Suite',vendor:'Sterling',mult:1.9,term:24,sec:0.96,rat:3.7,rev:410,certd:true,blurb:'Bank-grade financial management. Full audit trails, fully certified.',long:'The most fortified books money can buy. Every control, every certification, every audit trail. Overkill for most MSPs, indispensable for the few who genuinely need it, and priced accordingly.',reviews:[{s:5,by:'Compliance officer',t:'Fort Knox for your books.'},{s:2,by:'Growing MSP',t:'Superb and completely over the top for us.'}]},
    {id:'bil_dash',name:'DashBill',vendor:'DashBill',mult:0.4,term:6,sec:0.45,rat:4.2,rev:1300,certd:false,blurb:'A slick, cheap billing app from a rising vendor.',long:'Modern, fast billing with a lovely interface and keen pricing. The team behind it are hungry and shipping quickly. Small vendor, no heavy certifications yet, so factor that into anything sensitive.',reviews:[{s:5,by:'Bookkeeper',t:'A joy compared to the old clunkers. And cheap.'},{s:3,by:'CFO',t:'Good product, young company. I keep our data backed up elsewhere.'}]}
  ],
  bi:[
    {id:'bi_glance',name:'Glance',vendor:'Glance Analytics',mult:0.3,term:1,sec:0.32,rat:4.6,rev:2800,certd:false,blurb:'Drag-and-drop dashboards anyone can build. Free your data today.',long:'Dashboards for everyone. Point Glance at your data, drag a few things around, and you’ve got charts the whole team can read. No analysts, no contract, no fuss. Governance and access control are, let’s say, relaxed.',reviews:[{s:5,by:'Team lead',t:'Anyone can make a chart in minutes. We love it.'},{s:2,by:'Data-savvy MD',t:'Lovely for quick views, but it happily connects to everything with barely a permission in sight.'}]},
    {id:'bi_prism',name:'Prism',vendor:'Prism BI',mult:0.5,term:12,sec:0.6,rat:4.3,rev:1200,certd:true,blurb:'Smart dashboards over your whole business, priced for real companies.',long:'Serious dashboards without a data-team budget. Clean modelling, scheduled reports and proper access control, certified and sensibly priced. Punches well above its weight, with setup help that actually helps.',reviews:[{s:5,by:'Ops manager',t:'Punches above its price, and setup support was great.'},{s:4,by:'MD',t:'We finally see the whole business in one place.'}]},
    {id:'bi_north',name:'Northstar Insight',vendor:'Northstar',mult:0.75,term:12,sec:0.72,fam:'northstar',rat:4.2,rev:1400,certd:true,blurb:'Reporting across the Northstar suite, out of the box.',long:'Dashboards that already know about your Northstar CRM and portal, so the numbers line up without a data project. Strong standalone, effortless as part of the family, cheaper as the suite grows.',reviews:[{s:4,by:'vCIO',t:'The cross-suite reporting just works. No stitching CSVs together.'},{s:4,by:'Director',t:'Good tool. We’re now firmly a Northstar shop, for better or worse.'}]},
    {id:'bi_insight',name:'InsightWorks',vendor:'InsightWorks',mult:1.0,term:12,sec:0.8,rat:4.1,rev:2400,certd:true,blurb:'The trusted analytics platform for data-driven leadership.',long:'The analytics platform serious teams standardise on. Deep modelling, governance and lineage, thoroughly certified. Powerful in the right hands; it rewards having someone who knows what they’re doing.',reviews:[{s:4,by:'Analyst',t:'Powerful once configured. Needs someone who knows their way around data.'},{s:4,by:'COO',t:'Our single source of truth now.'}]},
    {id:'bi_vantage',name:'Vantage Insight',vendor:'Vantage Systems',mult:1.7,term:24,sec:0.95,fam:'vantage',rat:3.8,rev:300,certd:true,blurb:'Governed enterprise BI, tightly woven into the Vantage estate.',long:'Enterprise BI with full governance and lineage, wired into the rest of Vantage so every number ties back to source. Best value if you already run the suite; a heavy lift and a heavy bill if you don’t.',reviews:[{s:5,by:'Data governance lead',t:'Governance nirvana. Everything traces back to source.'},{s:2,by:'Small-team owner',t:'Needs a specialist and a budget we don’t have.'}]},
    {id:'bi_summit',name:'Summit Analytics Cloud',vendor:'Summit',mult:1.8,term:24,sec:0.95,rat:3.8,rev:340,certd:true,blurb:'Enterprise BI with governance, data lineage and full certification.',long:'A top-tier analytics cloud for organisations that live and die by their numbers. Every governance feature going, fully certified, endlessly scalable. Costs a fortune and needs a specialist, and worth it for the few who need it.',reviews:[{s:5,by:'Head of data',t:'Scales to anything and the governance is superb.'},{s:2,by:'MSP owner',t:'Overkill and eye-watering for a firm our size.'}]}
  ],
  devtools:[
    {id:'dev_forge',name:'ForgeFlow',vendor:'ForgeFlow',mult:0.4,term:1,sec:0.3,rat:4.7,rev:5100,certd:false,blurb:'Ship faster. The developer-loved pipeline that just works.',long:'The pipeline developers actually enjoy. Fast, elegant, free to start, and adored by a huge community. Just don’t look too hard at the default permissions or the supply-chain controls, because there aren’t many.',reviews:[{s:5,by:'Lead dev',t:'Devs adore it. Cheap and fast.'},{s:2,by:'Security engineer',t:'Beautiful DX, worrying defaults. Tokens everywhere and no signing.'}]},
    {id:'dev_orbit',name:'Orbit CI',vendor:'Orbit',mult:0.6,term:12,sec:0.66,rat:4.4,rev:1800,certd:true,blurb:'Source control, pipelines and cloud for lean teams. Great value.',long:'A tidy, certified DevOps platform built for small teams who want to move fast without cutting corners. Source control, pipelines and cloud in one, at a fraction of the incumbents, and honestly nicer to use.',reviews:[{s:5,by:'Engineering manager',t:'Half the price of the big names and nicer to use.'},{s:4,by:'DevOps lead',t:'Sensible defaults and it passed our client’s security review.'}]},
    {id:'dev_north',name:'Northstar Deploy',vendor:'Northstar',mult:0.85,term:12,sec:0.7,fam:'northstar',rat:4.1,rev:700,certd:true,blurb:'The DevOps corner of the Northstar suite.',long:'Pipelines and deployment that share identity and reporting with the rest of Northstar. A solid, certified choice on its own, and one less vendor to manage if you’re already in the family.',reviews:[{s:4,by:'Platform lead',t:'One SSO, one bill across our whole Northstar stack.'},{s:4,by:'Dev',t:'Perfectly good. Chosen mostly because we were already Northstar.'}]},
    {id:'dev_stack',name:'StackForge Cloud',vendor:'StackForge',mult:1.0,term:12,sec:0.82,rat:4.0,rev:4300,certd:true,blurb:'The end-to-end DevOps platform teams standardise on.',long:'The DevOps platform most teams end up standardising on. Everything from source to production, well certified and battle-tested at scale. Big and occasionally clunky, but the safe default for a reason.',reviews:[{s:4,by:'CTO',t:'The safe default. Big, capable, occasionally clunky.'},{s:4,by:'SRE',t:'Runs everything we throw at it.'}]},
    {id:'dev_bast',name:'Bastion DevSecOps',vendor:'Bastion',mult:1.9,term:24,sec:0.97,rat:3.9,rev:290,certd:true,blurb:'Security-first DevOps. Signed builds, SBOMs and full compliance tooling.',long:'DevOps with security bolted through the core. Signed builds, SBOMs, policy gates and every compliance report an auditor could want. Heavy, strict and pricey, and the most defensible pipeline you can run.',reviews:[{s:5,by:'AppSec lead',t:'The most secure pipeline going. Auditors love it.'},{s:2,by:'Impatient dev',t:'Every push runs a gauntlet of checks. Safe, yes. Fast, no.'}]},
    {id:'dev_helm',name:'Helm Pipelines',vendor:'Helm',mult:0.7,term:6,sec:0.55,rat:4.1,rev:1100,certd:false,blurb:'A rising-star pipeline with a keen following.',long:'A fast-improving pipeline from a young vendor with a passionate community. Flexible, keenly priced and shipping quickly. Certifications are still catching up with the ambition, so weigh that for anything sensitive.',reviews:[{s:5,by:'Startup dev',t:'Flexible and improving weekly.'},{s:3,by:'Consultant',t:'Promising, but young. I wouldn’t bet a compliance audit on it yet.'}]}
  ]
};
function ttProdById(cat,id){return (TT_SHOP[cat]||[]).find(p=>p.id===id);}
function ttMig(){if(S._ttMig)return;S._ttMig=1;if(!S.tt)return;S.ttC=S.ttC||{};
  const map={cheap:1,std:3,prem:4};
  for(const c in S.tt){const v=S.tt[c];if(typeof v==='string'&&TT_SHOP[c]&&!ttProdById(c,v)){const p=TT_SHOP[c][map[v]!=null?map[v]:3];if(p){S.tt[c]=p.id;S.ttC[c]={since:S.day,term:p.term,price:0};}else delete S.tt[c];}}}
function ttProd(cat){ttMig();const id=(S.tt||{})[cat];return id?ttProdById(cat,id):null;}
function ttOn(cat){return !!ttProd(cat);}
function ttSec(cat){const p=ttProd(cat);return p?p.sec:0;}
function ttSeats(){return Math.max(1,typeof supportSeats==='function'?supportSeats():0);}
/* ecosystem: own >=2 of a family and the whole family is discounted */
function famOwned(fam){let n=0;for(const c in TEAMTOOLS){const p=ttProd(c);if(p&&p.fam===fam)n++;}return n;}
function ttDisc(cat,id){const p=ttProdById(cat,id);if(!p||!p.fam)return 0;return (typeof famDiscIfCat==='function')?famDiscIfCat(p.fam,cat):0;}
function ttList(cat,id){const p=id?ttProdById(cat,id):ttProd(cat);if(!p)return 0;return Math.round(TT_BASE[cat]*p.mult*(1+ttSeats()/1500));}
function ttPrice(cat,id){const p=id?ttProdById(cat,id):ttProd(cat);if(!p)return 0;return Math.round(ttList(cat,p.id)*(1-ttDisc(cat,p.id)));}
function ttCost(cat){return ttOn(cat)?ttPrice(cat):0;}
function ttMonthly(){let t=0;for(const c in TEAMTOOLS)t+=ttCost(c);return t;}
function ttLeft(cat){const c=(S.ttC||{})[cat];if(!c)return 0;return Math.max(0,Math.ceil((c.since+c.term*DPM-S.day)/DPM));}
function ttBuyout(cat){const left=ttLeft(cat);if(left<=0)return 0;return Math.round(ttCost(cat)*left*0.5/10)*10;}
function surface(){let s=0;
  for(const k of VEND_ORDER)if(vendOn(k))s+=S.vend[k].inhouse?0.5:1;
  for(const c in TEAMTOOLS)if(ttOn(c))s+=0.5+(1-ttSec(c));
  return Math.round(s*10)/10;}
function toolCertGap(){let n=0;for(const c in TEAMTOOLS){const p=ttProd(c);if(p&&p.certd===false)n++;}return n;}

ACT_EXT.ttShop=cat=>{if(!TEAMTOOLS[cat])return;ui.modal={type:'ttShop',cat};};
ACT_EXT.ttView=v=>{const i=v.indexOf(':');const cat=v.slice(0,i),id=v.slice(i+1);if(ttProdById(cat,id))ui.modal={type:'ttView',cat,id};};
ACT_EXT.ttBuy=v=>{const i=v.indexOf(':');const cat=v.slice(0,i),id=v.slice(i+1);const p=ttProdById(cat,id);if(!p)return;
  S.tt=S.tt||{};S.ttC=S.ttC||{};const cur=S.tt[cat];
  if(cur===id){ui.modal={type:'ttShop',cat};return;}
  if(cur){const bo=ttBuyout(cat);const oldN=(ttProd(cat)||{}).name||'your old tool';
    if(bo>0&&S.co.cash-bo<-OD_LIMIT){if(typeof toast==='function')toast('Not enough cash to buy out the '+oldN+' contract ('+gbp(bo)+').');return;}
    if(bo>0){spend(bo);log('Bought out of your '+oldN+' contract for '+gbp(bo)+' and moved to '+p.name+'.','event');}
    else log('Switched your '+TEAMTOOLS[cat].t.toLowerCase()+' to '+p.name+'.','event');}
  S.tt[cat]=id;const price=ttPrice(cat);S.ttC[cat]={since:S.day,term:p.term,price};
  if(!cur)log('You signed up for '+p.name+' ('+TEAMTOOLS[cat].t.toLowerCase()+'), '+gbp(price)+'/mo'+(p.term>1?' on a '+p.term+'-month contract':' rolling monthly')+'.','event');
  ui.modal={type:'ttShop',cat};};
ACT_EXT.ttDropT=cat=>{if(!ttOn(cat))return;const bo=ttBuyout(cat);const nm=ttProd(cat).name;
  if(bo>0&&S.co.cash-bo<-OD_LIMIT){if(typeof toast==='function')toast('Leaving the '+nm+' contract early costs '+gbp(bo)+'.');return;}
  if(bo>0)spend(bo);delete S.tt[cat];if(S.ttC)delete S.ttC[cat];
  log('Dropped '+nm+(bo>0?' (buyout '+gbp(bo)+')':'')+'.','info');ui.modal={type:'ttShop',cat};};

function stars(r,gold){const f=Math.round(r);return '<span style="color:'+(gold||'#e8a13a')+';letter-spacing:1px">'+'★'.repeat(f)+'<span style="color:var(--line)">'+'★'.repeat(5-f)+'</span></span>';}
function ratDist(r){const c=Math.max(1,Math.min(5,r));const w=[0,0,0,0,0];for(let i=1;i<=5;i++)w[i-1]=Math.exp(-Math.abs(i-c)*1.1)*(i>=Math.floor(c)?1:0.55);const s=w.reduce((a,b)=>a+b,0)||1;return w.map(x=>x/s);}

MODAL_EXT.ttShop=(M,x)=>{const cat=M.cat;const T=TEAMTOOLS[cat];const cur=(S.tt||{})[cat];const list=TT_SHOP[cat]||[];const bo=cur?ttBuyout(cat):0;
  let h='<div class="dialog wide">'+x+'<p class="kick">'+esc(T.team)+'</p><h2>'+esc(T.t)+'</h2><p class="lede">'+esc(T.d)+' Tap any product to read its listing. Security isn’t on the label, you only find out how good it was when something goes wrong.</p><ul class="list">';
  h+=list.map(p=>{const owned=cur===p.id;const price=ttPrice(cat,p.id);const disc=ttDisc(cat,p.id);
    return '<li class="item" style="cursor:pointer" data-act="ttView" data-v="'+cat+':'+p.id+'"><span><b>'+esc(p.name)+'</b> <span class="mut">'+esc(p.vendor)+(p.fam?' · '+esc(FAM[p.fam].name)+' suite':'')+'</span>'+(owned?' <span class="chip pos">in use</span>':'')+(p.certd===false?' <span class="wrn" style="font-size:.72rem">no certs</span>':'')+'</span><span class="r">'+(disc?'<span class="mut" style="text-decoration:line-through;font-size:.75rem">'+gbp(ttList(cat,p.id))+'</span> ':'')+gbp(price)+'/mo</span><span class="sub">'+stars(p.rat)+' <span class="mut" style="font-size:.76rem">'+p.rat.toFixed(1)+' · '+p.rev.toLocaleString('en-GB')+' reviews · '+(p.term>1?p.term+'-mo term':'rolling')+'</span> — '+esc(p.blurb)+'</span></li>';}).join('');
  h+='</ul>';
  if(cur)h+='<div class="foot2"><span class="grow mut" style="font-size:.8rem">'+(ttLeft(cat)>0?ttLeft(cat)+' month'+(ttLeft(cat)===1?'':'s')+' left on your contract'+(bo>0?' · '+gbp(bo)+' to leave early':''):'Out of contract, free to switch or drop')+'</span><button class="btn sm danger" data-act="ttDropT" data-v="'+cat+'">Drop'+(bo>0?' · '+gbp(bo):'')+'</button></div>';
  return h+'</div>';};

MODAL_EXT.ttView=(M,x)=>{const cat=M.cat,p=ttProdById(cat,M.id);if(!p)return null;const T=TEAMTOOLS[cat];const cur=(S.tt||{})[cat];const owned=cur===p.id;
  const price=ttPrice(cat,p.id);const disc=ttDisc(cat,p.id);const bo=cur&&!owned?ttBuyout(cat):0;
  const back='<button class="btn sm" data-act="ttShop" data-v="'+cat+'">‹ '+esc(T.t)+'</button>';
  let h='<div class="dialog wide">'+x+'<div style="margin-bottom:8px">'+back+'</div>'+
    '<div class="row" style="justify-content:space-between;align-items:flex-start;gap:12px"><div><h2 style="margin:0">'+esc(p.name)+'</h2><div class="mut">'+esc(p.vendor)+(p.fam?' · part of the '+esc(FAM[p.fam].name)+' suite':'')+'</div><div style="margin-top:4px">'+stars(p.rat)+' <b>'+p.rat.toFixed(1)+'</b> <span class="mut" style="font-size:.8rem">'+p.rev.toLocaleString('en-GB')+' reviews</span></div></div>'+
    '<div style="text-align:right"><div style="font-size:1.3rem;font-weight:700">'+gbp(price)+'</div><div class="mut" style="font-size:.74rem">a month'+(disc?' · suite −'+Math.round(disc*100)+'%':'')+'</div><div class="mut" style="font-size:.74rem">'+(p.term>1?p.term+'-month term':'rolling, cancel anytime')+'</div></div></div>';
  h+='<p style="margin:12px 0 6px">'+esc(p.long)+'</p>';
  if(p.fam&&FAM[p.fam])h+='<p class="note">'+esc(FAM[p.fam].line)+(disc?' <b class="pos">You’re getting '+Math.round(disc*100)+'% off across the suite right now.</b>':'')+'</p>';
  // rating breakdown
  const dist=ratDist(p.rat);
  h+='<div class="sec" style="margin-top:10px"><h3 style="font-size:1rem">Ratings</h3><div style="display:grid;grid-template-columns:auto 1fr auto;gap:3px 8px;align-items:center;font-size:.8rem">';
  for(let i=5;i>=1;i--)h+='<span class="mut">'+i+'★</span><span style="background:var(--surface2);border-radius:4px;height:8px;overflow:hidden"><span style="display:block;height:100%;width:'+Math.round(dist[i-1]*100)+'%;background:#e8a13a"></span></span><span class="mut">'+Math.round(dist[i-1]*100)+'%</span>';
  h+='</div></div>';
  // reviews
  h+='<div class="sec"><h3 style="font-size:1rem">What people say</h3><ul class="list">'+(p.reviews||[]).map(rv=>'<li class="item" style="grid-template-columns:1fr"><span>'+stars(rv.s)+' <b style="font-size:.85rem">'+esc(rv.by)+'</b></span><span class="sub" style="font-style:italic">“'+esc(rv.t)+'”</span></li>').join('')+'</ul></div>';
  // action
  h+='<div class="foot2"><span class="grow mut" style="font-size:.78rem">'+(owned?'You’re on this now.'+(ttLeft(cat)>0?' '+ttLeft(cat)+' month'+(ttLeft(cat)===1?'':'s')+' left on contract.':' Out of contract.'):(cur?'You currently run '+esc(ttProd(cat).name)+'.':'Nothing chosen yet.'))+'</span>'+
    (owned?'<button class="btn sm danger" data-act="ttDropT" data-v="'+cat+'">Drop'+(ttBuyout(cat)>0?' · '+gbp(ttBuyout(cat)):'')+'</button>':'<button class="btn primary" data-act="ttBuy" data-v="'+cat+':'+p.id+'">'+(cur?'Switch to '+esc(p.name)+(bo>0?' · buyout '+gbp(bo):''):'Choose · '+gbp(price)+'/mo')+'</button>')+'</div>';
  return h+'</div>';};

/* monthly tool risks */
function toolsMonthly(){
  for(const c in TEAMTOOLS){const p=ttProd(c);if(!p)continue;const insec=1-p.sec;
    if(Math.random()<insec*0.02*(S.diff==='hard'?1.4:1)){toolLeak(c);continue;}
    if(Math.random()<insec*0.012){toolVendorBust(c);continue;}
    if(Math.random()<insec*0.03){toolOutage(c);}
  }
}
function toolLeak(c){const T=TEAMTOOLS[c];
  if(regulated&&regulated()){S.hq.push({id:'toolLeak',ctx:{c}});}
  else{const n=Math.max(1,Math.round(active().length*0.05));for(const cl of active().slice().sort(()=>Math.random()-0.5).slice(0,n))cl.sat=Math.max(0,cl.sat-rnd(4,10));S.co.rep=Math.max(5,S.co.rep-rnd(2,5));
    log('A data leak through your '+T.t.toLowerCase()+' exposed some client details. Cheap software, real cost.','bad');x19('toolLeak');}
}
HUMAN.toolLeak={w:0,ok:()=>false,make:x=>{const T=TEAMTOOLS[x.c];const fine=Math.round(clamp(mrr()*12*0.02,10000,200000)*(insCover&&insCover()?0.3:1)/1000)*1000;const safe=(TT_SHOP[x.c]||[]).slice().sort((a,b)=>b.sec-a.sec)[0];
  return {kicker:'Data protection',title:'Your '+T.t.toLowerCase()+' has leaked client data',body:'The '+T.t.toLowerCase()+' you run was breached and client data is out. As a regulated MSP this is reportable.',
    choices:[{label:'Report it and move to a secure product',note:'Fine of about '+gbp(fine)+', and you switch to '+(safe?safe.name:'a certified tier')+'.',go(){spend(fine);if(safe){S.tt[x.c]=safe.id;S.ttC=S.ttC||{};S.ttC[x.c]={since:S.day,term:safe.term,price:ttPrice(x.c,safe.id)};}S.co.rep=Math.max(5,S.co.rep-4);log('You reported the '+T.t.toLowerCase()+' leak ('+gbp(fine)+') and moved to '+(safe?safe.name:'a secure product')+'.','bad');}},
      {label:'Keep it quiet',note:'Cheaper now. Far worse if it surfaces.',go(){if(typeof addHeat==='function')addHeat(15,'Hid a data leak',1);S.co.rep=Math.max(5,S.co.rep-2);log('You’re keeping the '+T.t.toLowerCase()+' leak quiet.','bad');}}]};}};
function toolVendorBust(c){const T=TEAMTOOLS[c];const cost=Math.round(ttCost(c)*3/100)*100;spend(cost);const gone=ttProd(c);
  log((gone?gone.name:T.t)+' '+pick(['has gone under','was acquired and shut down','folded overnight'])+'. Migrating to a replacement cost '+gbp(cost)+' and some disruption. Pick a new '+T.t.toLowerCase()+'.','event');
  delete S.tt[c];if(S.ttC)delete S.ttC[c];   // you must re-choose from the catalogue
  if(hasRole('eng'))bigTickets(null,3,4,2,'Internal: migrating off '+(gone?gone.name:T.t));x19('toolBust');}
function toolOutage(c){const T=TEAMTOOLS[c];S.tt2=S.tt2||{};S.tt2[c]=S.day+ri(1,4);
  if(c==='portal'||c==='billing'){for(const cl of active().slice().sort(()=>Math.random()-0.5).slice(0,Math.ceil(active().length*0.15)))cl.sat=Math.max(0,cl.sat-rnd(2,5));}
  const nm=(ttProd(c)||{}).name||T.t;log(nm+' went down for a bit'+((c==='portal'||c==='billing')?', and clients noticed':'')+'. Cheaper tools wobble more.','bad');x19('toolOutage');}
function ttDown(c){return (S.tt2&&S.tt2[c]||0)>S.day;}

const _breachOdds_zz=(typeof breachOdds==='function')?breachOdds:null;
if(_breachOdds_zz){breachOdds=function(){const seats=supportSeats();if(seats<400)return 0;return 0.012*Math.min(4,seats/1000)*(1+0.05*surface())*(1-secDef())*(S.diff==='hard'?1.4:S.diff==='easy'?0.6:1);};}
const _procScore_zz=(typeof procScore==='function')?procScore:null;
if(_procScore_zz){procScore=function(avg){return Math.max(0.5,_procScore_zz(avg)-toolCertGap()*0.08);};}

/* ============ helpdesk products: same app-store listing, existing mechanics ============ */
/* Presentation only. Choosing a resold product still runs through switchAsk /
   switchStandard, so onboarding, client-kit alignment and staff learning are
   untouched. */
const PROD_ADV={
  overwatch:{rat:4.3,rev:2400,long:'The dependable all-rounder that most managed desks run. Broad device coverage, reliable patching and automation that quietly takes a quarter of the tickets off your desk.',reviews:[{s:5,by:'Service desk lead',t:'Patching just works and the ticket count dropped noticeably.'},{s:4,by:'Engineer',t:'Not glamorous, but rock solid.'}]},
  pulsar:{rat:3.9,rev:1600,long:'A budget RMM for firms watching every pound. Covers the basics and the price is right, but its patching misses more, so expect a few more tickets to clean up after it.',reviews:[{s:4,by:'Small MSP owner',t:'Cheap and cheerful. Does the job.'},{s:3,by:'Tech',t:'Patch reports can be optimistic. We double-check.'}]},
  meridian:{rat:4.5,rev:1900,long:'Premium automation for desks that want to squeeze out every avoidable ticket. Sharper patching, deeper scripting and clean reporting, at a price to match.',reviews:[{s:5,by:'Operations manager',t:'Cut our reactive tickets by nearly a third. Pays for itself.'},{s:4,by:'Senior engineer',t:'The scripting is superb once you invest the time.'}]},
  vaultline:{rat:4.4,rev:2100,long:'Dependable Microsoft 365 and server backup that restores when you need it to. The safe choice, well proven across thousands of endpoints.',reviews:[{s:5,by:'MSP director',t:'Restores have never let us down, which is the whole point.'},{s:4,by:'Engineer',t:'Boring in the best way.'}]},
  coldvault:{rat:3.7,rev:1300,long:'Cheap, roomy storage for the cost-conscious. Great on price per terabyte; restores are fiddlier and generate more support work, so factor that in.',reviews:[{s:4,by:'Budget-minded owner',t:'Storage is dirt cheap.'},{s:3,by:'Support analyst',t:'Restores are a faff. More tickets than I’d like.'}]},
  arksafe:{rat:4.5,rev:1500,long:'Premium backup with slick self-service restores that clients can run themselves. Fewer tickets, happier customers, higher bill.',reviews:[{s:5,by:'Service manager',t:'Self-service restores cut our backup tickets right down.'},{s:4,by:'vCIO',t:'Clients love being able to help themselves.'}]},
  sentrix:{rat:4.3,rev:2600,long:'Endpoint detection with a 24/7 SOC behind it. Serious protection for a serious world, and someone watching the alerts at 3am so you don’t have to.',reviews:[{s:5,by:'Security lead',t:'The SOC caught something we’d have missed. Worth every penny.'},{s:4,by:'Engineer',t:'Solid detections, sensible tuning.'}]},
  bastion:{rat:3.8,rev:1400,long:'Budget EDR that gets protection onto endpoints without the premium bill. Noisier, with more alerts to triage, so it costs you in time what it saves in licence.',reviews:[{s:4,by:'Small MSP',t:'Affordable coverage. Does detect things.'},{s:3,by:'Analyst',t:'The alert noise is real. Budget time for triage.'}]},
  halcyon:{rat:4.6,rev:1100,long:'Top-tier EDR: quiet, sharp and precise. Very few false positives, very high catch rate, and a price that reflects both.',reviews:[{s:5,by:'CISO',t:'Quiet and deadly accurate. The best we’ve run.'},{s:4,by:'SecOps',t:'Superb, if you can justify the cost.'}]},
  northlink:{rat:4.2,rev:900,long:'Lines, SIP trunks and leased circuits from a dependable wholesale carrier. The steady backbone for your telephony and connectivity.',reviews:[{s:4,by:'Comms engineer',t:'Provisioning is smooth and support knows their stuff.'},{s:4,by:'Owner',t:'Reliable. Rarely think about it, which is ideal.'}]},
  voxline:{rat:3.9,rev:800,long:'A keener-priced wholesale carrier for voice and circuits. A bit cheaper on the bill, a bit flakier on the line, so weigh the saving against the odd wobble.',reviews:[{s:4,by:'MSP owner',t:'Margins are better than the incumbents.'},{s:3,by:'Engineer',t:'Occasional flakiness. Support gets there in the end.'}]}
};
function prodRat(p){return (PROD_ADV[p]||{}).rat||4.0;}
ACT_EXT.prodView=v=>{if(PRODS[v]&&PROD_ADV[v])ui.modal={type:'prodView',p:v};};
MODAL_EXT.prodView=(M,x)=>{const p=M.p,P=PRODS[p];if(!P)return null;const A=PROD_ADV[p]||{};const cat=P.cat;const cur=(typeof stdProd==='function')?stdProd(cat):null;const owned=cur===p;const CT=CATS[cat];
  const price=cat==='voice'?'£'+P.costT+'/seat wholesale':'£'+(P.base||0)+'/mo base'+(P.cost?' · £'+P.cost+'/user':'')+(P.perSeat?' · £'+P.perSeat+'/user':'');
  const back='<button class="btn sm" data-act="close">‹ Back to stack</button>';
  let h='<div class="dialog wide">'+x+'<div style="margin-bottom:8px">'+back+'</div>'+
    '<div class="row" style="justify-content:space-between;align-items:flex-start;gap:12px"><div><h2 style="margin:0">'+esc(P.name)+'</h2><div class="mut">'+CT.t+' · a product you resell'+(owned?' · your standard':'')+'</div><div style="margin-top:4px">'+stars(A.rat||4)+' <b>'+(A.rat||4).toFixed(1)+'</b> <span class="mut" style="font-size:.8rem">'+((A.rev||0).toLocaleString('en-GB'))+' reviews</span></div></div><div style="text-align:right"><div class="mut" style="font-size:.8rem">'+price+'</div></div></div>';
  h+='<p style="margin:12px 0 6px">'+esc(A.long||P.desc||'')+'</p>';
  h+='<p class="note">Switching your standard is a real move: a £500 fee, a migration for every client on it, and the whole team starts learning it again. That mechanic is unchanged, this is just where you browse.</p>';
  const dist=ratDist(A.rat||4);
  h+='<div class="sec" style="margin-top:10px"><h3 style="font-size:1rem">Ratings</h3><div style="display:grid;grid-template-columns:auto 1fr auto;gap:3px 8px;align-items:center;font-size:.8rem">';
  for(let i=5;i>=1;i--)h+='<span class="mut">'+i+'★</span><span style="background:var(--surface2);border-radius:4px;height:8px;overflow:hidden"><span style="display:block;height:100%;width:'+Math.round(dist[i-1]*100)+'%;background:#e8a13a"></span></span><span class="mut">'+Math.round(dist[i-1]*100)+'%</span>';
  h+='</div></div>';
  h+='<div class="sec"><h3 style="font-size:1rem">What people say</h3><ul class="list">'+(A.reviews||[]).map(rv=>'<li class="item" style="grid-template-columns:1fr"><span>'+stars(rv.s)+' <b style="font-size:.85rem">'+esc(rv.by)+'</b></span><span class="sub" style="font-style:italic">“'+esc(rv.t)+'”</span></li>').join('')+'</ul></div>';
  const locked=CT.vend&&S.vend[CT.vend]&&S.vend[CT.vend].lock>S.day;
  h+='<div class="foot2"><span class="grow mut" style="font-size:.78rem">'+(owned?'This is your current standard.':locked?'Locked into a contract for now.':'Make this your standard across the desk.')+'</span>'+
    (owned?'':'<button class="btn primary" data-act="switchAsk" data-v="'+p+'" '+(locked?'disabled':'')+'>Make it my standard</button>')+'</div>';
  return h+'</div>';};

/* ============ the one centralised stack view ============ */
function teamToolsSec(){ttMig();
  let h='<div class="sec"><h3>Business software</h3><p class="lede">Sales, service delivery, billing, leadership and DevOps all run on software too. Browse each catalogue like an app store. Every tool is another way in for an attacker, cheaper ones are the weakest link, and uncertified ones count against your audits.</p><ul class="list">';
  for(const c of TT_ORDER){const T=TEAMTOOLS[c];if(T.needs&&!T.needs()&&!ttOn(c))continue;const p=ttProd(c);const disc=p?ttDisc(c,p.id):0;
    h+='<li class="item"><span><b>'+(p?esc(p.name):T.t)+'</b> <span class="mut">'+T.team+(p&&p.fam?' · '+esc(FAM[p.fam].name):'')+(p&&p.certd===false?' · <span class="wrn">no certs</span>':'')+'</span>'+(ttDown(c)?' <span class="neg">down</span>':'')+'</span><span class="r">'+(p?(disc?'<span class="pos" style="font-size:.72rem">−'+Math.round(disc*100)+'% </span>':'')+gbp(ttCost(c))+'/mo':'–')+'</span><span class="sub">'+
      (p?esc(T.t)+' · '+stars(p.rat)+(ttLeft(c)>0?' · <span class="mut">'+ttLeft(c)+'mo left</span>':''):esc(T.d)+' Gives you '+esc(T.benefit)+'.')+
      '<span class="row" style="margin-top:6px">'+(p?'<button class="btn sm" data-act="ttShop" data-v="'+c+'">View catalogue</button>':'<button class="btn sm primary" data-act="ttShop" data-v="'+c+'">Choose a tool</button>')+'</span></span></li>';}
  h+='</ul><p class="mut" style="font-size:.82rem">Attack surface across your whole stack: <b>'+surface()+'</b>. '+(toolCertGap()?'<span class="neg">'+toolCertGap()+' uncertified tool'+(toolCertGap()>1?'s are':' is')+' hurting your audits.</span>':'Your business software is certified well enough for audits.')+'</p></div>';
  return h;}
/* paneStack (e.js) now calls coreStackSec(), which folds in business software
   and the client-kit board, so the whole stack is one interface. */

const _peopleDaily_zz=peopleDaily;
peopleDaily=function(W){_peopleDaily_zz(W);
  const m=ttMonthly();if(m)spend(m/DPM);
  if(S.day%DPM===3)toolsMonthly();
};

/* ============ the core helpdesk stack, as the same app store ============ */
/* PSA and Documentation now have budget/standard/premium tiers, so cheaping out
   or paying up is a real choice. RMM/backup/EDR/telephony keep their existing
   resold-product mechanics (switching still triggers migrations and relearning),
   just presented through the same catalogue and listing pages. */
const RESOLD_CAT={rmm:'rmm',backup:'backup',edr:'edr',carrier:'voice'};
const INTOOLS={
  psa:[
    {id:'psa_tick',name:'Tickr',vendor:'Tickr',base:22,perStaff:16,spd:0.07,proc:0.15,rat:4.1,rev:1700,certd:false,blurb:'Cheap, cheerful ticketing. The desk works about 7% faster.',long:'A no-frills ticketing tool for firms watching the pennies. Queues, a basic SLA clock and not much else, at a price that’s hard to argue with. The desk speeds up, just not as much as the grown-up tools, and the reporting an auditor wants isn’t really there.',reviews:[{s:5,by:'Solo MSP',t:'For the money it’s a steal. Tickets don’t fall through the cracks any more.'},{s:3,by:'Team lead',t:'Fine until you grow. The reporting and automation are thin.'}]},
    {id:'psa_std',name:'Ticketwise',vendor:'Ticketwise',base:45,perStaff:29,spd:0.12,proc:0.25,rat:4.3,rev:2600,certd:true,blurb:'Proper queues and SLA clocks. The desk works about 12% faster.',long:'The dependable PSA most managed desks run. Solid queues, real SLA management, sensible automation and the audit-friendly reporting that keeps compliance happy. Not the cheapest, and worth it once you’ve a few people on the desk.',reviews:[{s:5,by:'Service desk manager',t:'The SLA clocks alone paid for it. The team is noticeably quicker.'},{s:4,by:'Ops lead',t:'Does everything we need and passes our clients’ audits.'}]},
    {id:'psa_zen',name:'Zenith PSA',vendor:'Zenith',base:70,perStaff:44,spd:0.16,proc:0.34,rat:4.5,rev:1200,certd:true,blurb:'Premium PSA with deep automation. The desk works about 16% faster.',long:'The high end of ticketing. Rich automation, tight integrations, dashboards for days and best-in-class SLA handling. The desk flies and audits are a breeze, if you can stomach the licence and the setup.',reviews:[{s:5,by:'COO',t:'Our throughput jumped. The automation quietly closes half the noise.'},{s:4,by:'Senior engineer',t:'Superb once configured. Budget time for the rollout.'}]}
  ],
  docs:[
    {id:'doc_note',name:'NotePeak',vendor:'NotePeak',base:8,perStaff:9,spd:0.04,onb:0.9,proc:0.15,rat:4.0,rev:1400,certd:false,blurb:'Basic client docs. The desk works about 4% faster.',long:'A cheap, simple place to keep client notes and passwords. Better than a shared spreadsheet, and it shaves a little off ticket times. Light on structure and certifications, so don’t lean on it for anything an auditor will ask about.',reviews:[{s:4,by:'Small MSP',t:'Cheap and does the basics. Beats what we had, which was nothing.'},{s:3,by:'Engineer',t:'Gets messy fast without discipline, and the password vault worries me a little.'}]},
    {id:'doc_key',name:'Keybook',vendor:'Keybook',base:15,perStaff:16,spd:0.08,onb:0.8,proc:0.25,rat:4.3,rev:2100,certd:true,blurb:'Client documentation and passwords in one place. The desk works about 8% faster, and onboarding surges are smaller.',long:'The documentation tool most MSPs settle on. Structured client records, a proper password vault and templates that make onboarding far less painful. Certified and dependable, the sensible middle ground.',reviews:[{s:5,by:'Service manager',t:'Onboarding got noticeably calmer once everything lived in one place.'},{s:4,by:'vCIO',t:'The structure keeps the team honest. Worth it.'}]},
    {id:'doc_codex',name:'Codex IT',vendor:'Codex',base:28,perStaff:26,spd:0.12,onb:0.68,proc:0.32,rat:4.5,rev:900,certd:true,blurb:'Premium documentation with deep automation. The desk works about 12% faster, and onboarding is much smoother.',long:'Documentation done properly: auto-discovery, rich linking, immaculate audit trails and onboarding runbooks that write half themselves. The desk is quicker and takeovers stop being a scramble. Priced for firms that take documentation seriously.',reviews:[{s:5,by:'Onboarding lead',t:'Takeovers used to be chaos. Now they’re a checklist. Transformative.'},{s:4,by:'CISO',t:'The audit trail and vault are first-class. Not cheap, but defensible.'}]}
  ]
};
function intTier(k){const arr=INTOOLS[k];if(!arr)return null;const id=S.vend[k]&&S.vend[k].prod;return arr.find(x=>x.id===id)||arr[1];}
function psaMult(){return vendOn('psa')?1+intTier('psa').spd:1;}
function docsMult(){return vendOn('docs')?1+intTier('docs').spd:1;}
function docsOnb(){return vendOn('docs')?intTier('docs').onb:1;}
function psaProc(){return vendOn('psa')?intTier('psa').proc:0;}
function docsProc(){return vendOn('docs')?intTier('docs').proc:0;}
function applyIntools(){for(const k of ['psa','docs']){const arr=INTOOLS[k];if(!arr||!VEND[k])continue;let id=S.vend&&S.vend[k]&&S.vend[k].prod;let t=arr.find(x=>x.id===id);if(!t){t=arr[1];if(S.vend&&S.vend[k])S.vend[k].prod=t.id;}
  VEND[k].name=t.name;VEND[k].base=t.base;VEND[k].perStaff=t.perStaff;VEND[k].desc=t.blurb;}}
const _applyProducts_zz=(typeof applyProducts==='function')?applyProducts:null;
if(_applyProducts_zz){applyProducts=function(){_applyProducts_zz();applyIntools();};}

function coreCatOf(k){return RESOLD_CAT[k];}
function coreListIds(k){if(RESOLD_CAT[k]){const cat=RESOLD_CAT[k];return Object.keys(PRODS).filter(p=>PRODS[p].cat===cat&&!PRODS[p].foreign);}if(INTOOLS[k])return INTOOLS[k].map(t=>t.id);return [k];}
function coreCurrent(k){if(RESOLD_CAT[k])return (typeof stdProd==='function')?stdProd(coreCatOf(k)):null;if(INTOOLS[k])return (S.vend[k]&&S.vend[k].prod)||INTOOLS[k][1].id;return k;}
function coreResoldPrice(k,id){const P=PRODS[id];if(!P)return '';if(k==='carrier')return '£'+P.costT+'/seat wholesale';return '£'+(P.base||0)+'/mo'+(P.perSeat?' + £'+P.perSeat+'/user':'')+(P.cost?' + £'+P.cost+'/user':'');}
function coreInfo(k,id){
  if(RESOLD_CAT[k]){const P=PRODS[id];if(!P)return null;const A=(typeof PROD_ADV!=='undefined'&&PROD_ADV[id])||{};return {id,name:P.name,vendor:(A.vendor||P.name),rat:A.rat||4.0,rev:A.rev||0,long:A.long||P.desc||'',reviews:A.reviews||[],price:coreResoldPrice(k,id),cert:true,blurb:P.desc||'',fam:P.fam||null};}
  if(INTOOLS[k]){const t=INTOOLS[k].find(x=>x.id===id);if(!t)return null;return {id,name:t.name,vendor:t.vendor,rat:t.rat,rev:t.rev,long:t.long,reviews:t.reviews,price:gbp(t.base+t.perStaff*Math.max(1,staffOn().length))+'/mo',cert:t.certd!==false,blurb:t.blurb,fam:t.fam||null};}
  const v=VEND[k];return {id:k,name:v.name,vendor:v.name,rat:4.0,rev:600,long:v.desc||'',reviews:[],price:v.base?gbp(v.base)+'/mo':'pay as you sell',cert:true,blurb:v.desc||''};
}
function coreName(k,id){const i=coreInfo(k,id||coreCurrent(k));return i?i.name:VEND[k].name;}

function coreChoose(k,pid){
  const s=S.vend[k];if(!s)return;
  if(pid&&pid!==k){if(RESOLD_CAT[k]){if(!PRODS[pid]||PRODS[pid].cat!==RESOLD_CAT[k])return;}else if(INTOOLS[k]){if(!INTOOLS[k].some(t=>t.id===pid))return;}}
  if(!vendOn(k)){s.on=true;s.onAt=S.day;if(pid&&(RESOLD_CAT[k]||INTOOLS[k]))s.prod=pid;if(typeof applyProducts==='function')applyProducts();
    log('Added '+coreName(k,pid)+' to your stack'+(VEND[k].base?', '+gbp(vendMonthly(k))+'/mo':'')+'.','info');ui.modal={type:'coreShop',k};return;}
  const cur=coreCurrent(k);if(cur===pid){ui.modal={type:'coreShop',k};return;}
  if(s.lock>S.day){if(typeof toast==='function')toast('You’re locked into '+VEND[k].name+' for another '+daysLeft(s.lock)+'.');return;}
  if(s.inhouse){s.inhouse=false;s.pm=1;log('You’ve dropped your own '+({rmm:'RMM',psa:'PSA',docs:'documentation',backup:'backup platform',edr:'security stack'}[k]||'tool')+' and gone back to a vendor. The licence bill is back.','event');}
  if(RESOLD_CAT[k]){switchStandard(coreCatOf(k),pid);}
  else if(INTOOLS[k]){spend(300);s.prod=pid;if(typeof applyProducts==='function')applyProducts();log('Moved your '+({psa:'PSA',docs:'documentation tool'}[k]||'tool')+' to '+coreName(k,pid)+'. A small changeover cost, and the desk takes a few days to settle in.','event');}
  ui.modal={type:'coreShop',k};
}
ACT_EXT.coreShop=k=>{if(VEND[k])ui.modal={type:'coreShop',k};};
ACT_EXT.coreView=v=>{const i=v.indexOf(':');const k=v.slice(0,i),id=v.slice(i+1);if(VEND[k]&&coreInfo(k,id))ui.modal={type:'coreView',k,id};};
ACT_EXT.coreChoose=v=>{const i=v.indexOf(':');const k=v.slice(0,i),id=v.slice(i+1);coreChoose(k,id);};
ACT_EXT.coreDrop=k=>{const s=S.vend[k];if(!s||!s.on)return;
  if(k==='carrier'||k==='dist'){if(typeof toast==='function')toast('You can’t drop this one, clients depend on it.');return;}
  if(s.lock>S.day){if(typeof toast==='function')toast('Locked into '+VEND[k].name+' for another '+daysLeft(s.lock)+'.');return;}
  const used=VEND[k].svc?VEND[k].svc.filter(x=>svcUsers(x)>0):[];
  if(used.length){if(typeof toast==='function')toast('Can’t drop '+VEND[k].name+': clients use '+used.map(x=>SVC[x].short.toLowerCase()).join(' and ')+'.');return;}
  s.on=false;s.disc=0;log('Dropped '+VEND[k].name+' from the stack.','info');ui.modal={type:'coreShop',k};};

MODAL_EXT.coreShop=(M,x)=>{const k=M.k;const V=VEND[k];const on=vendOn(k);const cur=coreCurrent(k);const s=S.vend[k];const ids=coreListIds(k);const single=ids.length<=1;
  let h='<div class="dialog wide">'+x+'<p class="kick">'+esc(V.kind)+'</p><h2>'+esc({psa:'PSA & ticketing',docs:'Documentation',rmm:'RMM',backup:'Backup',edr:'Endpoint security',carrier:'Telephony & connectivity',dist:'Microsoft licensing'}[k]||V.kind)+'</h2><p class="lede">'+(RESOLD_CAT[k]?'A product you run and resell. Tap a listing to read it. Switching your standard is a real move: a £500 fee, a migration for every client on it, and the team relearns it.':INTOOLS[k]?'Runs your service desk. Cheaper tiers do less; pricier ones make the desk faster and audits easier. Tap a listing to read it.':'The licensing account behind your Microsoft 365 resale.')+'</p><ul class="list">';
  h+=ids.map(id=>{const i=coreInfo(k,id);const owned=on&&cur===id;
    const fam=i.fam&&typeof HFAM!=='undefined'&&HFAM[i.fam]?HFAM[i.fam]:null;const wouldDisc=i.fam?famDiscIfCat(i.fam,k):0;
    return '<li class="item" style="cursor:pointer" data-act="coreView" data-v="'+k+':'+id+'"><span><b>'+esc(i.name)+'</b> <span class="mut">'+esc(i.vendor)+(fam?' · '+esc(fam.name)+' suite':'')+'</span>'+(owned?' <span class="chip pos">in use</span>':'')+(i.cert===false?' <span class="wrn" style="font-size:.72rem">no certs</span>':'')+'</span><span class="r">'+esc(i.price)+'</span><span class="sub">'+stars(i.rat)+' <span class="mut" style="font-size:.76rem">'+i.rat.toFixed(1)+(i.rev?' · '+i.rev.toLocaleString('en-GB')+' reviews':'')+'</span>'+(wouldDisc?' <span class="pos" style="font-size:.74rem">−'+Math.round(wouldDisc*100)+'% with your stack</span>':'')+' — '+esc(i.blurb)+'</span></li>';}).join('');
  h+='</ul>';
  if(on){const canNeg=s.on&&S.day-(s.neg||-999)>=84&&VEND[k].base>0&&k!=='dist';const droppable=k!=='carrier'&&k!=='dist';
    h+='<div class="foot2"><span class="grow mut" style="font-size:.8rem">'+(s.disc?Math.round(s.disc*100)+'% off negotiated. ':'')+(s.pm>1.001?'Prices up '+Math.round((s.pm-1)*100)+'%. ':'')+(s.lock>S.day?'Locked in for '+daysLeft(s.lock)+'.':'Running '+gbp(vendMonthly(k))+'/mo.')+'</span>'+(canNeg?'<button class="btn sm" data-act="neg" data-v="'+k+'">Negotiate</button>':'')+(droppable?'<button class="btn sm danger" data-act="coreDrop" data-v="'+k+'">Drop</button>':'')+'</div>';}
  return h+'</div>';};

MODAL_EXT.coreView=(M,x)=>{const k=M.k,i=coreInfo(k,M.id);if(!i)return null;const V=VEND[k];const on=vendOn(k);const cur=coreCurrent(k);const owned=on&&cur===M.id;const s=S.vend[k];const locked=s.lock>S.day;
  const resold=!!RESOLD_CAT[k];
  const back='<button class="btn sm" data-act="coreShop" data-v="'+k+'">‹ '+esc(V.kind)+'</button>';
  let h='<div class="dialog wide">'+x+'<div style="margin-bottom:8px">'+back+'</div>'+
    '<div class="row" style="justify-content:space-between;align-items:flex-start;gap:12px"><div><h2 style="margin:0">'+esc(i.name)+'</h2><div class="mut">'+esc(V.kind)+(resold?' · a product you resell':'')+(i.fam&&typeof HFAM!=='undefined'&&HFAM[i.fam]?' · '+esc(HFAM[i.fam].name)+' suite':'')+(owned?' · in use':'')+'</div><div style="margin-top:4px">'+stars(i.rat)+' <b>'+i.rat.toFixed(1)+'</b> <span class="mut" style="font-size:.8rem">'+(i.rev?i.rev.toLocaleString('en-GB')+' reviews':'')+'</span></div></div><div style="text-align:right"><div class="mut" style="font-size:.82rem">'+esc(i.price)+'</div>'+(i.cert===false?'<div class="wrn" style="font-size:.74rem">no audit certs</div>':'')+'</div></div>';
  h+='<p style="margin:12px 0 6px">'+esc(i.long)+'</p>';
  if(resold)h+='<p class="note">Making this your standard costs £500, migrates every client on the old one, and the team relearns it. That mechanic is unchanged, this is just where you browse.</p>';
  if(i.fam&&typeof HFAM!=='undefined'&&HFAM[i.fam]){const dsc=famDiscIfCat(i.fam,k);h+='<p class="note">'+esc(HFAM[i.fam].line)+(dsc?' <b class="pos">With the rest of your stack, you’d get '+Math.round(dsc*100)+'% off these accounts.</b>':'')+'</p>';}
  const dist=ratDist(i.rat);
  h+='<div class="sec" style="margin-top:10px"><h3 style="font-size:1rem">Ratings</h3><div style="display:grid;grid-template-columns:auto 1fr auto;gap:3px 8px;align-items:center;font-size:.8rem">';
  for(let n=5;n>=1;n--)h+='<span class="mut">'+n+'★</span><span style="background:var(--surface2);border-radius:4px;height:8px;overflow:hidden"><span style="display:block;height:100%;width:'+Math.round(dist[n-1]*100)+'%;background:#e8a13a"></span></span><span class="mut">'+Math.round(dist[n-1]*100)+'%</span>';
  h+='</div></div>';
  if((i.reviews||[]).length)h+='<div class="sec"><h3 style="font-size:1rem">What people say</h3><ul class="list">'+i.reviews.map(rv=>'<li class="item" style="grid-template-columns:1fr"><span>'+stars(rv.s)+' <b style="font-size:.85rem">'+esc(rv.by)+'</b></span><span class="sub" style="font-style:italic">“'+esc(rv.t)+'”</span></li>').join('')+'</ul></div>';
  h+='<div class="foot2"><span class="grow mut" style="font-size:.78rem">'+(owned?'This is your current '+(resold?'standard':'tool')+'.':on?'You currently run '+esc(coreName(k))+'.':'Not in your stack yet.')+'</span>'+
    (owned?(k!=='carrier'&&k!=='dist'?'<button class="btn sm danger" data-act="coreDrop" data-v="'+k+'">Drop</button>':''):'<button class="btn primary" data-act="coreChoose" data-v="'+k+':'+M.id+'" '+(locked?'disabled title="Locked into a contract"':'')+'>'+(on?(resold?'Make it my standard':'Switch to this'):'Add to my stack')+'</button>')+'</div>';
  return h+'</div>';};

/* the unified stack section: core tools, business software, and the kit board */
const CORE_ORDER=['psa','rmm','docs','backup','edr','carrier','dist'];
function coreStackSec(){if(typeof applyIntools==='function')applyIntools();
  let h='<div class="sec"><h3>Your stack</h3><p class="lede">The tools your desk runs on, and the products you resell. Browse each like an app store: cheaper options save money but do less or carry more risk, pricier ones do more. Everything here also widens your attack surface.</p><ul class="list">';
  const IHNAME={rmm:'Your own RMM',psa:'Your own PSA',docs:'Your own documentation',backup:'Your own backup',edr:'Your own security stack'};
  for(const k of CORE_ORDER){const V=VEND[k];const on=vendOn(k);const s=S.vend[k];const many=coreListIds(k).length>1;
    const ih=!!(on&&s&&s.inhouse);
    const i=on?coreInfo(k,coreCurrent(k)):null;
    const inUse=V.svc?V.svc.some(x=>svcUsers(x)>0):false;
    const offEst=(!on&&(V.base||V.perStaff||V.perSeat))?((V.base||0)+(V.perStaff?V.perStaff*staffOn().length:0)+(V.perSeat?V.perSeat*Math.max(1,svcUsers('support')):0)):0;
    const name=ih?(IHNAME[k]||('Your own '+V.kind)):(i?i.name:V.kind);
    const priceHtml=ih?'<span class="pos">£0</span>/mo'
      :((on&&hdFamDisc(k)?'<span class="pos" style="font-size:.72rem">−'+Math.round(hdFamDisc(k)*100)+'% </span>':'')+(on?(vendMonthly(k)?gbp(vendMonthly(k))+'/mo':'pay as you sell'):(offEst?'about '+gbp(Math.round(offEst))+'/mo':'off')));
    const blurb=ih?'Built and run by your own DevOps team, so there’s no licence fee'+(k==='rmm'?', and the desk works a little faster':k==='edr'?', and you’re harder to breach':'')+'. The odd bad update can still cause an outage.'
      :((on?stars(i.rat)+' '+esc(i.blurb):esc(V.desc||''))+
        (s&&s.disc?' <span class="pos">'+Math.round(s.disc*100)+'% off.</span>':'')+(s&&s.pm>1.001?' <span class="wrn">Prices up '+Math.round((s.pm-1)*100)+'%.</span>':'')+(s&&s.lock>S.day?' <span class="mut">Locked in '+daysLeft(s.lock)+'.</span>':'')+(on&&V.svc&&!inUse&&V.base?' <span class="wrn">No client uses it.</span>':''));
    h+='<li class="item"><span><b>'+esc(name)+'</b>'+(ih?' <span class="chip pos">in-house</span> <span class="mut">'+esc(V.kind)+'</span>':(on?' <span class="mut">'+esc(V.kind)+'</span>':' <span class="mut">· off</span>'))+'</span><span class="r">'+priceHtml+'</span><span class="sub">'+blurb+
      '<span class="row" style="margin-top:6px"><button class="btn sm'+(on?'':' primary')+'" data-act="coreShop" data-v="'+k+'">'+(ih?'Manage':(on?(many?'View catalogue':'Manage'):(many?'Choose a tool':'Add')))+'</button></span></span></li>';}
  h+='</ul><p class="mut" style="font-size:.82rem">Attack surface across your whole stack: <b>'+surface()+'</b>.</p></div>';
  h+=teamToolsSec();
  if(typeof kitBoard==='function')h+=kitBoard();
  return h;}

/* ============ more helpdesk products, and single-vendor loyalty discounts ============ */
/* Extra choice in every resold category, plus vendors that span several
   categories. Standardise two or more of your stack on one vendor and those
   accounts are discounted, the "one pane of glass" bargain, at the cost of
   best-of-breed. */
Object.assign(PRODS,{
  sentinel_rmm:{cat:'rmm',name:'Sentinel RMM',fam:'sentinel',base:85,perSeat:1.4,cut:0.30,course:550,desc:'The RMM in the Sentinel platform. Strong automation, and one console when paired with the rest of the suite.'},
  nexus_rmm:{cat:'rmm',name:'Nexus RMM',fam:'nexus',base:42,perSeat:0.95,cut:0.22,course:380,desc:'The RMM half of the Nexus bundle. Keen value, better still alongside Nexus backup.'},
  sentinel_vault:{cat:'backup',name:'Sentinel Vault',fam:'sentinel',base:70,cost:2.2,tix:0.8,course:480,desc:'Backup in the Sentinel platform. Clean restores and one pane of glass with the rest.'},
  nexus_backup:{cat:'backup',name:'Nexus Backup',fam:'nexus',base:34,cost:1.6,tix:1.05,course:330,desc:'The backup half of the Nexus bundle. Cheap, and pairs neatly with Nexus RMM.'},
  sentinel_shield:{cat:'edr',name:'Sentinel Shield',fam:'sentinel',base:110,cost:5.0,tix:0.9,course:680,desc:'EDR in the Sentinel platform, wired into the same SOC and console as the rest of the suite.'},
  aegis:{cat:'edr',name:'Aegis',base:95,cost:4.8,tix:1.0,course:600,desc:'A dependable mid-market EDR. Solid detections without the top-tier price.'},
  clearwave:{cat:'voice',name:'Clearwave',base:0,costT:9.5,costC:205,tix:0.85,course:420,desc:'A premium carrier: pricier wholesale, but rock-steady lines and fewer faults.'}
});
Object.assign(PROD_ADV,{
  sentinel_rmm:{rat:4.2,rev:2100,long:'The monitoring engine of the Sentinel platform. Broad coverage, sharp automation, and everything in one console once you run the rest of the suite. Strong on its own, and the whole Sentinel estate gets cheaper the more of it you standardise on.',reviews:[{s:5,by:'MSP owner',t:'We put RMM, backup and EDR all on Sentinel. One login, one bill, and a proper discount.'},{s:4,by:'Engineer',t:'Good RMM. The pull to go all-Sentinel is real once you start.'}]},
  nexus_rmm:{rat:4.1,rev:1400,long:'A tidy, affordable RMM from Nexus. Covers the essentials well and gets keener still when you add Nexus backup alongside it. A sensible bundle for cost-conscious desks.',reviews:[{s:4,by:'Small MSP',t:'Cheap and does the job. Paired it with their backup for the discount.'},{s:3,by:'Tech',t:'Fine. Not as deep as the premium tools, but the price is right.'}]},
  sentinel_vault:{rat:4.3,rev:1600,long:'Backup as part of the Sentinel platform. Reliable restores, clean reporting, and the same console as your Sentinel RMM and EDR. Best value when it is one of two or three Sentinel products you run.',reviews:[{s:5,by:'Service manager',t:'Restores are painless and it all lives in one place now.'},{s:4,by:'vCIO',t:'The suite discount tipped us into consolidating. No regrets so far.'}]},
  nexus_backup:{rat:4.0,rev:1100,long:'The backup half of the Nexus bundle. Low cost, solid basics, and a loyalty discount when you also run Nexus RMM. A little more support work than the premium tools, but easy on the bill.',reviews:[{s:4,by:'Budget-minded owner',t:'Cheapest way to cover backup once you are already on Nexus RMM.'},{s:3,by:'Analyst',t:'Restores are a touch fiddlier than the premium options.'}]},
  sentinel_shield:{rat:4.3,rev:1300,long:'Endpoint detection in the Sentinel platform, sharing the same 24/7 SOC and console as the rest. Serious protection, and the all-Sentinel discount makes the maths work if you go all-in.',reviews:[{s:5,by:'Security lead',t:'One console for RMM, backup and EDR is a genuine time-saver.'},{s:4,by:'SecOps',t:'Good detections. Not quite Halcyon, but part of a cheaper whole.'}]},
  aegis:{rat:4.1,rev:1500,long:'A dependable mid-market EDR that sits between the budget and the top tier. Reliable detections, sensible tuning, fair price. The safe middle choice when you want best-of-breed rather than a bundle.',reviews:[{s:4,by:'IT manager',t:'Does exactly what an EDR should without the flagship price.'},{s:4,by:'Engineer',t:'Quiet enough, catches what matters.'}]},
  clearwave:{rat:4.3,rev:700,long:'A premium wholesale carrier. Costs a little more per seat than the budget carriers, and pays it back in steadier lines and noticeably fewer faults to chase. Worth it for voice-heavy books.',reviews:[{s:5,by:'Comms engineer',t:'Rock steady. Our telephony ticket count dropped after we moved.'},{s:4,by:'Owner',t:'Dearer wholesale, but fewer 8am outage calls. I will take that trade.'}]}
});
const _sentinelLine='Sentinel is one vendor spanning RMM, backup, EDR, plus a security portal and reporting, all on a single console. Its loyalty discount counts every Sentinel product across your whole stack and climbs the more you run: 8% at two, up to 18% at five. Solid, certified tools, at the cost of tying yourself to one supplier.';
const _nexusLine='Nexus is a budget vendor across RMM, backup, CRM and billing. Its loyalty discount counts every Nexus product across your stack and climbs the more you run: 10% at two, up to 16%. Cheap and cheerful, and you end up leaning on one small vendor for a lot.';
const HFAM={
  sentinel:{name:'Sentinel',cats:['rmm','backup','edr'],line:_sentinelLine},
  nexus:{name:'Nexus',cats:['rmm','backup'],line:_nexusLine}
};
/* Sentinel and Nexus also reach into the business tools, so register them for
   that UI too (Vantage and Northstar stay business-only). */
FAM.sentinel={name:'Sentinel',disc:0.08,line:_sentinelLine};
FAM.nexus={name:'Nexus',disc:0.10,line:_nexusLine};
function hdFamOf(k){const cat=RESOLD_CAT[k];if(!cat)return null;const p=(typeof stdProd==='function')?stdProd(cat):null;return p&&PRODS[p]?PRODS[p].fam:null;}
function hdFamCount(fam){let n=0;for(const kk in RESOLD_CAT){if(vendOn(kk)&&hdFamOf(kk)===fam)n++;}return n;}
function hdFamDisc(k){if(!vendOn(k))return 0;return (typeof famDiscNow==='function')?famDiscNow(catFamOf(k)):0;}
/* discount a family product would earn given the rest of your current stack */
function hdFamDiscIf(k,id){const P=PRODS[id];if(!P||!P.fam)return 0;return (typeof famDiscIfCat==='function')?famDiscIfCat(P.fam,k):0;}
const _vendMonthly_zz=vendMonthly;
vendMonthly=function(k){return _vendMonthly_zz(k)*(1-hdFamDisc(k));};

/* ============ Un-Able ============ */
/* A vendor that spans every domain, charges a premium, dangles an enormous
   loyalty discount, and makes claims no software could keep. Looks the part to
   a casual buyer; the tools are weak across the board and you're locked into an
   expensive ecosystem. Always available. If you know, you know. */
Object.assign(PRODS,{
  unable_rmm:{cat:'rmm',name:'Un-Able RMM',fam:'unable',base:105,perSeat:1.6,cut:0.10,course:520,desc:'The self-healing, AI-driven RMM that eliminates tickets before they exist.'},
  unable_backup:{cat:'backup',name:'Un-Able Vault',fam:'unable',base:95,cost:2.7,tix:1.4,course:520,desc:'Quantum-grade, immutable backup with guaranteed instant restores.'},
  unable_edr:{cat:'edr',name:'Un-Able Shield',fam:'unable',base:160,cost:5.9,tix:1.4,course:720,desc:'Zero-trust, next-generation endpoint protection with a 24/7 global SOC.'}
});
Object.assign(PROD_ADV,{
  unable_rmm:{rat:3.9,rev:8800,long:'Un-Able RMM is the AI-powered, blockchain-ready, cloud-native, single-pane-of-glass platform that leverages synergies to eliminate 99.999% of tickets before they happen. Downtime? We prefer “unscheduled availability windows.” Standardise your whole stack on Un-Able and unlock unbeatable, industry-leading loyalty savings. The last RMM you’ll ever be able to.',reviews:[
    {s:5,by:'Un-Able Marketing (verified)',t:'A truly world-class, best-in-breed, next-generation, mission-critical platform. Five stars! No notes!'},
    {s:5,by:'"Real Customer" (definitely real)',t:'Un-Able changed our lives and also our business outcomes at scale. #blessed #synergy'},
    {s:1,by:'Furious owner',t:'It patched our servers into oblivion. Our support ticket has been open since 2019.'},
    {s:1,by:'Former customer',t:'The agent uninstalled itself and took our monitoring with it. Un-Able indeed.'},
    {s:2,by:'Eternal optimist',t:'When it works, it works. It has never worked. But the discount was huge.'}
  ]},
  unable_backup:{rat:3.8,rev:5400,long:'Un-Able Vault delivers quantum-grade, immutable, air-gapped, blockchain-anchored backup with guaranteed instant restores. Bundle it with the rest of the Un-Able platform for savings so large our accountants advised against advertising them.',reviews:[
    {s:5,by:'Un-Able Marketing (verified)',t:'Immutable, unbreakable, unbeatable. Also unpronounceable. Five stars!'},
    {s:1,by:'Ashen-faced MSP',t:'We tested a restore for the first time during a real incident. Do not do this.'},
    {s:2,by:'Survivor',t:'Backups ran fine. It was the getting-them-back part that ended my career.'}
  ]},
  unable_edr:{rat:3.8,rev:4100,long:'Un-Able Shield is zero-trust, AI-native, threat-intelligent, next-generation endpoint protection backed by a 24/7 global security operations centre. Complete your Un-Able estate and the loyalty discount practically pays you.',reviews:[
    {s:5,by:'Un-Able Marketing (verified)',t:'Threats simply give up when they see the logo. Unhackable! Five stars!'},
    {s:1,by:'Breached and bitter',t:'Kevin was on holiday. So, it turned out, was our security.'},
    {s:2,by:'Weary analyst',t:'It alerts on everything and nothing. Usually at 3am.'}
  ]}
});
/* Un-Able Documentation, pressed into the internal tools */
INTOOLS.docs.push({id:'doc_unable',name:'Un-Able Docs',vendor:'Un-Able',fam:'unable',base:34,perStaff:28,spd:0.03,onb:0.95,proc:0.10,rat:3.8,rev:3100,certd:false,blurb:'AI-generated documentation that writes itself. The desk works about 3% faster.',long:'Un-Able Docs uses generative AI, machine learning and blockchain to auto-document your clients’ entire estate with zero human effort. Every password, every diagram, every runbook, conjured from thin air. Complete your Un-Able estate and the loyalty savings are, frankly, hard to believe.',reviews:[
  {s:5,by:'Un-Able Marketing (verified)',t:'Documentation so good it documents itself documenting. Meta! Five stars!'},
  {s:1,by:'Burned engineer',t:'It confidently documented a firewall the client has never owned. Twice.'},
  {s:2,by:'Weary lead',t:'Half of it is fiction, but it’s beautifully formatted fiction, and the bundle discount was enormous.'}
]});
/* Un-Able, pressed into a few business tools too */
TT_SHOP.crm.push({id:'crm_unable',name:'Un-Able CRM',vendor:'Un-Able',mult:1.8,term:24,sec:0.28,fam:'unable',rat:3.8,rev:3900,certd:false,blurb:'AI-native, revenue-maximising, relationship-synergising CRM. Part of the Un-Able estate.',long:'Un-Able CRM leverages predictive AI to close deals you didn’t know you had with customers who don’t exist. Fully integrated with the entire Un-Able platform, so your loyalty discount grows every time you buy more of us. Data security is, and we quote our own brochure, “handled.”',reviews:[{s:5,by:'Un-Able Marketing (verified)',t:'It sells things. To people. Probably. Five stars!'},{s:1,by:'Regretful MD',t:'It merged two clients into one imaginary super-client and emailed them both.'},{s:2,by:'Pragmatist',t:'Clunky and I don’t trust where the data lives, but the all-Un-Able discount was silly money off.'}]});
TT_SHOP.billing.push({id:'bil_unable',name:'Un-Able Billing',vendor:'Un-Able',mult:1.8,term:24,sec:0.26,fam:'unable',rat:3.7,rev:2600,certd:false,blurb:'Autonomous, self-optimising billing that bills so you don’t have to. Part of the Un-Able estate.',long:'Un-Able Billing uses next-generation automation to invoice your clients with breathtaking confidence and occasional accuracy. Reconciliation is a philosophy, not a feature. Buy the rest of the Un-Able platform and watch the loyalty discount defy accounting.',reviews:[{s:5,by:'Un-Able Marketing (verified)',t:'It sends invoices at the speed of light. Correctness sold separately. Five stars!'},{s:1,by:'Livid controller',t:'It billed a client £0.00 for a year and then £84,000 in one go.'},{s:2,by:'Survivor',t:'You’ll spend the saving fixing what it does. But what a saving.'}]});
TT_SHOP.bi.push({id:'bi_unable',name:'Un-Able Insight',vendor:'Un-Able',mult:1.7,term:24,sec:0.30,fam:'unable',rat:3.8,rev:2100,certd:false,blurb:'AI-driven dashboards that tell you what you want to hear. Part of the Un-Able estate.',long:'Un-Able Insight turns your data into beautiful, confident, occasionally-related charts. Powered by AI, blockchain and sheer nerve. The more of the Un-Able platform you run, the bigger the loyalty discount and the more your dashboards agree with you.',reviews:[{s:5,by:'Un-Able Marketing (verified)',t:'Every KPI is green. Always. Reassuring! Five stars!'},{s:1,by:'Betrayed analyst',t:'It reported record profits during the month we nearly folded.'},{s:2,by:'Realist',t:'Pretty charts, dubious numbers, absurd discount. You get what you don’t pay for.'}]});
/* Sentinel reaches up from the security stack into reporting and the client portal */
TT_SHOP.bi.push({id:'bi_sentinel',name:'Sentinel Insight',vendor:'Sentinel Systems',mult:1.55,term:12,sec:0.9,fam:'sentinel',rat:4.2,rev:1300,certd:true,blurb:'Security-first BI over your whole estate. Part of the Sentinel platform.',long:'Sentinel Insight brings the same console and certifications as the rest of the Sentinel platform to your reporting. Strong on security and compliance dashboards, and every Sentinel product you add deepens the cross-stack loyalty discount.',reviews:[{s:5,by:'Security lead',t:'Our RMM, EDR and reporting finally share one pane and one bill.'},{s:4,by:'vCIO',t:'Solid dashboards, and consolidating onto Sentinel actually saved us real money.'}]});
TT_SHOP.portal.push({id:'por_sentinel',name:'Sentinel Portal',vendor:'Sentinel Systems',mult:1.5,term:12,sec:0.88,fam:'sentinel',rat:4.1,rev:1100,certd:true,blurb:'A secure client portal wired into the Sentinel platform.',long:'Sentinel Portal gives clients a certified, security-forward view of their estate, sharing identity and data with the rest of your Sentinel stack. Best value as one more piece of a consolidated Sentinel estate.',reviews:[{s:4,by:'Service manager',t:'Clients trust it, and it plugs straight into our Sentinel tools.'},{s:4,by:'MSP owner',t:'Not the flashiest portal, but the suite discount and single vendor won us over.'}]});
/* Nexus reaches up from the budget helpdesk bundle into CRM and billing */
TT_SHOP.crm.push({id:'crm_nexus',name:'Nexus CRM',vendor:'Nexus',mult:0.72,term:12,sec:0.68,fam:'nexus',rat:4.2,rev:1600,certd:true,blurb:'The CRM in the Nexus budget bundle. Cheaper still with the rest of Nexus.',long:'A straightforward, affordable CRM that shares a login and a bill with the rest of the Nexus range. Nothing fancy, but genuinely good value, and the loyalty discount grows with every Nexus product you run across the stack.',reviews:[{s:4,by:'Small MSP',t:'Cheap, does the job, and one less vendor to deal with.'},{s:4,by:'Owner',t:'We run Nexus for RMM and backup, so adding their CRM was a no-brainer for the discount.'}]});
TT_SHOP.billing.push({id:'bil_nexus',name:'Nexus Billing',vendor:'Nexus',mult:0.7,term:12,sec:0.66,fam:'nexus',rat:4.1,rev:1200,certd:true,blurb:'Budget billing in the Nexus bundle. Keener with the rest of Nexus.',long:'Nexus Billing handles invoicing and collections cleanly enough at a keen price, and shares data with the rest of the Nexus stack. The more Nexus you run, the deeper the cross-stack loyalty discount.',reviews:[{s:4,by:'Bookkeeper',t:'Reconciles fine and costs little. Perfect for a Nexus shop.'},{s:3,by:'Controller',t:'Basic, but the bundle saving made it worth standardising on.'}]});

/* ============ cross-stack vendor suites ============ */
/* Every vendor family's loyalty discount counts every product of theirs you run,
   anywhere across the stack: helpdesk, internal tools and business software. Run
   more of one vendor and the discount on all their accounts climbs. Honest
   consolidation is rewarded the same way Un-Able's trap is. */
function catFamOf(k){
  if(RESOLD_CAT[k]){if(!vendOn(k))return null;const p=(typeof stdProd==='function')?stdProd(RESOLD_CAT[k]):null;return p&&PRODS[p]?PRODS[p].fam:null;}
  if(INTOOLS[k]){if(!vendOn(k))return null;const t=intTier(k);return t?t.fam:null;}
  if(TEAMTOOLS[k]){const p=ttProd(k);return p?p.fam:null;}
  return null;}
function famUsedAny(fam){if(!fam)return 0;let n=0;for(const k of ['rmm','backup','edr','carrier','docs','psa'])if(catFamOf(k)===fam)n++;for(const c in TEAMTOOLS)if(catFamOf(c)===fam)n++;return n;}
/* each family's escalating discount by how many of their products you run */
const FAM_STEPS={
  unable:[0.20,0.25,0.30,0.35],
  sentinel:[0.08,0.12,0.15,0.18],
  nexus:[0.10,0.13,0.16],
  vantage:[0.12,0.15,0.18],
  northstar:[0.10,0.12,0.14]
};
function famDiscFor(fam,n){const s=FAM_STEPS[fam];if(!s||n<2)return 0;return s[Math.min(s.length-1,n-2)];}
function famDiscNow(fam){return famDiscFor(fam,famUsedAny(fam));}
function famDiscIfCat(fam,k){if(!fam)return 0;let n=famUsedAny(fam);if(catFamOf(k)!==fam)n+=1;return famDiscFor(fam,n);}

/* the Un-Able "ecosystem": premium price, weak tools everywhere, and an outsized,
   escalating discount to knit your whole business to one bad vendor */
const _uLine='Un-Able wants your whole business. Their loyalty discount counts every Un-Able product you run, anywhere across the stack, and climbs the deeper in you get: 20% at two, rising to a frankly-suspicious 35% if you go all-in. The tools are dear and weak across the board, but that number does catch the eye.';
HFAM.unable={name:'Un-Able',cats:['rmm','backup','edr'],line:_uLine};
FAM.unable={name:'Un-Able',disc:0.20,line:_uLine};
/* Un-Able is a full, always-available vendor. The only guard: a random
   price-hike event can't involuntarily migrate you onto it, that's a trap you
   walk into yourself. */
if(typeof rivalOf==='function'){const _rivalOf_egg=rivalOf;rivalOf=function(k){const r=_rivalOf_egg(k);return (r&&PRODS[r]&&PRODS[r].fam==='unable')?null:r;};}

/* ============ build 38: the billing department ============ */
/* Early on you do the books yourself. As the client base grows, unbilled work
   leaks away, debtors drift, vendor invoices go unchecked and mistakes creep in.
   A billing clerk covers a big chunk of that; a billing manager runs a proper
   department and takes it off your plate. Coverage is the whole game: high
   coverage recovers leaked revenue and kills the losses, low coverage bleeds. */
Object.assign(ROLES,{
  bill:{t:'Billing Clerk',short:'Billing clerk',sal:[1800,2400],col:'--r-am',blurb:'Runs invoicing, chases debtors and checks vendor bills. Recovers leaked revenue and cuts bad debt, overpayments and billing errors across a big slice of your client base.'},
  bm:{t:'Billing Manager',short:'Billing manager',sal:[3400,4600],col:'--r-sm',blurb:'Runs the billing function: tighter collections, cleaner books, fewer errors. Makes every clerk more effective and takes billing off your plate entirely.'}
});
ROLE_ORDER.push('bill','bm');
function billClerks(){return staffOn().filter(s=>started(s)&&s.role==='bill'&&!s.left).length;}
function billMgr(){return hasRole('bm');}
/* a good billing tool automates chasing and reconciliation; a cheap one less so */
function billToolBonus(){if(typeof ttProd!=='function')return 0;const p=ttProd('billing');if(!p)return 0;return p.mult>=1.5?0.18:(p.certd===false?0.06:0.12);}
/* how many clients' billing you can properly handle */
function billCap(){let cap=12;const m=billMgr();cap+=billClerks()*45*(m?1.25:1);if(m)cap+=25;return cap;}
function billCoverage(){const n=active().length;if(n<=0)return 1;const cfo=(typeof execFocusPow==='function')?0.12*execFocusPow('cfo','cash'):0;return clamp(billCap()/n*(1+billToolBonus())+cfo,0,1);}
/* run once a month: recover leaked revenue, book the losses, nudge satisfaction */
function runBilling(){
  const n=active().length;if(n<=0){S.co.billStats=null;return;}
  const cov=billCoverage(),gap=1-cov;
  const recovered=Math.round(mrr()*0.05*cov);
  const badDebt=Math.round(mrr()*0.02*gap*(1-0.4*((typeof execFocusPow==='function')?execFocusPow('cfo','cash'):0)));
  const overpay=Math.round((typeof costOfSales==='function'?costOfSales():0)*0.05*gap);
  const et=(typeof ttOn==='function'&&ttOn('billing'))?0.5:1;
  const nErr=Math.round(n*gap*0.06*et);let errs=0,credits=0;
  const pool=active().slice().sort(()=>Math.random()-0.5);
  for(let i=0;i<nErr&&i<pool.length;i++){pool[i].sat=Math.max(0,pool[i].sat-rnd(2,6));credits+=Math.round(rnd(20,80));errs++;}
  if(recovered){S.co.cash+=recovered;S.m.setup=(S.m.setup||0)+recovered;}
  const loss=badDebt+overpay+credits;if(loss)spend(loss);
  S.co.billStats={cov,recovered,badDebt,overpay,credits,errs,day:S.day};
  if(cov<0.6&&loss>recovered)log('Billing is slipping: '+gbp(loss)+' lost this month to bad debt, overpaid invoices and billing mistakes'+(errs?' ('+errs+' client'+(errs>1?'s':'')+' got a wrong invoice)':'')+'. '+(billClerks()||billMgr()?'The team’s stretched, another clerk would catch more.':'A billing clerk would catch most of it.'),'bad');
}
const _peopleDaily_bill=peopleDaily;
peopleDaily=function(W){_peopleDaily_bill(W);if(S.day%DPM===7)runBilling();};

/* the billing panel on the Money tab */
function billingSec(){
  const n=active().length;const cov=billCoverage();const cap=billCap();const clerks=billClerks();const mgr=billMgr();const bs=S.co.billStats;
  const covCls=cov>=0.85?'pos':cov>=0.6?'wrn':'neg';
  let h='<div class="sec"><h3>Billing &amp; finance</h3><p class="lede">Getting paid, in full and on time. Good billing recovers work that would leak away unbilled and keeps debtors, vendor overpayments and invoice errors down. It scales from you doing the books, to a clerk, to a department.</p>';
  h+='<div class="tiles"><div class="tile"><span class="k">Coverage</span><span class="v '+covCls+'">'+pct(cov)+'</span><small>'+(cov>=0.99?'fully on top of it':cov>=0.6?'stretched':'slipping')+'</small></div><div class="tile"><span class="k">Capacity</span><span class="v">'+Math.round(cap)+'</span><small>clients well-billed vs '+n+' live</small></div><div class="tile"><span class="k">Team</span><span class="v">'+(clerks+(mgr?1:0)||'You')+'</span><small>'+(mgr?'manager + ':'')+(clerks?clerks+' clerk'+(clerks>1?'s':''):(clerks===0&&!mgr?'no billing staff':''))+'</small></div></div>';
  if(bs){const net=bs.recovered-bs.badDebt-bs.overpay-bs.credits;
    h+='<table><tbody><tr><td>Revenue recovered <span class="mut" style="font-size:.76rem">unbilled work, increments, add-ons</span></td><td class="r pos">+'+gbp(bs.recovered)+'</td></tr>'+
      '<tr><td>Bad debt <span class="mut" style="font-size:.76rem">debtors who never pay</span></td><td class="r '+(bs.badDebt?'neg':'')+'">'+(bs.badDebt?'−'+gbp(bs.badDebt):'–')+'</td></tr>'+
      '<tr><td>Vendor overpayment <span class="mut" style="font-size:.76rem">invoices nobody checked</span></td><td class="r '+(bs.overpay?'neg':'')+'">'+(bs.overpay?'−'+gbp(bs.overpay):'–')+'</td></tr>'+
      '<tr><td>Billing errors <span class="mut" style="font-size:.76rem">'+(bs.errs?bs.errs+' wrong invoice'+(bs.errs>1?'s':'')+', credited back':'none this month')+'</span></td><td class="r '+(bs.credits?'neg':'')+'">'+(bs.credits?'−'+gbp(bs.credits):'–')+'</td></tr>'+
      '<tr class="total"><td>Net, last month</td><td class="r '+(net<0?'neg':'pos')+'">'+sgbp(net)+'</td></tr></tbody></table>';
  } else h+='<p class="mut" style="font-size:.82rem">First month-end will show what billing is winning or costing you.</p>';
  h+='<p class="mut" style="font-size:.82rem">'+(ttOn('billing')?'Your '+esc(ttProd('billing').name)+' billing tool is automating some of this.':'You’re running billing without a dedicated tool. A billing platform on the Stack tab would help.')+'</p>';
  h+='<div class="row" style="margin-top:6px"><button class="btn sm'+(cov<0.85?' primary':'')+'" data-act="hire" data-v="bill">Hire a billing clerk</button>'+(!mgr&&(clerks>=1||n>60)?'<button class="btn sm" data-act="hire" data-v="bm">Hire a billing manager</button>':'')+'</div></div>';
  return h;
}
const _paneMoney_bill=paneMoney;
paneMoney=function(){let h=_paneMoney_bill();const b=billingSec();return h.indexOf('<div class="sec"><h3>Bank</h3>')>=0?h.replace('<div class="sec"><h3>Bank</h3>',b+'<div class="sec"><h3>Bank</h3>'):h+b;};

/* ============ build 44: a few more events for variety ============ */
HUMAN.award={w:0.7,ok:()=>staffOn().filter(s=>s.id!=='you'&&started(s)&&s.skill>=4).length>0&&mrr()>15000,ctx:()=>({sid:pick(staffOn().filter(s=>s.id!=='you'&&started(s)&&s.skill>=4)).id}),make:x=>{const s=ST(x.sid);if(!s)throw 0;return {kicker:'Recognition',title:s.name+' has been named a regional IT technician of the year',body:s.name+' has picked up an industry award. It’s great for morale and for your name in the market, but the phone will start ringing with offers for them.',
  choices:[{label:'Make a proper fuss of it',note:'A bonus and a celebration. Morale and reputation up, and they feel valued enough to stay.',go(){spend(1500);s.morale=Math.min(100,s.morale+15);S.co.rep=Math.min(100,S.co.rep+3);log('You celebrated '+s.name+'’s award. The team’s buzzing.','good');}},
    {label:'A quiet well done',note:'Cheaper, but they notice you didn’t make much of it.',go(){s.morale=Math.max(0,s.morale-4);S.co.rep=Math.min(100,S.co.rep+2);log(s.name+' won an award; you gave a nod and moved on.','info');}}]};}};
HUMAN.referral={w:1,ok:()=>active().some(c=>c.sat>=80)&&S.deals.length<18,ctx:()=>({cid:pick(active().filter(c=>c.sat>=80)).id}),make:x=>{const c=C(x.cid);if(!c)throw 0;return {kicker:'Word of mouth',title:c.name+' has recommended you to someone',body:c.name+' is delighted with you and has passed your name to a firm they know that’s fed up with their current provider.',
  choices:[{label:'Follow it up',note:'A warm lead, far likelier to sign.',go(){const d=addProspect({note:'Referred by '+c.name+', a happy client.'});if(d){d.warm=1;d.bidders=[];}c.sat=Math.min(100,c.sat+2);log(c.name+' referred you a warm lead.','good');}},
    {label:'Thank them, leave it',note:'You’re too stretched to chase it right now.',go(){c.sat=Math.min(100,c.sat+1);log('You thanked '+c.name+' for the referral but didn’t chase it.','info');}}]};}};
HUMAN.downturn={w:0.8,ok:()=>active().length>=8&&mrr()>20000,ctx:()=>{const big=active().filter(c=>c.seats>=15).sort((a,b)=>b.seats-a.seats);return {cid:(big[0]||pick(active())).id,cut:ri(10,25)};},make:x=>{const c=C(x.cid);if(!c)throw 0;const cut=x.cut;return {kicker:'Client pressure',title:c.name+' is cutting headcount and wants a smaller bill',body:c.name+' has had a tough quarter and is losing about '+cut+'% of its people. They want their support scaled down to match, or they’ll start shopping around.',
  choices:[{label:'Scale them down',note:'Fewer seats and a lower bill, but you keep them.',go(){c.seats=Math.max(3,Math.round(c.seats*(1-cut/100)));c.sat=Math.min(100,c.sat+3);log('You scaled '+c.name+' down '+cut+'%. Smaller, but still yours.','event');}},
    {label:'Hold the price, add value',note:'Offer a bit more for the same money. Protects revenue if it lands.',go(){if(Math.random()<0.55){c.sat=Math.min(100,c.sat+5);log('You held the price with '+c.name+' by offering more, and they stayed on the full package.','good');}else{c.notice=S.day+DPM;c.ending=true;c.why='unhappy';log(c.name+' wouldn’t wear it and has served notice.','bad');}}}]};}};
HUMAN.dsar={w:0.6,ok:()=>active().length>=5,ctx:()=>({cid:pick(active()).id}),make:x=>{const c=C(x.cid);if(!c)throw 0;const easy=vendOn('docs');const hrs=easy?ri(2,4):ri(6,12);return {kicker:'Compliance',title:'A data request has landed about '+c.name,body:'Someone has made a data subject access request, and you hold the records. Pulling it together is '+(easy?'quick, your documentation is in order':'a slog without proper documentation')+', about '+hrs+' hours.',
  choices:[{label:'Handle it properly',note:'Costs the time, keeps you clean.',go(){S.co.busy=(S.co.busy||0)+hrs;c.sat=Math.min(100,c.sat+2);log('You handled the data request about '+c.name+' by the book'+(easy?'. Your documentation made it painless.':'. It ate a chunk of the week.'),'info');}},
    {label:'Do the bare minimum',note:'Faster now, a risk if it’s ever challenged.',go(){if(typeof addHeat==='function')addHeat(4,'Cut corners on a data request');log('You did the minimum on the data request. Hopefully nobody checks.','info');}}]};}};
