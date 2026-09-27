
/* ============ build 77: Legal & Compliance tab ============
   One place for legal trouble and compliance: active lawsuits and threats,
   fines, buried-breach risk, certifications, insurance, counsel, regulatory
   and audit status, plus a durable history. Pulls the actions in too. */

/* durable history: capture legal/compliance-relevant log lines */
if(typeof log==='function'){
  const _log=log;
  const RE=/(is suing you|taking you to (a )?tribunal|employment tribunal|\btribunal\b|settled with|lost the case|won the case|defending the claim|in damages|the regulator|a fine of|fined you|\bFine:|gone into administration|into administration|data breach|disclosed the breach|kept quiet|never made the news|Cyber Essentials Plus certified|ISO \d{4,5}[^.]{0,40}certif|certification under way|professional indemnity|indemnity cover|legal counsel|compliance consultant|audit passed|audit failed|failed the [^.]*audit|passed the [^.]*audit|convicted|disqualified|caretaker MD)/i;
  log=function(text,kind){_log(text,kind);try{if(S&&RE.test(text||'')){S.legalLog=S.legalLog||[];S.legalLog.unshift({d:S.day,text,kind:kind||'info'});if(S.legalLog.length>80)S.legalLog.pop();}}catch(e){}};
}

function isoHoursLeft(){return Math.round((S.tickets||[]).filter(t=>/ISO 27001/.test(t.subj||'')).reduce((a,t)=>a+t.left,0));}
function legalOpenCount(){return (S.suits||[]).length+(S.suitQ||[]).length+((S.co.fineDue)?1:0)+((S.co.cover)?1:0)+((S.co.disq>S.day)?1:0);}

