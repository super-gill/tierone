
/* ============ build 19: guide, glossary, save codes, difficulty, coach, late-game pressure ============ */

/* ---------- difficulty ---------- */
const DIFF={easy:{t:'Easy',d:'£12k to start, a friendlier bank, softer rivals, and a coach who points you where to look.',cash:12000,loan:1.5,rival:0.5,win:0.05,coach:2},
  normal:{t:'Normal',d:'£6k to start. The coach tells you what’s going wrong, not how to fix it.',cash:6000,loan:1,rival:1,win:0,coach:1},
  hard:{t:'Hard',d:'£4k, a tight bank, more incidents, sharper rivals and no coach.',cash:4000,loan:0.7,rival:1.5,win:-0.03,coach:0}};
const diff=()=>DIFF[S.diff||'normal'];
const _loanLimit19=loanLimit;loanLimit=function(){return Math.floor(_loanLimit19()*diff().loan/5000)*5000;};
const _winChance19=winChance;winChance=function(d,pm){return clamp(_winChance19(d,pm)+diff().win,0.03,0.88);};
const _fireEvent19=fireEvent;fireEvent=function(){_fireEvent19();if(S.diff==='hard')S.nextEvent-=ri(3,6);else if(S.diff==='easy')S.nextEvent+=ri(3,8);};

/* ---------- getting-started guide ---------- */
const GUIDE=[
  {id:'send',t:'Send your first proposal',h:'Open the Sales tab and click a lead. Pick a price and a contract term, then send it. You won’t win them all.',test:()=>S.flags.sent},
  {id:'support',t:'Win a managed support client',h:'Telephony gets you in the door; managed support is where the money is. Existing clients are the easiest place to start: they already trust you.',test:()=>active().some(c=>c.svc.support)},
  {id:'plan',t:'Decide an onboarding plan',h:'After discovery, the Projects tab asks what to do about the client’s own kit. ★ marks the cheapest option over a year.',test:()=>S.flags.planned},
  {id:'review',t:'Run an account review',h:'Clients in your own book want a review each quarter. It costs half a day and builds the trust that leads to more work.',test:()=>S.flags.reviewed},
  {id:'tool',t:'Add a ticketing tool',h:'A PSA (Ticketwise) makes everyone on the desk faster. Tools cost money every month, so add them when the work justifies it.',test:()=>vendOn('psa')},
  {id:'hire',t:'Hire when the work needs it',h:'Watch the Desk tab’s first and second line table. When you can’t keep up, hire for the line that’s short: analysts for first line, engineers for second line and projects. A hire costs money every month from the day they start, about a month after you hire them.',test:()=>S.staff.length>1,ready:()=>{const N=teamNeed();return backlogDays()>1||(N&&(N.desk>0.8||N.eng>0.8));}},
  {id:'mrr10',t:'Reach £10k MRR',h:'MRR is monthly recurring revenue: what clients pay you every month. It grows from new clients and from selling more to the ones you have.',test:()=>mrr()>=10000},
  {id:'pay',t:'Pay yourself',h:'Once recurring work makes a profit (the Money tab shows it), set yourself a salary there. Going without for too long wears you down.',test:()=>(founderSt()||{}).salary>0},
  {id:'am',t:'Let someone else sell',h:'You can’t sell, deliver and run the company for ever. An account manager looks after a book of clients and finds new work.',test:()=>hasRole('am')},
  {id:'off',t:'Get off the tools',h:'Switch your focus to Running it while the desk keeps hitting 90% SLA.',test:()=>(S.flags.offTools||0)>=1}
];
function guideNext(){if(!S.guide||!S.guide.on)return null;return GUIDE.find(g=>!S.guide.done[g.id]&&(!g.ready||g.ready()))||null;}
function guideTick(){if(!S.guide||!S.guide.on)return;for(const g of GUIDE)if(!S.guide.done[g.id]&&g.test()){S.guide.done[g.id]=S.day;log('Guide: '+g.t+' ✓','good');}if(GUIDE.every(g=>S.guide.done[g.id])&&!S.guide.fin){S.guide.fin=true;log('That’s the guide done. From here it’s your company.','good');}}
function guideBar(){
  let h='';const n=guideNext();
  if(n){const k=GUIDE.indexOf(n);h+='<div class="note" style="margin:0 0 12px;border-left:3px solid var(--p)"><div class="row" style="justify-content:space-between"><b>Guide '+(k+1)+' of '+GUIDE.length+': '+n.t+'</b><button class="linkbtn" data-act="guideOff">Hide the guide</button></div><span class="mut">'+n.h+'</span></div>';}
  for(const q of (S.coachQ||[]).slice(0,2))h+='<div class="note warn" style="margin:0 0 12px"><div class="row" style="justify-content:space-between"><b>Coach</b><button class="linkbtn" data-act="coachOk" data-v="'+q.id+'">Got it</button></div><span>'+q.text+'</span></div>';
  return h;
}
ACT_EXT.guideOff=()=>{S.guide=S.guide||{done:{}};S.guide.on=false;log('Guide hidden. You can bring it back from the footer.','info');};
ACT_EXT.guideOn=()=>{S.guide=S.guide||{done:{}};if(S.guide.on){ACT_EXT.guideOff();return;}S.guide.on=true;if(GUIDE.some(g=>!S.guide.done[g.id]))S.guide.fin=false;else toast('You’ve finished the guide.');};
ACT_EXT.coachOk=v=>{S.coachQ=(S.coachQ||[]).filter(q=>q.id!==v);};
const _sendDeal19=sendDeal;
sendDeal=function(d,pm){S.flags.sent=1;const E=dealEstimate(d,pm);if(!E.project&&E.pct<0)coach('negdeal','You just sent a proposal that loses money every month.','Resold lines like Microsoft 365 have thin margins, and a discount can push them below cost.');_sendDeal19(d,pm);};
const _confirmPlan19=confirmPlan;confirmPlan=function(o){S.flags.planned=1;_confirmPlan19(o);};
const _doReview19=doReview;doReview=function(c,by){if(!by)S.flags.reviewed=1;_doReview19(c,by);};

