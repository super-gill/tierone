
/* ============ build 96: phase 2 — the takeover contest ============
   Going after a listed national is no longer a quiet accumulation. Once you cross
   the disclosure line the board fights back — buying back its own shares to shrink
   the float you can reach, and, if you close on control, adopting a poison pill
   that makes the last shares punishingly dear. A rival white knight may also bid,
   and if you don't take control before their deadline, they win the firm and buy
   you out. Move decisively or lose the prize. */

const KNIGHTS=['Castlegate Group','Northstar Capital','Albion Tech Partners','Meridian Managed Services','a private-equity buyer'];
function defInit(r){if(!r.def)r.def={bought:0,pill:false,knight:null,since:S.day};return r.def;}

/* monthly: the target defends while you're a threat but not yet in control */
function defenseMonthly(){
  if(typeof natFirms!=='function')return;
  for(const r of natFirms()){
    const f=ownFrac(r);
    if(f<DISCLOSE){if(r.def&&f<0.02)r.def=null;continue;}    // not a threat, or you've sold out — stand down
    if(f>=CONTROL)continue;                                   // you're effectively in control; defences pause
    const d=defInit(r);
    const cap=Math.max(0,floatOf(r)-0.34);                    // buy back to shrink the reachable float
    if(d.bought<cap)d.bought=Math.min(cap,d.bought+rnd(0.015,0.035));
    if(!d.pill&&f>=0.44&&Math.random()<0.6){d.pill=true;log('The board of '+r.name+' has adopted a poison pill — a block of new shares placed with friendly hands. Taking control just got a lot dearer.','bad');}
    if(!d.knight&&Math.random()<0.18){d.knight={name:pick(KNIGHTS),by:S.day+ri(25,50),price:Math.round(sharePx(r)*rnd(1.05,1.2)*100)/100};log(d.knight.name+' has launched a rival bid for '+r.name+' at about '+spx(d.knight.price)+' a share. Take control before '+dLabel(d.knight.by)+' or they’ll win it.','event');}
  }
}
/* a white knight that reaches its deadline before you take control wins the firm and buys you out */
function knightDaily(){
  if(typeof natFirms!=='function')return;
  for(const r of natFirms().slice()){const d=r.def;if(!d||!d.knight)continue;
    if(ownFrac(r)>=CONTROL)continue;                          // you're about to take it yourself
    if(S.day>=d.knight.by){
      const hd=S.co.shares&&S.co.shares[r.id];
      if(hd&&hd.units){const val=hd.units*d.knight.price;S.co.cash+=val;S.m.setup=(S.m.setup||0)+val;S.co.capYr=(S.co.capYr||0)+val;log(d.knight.name+' has won control of '+r.name+'. Your '+Math.round(ownFrac(r)*100)+'% was bought out at '+spx(d.knight.price)+' a share for '+gbp(val)+'. It’s off the market now.','event');delete S.co.shares[r.id];}
      else log(d.knight.name+' has acquired '+r.name+'. It’s off the market now.','info');
      if(S.mkt)S.mkt.r=S.mkt.r.filter(x=>x.id!==r.id);
    }
  }
}
if(typeof marketMonthly==='function'){const _mm=marketMonthly;marketMonthly=function(){_mm.apply(this,arguments);try{defenseMonthly();}catch(e){}};}
if(typeof peopleDaily==='function'){const _pd=peopleDaily;peopleDaily=function(W){_pd.apply(this,arguments);try{knightDaily();}catch(e){}};}

/* the warning strip shown on the trading view when a firm is defending itself */
function defNote(r){const d=r&&r.def;if(!d)return '';const bits=[];
  if(d.bought>0.02)bits.push('buybacks have shrunk the tradeable float');
  if(d.pill)bits.push('a poison pill is in force');
  let h='';
  if(bits.length)h+='<div class="mkt-def warn">The board is defending — '+bits.join(', ')+'.</div>';
  if(d.knight){const left=Math.max(0,d.knight.by-S.day);h+='<div class="mkt-def bad"><b>'+esc(d.knight.name)+' has bid '+spx(d.knight.price)+'/share.</b> Take control within '+left+' day'+(left===1?'':'s')+' or they win '+esc(r.name)+'.</div>';}
  return h;}
