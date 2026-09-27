
/* ============ modals ============ */
function nextModal(){
  if(!S)return;
  if(S.intro){ui.modal={type:'intro'};return;}
  if(S.over){ui.modal={type:'over'};return;}
  if(ui.modal)return;
  if(S.report){ui.modal={type:'report'};return;}
  if(S.pending){ui.modal={type:'event'};return;}
  if(S.mq&&S.mq.length){ui.modal={type:'mq'};return;}
}
function closeModal(){ui.modal=null;ui.confirm=false;nextModal();render();}
function renderModal(){
  const m=$('modal');const M=ui.modal;
  if(!M){m.hidden=true;m.innerHTML='';return;}
  try{
  let h='';
  const x='<button class="x" data-act="close" aria-label="Close">×</button>';
  if(M.type==='intro'){
    h='<div class="dialog"><p class="kick">A managed services sim</p><h2>Tier One</h2><p>You’ve left your job with two telephony clients and a laptop. Build them into a proper MSP: take on support, hire a desk, sell projects, keep the stack lean and the clients happy. Time runs on its own; pause whenever you like.</p>'+
      '<div class="field"><label for="fName">Your name</label><input id="fName" maxlength="24" value="'+esc(ui.fName||'Jason')+'" autocomplete="off"></div>'+
      '<div class="field"><label for="fCo">Company name</label><input id="fCo" maxlength="28" value="'+esc(ui.fCo||'Northbridge IT')+'" autocomplete="off"></div>'+
      '<div class="field"><label>Difficulty</label><div class="seg">'+Object.entries(DIFF).map(([k,v])=>'<button data-act="diffSel" data-v="'+k+'" aria-pressed="'+((ui.diff||'normal')===k)+'">'+v.t+'<small>'+v.d+'</small></button>').join('')+'</div></div>'+
      '<div class="foot2"><span class="grow mut" style="font-size:.8rem">Starts January 2027 with '+gbp(DIFF[ui.diff||'normal'].cash)+' in the bank.</span><button class="btn primary" data-act="start">Open for business</button></div></div>';
  }else if(M.type==='event'){
    const e=pendingEvent();if(!e){ui.modal=null;return renderModal();}
    h='<div class="dialog"><p class="kick">'+e.kicker+'</p><h2>'+esc(e.title)+'</h2><p>'+esc(e.body)+'</p><div class="choices">'+e.choices.map((ch,i)=>'<button class="choice" data-act="choose" data-v="'+i+'"><b>'+esc(ch.label)+'</b><span>'+esc(ch.note)+'</span></button>').join('')+'</div></div>';
  }else if(M.type==='report'){
    const r=S.report;const L=r.L;
    h='<div class="dialog"><p class="kick">Month end</p><h2>'+r.label+'</h2>'+
      '<div class="tiles"><div class="tile"><span class="k">MRR</span><span class="v">'+gbp(r.mrr)+'</span></div><div class="tile"><span class="k">'+(r.profit>=0?'Profit':'Loss')+'</span><span class="v '+(r.profit<0?'neg':'pos')+'">'+gbp(r.profit)+'</span></div><div class="tile"><span class="k">Cash</span><span class="v '+(r.cash<0?'neg':'')+'">'+gbp(r.cash)+'</span></div><div class="tile"><span class="k">SLA</span><span class="v">'+pct(r.sla)+'</span></div></div>'+
      '<p style="margin-top:12px">'+L.won+' deal'+(L.won===1?'':'s')+' won, '+L.lost+' lost, '+L.newc+' new client'+(L.newc===1?'':'s')+(r.gone.length?', lost '+r.gone.map(esc).join(', '):'')+'. Income '+gbp(r.income)+', costs '+gbp(r.costs)+'.'+(r.tax?' Corporation tax of '+gbp(r.tax)+' on last year’s profit also left the bank.':'')+(r.recur!=null?' Recurring work '+(r.recur>=0?'makes ':'loses ')+gbp(Math.abs(r.recur))+' a month on the Money tab’s basis'+(r.oneoff?'; projects and one-offs brought in '+gbp(r.oneoff):'')+'.':'')+(r.L.expired?' <b class="wrn">'+r.L.expired+' proposal'+(r.L.expired>1?'s':'')+' expired unanswered.</b>':'')+(r.signoff?' <b class="wrn">'+r.signoff+' waiting for your sign-off.</b>':'')+'</p>'+((r.notices||[]).length?'<p class="note bad"><b>Serving notice:</b> '+r.notices.map(n=>esc(n[0])+' (leaves '+n[1]+', '+({bought:'bought by a group',rival:'won by a rival',you:'you gave notice',audit:'after the failed audit',breach:'after the breach'}[n[3]]||'unhappy, satisfaction '+n[2]+'; get them above 62 to keep them')+')').join('; ')+'.</p>':'')+
      (r.audit?'<p class="note'+(/failed/.test(r.audit)?' bad':'')+'"><b>Audit:</b> '+esc(r.audit)+'</p>':'')+(S.co.cash<0?'<p class="note bad"><b>Overdraft:</b> '+gbp(-S.co.cash)+' used of '+gbp(OD_LIMIT)+'. Past the limit at two month-ends running, the bank calls it in.</p>':'')+(r.tips.length?'<h3 style="font-size:1rem;margin-top:10px">Worth a look</h3>'+r.tips.map(t=>'<p class="note">'+esc(t)+'</p>').join(''):S.diff==='hard'?'':'<p class="note">A clean month. Nothing on fire.</p>')+
      (S.co.red?'<p class="note bad">You are past the overdraft limit. One more month-end like this and the bank calls it in.</p>':'')+
      '<div class="foot2"><button class="btn" data-act="reportMoney">See the numbers</button><span class="grow"></span><button class="btn primary" data-act="close">Carry on</button></div></div>';
  }else if(M.type==='over'&&S.over.sold){const o=S.over.sold;
    h='<div class="dialog"><p class="kick">'+esc(o.head||'Sold')+'</p><h2>'+esc(o.title||('You sold '+S.co.name))+'</h2><p>'+(o.body?esc(o.body):(esc(o.buyer)+' paid '+gbp(o.offer)+' in '+mLabel(S.over.mi)+'. After clearing the loan and adding the cash in the bank'+(o.partner?', and '+esc(o.pname)+'’s '+gbp(o.partner)+' share':'')+', your share is '+gbp(o.net)+'.'))+'</p>'+(o.cgt?'<p class="mut" style="font-size:.82rem">Capital gains tax of '+gbp(o.cgt)+' came off the '+gbp(o.gross)+', at the Business Asset Disposal Relief rate. The figures below are after tax.</p>':'')+'<div class="tiles"><div class="tile"><span class="k">Sale, after tax</span><span class="v">'+gbp(o.net)+'</span></div><div class="tile"><span class="k">Taken home</span><span class="v">'+gbp(o.home)+'</span></div><div class="tile"><span class="k">In your pocket</span><span class="v pos">'+gbp(o.net+o.home)+'</span></div><div class="tile"><span class="k">Peak MRR</span><span class="v">'+gbp(S.over.peak)+'</span></div></div><div class="foot2"><span class="grow mut">'+Math.round(S.day/DPM)+' months from the spare room.</span><button class="btn primary" data-act="newgame">Start again</button></div></div>';
  }else if(M.type==='over'){
    h='<div class="dialog"><p class="kick">Administration</p><h2>'+esc(S.co.name)+' has gone under</h2><p>The bank called in the overdraft in '+mLabel(S.over.mi)+'. At your peak you were billing '+gbp(S.over.peak)+' a month in recurring revenue with '+Math.max(...S.hist.map(x=>x.staff),1)+' people.</p>'+postMortem()+'<div class="foot2"><span class="grow"></span><button class="btn primary" data-act="newgame">Start again</button></div></div>';
  }else if(M.type==='reset'){
    h='<div class="dialog"><h2>Start a new company?</h2><p>This wipes '+esc(S.co.name)+' for good.</p><div class="foot2"><span class="grow"></span><button class="btn" data-act="close">Keep playing</button><button class="btn primary" data-act="newgame" style="background:var(--bad);border-color:var(--bad);color:#fff">Wipe and restart</button></div></div>';
  }else if(M.type==='deal'){
    const d=S.deals.find(z=>z.id===M.id);if(!d){ui.modal=null;return renderModal();}
    const bl=blockers(d);const pm=M.pm||1;const w=winChance(d,pm);
    const seats=dealSeats(d);
    let body='';
    if(d.kind==='project'){const E=dealEstimate(d,pm);const mc=E.pct<0?'neg':E.pct<0.2?'wrn':'pos';body='<table><tbody><tr><td>Quote</td><td class="r">'+gbp(E.q)+'</td></tr><tr><td>Estimate</td><td class="r">'+d.proj.est+' hours</td></tr><tr><td>Engineer time at £'+E.rate.toFixed(0)+'/h</td><td class="r">−'+gbp(E.mid)+'</td></tr><tr class="total"><td>Estimated margin</td><td class="r '+mc+'">'+gbp(E.margin)+' ('+pct(E.pct)+')</td></tr><tr><td class="mut">Usual range, 15% under to 45% over</td><td class="r mut">'+gbp(E.q-E.lo)+' to '+gbp(E.q-E.hi)+'</td></tr><tr><td>Due</td><td class="r">'+(Math.ceil(d.proj.est/4)+12)+' working days after signing</td></tr></tbody></table>'+queueNote(d)+'<p class="note">Half is invoiced when they sign, half on completion. If it overruns, the extra hours are on you.</p>';}
    else{const E=dealEstimate(d,pm);
      // The tool base fee is a fixed monthly cost shared across every client on that tool,
      // not a cost of this one client. Show the recurring per-client margin without it, then
      // present the fee separately as a standing cost with a break-even, so a small first
      // security client doesn't look ruinous when the fee is really an investment in the stack.
      const toolFee=E.toolFee||0;const marginEx=E.margin+toolFee;const pctEx=E.rev?marginEx/E.rev:0;
      const mc=pctEx<0?'neg':pctEx<0.2?'wrn':'pos';
      const capPct=v=>E.capM?Math.round(v/E.capM*100)+'%':'–';const over=E.capM&&E.after>E.capM;
      body='<table><thead><tr><th>Per month</th><th class="r">Units</th><th class="r">£</th></tr></thead><tbody>'+E.lines.map(l=>'<tr><td>'+SVC[l.k].name+'</td><td class="r">'+l.u+' '+SVC[l.k].unit+(l.u>1?'s':'')+'</td><td class="r">'+gbp(l.rev)+'</td></tr>').join('')+
      '<tr class="head"><td colspan="3">Estimated costs</td></tr>'+(E.vend?'<tr><td>Resold services ('+[...new Set(E.lines.filter(l=>SVC[l.k].vendor).map(l=>VEND[SVC[l.k].vendor].name))].join(', ')+')</td><td></td><td class="r">−'+gbp(E.vend)+'</td></tr>':'')+
      '<tr><td>Support time, about '+E.hrs.toFixed(1)+'h at £'+E.rate.toFixed(0)+'/h</td><td></td><td class="r">−'+gbp(E.lab)+'</td></tr>'+
      '<tr class="total"><td>Margin on this client</td><td class="r"></td><td class="r '+mc+'">'+gbp(marginEx)+' ('+pct(pctEx)+')</td></tr></tbody></table>'+
      ((E.newTools||[]).length?(()=>{const names=E.newTools.map(t=>t.name).join(' and ');const be=marginEx>0?Math.ceil(toolFee/marginEx):0;
        return '<p class="note'+(marginEx>0?' warn':' bad')+'" style="margin-top:8px">Signing this puts '+esc(names)+' on your stack: a '+gbp(toolFee)+'/mo standing cost, shared by every client you run on it. '+
          (marginEx>0?'This one covers '+gbp(Math.min(toolFee,marginEx))+' of it; you break even on the tool at about '+be+' client'+(be===1?'':'s')+' this size. Until then it runs at a loss.':'This client doesn’t even cover its own running costs, so the '+gbp(toolFee)+' fee is pure loss until you sign more.')+'</p>';})():'')+
      (dealSetup(d)?'<p class="mut" style="margin-top:8px;font-size:.84rem">Plus '+gbp(dealSetup(d))+' onboarding, paid on signing.</p>':'')+
      (E.hrs>=1?'<p class="note'+(over?' warn':'')+'">Desk load goes from '+capPct(E.load)+' to '+capPct(E.after)+' of capacity'+(E.onboard>=2?'. Onboarding will take about '+Math.round(E.onboard)+' hours of engineer time':'')+'.'+(over?' You would need more people on the desk to keep SLAs.':'')+'</p>':'');}
    h='<div class="dialog">'+x+'<p class="kick">'+{new:'New client',cross:'Cross-sell',project:'Project quote'}[d.kind]+'</p><h2>'+esc(dealName(d))+'</h2><p>'+(d.kind==='new'?d.sector+', '+d.seats+' users. ':d.kind==='cross'?'Existing client, trust '+Math.round(C(d.cid).trust)+'. ':'')+(d.note?esc(d.note):'')+'</p>'+competeNote(d)+body+(d.kit&&Object.keys(d.kit).length?'<p class="note">They run '+Object.keys(d.kit).map(cat=>esc(kitLabel(cat,d.kit[cat]))+(d.kit[cat].left?' ('+d.kit[cat].left+' months left)':'')).join(', ')+'. You’ll decide whether to move them onto your stack or support it as-is during onboarding. Either way costs time or money that this estimate doesn’t include.</p>':'')+
      '<h3 style="font-size:.95rem;margin:14px 0 6px">Price</h3><div class="seg">'+PM_OPTS.map(p=>'<button data-act="pm" data-v="'+p+'" aria-pressed="'+(p===pm)+'">'+(p===1?'List':(p<1?'−':'+')+Math.round(Math.abs(1-p)*100)+'%')+'<small>'+pct(winChance(d,p))+'</small></button>').join('')+'</div>'+
      termSeg(d)+(bl.length?bl.map(b=>'<p class="note warn">'+esc(b)+'</p>').join(''):'')+
      (d.draft?'<p class="note">Prepared by <b>'+esc((ST(d.draft.by)||{name:'your account manager'}).name)+'</b>, who recommends <b>'+(d.draft.pm===1?'list price':(d.draft.pm<1?'−':'+')+Math.round(Math.abs(1-d.draft.pm)*100)+'%')+'</b> ('+pct(winChance(d,d.draft.pm))+' to win).'+(d.draft.pm<1&&comm().basis==='rev'?' They’re paid commission on revenue, so a likely close matters more to them than your margin.':'')+(pm!==d.draft.pm?' You have changed the price.':'')+'</p>':(d.drafter&&ST(d.drafter)?'<p class="note">'+esc(ST(d.drafter).name)+' is still writing this up. You can send it yourself now.</p>':''))+
      '<div class="foot2"><span class="grow"><span class="big">'+pct(w)+'</span> <span class="mut">chance to win</span></span><button class="btn" data-act="walk">Walk away</button><button class="btn primary" data-act="send" '+(bl.length?'disabled':'')+'>'+(d.draft?'Approve and send':'Send proposal')+'</button></div></div>';
  }else if(M.type==='hire'){
    const r=M.role;const cs=cands(r);const src=M.src||'board';const free=freeDesk()>=0;const pend=staffOn().filter(s=>!started(s)).reduce((a,s)=>a+s.salary,0)*(1+ONCOST);const opNow=Math.round(companyPL().op-pend);
    const list=cs[src];
    h='<div class="dialog wide">'+x+'<p class="kick">Hiring</p><h2>'+ROLES[r].t+'</h2><p>'+ROLES[r].blurb+'</p>'+
      '<div class="seg"><button data-act="src" data-v="board" aria-pressed="'+(src==='board')+'">Job board<small>£250 advert, greener candidates</small></button><button data-act="src" data-v="rec" aria-pressed="'+(src==='rec')+'">Recruiter<small>15% of annual salary, stronger candidates</small></button></div>'+
      (free?'':'<p class="note warn">No free desk. <button class="linkbtn" data-act="tab" data-v="office">Move somewhere bigger</button> first.</p>')+(S.noHire&&S.noHire[r]>S.day?'<p class="note warn">You made a '+ROLES[r].short.toLowerCase()+' role redundant recently. You can’t hire one again until '+dLabel(S.noHire[r])+'.</p>':'')+'<p class="note">Recurring profit is '+gbp(opNow)+' a month before this hire'+(pend?', counting the '+gbp(Math.round(pend))+' a month of people you’ve hired who haven’t started yet':'')+' (project and setup fees come on top). '+((()=>{const sal=Math.round((ROLES[r].sal[0])*(1+ONCOST));const after=opNow-sal;if(after>=0)return '';const mo=(S.co.cash+Math.max(0,(typeof loanLimit==='function'?loanLimit()-S.co.loan:0)))/Math.max(1,-after);return '<b class="wrn">At about '+gbp(sal)+'/mo they’d put you '+gbp(-after)+' a month into the red; your cash and loan headroom would last about '+(mo<1?'under a month':Math.round(mo)+' months')+' unless you win more work. </b>';})())+'“Leaves” is what’s left after their salary and on-costs, until they help you win or keep more work.</p>'+
      '<div class="cands">'+(list.length?list.map(c=>{const fee=src==='rec'?Math.round(c.salary*12*0.15):250;return '<div class="cand"><span><b>'+esc(c.name)+'</b> '+dots(c.skill)+(c.appr?' <span class="chip">Apprentice</span>':'')+'</span><span class="num">'+gbp(c.salary)+'/mo<small style="display:block" class="'+(opNow-c.salary*(1+ONCOST)<0?'neg':'mut')+'">leaves '+gbp(opNow-Math.round(c.salary*(1+ONCOST)))+'/mo</small></span><span class="sub">'+candKnows(c)+(c.interviewed?'<span class="inotes">'+(c.notes||[]).map(n=>'“'+esc(n)+'”').join(' ')+'</span>'+(Object.keys(c.known||{}).filter(t=>TR[t]).length?'<span class="chips" style="margin:4px 0">'+Object.keys(c.known).filter(t=>TR[t]).map(t=>'<span class="chip" title="'+esc(TR[t].d)+'">'+TR[t].t+'</span>').join('')+'</span>':''):'<button class="btn sm" data-act="interview" data-v="'+c.id+'" style="margin:6px 0;display:block">Interview · half a day of your time</button>')+'Fee '+gbp(fee)+'. Starts in about a month.</span><span><button class="btn sm primary" data-act="hireC" data-v="'+c.id+'" '+(free&&S.co.cash-fee>-OD_LIMIT?'':'disabled')+'>Hire</button></span></div>';}).join(''):'<p class="empty">Nobody left on this list. New candidates next month.</p>')+'</div></div>';
  }else if(M.type==='staff'){
    const s=ST(M.id);if(!s){ui.modal=null;return renderModal();}
    const you=s.id==='you';
    const trainCost=trainCostOf(s);
    h='<div class="dialog">'+x+'<p class="kick">'+ROLES[s.role].t+(s.appr?' · Apprentice':'')+'</p><h2>'+esc(s.name)+'</h2>'+
      '<div class="tiles"><div class="tile"><span class="k">Skill</span><span class="v">'+s.skill+'/5</span></div><div class="tile"><span class="k">Morale</span><span class="v '+(s.morale<40?'neg':'')+'">'+Math.round(s.morale)+'</span></div><div class="tile"><span class="k">Utilisation</span><span class="v">'+pct(s.util||0)+'</span></div><div class="tile"><span class="k">Salary</span><span class="v">'+(s.salary?gbp(s.salary):'–')+'</span></div></div>'+
      (()=>{const kn=(s.traits||[]).filter(t=>TR[t]&&(s.known||{})[t]),unk=(s.traits||[]).filter(t=>TR[t]).length-kn.length;return (kn.length||unk)&&s.id!=='you'?'<div class="traits">'+kn.map(t=>'<div class="trait"><b>'+TR[t].t+'</b><span>'+TR[t].d+'</span></div>').join('')+(unk?'<div class="trait unk"><b>Still getting to know them</b><span>'+(S.day-s.start<20?'Give it a few weeks.':'Something about how they work hasn’t shown yet.')+'</span></div>':'')+'</div>':'';})()+((s.rec||[]).length?'<h3 style="font-size:.95rem;margin:14px 0 6px">Track record</h3><ul class="news">'+s.rec.slice(0,6).map(r=>'<li class="'+(r.kind==='good'?'good':'bad')+'"><time>'+dLabel(r.d)+'</time><span>'+esc(r.text)+'</span></li>').join('')+'</ul>':'')+(s.role==='desk'||s.role==='eng'?'<p class="mut" style="font-size:.8rem;margin-top:6px">'+(s.reopens?s.reopens+' ticket'+(s.reopens>1?'s':'')+' reopened after they closed '+(s.reopens>1?'them':'it')+'. ':'')+(s.slip?'About '+Math.round(s.slip)+'h of project slippage. ':'')+'</p>':'')+(!started(s)?'<p class="note">Starts in '+daysLeft(s.start)+'. New starters work at 60% for their first three weeks.</p>':'')+
      moraleWhy(s)+mgrBlock(s)+knowSection(s)+
      (you?'<h3 style="font-size:.95rem;margin:14px 0 6px">Where you spend your day</h3>'+modeSeg()+(()=>{const b=active().filter(c=>!amOf(c)),due=b.filter(reviewDue).length;return '<p class="mut" style="font-size:.84rem;margin-top:10px">Your own book: '+b.length+' client'+(b.length===1?'':'s')+(due?', <b class="wrn">'+due+' due a review</b>':'')+'. Anyone without an account manager is yours to look after.</p>';})():'')+
      (s.role==='am'?(()=>{const book=active().filter(c=>c.am===s.id),un=active().filter(c=>!c.am);const bookM=book.reduce((a,c)=>a+clientMRR(c),0);const sn=(s.snaps||[]);const base=sn.length?sn[Math.max(0,sn.length-3)].mrr:null;const growth=base?(bookM-base)/base:null;
        const q=(s.sales||[]).filter(x=>S.day-x.d<63);const soldM=q.reduce((a,x)=>a+x.mrr,0),soldP=q.reduce((a,x)=>a+x.proj,0);const target=Math.round(s.salary*0.75/50)*50;
        const lost=(s.lost||[]).filter(x=>S.day-x.d<126);
        return '<div class="tiles" style="margin-top:12px"><div class="tile"><span class="k">Book</span><span class="v">'+gbp(bookM)+'</span><small>a month across '+book.length+' client'+(book.length===1?'':'s')+'</small></div>'+
        '<div class="tile"><span class="k">Book growth</span><span class="v '+(growth==null?'mut':growth<0?'neg':growth>0.05?'pos':'')+'">'+(growth==null?'–':(growth>=0?'+':'')+pct(growth))+'</span><small>'+(growth==null?'needs a month-end first':'over the last quarter')+'</small></div>'+
        '<div class="tile"><span class="k">Sold, last quarter</span><span class="v '+(soldM>=target?'pos':soldM>=target*0.5?'wrn':'neg')+'">'+sgbp(soldM)+'/mo</span><small>target '+gbp(target)+'/mo'+(soldP?' · plus '+gbp(soldP)+' projects':'')+'</small></div>'+
        '<div class="tile"><span class="k">Lost from book</span><span class="v '+(lost.length?'neg':'')+'">'+lost.length+'</span><small>clients in 6 months</small></div></div>'+'<p class="mut" style="font-size:.82rem;margin-top:8px">Base '+gbp(s.salary)+' a month. Commission earned over the last quarter: <b>'+gbp((s.comms||[]).filter(x=>S.day-x.d<63&&!x.claw).reduce((a,x)=>a+x.amt,0))+'</b>'+(s.due?', '+gbp(s.due)+' due at month end':'')+'.</p>'+'<h3 style="font-size:.95rem;margin:14px 0 6px">Book: '+book.length+' of '+amCap(s)+' clients</h3>'+meter(book.length/amCap(s),book.length>=amCap(s)?'w':'p')+'<p class="mut" style="font-size:.82rem;margin:6px 0">Capacity grows with skill: '+[1,2,3,4,5].map(k=>k+'★ '+(3+k*3)).join(' · ')+'. The fuller the book, the less time for new business.</p>'+(book.length?'<ul class="list">'+book.map(c=>'<li class="item click" data-act="client" data-v="'+c.id+'"><span><b>'+esc(c.name)+'</b></span><span class="r">'+gbp(clientMRR(c))+'</span><span class="sub">satisfaction '+Math.round(c.sat)+' · trust '+Math.round(c.trust)+' · reviewed '+(c.review<0?'never':(S.day-c.review)+' days ago')+'</span></li>').join('')+'</ul>':'<p class="empty">No clients yet.</p>')+'<div class="row" style="margin-top:8px"><button class="btn sm" data-act="fillBook" '+(un.length&&book.length<amCap(s)?'':'disabled')+'>Take on unmanaged clients ('+un.length+')</button></div><h3 style="font-size:.95rem;margin:14px 0 6px">Proposals</h3><p class="mut" style="font-size:.82rem;margin:0 0 6px">'+esc(s.name)+' prices and writes up proposals for their clients and new leads, then brings them to you. Better account managers price more cleverly.</p><div class="seg"><button data-act="autoSend" data-v="0" aria-pressed="'+(s.auto!==true)+'">Ask me first<small>everything needs your OK</small></button><button data-act="autoSend" data-v="1" aria-pressed="'+(s.auto===true)+'">Send cross-sells<small>new work still asks you</small></button></div>';})():'')+
      (s.role==='eng'?'<h3 style="font-size:.95rem;margin:14px 0 6px">Focus</h3><div class="seg">'+Object.entries(FOCUS).map(([k,f])=>'<button data-act="focus" data-v="'+k+'" aria-pressed="'+(s.focus===k)+'">'+f.t+'</button>').join('')+'</div>':'')+
      (!you?'<div class="foot2"><button class="btn" data-act="raise" '+((s.raise||-999)+60>S.day?'disabled':'')+'>Pay rise (+8%)</button>'+(s.salary<marketPay(s)*0.97&&(s.raise||-999)+60<=S.day&&s.id!=='you'?'<button class="btn" data-act="toMarket">Match market pay ('+gbp(Math.round(marketPay(s)/10)*10)+')</button>':'')+'<button class="btn" data-act="train" '+(s.skill>=5||(s.trained||-999)+60>S.day||!present(s)?'disabled':'')+'>Training ('+gbp(trainCost)+', 3 days out)</button>'+(canPromote(s)?'<button class="btn" data-act="promote" title="Level 4+ analysts with three months served can step up to second line">Promote to engineer ('+gbp(Math.round(Math.max(s.salary+350,ROLES.eng.sal[0])/10)*10)+')</button>':'')+'<span class="grow"></span>'+(ui.confirm?'<button class="btn danger" data-act="fire">Confirm: pay '+gbp(s.salary)+' and let go</button>':'<button class="btn danger" data-act="fireAsk">Let go</button>')+'</div>':'')+
      '</div>';
  }else if(M.type==='client'){
    const c=C(M.id);if(!c){ui.modal=null;return renderModal();}
    const canReview=S.day-c.review>=45;
    h='<div class="dialog">'+x+'<p class="kick">'+c.sector+' · client since '+dLabel(Math.max(0,c.since))+'</p><h2>'+esc(c.name)+'</h2>'+
      (c.notice!=null?'<p class="note bad">Serving notice. They leave on '+dLabel(c.notice)+(c.ending?', '+({bought:'because they’ve been bought by a group',rival:'for a rival',you:'because you gave notice',audit:'after your failed audit',breach:'after the breach'}[c.why||'you']):' unless satisfaction gets back above 62')+'.</p>':'')+
      contractLine(c)+'<div class="tiles"><div class="tile"><span class="k">Users</span><span class="v">'+c.seats+'</span></div><div class="tile"><span class="k">Satisfaction</span><span class="v">'+Math.round(c.sat)+'</span></div><div class="tile"><span class="k">Trust</span><span class="v">'+Math.round(c.trust)+'</span></div><div class="tile"><span class="k">Monthly</span><span class="v">'+gbp(clientMRR(c))+'</span></div></div>'+
      (()=>{const P=clientPL(c);const mc=P.pct<0?'neg':P.pct<0.2?'wrn':'pos';return '<h3 style="font-size:.95rem;margin:14px 0 4px">Monthly P&amp;L</h3><table><thead><tr><th>Service</th><th class="r">Price</th><th class="r">Revenue</th><th class="r">Cost</th></tr></thead><tbody>'+P.lines.map(l=>'<tr><td>'+SVC[l.k].name+'</td><td class="r">£'+svcPrice(c,l.k).toFixed(2)+'</td><td class="r">'+gbp(l.rev)+'</td><td class="r">'+(l.cost?'−'+gbp(l.cost):'–')+'</td></tr>').join('')+
        '<tr><td colspan="3">Support time, '+P.hrs.toFixed(1)+'h'+(P.settling?' (estimated, still settling)':' over the last month')+'</td><td class="r">−'+gbp(P.lab)+'</td></tr>'+
        '<tr class="total"><td>Margin</td><td class="r '+mc+'">'+pct(P.pct)+'</td><td class="r">'+gbp(P.rev)+'</td><td class="r '+mc+'">'+gbp(P.margin)+'</td></tr></tbody></table>'+
        '<div class="tiles" style="margin-top:10px"><div class="tile"><span class="k">Per support hour</span><span class="v '+ehrCls(P.ehr)+'">'+(P.ehr==null?'–':gbp(P.ehr))+'</span><small>'+(P.ehr==null?'not enough hours yet':'service revenue ÷ '+P.hrs.toFixed(1)+'h. Your labour costs ~'+gbp(blendedRate())+'/h')+'</small></div>'+
        '<div class="tile"><span class="k">After overheads</span><span class="v '+(P.loaded<0?'neg':'')+'">'+pct(P.loaded)+'</span><small>overheads are '+pct(P.ov)+' of revenue, shared by revenue</small></div></div>'+
        (P.margin<0&&!P.settling?'<p class="note bad">They cost more to look after than they pay. A price rise, RMM to cut tickets, or a conversation about their setup would help.</p>':'')+
        '<p class="mut" style="font-size:.78rem;margin-top:4px">Support time is costed at what the people doing it cost per productive hour. Your own time counts at '+gbp(FOUNDER_M)+' a month.</p>';})()+
      '<p class="mut" style="font-size:.84rem;margin-top:8px">Not yet buying: '+(SVC_ORDER.filter(k=>!c.svc[k]).map(k=>SVC[k].short).join(', ')||'nothing, they have the lot')+'. Open tickets: '+S.tickets.filter(t=>t.cid===c.id).length+'.</p>'+
      kitSection(c)+
      (!amOf(c)?'<p class="mut" style="font-size:.82rem;margin-top:10px">In your own book: you run their reviews and write their proposals.'+(reviewDue(c)?' <b class="wrn">A review is due.</b>':'')+'</p>':'')+
      (ams().length?'<h3 style="font-size:.95rem;margin:14px 0 6px">Account manager</h3><div class="seg" style="grid-auto-flow:row;grid-template-columns:repeat(auto-fit,minmax(120px,1fr))"><button data-act="assign" data-v="" aria-pressed="'+(!c.am)+'">'+esc(S.co.founder)+' (you)<small>your own book</small></button>'+ams().map(s=>{const full=amLoad(s)>=amCap(s)&&c.am!==s.id;return '<button data-act="assign" data-v="'+s.id+'" aria-pressed="'+(c.am===s.id)+'" '+(full?'disabled':'')+'>'+esc(s.name)+'<small>'+amLoad(s)+' of '+amCap(s)+(full?' · full':'')+'</small></button>';}).join('')+'</div>'+(amOf(c)?'<p class="mut" style="font-size:.82rem;margin-top:6px">'+esc(amOf(c).name)+' runs their reviews every quarter and writes up their proposals'+(amOf(c).auto===true?', sending cross-sells on their own':' for your sign-off')+'.</p>':''):'')+
      '<div class="foot2"><button class="btn primary" data-act="review" '+(canReview&&!diaryFull()?'':'disabled')+' title="Prep, the meeting and the follow-up: about half a day of your time">'+(!canReview?'Reviewed '+(S.day-c.review)+' days ago':diaryFull()?'Your diary is full':'Account review · half a day')+'</button><button class="btn" data-act="uplift" '+(upliftOk(c)?'':'disabled')+' title="Once a year per client. Prices are capped at 30% over list.">'+(upliftOk(c)?'Raise prices 5%':'Raised '+dLabel(c.upAt))+'</button>'+((c.notice!=null||c.sat<55)?'<button class="btn'+(c.notice!=null?' primary':'')+'" data-act="savePlay" data-v="'+c.id+'">Save this account</button>':'')+'</div></div>';
  }else if(M.type==='room'){
    const used=S.office.slots||[];
    h='<div class="dialog">'+x+'<p class="kick">Fit out a room</p><h2>What goes here?</h2><div class="choices">'+ROOM_ORDER.filter(k=>!used.includes(k)).map(k=>'<button class="choice" data-act="fit" data-v="'+k+'" '+(S.co.cash-ROOMS[k].cost<-OD_LIMIT?'disabled':'')+'><b>'+ROOMS[k].t+' · '+gbp(ROOMS[k].cost)+'</b><span>'+ROOMS[k].d+'</span></button>').join('')+'</div></div>';
  }else if(M.type==='roominfo'){
    const k=M.key;h='<div class="dialog">'+x+'<p class="kick">Room</p><h2>'+ROOMS[k].t+'</h2><p>'+ROOMS[k].d+'</p></div>';
  }else if(MODAL_EXT[M.type]){const r=MODAL_EXT[M.type](M,x);if(r===null){ui.modal=null;return renderModal();}h=r;
  }else if(M.type==='neg'){
    const k=M.k,v=VEND[k],s=S.vend[k];
    h='<div class="dialog">'+x+'<p class="kick">'+v.kind+'</p><h2>Negotiate with '+v.name+'</h2><p>Current discount '+Math.round(s.disc*100)+'%. Your volume gives you some leverage: they know what you buy. You can try again in four months.</p><div class="choices">'+
      '<button class="choice" data-act="negGo" data-v="ask"><b>Ask for a better rate</b><span>Usually gets a few percent. No risk.</span></button>'+
      '<button class="choice" data-act="negGo" data-v="commit"><b>Commit to 12 months</b><span>A guaranteed 7% off, but you cannot drop them for a year.</span></button>'+
      '<button class="choice" data-act="negGo" data-v="threat"><b>Threaten to move</b><span>'+pct(negOdds(k))+' chance of 14% off. Otherwise they call your bluff.</span></button></div></div>';
  }
  m.innerHTML=h;m.hidden=false;
  }catch(err){
    if(typeof console!=='undefined')console.error('Tier One: modal render failed for',M&&M.type,err);
    // A modal that fails to render must never stay "open": the click guard treats an open
    // modal as blocking, so a blank one would freeze every button on the page.
    const failed=M&&M.type;m.hidden=true;m.innerHTML='';ui.modal=null;
    const msg='Couldn’t open the '+(failed||'')+' window: '+((err&&err.message)||'unknown error');
    if(typeof toast==='function')toast(msg);
    try{log(msg+' (build '+BUILD+'). This has been logged.','bad');}catch(e){}
  }
}
function negOdds(k){const v=VEND[k];let vol=v.svc?v.svc.reduce((a,x)=>a+svcUsers(x),0):svcUsers('support')+staffOn().length*5;return clamp(0.25+vol/800,0.25,0.6);}

