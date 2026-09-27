
/* ============ build 24: grey and off-the-books tactics, heat, and getting caught ============ */
/* This is a management sim. These are fictional in-game options against fictional rival firms,
   and the design point is that cutting corners builds risk that catches up with you. */
function heat(){return S.co.heat||0;}
function addHeat(v,tag,illegal){S.co.heat=clamp((S.co.heat||0)+v,0,100);if(illegal)S.co.crimeHeat=clamp((S.co.crimeHeat||0)+v,0,100);if(tag)(S.co.heatLog=S.co.heatLog||[]).unshift({d:S.day,t:tag,v,illegal:!!illegal});if((S.co.heatLog||[]).length>10)S.co.heatLog.pop();}
function heatWord(){const h=heat();return h<8?'Nothing to worry about':h<25?'A loose end or two':h<50?'People could talk':h<75?'This could come out':'It’s a matter of time';}
/* who inside the firm knows about the dodgy work: whoever carried it out */
function insider(){const pool=staffOn().filter(s=>s.id!=='you'&&started(s));return pool.length?pool.sort((a,b)=>a.morale-b.morale)[0]:null;}
function knows(s){return s&&s.knows;}
function markKnows(s){if(s){s.knows=true;}}

/* ---------- grey actions (legal-ish, cost trust and reputation if they come out) ---------- */
const GACTS={
  headhunt:{t:'Headhunt their best person',grey:1,heat:8,d:'A discreet approach with a signing bonus to their strongest engineer or manager. If they’re under a restrictive covenant, expect an injunction.',
    ok:r=>r.tier<1?'They’re too small to have anyone worth taking.':S.day-(r.hhAt||-999)<DPM*6?'You tried this recently.':freeDesk()<0?'No free desk for them.':'',
    go:r=>{r.hhAt=S.day;const bonus=Math.round(rnd(4000,9000)/500)*500;spend(bonus);const c=genCand(Math.random()<0.5?'eng':'am','rec');c.skill=Math.max(4,c.skill);c.from=r.id;cands(c.role);const cs=S.cands[c.role];cs.rec.unshift(c);
      shift(r,-18,-12);remember(r,'You headhunted one of their key people.');markKnows(insider());addHeat(GACTS.headhunt.heat,'Headhunted from '+r.name);log('A strong candidate from '+r.name+' is on your recruiter list. Hire quickly before they cool off.','event');
      if(Math.random()<(r.pers==='predatory'?0.5:0.3)){fileSuit({kind:'contract',who:r.name,claim:Math.round(rnd(15000,45000)/1000)*1000,d:S.day+ri(20,50)});log(r.name+' is seeking an injunction over their covenant.','bad');}}},
  overhear:{t:'Debrief a new hire',grey:1,heat:5,d:'Sit a recent joiner down and get their old employer’s prices and key clients out of them. Sharpens your bids against that firm.',
    ok:r=>S.staff.some(s=>s.from===r.id&&!s.left)?'':'Hire someone from them first.',
    go:r=>{r.intel=3;r.leaked=S.day+YEAR;shift(r,-6,-4);remember(r,'You debriefed a joiner about them.');markKnows(S.staff.find(s=>s.from===r.id&&!s.left));addHeat(GACTS.overhear.heat,'Debriefed a joiner about '+r.name);log('You now have inside knowledge of '+r.name+'’s pricing. Your bids against them are sharper for a year.','info');}},
  whisper:{t:'Whisper campaign',grey:1,heat:10,d:'Quietly tell prospects and their clients that they’re struggling or cutting corners. Dents their reputation and yours if it’s traced.',
    ok:r=>S.day-(r.whisperAt||-999)<DPM*6?'You did this recently.':'',
    go:r=>{r.whisperAt=S.day;r.rep=Math.max(15,r.rep-rnd(6,12));r.stance=clamp(r.stance-15,-100,100);remember(r,'You ran a whisper campaign against them.');markKnows(insider());addHeat(GACTS.whisper.heat,'Whispers about '+r.name);log('Word is spreading that '+r.name+' is on shaky ground.','event');}},
  poach2:{t:'Poach an account manager for their book',grey:1,heat:14,d:'Hire their account manager on the quiet understanding they bring clients with them. Several of that firm’s clients follow within months.',
    ok:r=>r.tier<1?'Too small.':agreed(r,'nopoach')?'Your no-poaching agreement forbids it.':S.day-(r.poach2At||-999)<DPM*9?'You did this recently.':freeDesk()<0?'No free desk.':S.co.cash<12000?'Not enough cash for the package.':'',
    go:r=>{r.poach2At=S.day;spend(8000);const c=genCand('am','rec');c.skill=Math.max(4,c.skill);c.from=r.id;c.bringsFrom=r.id;c.brings=Math.min(6,Math.max(2,Math.round(r.clients*0.08)));cands('am');S.cands.am.rec.unshift(c);
      shift(r,-25,-15);remember(r,'You poached their account manager for their client book.');markKnows(insider());addHeat(GACTS.poach2.heat,'Poached '+r.name+'’s account manager');log('An account manager from '+r.name+' will join your recruiter list, and hints they can bring clients. Hire them to find out.','event');}}
};
/* ---------- off the books (illegal, big payoff, ruinous if caught) ---------- */
const IACTS={
  clientlist:{t:'Buy their client list',illegal:1,heat:22,d:'Pay a contact inside the firm for their client list and pricing. A run of their clients arrive as warm leads. Data-protection and bribery law both bite if it surfaces.',
    ok:r=>r.tier<1?'Too small to be worth it.':S.day-(r.listAt||-999)<DPM*9?'Not again so soon.':'',
    go:r=>{r.listAt=S.day;const cost=Math.round(rnd(6000,14000)/500)*500;spend(cost);const n=Math.min(6,Math.max(2,Math.round(r.clients*0.1)));for(let i=0;i<n;i++){const d=addProspect({note:'A '+r.name+' client. They don’t know how you got their details.'});if(d){d.from=r.id;d.warm=1;d.bidders=[];}}
      shift(r,-20,0);remember(r,'You bought their client list.');markKnows(insider());addHeat(IACTS.clientlist.heat,'Bought '+r.name+'’s client list',1);log(n+' of '+r.name+'’s clients have come in as warm leads. Best nobody asks how.','event');}},
  kickback:{t:'Kickback to win a contract',illegal:1,heat:20,d:'Pay a prospect’s IT manager under the table to hand you the deal. Wins a large client outright. This is bribery.',
    ok:()=>S.deals.some(d=>d.stage==='open'&&d.kind==='new'&&d.seats>=25)?'':'Needs an open new-client deal of 25+ users.',
    go:()=>{const d=S.deals.filter(z=>z.stage==='open'&&z.kind==='new'&&z.seats>=25).sort((a,b)=>b.seats-a.seats)[0];if(!d)return;const fee=Math.round(d.seats*rnd(120,200)/500)*500;spend(fee);d.pm=1;d.win=1;d.rigged=1;resolveDeal(d);S.deals=S.deals.filter(z=>z!==d);
      markKnows(insider());addHeat(IACTS.kickback.heat,'Kickback to win '+d.name,1);log('A quiet payment secured '+d.name+'. On paper you simply won it.','event');}},
  breakin:{t:'Break into their systems',illegal:1,heat:28,d:'Have someone get into a rival’s systems: steal their client data, or plant a problem that costs them clients. Serious criminal territory under the Computer Misuse Act.',
    ok:r=>r.tier<1?'Not worth the risk on one this small.':S.day-(r.hackAt||-999)<DPM*9?'Not again so soon.':'',
    go:r=>{r.hackAt=S.day;const cost=Math.round(rnd(8000,20000)/1000)*1000;spend(cost);
      if(Math.random()<0.5){r.intel=3;r.leaked=S.day+YEAR*2;const n=Math.min(5,Math.round(r.clients*0.08));for(let i=0;i<n;i++){const d=addProspect({note:'A '+r.name+' client. You know exactly what they pay.'});if(d){d.from=r.id;d.warm=1;d.bidders=[];}}log('You have everything on '+r.name+': prices, clients, the lot.','event');}
      else{r.rep=Math.max(10,r.rep-rnd(10,20));r.clients=Math.max(1,Math.round(r.clients*0.9));log('The attack on '+r.name+' landed: they’ve lost clients and their name is mud.','event');}
      shift(r,-35,0);remember(r,'You had their systems attacked.');markKnows(insider());addHeat(IACTS.breakin.heat,'Attacked '+r.name+'’s systems',1);}}
};
function doGrey(id,k){const r=rivalById(id),A=GACTS[k]||IACTS[k];if(!A||(k!=='kickback'&&!r))return;if(A.ok(r))return;A.go(r);ui.modal=(k==='kickback'||S.pending)?null:{type:'rival',id};}
ACT_EXT.gAct=v=>{const [id,k]=v.split(':');doGrey(id,k);};

