
/* ============ UI: onboarding, knowledge, kit, product swaps ============ */
const STATE_LBL={new:'Not reviewed yet',asis:'Supported as-is',aligning:'Migrating to your stack',renewal:'Align at renewal',aligned:'On your stack'};
function famCell(f){const p=Math.round(f*100);const cls=f>=0.7?'hi':f>=0.35?'mid':f>0?'lo':'no';return '<td class="fam '+cls+'">'+(f>0?p+'%':'–')+'</td>';}
function onbStage(o){return o.stage==='discovery'?'Discovery':o.stage==='plan'?'Needs your plan':o.live?(o.kind==='full'?'Live, tidying up':'In progress'):'Onboarding';}
function onbProgress(o){const tot=o.tasks.reduce((a,t)=>a+t.hrs,0),done=o.tasks.reduce((a,t)=>a+Math.min(t.done,t.hrs),0);return {tot,done};}
function paneOnboarding(){
  if(!S.onb.length)return '';
  const rows=S.onb.slice().sort((a,b)=>(b.stage==='plan')-(a.stage==='plan')||a.created-b.created).map(o=>{const c=C(o.cid);const P=onbProgress(o);
    return '<li class="item click" data-act="onb" data-v="'+o.id+'"><span><b>'+esc(c?c.name:'')+'</b> <span class="'+(o.stage==='plan'?'wrn':'mut')+'">'+onbStage(o)+'</span></span><span class="r">'+P.done.toFixed(0)+' / '+P.tot.toFixed(0)+'h</span><span class="sub">'+meter(P.tot?P.done/P.tot:0,o.stage==='plan'?'w':'p')+'<span style="display:block;margin-top:3px">'+(o.stage==='plan'?'<b class="wrn">Decide how to handle their kit.</b>':o.tasks.filter(t=>t.done<t.hrs-0.01).slice(0,2).map(t=>esc(t.n)).join(' · ')||'Finishing up')+(o.kind==='full'&&!o.live&&S.day-o.created>15?' · <span class="neg">dragging on, they’re getting impatient</span>':'')+'</span></span></li>';}).join('');
  return '<div class="sec"><h3>Onboarding</h3><p class="lede">Onboarding comes out of engineer project time, before projects. Rushing a client live frees people up now but leaves work behind.</p><ul class="list">'+rows+'</ul></div>';
}
function knowledgeMatrix(){
  const ppl=staffOn().filter(tech);const prods=relevantProds();
  if(!ppl.length||!prods.length)return '';
  const core=new Set(coreProds());
  return '<div class="sec"><h3>Product knowledge</h3><p class="lede">Unfamiliar products are worked at about half speed. Your standard stack sinks in within weeks; anything else is learned on the job or on a course.</p><div class="scrollx"><table class="matrix"><thead><tr><th></th>'+prods.map(p=>'<th class="r" title="'+esc(PRODS[p].name)+'">'+esc(PRODS[p].name.split(' ')[0])+(core.has(p)?'':' <span class="wrn">•</span>')+'</th>').join('')+'</tr></thead><tbody>'+
    ppl.map(s=>'<tr class="click" data-act="staff" data-v="'+s.id+'"><td>'+roleDot(s.role)+esc(s.name.split(' ')[0])+'</td>'+prods.map(p=>famCell(fam(s,p))).join('')+'</tr>').join('')+'</tbody></table></div><p class="mut" style="font-size:.76rem;margin-top:4px"><span class="wrn">•</span> non-standard kit a client runs</p></div>';
}
function knowSection(s){
  if(!tech(s))return '';
  const prods=[...new Set(relevantProds().concat(Object.keys(s.fam||{})))];const core=new Set(coreProds());const inUse=kitInUse();
  return '<h3 style="font-size:.95rem;margin:14px 0 6px">Product knowledge</h3><ul class="list">'+prods.map(p=>{const f=fam(s,p);const tag=core.has(p)?'your stack':inUse[p]?inUse[p]+' client'+(inUse[p]>1?'s':''):'not in use';
    return '<li class="item"><span><b>'+esc(PRODS[p].name)+'</b> <span class="mut">'+CATS[PRODS[p].cat].t+' · '+tag+'</span></span><span class="r">'+(f>0?pct(f):'never used')+'</span><span class="sub">'+meter(f,f>=0.7?'':f>=0.35?'p':'w')+(f<0.85&&(core.has(p)||inUse[p])?'<span class="row" style="margin-top:6px"><button class="btn sm" data-act="course" data-v="'+p+'" '+(present(s)?'':'disabled')+'>Course · '+gbp(courseCost(p))+' · 1 day out</button>'+(core.has(p)?'<span class="mut" style="font-size:.76rem">Picks it up on the job anyway, just slower.</span>':'')+'</span>':'')+'</span></li>';}).join('')+'</ul>';
}
function candKnows(c){
  const ks=Object.keys(c.fam||{});if(!ks.length)return c.role==='desk'||c.role==='eng'?'No product experience. ':'';
  const core=new Set(coreProds()),inUse=kitInUse();
  return 'Knows '+ks.map(p=>(core.has(p)||inUse[p]?'<b>'+esc(PRODS[p].name)+'</b>':esc(PRODS[p].name))).join(', ')+'. ';
}
function kitSection(c){
  const cats=Object.keys(c.kit||{});if(!cats.length)return c.svc.support?'<p class="mut" style="font-size:.84rem;margin-top:10px">Their kit matches your stack.</p>':'';
  return '<h3 style="font-size:.95rem;margin:14px 0 6px">Their kit</h3><ul class="list">'+cats.map(cat=>{const k=c.kit[cat];const E=kitEconomics(c,cat);
    const st=k.state==='renewal'?'Align at renewal in '+daysLeft(k.due):STATE_LBL[k.state];
    const canAlign=(k.state==='asis'||k.state==='renewal')&&c.svc.support;
    return '<li class="item"><span><b>'+esc(kitLabel(cat,k))+'</b> <span class="mut">'+st+'</span></span><span class="r">'+(k.state==='asis'||k.state==='renewal'?'≈'+gbp(E.asisNow)+'/mo':'')+'</span><span class="sub">'+(k.state!=='aligned'?'Best on your team: '+pct(E.bf)+'. ':'')+(canAlign?(E.locked?'<span class="mut">On contract with no early exit for '+E.left+' more month'+(E.left===1?'':'s')+'.</span>':E.bl?'<span class="wrn">'+esc(E.bl)+'</span>':'Aligning: '+E.alignH.toFixed(0)+'h'+(k.state!=='renewal'&&E.overlap?', '+gbp(E.overlap)+' licence overlap':'')+(E.gain?', then '+sgbp(E.gain)+'/mo resale':'')+'. <button class="btn sm" data-act="alignNow" data-v="'+cat+'">Align now</button>'):'')+'</span></li>';}).join('')+'</ul>';
}
function stackProducts(){
  let h='<div class="sec"><h3>Your standard products</h3><p class="lede">Switching costs a £500 fee, a migration for every client on it, and the whole team starts learning again.</p><ul class="list">';
  for(const cat of ['rmm','backup','edr','voice']){
    const v=CATS[cat].vend,cur=stdProd(cat),ppl=staffOn().filter(tech);const knows=ppl.filter(s=>fam(s,cur)>=0.6).length;
    const alts=Object.keys(PRODS).filter(p=>PRODS[p].cat===cat&&!PRODS[p].foreign&&p!==cur);
    const locked=S.vend[v].lock>S.day;
    const curView=(typeof PROD_ADV!=='undefined'&&PROD_ADV[cur])?' <button class="btn sm" data-act="prodView" data-v="'+cur+'">View listing</button>':'';
    h+='<li class="item"><span><b>'+esc(PRODS[cur].name)+'</b> <span class="mut">'+CATS[cat].t+(vendOn(v)?'':' · not in use')+'</span></span><span class="r">'+knows+' of '+ppl.length+' know it</span><span class="sub">'+esc(PRODS[cur].desc||'')+'<span class="row" style="margin-top:6px">'+curView+alts.map(p=>{const P=PRODS[p],C0=PRODS[cur];const diff=cat==='voice'?'£'+P.costT+'/seat':'£'+P.base+'/mo base'+(P.cost?' · £'+P.cost+'/user':'')+(P.perSeat?' · £'+P.perSeat+'/user':'');const canView=(typeof PROD_ADV!=='undefined'&&PROD_ADV[p]);
      return canView?'<button class="btn sm" data-act="prodView" data-v="'+p+'">'+esc(P.name)+' <span class="mut">'+stars(prodRat(p))+' '+prodRat(p).toFixed(1)+'</span></button>':'<button class="btn sm" data-act="switchAsk" data-v="'+p+'" '+(locked?'disabled title="Locked into a contract"':'')+'>Switch to '+esc(P.name)+' <span class="mut">('+diff+')</span></button>';}).join('')+'</span>'+(locked?'<span class="mut" style="display:block;font-size:.76rem">Locked in for '+daysLeft(S.vend[v].lock)+'.</span>':'')+'</span></li>';
  }
  h+='</ul></div>';
  h+=kitBoard();
  return h;
}
function kitBoard(){
  const rows={};for(const c of active())for(const cat in (c.kit||{})){const k=c.kit[cat];if(k.state==='aligned'||k.state==='new')continue;(rows[k.p]=rows[k.p]||[]).push({c,cat,k});}
  const ps=Object.keys(rows);if(!ps.length)return '';
  const f=ui.kitF||'all';
  let h='<div class="sec"><h3>Non-standard kit you support</h3><p class="lede">Every client running something off your stack, when you can move them, and what it would take.</p><div class="seg" style="margin-bottom:10px">'+[['all','All'],['now','Can align now'],['locked','On contract']].map(([k,l])=>'<button data-act="kitF" data-v="'+k+'" aria-pressed="'+(f===k)+'">'+l+'</button>').join('')+'</div>';
  let totAsis=0,any=false;
  for(const p of ps){
    const list=rows[p].map(r=>Object.assign(r,{E:kitEconomics(r.c,r.cat)})).filter(r=>f==='all'||(f==='now'&&(r.k.state==='asis'||r.k.state==='renewal')&&!r.E.locked&&!r.E.bl)||(f==='locked'&&r.E.locked));
    if(!list.length)continue;any=true;
    const cost=list.reduce((a,r)=>a+(r.k.state==='aligning'?0:r.E.asisNow),0);totAsis+=cost;
    const bf=bestFam(p);const trainee=staffOn().filter(s=>tech(s)&&present(s)&&fam(s,p)<0.85).sort((a,b)=>fam(b,p)-fam(a,p))[0];
    h+='<div class="plan"><div class="row" style="justify-content:space-between"><b>'+esc(PRODS[p].name)+' <span class="mut" style="font-weight:500">'+CATS[PRODS[p].cat].t+'</span></b><span class="mut" style="font-size:.8rem">≈'+gbp(cost)+'/mo to support · best on your team '+pct(bf)+'</span></div>'+
      (trainee?'<div class="row" style="margin:6px 0 2px"><button class="btn sm" data-act="kitCourse" data-v="'+p+':'+trainee.id+'">Send '+esc(trainee.name.split(' ')[0])+' on a course · '+gbp(courseCost(p))+'</button><span class="mut" style="font-size:.76rem">Cheaper than aligning if several clients will stay on it.</span></div>':'')+
      '<ul class="list">'+list.map(({c,cat,k,E})=>{
        let status,btns='';
        if(k.state==='aligning')status='<span class="pos">Migration under way</span>';
        else if(E.locked)status='<span class="mut">Locked in: no early exit, renews in '+E.left+' month'+(E.left===1?'':'s')+'</span>';
        else if(E.bl)status='<span class="wrn">'+esc(E.bl)+'</span>';
        else status=(k.state==='renewal'?'Aligning at renewal in '+daysLeft(k.due)+'. ':'')+(E.left?E.left+' month'+(E.left===1?'':'s')+' left, '+gbp(E.overlap)+' overlap to leave now':'Out of contract, free to move');
        if(k.state!=='aligning'&&!E.bl){
          if(!E.locked)btns+='<button class="btn sm primary" data-act="kitAlign" data-v="'+c.id+':'+cat+'">Align now</button>';
          if(E.left>0&&k.state!=='renewal')btns+='<button class="btn sm" data-act="kitRenew" data-v="'+c.id+':'+cat+'">Align at renewal</button>';
        }
        return '<li class="item"><span><b>'+esc(c.name)+'</b> <span class="mut">'+c.seats+' users</span></span><span class="r">'+(k.state==='aligning'?'':'≈'+gbp(E.asisNow)+'/mo')+'</span><span class="sub">'+status+(k.state!=='aligning'&&!E.bl?'<span style="display:block;margin-top:3px">Aligning: '+E.alignH.toFixed(0)+'h'+(E.gain?', then '+sgbp(E.gain)+'/mo resale':'')+(E.payback<99&&!E.locked?', pays back in ~'+Math.max(1,Math.round(E.payback))+(Math.max(1,Math.round(E.payback))===1?' month':' months'):'')+'</span>':'')+(btns?'<span class="row" style="margin-top:6px">'+btns+'</span>':'')+'</span></li>';}).join('')+'</ul></div>';
  }
  if(!any)h+='<p class="empty">Nothing matches that filter.</p>';
  else h+='<p class="mut" style="font-size:.8rem;margin-top:8px">Supporting all of this costs about '+gbp(totAsis)+' a month in slower tickets and admin.</p>';
  return h+'</div>';
}
const MODAL_EXT={
  onb(M,x){
    const o=S.onb.find(z=>z.id===M.id);if(!o)return null;const c=C(o.cid);const P=onbProgress(o);
    const left=o.tasks.filter(t=>t.done<t.hrs-0.01);
    return '<div class="dialog">'+x+'<p class="kick">Onboarding'+(onbStage(o)==='Onboarding'?'':' · '+onbStage(o))+'</p><h2>'+esc(c?c.name:'')+'</h2>'+
      '<p>'+P.done.toFixed(1)+' of '+P.tot.toFixed(1)+' hours done. Started '+(S.day-o.created)+' working days ago.</p>'+
      (o.found&&o.found.length?'<p class="note">Discovery found: '+o.found.map(esc).join('; ')+'.</p>':'')+
      '<ul class="list">'+o.tasks.map(t=>'<li class="item"><span>'+esc(t.n)+(t.prod&&!t.n.includes(PRODS[t.prod].name)?' <span class="chip">'+esc(PRODS[t.prod].name)+'</span>':'')+'</span><span class="r">'+Math.min(t.done,t.hrs).toFixed(1)+' / '+t.hrs.toFixed(1)+'h</span><span class="sub">'+meter(t.done/t.hrs,t.done>=t.hrs-0.01?'':'p')+'</span></li>').join('')+'</ul>'+
      (o.stage==='plan'?'<div class="foot2"><span class="grow"></span><button class="btn primary" data-act="plan" data-v="'+o.id+'">Make the plan</button></div>':'')+
      (o.stage==='deliver'&&!o.live&&o.kind==='full'?'<p class="note warn" style="margin-top:12px">Going live now frees your engineers, but unfinished work drops to the back of the queue. Undocumented clients raise 25% more tickets until it’s done, and skipping the welcome pack costs satisfaction.</p><div class="foot2"><span class="grow"></span><button class="btn" data-act="golive" data-v="'+o.id+'">Go live now'+(left.length?' ('+left.length+' task'+(left.length>1?'s':'')+' left)':'')+'</button></div>':'')+
      '</div>';
  },
  plan(M,x){
    const o=S.onb.find(z=>z.id===M.id);if(!o||!o.plan)return null;const c=C(o.cid);
    let cash=0,hrs=0;
    const rows=Object.keys(o.plan).map(cat=>{const k=c.kit[cat],E=kitEconomics(c,cat),ch=o.plan[cat],rec=recommend(c,cat);
      if(ch==='align'){cash+=E.overlap+(E.hw?E.hw.cost-E.hw.bill:0);hrs+=E.alignH;}
      const opt=(v,t,sub,dis)=>'<button data-act="planSet" data-v="'+cat+':'+v+'" aria-pressed="'+(ch===v)+'" '+(dis?'disabled':'')+'>'+t+(rec===v?' ★':'')+'<small>'+sub+'</small></button>';
      const adoptable=!PRODS[k.p].foreign&&CATS[cat].vend;
      return '<div class="plan"><div class="row" style="justify-content:space-between"><b>'+esc(kitLabel(cat,k))+'</b><span class="mut" style="font-size:.8rem">'+(E.left?E.left+' months left on their contract'+(E.locked?' (no early exit)':'')+' · ':'')+'best on your team: '+pct(E.bf)+'</span></div>'+
        '<div class="seg" style="grid-auto-flow:row;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));margin-top:6px">'+
        opt('align','Align now',E.locked?'Their contract has no early exit. Earliest is renewal in '+E.left+' months.':E.bl?esc(E.bl):E.alignH.toFixed(0)+'h (≈'+gbp(E.labour)+')'+(E.overlap?' + '+gbp(E.overlap)+' overlap':'')+(E.hw?' + kit billed at cost '+gbp(E.hw.cost)+', sold '+gbp(E.hw.bill):'')+(E.gain?' · '+sgbp(E.gain)+'/mo resale':'')+(E.payback<99?' · pays back ~'+Math.max(1,Math.round(E.payback))+' mo':''),!!E.bl||E.locked)+
        (E.left>0?opt('renewal','At renewal',E.bl?esc(E.bl):'as-is for '+E.left+' months, then '+E.alignH.toFixed(0)+'h with no overlap',!!E.bl):'')+
        opt('asis','Support as-is','≈'+gbp(E.asisNow)+'/mo now, ≈'+gbp(E.asisLater)+'/mo once someone knows it · no resale')+
        (adoptable?opt('adopt','Make it your standard','switch every client to '+esc(PRODS[k.p].name)+' instead'):'')+
        '</div></div>';}).join('');
    return '<div class="dialog wide">'+x+'<p class="kick">Onboarding plan</p><h2>'+esc(c.name)+'</h2><p>Discovery is done. For each piece of kit they run that isn’t on your stack, choose what to do. ★ marks the cheapest over a year.</p>'+rows+
      '<div class="foot2"><span class="grow mut">Engineer time <b class="num">'+hrs.toFixed(0)+'h</b> · cash now <b class="num '+(cash>0?'neg':'pos')+'">'+(cash>0?'−'+gbp(cash):'+'+gbp(-cash))+'</b></span><button class="btn primary" data-act="planGo" data-v="'+o.id+'">Confirm plan</button></div></div>';
  },
  switchAsk(M,x){
    const p=M.p,P=PRODS[p],cat=P.cat;const ppl=staffOn().filter(tech);const knows=ppl.filter(s=>fam(s,p)>=0.6).length;
    const n=active().filter(c=>CATS[cat].svc?c.svc[CATS[cat].svc]||(cat==='voice'&&c.svc.connect):(cat==='rmm'&&c.svc.support)).length;
    return '<div class="dialog">'+x+'<p class="kick">'+CATS[cat].t+'</p><h2>Switch to '+esc(P.name)+'?</h2><p>'+esc(P.desc||'')+'</p><ul class="list"><li class="item"><span>Switching fee</span><span class="r">'+(vendOn(CATS[cat].vend)?'£500':'none, not in use yet')+'</span></li><li class="item"><span>Client migrations</span><span class="r">'+n+' × ~'+ALIGN_H[cat](20).toFixed(0)+'h</span></li><li class="item"><span>Team who already know it</span><span class="r">'+knows+' of '+ppl.length+'</span></li></ul><p class="note warn">Your discounts and any price rises with the old vendor reset. Until people learn it, tickets on it run slow.</p><div class="foot2"><span class="grow"></span><button class="btn" data-act="close">Keep '+esc(PRODS[stdProd(cat)].name)+'</button><button class="btn primary" data-act="switchGo" data-v="'+p+'">Switch</button></div></div>';
  }
};
const ACT_EXT={
  kitF:v=>{ui.kitF=v;},
  kitAlign:v=>{const [cid,cat]=v.split(':');const c=C(cid);if(c)alignNow(c,cat);},
  kitRenew:v=>{const [cid,cat]=v.split(':');const c=C(cid);const k=c&&c.kit[cat];if(k&&k.state!=='aligning'){k.state='renewal';k.due=S.day+monthsLeft(k)*DPM;log(c.name+' will move off '+PRODS[k.p].name+' when their contract ends.','info');}},
  kitCourse:v=>{const [p,sid]=v.split(':');const s=ST(sid);if(s&&present(s)){spend(courseCost(p));s.away=S.day+1;s.course=s.away;s.fam=s.fam||{};s.fam[p]=Math.max(fam(s,p),0.85);log(s.name+' is on '+aN(PRODS[p].name)+' course for the day.','info');}},
  onb:v=>{ui.modal={type:'onb',id:v};},
  plan:v=>{ui.modal={type:'plan',id:v};},
  planSet:v=>{const o=S.onb.find(z=>z.id===ui.modal.id);if(o&&o.plan){const [cat,ch]=v.split(':');o.plan[cat]=ch;}},
  planGo:v=>{const o=S.onb.find(z=>z.id===v);if(o&&o.plan){confirmPlan(o);log('Onboarding plan for '+(C(o.cid)||{}).name+' confirmed.','info');}ui.modal={type:'onb',id:v};},
  golive:v=>{const o=S.onb.find(z=>z.id===v);if(o)goLive(o);ui.modal=null;},
  course:v=>{const s=ST(ui.modal.id);if(s&&present(s)){spend(courseCost(v));s.away=S.day+1;s.course=s.away;s.fam=s.fam||{};s.fam[v]=Math.max(fam(s,v),0.85);log(s.name+' is on '+aN(PRODS[v].name)+' course for the day.','info');}},
  alignNow:v=>{const c=C(ui.modal.id);if(c)alignNow(c,v);},
  switchAsk:v=>{ui.modal={type:'switchAsk',p:v};},
  switchGo:v=>{switchStandard(PRODS[v].cat,v);ui.modal=null;}
};
