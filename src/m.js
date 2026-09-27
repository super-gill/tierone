
/* ============ scaling: first line vs second line, and what the workload actually needs ============ */
const ENG_PREMIUM=900;
function tixSplit(){let l1=0,l2=0;for(const t of S.tickets){if(t.lvl===2)l2+=t.left;else l1+=t.left;}return {l1,l2};}
function l1Capacity(){let h=0;for(const s of S.staff)if(present(s)&&(s.role==='desk'||s.role==='hdm'))h+=hoursOf(s).tix;return h;}
function l2Capacity(){let h=0;for(const s of S.staff)if(present(s)){const x=hoursOf(s);if(s.role==='eng')h+=x.tix+x.proj*0.5;else if(s.role==='founder')h+=x.tix*0.5;else if(s.role==='desk'&&(s.skill||0)>=4)h+=x.tix*0.25*SENIOR_L2;}return h;}
function l1Days(){const c=l1Capacity(),q=tixSplit().l1;return c>0?q/c:q>0?99:0;}
function l2Days(){const c=l2Capacity(),q=tixSplit().l2;return c>0?q/c:q>0?99:0;}
function projHoursLeft(){let h=0;for(const p of S.projects)h+=Math.max(0,p.est-p.done);for(const o of S.onb)if(o.stage!=='plan')for(const t of o.tasks)h+=Math.max(0,t.hrs-t.done);return h;}
function inflow(){const d=S.sla.slice(-DPM).filter(x=>x.l1in!=null);if(d.length<5)return null;return {l1:d.reduce((a,x)=>a+x.l1in,0)/d.length,l2:d.reduce((a,x)=>a+x.l2in,0)/d.length,n:d.length};}
/* headcount the workload needs, at 85% utilisation, clearing the current queue over a month and projects over two */
function teamNeed(){
  const f=inflow();if(!f)return null;const q=tixSplit(),pj=projHoursLeft();
  const per=r=>{const a=S.staff.filter(s=>s.role===r&&!s.left);return a.length?a.reduce((x,s)=>x+hoursOf(s).total,0)/a.length:7.5*0.85;};
  const fo=S.staff.find(s=>s.role==='founder');const foT=fo&&present(fo)?hoursOf(fo).tix:0;
  const hdmT=S.staff.filter(s=>s.role==='hdm'&&present(s)).reduce((a,s)=>a+hoursOf(s).tix,0);
  const desk=Math.max(0,f.l1+q.l1/DPM-hdmT)/(per('desk')*0.72);
  const engWork=f.l2+q.l2/DPM+pj/(DPM*2);
  const eng=Math.max(0,engWork-foT*0.5)/(per('eng')*0.72);
  return {desk,eng,l1in:f.l1,l2in:f.l2,pj,engWork};
}
/* how long before a newly signed project gets engineer time */
function projQueueDays(){
  const f=inflow();const pj=projHoursLeft();if(!pj)return 0;
  let engH=0;for(const s of S.staff)if(s.role==='eng'&&present(s))engH+=hoursOf(s).total;
  const fo=S.staff.find(s=>s.id==='you');if(fo&&present(fo)&&(S.co.mode==='hands'||S.co.mode==='mixed'))engH+=hoursOf(fo).tix*0.5;
  const spare=engH-(f?f.l2:0)-tixSplit().l2/DPM;
  return spare>0.3?pj/spare:999;
}
function queueNote(d){
  const qd=projQueueDays();const due=Math.ceil(d.proj.est/4)+12;
  if(qd<=due*0.5)return '';
  return '<p class="note warn">'+(qd>=999?'Your engineers have no spare time for projects right now: second line takes all of it. This would sit untouched and go late.':'There are about '+Math.round(qd)+' working days of project and onboarding work ahead of this. It is due in '+due+'.')+'</p>';
}
function scalingSec(){
  const N=teamNeed(),q=tixSplit();
  const nD=S.staff.filter(s=>s.role==='desk'&&!s.left).length,nE=S.staff.filter(s=>s.role==='eng'&&!s.left).length;
  const sen=S.staff.filter(s=>s.role==='desk'&&!s.left&&(s.skill||0)>=4).length;
  const pj=projHoursLeft();
  let h='<div class="sec"><h3>First line and second line</h3><p class="lede">Analysts clear first line. Second line, projects and onboarding need engineers, or you when hands-on. Senior analysts (level 4+) help a little with second line.</p>';
  h+='<table><thead><tr><th></th><th class="r">Queued</th><th class="r">New a day</th><th class="r">You have</th><th class="r">Work for</th></tr></thead><tbody>';
  h+='<tr><td>First line</td><td class="r">'+Math.round(q.l1)+'h</td><td class="r">'+(N?N.l1in.toFixed(1)+'h':'–')+'</td><td class="r">'+nD+' analyst'+(nD===1?'':'s')+(sen?' ('+sen+' senior)':'')+'</td><td class="r">'+(N?N.desk.toFixed(1):'–')+'</td></tr>';
  h+='<tr><td>Second line</td><td class="r '+(l2Days()>2?'neg':'')+'">'+Math.round(q.l2)+'h</td><td class="r">'+(N?N.l2in.toFixed(1)+'h':'–')+'</td><td class="r" rowspan="2">'+nE+' engineer'+(nE===1?'':'s')+'</td><td class="r" rowspan="2">'+(N?N.eng.toFixed(1):'–')+'</td></tr>';
  h+='<tr><td>Projects and onboarding</td><td class="r">'+Math.round(pj)+'h</td><td class="r mut">–</td></tr>';
  h+='</tbody></table>';
  if(!N)h+='<p class="note">Headcount estimates appear after a week of data.</p>';
  else{
    if(N.eng>nE+0.7)h+='<p class="note warn"><b>Second line is your bottleneck.</b> The work needs about '+N.eng.toFixed(1)+' engineers and you have '+nE+'. Analysts can’t take it, so hiring more of them won’t help. Hire an engineer, promote a senior analyst, or sell less project work.</p>';
    if(N.desk<nD-1.5)h+='<p class="note">First line needs about '+N.desk.toFixed(1)+' analysts and you have '+nD+'. Some of them are waiting for work they can’t do.</p>';
    else if(N.desk>nD+0.7)h+='<p class="note warn">First line needs about '+N.desk.toFixed(1)+' analysts and you have '+nD+'.</p>';
  }
  return h+'</div>';
}
/* promotion: a senior analyst can step up to engineer */
function canPromote(s){return s&&s.role==='desk'&&!s.left&&(s.skill||0)>=4&&S.day-s.start>=DPM*3;}
ACT_EXT.promote=()=>{const s=ST(ui.modal&&ui.modal.id);if(!canPromote(s))return;const sal=Math.max(s.salary+350,ROLES.eng.sal[0]);s.role='eng';s.salary=Math.round(sal/10)*10;s.skill=Math.max(2,s.skill-1);s.focus='balanced';s.morale=Math.min(100,s.morale+15);note(s,'Promoted from the service desk to engineer.','good');log(s.name+' is now an engineer on '+gbp(s.salary)+' a month.','good');};
/* month-end tip, ahead of the rest */
const _tips=tips;
tips=function(r){const t=_tips(r);const N=teamNeed();const nE=S.staff.filter(s=>s.role==='eng'&&!s.left).length,nD=S.staff.filter(s=>s.role==='desk'&&!s.left).length;
  if(N&&N.eng>nE+0.7)t.unshift('Second line needs about '+N.eng.toFixed(1)+' engineers of work and you have '+nE+(N.desk<nD-1.5?', while first line only needs '+N.desk.toFixed(1)+' of your '+nD+' analysts':'')+'. Projects and onboarding stall behind it. See the Desk tab.');
  return t.slice(0,3);};