/* ---------- account managers who bring clients ---------- */
const _hire24=hire;
hire=function(c){const n=S.staff.length;_hire24(c);if(S.staff.length>n&&c.brings&&c.bringsFrom){const s=S.staff[S.staff.length-1];s.bringIn={rid:c.bringsFrom,n:c.brings,at:S.day+DPM};}};
function bringDaily(){for(const s of S.staff){if(s.left||!s.bringIn||S.day<s.bringIn.at)continue;const b=s.bringIn;s.bringIn=null;const r=rivalById(b.rid);
  for(let i=0;i<b.n;i++){const d=addProspect({note:'Followed '+s.name.split(' ')[0]+' over from '+(r?r.name:'their old firm')+'.'});if(d){d.warm=1;d.bidders=[];if(r)d.from=r.id;}}
  if(r){r.clients=Math.max(0,r.clients-b.n);shift(r,-15,0);}log(s.name+' is bringing '+b.n+' clients across. They’re arriving as warm leads.','good');}}
/* warm leads (poached books, bought lists) are far likelier to sign */
const _winChance24=winChance;winChance=function(d,pm){let p=_winChance24(d,pm);if(d&&d.warm)p=clamp(p+0.35,0.05,0.95);return p;};
/* sharper bids against a firm whose pricing you've learned */
const _rivalEdge24=rivalEdge;rivalEdge=function(r,d){let e=_rivalEdge24(r,d);if(r.leaked>S.day)e-=0.15;return e;};

