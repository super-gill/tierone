
/* ============ build 128: bulk 5% uplift + account-manager auto-uplift ============
   The per-client 5% rise got tedious at scale. Two additions, both respecting the same rules
   (once a year per client, capped 30% over list):
   1. A filter-scoped bulk "Raise 5%" on the Clients tab: applies to the clients matching your
      current filter, skipping anyone at risk or already near the cap.
   2. A policy toggle to let your account managers apply the yearly uplift across their books
      automatically, so managed clients keep pace hands-off. Your own book stays manual. */

/* the same eligibility the per-client button uses, plus skip anyone at risk */
function bulkUpliftOk(c){return (typeof upliftOk==='function')&&upliftOk(c)&&c.notice==null&&c.sat>=55;}

/* mirrors the Clients-tab filter predicate so the bulk action hits the same set you see */
function clientInFilter(c,filt){
  if(filt==='review')return (typeof reviewDue==='function')&&reviewDue(c);
  if(filt==='mine')return !amOf(c);
  if(filt==='risk')return c.notice!=null||c.sat<55;
  if(filt==='thin'){const p=clientPL(c);return !p.settling&&p.pct<0.15;}
  if(filt==='uplift')return (typeof upliftOk==='function')&&upliftOk(c);
  return true;
}

/* apply the 5% rise to one client; soft=true for the AM-run version (they smooth it over) */
function applyUplift(c,soft){
  const big=Object.values(c.svc).some(x=>x.pm>=1.15);
  for(const k in c.svc)c.svc[k].pm=Math.min(1.3,c.svc[k].pm*1.05);
  c.sat=Math.max(0,c.sat-(soft?(big?7:3):(big?9:4)));
  c.trust=Math.max(0,c.trust-(soft?(big?6:2):(big?8:3)));
  c.upAt=S.day;
}

ACT_EXT.upliftBulk=()=>{
  const filt=(S.co&&S.co.clientFilter)||'all';let n=0;
  for(const c of active()){if(!clientInFilter(c,filt)||!bulkUpliftOk(c))continue;applyUplift(c,false);n++;}
  log(n?('Raised prices 5% for '+n+' client'+(n>1?'s':'')+'.'+(filt!=='all'?' (matching your filter)':'')):'No eligible clients in this view. At-risk and near-cap clients are skipped.','event');
};
ACT_EXT.amUplift=v=>{S.co.amUplift=(v==='1');log(S.co.amUplift?'Account managers will now apply the yearly 5% uplift across their books, skipping anyone at risk.':'Account managers will leave price rises to you.','info');};

/* daily: account managers apply the yearly rise to their book, one client per anniversary */
if(typeof peopleDaily==='function'){const _pd=peopleDaily;peopleDaily=function(W){_pd.apply(this,arguments);
  try{
    if(S.co.amUplift){for(const c of active()){const am=amOf(c);if(!am||!bulkUpliftOk(c))continue;applyUplift(c,true);S.co._amUpMo=(S.co._amUpMo||0)+1;}}
    if(S.day%DPM===0&&(S.co._amUpMo||0)>0){log('Account managers raised prices 5% for '+S.co._amUpMo+' client'+(S.co._amUpMo>1?'s':'')+' this month, as their year came round.','event');S.co._amUpMo=0;}
  }catch(e){}
};}

/* inject the bulk controls onto the Clients tab, under the annual 3% bar */
if(typeof paneClients==='function'){const _pc=paneClients;paneClients=function(){
  let h=_pc.apply(this,arguments);
  try{
    const filt=(S.co&&S.co.clientFilter)||'all';
    const elig=active().filter(c=>clientInFilter(c,filt)&&bulkUpliftOk(c)).length;
    const amOn=S.co.amUplift===true;const haveAms=(typeof ams==='function')&&ams().length>0;
    const scope=filt==='all'?'every eligible client':'the eligible clients in this filter';
    const bar='<div class="sec"><div class="row" style="justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">'+
        '<span class="lede" style="margin:0">Push the extra 5% (once a year per client, capped 30% over list). Applies to '+scope+' below, skipping anyone at risk or near the cap.</span>'+
        '<button class="btn sm" data-act="upliftBulk" '+(elig?'':'disabled')+'>Raise 5% · '+elig+' eligible</button></div>'+
      (haveAms?'<div class="row" style="justify-content:space-between;align-items:center;gap:8px;margin-top:8px"><span class="mut" style="font-size:.82rem">Let account managers apply the yearly uplift across their own books automatically</span><div class="seg" style="flex:0 0 auto;min-width:120px"><button data-act="amUplift" data-v="1" aria-pressed="'+amOn+'">On</button><button data-act="amUplift" data-v="0" aria-pressed="'+(!amOn)+'">Off</button></div></div>':'')+
      '</div>';
    h=h.replace('<div class="sec"><p class="lede">Telephony',bar+'<div class="sec"><p class="lede">Telephony');
  }catch(e){}
  return h;
};}