function paneLegal(){
  const co=S.co;
  const suits=S.suits||[],threats=S.suitQ||[];
  let h='<div class="sec"><h3>Legal &amp; compliance</h3><p class="lede">Your legal standing and compliance posture in one place: live matters, your certifications and cover, and the history. Bigger, better-run firms attract bigger claims, so cover and process matter.</p>';
  // status tiles
  const open=legalOpenCount();
  const regTxt=co.reg?'Regulated MSP':co.aud?'Client-audited':'Unregulated';
  h+='<div class="tiles"><div class="tile"><span class="k">Open matters</span><span class="v '+(open?'neg':'pos')+'">'+open+'</span><small>'+(open?'need attention':'all clear')+'</small></div>'+
    '<div class="tile"><span class="k">Indemnity cover</span><span class="v '+(co.pi?'pos':'')+'">'+(co.pi?'Yes':'None')+'</span><small>'+(co.pi?'£'+gbp(piPrem()).slice(1)+'/mo · £25k excess':'exposed above £0')+'</small></div>'+
    '<div class="tile"><span class="k">Regulation</span><span class="v">'+regTxt+'</span><small>'+(co.aud?'next audit '+mLabel(monthOf(co.auditAt)):'not yet audited')+'</small></div>'+
    '<div class="tile"><span class="k">Lawsuits faced</span><span class="v">'+((S.x19&&S.x19.suit)||0)+'</span><small>lifetime</small></div></div></div>';

  // active matters
  h+='<div class="sec"><h3 style="font-size:.98rem">Active matters</h3>';
  if(!open)h+='<p class="empty">Nothing outstanding. No claims, fines or investigations right now.</p>';
  else{h+='<ul class="list">';
    if(co.disq>S.day)h+='<li class="item"><span><b class="neg">You are disqualified as a director</b></span><span class="r neg">until '+dLabel(co.disq)+'</span><span class="sub">'+(co.caretaker?'A caretaker MD is running the firm.':'Appoint a caretaker or sell.')+'</span></li>';
    for(const s of suits)h+='<li class="item"><span><b>'+esc(s.who)+'</b> <span class="mut">'+(s.kind==='tribunal'?'tribunal':s.kind+' claim')+'</span></span><span class="r neg">'+gbp(s.claim)+'</span><span class="sub">Defending · win chance ~'+pct(s.w)+' · fees '+gbp(s.fee)+'/mo'+(covered(s.kind)?' (insured)':'')+' · decision ~'+dLabel(s.end)+'</span></li>';
    for(const t of threats)h+='<li class="item"><span><b>'+esc(t.who||'A claimant')+'</b> <span class="mut">'+(t.kind==='tribunal'?'tribunal':t.kind+' claim')+' · threatened</span></span><span class="r wrn">'+gbp(t.claim)+'</span><span class="sub">A claim is being prepared, expected around '+dLabel(t.d)+'.</span></li>';
    if(co.fineDue)h+='<li class="item"><span><b class="neg">Regulator fine</b> <span class="mut">'+esc(co.fineDue.who||'')+'</span></span><span class="r neg">'+gbp(co.fineDue.amt)+'</span><span class="sub">Due around '+dLabel(co.fineDue.d)+'.</span></li>';
    if(co.cover)h+='<li class="item"><span><b class="wrn">A breach you didn’t disclose</b></span><span class="r wrn">exposure</span><span class="sub">'+(co.cover.ids?co.cover.ids.length+' clients affected. ':'')+'Could surface by around '+dLabel(co.cover.d)+', which would be far worse than owning it now.</span></li>';
    h+='</ul>';}
  h+='</div>';

  // compliance & cover, with actions
  const row=(name,status,cls,desc,actBtn)=>'<li class="item"><span><b>'+name+'</b></span><span class="r '+(cls||'')+'">'+status+'</span><span class="sub">'+desc+(actBtn?'<span class="row" style="margin-top:6px">'+actBtn+'</span>':'')+'</span></li>';
  h+='<div class="sec"><h3 style="font-size:.98rem">Certifications &amp; cover</h3><ul class="list">';
  h+=row('Cyber Essentials Plus',co.ce?'Certified':gbp(2400),co.ce?'pos':'',
    'The UK baseline security certificate. Most tenders ask for it; small reputation lift.',
    co.ce?'':'<button class="btn sm" data-act="getCE">Get certified · '+gbp(2400)+'</button>');
  h+=row('ISO 27001 (information security)',co.iso?'Certified':co.isoAt?'In progress':gbp(15000),co.iso?'pos':co.isoAt?'wrn':'',
    'The information security standard. Wins bigger tenders and eases audits.'+(co.isoAt&&!co.iso?' <b>About '+isoHoursLeft()+' engineer hours of work left.</b>':''),
    (co.iso||co.isoAt)?'':'<button class="btn sm" data-act="iso">Start certification · '+gbp(15000)+'</button>');
  if(typeof ISO_CERTS!=='undefined')for(const k of ['iso9001','iso20000','iso22301','iso14001']){const IC=ISO_CERTS[k];if(!IC)continue;
    h+=row(IC.t,co[k]?'Certified':co[k+'At']?'In progress':gbp(IC.cost),co[k]?'pos':co[k+'At']?'wrn':'',
      IC.desc+(co[k+'At']&&!co[k]?' <b>Due around '+dLabel(co[k+'Done'])+'.</b>':''),
      (co[k]||co[k+'At'])?'':'<button class="btn sm" data-act="isoCert" data-v="'+k+'">Start certification · '+gbp(IC.cost)+'</button>');}
  h+=row('Professional indemnity',co.pi?gbp(piPrem())+'/mo':'None',co.pi?'pos':'',
    'Covers damages and legal fees above a £25,000 excess when a client sues over a breach or the service. Claims pay only once the policy is three months old'+(co.pi&&S.day-(co.piAt||0)<DPM*3?'. <b class="wrn">Still too new to claim on.</b>':(co.pi?' (active).':'.'))+(co.piMult>1?' Premium loaded ×'+(co.piMult).toFixed(2)+' after claims.':''),
    '<button class="btn sm" data-act="piToggle">'+(co.pi?'Cancel cover':'Take out cover')+'</button>');
  h+=row('In-house legal counsel',co.counsel?'Engaged':'None',co.counsel?'pos':'',
    'Halves your legal fees and improves your odds in a dispute.',
    '<button class="btn sm" data-act="counselToggle">'+(co.counsel?'Let them go':'Appoint counsel')+'</button>');
  h+=row('Compliance consultant',co.compl?'Engaged':'None',co.compl?'pos':'',
    'Owns incident reporting and audit prep, so regulated incidents get reported on time for you.',
    '<button class="btn sm" data-act="compl">'+(co.compl?'End contract':'Engage')+'</button>');
  h+='</ul></div>';

  // regulatory / audit status
  h+='<div class="sec"><h3 style="font-size:.98rem">Regulation &amp; audits</h3>';
  if(co.aud)h+='<p class="note'+(passChance()<0.6?' warn':'')+'">'+(co.reg?'You’re a regulated MSP: significant client incidents must be reported within 24 hours, and failing the annual regulator audit means a fine as well as lost clients.':'Your bigger clients audit you every year; failing means some of them leave.')+' Next audit around '+mLabel(monthOf(co.auditAt))+'. Pass chance on the past year of process: about '+pct(passChance())+'.'+(co.auditFails?' <b class="neg">'+co.auditFails+' recent failure'+(co.auditFails>1?'s':'')+'.</b>':'')+'</p>';
  else h+='<p class="lede">Not audited yet. From about 25 staff or £120k MRR bigger clients start auditing you yearly; from about 50 staff or £600k MRR the UK cyber rules for MSPs apply (24-hour incident reporting and regulator audits with fines). Process, ISO and a compliance consultant all raise your pass chance.</p>';
  h+='</div>';

  // history
  const hist=S.legalLog||[];
  if(hist.length)h+='<div class="sec"><h3 style="font-size:.98rem">History</h3><ul class="news">'+hist.slice(0,40).map(l=>'<li class="'+(l.kind==='good'?'good':l.kind==='bad'?'bad':l.kind==='event'?'event':'')+'"><time>'+dLabel(l.d)+'</time><span>'+esc(l.text)+'</span></li>').join('')+'</ul></div>';
  else h+='<div class="sec"><h3 style="font-size:.98rem">History</h3><p class="empty">No legal or compliance events yet. Suits, fines, audits and certifications will be logged here as they happen.</p></div>';

  return h;
}

/* register the tab in the Business group */
if(typeof TABS!=='undefined'&&!TABS.some(t=>t[0]==='legal')){
  TABS.push(['legal','Legal']);TAB_LABEL.legal='Legal';
  const g=GROUPS.find(x=>x.k==='business');if(g&&!g.tabs.includes('legal'))g.tabs.push('legal');
}
if(typeof renderPane==='function'){
  const _rp=renderPane;
  renderPane=function(){if(ui.tab==='legal'){const p=$('pane');const top=p.scrollTop;p.innerHTML=paneLegal();p.scrollTop=top;return;}return _rp.apply(this,arguments);};
}

/* Legal is merged into the Risk tab (see zzr.js appends paneLegal there); no pointer needed */