/* ---------- coach: points out what’s going wrong, never the answer ---------- */
function coach(id,text,hint){const lvl=diff().coach;if(!lvl)return;S.coachNow&&S.coachNow.add(id);S.coachAt=S.coachAt||{};if(S.day-(S.coachAt[id]||-999)<42)return;S.coachAt[id]=S.day;S.coachQ=(S.coachQ||[]).filter(q=>q.id!==id);S.coachQ.unshift({id,d:S.day,text:text+(lvl>1&&hint?' '+hint:'')});if(S.coachQ.length>4)S.coachQ.pop();}
const COACH_EVENT={negdeal:1};
function coachDaily(){
  if(!diff().coach||S.day%3)return;
  S.cs=S.cs||{};const cs=S.cs;S.coachNow=new Set();
  cs.behind=backlogDays()>1.5?(cs.behind||0)+3:0;if(cs.behind>=9)coach('behind','The desk has been behind for over a week, and clients notice when tickets go past their deadlines.','The first and second line table on the Desk tab shows which line is short.');if(cs.behind>=9&&staffOn().length<=2&&S.co.cash<12000)coach('appr','You need hands on the desk but a full salary is a stretch.','An apprentice analyst on the Team tab is cheaper and slow at first, an easier first hire when money is tight.');
  const h=S.hist.slice(-3);if(h.length===3&&h.every(x=>x.recur!=null&&x.recur<0)&&companyPL().op<0)coach('recur','Recurring work has lost money three months running.','The Money tab’s P&L splits gross margin from overheads, which is where to look first.');
  const u=staffOn().find(s=>s.id!=='you'&&started(s)&&s.salary<marketPay(s)*0.9);if(u)coach('underpaid',u.name+'’s pay has fallen well behind the market.','Their staff card shows what’s driving their morale.');
  const c=active().find(c=>c.sat<50&&c.notice==null&&S.day-c.review>63);if(c)coach('unhappy',c.name+' is unhappy and hasn’t had an account review in months.');
  const burnM=burn();if(S.co.cash>0&&S.co.cash<burnM*0.8&&companyPL().op<0)coach('cash','Cash will run out in about a month at this rate.','The bank lends against recurring revenue, but stops after three losing months.');
  if(S.co.cash<0){const lim=OD_LIMIT;coach('overdraft','You’re '+gbp(-S.co.cash)+' into your overdraft'+(lim?' of '+gbp(lim):'')+'. If you go past the limit the bank calls it in and the company is finished.','Cutting costs or a loan buys time; winning work takes longer than you think.');}
  const idle=staffOn().find(s=>techRole(s)&&started(s)&&(s.util||0)<0.4&&S.day-s.start>40);if(idle)coach('idle','You’re paying '+idle.name+' for a lot of time with little to do.');
  if(S.staff.length===1&&S.day>DPM&&S.day<DPM*6&&S.co.mode==='hands'&&mrr()<8000)coach('noleads','You’re still on Hands-on, so none of your day goes on sales and growth will crawl. Switch your focus to Selling or Both, or set a small marketing budget on the Sales tab, to bring in more work.','A young firm picks up a little inbound anyway, but actively selling is much faster.');
  const w=S.deals.find(d=>d.stage==='open'&&d.draft&&S.day-d.created>8);if(w)coach('signoff','A proposal for '+dealName(w)+' has been waiting for your sign-off for over a week.');
  const waiting=S.deals.filter(d=>d.stage==='open'&&!d.draft&&!d.drafter&&d.exp-S.day<=5).length;if(waiting>=2)coach('leads',waiting+' leads will go elsewhere within a week unless someone sends them a proposal.','They’re on the Sales tab.');
  const N=typeof teamNeed==='function'?teamNeed():null;if(N&&freeDesk()<0&&(N.desk>S.staff.filter(s=>s.role==='desk'&&!s.left).length+0.7||N.eng>S.staff.filter(s=>s.role==='eng'&&!s.left).length+0.7))coach('office','The work needs more people, but every desk in the office is taken.','Bigger offices are on the Office tab, and a move takes a few weeks.');
  {const rl=(S.x19&&S.x19.rivalLost)||0;cs.rl=cs.rl||[];cs.rl.push([S.day,rl]);cs.rl=cs.rl.filter(x=>S.day-x[0]<=DPM*2);if(rl-cs.rl[0][1]>=3)coach('rivals','Rivals have won '+(rl-cs.rl[0][1])+' of your clients in the last two months.','The Risk tab compares your support price with the market.');}
  if(typeof toolsCost==='function'&&toolsCost()>1500){const neg=VEND_ORDER.find(k=>vendOn(k)&&VEND[k].base>0&&k!=='dist'&&vendMonthly(k)>400&&S.day-((S.vend[k]||{}).neg||-999)>=DPM*9);if(neg)coach('negvend','You’ve never pushed back on what your vendors charge.','Open a tool from your stack and use Negotiate. Volume gets you a bit off, and a 12-month commitment more; it stacks up across the whole stack.');}
  S.coachQ=(S.coachQ||[]).filter(q=>COACH_EVENT[q.id]?S.day-(q.d||0)<21:S.coachNow.has(q.id));S.coachNow=null;
}
const _tips19=tips;
tips=function(r){const t=_tips19(r);if(S.diff==='hard')return [];if(S.diff==='easy')return t;return t.map(x=>{const m=/^(.+?[.!?])\s+[A-Z]/.exec(x);return m?m[1]:x;});};
/* ---------- glossary ---------- */
const GLOSS={MRR:'Monthly recurring revenue: what clients pay you every month.',ARR:'Annual recurring revenue: MRR × 12.',SLA:'Service level agreement: how fast you’ve promised to answer and fix tickets.',RMM:'Remote monitoring and management: software that watches and patches client machines, cutting tickets.',PSA:'Professional services automation: ticketing, SLA clocks and billing in one system.',EDR:'Endpoint detection and response: security software on every device, watched by a SOC.',SOC:'Security operations centre: people watching security alerts around the clock.',NOC:'Network operations centre: screens and people watching for outages.',M365:'Microsoft 365: email, Office and Teams licences you resell.',P1:'Priority 1: business stopped. Fix within 4 working hours.',P2:'Priority 2: serious, but people can work. 8 working hours.',P3:'Priority 3: normal requests and faults. 3 working days.',P4:'Priority 4: minor or scheduled. 5 working days.',CSAT:'Client satisfaction.',ISO:'ISO 27001: the information security standard bigger clients and regulators expect.',QC:'Quality control: someone reviewing closed tickets to catch mistakes before clients do.'};
const GLOSS_WORDS={'first line':'Simple, quick tickets: passwords, printers, new starters. Service desk analysts handle these.','second line':'Harder problems needing an engineer: servers, networks, security.','onboarding':'Taking a new client on properly: discovery, documentation, tools deployed.','align':'Moving a client off their own product onto your standard one.','as-is':'Supporting a client’s own product without moving them, at the cost of slower tickets.','cross-sell':'Selling another service to an existing client.','gross margin':'Revenue minus what it directly costs to deliver: resold services and technicians’ time.','operating profit':'What’s left after gross margin pays for managers, office, tools and the rest.','utilisation':'The share of someone’s working time spent on actual work.','tender':'A formal bid for a large contract against other MSPs.','discovery':'The first onboarding step: finding out what a client actually has.','probation':'The first six months of employment, when letting someone go is cheap.','dividend':'A payment of profit to you as the owner.','churn':'Clients leaving.','commission':'The bonus account managers earn on what they sell.'};
function glossify(root){
  if(!root)return;const re=/\b(MRR|ARR|SLA|RMM|PSA|EDR|SOC|NOC|M365|P[1-4]|CSAT|ISO 27001|QC)\b/g;
  const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentNode&&!/^(ABBR|BUTTON|SCRIPT|STYLE|TEXTAREA|OPTION)$/.test(n.parentNode.nodeName)&&!n.parentNode.closest('button')&&re.test(n.nodeValue)?1:2});
  const nodes=[];let n;while((n=tw.nextNode()))nodes.push(n);
  for(const t of nodes){re.lastIndex=0;const f=document.createDocumentFragment();let last=0,m;const s=t.nodeValue;while((m=re.exec(s))){f.appendChild(document.createTextNode(s.slice(last,m.index)));const a=document.createElement('abbr');const key=m[1].split(' ')[0];a.title=GLOSS[key]||'';a.textContent=m[1];f.appendChild(a);last=m.index+m[1].length;}f.appendChild(document.createTextNode(s.slice(last)));t.parentNode.replaceChild(f,t);}
}
MODAL_EXT.gloss=(M,x)=>'<div class="dialog wide">'+x+'<p class="kick">Glossary</p><h2>The jargon</h2><p>Hover over underlined terms anywhere in the game to see these.</p><table><tbody>'+Object.entries(GLOSS).map(([k,v])=>'<tr><td><b>'+k+'</b></td><td>'+esc(v)+'</td></tr>').join('')+Object.entries(GLOSS_WORDS).map(([k,v])=>'<tr><td><b>'+k[0].toUpperCase()+k.slice(1)+'</b></td><td>'+esc(v)+'</td></tr>').join('')+'</tbody></table></div>';
ACT_EXT.gloss=()=>{ui.modal={type:'gloss'};};
const _renderPane19=renderPane;
renderPane=function(){const p0=$('pane');const top=p0?p0.scrollTop:0;_renderPane19();const p=$('pane');if(!p)return;const g=guideBar();if(g)p.insertAdjacentHTML('afterbegin',g);glossify(p);p.scrollTop=top;};
const _renderModal19=renderModal;
renderModal=function(){_renderModal19();if(ui.modal&&!['saveCode','diag','map','region'].includes(ui.modal.type))glossify($('modal'));};

