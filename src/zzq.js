
/* ============ build 121: save plays for at-risk clients ============
   Retention used to be one button ("10% off to stay") that only appeared after a client
   served notice. This adds a Save-this-account modal, available whenever a client is at risk
   (satisfaction under 55) or serving notice, with three levers that pull in different ways:
     - Retention visit: your time. Biggest, most durable lift (trust as well as satisfaction).
     - Service credit: a one-off cash goodwill payment. No permanent margin loss.
     - Price cut: 10% off for good. Blunt, immediate, and it costs you every month after.
   None is a guaranteed save: a deeply unhappy client needs more than one, or the underlying
   problem fixed. An "ending" notice (bought out, won by a rival, after an audit or breach) is
   structural and these cannot reverse it, which the modal says plainly. */

function saveAtRisk(c){return !!c&&(c.notice!=null||c.sat<55);}
function saveCreditAmt(c){return Math.max(200,Math.round(clientMRR(c)/10)*10);}
function saveDiplomat(){return S.staff.some(s=>s.role==='sdm'&&present(s)&&hasT(s,'diplomat'));}
/* withdraw an unhappy notice immediately if satisfaction has recovered enough */
function saveRecheck(c){if(c.notice!=null&&!c.ending){const th=saveDiplomat()?52:62;if(c.sat>=th){c.notice=null;log(c.name+' has withdrawn their notice.','good');return true;}}return false;}
function saveVisitCD(c){return Math.max(0,DPM-(S.day-(c.saveAt==null?-999:c.saveAt)));}
function saveCreditCD(c){return Math.max(0,DPM-(S.day-(c.creditAt==null?-999:c.creditAt)));}

ACT_EXT.savePlay=v=>{const id=v||(ui.modal&&ui.modal.id);if(C(id))ui.modal={type:'savePlay',id};};

ACT_EXT.retainVisit=v=>{const c=C(v||(ui.modal&&ui.modal.id));if(!c)return;
  if(diaryFull()){toast('Your diary is full. Try again in a day or two.');return;}
  if(saveVisitCD(c)>0){toast('You saw '+c.name+' recently. Give it a little time.');return;}
  S.co.busy=(S.co.busy||0)+6;c.saveAt=S.day;
  const dip=saveDiplomat()?1.15:1;const hostile=c.trust<20?0.85:1;
  const dsat=Math.round(14*dip*hostile),dtr=Math.round(12*hostile);
  c.sat=Math.min(100,c.sat+dsat);c.trust=Math.min(100,c.trust+dtr);
  const saved=saveRecheck(c);
  log('You spent a day with '+c.name+' rebuilding the relationship. Satisfaction +'+dsat+', trust +'+dtr+'.'+(saved?'':' '+(c.notice!=null?'Not enough on its own yet.':'')),'event');
  ui.modal={type:'client',id:c.id};};

ACT_EXT.serviceCredit=v=>{const c=C(v||(ui.modal&&ui.modal.id));if(!c)return;
  if(saveCreditCD(c)>0){toast('You already credited '+c.name+' recently.');return;}
  const amt=saveCreditAmt(c);
  if(S.co.cash-amt<-OD_LIMIT){toast('Not enough cash for a '+gbp(amt)+' credit right now.');return;}
  spend(amt);c.creditAt=S.day;
  c.sat=Math.min(100,c.sat+18);c.trust=Math.min(100,c.trust+5);
  const saved=saveRecheck(c);
  log('You credited '+c.name+' '+gbp(amt)+' as a goodwill gesture. Satisfaction +18.'+(saved?'':''),'event');
  ui.modal={type:'client',id:c.id};};

ACT_EXT.saveDiscount=v=>{const c=C(v||(ui.modal&&ui.modal.id));if(!c)return;
  for(const k in c.svc)c.svc[k].pm*=0.9;
  c.sat=Math.min(100,c.sat+22);c.trust=Math.min(100,c.trust+4);
  saveRecheck(c);
  log('You offered '+c.name+' 10% off, for good. Satisfaction +22.','event');
  ui.modal={type:'client',id:c.id};};

/* a late counter-offer to win back a client a rival poached */
function counterChance(c){return clamp(0.55+c.trust/250+c.sat/300,0.4,0.9);}
ACT_EXT.counterOffer=v=>{const c=C(v||(ui.modal&&ui.modal.id));if(!c||c.why!=='rival'||c.counterTried)return;
  c.counterTried=true;const cut=c.rivalCut||12;const by=c.rivalBy||'their new supplier';
  if(Math.random()<counterChance(c)){
    for(const k in c.svc)c.svc[k].pm*=1-cut/100;
    c.notice=null;c.ending=false;c.why=null;c.sat=Math.min(100,c.sat+5);c.trust=Math.min(100,c.trust+4);
    if(c.term>1)c.termEnd=Math.max(c.termEnd||0,S.day+c.term*DPM);
    log('You matched '+by+'’s price and won '+c.name+' back, at '+cut+'% less a month from now on.','good');
  }else{
    log(c.name+' thanked you for the offer but is going ahead with the move to '+by+'.','bad');
  }
  ui.modal={type:'client',id:c.id};};