/* ---------- heat: it comes out ---------- */
function heatDaily(){
  if(S.day%DPM!==17||heat()<5)return;
  const h=heat();
  // an unhappy or departing insider is the classic leak
  const risk=staffOn().filter(s=>knows(s)&&(s.morale<45||s.leaveOn!=null));
  let p=h/100*0.12;for(const s of risk)p+=s.leaveOn!=null?0.06:0.03;
  // a wronged former ally, or a firm you attacked, may dig
  if(rivals().some(r=>r.stance<-40))p+=0.03;
  if(Math.random()<p)exposeScandal();
  else{S.co.heat=Math.max(0,h-2);S.co.crimeHeat=Math.max(0,(S.co.crimeHeat||0)-2);} // time cools it
}
function exposeScandal(){const log0=(S.co.heatLog||[]);const worst=log0[0]||{t:'cutting corners'};
  const teller=staffOn().find(s=>knows(s)&&(s.leaveOn!=null||s.morale<40));
  const illegal=(S.co.crimeHeat||0)>=20||worst.illegal;
  S.hq.push({id:'scandal',ctx:{by:teller?teller.name:'A former employee',what:worst.t,illegal}});x19('scandal');
}
HUMAN.scandal={w:0,ok:()=>false,make:x=>{const fine=Math.round(clamp(mrr()*12*(x.illegal?0.06:0.02),15000,x.illegal?900000:200000)/1000)*1000;
  return {kicker:x.illegal?'Serious allegations':'Awkward questions',title:x.by+' has gone to '+(x.illegal?'the authorities':'the trade press'),
    body:x.by+' has revealed what happened: “'+x.what.toLowerCase()+'”. '+(x.illegal?'This is a criminal matter. A conviction would see you disqualified as a director, though the company would carry on without you.':'It’s embarrassing rather than illegal, but clients are reading it.'),
    choices:x.illegal?[
      {label:'Lawyer up and fight it',note:'About '+gbp(Math.round(fine*0.015*(S.co.counsel?0.5:1)))+' a month in legal fees for six months to a year, then a '+pct(clamp(0.45-heat()/200+(S.co.counsel?0.15:0),0.15,0.7))+' chance of clearing it. Lose and you pay the fine and are disqualified.',go(){(S.suits=S.suits||[]).push({kind:'crime',who:'The Crown',claim:fine,w:clamp(0.45-heat()/200+(S.co.counsel?0.15:0),0.15,0.7),fee:Math.round(fine*0.015*(S.co.counsel?0.5:1)),end:S.day+ri(6,12)*DPM,crime:x.what});S.co.heat=Math.max(0,heat()-30);log('You’re fighting the allegations over '+x.what.toLowerCase()+'.','bad');}},
      {label:'Settle quietly with a plea',note:'A large fine and a stain, but no trial and no ban.',go(){spend(fine);S.co.rep=Math.max(5,S.co.rep-12);S.co.heat=Math.max(0,heat()-40);log('You settled the '+x.what.toLowerCase()+' case for '+gbp(fine)+'. It stays on the record.','bad');}}
    ]:[
      {label:'Get ahead of it',note:'A frank statement and some goodwill spending. Limits the damage.',go(){spend(Math.round(fine*0.3));S.co.rep=Math.max(5,S.co.rep-4);S.co.heat=Math.max(0,heat()-25);log('You got ahead of the '+x.what.toLowerCase()+' story. It blew over, mostly.','info');}},
      {label:'Say nothing',note:'Cheaper, but it festers.',go(){S.co.rep=Math.max(5,S.co.rep-9);S.co.heat=Math.max(0,heat()-10);const c=active().filter(c=>c.notice==null&&!c.ending).sort((a,b)=>a.sat-b.sat)[0];if(c){c.notice=S.day+DPM;c.ending=true;c.why='unhappy';}log('The '+x.what.toLowerCase()+' story ran and you stayed silent. It’s costing you.','bad');}}
    ]};}};
