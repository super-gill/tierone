
/* ============ people: traits, form, mistakes, moments, interviews ============ */
const TR={
  steady:{t:'Steady',d:'Burns out half as fast.',q:'Unflappable when you described a bad Monday on the desk.'},
  quick:{t:'Quick learner',d:'Picks up products and skills faster.',q:'Picked up your RMM demo faster than you expected.'},
  fast:{t:'Fast',d:'Works 15% faster, but about 1 in 10 of their tickets comes back reopened.',q:'Talks about closing 40 tickets a day like it’s a sport.'},
  thorough:{t:'Thorough',d:'10% slower, but fixes root causes. Nothing comes back and clients notice.',q:'Walked you through their troubleshooting method, step by step.'},
  people:{t:'People person',d:'Clients like them. Every ticket they close lifts satisfaction a little.',q:'Had you laughing within five minutes.'},
  sharp:{t:'Sharp',d:'Now and then spots something big early, like a phishing campaign.',q:'Spotted the lookalike domain in your test email straight away.'},
  cowboy:{t:'Cowboy',d:'15% faster, but occasionally breaks something with an unplanned change.',q:'Admits they “just get it done” and sort the paperwork after.'},
  optimist:{t:'Optimist',d:'Projects they work on slip. Every hour gets less done than planned.',q:'Reckoned a server migration is “a couple of days, tops”.'},
  goldplater:{t:'Gold-plater',d:'Projects take longer, but clients love the finish.',q:'Showed you a network diagram they redrew three times for fun.'},
  yesman:{t:'Can’t say no',d:'Quietly agrees to extra work on projects without billing it.',q:'Says they never like telling a client no.'},
  hunter:{t:'Hunter',d:'Finds 30% more leads and pushes hard to close, often by discounting.',q:'Asked about commission before salary.'},
  overpromiser:{t:'Overpromiser',d:'Wins more deals. Sometimes you find out afterwards what was promised.',q:'Very confident. Maybe too confident about what your desk can do.'},
  farmer:{t:'Farmer',d:'Finds fewer new leads, but their clients’ trust grows faster.',q:'Most proud of a client they’ve kept for eight years.'},
  closer:{t:'Closer',d:'Wins more of the deals they touch.',q:'Talked you into a second coffee without you noticing.'},
  diplomat:{t:'Diplomat',d:'Saves clients who’ve served notice far more often.',q:'Told a story about talking a furious client down.'},
  process:{t:'Process-driven',d:'SLA breaches hurt clients 30% less.',q:'Brought a printed copy of their escalation process.'},
  gatekeeper:{t:'Gatekeeper',d:'Often catches what sales promised before it lands on the desk.',q:'Says their job is protecting the desk from sales.'}
};
const TR_POOL={desk:['fast','thorough','people','sharp','steady','quick'],eng:['cowboy','optimist','goldplater','yesman','steady','quick'],am:['hunter','overpromiser','farmer','closer','steady'],sdm:['diplomat','process','gatekeeper','steady']};
const TR_CLASH=[['fast','thorough'],['hunter','farmer'],['cowboy','goldplater'],['optimist','goldplater']];
const hasT=(s,t)=>!!s&&((s.traits&&s.traits.includes(t))||s.trait===t);
function rollTraits(role){
  const pool=TR_POOL[role]||[];const n=Math.random()<0.4?2:1;const out=[];
  if(!pool.length)return out;
  let guard=0;while(out.length<n&&guard++<20){const t=pick(pool);if(t==null)continue;if(out.includes(t))continue;if(TR_CLASH.some(([a,b])=>(t===a&&out.includes(b))||(t===b&&out.includes(a))))continue;out.push(t);}
  return out;
}
function note(s,text,kind){s.rec=s.rec||[];s.rec.unshift({d:S.day,text,kind:kind||'bad'});if(s.rec.length>12)s.rec.pop();}
function reveal(s,t,how){if(!TR[t])return;s.known=s.known||{};if(s.known[t])return;s.known[t]=true;log((how?how+'They’re '+TR[t].t.toLowerCase()+': ':'You’re getting a read on '+s.name+': '+TR[t].t.toLowerCase()+'. ')+TR[t].d,'info');}
function migratePeople(){
  S.hq=S.hq||[];if(S.nextHuman==null)S.nextHuman=S.day+ri(10,18);
  for(const s of S.staff){
    if(!s.traits){s.traits=s.trait?[s.trait]:[];s.known={};if(s.trait)s.known[s.trait]=true;}
    if(s.cons==null)s.cons=s.id==='you'?0.8:rnd(0.45,0.95);
    if(s.form==null)s.form=1;s.rec=s.rec||[];
  }
}
/* effects wired into the day */
function traitSpeed(s){return (s.form||1)*(hasT(s,'fast')?1.15:1)*(hasT(s,'thorough')?0.9:1)*(hasT(s,'cowboy')?1.15:1);}
function projMult(s){return (hasT(s,'optimist')?0.87:1)*(hasT(s,'goldplater')?0.85:1);}
function onClose(s,t,made){
  const c=C(t.cid);
  if(c&&hasT(s,'people'))c.sat=Math.min(100,c.sat+0.3);
  if(c&&hasT(s,'thorough'))c.sat=Math.min(100,c.sat+0.1);
  if(!t.oneoff)S.qs.closed++;
  if(c&&!t.oneoff&&!t.reopen){
    const p=((hasT(s,'fast')?0.1:0)+(1-(s.cons||0.8))*0.03)*chaos()*(1-qcCut())*(1-(typeof tmReopenCut==='function'?tmReopenCut():0));
    if(!hasT(s,'thorough')&&Math.random()<p){const h=Math.max(0.3,t.hrs*0.5);const r={id:uid(),cid:t.cid,svc:t.svc,lvl:t.lvl,pri:Math.max(1,t.pri-1),hrs:h,left:h,born:S.day,br:false,subj:'Reopened: '+t.subj.replace(/^Reopened: /,''),prod:t.prod,reopen:true};S.tickets.push(r);if(made)made.push(r);c.sat=Math.max(0,c.sat-1.5);s.reopens=(s.reopens||0)+1;S.qs.reopen++;
      if(Math.random()<0.3)note(s,'“'+t.subj+'” for '+c.name+' came back reopened.');
      if(hasT(s,'fast')&&!(s.known||{}).fast&&s.reopens>=4)reveal(s,'fast','Tickets keep coming back reopened after '+s.name+' closes them. ');}
  }
}
function peopleDaily(W){
  const supp=active().filter(c=>c.svc.support);
  for(const w of W){const s=w.st;
    if(S.day%5===0)s.form=1+rnd(-1,1)*(1-(s.cons||0.8))*0.22;
    // traits reveal themselves with time
    for(const t of (s.traits||[]))if(!(s.known||{})[t]&&S.day-s.start>10&&Math.random()<1/45)reveal(s,t);
    if(!tech(s))continue;
    const worked=w.used>2;
    // mistakes: rarer for steady, consistent people
    if(worked&&supp.length&&Math.random()<(1-(s.cons||0.8))*0.012*chaos()*(1-qcCut()*0.5)){
      const c=pick(supp);
      if(s.role==='desk'||s.role==='founder'){
        if(Math.random()<0.5){c.sat=Math.max(0,c.sat-4);note(s,'Reset the wrong user’s password at '+c.name+'.');log(s.name+' reset the wrong user’s password at '+c.name+'. Awkward phone call.','bad');}
        else{S.tickets.push({id:uid(),cid:c.id,svc:'support',lvl:1,pri:1,hrs:1.5,left:1.5,born:S.day,br:false,subj:'Closed a P1 that wasn’t fixed'});c.sat=Math.max(0,c.sat-3);note(s,'Closed a P1 at '+c.name+' that wasn’t actually fixed.');log(s.name+' closed a P1 at '+c.name+' that wasn’t actually fixed. It’s back.','bad');}
      }else{S.tickets.push({id:uid(),cid:c.id,svc:'support',lvl:2,pri:1,hrs:2,left:2,born:S.day,br:false,subj:'Expired certificate took their VPN down'});c.sat=Math.max(0,c.sat-4);note(s,'Let a certificate expire at '+c.name+'.');log(s.name+' let a certificate expire at '+c.name+'. Their VPN is down.','bad');}
    }
    // cowboy change
    if(hasT(s,'cowboy')&&worked&&supp.length&&Math.random()<0.006){const c=pick(supp);S.tickets.push({id:uid(),cid:c.id,svc:'support',lvl:2,pri:1,hrs:3,left:3,born:S.day,br:false,subj:'Outage after an unplanned change'});c.sat=Math.max(0,c.sat-6);note(s,'An unplanned change took '+c.name+' offline.');log(s.name+' pushed a change at '+c.name+' without telling anyone. It took them offline.','bad');if(!(s.known||{}).cowboy&&Math.random()<0.6)reveal(s,'cowboy','After the outage at '+c.name+', it’s clear '+s.name+' is a ');}
    // good moments
    if(hasT(s,'sharp')&&worked&&supp.length&&Math.random()<0.006){for(const c of supp)c.sat=Math.min(100,c.sat+2);S.co.rep+=1;note(s,'Spotted a phishing campaign early and warned every client.','good');log(s.name+' spotted a phishing campaign hitting your clients and got a warning out before anyone clicked.','good');}
    if(worked&&(s.cons||0.8)>0.8&&Math.random()<0.002){note(s,'Wrote up a fix that stopped a recurring ticket.','good');log(s.name+' wrote up a fix for a recurring problem. Fewer of those tickets from now on.','good');for(const c of supp)c.sat=Math.min(100,c.sat+0.5);}
  }
  // account manager farming
  for(const c of active()){const a=amOf(c);if(a&&hasT(a,'farmer')&&present(a))c.trust=Math.min(100,c.trust+0.05);}
  if(S.co.busy){S.co.busy=Math.max(0,S.co.busy-3.5);}
  // human moments that need a decision
  if(!S.pending&&S.hq.length)S.pending=S.hq.shift();
  if(!S.pending&&S.day>=S.nextHuman){
    S.nextHuman=S.day+Math.round(ri(10,20)*clamp(5/Math.max(1,staffOn().length),0.5,1.4));
    S.hlast=S.hlast||{};const pool=Object.entries(HUMAN).filter(([id,e])=>e.w>0&&S.day-(S.hlast[id]||-999)>=50&&e.ok());if(pool.length){const [id,e]=wpick(pool.map(p=>[p,p[1].w]));S.hlast[id]=S.day;try{S.pending={id,ctx:e.ctx?e.ctx():{}};}catch(err){S.pending=null;}}
  }
}
/* deals: what the overpromiser said */
function afterWin(d,c,byAm){
  if(!byAm||!hasT(byAm,'overpromiser')||Math.random()>0.3||S.day-(byAm.promAt||-999)<63)return;
  byAm.promAt=S.day;
  const sdm=S.staff.find(s=>s.role==='sdm'&&present(s)&&hasT(s,'gatekeeper'));
  const what=pick(d.kind==='project'?['week']:['kit','discount','kit']);
  if(sdm&&Math.random()<0.6){note(sdm,'Caught '+byAm.name+' overpromising to '+c.name+'.','good');log(sdm.name+' caught '+byAm.name+' overpromising to '+c.name+' and reset expectations before it landed.','good');return;}
  S.hq.push({id:'promise',ctx:{cid:c.id,sid:byAm.id,what,pid:d.kind==='project'?(S.projects[S.projects.length-1]||{}).id:null}});
}
const HUMAN={
  promise:{w:0,ok:()=>false,make:x=>{const c=C(x.cid),s=ST(x.sid);if(!c||!s)throw 0;const first=s.name.split(' ')[0];
    if(x.what==='kit'){const cat=pick(['rmm','backup','edr']);const p=pick(KIT_POOL[cat].filter(z=>!PRODS[z].foreign&&z!==stdProd(cat)).concat(KIT_POOL[cat].filter(z=>PRODS[z].foreign)).slice(0,2));
      return {kicker:'What sales promised',title:first+' told '+c.name+' you’d support their '+PRODS[p].name,body:'It came out on the kickoff call. They were never going to move off it, and '+first+' said that was fine. It isn’t on your stack.',
      choices:[{label:'Honour it',note:'You support '+PRODS[p].name+' as-is: slower tickets and admin until someone learns it.',go(){c.kit=c.kit||{};{const lf=ri(6,18);c.kit[cat]={p,left:lf,until:S.day+lf*DPM,state:'asis'};}reveal(s,'overpromiser');note(s,'Promised '+c.name+' you’d support '+PRODS[p].name+'.');log('You’re supporting '+PRODS[p].name+' for '+c.name+' because '+first+' said you would.','event');}},
               {label:'Push back and realign them',note:'Awkward conversation. Satisfaction and trust drop, and '+first+' is embarrassed.',go(){c.sat-=10;c.trust=Math.max(0,c.trust-8);s.morale=Math.max(0,s.morale-8);reveal(s,'overpromiser');note(s,'Overpromised to '+c.name+'. You walked it back.');log('You walked back what '+first+' promised '+c.name+'. They’re not thrilled.','bad');}}]};}
    if(x.what==='discount'){return {kicker:'What sales promised',title:first+' promised '+c.name+' 15% off for the first year',body:'It isn’t in the proposal you signed off, but it’s in an email '+first+' sent them.',
      choices:[{label:'Honour it',note:'Their prices drop 15%.',go(){for(const k in c.svc)c.svc[k].pm*=0.85;reveal(s,'overpromiser');note(s,'Promised '+c.name+' an unapproved 15% discount.');log('You’re honouring '+first+'’s discount for '+c.name+'.','event');}},
               {label:'Refuse',note:'They feel misled. Satisfaction and trust drop.',go(){c.sat-=12;c.trust=Math.max(0,c.trust-10);s.morale=Math.max(0,s.morale-6);reveal(s,'overpromiser');note(s,'Promised '+c.name+' a discount you refused to honour.');log('You refused the discount '+first+' promised '+c.name+'.','bad');}}]};}
    const p=S.projects.find(z=>z.id===x.pid);if(!p)throw 0;
    return {kicker:'What sales promised',title:first+' told '+c.name+' the '+p.name.toLowerCase()+' would take a week',body:'Your engineers’ estimate is '+p.est+' hours. The client is expecting it far sooner than it’s scheduled.',
      choices:[{label:'Rush it',note:'Pull the deadline in. Projects first for everyone until it’s done, or it lands late.',go(){p.due=Math.min(p.due,S.day+8);reveal(s,'overpromiser');note(s,'Promised '+c.name+' an impossible deadline.');log('You’ve pulled the '+p.name.toLowerCase()+' deadline in to keep '+first+'’s promise.','event');}},
               {label:'Reset their expectations',note:'Satisfaction takes a hit, the schedule stays realistic.',go(){c.sat-=8;s.morale=Math.max(0,s.morale-5);reveal(s,'overpromiser');note(s,'Promised '+c.name+' an impossible deadline.');log('You reset '+c.name+'’s expectations on the '+p.name.toLowerCase()+'.','bad');}}]};}},
  scope:{w:1.2,ok:()=>S.projects.some(p=>p.done>2)&&S.staff.some(s=>s.role==='eng'&&present(s)),ctx:()=>{const p=pick(S.projects.filter(p=>p.done>2));return {pid:p.id,sid:pick(S.staff.filter(s=>s.role==='eng'&&present(s))).id,h:ri(4,12)};},make:x=>{const p=S.projects.find(z=>z.id===x.pid),s=ST(x.sid),c=p&&C(p.cid);if(!p||!s||!c)throw 0;
    if(hasT(s,'yesman')){return {kicker:'Projects',title:s.name+' said yes to extra work on the '+p.name.toLowerCase(),body:c.name+' asked for “just one more thing”, and '+s.name+' agreed on the spot. About '+x.h+' hours, not quoted.',choices:[{label:'Let it go',note:'The hours come out of your margin, the client is delighted.',go(){p.actual+=x.h;c.sat+=3;reveal(s,'yesman');note(s,'Agreed '+x.h+'h of unbilled extras for '+c.name+'.');}},{label:'Bill it as a change',note:'Awkward, since '+s.name+' already said yes. Satisfaction dips.',go(){p.actual+=x.h;p.value+=x.h*95;c.sat-=5;s.morale-=4;reveal(s,'yesman');note(s,'Agreed extras you then had to bill.');}}]};}
    return {kicker:'Projects',title:c.name+' wants more on the '+p.name.toLowerCase(),body:s.name+' has been asked to add about '+x.h+' hours of extras. '+s.name+' has come to you before agreeing.',
      choices:[{label:'Raise a change request',note:'+'+gbp(x.h*95)+' on the final invoice. They grumble a little.',go(){p.actual+=x.h;p.value+=x.h*95;c.sat-=2;note(s,'Flagged scope creep at '+c.name+' instead of just doing it.','good');log('Change request raised on the '+p.name.toLowerCase()+' for '+c.name+'.','info');}},
             {label:'Absorb it',note:'Goodwill, paid for with your margin.',go(){p.actual+=x.h;c.sat+=3;c.trust+=3;log('You absorbed the extras on the '+p.name.toLowerCase()+'.','info');}},
             {label:'Say no',note:'Keeps the project on track. They’re disappointed.',go(){c.sat-=5;log('You declined the extras on the '+p.name.toLowerCase()+'.','info');}}]};}},
  priceRec:{w:1,ok:()=>S.staff.some(s=>s.role==='sdm'&&present(s))&&active().some(c=>S.day-c.since>DPM&&clientPL(c).pct<0.15),ctx:()=>({cid:pick(active().filter(c=>S.day-c.since>DPM&&clientPL(c).pct<0.15)).id,sid:pick(S.staff.filter(s=>s.role==='sdm'&&present(s))).id}),make:x=>{const c=C(x.cid),s=ST(x.sid);if(!c||!s)throw 0;const P=clientPL(c);
    return {kicker:'Service delivery',title:s.name+' wants to put '+c.name+' up 10%',body:'They’re running at '+pct(P.pct)+' margin'+(P.ehr?' ('+gbp(P.ehr)+' per support hour)':'')+'. '+s.name+' has the ticket history to back it up and offers to run the conversation.',
      choices:[{label:'Let '+s.name+' handle it',note:hasT(s,'diplomat')?'A diplomat. They’ll take it well.':'Prices up 10%. Some grumbling.',go(){for(const k in c.svc)c.svc[k].pm*=1.1;c.sat-=hasT(s,'diplomat')?2:6;if(hasT(s,'diplomat'))reveal(s,'diplomat');note(s,'Negotiated a 10% rise at '+c.name+'.','good');log(s.name+' put '+c.name+' up 10%.','event');}},
             {label:'Not now',note:'Nothing changes.',go(){log('You held '+c.name+'’s prices for now.','info');}}]};}},
  clash:{w:0.8,ok:()=>S.day-(S.co.clashAt||-999)>DPM*9&&S.staff.some(s=>s.role==='am'&&present(s))&&S.staff.some(s=>s.role==='sdm'&&present(s)),ctx:()=>(S.co.clashAt=S.day,{a:pick(S.staff.filter(s=>s.role==='am'&&present(s))).id,b:pick(S.staff.filter(s=>s.role==='sdm'&&present(s))).id}),make:x=>{const a=ST(x.a),b=ST(x.b);if(!a||!b)throw 0;
    return {kicker:'Team',title:a.name+' and '+b.name+' have fallen out',body:a.name+' says '+b.name+' is blocking deals with red tape. '+b.name+' says '+a.name+' sells things the desk can’t deliver. They both want you to back them.',
      choices:[{label:'Back '+a.name,note:'Sales morale up, delivery morale down.',go(){a.morale=Math.min(100,a.morale+10);b.morale=Math.max(0,b.morale-12);log('You backed '+a.name+' over '+b.name+'.','event');}},
             {label:'Back '+b.name,note:'Delivery morale up, sales morale down.',go(){b.morale=Math.min(100,b.morale+10);a.morale=Math.max(0,a.morale-12);log('You backed '+b.name+' over '+a.name+'.','event');}},
             {label:'Get them in a room together',note:'Half a day of your time. Usually clears the air, sometimes doesn’t.',go(){S.co.busy=(S.co.busy||0)+4;if(Math.random()<0.7){a.morale=Math.min(100,a.morale+4);b.morale=Math.min(100,b.morale+4);log('You got '+a.name+' and '+b.name+' talking. It’s better.','good');}else{a.morale-=4;b.morale-=4;log('The sit-down between '+a.name+' and '+b.name+' didn’t help.','bad');}}}]};}},
  qtrDiscount:{w:0.9,ok:()=>!(mgrOn('sm')&&((mgrOn('sm').lim||{}).disc||0)>=0.15)&&S.deals.some(d=>d.stage==='pitched'&&d.kind!=='project'&&d.pm>=1)&&S.staff.some(s=>s.role==='am'&&present(s)&&hasT(s,'hunter')),ctx:()=>({did:pick(S.deals.filter(d=>d.stage==='pitched'&&d.kind!=='project'&&d.pm>=1)).id,sid:pick(S.staff.filter(s=>s.role==='am'&&present(s)&&hasT(s,'hunter'))).id}),make:x=>{const d=S.deals.find(z=>z.id===x.did),s=ST(x.sid);if(!d||!s||d.stage!=='pitched')throw 0;
    return {kicker:'Sales',title:s.name+' wants to throw in 15% off to close '+dealName(d),body:s.name+' is chasing target and thinks a discount will get it over the line this week.',
      choices:[{label:'Approve it',note:'Better odds of winning, 15% less a month if they sign.',go(){d.pm=Math.max(0.8,d.pm*0.85);d.win=Math.min(0.95,d.win+0.15);d.won=Math.random()<d.win;reveal(s,'hunter');note(s,'Discounted '+dealName(d)+' by 15% to close.');}},
             {label:'Hold the price',note:s.name+' is frustrated.',go(){s.morale=Math.max(0,s.morale-5);reveal(s,'hunter');}}]};}}
};
function humanEvent(){if(!S.pending||!HUMAN[S.pending.id])return null;try{return HUMAN[S.pending.id].make(S.pending.ctx);}catch(e){S.pending=null;return null;}}
/* interviews */
function interviewCand(c){
  if(c.interviewed)return;c.interviewed=true;c.known={};S.co.busy=(S.co.busy||0)+3.5;
  const lines=[];
  for(const t of c.traits||[]){if(!TR[t])continue;if(Math.random()<0.5){c.known[t]=true;lines.push(TR[t].q);}}
  if(Math.random()<0.6){c.consKnown=true;lines.push(c.cons>0.75?'References say they’re the same every day.':c.cons<0.55?'References mention “good weeks and bad weeks”.':'References are solid, nothing more.');}
  if(!lines.length)lines.push('Nothing in particular stood out.');
  c.notes=lines;
}
function traitChips(s,known){const ks=(s.traits||[]).filter(t=>TR[t]&&(known?(s.known||{})[t]:true));return ks.map(t=>'<span class="chip" title="'+esc(TR[t].d)+'">'+TR[t].t+'</span>').join(' ');}