MODAL_EXT.savePlay=(M,x)=>{
  const c=C(M.id);if(!c)return null;
  const notice=c.notice!=null,ending=notice&&c.ending;
  const th=saveDiplomat()?52:62;
  const opt=(act,val,title,sub,dis)=>'<button class="choice" data-act="'+act+'" data-v="'+c.id+'"'+(dis?' disabled':'')+'><b>'+title+'</b><span>'+sub+'</span></button>';
  const foot='<div class="foot2"><span class="grow mut" style="font-size:.8rem">You can combine these, or fix the root cause on the desk and in their reviews.</span><button class="btn" data-act="client" data-v="'+c.id+'">Back</button></div></div>';

  /* a rival poached them on price: a late counter-offer can still win them back */
  if(ending&&c.why==='rival'){
    const cut=c.rivalCut||12,by=c.rivalBy||'a rival';
    if(c.counterTried)
      return '<div class="dialog wide">'+x+'<p class="kick">Save the account</p><h2>'+esc(c.name)+'</h2><p class="note bad">You’ve made your counter-offer and '+esc(c.name)+' has decided to move to '+esc(by)+'. They leave '+dLabel(c.notice)+'.</p>'+foot;
    return '<div class="dialog wide">'+x+'<p class="kick">Win them back</p><h2>'+esc(c.name)+'</h2>'+
      '<p class="note warn">'+esc(by)+' undercut you by '+cut+'% and '+esc(c.name)+' served notice. They pay '+gbp(clientMRR(c))+' a month. Satisfaction '+Math.round(c.sat)+', trust '+Math.round(c.trust)+'. You can still go back to them.</p>'+
      '<p>Matching the price is your best shot, but even then it is not certain, and a client who trusts you is far easier to win back. One attempt.</p>'+
      '<div class="choices">'+
        opt('counterOffer',c.id,'Counter-offer: match their price','Drop to '+cut+'% less a month, for good, and fight to keep them. About a '+Math.round(counterChance(c)*100)+'% chance they stay. Nothing is cut unless they accept.',false)+
      '</div>'+foot;
  }
  /* other structural departures cannot be reversed by these levers */
  if(ending)
    return '<div class="dialog wide">'+x+'<p class="kick">Save the account</p><h2>'+esc(c.name)+'</h2><p class="note bad">This departure is structural: '+({bought:'they’ve been bought by a group',audit:'it followed your failed audit',breach:'it followed the breach'}[c.why]||'it’s already decided')+'. A goodwill visit still counts toward the relationship if anything changes, but it will not stop this move.</p>'+
      '<div class="choices">'+opt('retainVisit',c.id,'Part on good terms',saveVisitCD(c)>0?'Seen recently.':diaryFull()?'Your diary is full right now.':'A day of your time. Leaves the door open and protects your reputation.',saveVisitCD(c)>0||diaryFull())+'</div>'+foot;

  const vcd=saveVisitCD(c),ccd=saveCreditCD(c),credit=saveCreditAmt(c);
  const head=notice
    ?'<p class="note bad">Serving notice, leaves '+dLabel(c.notice)+'. Get satisfaction back above '+th+' and they’ll withdraw it. Currently '+Math.round(c.sat)+'.</p>'
    :'<p class="note warn">At risk: satisfaction '+Math.round(c.sat)+', trust '+Math.round(c.trust)+'. Act before they serve notice.</p>';
  const visitSub=vcd>0?'Seen recently, available again in '+vcd+' day'+(vcd===1?'':'s')+'.':diaryFull()?'Your diary is full right now.':'A day of your time. Satisfaction +14, trust +12. The most durable lever'+(saveDiplomat()?', and your diplomat SDM makes it land harder':'')+'.';
  const creditSub=ccd>0?'Credited recently, available again in '+ccd+' day'+(ccd===1?'':'s')+'.':(S.co.cash-credit<-OD_LIMIT?'Not enough cash for the '+gbp(credit)+' credit.':gbp(credit)+' now (about a month billed). Satisfaction +18, no permanent margin loss.');
  return '<div class="dialog wide">'+x+'<p class="kick">Save the account</p><h2>'+esc(c.name)+'</h2>'+head+
    '<p>Different levers, different costs. Fixing what’s actually wrong (SLA, a weak account manager, off-stack kit) sticks better than money alone, and no single move is a guaranteed save.</p>'+
    '<div class="choices">'+
      opt('retainVisit',c.id,'Retention visit',visitSub,vcd>0||diaryFull())+
      opt('serviceCredit',c.id,'Service credit',creditSub,ccd>0||(S.co.cash-credit<-OD_LIMIT))+
      opt('saveDiscount',c.id,'Cut their price 10%','Permanent 10% off every service. Satisfaction +22, but it costs you '+gbp(Math.round(clientMRR(c)*0.1))+' a month, every month, for good.',false)+
    '</div>'+foot;
};