/* ---------- save codes and save versions ---------- */
async function packSave(){const o=JSON.parse(JSON.stringify(S));o.log=o.log.slice(0,30);o.build=BUILD;const bytes=new TextEncoder().encode(JSON.stringify(o,(k,v)=>typeof v==='number'&&!Number.isInteger(v)?Math.round(v*1000)/1000:v));
  const cs=new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));const buf=new Uint8Array(await new Response(cs).arrayBuffer());let b='';for(let i=0;i<buf.length;i+=0x8000)b+=String.fromCharCode.apply(null,buf.subarray(i,i+0x8000));return 'T1.'+BUILD+'.'+btoa(b);}
async function unpackSave(code){const m=/^T1\.(\d+)\.(.+)$/s.exec(code.trim().replace(/\s+/g,''));if(!m)throw new Error('That doesn’t look like a Tier One save code.');
  const bin=atob(m[2]);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);const ds=new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'));const txt=await new Response(ds).text();const s=JSON.parse(txt);if(!s||!s.co||!s.staff)throw new Error('The save code is damaged.');return {s,build:+m[1]};}
MODAL_EXT.saveCode=(M,x)=>'<div class="dialog wide">'+x+'<p class="kick">Save code</p><h2>Take your company with you</h2><p>This code holds your whole company. Keep it somewhere safe, or paste one in to load a company on any device.</p><textarea id="saveOut" readonly style="width:100%;height:110px;font:11px/1.3 var(--mono);border:1px solid var(--line);border-radius:8px;padding:8px;background:var(--surface2);color:var(--ink)">'+(ui.saveCode?esc(ui.saveCode):'Making your code…')+'</textarea><div class="row" style="margin:6px 0 14px"><button class="btn sm primary" data-act="saveCopy">Copy code</button><span class="mut" id="saveMsg" style="font-size:.8rem">'+(ui.saveCode?Math.round(ui.saveCode.length/1000)+'k characters, build '+BUILD:'')+'</span></div><h3 style="font-size:.95rem;margin:0 0 6px">Load a company</h3><textarea id="saveIn" placeholder="Paste a save code here" style="width:100%;height:80px;font:11px/1.3 var(--mono);border:1px solid var(--line);border-radius:8px;padding:8px;background:var(--surface);color:var(--ink)"></textarea><div class="foot2"><span class="grow mut" id="loadMsg" style="font-size:.8rem">Loading replaces the company you’re playing now.</span><button class="btn" data-act="saveLoad">Load this company</button></div></div>';
ACT_EXT.saveCode=()=>{ui.saveCode=null;ui.modal={type:'saveCode'};packSave().then(c=>{ui.saveCode=c;if(ui.modal&&ui.modal.type==='saveCode')renderModal();}).catch(()=>{ui.saveCode='Your browser can’t make save codes.';renderModal();});};
ACT_EXT.saveCopy=()=>{ui.keepModal=true;const ta=$('saveOut');const msg=t=>{const e=$('saveMsg');if(e)e.textContent=t;};try{navigator.clipboard.writeText(ta.value).then(()=>msg('Copied.'),()=>{ta.select();msg('Selected. Press Ctrl+C or Cmd+C.');});}catch(e){ta.select();msg('Selected. Press Ctrl+C or Cmd+C.');}};
ACT_EXT.saveLoad=()=>{ui.keepModal=true;const code=($('saveIn')||{}).value||'';const msg=t=>{const e=$('loadMsg');if(e)e.textContent=t;};if(!code.trim()){msg('Paste a save code into the box first.');return;}
  unpackSave(code).then(({s,build})=>{S=s;S.office.slots=S.office.slots||[];migrateSave();setLayout();ui.modal=null;ui.saveCode=null;if(build<19)ui.modal={type:'oldSave',from:build};else S.build=BUILD;nextModal();render();save();log('Company loaded from a save code.','info');}).catch(e=>msg(e.message||'That code didn’t work.'));};
