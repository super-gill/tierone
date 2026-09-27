
/* ============ sales commission ============ */
ROLES.am.sal=[1900,2600];
ROLES.am.blurb='Looks after a book of clients: runs their quarterly reviews, spots cross-sells and finds new business. Lower base salary plus commission on what they sell.';
const COMM_RATE={low:0.5,std:1,high:1.5};
function comm(){return S.comm||(S.comm={basis:'rev',rate:'std',claw:true});}
function commFor(d,pm){
  const P=comm(),r=COMM_RATE[P.rate];
  if(d.kind==='project'){const E=dealEstimate(d,pm);return Math.max(0,P.basis==='rev'?E.q*0.05*r:E.margin*0.1*r);}
  const E=dealEstimate(d,pm);const k=d.kind==='cross'?0.5:1;
  return Math.max(0,(P.basis==='rev'?E.rev:E.margin*2)*r*k);
}
function payCommission(am,d,pm,cid){
  if(!am||am.role!=='am')return;
  const amt=Math.round(commFor(d,pm));if(!amt)return;
  am.due=(am.due||0)+amt;am.comms=am.comms||[];am.comms.unshift({d:S.day,amt,cid});if(am.comms.length>40)am.comms.pop();
  const sm=mgrOf('sm');if(sm&&started(sm))sm.due=(sm.due||0)+Math.round(amt*0.1);
}
function clawback(c){
  const P=comm();if(!P.claw)return;
  for(const s of S.staff){if(s.role!=='am'||!s.comms)continue;
    for(const x of s.comms){if(x.cid===c.id&&!x.claw&&S.day-x.d<DPM*6){x.claw=true;s.due=(s.due||0)-x.amt;s.morale=Math.max(0,s.morale-(hasT(s,'farmer')?14:8));note(s,'Lost '+gbp(x.amt)+' commission when '+c.name+' left.');log(c.name+' left within six months, so '+s.name+' loses '+gbp(x.amt)+' commission.','bad');}}}
}
function commMonthEnd(L){
  let tot=0;
  for(const s of S.staff){if(!s.due||s.left)continue;const pay=Math.max(0,s.due);tot+=pay;s.due=Math.min(0,s.due);s.paid=s.paid||[];s.paid.unshift({mi:monthOf(S.day)-1,amt:pay});if(s.paid.length>12)s.paid.pop();}
  if(tot){S.co.cash-=tot;L.comm=(L.comm||0)+tot;}
  // morale follows performance against target
  for(const s of S.staff){if(s.role!=='am'||!started(s)||S.day-s.start<DPM)continue;
    const q=(s.sales||[]).filter(x=>S.day-x.d<QD).reduce((a,x)=>a+x.mrr+x.proj/12,0);const target=Math.max(300,s.salary*0.75);
    const r=q/target;let dm=clamp((r-0.8)*12,-10,8);if(hasT(s,'hunter'))dm*=1.5;if(hasT(s,'farmer'))dm*=0.5;
    s.morale=clamp(s.morale+dm,0,100);s.perf=r;
  }
  return tot;
}
function lastComm(){return (S.last&&S.last.L&&S.last.L.comm)||0;}
function commBlock(){
  if(!S.staff.some(s=>s.role==='am'&&!s.left))return '';
  const P=comm();const seg=(k,opts)=>'<div class="seg" style="margin-bottom:8px">'+opts.map(([v,l,sub])=>'<button data-act="commSet" data-v="'+k+':'+v+'" aria-pressed="'+(String(P[k])===String(v))+'">'+l+(sub?'<small>'+sub+'</small>':'')+'</button>').join('')+'</div>';
  return '<div class="sec"><h3>Sales commission</h3><p class="lede">Account managers are on a lower base plus commission, paid at month end. How you pay them shapes how they sell.</p>'+
    seg('basis',[['rev','On revenue','simple, rewards discounting'],['margin','On margin','discounts come out of their pocket']])+
    seg('rate',P.basis==='rev'?[['low','Low','half a month'],['std','Standard','one month'],['high','Generous','a month and a half']]:[['low','Low','a month of margin'],['std','Standard','two months of margin'],['high','Generous','three months of margin']])+
    seg('claw',[[true,'Clawback on','taken back if they leave in 6 months'],[false,'Clawback off','']])+
    '<p class="mut" style="font-size:.8rem">New clients earn the rate on first-month '+(P.basis==='rev'?'revenue':'margin')+', cross-sells half that, projects a slice of the '+(P.basis==='rev'?'value':'margin')+'. Last month you paid '+gbp(lastComm())+'.</p></div>';
}
ACT_EXT.commSet=v=>{const [k,raw]=v.split(':');const P=comm();const val=raw==='true'?true:raw==='false'?false:raw;
  if(k==='basis'&&P.basis!==val&&val==='margin')for(const s of S.staff)if(s.role==='am'&&hasT(s,'hunter'))s.morale=Math.max(0,s.morale-8);
  if(k==='rate'){const d={low:-1,std:0,high:1}[val]-{low:-1,std:0,high:1}[P.rate];for(const s of S.staff)if(s.role==='am')s.morale=clamp(s.morale+d*6,0,100);}
  P[k]=val;log('Commission plan changed: '+(P.basis==='rev'?'on revenue':'on margin')+', '+{low:'low',std:'standard',high:'generous'}[P.rate]+' rate, clawback '+(P.claw?'on':'off')+'.','info');};
