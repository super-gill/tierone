
/* ============ build 41: the C-suite ============ */
/* A strategic leadership layer above the operational managers. Executives are
   expensive senior hires that each take a domain off your plate and steer it.
   Every exec has a personality (an archetype that colours their strengths and
   advice) and a focus you set (their mandate). Effect = quality × how well the
   focus fits their archetype. They're a money sink and a lever at scale. */
const EXEC_ROLE={
  cto:{t:'CTO',full:'Chief Technology Officer',sal:[7000,11000],col:'--r-eng',
    d:'Owns technology strategy above the Technical Manager. Where the stack, security and bespoke builds are heading.',
    focuses:[
      {k:'secure',t:'Security & resilience',d:'Cuts breach risk and audit pain.'},
      {k:'build',t:'Build & innovation',d:'Bespoke DevOps builds are cheaper, faster and far less likely to fail.'},
      {k:'lean',t:'Lean stack',d:'Trims tool spend and keeps the stack tight.'}
    ]},
  cfo:{t:'CFO',full:'Chief Financial Officer',sal:[7000,11000],col:'--r-am',
    d:'Owns the money above the billing function: collections, capital and cost.',
    focuses:[
      {k:'cash',t:'Cash & collections',d:'Better billing coverage and less bad debt.'},
      {k:'cost',t:'Cost control',d:'Trims tool and overhead spend.'},
      {k:'growth',t:'Growth capital',d:'More borrowing headroom and cheaper finance.'}
    ]},
  coo:{t:'COO',full:'Chief Operating Officer',sal:[6500,10500],col:'--r-sdm',
    d:'Owns day-to-day operations across the managers: throughput, quality and scale.',
    focuses:[
      {k:'efficient',t:'Efficiency',d:'More throughput from the same team.'},
      {k:'quality',t:'Service quality',d:'Happier clients and a better reputation.'},
      {k:'scale',t:'Scaling up',d:'Sharper managers and stronger branches.'}
    ]}
};
const EXEC_ORDER=['cto','cfo','coo'];
const ECHAR={
  visionary:{t:'Visionary',d:'Bold and ambitious. Bigger swings, more volatility.',lean:['build','growth','scale']},
  operator:{t:'Operator',d:'Steady and reliable. Consistent, lower-risk gains.',lean:['secure','cash','quality','efficient']},
  maverick:{t:'Maverick',d:'Unconventional. Occasional brilliance, occasional trouble.',lean:['build','growth','efficient']},
  veteran:{t:'Veteran',d:'Seen it all before. Dependable, and knows where the money goes.',lean:['secure','cost','quality']}
};
const EFIRST=['Morgan','Priya','Sundeep','Claire','Marcus','Yuki','Ade','Fiona','Rob','Nadia','Grace','Tomas','Ivy','Deepa','Karl'];
function exec(r){return S.execs&&S.execs[r];}
function execAny(){return S.execs&&Object.keys(S.execs).length>0;}
function execPayroll(){if(!S.execs)return 0;let t=0;for(const r in S.execs)t+=(S.execs[r].sal||0);return t*(1+ONCOST);}
/* how strongly an exec drives a given focus: only if that's their current mandate */
function execFocusPow(r,f){const e=exec(r);if(!e||e.focus!==f)return 0;const fit=(ECHAR[e.char]&&ECHAR[e.char].lean.includes(f))?1.2:0.9;return (e.quality||0.8)*fit;}
function execPow(r){const e=exec(r);if(!e)return 0;return e.quality||0.8;}

/* ---- candidates and hiring ---- */
function execCands(r){S.execCands=S.execCands||{};if(S.execCands[r])return S.execCands[r];
  const chars=Object.keys(ECHAR).sort(()=>Math.random()-0.5);const R=EXEC_ROLE[r];const out=[];
  for(let i=0;i<3;i++){const q=Math.round((0.65+Math.random()*0.33)*100)/100;const sal=Math.round((R.sal[0]+(R.sal[1]-R.sal[0])*q)/500)*500;
    out.push({name:pick(EFIRST)+' '+pick(LAST),char:chars[i%chars.length],quality:q,sal,focus:R.focuses[0].k});}
  S.execCands[r]=out;return out;}