/* a criminal case you lose: the disqualification ending */
const _suitDaily24=suitDaily;
suitDaily=function(){for(const s of (S.suits||[]).slice()){if(s.kind==='crime'&&S.day>=s.end){S.suits=S.suits.filter(z=>z!==s);
  if(Math.random()<s.w){S.co.rep=Math.min(100,S.co.rep+3);S.co.heat=0;log('You were cleared over '+String(s.crime).toLowerCase()+'. It’s over.','good');}
  else convicted(s);return;}}
  _suitDaily24();};
function convicted(s){const fine=Math.round(clamp(mrr()*12*0.08,50000,1500000)/1000)*1000;const confisc=Math.round((S.co.home||0)*0.4);
  S.co.cash-=fine;S.co.disq=S.day+YEAR*ri(4,12);S.co.confisc=confisc;S.co.home=(S.co.home||0)-confisc;
  // clients leave, tenders barred, staff shaken
  const cs=active().filter(c=>c.notice==null&&!c.ending).sort((a,b)=>a.sat-b.sat).slice(0,Math.ceil(active().length*0.25));for(const c of cs){c.notice=S.day+DPM;c.ending=true;c.why='unhappy';}
  for(const st of S.staff)st.morale=Math.max(0,st.morale-25);
  S.co.rep=Math.max(5,S.co.rep-30);S.co.barred=S.day+YEAR*2;x19('convicted');
  S.hq.push({id:'convicted',ctx:{fine,confisc,left:cs.length,until:S.co.disq}});
}
HUMAN.convicted={w:0,ok:()=>false,make:x=>({kicker:'Convicted',title:'You’ve been disqualified as a director',
  body:'The court convicted you. A fine of '+gbp(x.fine)+', '+(x.confisc?gbp(x.confisc)+' of your winnings confiscated, ':'')+' and a ban from running a company until '+dLabel(x.until)+'. '+x.left+' clients are leaving and the firm is barred from public tenders for two years. The company survives, but you can’t run it. Hand it to a caretaker and wait out your ban, or sell your shares now.',
  choices:[
    {label:'Appoint a caretaker and step back',note:'A hired managing director runs it. You’re a passive owner until your ban lifts. The company runs itself, for better or worse.',go(){S.co.caretaker=true;S.co.mode='manage';const f=founderSt();if(f)f.away=S.co.disq;log('A caretaker MD is running '+S.co.name+'. You’re out until '+dLabel(S.co.disq)+'.','event');}},
    {label:'Sell your shares now',note:'A forced sale at a knock-down price. The game ends.',go(){const v=Math.round(valuation()*0.5);const E=exitNet(v+Math.max(0,S.co.cash)-S.co.loan);S.over={mi:monthOf(S.day),peak:Math.max(...S.hist.map(h=>h.mrr),mrr()),sold:{buyer:'A trade buyer',offer:v,net:E.net,cgt:E.cgt,gross:E.gross,home:S.co.home||0}};log('You sold your disgraced company for '+gbp(v)+'.','bad');}}
  ]})};
