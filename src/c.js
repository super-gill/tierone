
/* ============ events ============ */
const hikeable=()=>VEND_ORDER.filter(k=>vendOn(k)&&!S.vend[k].inhouse&&k!=='dist'&&(VEND[k].base>0||k==='carrier')&&!(S.vend[k].lock>S.day)&&S.day-(S.vend[k].lastHike||-999)>DPM*12&&S.day-(S.vend[k].onAt||0)>DPM*6);
const poachable=()=>staffOn().filter(s=>s.role!=='founder'&&started(s)&&S.day-s.start>=126&&S.day-(s.poachAt||-999)>DPM*12);
function rivalOf(k){const cat={rmm:'rmm',backup:'backup',edr:'edr',carrier:'voice'}[k];if(!cat)return null;const cur=S.vend[k].prod;const alts=Object.keys(PRODS).filter(p=>PRODS[p].cat===cat&&!PRODS[p].foreign&&p!==cur);return alts.length?pick(alts):null;}
const supported=()=>active().filter(c=>c.svc.support&&c.notice==null);
function bigTickets(c,n,hrs,lvl,subj){for(let i=0;i<n;i++)S.tickets.push({id:uid(),cid:c?c.id:null,svc:'support',lvl:lvl||2,pri:c?1:3,hrs,left:hrs,born:S.day,br:false,subj,oneoff:true});}
const EVENTS={
  ransomware:{w:0.3,ok:()=>S.day-(S.co.lastRansom||-999)>ri(70,110)&&supported().some(c=>S.day-(c.ransomAt||-999)>YEAR),ctx:()=>{S.co.lastRansom=S.day;const c=pick(supported().filter(c=>S.day-(c.ransomAt||-999)>YEAR));c.ransomAt=S.day;return {cid:c.id};},make:x=>{const c=C(x.cid);
    if(c.svc.security&&c.svc.backup)return {news:true,go(){c.trust=Math.min(100,c.trust+10);c.sat=Math.min(100,c.sat+6);S.co.rep+=2;log('Sentrix caught ransomware at '+c.name+' before it spread. Backups untouched. They are telling everyone.','good');}};
    return {kicker:'Security incident',title:'Ransomware at '+c.name,
    body:'Their files are encrypted and the phones are ringing. '+(()=>{const edr=c.svc.security||(c.kit&&c.kit.edr&&c.kit.edr.state!=='new');const bk=c.svc.backup||(c.kit&&c.kit.backup&&c.kit.backup.state!=='new');return edr&&bk?'Their own security and backup slowed it down but didn’t stop it.':bk?'They have backups but no endpoint protection.':edr?'They have endpoint protection but no backups.':'They have neither backups nor managed security.';})()+' Recovery will eat about '+(c.seats>30?40:24)+' engineer hours.',
    choices:[
      {label:'Drop everything and bill at £95 an hour',note:'Adds urgent work to the queue. You get paid, but billing them mid-crisis costs you trust.',go(){const h=c.seats>30?40:24;bigTickets(c,4,h/4,2,'Ransomware recovery');S.co.cash+=h*95;S.m.setup+=h*95;c.sat-=8;c.trust=Math.max(0,c.trust-10);addCross(c,c.svc.backup?'security':'backup','After the ransomware they want to talk about protection.');log('Ransomware recovery at '+c.name+' underway. '+gbp(h*95)+' billed.','event');}},
      {label:'Drop everything, no charge',note:'Same work, but they will not forget it.',go(){const h=c.seats>30?40:24;bigTickets(c,4,h/4,2,'Ransomware recovery');c.trust=Math.min(100,c.trust+15);c.sat=Math.min(100,c.sat+4);addCross(c,c.svc.backup?'security':'backup','After the ransomware they want to talk about protection.');log('You are recovering '+c.name+' from ransomware free of charge.','event');}}
    ]};}},
  hike:{w:0.8,ok:()=>hikeable().length>0,ctx:()=>{const k=pick(hikeable());S.vend[k].lastHike=S.day;return {k,r:rivalOf(k),a:ri(4,9)};},make:x=>{const v=VEND[x.k];const a=x.a||12,f=1+a/100,nm=v.name;
    return {kicker:'Vendor',title:nm+' is putting prices up '+a+'%',body:'The renewal email says “to continue investing in innovation”. It applies from next month.',
    choices:[
      {label:'Accept it',note:'Costs up '+a+'%.',go(){S.vend[x.k].pm*=f;log(nm+' prices up '+a+'%.','event');}},
      {label:'Push back hard',note:'Often they cap it at '+Math.min(3,a-1)+'%. Sometimes they won’t budge, and occasionally your account manager there remembers it.',go(){const r=Math.random();if(r<0.45){S.vend[x.k].pm*=1+Math.min(3,a-1)/100;log(nm+' capped your rise at '+Math.min(3,a-1)+'%.','good');}else if(r<0.82){S.vend[x.k].pm*=f;log(nm+' would not budge. Prices up '+a+'%.','bad');}else{S.vend[x.k].pm*=f;S.vend[x.k].disc=0;log(nm+' would not budge, and quietly withdrew your partner discount.','bad');}}},
      {label:'Migrate to a rival (£1,500 and engineer time)',note:'A rival at 6% below what you pay today, but migration adds 30 hours of work'+(x.r?' and the team has to learn '+PRODS[x.r].name:'')+'.',go(){const was=S.vend[x.k].pm;spend(1500);const r=x.r;if(r)switchStandard(PRODS[r].cat,r,true);S.vend[x.k].pm=was*0.94;S.vend[x.k].disc=0;bigTickets(null,3,10,2,'Internal: platform migration');log('You are migrating off '+nm+(r?' to '+PRODS[r].name:'')+'. The new deal is cheaper.','event');}}
    ]};}},
  msft:{w:0.7,ok:()=>svcUsers('m365')>0&&S.day-(S.co.lastMsft||-999)>=DPM*12,ctx:()=>{S.co.lastMsft=S.day;return {};},make:()=>({kicker:'Licensing',title:'Microsoft is putting list prices up 6%',body:'Every partner is getting the same letter. You can pass it on or swallow it.',
    choices:[
      {label:'Pass it on to clients',note:'Your M365 price rises 6%. Clients on it get a little less happy.',go(){S.price.m365*=1.06;S.vend.dist.pm*=1.06;for(const c of active())if(c.svc.m365)c.sat-=3;log('M365 prices up 6% for you and your clients.','event');}},
      {label:'Absorb it',note:'Your margin on M365 gets thinner.',go(){S.vend.dist.pm*=1.06;const floor=Math.round(svcCost('m365')*1.05*100)/100;if(S.price.m365<floor){S.price.m365=floor;for(const c of active())if(c.svc.m365)c.sat-=1;log('You absorbed the Microsoft rise, but M365 was so thin you had to nudge the list price up to stay above cost.','event');}else log('You are absorbing the Microsoft price rise. Your M365 margin is thinner.','event');}}
    ]})},
  poach:{w:0.7,ok:()=>poachable().length>0,ctx:()=>{const all=poachable();const hot=all.filter(s=>s.role==='am'&&(s.perf||0)>1.2);const s=wpick(all.map(z=>{const r=z.salary/marketPay(z);return [z,(z.morale<60?3:1)*(r<0.97?3:1)*(z.morale>85&&r>=1?0.15:1)*(hot.includes(z)?2:1)];}));s.poachAt=S.day;return {sid:s.id};},make:x=>{const s=ST(x.sid);const bump=Math.round(s.salary*0.12/10)*10;
    return {kicker:'Team',title:'A bigger MSP wants '+s.name,body:s.name+' has an offer worth '+gbp(bump)+' a month more. They like it here, but not that much.',
    choices:[
      {label:'Match it',note:'Salary up '+gbp(bump)+' a month. Morale boost.',go(){s.salary+=bump;s.morale=Math.min(100,s.morale+12);log('You matched the offer. '+s.name+' stays.','event');}},
      {label:'Offer a better title instead',note:'Works if they’re happy and fairly paid. A second title rarely works.',go(){const pr=s.salary/marketPay(s);if(Math.random()<clamp(s.morale/100-(s.titled?0.35:0)-(pr<0.97?0.25:0),0.1,0.8)){s.titled=true;s.morale=Math.min(100,s.morale+5);log(s.name+' took the new title and stayed.','good');}else{s.leaveOn=S.day+15;log(s.name+' is leaving for the bigger MSP.','bad');}}},
      {label:'Wish them well',note:'They work their notice and leave in about three weeks.',go(){s.leaveOn=S.day+15;log(s.name+' is leaving for the bigger MSP.','bad');}}
    ]};}},
  burnout:{w:1.2,ok:()=>staffOn().some(s=>present(s)&&s.morale<45&&(s.util||0)>0.85),ctx:()=>({sid:pick(staffOn().filter(s=>present(s)&&s.morale<45&&(s.util||0)>0.85)).id}),make:x=>{const s=ST(x.sid);const you=s.id==='you';
    return {kicker:'Team',title:you?'You are running on empty':s.name+' is running on empty',body:you?'Twelve-hour days, weekend patching, invoices at midnight. Something has to give.':s.name+' has been at full stretch for weeks. The queue does not care.',
    choices:[
      {label:'Take two days off',note:'Out of the office for two days. Morale recovers.',go(){s.away=S.day+2;s.morale=Math.min(100,s.morale+30);log((you?'You are':s.name+' is')+' off for two days.','event');}},
      {label:'Push through',note:'Morale drops further.',go(){s.morale=Math.max(0,s.morale-10);log((you?'You push':s.name+' pushes')+' on through.','bad');}}
    ]};}},
  rfp:{w:0.5,ok:()=>S.co.rep>55&&staffOn().length>=8,ctx:()=>{const sector=pick(['Legal','Logistics','Charity','Care','Manufacturing']);return {seats:ri(110,240),sector,name:genName(sector)};},make:x=>{const {seats,sector,name}=x;
    return {kicker:'Tender',title:name+' has put its IT out to tender',body:seats+' users, full managed support, Microsoft 365 and security. It would change the size of the business, and could swamp it.',
    choices:[
      {label:'Bid for it',note:'Adds a large, harder-to-win deal to your pipeline.',go(){const d=addProspect({name,sector,seats,wants:['support','m365','security'],exp:15,silent:true});d.big=true;log('You are bidding for the '+name+' tender.','event');}},
      {label:'Pass',note:'Not this time.',go(){}}
    ]};}},
  referral:{w:1,news:true,ok:()=>active().some(c=>c.sat>78),go(){const c=pick(active().filter(c=>c.sat>78));addProspect({note:'Referred by '+c.name+'.'});log(c.name+' recommended you to a contact.','good');}},
  acquired:{w:0.12,ok:()=>active().filter(c=>c.notice==null&&!c.boughtAt&&S.day-c.since>DPM*6).length>3,ctx:()=>{const c=pick(active().filter(c=>c.notice==null&&!c.boughtAt&&S.day-c.since>DPM*6));c.boughtAt=S.day;return {cid:c.id};},make:x=>{const c=C(x.cid);
    return {kicker:'Client',title:c.name+' has been bought',body:'The new parent group has its own IT department and wants to bring everything in-house.',
    choices:[
      {label:'Pitch to run IT for the whole group',note:'A long shot at a much bigger deal. They leave if it fails.',go(){c.notice=S.day+DPM;c.ending=true;c.exitFee=true;c.why='bought';const d=addProspect({name:c.name.split(' ')[0]+' Group',sector:c.sector,seats:c.seats*4,wants:['support','m365'],exp:15,silent:true});d.big=true;d.replaces=c.id;log('You are pitching to '+d.name+'. '+c.name+' has served notice meanwhile.','event');}},
      {label:'Hand over gracefully',note:'They leave next month, but speak well of you.',go(){c.notice=S.day+DPM;c.ending=true;c.why='bought';payOut(c);S.co.rep+=1.5;log(c.name+' is leaving after the acquisition.','event');}}
    ]};}},
  cyberEss:{w:0.5,ok:()=>!S.co.ce&&S.co.cash>4000&&S.day-(S.co.lastCE||-999)>DPM*9,ctx:()=>{S.co.lastCE=S.day;return {};},make:()=>({kicker:'Certification',title:'Get Cyber Essentials Plus for '+S.co.name+'?',body:'An assessor can certify you for £2,400. Clients buying security increasingly ask for it.',
    choices:[
      {label:'Get certified (£2,400)',note:'Reputation up, security deals easier to win.',go(){spend(2400);S.co.ce=true;S.co.rep+=5;log(S.co.name+' is now Cyber Essentials Plus certified.','good');}},
      {label:'Not now',note:'You can be offered it again later.',go(){}}
    ]})},
  carrier:{w:0.8,ok:()=>svcUsers('telecoms')+svcUsers('connect')>0&&S.day-(S.co.lastOutage||-999)>DPM*6,ctx:()=>{S.co.lastOutage=S.day;return {};},make:()=>({kicker:'Outage',title:VEND.carrier.name+' has a major outage',body:'Half the region’s phones are down. Your telephony and connectivity clients are all affected, and they are calling you, not '+VEND.carrier.name+'.',
    choices:[
      {label:'Ring every client personally',note:'Adds calls to the queue, halves the damage.',go(){for(const c of active())if(c.svc.telecoms||c.svc.connect){c.sat-=4;S.tickets.push({id:uid(),cid:c.id,svc:'telecoms',lvl:1,pri:2,hrs:0.8,left:0.8,born:S.day,br:false,subj:'Outage update call'});}log(VEND.carrier.name+' outage: you are ringing round every client.','event');}},
      {label:'Send a status email',note:'Quick, but clients feel fobbed off.',go(){for(const c of active())if(c.svc.telecoms||c.svc.connect)c.sat-=9;log(VEND.carrier.name+' outage: status email sent. Clients are not impressed.','bad');}}
    ]})},
  review:{w:0.6,news:true,ok:()=>active().some(c=>c.sat<40),go(){const c=pick(active().filter(c=>c.sat<40));S.co.rep-=3;log(c.name+' left you a one-star review: “Tickets vanish into a black hole.”','bad');}},
  grant:{w:0.4,news:true,ok:()=>S.office.tier<=1&&!S.flags.grant,go(){S.flags.grant=1;S.co.cash+=2500;S.m.setup+=2500;log('A local growth grant pays you £2,500 towards new equipment.','good');}}
};
function fireEvent(){
  S.nextEvent=S.day+ri(14,30);
  const pool=Object.entries(EVENTS).filter(([,e])=>e.ok());
  if(!pool.length)return;
  const [id,e]=wpick(pool.map(p=>[p,p[1].w]));
  if(id==='ransomware'||id==='carrier')S.qs.events++;
  if(e.news){e.go();return;}
  let ctx,made;try{ctx=e.ctx?e.ctx():{};made=e.make(ctx);}catch(err){return;}
  if(made.news){made.go();return;}
  S.pending={id,ctx};
}
function pendingEvent(){if(!S.pending)return null;if(HUMAN[S.pending.id])return humanEvent();const e=EVENTS[S.pending.id];if(!e){S.pending=null;return null;}try{return e.make(S.pending.ctx);}catch(err){S.pending=null;return null;}}