MODAL_EXT.oldSave=(M,x)=>'<div class="dialog"><p class="kick">Older company</p><h2>This company started in build '+(M.from||'an early build')+'</h2><p>The game is now on build '+BUILD+'. Rules have changed since, so parts of this company may behave oddly: contracts, service levels, pay and prices have all been reworked. You can carry on, or start fresh and get the game as it’s meant to be played.</p><div class="choices"><button class="choice" data-act="oldKeep"><b>Carry on with this company</b><span>Things may not add up for a while.</span></button><button class="choice" data-act="saveCode"><b>Keep a save code first</b><span>So you can come back to it.</span></button><button class="choice" data-act="newgame"><b>Start a new company</b><span>Recommended.</span></button></div></div>';
ACT_EXT.oldKeep=()=>{S.build=BUILD;ui.modal=null;};

/* ---------- when it goes wrong: a post-mortem ---------- */
function postMortem(){
  const h=S.hist.slice(-12),out=[];if(!h.length)return '';
  const L=S.last&&S.last.L;if(L&&L.rec)out.push('In your last month, salaries were '+pct(L.sal/Math.max(1,L.rec))+' of recurring revenue. Healthy MSPs keep people costs to about 55–60%.');
  const neg=h.filter(x=>x.recur!=null&&x.recur<0).length;if(neg)out.push('Recurring work lost money in '+neg+' of your last '+h.length+' months.');
  const hires=(S.hireLog||[]).filter(x=>S.day-x.d<DPM*6);if(hires.length)out.push('You hired '+hires.length+' '+(hires.length>1?'people':'person')+' in your last six months: '+hires.map(x=>x.role).join(', ')+'.');
  if(S.co.loan)out.push('You were £'+Math.round(S.co.loan).toLocaleString('en-GB')+' in debt to the bank.');
  const missed=Object.keys(S.coachAt||{}).length;if(missed)out.push('The coach raised '+missed+' different warning'+(missed>1?'s':'')+' along the way.');
  return '<h3 style="font-size:1rem;margin:10px 0 4px">What happened</h3>'+out.map(t=>'<p class="note">'+esc(t)+'</p>').join('');
}
const _hire19=hire;hire=function(c){const n=S.staff.length;_hire19(c);if(S.staff.length>n)(S.hireLog=S.hireLog||[]).push({d:S.day,role:ROLES[c.role].short.toLowerCase()});};