/* bank lends on profitability too */
function mrrFalling(){const h=S.hist;if(h.length<4)return false;return mrr()<h[h.length-4].mrr*0.98;}
function bankNervous(){const deep=S.co.cash<-(OD_LIMIT*0.5);const losing=S.hist.slice(-3);const threeLoss=losing.length>=3&&losing.every(x=>x.profit<0);
  // a growing firm keeps its line even while it invests at a loss; the bank only freezes a shrinking one that's deep in the red
  return mrrFalling()&&(deep||threeLoss);}
const _loanLimit=loanLimit;
loanLimit=function(){const l=_loanLimit();return bankNervous()?Math.min(l,S.co.loan):l;};
/* apprentices: a cheap, slow first hire for small firms */
const _cands=cands;
cands=function(role){const cs=_cands(role);
  if(role==='desk'&&!cs.apprDone){cs.apprDone=true;if(staffOn().length<6&&!S.staff.some(s=>s.appr&&!s.left)){const a=genCand('desk','board');a.skill=1;a.salary=Math.round(rnd(1350,1500)/10)*10;a.appr=true;a.fam=candFam('desk',1,'board');cs.board[cs.board.length-1]=a;}}
  return cs;};
const _hire=hire;
hire=function(c){const n=S.staff.length;_hire(c);if(c.appr&&S.staff.length>n){const s=S.staff[S.staff.length-1];s.appr=true;s.apprEnd=s.start+DPM*12;log(s.name+' joins as an apprentice: cheap, slow for now, and learning fast.','info');}};
const _peopleDaily=peopleDaily;
peopleDaily=function(W){_peopleDaily(W);
  for(const s of S.staff){if(!s.appr||s.left||!present(s))continue;s.xp=(s.xp||0)+0.006;if(s.xp>=1&&s.skill<3){s.xp=0;s.skill++;log(s.name+' has grown into a level '+s.skill+' analyst.','good');}
    if(S.day>=s.apprEnd){s.appr=false;s.salary=Math.max(s.salary,2150);s.morale=Math.min(100,s.morale+10);note(s,'Finished their apprenticeship.','good');log(s.name+' has finished their apprenticeship and moves onto a full salary of '+gbp(s.salary)+'.','good');}}};
