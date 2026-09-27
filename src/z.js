
/* ============ build 30: a business partner ============ */
/* A co-owner who draws what you draw, rides out lean months if morale is high,
   votes on the big calls, gives advice (good or bad), and takes their share of
   the winnings. Great in the valley (cash and shared burn), a cost in control. */
const PCHAR={
  cautious:{t:'Cautious',d:'Hates debt and big bets, likes steady, profitable growth.',adv:'safe'},
  aggressive:{t:'Aggressive',d:'Pushes to expand, acquire and take risks. Restless when you sit still.',adv:'bold'},
  people:{t:'People-first',d:'Cares about the team and clients. Hates firing, underpaying and dirty tricks.',adv:'people'}
};
const PFIRST=['Sam','Priya','Tom','Nadia','Chris','Aisha','Dan','Lena','Raj','Ellie'];
function partner(){return S.partner;}
function pEquity(){return partner()?partner().equity:0;}
function pDraw(){const f=founderSt();return f?(f.salary||0):0;}
function partnerCands(){if(S.pCands)return S.pCands;const out=[];const chars=['cautious','aggressive','people'].sort(()=>Math.random()-0.5);
  for(let i=0;i<3;i++){const eq=[0.2,0.3,0.35][i];const cash=Math.round((10000+eq*80000)*(0.8+S.co.rep/200)/1000)*1000;
    out.push({name:pick(PFIRST)+' '+pick(LAST),char:chars[i],equity:eq,cashIn:cash});}
  S.pCands=out;return out;}
ACT_EXT.takePartner=i=>{const c=partnerCands()[+i];if(!c||partner())return;
  S.partner={name:c.name,char:c.char,equity:c.equity,morale:75,joined:S.day,pocket:0,forgone:0,voteFails:0};
  S.co.cash+=c.cashIn;S.m.setup=(S.m.setup||0)+c.cashIn;S.pCands=null;
  log(c.name+' has joined as your business partner, putting in '+gbp(c.cashIn)+' for '+pct(c.equity)+' of the company. They draw what you draw and get a say in the big calls.','event');ui.modal=null;};

/* their pay: they match your draw, but forgo it when cash is tight and they still believe */
function partnerDaily(){const p=partner();if(!p)return;
  if(S.day%DPM!==0)return;
  const draw=pDraw();const tight=S.co.cash<burn()*1.5||companyPL().op<0;
  if(draw>0){if(tight&&p.morale>=55){p.forgone=(p.forgone||0)+draw;}else{S.co.cash-=draw*(1+ONCOST);S.m.sal=(S.m.sal||0)+draw*(1+ONCOST);}}
  // morale: fed by being paid and by the business doing well; drained by lean months and being overruled
  const grow=S.hist.length>=4&&mrr()>S.hist[S.hist.length-4].mrr;
  let t=60+(grow?15:-5)+(companyPL().op>0?10:-10)+(draw>0&&!tight?10:0)-(p.forgone>draw*3?15:0);
  if(p.char==='people'&&(founderSt()&&founderSt().morale<50))t-=10;
  p.morale=clamp(p.morale+(t-p.morale)*0.15,0,100);
  if(p.morale<20&&!p.leaving){p.leaving=S.day;S.hq.push({id:'partnerOut',ctx:{}});}
}
/* dividends and a sale are split by shareholding */
const _dividend30=ACT_EXT.dividend;
ACT_EXT.dividend=v=>{const p=partner();if(!p)return _dividend30(v);
  v=+v;if(!(v>=100)||v>divRoom())return;(S.co.divLog=S.co.divLog||[]).push({d:S.day,v});S.co.cash-=v;
  const yours=Math.round(v*(1-p.equity));const yoursNet=(typeof divNet==='function')?Math.round(divNet(yours)):yours;p.pocket=(p.pocket||0)+(v-yours);S.co.divs=(S.co.divs||0)+yoursNet;
  const f=founderSt();if(f)f.morale=Math.min(100,f.morale+5);p.morale=Math.min(100,p.morale+6);
  log('You declared a '+gbp(v)+' dividend: '+gbp(yours)+' to you, '+gbp(v-yours)+' to '+p.name+'.','good');};
const _sellCo30=sellCo;
sellCo=function(x){const p=partner();if(!p)return _sellCo30(x);
  const net=x.offer+S.co.cash-S.co.loan;const yours=Math.round(net*(1-p.equity));const E=exitNet(yours);
  S.over={mi:monthOf(S.day),peak:Math.max(...S.hist.map(h=>h.mrr),mrr()),sold:{buyer:x.buyer,offer:x.offer,net:E.net,cgt:E.cgt,gross:E.gross,home:(S.co.home||0)+(S.co.divs||0),partner:net-yours,pname:p.name}};
  log('You sold '+S.co.name+' for '+gbp(x.offer)+'. After the loan and '+p.name+'’s '+pct(p.equity)+', your share is '+gbp(yours)+'.','good');};

/* the vote: the big calls need them on side */
function pObjects(k){const p=partner();if(!p)return false;const c=p.char;
  if(c==='cautious')return ['soc','dc','rival','campaign'].includes(k);
  if(c==='aggressive')return false;
  if(c==='people')return false;
  return false;}