ACT_EXT.execHire=v=>{const [r,i]=v.split(':');const R=EXEC_ROLE[r];if(!R||exec(r))return;const c=execCands(r)[+i];if(!c)return;
  S.execs=S.execs||{};S.execs[r]={name:c.name,char:c.char,quality:c.quality,sal:c.sal,focus:c.focus,joined:S.day};
  if(S.execCands)delete S.execCands[r];
  log(c.name+' has joined as your '+R.full+' ('+ECHAR[c.char].t.toLowerCase()+'), on '+gbp(c.sal)+' a month. Set their focus on the Strategy tab.','event');};
ACT_EXT.execFocus=v=>{const [r,f]=v.split(':');const e=exec(r);const R=EXEC_ROLE[r];if(!e||!R||!R.focuses.some(x=>x.k===f))return;e.focus=f;
  log('Your '+R.t+' is now focused on '+R.focuses.find(x=>x.k===f).t.toLowerCase()+'.','info');};
ACT_EXT.execFire=r=>{const e=exec(r);const R=EXEC_ROLE[r];if(!e)return;delete S.execs[r];log('You let '+e.name+' go as '+R.t+'.','event');};

/* ---- effects, all modest and scaled by focus power ---- */
function buildFailMod(){return 1-0.5*execFocusPow('cto','build');}
/* CTO security: fewer breaches, better audits */
if(typeof breachOdds==='function'){const _bo_x=breachOdds;breachOdds=function(){return _bo_x()*(1-0.30*execFocusPow('cto','secure'));};}
if(typeof procScore==='function'){const _ps_x=procScore;procScore=function(a){return _ps_x(a)+0.30*execFocusPow('cto','secure');};}
/* CTO build: bespoke builds complete faster */
if(ACT_EXT.buildGo){const _bg_x=ACT_EXT.buildGo;ACT_EXT.buildGo=k=>{_bg_x(k);const b=(typeof build==='function')?build(k):null;if(b&&!b.live&&!b.failed){const cut=0.25*execFocusPow('cto','build');if(cut)b.need*=(1-cut);}};}
/* CTO lean + CFO cost: cheaper tools */
if(typeof toolsCost==='function'){const _tc_x=toolsCost;toolsCost=function(){return _tc_x()*(1-0.12*execFocusPow('cto','lean')-0.10*execFocusPow('cfo','cost'));};}
if(typeof ttMonthly==='function'){const _tm_x=ttMonthly;ttMonthly=function(){return _tm_x()*(1-0.12*execFocusPow('cto','lean')-0.10*execFocusPow('cfo','cost'));};}
/* CFO growth: more borrowing headroom */
if(typeof loanLimit==='function'){const _ll_x=loanLimit;loanLimit=function(){return Math.round(_ll_x()*(1+0.25*execFocusPow('cfo','growth'))/5000)*5000;};}
/* COO efficiency: a little more throughput */
if(typeof speedOf==='function'){const _so_x=speedOf;speedOf=function(st){return _so_x(st)*(1+0.06*execFocusPow('coo','efficient'));};}
/* executive pay in the P&L and out of the bank */
if(typeof companyPL==='function'){const _pl_x=companyPL;companyPL=function(){const P=_pl_x();const ex=execPayroll();if(ex){P.people+=ex;P.over+=ex;P.op-=ex;P.opct=P.rev?P.over/P.rev:0;P.oppct=P.rev?P.op/P.rev:0;}
  // CFO growth also shaves finance costs
  const g=execFocusPow('cfo','growth');if(g&&P.fin){const cut=Math.round(P.fin*0.25*g);P.fin-=cut;P.over-=cut;P.op+=cut;P.oppct=P.rev?P.op/P.rev:0;}
  return P;};}

