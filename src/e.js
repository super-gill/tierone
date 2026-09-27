
/* ============ UI ============ */
const dayMs=()=>V.speed>0?600000/V.speed:1e9;
function running(){return S&&V.speed>0&&!ui.modal&&!((S.pending||S.report)&&!(typeof deferModal==='function'&&deferModal()))&&!S.over&&!S.intro;}
function meter(v,cls){return '<span class="meter '+(cls||'')+'"><i style="width:'+Math.round(clamp(v,0,1)*100)+'%"></i></span>';}
function satCls(v){return v<40?'b':v<60?'w':'';}
function dots(n){let s='<span class="dots" aria-label="Skill '+n+' of 5">';for(let i=1;i<=5;i++)s+='<i class="'+(i<=n?'on':'')+'"></i>';return s+'</span>';}
function roleDot(r){return '<span class="role" style="background:var('+ROLES[r].col+')"></span>';}
function svcChips(keys){return '<span class="chips">'+keys.map(k=>'<span class="chip p">'+SVC[k].short+'</span>').join('')+'</span>';}
function daysLeft(d){const n=d-S.day;return n<=0?'today':n===1?'1 day':n+' days';}
function leadsPerMonth(){let r=(S.salesH||0)*LEAD_K*(0.6+S.co.rep/100)*marketRoom();for(const c of active())if(c.sat>80)r+=0.003;return r*DPM;}
function burnRate(){const op=companyPL().op;return op<0?-op:0;}
function runwayMonths(){const b=burnRate();if(b<=0)return null;return Math.max(0,(S.co.cash+(typeof loanLimit==='function'?Math.max(0,loanLimit()-S.co.loan):0))/b);}