/* ============ actions ============ */
function act(a,v,el){
  switch(a){
    case 'speed':{const fr=dayFrac();V.speed=+v;V.lastFrac=fr;V.acc=V.speed>0?fr*cycleMs():0;renderTop();return;}
    case 'tab':ui.tab=v;ui.subtab=ui.subtab||{};ui.subtab[groupOf(v).k]=v;renderTabs();renderPane();$('pane').scrollTop=0;return;
    case 'group':{const g=GROUPS.find(x=>x.k===v);if(g){ui.tab=(ui.subtab&&ui.subtab[v])||g.tabs[0];renderTabs();renderPane();$('pane').scrollTop=0;}return;}
    case 'mode':S.co.mode=v;log('You switch to '+MODES[v].t.toLowerCase()+'.','info');break;
    case 'close':if(ui.modal&&ui.modal.type==='report')S.report=null;closeModal();save();return;
    case 'reportMoney':S.report=null;ui.tab='money';closeModal();return;
    case 'start':{const n=($('fName').value||'You').trim().slice(0,24)||'You',co=($('fCo').value||'Northbridge IT').trim().slice(0,28)||'Northbridge IT';newState(n,co);S.diff=ui.diff||'normal';S.co.cash=DIFF[S.diff].cash;S.guide={on:S.diff!=='hard',done:{}};S.build=BUILD;S.office.slots=[];ui.modal=null;setLayout();V.speed=16;break;}
    case 'newgame':try{localStorage.removeItem(SAVE_KEY);}catch(e){}newState('Jason','Northbridge IT');S.intro=true;S.office.slots=[];setLayout();ui.modal=null;ui.confirm=false;nextModal();break;
    case 'reset':ui.modal={type:'reset'};break;
    case 'choose':{const before=ui.modal;const e=pendingEvent();if(e){const ch=e.choices[+v];S.pending=null;ch.go();}if(ui.modal===before)ui.modal=null;nextModal();break;}
    case 'deal':{const d=S.deals.find(z=>z.id===v);ui.modal={type:'deal',id:v,pm:d&&d.draft?d.draft.pm:1};break;}
    case 'reviewNow':{const c=C(v);if(c&&reviewDue(c)){if(diaryFull()){log('Your diary is full. Reviews free up as you work through the ones already booked.','bad');toast('Your diary is full. Try again in a day or two.');}else doReview(c,null);}break;}
    case 'pm':ui.modal.pm=+v;break;
    case 'send':{const d=S.deals.find(z=>z.id===ui.modal.id);if(d&&!blockers(d).length){if(d.draft)d.by=d.draft.by;sendDeal(d,ui.modal.pm||1);log('Proposal sent to '+dealName(d)+'.','info');}ui.modal=null;nextModal();break;}
    case 'walk':{S.deals=S.deals.filter(z=>z.id!==ui.modal.id);ui.modal=null;nextModal();break;}
    case 'hire':if(!ROLES[v]||!ROLES[v].sal)break;ui.modal={type:'hire',role:v,src:'board'};break;
    case 'src':ui.modal.src=v;break;
    case 'hireC':{const cs=cands(ui.modal.role);const c=cs[ui.modal.src].find(z=>z.id===v);if(c)hire(c);break;}
    case 'staff':ui.modal={type:'staff',id:v};ui.confirm=false;break;
    case 'focus':{const s=ST(ui.modal.id);if(s)s.focus=v;break;}
    case 'raise':{const s=ST(ui.modal.id);if(s&&(s.raise||-999)+60<=S.day){s.salary=Math.round(s.salary*1.08/10)*10;s.morale=Math.min(100,s.morale+18);s.raise=S.day;log(s.name+' gets a pay rise.','good');}break;}
    case 'train':{const s=ST(ui.modal.id);if(s&&s.skill<5&&(s.trained||-999)+60<=S.day&&present(s)){const cost=trainCostOf(s);spend(cost);s.away=S.day+3;s.course=s.away;s.trained=S.day;s.xp=(s.xp||0)+(hasT(s,'quick')?0.7:0.5);s.morale=Math.min(100,s.morale+6);let up='';if(s.xp>=1){s.xp-=1;s.skill++;s.skillAt=S.day;up=' They come back a level '+s.skill+'.';}log(s.name+' is off on a training course for three days.'+(up||' Another course or two and they’ll step up a level.'),'info');}break;}
    case 'interview':{const cs=cands(ui.modal.role);const c=(cs[ui.modal.src||'board']||[]).find(z=>z.id===v);if(c)interviewCand(c);break;}
    case 'fireAsk':ui.modal={type:'letgo',id:ui.modal.id};break;
    case 'fire':{const s=ST(ui.modal.id);if(s){spend(s.salary);s.left=true;unassign(s.id);S.staff=S.staff.filter(z=>z!==s);for(const o of S.staff)o.morale=Math.max(0,o.morale-6);log('You let '+s.name+' go.','bad');}ui.modal=null;ui.confirm=false;break;}
    case 'client':ui.modal={type:'client',id:v};break;
    case 'review':{const c=C(ui.modal.id);if(c&&!diaryFull())doReview(c,null);break;}
    case 'assign':{const c=C(ui.modal.id);if(c){c.am=v||null;if(v)log(c.name+' is now in '+ST(v).name+'’s book.','info');}break;}
    case 'fillBook':{const s=ST(ui.modal.id);if(s){const un=active().filter(c=>!c.am).sort((a,b)=>clientMRR(b)-clientMRR(a));let n=0;for(const c of un){if(amLoad(s)>=amCap(s))break;c.am=s.id;n++;}log(s.name+' takes on '+n+' client'+(n===1?'':'s')+'.','info');}break;}
    case 'autoSend':{const s=ST(ui.modal.id);if(s)s.auto=v==='1';break;}
    case 'uplift':{const c=C(ui.modal.id);if(c&&upliftOk(c)){c.upAt=S.day;const big=Object.values(c.svc).some(x=>x.pm>=1.15);for(const k in c.svc)c.svc[k].pm=Math.min(1.3,c.svc[k].pm*1.05);c.sat-=big?9:4;c.trust=Math.max(0,c.trust-(big?8:3));log('Prices up 5% for '+c.name+'.'+(big?' They were already paying well over list, and they’ve noticed.':''),'event');}break;}
    case 'rescue':{const c=C(ui.modal.id);if(c){for(const k in c.svc)c.svc[k].pm*=0.9;c.sat=Math.min(100,c.sat+22);log('You offered '+c.name+' 10% off to stay.','event');}break;}
    case 'room':ui.modal={type:'room',j:+v};break;
    case 'fit':{const j=ui.modal.j;const r=ROOMS[v];spend(r.cost);S.office.slots=S.office.slots||[];S.office.slots[j]=v;S.office.rooms[v]=true;log('The '+r.t.toLowerCase()+' is finished.','good');ui.modal=null;break;}
    case 'move':{const t=+v;if(!TIERS[t]||t===S.office.tier)break;ui.modal={type:'moveAsk',t};break;}
    case 'moveGo':{const t=+v;const T=TIERS[t];ui.modal=null;if(t===S.office.tier||staffOn().length>T.cap)break;spend(T.move);S.office.tier=t;const slots=(S.office.slots||[]).filter(Boolean).slice(0,T.slots);S.office.slots=slots;S.office.rooms={};slots.forEach(k=>S.office.rooms[k]=true);reassignDesks();setLayout();log('You have moved into '+T.name.toLowerCase()+': '+T.addr+'.','good');break;}
    case 'add':{S.vend[v].on=true;log('Added '+VEND[v].name+' to the stack.','info');break;}
    case 'drop':{const s=S.vend[v];if(s.lock>S.day){ui.flash='';log('You are locked into '+VEND[v].name+' for another '+daysLeft(s.lock)+'.','bad');break;}
      const used=VEND[v].svc?VEND[v].svc.filter(x=>svcUsers(x)>0):[];
      if(used.length){log('You can’t drop '+VEND[v].name+': clients are using '+used.map(x=>SVC[x].short.toLowerCase()).join(' and ')+'.','bad');ui.tab='news';break;}
      s.on=false;s.disc=0;log('Dropped '+VEND[v].name+' from the stack.','info');break;}
    case 'neg':ui.modal={type:'neg',k:v};break;
    case 'negGo':{const k=ui.modal.k,s=S.vend[k];s.neg=S.day;let msg;
      if(v==='ask'){if(Math.random()<0.65){s.disc=Math.min(0.25,s.disc+0.03);msg=VEND[k].name+' found you another 3%.';}else msg=VEND[k].name+' says that’s already their best price.';}
      else if(v==='commit'){s.disc=Math.min(0.25,s.disc+0.07);s.lock=S.day+DPM*12;msg='Signed a 12-month commitment with '+VEND[k].name+' for 7% off.';}
      else{if(Math.random()<negOdds(k)){s.disc=Math.min(0.25,s.disc+0.14);msg=VEND[k].name+' blinked. 14% off.';}else msg=VEND[k].name+' called your bluff. No change.';}
      log(msg,'event');ui.modal=null;break;}
    case 'borrow':if(S.co.loan+5000<=loanLimit()){S.co.loan+=5000;S.co.cash+=5000;log('Borrowed £5,000 from the bank.','info');}else{const m=bankNervous()?'The bank won’t lend any more until you post a profitable month.':'You’re at the bank’s limit for your recurring revenue.';log(m,'bad');toast(m);}break;
    case 'repay':if(S.co.loan>=5000&&S.co.cash>=5000){S.co.loan-=5000;S.co.cash-=5000;log('Repaid £5,000.','info');}break;
    default:if(ACT_EXT[a])ACT_EXT[a](v);
  }
  if(ui.keepModal){ui.keepModal=false;save();return;}
  render();save();
}
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');if(!el||!S)return;
  if(el.disabled)return;
  if(el.closest('#modal')===null&&ui.modal&&!$('modal').hidden&&el.dataset.act!=='speed')return;
  act(el.dataset.act,el.dataset.v,el);
});
$('modal').addEventListener('click',e=>{if(e.target.id==='modal'&&ui.modal&&!['intro','event','report','over'].includes(ui.modal.type)){closeModal();}});
document.addEventListener('keydown',e=>{
  if(!S)return;
  if(e.key==='Escape'&&ui.modal&&!['intro','event','report','over'].includes(ui.modal.type)){closeModal();return;}
  if(e.code==='Space'&&!ui.modal&&!/INPUT|TEXTAREA|BUTTON/.test(document.activeElement.tagName)){e.preventDefault();V.speed=V.speed?0:(V.lastSpeed||16);if(V.speed)V.lastSpeed=V.speed;renderTop();}
});
$('pane').addEventListener('pointerdown',()=>{ui.hold=true;});
document.addEventListener('pointerup',()=>{setTimeout(()=>{ui.hold=false;},250);});
const cv=$('cv');
cv.addEventListener('pointermove',e=>{const r=cv.getBoundingClientRect();V.hover=hitTest(e.clientX-r.left,e.clientY-r.top);cv.style.cursor=V.hover?'pointer':'default';});
cv.addEventListener('pointerleave',()=>{V.hover=null;});
cv.addEventListener('click',e=>{
  if(!S||ui.modal)return;const r=cv.getBoundingClientRect();const h=hitTest(e.clientX-r.left,e.clientY-r.top);if(!h)return;
  if(h.type==='staff')act('staff',h.id);
  else if(h.type==='desk'){ui.tab='team';render();}
  else if(h.type==='room'){const k=(S.office.slots||[])[h.j];if(k)ui.modal={type:'roominfo',key:k};else ui.modal={type:'room',j:h.j};render();}
});