/* ---------- late game: the market gets tougher ---------- */
const _refPrice19=refPrice;refPrice=k=>_refPrice19(k)*((k==='support'||k==='security')?(S.mktIdx||1):1);
const _monthEnd19=monthEnd;
monthEnd=function(){_monthEnd19();const h=S.hist[S.hist.length-1];if(h)h.recur=S.last&&S.last.recur;corpTax();
  if(monthOf(S.day)%12===0&&S.day>0){S.mktIdx=(S.mktIdx||1)*1.015;log('Across the market, managed support prices rose about 1.5% this year, half the rise in wages, as bigger players compete on price.','event');}
  auditCheck();};
/* rivals quote your clients when contracts come up, and harder once you’re big enough to notice */
const RIVALS=['Castlegate IT','Nene Valley Tech','Silverline Managed Services','Pinnacle Support','Watling Digital'];
function rivalKeep(c){const am=amOf(c);const pr=priceRatio(c);return clamp(0.1+c.trust/300+c.sat/300+(hasRole('sdm')?0.05:0)+(am?(am.skill||2)*0.02:0)-Math.max(0,pr-1.03)*1.5,0.1,0.85);}
function rivalDaily(){
  if(S.day%DPM!==7||active().length<5)return;
  const size=1+Math.min(2.5,mrr()/80000),m=diff().rival;let modal=false;
  for(const c of active()){if(c.notice!=null||c.ending||!canLeave(c)||S.day-(c.rivalAt||-999)<DPM*6||S.day-c.since<DPM*3)continue;
    const pr=priceRatio(c);const p=0.03*size*m*(pr>1.03?1+(pr-1)*8:0.8)*(c.sat<60?2:1)*(S.day-c.review>DPM*5?1.5:1);
    if(Math.random()>=p)continue;
    c.rivalAt=S.day;x19('rival');const rv=rivalFor(c);const r=rv?rv.name:pick(RIVALS),cut=Math.round(clamp((pr-1)*100+ri(5,12),6,30));const am=amOf(c);
    if(am&&present(am)){am.busyH=(am.busyH||0)+4;if(Math.random()<rivalKeep(c)){c.trust=Math.min(100,c.trust+3);if(c.term>1)c.termEnd=Math.max(c.termEnd,S.day+c.term*DPM);log(am.name+' fought off '+r+' at '+c.name+'.','good');}else{x19('rivalLost');x19('rivalLostMRR',clientMRR(c));c.notice=noticeDay(c);c.ending=true;c.why='rival';c.rivalCut=cut;c.rivalBy=r;rivalWins(r);log(r+' undercut you by '+cut+'% and won '+c.name+', despite '+am.name.split(' ')[0]+'’s efforts. They leave on '+dLabel(c.notice)+'.','bad');}continue;}
    if(!modal){modal=true;S.hq.push({id:'rival',ctx:{cid:c.id,r,cut}});}
    else if(Math.random()>=rivalKeep(c)*0.8){x19('rivalLost');x19('rivalLostMRR',clientMRR(c));c.notice=noticeDay(c);c.ending=true;c.why='rival';c.rivalCut=cut;c.rivalBy=r;rivalWins(r);log(r+' quoted '+c.name+' '+cut+'% less and won them. Nobody from your side got in touch. They leave on '+dLabel(c.notice)+'.','bad');}
  }
}
HUMAN.rival={w:0,ok:()=>false,make:x=>{const c=C(x.cid);if(!c||c.notice!=null)throw 0;const am=amOf(c);const who=am?am.name.split(' ')[0]:'you';const keep=rivalKeep(c);
  const lose=()=>{x19('rivalLost');x19('rivalLostMRR',clientMRR(c));c.notice=noticeDay(c);c.ending=true;c.why='rival';c.rivalCut=x.cut;c.rivalBy=x.r;rivalWins(x.r);log(c.name+' is moving to '+x.r+'. They leave on '+dLabel(c.notice)+'.','bad');};
  return {kicker:'Competition',title:x.r+' has quoted '+c.name+' '+x.cut+'% less',body:c.name+' pays you '+gbp(clientMRR(c))+' a month'+(c.term>1?' and their contract is up for renewal':'')+'. Satisfaction '+Math.round(c.sat)+', trust '+Math.round(c.trust)+'. They’ve asked whether you want to respond.',
    choices:[
      {label:'Match their price',note:'Keeps them, at '+x.cut+'% less a month from now on.',go(){for(const k in c.svc)c.svc[k].pm*=1-x.cut/100;c.sat=Math.min(100,c.sat+4);log('You matched '+x.r+'’s price for '+c.name+'.','event');}},
      {label:'Meet them and make your case',note:'Half a day of '+(am?who+'’s':'your')+' time. How well it goes depends on how they feel about you.',go(){if(am)am.busyH=(am.busyH||0)+4;else S.co.busy=(S.co.busy||0)+4;if(Math.random()<keep){c.trust=Math.min(100,c.trust+4);if(c.term>1)c.termEnd=Math.max(c.termEnd,S.day+c.term*DPM);log(c.name+' is staying with you.','good');}else lose();}},
      {label:'Let them decide',note:'No time, no discount. Happy clients usually stay.',go(){if(Math.random()<keep*0.8)log(c.name+' decided to stay.','good');else lose();}}]};}};