const _betGo30=ACT_EXT.betGo;
ACT_EXT.betGo=k=>{const p=partner();if(p&&pObjects(k)&&!ui._pok){ui.modal={type:'partnerVote',k};return;}ui._pok=false;_betGo30(k);};
ACT_EXT.pProceed=k=>{const p=partner();if(p){p.morale=Math.max(0,p.morale-18);p.voteFails=(p.voteFails||0)+1;remember&&0;log('You overruled '+p.name+' and pressed ahead. They’re not happy.','bad');}ui._pok=true;ui.modal=null;ACT_EXT.betGo(k);};
ACT_EXT.pHeed=()=>{const p=partner();if(p)p.morale=Math.min(100,p.morale+6);ui.modal=null;};
MODAL_EXT.partnerVote=(M,x)=>{const p=partner();const B=(typeof BETS!=='undefined'&&BETS[M.k])||{t:'this'};
  return '<div class="dialog">'+x+'<p class="kick">Your partner disagrees</p><h2>'+esc(p.name)+' is against '+esc((B.t||'this').toLowerCase())+'</h2><p>'+esc(p.name)+' ('+PCHAR[p.char].t.toLowerCase()+') thinks this is the wrong move: '+(p.char==='cautious'?'too much money at too much risk.':'not the way to grow.')+' You can press ahead anyway, but it will cost their goodwill.</p><div class="choices"><button class="choice" data-act="pProceed" data-v="'+M.k+'"><b>Press ahead anyway</b><span>Do it over their objection. Their morale takes a hit.</span></button><button class="choice" data-act="pHeed"><b>Hold off</b><span>Respect the vote for now.</span></button></div></div>';};

/* leaving: low morale forces a buyout, or they push to sell */
HUMAN.partnerOut={w:0,ok:()=>false,make:()=>{const p=partner();if(!p)throw 0;const price=Math.round((typeof valuation==='function'?valuation():mrr()*24)*p.equity/1000)*1000;
  return {kicker:'Your partner',title:p.name+' wants out',body:p.name+' has had enough'+(p.voteFails>1?' of being overruled':(p.forgone>0?' of going unpaid':''))+' and wants to leave. To buy back their '+pct(p.equity)+' you’d pay '+gbp(price)+'. If you can’t, they’ll push to sell the company.',
    choices:[
      {label:S.co.cash>=price?'Buy them out · '+gbp(price):'Buy them out (need '+gbp(price)+')',note:'You own the company outright again.',go(){if(S.co.cash<price){log('You can’t afford to buy '+p.name+' out.','bad');S.hq.push({id:'partnerOut',ctx:{}});return;}S.co.cash-=price;log('You bought '+p.name+' out for '+gbp(price)+'. The company is all yours again.','event');S.partner=null;}},
      {label:'Let them go for now',note:'They stay on paper, resentful, and may force a sale later.',go(){p.morale=25;p.leaving=null;log(p.name+' is staying, for now, but the relationship is strained.','bad');}}
    ]};}};

/* advice: sometimes sharp, sometimes wrong, coloured by who they are */
function partnerAdvice(){const p=partner();if(!p||S.day%DPM!==11||Math.random()>0.4)return;
  const good=Math.random()<(p.morale>60?0.65:0.4);const c=p.char;let m='';
  if(good){if(backlogDays()>2)m='“We’re drowning on the desk, we need hands.”';else if(companyPL().op<0)m='“We’re bleeding money. Something has to give.”';else if(active().filter(x=>x.sat<50).length)m='“Some clients are unhappy, we should get in front of them.”';else if(c==='aggressive'&&S.co.cash>burn()*4)m='“We’re sitting on cash. Time to grow.”';}
  else{m=c==='cautious'?'“I’d hold off on spending, even though the numbers look fine.”':c==='aggressive'?'“Let’s bet big now.”':'“Give everyone a pay rise, that’ll fix it.”';}
  if(m)log(p.name+': '+m,'info');}

/* the owners section on the Team tab */
function partnerSec(){
  if(partner()){const p=partner();
    return '<div class="sec"><h3>Ownership</h3><ul class="list"><li class="item"><span>'+roleDot('founder')+'<b>You</b></span><span class="r">'+pct(1-p.equity)+'</span></li><li class="item"><span>'+roleDot('founder')+'<b>'+esc(p.name)+'</b> <span class="mut">'+PCHAR[p.char].t.toLowerCase()+' partner</span></span><span class="r">'+pct(p.equity)+'</span><span class="sub">Draws '+gbp(pDraw())+' a month, same as you'+(p.forgone>0?', and has gone without '+gbp(Math.round(p.forgone))+' in lean months':'')+'. Morale '+Math.round(p.morale)+'. '+PCHAR[p.char].d+'</span></li></ul></div>';}
  const cs=partnerCands();
  return '<div class="sec"><h3>Bring in a partner</h3><p class="lede">A co-owner puts cash in and shares the load. They draw what you draw but ride out lean months, get a vote on the big calls, and take their share of dividends and any sale. Good in a tight spot, at the cost of a slice of the company.</p><ul class="list">'+cs.map((c,i)=>'<li class="item"><span><b>'+esc(c.name)+'</b> <span class="mut">'+PCHAR[c.char].t.toLowerCase()+'</span></span><span class="r"><button class="btn sm" data-act="takePartner" data-v="'+i+'">'+gbp(c.cashIn)+' for '+pct(c.equity)+'</button></span><span class="sub">'+PCHAR[c.char].d+'</span></li>').join('')+'</ul></div>';}
const _paneTeam30=paneTeam;
paneTeam=function(){let h=_paneTeam30();
  if(h.indexOf('Elsewhere in the company')>=0)return h.replace('<div class="sec"><h3>Elsewhere in the company</h3>',partnerSec()+'<div class="sec"><h3>Elsewhere in the company</h3>');
  // insert before the knowledge matrix / at end
  return h+partnerSec();};
/* show the split on the sold screen */
const _overSold30=null;
const _peopleDaily30=peopleDaily;peopleDaily=function(W){_peopleDaily30(W);partnerDaily();partnerAdvice();};
