
/* ============ build 75: training for every manager ============
   Each manager who has staff can train them, within a quarterly budget you set,
   toward either stack gaps or skill level (or both). Replaces the HDM-only
   training routines with one system that covers HDM→desk, TM→engineers,
   SM→account managers, BM→billing clerks. */

const MGR_TRAINS={hdm:'desk',tm:'eng',sm:'am',bm:'bill'};
const TRAIN_PLURAL={desk:'analysts',eng:'engineers',am:'account managers',bill:'billing clerks'};
const canStackTrain=icRole=>icRole==='desk'||icRole==='eng';

function trainBudget(m){return m.trainB!=null?m.trainB:((m.lim&&m.lim.train!=null)?m.lim.train:1000);}
function trainFoc(m){const ic=MGR_TRAINS[m.role];const cs=canStackTrain(ic);return m.trainFoc||(cs?'both':'skill');}

/* the monthly training run for every manager with reports */
function mgrTrainRun(){
  if(S.day%DPM!==5)return;
  const core=(typeof coreProds==='function')?coreProds():[];
  for(const role in MGR_TRAINS){
    const m=S.staff.find(s=>s.role===role&&present(s));if(!m)continue;
    const q=Math.floor(monthOf(S.day)/3);if(m.trQ!==q){m.spent=0;m.trQ=q;}
    const budget=trainBudget(m);if(budget<=0)continue;
    const ic=MGR_TRAINS[role],cs=canStackTrain(ic);
    let foc=trainFoc(m);if(!cs)foc='skill';
    const reports=()=>S.staff.filter(s=>s.role===ic&&present(s));
    let booked=0;
    while(booked<2&&(m.spent||0)<budget){
      let did=false;
      if((foc==='stack'||foc==='both')&&cs&&core.length){
        let best=null;for(const s of reports())for(const p of core){const f=fam(s,p);if(f<0.6&&(!best||f<best.f))best={s,p,f};}
        if(best){const cost=courseCost(best.p);if((m.spent||0)+cost<=budget){spend(cost);m.spent=(m.spent||0)+cost;best.s.away=S.day+1;best.s.course=best.s.away;best.s.fam[best.p]=Math.max(fam(best.s,best.p),0.85);log(m.name+' booked '+best.s.name+' on '+aN(PRODS[best.p].name)+' course.','info');did=true;booked++;continue;}}
      }
      if(foc==='skill'||foc==='both'){
        const s=reports().filter(x=>x.skill<5&&(x.trained||-999)+DPM<=S.day).sort((a,b)=>a.skill-b.skill)[0];
        if(s){const cost=(typeof trainCostOf==='function')?trainCostOf(s):1000;if((m.spent||0)+cost<=budget){spend(cost);m.spent=(m.spent||0)+cost;s.away=S.day+3;s.course=s.away;s.trained=S.day;s.xp=(s.xp||0)+(hasT(s,'quick')?0.7:0.5);s.morale=Math.min(100,s.morale+6);let up='';if(s.xp>=1){s.xp-=1;s.skill++;s.skillAt=S.day;up=' They come back a level '+s.skill+'.';}log(m.name+' sent '+s.name+' on a skills course.'+up,'info');did=true;booked++;continue;}}
      }
      if(!did)break;
    }
  }
}
if(typeof mgrDaily==='function'){const _md=mgrDaily;mgrDaily=function(){_md.apply(this,arguments);mgrTrainRun();};}

/* controls on the manager's card */
ACT_EXT.mtrainB=v=>{const [id,val]=v.split(':');const s=ST(id);if(s)s.trainB=+val;};
ACT_EXT.mtrainFoc=v=>{const [id,f]=v.split(':');const s=ST(id);if(s)s.trainFoc=f;};
function trainCoverRole(ic){const ppl=S.staff.filter(s=>s.role===ic&&present(s));const core=(typeof coreProds==='function')?coreProds():[];if(!ppl.length)return null;if(!core.length)return 1;return ppl.filter(s=>core.every(p=>fam(s,p)>=0.6)).length/ppl.length;}
function trainControls(s){
  const ic=MGR_TRAINS[s.role];if(!ic)return '';
  const reports=S.staff.filter(x=>x.role===ic&&present(x));
  const cs=canStackTrain(ic),b=trainBudget(s),foc=trainFoc(s);
  const focLbl={stack:'Close stack gaps',skill:'Raise skill level',both:'Both · stack first'};
  let h='<h3 style="font-size:.95rem;margin:14px 0 6px">Training their team</h3>';
  if(!reports.length)h+='<p class="mut" style="font-size:.8rem;margin:0 0 6px">No '+TRAIN_PLURAL[ic]+' to train yet.</p>';
  h+='<p class="lede" style="margin:0 0 4px">Training budget each quarter · '+gbp(s.spent||0)+' spent so far</p><div class="seg" style="margin-bottom:8px">'+[0,1000,2500,5000].map(o=>'<button data-act="mtrainB" data-v="'+s.id+':'+o+'" aria-pressed="'+(b===o)+'">'+(o?gbp(o):'None')+'</button>').join('')+'</div>';
  if(cs){h+='<p class="lede" style="margin:0 0 4px">Focus</p><div class="seg">'+['stack','skill','both'].map(o=>'<button data-act="mtrainFoc" data-v="'+s.id+':'+o+'" aria-pressed="'+(foc===o)+'">'+focLbl[o]+'</button>').join('')+'</div>';
    const cov=trainCoverRole(ic);if(cov!=null)h+='<p class="mut" style="font-size:.78rem;margin-top:6px">'+Math.round(cov*100)+'% of the '+TRAIN_PLURAL[ic]+' fully know your core stack.</p>';}
  else h+='<p class="mut" style="font-size:.78rem;margin-top:2px">Sends the lowest-skilled '+TRAIN_PLURAL[ic]+' on courses to raise their level, within budget.</p>';
  return h;
}
if(typeof mgrBlock==='function'){const _mb=mgrBlock;mgrBlock=function(s){let h=_mb(s);if(s&&MGR_TRAINS[s.role])h+=trainControls(s);return h;};}