/* quality at scale: more people, more mistakes, unless you build process */
function procScore(avg){const q=avg?(S.qcAvg!=null?S.qcAvg:(S.qc||0)):(S.qc||0);const pp=(typeof psaProc==='function')?psaProc():(vendOn('psa')?0.25:0);const dp=(typeof docsProc==='function')?docsProc():(vendOn('docs')?0.25:0);return 1+pp+dp+q*0.35+(S.co.iso?0.4:0)+(S.co.compl?0.3:0)+(hasRole('sdm')?0.15:0);}
function chaos(){const tech=staffOn().filter(s=>techRole(s)).length;return Math.max(1,tech/8)/procScore();}
const QC_RATE=[0,0.05,0.2];
function qcDaily(W){if(!S.qc)return;const closed=W.reduce((a,w)=>a+(w.done||0),0);const hrs=closed*QC_RATE[S.qc]*0.25;const d=W.filter(w=>w.st.role==='desk'||w.st.role==='hdm').sort((a,b)=>b.st.skill-a.st.skill)[0];if(d)d.st.qcH=(d.st.qcH||0)+hrs;S.qcM=(S.qcM||0)+closed*QC_RATE[S.qc];}
/* two stages: big clients audit their suppliers; then, at real scale, the regulator does */
const auditable=()=>staffOn().length>=25||mrr()>=120000;
const regulated=()=>staffOn().length>=50||mrr()>=600000;
function passChance(){return clamp(0.15+(procScore(true)-1)*0.45,0.1,0.95);}
function regDaily(){
  if(auditable()&&!S.co.aud){S.co.aud=S.day;S.co.auditAt=S.day+DPM*12;S.hq.push({id:'regIntro',ctx:{stage:1}});}
  if(regulated()&&!S.co.reg){S.co.reg=S.day;S.hq.push({id:'regIntro',ctx:{stage:2}});}
  /* incidents grow with the estate you look after */
  if(S.day%DPM===11&&active().length>=8)for(const c of supported()){if(S.day-(c.ransomAt||-999)<DPM*8)continue;
    const p=0.0009*Math.sqrt(c.seats)*(c.svc.security?0.3:1)*(c.svc.backup?0.8:1)*(S.diff==='hard'?1.3:S.diff==='easy'?0.7:1);
    if(Math.random()<p){c.ransomAt=S.day;x19('scaledIncident');let e=null;try{e=EVENTS.ransomware.make({cid:c.id});}catch(err){}if(e&&e.news)e.go();else if(e)S.hq.push({id:'ransomware',ctx:{cid:c.id}});break;}}
}
HUMAN.regIntro={w:0,ok:()=>false,make:x=>x.stage===2?
  {kicker:'Regulation',title:S.co.name+' is now a regulated MSP',body:'You’re now a medium-sized MSP, and the new UK cyber rules for managed service providers apply. Significant incidents at clients must be reported to the regulator within 24 hours, and the annual audit is now the regulator’s, with fines for failing it.',choices:[{label:'Understood',note:'The Risk tab has the details.',go(){log('You are now a regulated MSP. Check the Risk tab.','event');}}]}:
  {kicker:'Client audits',title:'Your bigger clients want to audit you',body:'At your size, clients’ insurers and boards start asking how you look after their data. From now on you’ll face a yearly supplier security audit. Fail it and the clients who care most may use it to leave.',choices:[{label:'Understood',note:'The Risk tab shows your chances.',go(){log('Supplier security audits start in a year. Check the Risk tab.','event');}}]}};
const _bigTickets19=bigTickets;
bigTickets=function(c,n,h,l,subj){_bigTickets19(c,n,h,l,subj);if(c&&S.co.reg&&/Ransomware/.test(subj||''))incident(c);};
function incident(c){x19('incident');
  if(S.co.compl){log('Your compliance consultant reported the ransomware at '+c.name+' to the regulator within the day.','info');return;}
  S.hq.push({id:'incident',ctx:{cid:c.id}});
}
HUMAN.incident={w:0,ok:()=>false,make:x=>{const c=C(x.cid);if(!c)throw 0;const h=mgrOf('hdm');
  const fine=()=>Math.round(clamp(mrr()*12*0.04,25000,600000)/1000)*1000;
  const risky=(p,who)=>{if(Math.random()<p){const f=fine()*(insCover()?0.3:1);S.co.fineDue={d:S.day+ri(40,90),amt:Math.round(f),who};}};
  const ch=[{label:'Report it yourself',note:'Half a day of your time and some paperwork. Safe.',go(){S.co.busy=(S.co.busy||0)+4;log('You reported the incident at '+c.name+' to the regulator.','info');}}];
  if(h)ch.push({label:'Leave the call to '+h.name.split(' ')[0],note:'Your helpdesk manager decides. They know the incident, but this isn’t their job.',go(){if(Math.random()<0.55)log(h.name+' reported the incident at '+c.name+'.','info');else{log(h.name+' decided it didn’t need reporting.','info');risky(0.5,h.name);}}});
  ch.push({label:'Don’t report it',note:'Saves the time. If the regulator finds out later, it’s a fine.',go(){risky(0.4,'you');log('You decided not to report the incident at '+c.name+'.','info');}});
  return {kicker:'Regulation · 24 hours to decide',title:'Do you report the ransomware at '+c.name+'?',body:'As a regulated MSP, significant incidents at clients must be reported within 24 hours. Someone has to make the call.',choices:ch};}};