/* daily: pay them, and run the periodic COO quality lift and exec advice */
if(typeof peopleDaily==='function'){const _pd_x=peopleDaily;peopleDaily=function(W){_pd_x(W);
  const ex=execPayroll();if(ex)spend(ex/DPM);
  if(S.day%DPM===13)cooQuality();
  execAdvice();
};}
function cooQuality(){const pow=execFocusPow('coo','quality');if(!pow)return;
  let n=0;for(const c of active())if(c.sat<70){c.sat=Math.min(100,c.sat+rnd(1,4)*pow);n++;}
  if(S.co)S.co.rep=Math.min(100,(S.co.rep||0)+1.2*pow);
}
/* COO scale: stronger branches */
if(typeof branchesMonthly==='function'){const _bm_x=branchesMonthly;branchesMonthly=function(){const before=S.co.cash;_bm_x();const pow=execFocusPow('coo','scale');if(pow&&typeof branches==='function'){/* nudge: a small uplift on branch contribution */const up=Math.round((S.co.cash-before)*0.12*pow);if(up>0){S.co.cash+=up;S.m.rec=(S.m.rec||0)+up;}}};}
function execAdvice(){if(!execAny()||S.day%DPM!==17||Math.random()>0.4)return;
  const r=pick(EXEC_ORDER.filter(x=>exec(x)));const e=exec(r);const R=EXEC_ROLE[r];const good=Math.random()<(0.4+0.4*(e.quality||0.7));
  let m='';
  if(good){
    if(r==='cto'){if(breachOdds()*12>0.2)m='“Our breach exposure is creeping up. We should harden the estate.”';else if(toolCertGap&&toolCertGap()>0)m='“Some of our tooling won’t survive an audit. Worth fixing before a client asks.”';else m='“The stack’s in good shape. Now’s the time to build something of our own.”';}
    if(r==='cfo'){if(companyPL().op<0)m='“We’re running at a loss. I’d tighten spend before we borrow more.”';else if(typeof billCoverage==='function'&&billCoverage()<0.7)m='“We’re leaking revenue on billing. It’ll pay for itself to fix.”';else m='“Balance sheet’s healthy. We could afford a bigger move.”';}
    if(r==='coo'){if(typeof slaPct==='function'&&slaPct()<0.85)m='“SLA’s slipping. The desk needs either hands or better tools.”';else m='“Operations are steady. We can take on more without it wobbling.”';}
  }else{
    m=e.char==='visionary'?'“We should bet big, now, while we can.”':e.char==='maverick'?'“Trust me, let’s do the unconventional thing.”':e.char==='veteran'?'“In my day we’d have sat tight and waited.”':'“Let’s just keep doing what we’re doing.”';
  }
  if(m)log(e.name+' ('+R.t+'): '+m,'info');
}

/* ---- the Leadership section on the Strategy tab ---- */
function execEffectLine(r){const e=exec(r);if(!e)return '';const f=EXEC_ROLE[r].focuses.find(x=>x.k===e.focus);const pow=execFocusPow(r,e.focus);
  const fit=(ECHAR[e.char]&&ECHAR[e.char].lean.includes(e.focus));
  return (f?f.d:'')+' <span class="mut">'+(fit?'Plays to their strengths.':'Not their strong suit.')+' Effectiveness '+pct(Math.min(1,pow))+'.</span>';}
function leadershipSec(){
  let h='<div class="sec"><h3>Leadership</h3><p class="lede">Your C-suite: expensive senior hires who each own a domain and steer it. Every executive has a personality that colours their strengths, and a focus you set. Effect depends on how good they are and whether the focus suits them.</p><ul class="list">';
  for(const r of EXEC_ORDER){const R=EXEC_ROLE[r];const e=exec(r);
    if(e){h+='<li class="item"><span>'+roleDot('founder')+'<b>'+esc(e.name)+'</b> <span class="mut">'+R.t+' · '+ECHAR[e.char].t.toLowerCase()+'</span></span><span class="r">'+gbp(e.sal)+'/mo</span><span class="sub">'+execEffectLine(r)+
      '<span class="row" style="margin-top:6px">'+R.focuses.map(f=>'<button class="btn sm" data-act="execFocus" data-v="'+r+':'+f.k+'" aria-pressed="'+(e.focus===f.k)+'">'+f.t+'</button>').join('')+'</span>'+
      '<span class="row" style="margin-top:4px"><button class="btn sm danger" data-act="execFire" data-v="'+r+'">Let them go</button></span></span></li>';}
    else{const cs=execCands(r);
      h+='<li class="item"><span><b>'+R.full+'</b> <span class="mut">vacant</span></span><span class="r mut">'+gbp(R.sal[0])+'–'+gbp(R.sal[1])+'/mo</span><span class="sub">'+esc(R.d)+'<span class="row" style="margin-top:6px">'+cs.map((c,i)=>'<button class="btn sm" data-act="execHire" data-v="'+r+':'+i+'">'+esc(c.name.split(' ')[0])+' · '+ECHAR[c.char].t.toLowerCase()+' · '+gbp(c.sal)+'</button>').join('')+'</span><span class="mut" style="display:block;font-size:.76rem;margin-top:4px">Better candidates cost more. Set their focus once they start.</span></span></li>';}
  }
  h+='</ul></div>';
  return h;}
/* leadershipSec relocated to the Team tab (see zzr.js) */
