
/* ============ build 81: the floor maps to teams ============
   In the bigger offices, staff sit with their team, in tinted labelled zones
   that grow and shrink as you hire and lose people. Same-role people always
   pack together now; the coloured zones only draw once you’ve got room. */

const FLOOR_TEAMS=[
  {k:'lead', t:'Leadership',      roles:['founder'],            col:'--r-founder'},
  {k:'desk', t:'Service desk',    roles:['desk','hdm'],         col:'--r-desk'},
  {k:'eng',  t:'Engineering',     roles:['eng','tm','pm'],      col:'--r-eng'},
  {k:'sales',t:'Sales & accounts',roles:['am','sm','sdm'],      col:'--r-am'},
  {k:'ops',  t:'Back office',     roles:['bill','bm'],          col:'--r-sm'}
];
const ZONE_MIN_TIER=3;   // Office floor and up: enough room for zones to read
function teamRank(role){for(let i=0;i<FLOOR_TEAMS.length;i++)if(FLOOR_TEAMS[i].roles.includes(role))return i;return FLOOR_TEAMS.length;}
function teamOfRole(role){for(const t of FLOOR_TEAMS)if(t.roles.includes(role))return t;return FLOOR_TEAMS[FLOOR_TEAMS.length-1];}

/* seat people with their team: sort by team, then role, then seniority, and pack into desks in that order */
reassignDesks=function(){
  const list=S.staff.filter(s=>!s.left);
  list.sort((a,b)=>{const ta=teamRank(a.role),tb=teamRank(b.role);if(ta!==tb)return ta-tb;
    if(a.role!==b.role)return a.role<b.role?-1:1;return (a.start||0)-(b.start||0);});
  list.forEach((s,i)=>s.desk=i);
};

/* re-pack automatically whenever the roster or role mix changes, so zones shift as staff come and go */
if(typeof syncActors==='function'){const _sync=syncActors;syncActors=function(){
  try{const on=S.staff.filter(s=>!s.left);const sig=on.length+':'+on.map(s=>s.role).sort().join(',');
    if(sig!==V._floorSig){V._floorSig=sig;reassignDesks();}}catch(e){}
  return _sync.apply(this,arguments);};}

function floorZonesOn(){return V.L&&V.L.tier>=ZONE_MIN_TIER;}
function drawZones(c,now){
  if(!floorZonesOn())return;
  const L=V.L,T=V.T,K=V.col;
  const byDesk={};for(const s of S.staff)if(!s.left&&s.desk!=null)byDesk[s.desk]=s;
  // bucket occupied desks by team
  const teams={};
  L.desks.forEach((d,i)=>{const s=byDesk[i];if(!s)return;const tm=teamOfRole(s.role);const e=teams[tm.k]||(teams[tm.k]={team:tm,cells:[]});e.cells.push(d);});
  for(const k in teams){const e=teams[k];if(e.cells.length<2)continue;const col=K[e.team.col.replace('--','')]||K.p;
    // group by row, then split each row into contiguous runs of desks
    const byRow={};for(const d of e.cells){const y=Math.round(d.y*10)/10;(byRow[y]=byRow[y]||[]).push(d);}
    const ys=Object.keys(byRow).map(Number).sort((a,b)=>a-b);let labelled=false;
    for(const y of ys){const ds=byRow[y].sort((a,b)=>a.x-b.x);
      let run=[ds[0]];const runs=[];
      for(let m=1;m<ds.length;m++){if(ds[m].x-run[run.length-1].x<=2.2+0.01)run.push(ds[m]);else{runs.push(run);run=[ds[m]];}}
      runs.push(run);
      for(const rn of runs){const x0=rn[0].x-0.35,x1=rn[rn.length-1].x+rn[0].w+0.35,yy=y-0.4,hh=2.05;
        c.save();c.globalAlpha=0.12;c.fillStyle=col;rr(c,X(x0),Y(yy),(x1-x0)*T,hh*T,0.45*T);c.fill();
        c.globalAlpha=0.45;c.strokeStyle=col;c.lineWidth=1.4;rr(c,X(x0),Y(yy),(x1-x0)*T,hh*T,0.45*T);c.stroke();c.restore();
        if(!labelled){labelled=true;c.save();c.globalAlpha=0.92;c.fillStyle=col;c.font='700 '+Math.max(8,T*0.34)+'px '+K.display;
          c.fillText(e.team.t.toUpperCase()+' · '+e.cells.length,X(x0+0.05),Y(yy-0.12));c.restore();}
      }
    }
  }
}