function auditCheck(){
  if(S.co.fineDue&&S.day>=S.co.fineDue.d){const f=S.co.fineDue;S.co.fineDue=null;x19('fine',f.amt);S.co.cash-=f.amt;S.m.other+=f.amt;S.co.rep=Math.max(5,S.co.rep-6);log('The regulator found an unreported incident. Fine: '+gbp(f.amt)+(insCover()?' after insurance':'')+'.','bad');}
  if(!S.co.aud||S.day<(S.co.auditAt||1e9))return;S.co.auditAt=S.day+DPM*12;
  const who=S.co.reg?'The regulator’s':'The supplier security';
  if(Math.random()<passChance()){S.co.rep=Math.min(100,S.co.rep+2);S.co.auditFails=0;log(who+' audit passed.','good');if(S.report)S.report.audit=who+' audit passed. Next one in a year.';return;}
  S.co.auditFails=(S.co.auditFails||0)+1;S.co.auditAt=S.day+DPM*6;S.co.rep=Math.max(5,S.co.rep-(S.co.reg?8:6));
  let f=0;if(S.co.reg){f=Math.round(clamp(mrr()*12*0.02,20000,400000)*(insCover()?0.3:1)/1000)*1000;S.co.cash-=f;S.m.other+=f;}
  x19('auditFail',f||1);
  const share=S.co.auditFails>=2?0.1:0.04;
  const cs=active().filter(c=>c.notice==null&&!c.ending&&c.seats>=15).sort((a,b)=>b.seats-a.seats).slice(0,Math.max(1,Math.round(active().length*share)));
  for(const c of cs){c.notice=S.day+DPM;c.ending=true;c.why='audit';}x19('auditExodus',cs.length);
  log(who+' audit failed on weak processes and documentation'+(f?'. Fine: '+gbp(f):'')+'. '+cs.length+' of your bigger client'+(cs.length===1?' is':'s are')+' using it to end their contract'+(cs.length===1?'':'s')+' early'+(S.co.auditFails>=2?', and word is getting round':'')+'. The auditors will be back in six months.','bad');if(S.report)S.report.audit=who+' audit failed'+(f?', fine '+gbp(f):'')+'. '+cs.length+' client'+(cs.length===1?' is':'s are')+' leaving. The auditors return in six months.';
}
function paneRisk(){
  const pc=procScore(),ch=chaos(),tech=staffOn().filter(s=>techRole(s)).length;
  let h='<div class="sec"><h3>Quality</h3><p class="lede">The more people you have, the more mistakes slip through, unless you build process around them. Mistakes mean reopened tickets, unhappy clients and, once you’re regulated, failed audits.</p><div class="tiles"><div class="tile"><span class="k">Process</span><span class="v">'+pc.toFixed(2)+'</span><small>ticketing, docs, QC, ISO, compliance</small></div><div class="tile"><span class="k">Mistake risk</span><span class="v '+(ch>1.3?'neg':ch>1?'wrn':'pos')+'">×'+ch.toFixed(2)+'</span><small>'+tech+' technician'+(tech===1?'':'s')+'</small></div><div class="tile"><span class="k">QC last month</span><span class="v">'+Math.round(S.qcLast||0)+'</span><small>tickets reviewed</small></div></div>';
  h+='<p class="lede" style="margin:10px 0 4px">Ticket QC: a senior analyst reviews closed tickets and catches bad fixes before clients do.</p><div class="seg">'+[['Off','no reviews'],['Light','1 in 20 tickets'],['Thorough','1 in 5 tickets']].map((o,i)=>'<button data-act="qc" data-v="'+i+'" aria-pressed="'+((S.qc||0)===i)+'">'+o[0]+'<small>'+o[1]+'</small></button>').join('')+'</div></div>';
  h+='<div class="sec"><h3>The market</h3><p class="lede">Managed support prices across the market creep up about 1.5% a year while wages rise about 3%, so standing still squeezes your margin. Rivals quote your clients when their contracts come up, more often if you charge over the market, if clients are unhappy, or if nobody has reviewed them in a while.</p><p class="mut" style="font-size:.84rem">Market support price now: £'+refPrice('support').toFixed(2)+' a user. Yours: £'+S.price.support.toFixed(2)+'.</p></div>';
  return h;
}
ACT_EXT.qc=v=>{v=Math.round(+v);if(v>=0&&v<=2)S.qc=v;};
ACT_EXT.iso=()=>{if(S.co.iso||S.co.isoAt)return;spend(15000);S.co.isoAt=S.day;_bigTickets19(null,4,15,2,'Internal: ISO 27001 controls and evidence');log('ISO 27001 certification under way. The team has about 60 hours of work to do.','event');};
ACT_EXT.insure=()=>{S.co.insured=!S.co.insured;S.co.insAt=S.day;log(S.co.insured?'Cyber insurance in place.':'Cyber insurance cancelled.','info');};
ACT_EXT.compl=()=>{S.co.compl=!S.co.compl;log(S.co.compl?'A compliance consultant now owns incident reporting and audits.':'Compliance consultant contract ended.','info');};