/* ============ loop ============ */
function dayTick(){
  const r=step();
  scheduleDay(r);
  nextModal();
  renderTop();renderTabs();
  // The pane render is the heaviest DOM work (a big client list can take tens of ms).
  // Running it on every simulated day starves the UI at high speed, so throttle it by
  // real time while fast-forwarding. Interaction still renders immediately via act(),
  // and a pause or a modal forces a full render so nothing looks stale.
  const now=(typeof performance!=='undefined'?performance.now():Date.now());
  const fast=V.speed>1&&!ui.modal;
  if(!ui.hold&&(!fast||now-(V._paneAt||0)>140)){renderPane();V._paneAt=now;}
  renderModal();
  // Saving serialises the whole game to storage; throttle it too while fast-forwarding.
  if(!fast||now-(V._saveAt||0)>2000){save();V._saveAt=now;}
}
function frame(now){
  const dt=Math.min(0.05,(now-(V.last||now))/1000);V.last=now;
  if(V.needPlan&&S&&!S.intro&&V.L){V.needPlan=false;scheduleDay({W:[],made:[]});V.acc=0;}
  if(S&&!S.intro&&!ui.modal&&(S.report||S.pending)&&!deferModal()){nextModal();if(ui.modal)render();}
  if(running()){V.rt+=dt*1000;V.acc+=dt*1000;if(V.acc>=cycleMs()){V.acc=0;V.lastFrac=0;dayTick();}else runPlan();}
  else if(S&&!S.intro&&V.speed&&V.acc===0){}
  for(let i=V.sched.length-1;i>=0;i--){if(V.sched[i].at<=now){const f=V.sched[i].fn;V.sched.splice(i,1);try{f(now);}catch(err){}}}
  if(S&&V.L){
    syncActors();
    if(!V.reduced){for(const id in V.actors)stepActor(V.actors[id],dt,now);for(const v of V.visitors)stepActor(v,dt,now);V.visitors=V.visitors.filter(v=>!v.dead);}
    // idle ambience when paused-free: occasional bubble
    draw(now);
  }
  requestAnimationFrame(frame);
}
function save(){if(!S||S.intro)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(S));}catch(e){}}
function load(){try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)return null;const s=JSON.parse(raw);if(s&&s.v===1&&s.co&&s.staff)return s;}catch(e){}return null;}

/* ============ boot ============ */
readColors();
const saved=load();
if(saved){S=saved;S.office.slots=S.office.slots||[];migrateSave();S.flags=S.flags||{};if((S.build||0)<19)ui.modal={type:'oldSave',from:S.build||0};else S.build=BUILD;}else{newState('Jason','Northbridge IT');S.intro=true;S.office.slots=[];}
setLayout();
nextModal();
render();
if('ResizeObserver' in window)new ResizeObserver(()=>{sizeCanvas();}).observe($('stage'));else window.addEventListener('resize',sizeCanvas);
if(window.matchMedia)matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{readColors();render();});
new MutationObserver(()=>{readColors();render();}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
requestAnimationFrame(frame);
})();
</script>
