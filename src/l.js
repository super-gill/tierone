
/* ============ diagnostics: a compact report you can paste to Claude ============ */
function diagReport(){
  const r=x=>Math.round(x*10)/10,days=S.sla.slice(-DPM);
  const avg=f=>{const v=days.map(f).filter(x=>x!=null);return v.length?v.reduce((a,b)=>a+b,0)/v.length:0;};
  const bd_=days.filter(d=>d.bySvc),bySvc={};for(const d of bd_)for(const k in d.bySvc)bySvc[k]=(bySvc[k]||0)+d.bySvc[k]/bd_.length;
  const cd=days.filter(d=>d.cap),cap={};for(const d of cd)for(const k in d.cap){const c=cap[k]||(cap[k]={n:0,tot:0,used:0});c.n=d.cap[k].n;c.tot+=d.cap[k].tot/cd.length;c.used+=d.cap[k].used/cd.length;}
  const P=companyPL();
  const out={
    when:mLabel(monthOf(S.day))+' d'+(S.day%DPM+1),co:{cash:Math.round(S.co.cash),loan:S.co.loan,rep:r(S.co.rep),mode:S.co.mode,tier:S.office.tier,rooms:S.office.slots},
    pl:{mrr:Math.round(P.rev),resold:Math.round(P.resold),techPay:Math.round(P.techPay),gross:Math.round(P.gross),gpct:r(P.gpct*100),over:Math.round(P.over),op:Math.round(P.op),comm:Math.round(P.commission)},
    hist:S.hist.slice(-6).map(h=>[h.mi,Math.round(h.mrr),h.cash,h.profit,r(h.sla*100),Math.round(h.cs),h.staff]),
    last:S.last?Object.fromEntries(Object.entries(S.last.L).map(([k,v])=>[k,Math.round(v)])):null,
    work:{hoursInPerDay:r(avg(d=>d.mh)),bySvc:Object.fromEntries(Object.entries(bySvc).map(([k,v])=>[k,r(v)])),capacity:Object.fromEntries(Object.entries(cap).map(([k,c])=>[k,{n:c.n,hrsPerDay:r(c.tot),usedPerDay:r(c.used)}])),backlogNow:r(backlogHours()),backlog21dAgo:(d=>d?r(d.backlog):null)(days.find(d=>d.backlog!=null)),backlogDays:r(backlogDays()),sla:r(slaPct()*100),openTickets:S.tickets.length,byPri:[1,2,3,4].map(p=>S.tickets.filter(t=>t.pri===p).length),l2Hours:r(tixSplit().l2),l1Days:r(l1Days()),l2Days:r(l2Days()),projHours:r(projHoursLeft()),projQueueDays:r(Math.min(999,projQueueDays())),need:(N=>N?{desk:r(N.desk),eng:r(N.eng),l1in:r(N.l1in),l2in:r(N.l2in)}:null)(teamNeed()),oldest:S.tickets.length?S.day-Math.min(...S.tickets.map(t=>t.born)):0},
    tools:VEND_ORDER.filter(vendOn).map(k=>k+(S.vend[k].prod?':'+S.vend[k].prod:'')),seats:svcUsers('support'),
    staff:staffOn().map(s=>[s.role,s.skill,s.salary,Math.round((s.util||0)*100),Math.round(s.morale),r(speedOf(s)),(s.traits||[]).join('+'),present(s)?'':'away',s.role==='eng'?s.focus:'']),
    clients:active().map(c=>{const p=clientPL(c);return [c.seats,Object.keys(c.svc).join('+'),r(Object.values(c.svc).reduce((a,x)=>Math.max(a,x.pm),0)),Math.round(c.sat),Math.round(p.rev),Math.round(p.margin),r(p.hrs),p.ehr?Math.round(p.ehr):null,Object.entries(c.kit||{}).map(([k,v])=>k+':'+v.state).join(','),c.am?'am':'you',onbFor(c.id)?onbStage(onbFor(c.id)):''];}),
    onb:S.onb.map(o=>{const q=onbProgress(o);return o.stage+(o.live?'(live)':'')+' '+r(q.done)+'/'+r(q.tot);}),
    projects:S.projects.map(p=>r(p.done)+'/'+r(p.actual)+'h est'+p.est),
    deals:S.deals.length,kit:kitInUse()
  };
  return 'TIER ONE DIAGNOSTICS v1\n'+JSON.stringify(out);
}
MODAL_EXT.diag=(M,x)=>{const t=diagReport();return '<div class="dialog wide">'+x+'<p class="kick">Diagnostics</p><h2>Game snapshot</h2><p>A compact summary of your workload, people, clients and money. Copy it and paste it into the chat.</p><textarea id="diagTxt" readonly style="width:100%;height:220px;font:12px/1.4 var(--mono);border:1px solid var(--line);border-radius:8px;padding:8px;background:var(--surface2);color:var(--ink)">'+esc(t)+'</textarea><div class="foot2"><span class="grow mut" id="diagMsg">'+Math.round(t.length/1000)+'k characters</span><button class="btn primary" data-act="diagCopy">Copy</button></div></div>';};
ACT_EXT.diag=()=>{ui.modal={type:'diag'};};
ACT_EXT.diagCopy=()=>{const ta=$('diagTxt');const done=m=>{const el=$('diagMsg');if(el)el.textContent=m;};
  try{navigator.clipboard.writeText(ta.value).then(()=>done('Copied. Paste it into the chat.'),()=>{ta.select();done('Selected. Press Ctrl+C or Cmd+C to copy.');});}catch(e){ta.select();done('Selected. Press Ctrl+C or Cmd+C to copy.');}
  ui.keepModal=true;};