function renderTop(){
  $('coName').textContent=S.co.name;
  $('month').textContent=mLabel(monthOf(S.day));
  $('dayOf').textContent='Day '+(S.day%DPM+1)+' of '+DPM;
  $('live').className=running()?'':'paused';
  document.querySelectorAll('#speed button').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.v===V.speed)));
  const sla=slaPct(),cs=csat();
  const st=[
    ['Cash',gbp(S.co.cash)+(runwayMonths()!=null&&runwayMonths()<12?' <span class="mut" style="font-size:.6em;font-weight:600">'+(runwayMonths()<1?'<1mo':Math.round(runwayMonths())+'mo')+'</span>':''),runwayMonths()!=null&&runwayMonths()<3?'neg':S.co.cash<0?'neg':''],
    ['MRR',gbp(typeof groupMRR==='function'?groupMRR():mrr()),''],
    ['Clients',String(active().length),''],
    ['Team',String(staffOn().length),''],
    ['SLA',pct(sla),sla<0.85?'neg':sla<0.93?'wrn':''],
    ['CSAT',active().length?Math.round(cs)+'':'–',cs<50?'neg':cs<62?'wrn':'']
  ];
  $('stats').innerHTML=st.map(([k,v,c])=>'<div class="stat"><span class="v '+c+'">'+v+'</span><span class="k">'+k+'</span></div>').join('');
  const top=S.log[0];$('tickTxt').textContent=top?top.text:'';{const un=S.log.filter(l=>l.n>S.seen).length;const m=document.querySelector('.ticker .mast');if(m)m.textContent=un&&ui.tab!=='news'?'NEWS · '+un:'NEWS';}
  const t=TIERS[S.office.tier];
  $('officeName').textContent=t.name;
  $('officeMeta').textContent=t.addr+' · '+staffOn().length+' of '+t.cap+' desks'+(t.rent?' · '+gbp(t.rent)+'/mo':'');
  $('floorHint').textContent=S.tickets.length+' open tickets';
}
const TABS=[['desk','Desk'],['clients','Clients'],['sales','Pipeline'],['market','Market'],['tenders','Tenders'],['projects','Projects'],['team','Team'],['stack','Stack'],['office','Office'],['money','Money'],['invest','Investments'],['risk','Risk'],['strategy','Strategy']];
const TAB_LABEL={desk:'Desk',clients:'Clients',sales:'Pipeline',market:'Market',tenders:'Tenders',projects:'Projects',team:'Team',stack:'Stack',office:'Office',money:'Money',invest:'Investments',risk:'Risk',strategy:'Strategy'};
const GROUPS=[
  {k:'ops',t:'Operations',tabs:['desk','clients','projects']},
  {k:'growth',t:'Sales & market',tabs:['sales','market','tenders']},
  {k:'company',t:'Company',tabs:['team','stack','office']},
  {k:'business',t:'Business',tabs:['money','invest','risk','strategy']}
];
function groupOf(tab){for(const g of GROUPS)if(g.tabs.includes(tab))return g;return GROUPS[0];}
function renderTabs(){
  const br=S.tickets.filter(t=>t.br).length;
  const openD=S.deals.filter(d=>d.stage==='open').length;
  const unseen=S.log.filter(l=>l.n>S.seen).length;
  const threats=(typeof rivals==='function'&&S.mkt)?rivals().filter(r=>r.target>S.day).length:0;
  const badge={desk:br?['hot',br]:['',S.tickets.length],clients:(()=>{const n=active().filter(reviewDue).length;return n?['due',n]:['',active().length];})(),sales:openD?['hot',openD]:['',S.deals.length],market:threats?['hot',threats]:'',projects:(()=>{const n=S.onb.filter(o=>o.stage==='plan').length;return n?['hot',n]:['',S.projects.length+S.onb.length];})(),team:['',staffOn().length],stack:['',toolsOn()],branches:(typeof brAlerts==='function'&&brAlerts()?['hot',brAlerts()]:'')};
  const cur=groupOf(ui.tab);
  const isHot=b=>b&&b[0]==='hot'&&b[1];
  const grow=GROUPS.map(g=>{const hot=g.tabs.some(t=>isHot(badge[t]));return '<button class="tab grp" role="tab" aria-selected="'+(g.k===cur.k)+'" data-act="group" data-v="'+g.k+'">'+g.t+(hot?'<span class="b hot dot"></span>':'')+'</button>';}).join('');
  const srow=cur.tabs.map(k=>{const b=badge[k];return '<button class="tab sub" role="tab" aria-selected="'+(ui.tab===k)+'" data-act="tab" data-v="'+k+'">'+(TAB_LABEL[k]||k)+(b&&b[1]!==undefined&&b[1]!==0?'<span class="b '+b[0]+'">'+b[1]+'</span>':'')+'</button>';}).join('');
  $('tabs').innerHTML='<div class="groups">'+grow+'</div><div class="subtabs">'+srow+'</div>';
}
function modeSeg(){
  return '<div class="seg" role="group" aria-label="Your focus">'+Object.entries(MODES).map(([k,m])=>'<button data-act="mode" data-v="'+k+'" aria-pressed="'+(S.co.mode===k)+'">'+m.t+'<small>'+m.d+'</small></button>').join('')+'</div>';
}
function paneDesk(){
  const bl=backlogHours(),capH=deskCapacity(),sla=slaPct();
  const br=S.tickets.filter(t=>t.br).length;
  let h='<div class="sec"><h3>Where you spend your day</h3><p class="lede">You start as the whole company. The game is getting yourself off the tools without the desk falling over.</p>'+modeSeg()+'</div>';
  h+='<div class="sec"><div class="tiles">'+
    '<div class="tile"><span class="k">Open tickets</span><span class="v">'+S.tickets.length+'</span><small>'+(br?'<span class="neg">'+br+' breached</span>':'none breached')+'</small></div>'+
    '<div class="tile"><span class="k">Queue</span><span class="v">'+Math.round(bl)+'h</span><small>'+(capH>0?(bl/capH).toFixed(1)+' days of work':'no one on the desk')+'</small></div>'+
    '<div class="tile"><span class="k">Fixed on time, last '+DPM+' days</span><span class="v '+(sla<0.85?'neg':sla<0.93?'wrn':'pos')+'">'+pct(sla)+'</span><small>'+Math.round(capH)+'h/day capacity · '+pct(respPct())+' first response on time</small></div>'+
    '</div></div>'+scalingSec();
  const W=(V.lastW||[]).filter(w=>w.st.role!=='am'&&w.st.role!=='sdm');
  if(W.length){h+='<div class="sec"><h3>Who’s doing what</h3><ul class="list">'+W.map(w=>{const s=w.st;const u=s.util;
    return '<li class="item click" data-act="staff" data-v="'+s.id+'"><span>'+roleDot(s.role)+'<b>'+esc(s.name)+'</b> <span class="mut">'+ROLES[s.role].short+'</span></span><span class="r">'+pct(u)+'</span><span class="sub">'+meter(u,u>0.97?'b':u>0.85?'w':'p')+'<span style="display:block;margin-top:3px">'+w.done+' tickets closed yesterday'+(w.projDone>0.5?' · '+w.projDone.toFixed(1)+'h on projects':'')+'</span></span></li>';}).join('')+'</ul></div>';}
  h+='<div class="sec"><h3>The queue</h3>';
  if(!S.tickets.length)h+='<p class="empty">Queue’s empty. Enjoy it while it lasts.</p>';
  else{h+='<ul class="list">'+S.tickets.slice(0,16).map(t=>{const c=C(t.cid);const age=S.day-t.born;
    return '<li class="item"><span><span class="pri pri'+t.pri+'">P'+t.pri+'</span> '+esc(t.subj)+(t.lvl===2?' <span class="chip">2nd line</span>':'')+'</span><span class="r '+(t.br?'neg':'mut')+'">'+(t.oneoff?'major incident':t.br||tAgeNow(t)>SLA_H[t.pri]?'breached':Math.round(tAgeNow(t)*10)/10+'h of '+SLA_H[t.pri]+'h')+'</span><span class="sub">'+esc(c?c.name:'Internal')+' · '+t.left.toFixed(1)+'h left</span></li>';}).join('')+'</ul>';
    if(S.tickets.length>16)h+='<p class="empty">…and '+(S.tickets.length-16)+' more.</p>';}
  return h+'</div>';
}
function paneClients(){
  const a=active().slice().sort((x,y)=>clientMRR(y)-clientMRR(x));
  let h=annualSec()+'<div class="sec"><p class="lede">Telephony gets you in the door. Trust grows when satisfaction stays above 55, and trusted clients buy more. Clients without an account manager are in your own book.</p>';
  const due=active().filter(reviewDue).length;if(due)h+='<p class="note warn">'+due+' of your clients '+(due>1?'are':'is')+' due an account review. Tap <b>Review due</b> to run it.</p>';
  if(!a.length)return h+'<p class="empty">No clients. Head to Sales.</p></div>';
  const PL=a.map(clientPL);const T={rev:0,vend:0,lab:0,amc:0};PL.forEach(p=>{T.rev+=p.rev;T.vend+=p.vend;T.lab+=p.lab;T.amc+=p.amc;});const Tm=T.rev-T.vend-T.lab;
  const worst=a.map((c,i)=>[c,PL[i]]).filter(x=>!x[1].settling).sort((x,y)=>x[1].pct-y[1].pct)[0];
  h+='<div class="tiles" style="margin-bottom:12px"><div class="tile"><span class="k">Client revenue</span><span class="v">'+gbp(T.rev)+'</span><small>a month</small></div><div class="tile"><span class="k">Cost to serve</span><span class="v">'+gbp(T.vend+T.lab)+'</span><small>'+gbp(T.vend)+' resold · '+gbp(T.lab)+' support time</small></div><div class="tile"><span class="k">Client margin</span><span class="v '+(Tm<0?'neg':'')+'">'+(T.rev?pct(Tm/T.rev):'–')+'</span><small>'+gbp(Tm)+' before account managers and overheads</small></div></div>'+(worst&&worst[1].pct<0.15?'<p class="note warn">Thinnest margin: <b>'+esc(worst[0].name)+'</b> at '+pct(worst[1].pct)+'.</p>':'');
  {const filt=(S.co&&S.co.clientFilter)||'all';
   const passF2=(c,p,key)=>key==='review'?reviewDue(c):key==='mine'?!amOf(c):key==='risk'?(c.notice!=null||c.sat<55):key==='thin'?(!p.settling&&p.pct<0.15):key==='uplift'?(typeof upliftOk==='function'&&upliftOk(c)):true;
   const passF=(c,p)=>passF2(c,p,filt);
   const counts={};for(const key of ['review','mine','risk','thin','uplift'])counts[key]=a.filter((c,i)=>passF2(c,PL[i],key)).length;
   const fchips=[['all','All',a.length],['review','Needs review',counts.review],['mine','My book',counts.mine],['risk','At risk',counts.risk],['thin','Thin margin',counts.thin],['uplift','Due uplift',counts.uplift]]
     .map(o=>'<button data-act="clientFilter" data-v="'+o[0]+'" aria-pressed="'+(filt===o[0])+'">'+o[1]+(o[2]?' <span class="mut">'+o[2]+'</span>':'')+'</button>').join('');
   h+='<div class="seg" style="margin-bottom:8px">'+fchips+'</div>';
   const rows=a.map((c,i)=>[c,PL[i]]).filter(x=>passF(x[0],x[1]));
   h+=rows.length?('<ul class="list">'+rows.map(([c,p])=>'<li class="item click" data-act="client" data-v="'+c.id+'"><span><b>'+esc(c.name)+'</b>'+(c.notice!=null?' <span class="chip" style="color:var(--bad)">Serving notice</span>':'')+(reviewDue(c)?' <button class="chip due" data-act="reviewNow" data-v="'+c.id+'" title="Run the account review now: about half a day of your time">Review due</button>':'')+'</span><span class="r">'+gbp(clientMRR(c))+' <span class="'+(p.pct<0?'neg':p.pct<0.2?'wrn':'mut')+'" title="Margin">'+(p.settling?'new':pct(p.pct))+'</span></span><span class="sub">'+(amOf(c)?roleDot('am')+esc(amOf(c).name)+' · ':roleDot('founder')+'You · ')+c.sector+' · '+c.seats+' users'+(p.ehr!=null?' · <span class="'+ehrCls(p.ehr)+'">'+gbp(p.ehr)+'/h</span>':'')+' · satisfaction '+Math.round(c.sat)+' · trust '+Math.round(c.trust)+'<span style="display:block;margin:4px 0">'+meter(c.sat/100,satCls(c.sat))+'</span>'+svcChips(SVC_ORDER.filter(k=>c.svc[k]))+'</span></li>').join('')+'</ul>'):'<p class="empty">No clients match this filter.</p>';
  }
  return h+'</div>';
}
function dealRow(d){
  const kind={new:'New client',cross:'Cross-sell',project:'Project'}[d.kind];
  const val=d.kind==='project'?gbp(d.proj.value):sgbp(dealMRR(d,1))+'/mo';
  const what=d.kind==='project'?'<span class="chips"><span class="chip">'+esc(d.proj.name)+'</span><span class="chip">~'+d.proj.est+'h</span></span>':svcChips(d.svc);
  const status=(d.by&&ST(d.by)?'Sent by '+esc(ST(d.by).name)+' · ':'')+(d.stage==='pitched'?'Proposal sent · decision in '+daysLeft(d.resolve)+' · '+pct(d.win)+' chance':(d.draft?'<b class="wrn">Ready for your sign-off</b> · prepared by '+esc((ST(d.draft.by)||{name:'your account manager'}).name)+' · ':(d.drafter&&ST(d.drafter)?esc(ST(d.drafter).name)+' is writing it up · ':''))+'Expires '+(d.exp-S.day<=0?'today':'in '+daysLeft(d.exp)));
  return '<li class="item'+(d.stage==='open'?' click':'')+'" '+(d.stage==='open'?'data-act="deal" data-v="'+d.id+'"':'')+'><span><b>'+esc(dealName(d))+'</b> <span class="mut">'+kind+(d.big?' · tender':'')+'</span></span><span class="r">'+val+'</span><span class="sub">'+what+'<span style="display:block;margin-top:3px">'+status+(d.note?' · '+esc(d.note):'')+'</span></span></li>';
}
function paneSales(){
  const lpm=leadsPerMonth();
  let h='<div class="sec"><div class="tiles"><div class="tile"><span class="k">New leads</span><span class="v">~'+lpm.toFixed(1)+'</span><small>a month at this pace</small></div>'+
    '<div class="tile"><span class="k">Reputation</span><span class="v">'+Math.round(S.co.rep)+'</span><small>drives lead volume</small></div>'+
    '<div class="tile"><span class="k">Pipeline</span><span class="v">'+gbp(S.deals.reduce((a,d)=>a+(d.kind==='project'?0:dealMRR(d,1)),0))+'</span><small>monthly, if it all lands</small></div></div>';
  if(lpm<1.5&&!hasRole('am'))h+='<p class="note">Leads come from selling time'+(S.co.mode==='sell'?', reputation and marketing. Early on they’re slow whatever you do.':'. More of your day on selling, marketing, or an account manager all bring more.')+'</p>';
  h+='</div>';
  const open=S.deals.filter(d=>d.stage==='open'),sent=S.deals.filter(d=>d.stage==='pitched');
  h+='<div class="sec"><h3>Needs a proposal</h3>'+(open.length?'<ul class="list">'+open.map(dealRow).join('')+'</ul>':'<p class="empty">Nothing waiting. New leads and cross-sell chances turn up here.</p>')+'</div>';
  if(sent.length)h+='<div class="sec"><h3>Waiting to hear back</h3><ul class="list">'+sent.map(dealRow).join('')+'</ul></div>';
  return h+marketingSec();
}
function paneProjects(){
  let h=paneOnboarding()+'<div class="sec"><h3>Projects</h3><p class="lede">Engineers and you (when hands-on) work projects with hours left over from the desk. Estimates are estimates: overruns come out of your margin.</p>';
  {const pj=projHoursLeft();if(pj>0){const qd=projQueueDays();h+='<p class="note'+(qd>40?' warn':'')+'">'+Math.round(pj)+'h of project and onboarding work queued. '+(()=>{const r=S.sla.slice(-5).filter(x=>x.pj!=null);const rate=r.length?r.reduce((a,x)=>a+x.pj,0)/r.length:0;if(rate>0.3)return 'The team is getting through about '+rate.toFixed(1)+'h a day, so roughly '+Math.round(pj/rate)+' working days at this pace.';return qd>=999?'Engineers have no spare time after second line, so almost none of it is moving.':'At current engineer time that’s about '+Math.round(qd)+' working days.';})()+'</p>';}}
  if(!S.projects.length)return h+'<p class="empty">No projects on. Clients on managed support ask for quotes as trust grows.</p></div>';
  h+='<ul class="list">'+S.projects.map(p=>{const c=C(p.cid);const f=p.done/p.est;
    return '<li class="item"><span><b>'+esc(p.name)+'</b> <span class="mut">'+esc(c?c.name:'')+'</span></span><span class="r">'+gbp(p.value)+'</span><span class="sub">'+meter(Math.min(1,f),f>1?'w':'p')+'<span style="display:block;margin-top:3px">'+p.done.toFixed(1)+'h of '+p.est+'h estimate'+(f>1?' <span class="wrn">(over)</span>':'')+' · cost so far '+gbp(p.cost||0)+' · margin so far <span class="'+(p.value-(p.cost||0)<0?'neg':'')+'">'+gbp(p.value-(p.cost||0))+'</span> · '+(p.late?'<span class="neg">late</span>':'due in '+daysLeft(p.due))+'</span></span></li>';}).join('')+'</ul>';
  return h+'</div>';
}
function paneTeam(){
  const free=freeDesk()>=0;
  let h='<div class="sec"><h3>Hire</h3>'+(free?'':'<p class="note warn">Every desk is taken. <button class="linkbtn" data-act="tab" data-v="office">Move somewhere bigger</button> before you can hire.</p>')+'<div class="list">'+ROLE_ORDER.map(r=>'<div class="item"><span>'+roleDot(r)+'<b>'+ROLES[r].t+'</b></span><span><button class="btn sm" data-act="hire" data-v="'+r+'" '+(free&&!(ROLES[r].mgr&&mgrOf(r))?'':'disabled')+'>'+(ROLES[r].mgr&&mgrOf(r)?'In post':'See candidates')+'</button></span><span class="sub">'+ROLES[r].blurb+' '+gbp(ROLES[r].sal[0])+' to '+gbp(ROLES[r].sal[1])+' a month.</span></div>').join('')+'</div></div>';
  h+='<div class="sec"><h3>The team</h3><p class="lede">Payroll '+gbp(payroll())+' a month, including about 15% employer National Insurance and pension on top of salaries. '+((founderSt()||{}).salary?'That includes your own '+gbp(founderSt().salary)+'.':'You draw nothing until you decide the business can afford it (Money tab).')+'</p><ul class="list">'+staffOn().map(s=>{
    const flags=[];if(!started(s))flags.push('starts in '+daysLeft(s.start));if(s.away>S.day)flags.push('away');if(s.leaveOn!=null)flags.push('<span class="neg">leaving</span>');
    return '<li class="item click" data-act="staff" data-v="'+s.id+'"><span>'+roleDot(s.role)+'<b>'+esc(s.name)+'</b> <span class="mut">'+ROLES[s.role].short+'</span></span><span class="r">'+(s.salary?gbp(s.salary):'–')+'</span><span class="sub">'+dots(s.skill)+(s.role==='am'?' · '+amLoad(s)+' of '+amCap(s)+' clients':'')+' · morale '+Math.round(s.morale)+(flags.length?' · '+flags.join(' · '):'')+'</span></li>';}).join('')+'</ul></div>';
  h+=payReviewSec()+commBlock();
  if(typeof otherTeamsSec==='function')h+=otherTeamsSec();
  h+=knowledgeMatrix();
  return h;
}
function paneStack(){
  const admin=toolsOn()*0.3;
  const teamSpend=(typeof ttMonthly==='function')?ttMonthly():0;
  const surf=(typeof surface==='function')?surface():null;
  let h='<div class="sec"><p class="lede">Everything the business runs on, in one place: the vendors you resell, the products you standardise on, and the software your teams use to run themselves. Keep it lean, negotiate hard, and mind the risk each piece brings.</p><div class="tiles"><div class="tile"><span class="k">Tool spend</span><span class="v">'+gbp(toolsCost()+teamSpend)+'</span><small>a month, all software</small></div><div class="tile"><span class="k">Cost of sales</span><span class="v">'+gbp(costOfSales())+'</span><small>resold services</small></div>'+(surf!=null?'<div class="tile"><span class="k">Attack surface</span><span class="v">'+surf+'</span><small>every tool is a way in</small></div>':'')+'</div></div>';
  h+=(typeof coreStackSec==='function')?coreStackSec():stackProducts();
  h+='<div class="sec"><h3>Your catalogue</h3><table><thead><tr><th>Service</th><th class="r">Price</th><th class="r">Cost</th><th class="r">Units</th></tr></thead><tbody>'+SVC_ORDER.map(k=>'<tr><td>'+SVC[k].name+(SVC[k].vendor&&!vendOn(SVC[k].vendor)?' <span class="chip">needs '+VEND[SVC[k].vendor].name+'</span>':'')+'</td><td class="r"><button class="btn sm" data-act="catPrice" data-v="'+k+':-1" title="New deals only">−</button> £'+S.price[k].toFixed(2)+'/'+SVC[k].unit+' <button class="btn sm" data-act="catPrice" data-v="'+k+':1" title="New deals only">+</button></td><td class="r">'+(SVC[k].cost?'£'+svcCost(k).toFixed(2):'labour')+'</td><td class="r">'+svcUsers(k)+'</td></tr>').join('')+'</tbody></table></div>';
  return h;
}
function paneOffice(){
  const t=TIERS[S.office.tier];
  let h='<div class="sec"><h3>'+t.name+'</h3><p class="lede">'+t.addr+'. '+staffOn().length+' of '+t.cap+' desks used. '+(t.rent?'Rent '+gbp(t.rent)+' a month.':'No rent, but no room to grow.')+(t.shared?' Shared kitchen and a bookable meeting room.':'')+'</p>';
  if(t.slots){h+='<ul class="list">'+Array.from({length:t.slots},(_,j)=>{const k=(S.office.slots||[])[j];return '<li class="item"><span><b>'+(k?ROOMS[k].t:'Empty room')+'</b></span><span>'+(k?'':'<button class="btn sm primary" data-act="room" data-v="'+j+'">Fit out</button>')+'</span><span class="sub">'+(k?ROOMS[k].d:'Space for a kitchen, meeting room, NOC or training room.')+'</span></li>';}).join('')+'</ul>';}
  else h+='<p class="note">No room for a kitchen or meeting room here. Rooms come with a unit of your own.</p>';
  h+='</div><div class="sec"><h3>Move</h3><ul class="list">'+TIERS.map((x,i)=>{if(i===S.office.tier)return '';const fits=staffOn().length<=x.cap;
    return '<li class="item"><span><b>'+x.name+'</b> <span class="mut">'+x.cap+' desks'+(x.slots?' · '+x.slots+' rooms':'')+'</span></span><span class="r">'+(x.rent?gbp(x.rent)+'/mo':'free')+'</span><span class="sub">'+x.addr+'. '+(x.move?'Fit-out and move '+gbp(x.move)+'. ':'')+'<span class="row" style="margin-top:6px"><button class="btn sm'+(i>S.office.tier?' primary':'')+'" data-act="move" data-v="'+i+'" '+(fits?'':'disabled')+'>'+(fits?'Move here':'Too small for the team')+'</button></span></span></li>';}).join('')+'</ul></div>';
  return h;
}
function paneMoney(){
  const grp=typeof groupMRR==='function'?groupMRR():mrr();const br=typeof branchMRR==='function'?branchMRR():0;const inv=typeof investIncomeM==='function'?investIncomeM():0;
  const b=burn(),m=grp;const net=m-b;
  let h='<div class="sec"><div class="tiles"><div class="tile"><span class="k">Cash</span><span class="v '+(S.co.cash<0?'neg':'')+'">'+gbp(S.co.cash)+'</span><small>overdraft to −£10,000</small></div>'+
    '<div class="tile"><span class="k">Group MRR</span><span class="v">'+gbp(m)+'</span><small>'+(br>0?gbp(mrr())+' head office + '+gbp(br)+' branches':gbp(m*12)+' a year')+'</small></div>'+
    '<div class="tile"><span class="k">Recurring profit</span><span class="v '+(companyPL().op<0?'neg':'')+'">'+sgbp(companyPL().op)+'</span><small>a month, before projects and one-offs</small></div>'+
    (inv>0?'<div class="tile"><span class="k">Investment income</span><span class="v pos">'+gbp(inv)+'</span><small>a month, dividends &amp; interest</small></div>':'')+'</div></div>';
  {const P=companyPL();const row=(l,v,cls,b)=>'<tr><td>'+l+(b?' <span class="mut" style="font-size:.76rem">'+b+'</span>':'')+'</td><td class="r '+(cls||'')+'">'+v+'</td></tr>';
   h+='<div class="sec"><h3>Profit and loss, monthly run rate</h3><p class="lede">Recurring revenue against what it costs to deliver, then what it costs to run the company. Projects and one-offs sit on top of this.</p><table><tbody>'+
   row('Recurring revenue',gbp(P.rev))+row('Resold services','−'+gbp(P.resold))+row('Service desk and engineers','−'+gbp(P.techPay),'',projShare()>0.02?pct(projShare())+' of their time went on projects and onboarding, charged to those instead':'')+
   '<tr class="total"><td>Gross margin <span class="mut" style="font-size:.76rem">healthy MSPs: 45 to 60%</span></td><td class="r '+(P.gpct<0.3?'neg':P.gpct<0.45?'wrn':'pos')+'">'+gbp(P.gross)+' · '+pct(P.gpct)+'</td></tr>'+
   '<tr class="head"><td colspan="2">Overheads</td></tr>'+row('Managers, account and service delivery','−'+gbp(P.people))+(P.founder?row('Your salary','−'+gbp(P.founder)):'')+(P.perks?row('Staff benefits','−'+gbp(P.perks)):'')+(P.commission?row('Sales commission','−'+gbp(P.commission),'','last month'):'')+row('Office','−'+gbp(P.rent))+row('Tools','−'+gbp(P.tools))+(P.fin?row('Loan interest','−'+gbp(P.fin)):'')+
   row('Overheads as a share of revenue',pct(P.opct),'','this is what each client carries in its “after overheads” figure')+
   '<tr class="total"><td>Operating profit <span class="mut" style="font-size:.76rem">healthy MSPs: 10 to 20%</span></td><td class="r '+(P.oppct<0?'neg':P.oppct<0.1?'wrn':'pos')+'">'+gbp(P.op)+' · '+pct(P.oppct)+'</td></tr></tbody></table><p class="mut" style="font-size:.76rem;margin-top:6px">'+((founderSt()||{}).salary?'Your salary sits in overheads.':(S.co.divs?'You pay yourself in dividends, which come out of profit rather than overheads.':'You pay yourself nothing yet')+', so your own hours aren’t a cost here.')+' Client margins value your time at '+gbp(FOUNDER_M)+' a month either way, so they stay honest.</p></div>';}
  if(S.hist.length>=2)h+='<div class="sec"><h3>History</h3><canvas class="chart" id="chart" aria-label="MRR and cash by month"></canvas><div class="key"><span><i style="background:var(--p)"></i>MRR</span><span><i style="background:var(--good)"></i>Cash</span></div></div>';
  {const rows=SVC_ORDER.map(k=>{let rev=0,cost=0,hrs=0;for(const c of active())if(c.svc[k]){rev+=svcPrice(c,k)*units(c,k);cost+=svcCost(k)*units(c,k);hrs+=estHours(k,units(c,k),c.sector);}return {k,rev,cost,lab:hrs*blendedRate()};}).filter(r=>r.rev>0);
   if(rows.length){const tot=rows.reduce((a,r)=>({rev:a.rev+r.rev,cost:a.cost+r.cost,lab:a.lab+r.lab}),{rev:0,cost:0,lab:0});
    h+='<div class="sec"><h3>By service</h3><p class="lede">What each line earns after resold costs and an estimate of the support time it creates.</p><table><thead><tr><th>Service</th><th class="r">Revenue</th><th class="r">Resold</th><th class="r">Time</th><th class="r">Margin</th></tr></thead><tbody>'+rows.map(r=>{const m=r.rev-r.cost-r.lab;return '<tr><td>'+SVC[r.k].short+'</td><td class="r">'+gbp(r.rev)+'</td><td class="r">'+(r.cost?'−'+gbp(r.cost):'–')+'</td><td class="r">−'+gbp(r.lab)+'</td><td class="r '+(m<0?'neg':'')+'">'+pct(m/r.rev)+'</td></tr>';}).join('')+'<tr class="total"><td>Total</td><td class="r">'+gbp(tot.rev)+'</td><td class="r">−'+gbp(tot.cost)+'</td><td class="r">−'+gbp(tot.lab)+'</td><td class="r">'+pct((tot.rev-tot.cost-tot.lab)/tot.rev)+'</td></tr></tbody></table>'+(()=>{const idle=companyPL().techPay-tot.lab;return idle>50?'<p class="mut" style="font-size:.8rem;margin-top:6px">Technician pay not spent on client support: '+gbp(idle)+' a month. That’s time on projects, onboarding, learning and waiting for work, and it’s why the gross margin above is lower than this table.</p>':'';})()+'</div>';}}
  const r=S.last;
  if(r){const L=r.L;
    const recInc=L.rec+(L.soft||0)+(L.branch||0)+(L.invest||0),recCost=L.vend+L.sal+(L.comm||0)+L.tools+L.rent+(L.perks||0)+L.int,recVal=recInc-recCost;
    const oneInc=L.setup+L.proj,oneCost=L.other||0,oneNet=oneInc-oneCost;
    const neg='<td class="r">−',pos='<td class="r">';
    h+='<div class="sec"><h3>'+r.label+', cash in and out</h3><p class="lede">Your steady result first, then the one-offs that push a single month above or below it. Recurring is what the business earns month in, month out; one-offs are lumpy.</p><table><tbody>'+
    '<tr class="head"><td colspan="2">Recurring</td></tr><tr><td>Recurring services</td>'+pos+gbp(L.rec)+'</td></tr>'+(L.soft?'<tr><td>Product and hosting revenue</td>'+pos+gbp(L.soft)+'</td></tr>':'')+(L.branch?'<tr><td>Branch contribution</td>'+(L.branch>=0?pos:neg)+gbp(Math.abs(L.branch))+'</td></tr>':'')+(L.invest?'<tr><td>Investment income (dividends, interest)</td>'+pos+gbp(L.invest)+'</td></tr>':'')+'<tr><td>Resold services</td>'+neg+gbp(L.vend)+'</td></tr><tr><td>Salaries</td>'+neg+gbp(L.sal)+'</td></tr>'+(L.comm?'<tr><td>Sales commission</td>'+neg+gbp(L.comm)+'</td></tr>':'')+'<tr><td>Tools</td>'+neg+gbp(L.tools)+'</td></tr>'+(L.rent?'<tr><td>Rent</td>'+neg+gbp(L.rent)+'</td></tr>':'')+(L.perks?'<tr><td>Staff benefits</td>'+neg+gbp(L.perks)+'</td></tr>':'')+(L.int?'<tr><td>Interest</td>'+neg+gbp(L.int)+'</td></tr>':'')+
    '<tr class="total"><td>Recurring result</td><td class="r '+(recVal<0?'neg':'pos')+'">'+(recVal<0?'−':'')+gbp(Math.abs(recVal))+'</td></tr>'+
    '<tr class="head"><td colspan="2">One-offs this month</td></tr>'+((oneInc||oneCost)?('<tr><td>Onboarding and one-offs</td>'+pos+gbp(L.setup)+'</td></tr><tr><td>Projects completed</td>'+pos+gbp(L.proj)+'</td></tr>'+(oneCost?'<tr><td>Marketing, recruiting, training, one-offs</td>'+neg+gbp(oneCost)+'</td></tr>':'')):'<tr><td class="mut" colspan="2">None this month</td></tr>')+
    '<tr class="total"><td>One-offs, net</td><td class="r '+(oneNet<0?'neg':'pos')+'">'+(oneNet<0?'−':'+')+gbp(Math.abs(oneNet))+'</td></tr>'+
    '<tr class="total"><td>'+(r.profit>=0?'This month, profit':'This month, loss')+'</td><td class="r '+(r.profit<0?'neg':'pos')+'">'+(r.profit<0?'−':'')+gbp(Math.abs(r.profit))+'</td></tr></tbody></table>'+
    (oneNet<0&&recVal>0?'<p class="mut" style="font-size:.8rem;margin-top:6px">Your recurring business made '+gbp(recVal)+' this month. One-off spending is what pulled the month '+(r.profit<0?'into a loss':'down')+' — that’s normal in a month you recruit, market or buy kit.</p>':oneInc>oneCost&&oneInc>0?'<p class="mut" style="font-size:.8rem;margin-top:6px">A '+gbp(oneInc)+' lift from projects and onboarding flattered this month. Your steady, repeatable result is '+gbp(recVal)+'.</p>':'')+'</div>';}
  h+=ownerSec()+perksSec()+saleSec();
  const lim=loanLimit();
  h+='<div class="sec"><h3>Bank</h3><p class="lede">Loan '+gbp(S.co.loan)+' at 9%. The bank will lend up to '+gbp(lim)+' against your recurring revenue'+(bankNervous()?', but after three losing months it won’t lend any more until you turn a profit':'')+'. Two month-ends past the overdraft and it’s over.</p><div class="row"><button class="btn" data-act="borrow" '+(S.co.loan+5000<=lim?'':'disabled')+'>Borrow £5,000</button><button class="btn" data-act="repay" '+(S.co.loan>=5000&&S.co.cash>=5000?'':'disabled')+'>Repay £5,000</button></div></div>';
  return h;
}
const NEWS_FILTERS={
  all:{t:'All',f:()=>true},
  key:{t:'Key events',f:l=>l.kind==='good'||l.kind==='bad'||l.kind==='event'},
  good:{t:'Wins',f:l=>l.kind==='good'},
  bad:{t:'Problems',f:l=>l.kind==='bad'},
  money:{t:'Money',f:l=>/£|invoice|cash|dividend|\bpaid\b|overdraft|profit|savings|shares?|commission|bonus/i.test(l.text||'')}
};
function paneNews(){
  let h='<div class="sec"><h3>Milestones</h3><ul class="miles">'+MILES.map(m=>'<li class="'+(S.miles[m.id]!=null?'done':'')+'"><i class="tick"></i><div><b>'+m.t+'</b><span>'+(S.miles[m.id]!=null?'Reached '+dLabel(S.miles[m.id]):m.d)+'</span></div></li>').join('')+'</ul></div>';
  const filt=NEWS_FILTERS[ui.newsFilter]?ui.newsFilter:'all';
  const chips=Object.keys(NEWS_FILTERS).map(k=>'<button class="chip'+(filt===k?' p':'')+'" data-act="newsFilter" data-v="'+k+'">'+NEWS_FILTERS[k].t+'</button>').join('');
  const list=S.log.filter(NEWS_FILTERS[filt].f).slice(0,70);
  h+='<div class="sec"><div class="row" style="justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px"><h3>What’s happened</h3><div class="chips">'+chips+'</div></div>';
  h+='<ul class="news">'+(list.length?list.map(l=>'<li class="'+l.kind+'"><time>'+dLabel(l.d)+'</time><span>'+esc(l.text)+'</span></li>').join(''):'<li class="mut" style="list-style:none;padding:8px 0">Nothing to show under this filter yet.</li>')+'</ul></div>';
  S.seen=S.seq;
  return h;
}
function renderPane(){
  const f={desk:paneDesk,clients:paneClients,sales:paneSales,market:(typeof paneMarket==='function'?paneMarket:paneSales),tenders:(typeof paneTenders==='function'?paneTenders:paneSales),projects:paneProjects,team:paneTeam,stack:paneStack,office:paneOffice,money:paneMoney,invest:(typeof paneInvest==='function'?paneInvest:paneMoney),news:paneNews,risk:paneRisk,strategy:paneStrategy}[ui.tab];
  const p=$('pane');const top=p.scrollTop;p.innerHTML=f();p.scrollTop=top;
  if(ui.tab==='money')drawChart();
}
function drawChart(){
  const cv=$('chart');if(!cv)return;const K=V.col;
  const dpr=window.devicePixelRatio||1,w=cv.clientWidth,h=cv.clientHeight;cv.width=w*dpr;cv.height=h*dpr;const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);
  const H=S.hist.slice(-24);const vals=H.flatMap(x=>[x.mrr,x.cash]);let lo=Math.min(0,...vals),hi=Math.max(1000,...vals);
  const pad={l:48,r:8,t:8,b:18};const sx=i=>pad.l+i*(w-pad.l-pad.r)/Math.max(1,H.length-1),sy=v=>pad.t+(hi-v)/(hi-lo)*(h-pad.t-pad.b);
  c.font='10px '+K.mono;c.fillStyle=K.muted;c.strokeStyle=K.line;c.lineWidth=1;
  for(let i=0;i<=3;i++){const v=lo+(hi-lo)*i/3;const y=sy(v);c.beginPath();c.moveTo(pad.l,y);c.lineTo(w-pad.r,y);c.stroke();c.fillText(gbp(v),2,y+3);}
  if(lo<0){c.strokeStyle=K.muted;c.beginPath();c.moveTo(pad.l,sy(0));c.lineTo(w-pad.r,sy(0));c.stroke();}
  c.fillText(mShort(H[0].mi),pad.l,h-4);c.textAlign='right';c.fillText(mShort(H[H.length-1].mi),w-pad.r,h-4);c.textAlign='left';
  [['mrr',K.p],['cash',K.good]].forEach(([k,col])=>{c.strokeStyle=col;c.lineWidth=2;c.beginPath();H.forEach((x,i)=>{const X_=sx(i),Y_=sy(x[k]);i?c.lineTo(X_,Y_):c.moveTo(X_,Y_);});c.stroke();
    const l=H[H.length-1];c.fillStyle=col;c.beginPath();c.arc(sx(H.length-1),sy(l[k]),3,0,7);c.fill();});
}
function render(){if(!S)return;renderTop();renderTabs();renderPane();renderModal();}