/* while barred, a caretaker runs a duller, safer company */
const _peopleDaily24=peopleDaily;
peopleDaily=function(W){_peopleDaily24(W);if(S.mkt){bringDaily();heatDaily();}
  if(S.co.caretaker&&S.co.disq&&S.day>=S.co.disq){S.co.caretaker=false;const f=founderSt();if(f)f.away=0;log('Your disqualification has ended. You’re back in charge of '+S.co.name+'.','good');}
};
const _tenderValueBar=tenderValue;
/* barred from tenders after a conviction */
const _decideTender24=decideTender;
decideTender=function(x){if(S.co.barred>S.day&&x.bid){x.bid=null;}_decideTender24(x);};

/* ---------- the card: grey and illegal sections ---------- */
const _rivalModal23=MODAL_EXT.rival;
MODAL_EXT.rival=(M,x)=>{let h=_rivalModal23(M,x);if(h===null)return null;const r=rivalById(M.id);if(!r)return h;
  const gbtn=(k,A)=>{const why=A.ok(r);return '<li class="item"><span><b>'+A.t+'</b></span><span class="r">'+(why?'<span class="mut" style="font-size:.8rem">'+why+'</span>':'<button class="btn sm" data-act="gAct" data-v="'+r.id+':'+k+'">Do it</button>')+'</span><span class="sub">'+A.d+'</span></li>';};
  let g='<h3 style="font-size:.95rem;margin:14px 0 4px">Grey area <span class="mut" style="font-weight:400;font-size:.8rem">— builds heat</span></h3><ul class="list">'+Object.keys(GACTS).map(k=>gbtn(k,GACTS[k])).join('')+'</ul>';
  g+='<h3 style="font-size:.95rem;margin:14px 0 4px">Off the books <span class="neg" style="font-weight:400;font-size:.8rem">— illegal</span></h3><ul class="list">'+Object.keys(IACTS).filter(k=>k!=='kickback').map(k=>gbtn(k,IACTS[k])).join('')+'</ul>';
  g+='<p class="mut" style="font-size:.8rem">Risk right now: <b>'+heatWord()+'</b>. It comes out through your own people, so keep whoever did the work happy.</p>';
  h=h.replace('<p class="mut" style="font-size:.8rem;margin-top:8px">Greyer tactics, alliances and worse come in later builds.</p>',g);
  return h;};
/* the kickback lives on the deal screen, where the deal is */
const _dealModalCompete=competeNote;
competeNote=function(d){let h=_dealModalCompete(d);if(d.kind==='new'&&d.stage==='open'&&d.seats>=25&&!IACTS.kickback.ok())h+='<p class="mut" style="font-size:.8rem">A quiet word in the right ear would win this outright. <button class="linkbtn neg" data-act="gAct" data-v=":kickback">Pay a kickback</button> — bribery, and it leaves a trail.</p>';return h;};

/* ---------- a heat line on the Risk tab ---------- */
const _paneRisk24=paneRisk;
paneRisk=function(){let h=_paneRisk24();if(heat()>=5||(S.co.heatLog||[]).length){const risk=staffOn().filter(s=>knows(s));
  h='<div class="sec"><h3>Exposure</h3><p class="lede">Grey and off-the-books moves against rivals leave a trail. It comes out through the people who did the work, sooner if they’re unhappy or leaving.</p><div class="tiles"><div class="tile"><span class="k">Risk</span><span class="v" style="font-size:1rem">'+heatWord()+'</span></div><div class="tile"><span class="k">Who knows</span><span class="v">'+risk.length+'</span><small>'+(risk.filter(s=>s.morale<45).length?risk.filter(s=>s.morale<45).length+' of them unhappy':'staff who did the work')+'</small></div></div>'+((S.co.heatLog||[]).length?'<p class="mut" style="font-size:.84rem;margin-top:6px">Recent: '+S.co.heatLog.slice(0,3).map(l=>esc(l.t)).join('; ')+'.</p>':'')+'</div>'+h;}
  return h;};
const _diag24=diagReport;diagReport=function(){return _diag24();};