/* ---------- daily ---------- */
const _peopleDaily19=peopleDaily;
peopleDaily=function(W){_peopleDaily19(W);sdmReviews();guideTick();coachDaily();rivalDaily();regDaily();qcDaily(W);
  if(S.co.isoAt&&!S.co.iso&&!S.tickets.some(t=>/ISO 27001/.test(t.subj))){S.co.iso=true;log('ISO 27001 certified.','good');}
  if(S.co.insured)spend(insPrem()/DPM);for(const k in S.vend)if(vendOn(k)&&S.vend[k].onAt==null)S.vend[k].onAt=S.day;if(S.co.compl)spend(2500/DPM);
  if(S.day%DPM===0){S.qcLast=S.qcM||0;S.qcM=0;}S.qcAvg=(S.qcAvg!=null?S.qcAvg:(S.qc||0))*(1-1/(DPM*12))+(S.qc||0)/(DPM*12);
  S.co.intAcc=(S.co.intAcc||0)+(S.co.loan*LOAN_APR+(S.co.cash<0?-S.co.cash*OD_APR:0))/(DPM*12);
};
/* QC catches issues: fewer reopens and softer mistakes */
function qcCut(){return [0,0.3,0.6][S.qc||0];}

ACT_EXT.diffSel=v=>{const a=$('fName'),b=$('fCo');if(a)ui.fName=a.value;if(b)ui.fCo=b.value;ui.diff=v;};
function x19(k,v){S.x19=S.x19||{};S.x19[k]=(S.x19[k]||0)+(v==null?1:v);}
function trainCostOf(s){return Math.round(900*(1+(s.skill||1)*0.5)*(S.office.rooms.training?0.5:1)/50)*50;}
/* seeded randomness: reloading a save replays the same outcomes */
const _nativeRand=Math.random;
function srand(){let t=(S.seed=(S.seed+0x6D2B79F5)|0);t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}
function seeded(fn){return function(){if(!S||S.seed==null)return fn.apply(this,arguments);const prev=Math.random;Math.random=srand;try{return fn.apply(this,arguments);}finally{Math.random=prev;}};}
step=seeded(step);act=seeded(act);
const _newState19=newState;newState=function(a,b){const r=_newState19(a,b);S.seed=(_nativeRand()*2147483647)|0;return r;};
const _migrateSave19=migrateSave;migrateSave=function(){_migrateSave19();if(S.seed==null)S.seed=(_nativeRand()*2147483647)|0;S.flags=S.flags||{};};
function insPrem(){return Math.round(Math.max(150,mrr()*0.008));}
function insCover(){return S.co.insured&&S.day-(S.co.insAt||0)>=DPM*3;}
/* corporation tax, paid each January on last year's profit */
function taxOn(p){return p<=50000?p*0.19:p>=250000?p*0.25:9500+(p-50000)*0.265;}
function corpTax(){if(monthOf(S.day)%12!==0||S.hist.length<2)return;
  const yr=S.hist.slice(-12).reduce((a,x)=>a+(x.profit||0),0);
  /* capital events — selling firms, branches, shares, or raising equity — aren't trading profit,
     so they're stripped out of the tax base rather than taxed as gross income */
  const cap=Math.max(0,S.co.capYr||0);S.co.capYr=0;
  let p=yr-cap-(S.co.taxLoss||0);
  if(p<=0){S.co.taxLoss=Math.max(0,-p);return;}S.co.taxLoss=0;
  const t=Math.round(taxOn(p));S.co.cash-=t;(S.co.taxLog=S.co.taxLog||[]).push({d:S.day,v:t,p:Math.round(p)});if(S.report)S.report.tax=t;
  log('Corporation tax of '+gbp(t)+' paid on last year’s trading profit of '+gbp(Math.round(p))+'.','event');}
const _lpm19=leadsPerMonth;leadsPerMonth=function(){const L=S.co.mkt||0;return _lpm19()+(L?[0,1,2,3][L]*(0.6+S.co.rep/100)*marketRoom():0);};
/* a short message for actions that can't happen */
function toast(t){try{let e=document.getElementById('toast');if(!e){e=document.createElement('div');e.id='toast';e.setAttribute('role','status');e.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:99;max-width:min(92vw,460px);padding:10px 14px;border-radius:10px;background:var(--ink);color:var(--surface);font-size:.86rem;box-shadow:0 6px 24px rgba(0,0,0,.25);transition:opacity .3s';document.body.appendChild(e);}e.textContent=t;e.style.opacity='1';clearTimeout(e._t);e._t=setTimeout(()=>{e.style.opacity='0';},3200);}catch(err){}}
/* a service delivery manager runs the reviews for clients in your own book */
function sdmReviews(){const m=S.staff.find(s=>s.role==='sdm'&&present(s));if(!m||S.day%2||(m.busyH||0)>4)return;const c=active().filter(reviewDue).sort((a,b)=>a.review-b.review)[0];if(c){doReview(c,m);}}
/* an event that turned into a news item by the time it came up (or was built wrong) never blocks the game */
const _pendingEvent19=pendingEvent;
pendingEvent=function(){const e=_pendingEvent19();if(e&&!(Array.isArray(e.choices)&&e.choices.length)){S.pending=null;try{if(typeof e.go==='function')e.go();}catch(err){}if(ui.modal&&ui.modal.type==='event')ui.modal=null;return null;}return e;};
