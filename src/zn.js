
/* ============ build 74: team org chart ============
   Replaces the flat team list on the Team tab with a vertical organogram:
   you at the top, C-suite under you, managers under their exec, and each
   team clustered (with a count) under its manager. Adapts to who exists. */

const ORG_MGR_ROLES=['hdm','sm','sdm','pm','tm','bm'];
const ORG_IC_ROLES=['desk','eng','am','bill'];
const ORG_MGR_EXEC={hdm:'coo',sm:'coo',sdm:'coo',pm:'coo',tm:'cto',bm:'cfo'};
const ORG_IC_MGR={desk:'hdm',am:'sm',eng:'tm',bill:'bm'};
const ORG_IC_EXECFB={desk:'coo',am:'coo',eng:'cto',bill:'cfo'};
const ORG_PLURAL={desk:'analysts',eng:'engineers',am:'account managers',bill:'billing clerks'};

ACT_EXT.orgTog=v=>{ui.orgOpen=ui.orgOpen||{};ui.orgOpen[v]=!ui.orgOpen[v];};

function orgCss(){return '<style id="orgcss">'+
  '.org{margin-top:8px;font-size:.9rem}'+
  '.org ul{list-style:none;margin:0;padding-left:20px}'+
  '.org>ul{padding-left:0}'+
  '.org li{position:relative;padding:3px 0}'+
  '.org ul ul>li{padding-left:16px}'+
  '.org ul ul>li::before{content:"";position:absolute;left:0;top:-3px;bottom:50%;width:11px;border-left:1px solid var(--line);border-bottom:1px solid var(--line)}'+
  '.org ul ul>li::after{content:"";position:absolute;left:0;top:calc(50% - 3px);bottom:0;border-left:1px solid var(--line)}'+
  '.org ul ul>li:last-child::after{display:none}'+
  '.onode{display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap;border:1px solid var(--line);border-radius:9px;padding:6px 10px;background:var(--surface);max-width:100%}'+
  '.onode.click{cursor:pointer}.onode.click:hover{border-color:var(--ink)}'+
  '.onode b{font-weight:700}'+
  '.oceo{background:var(--p-soft);border-color:transparent}'+
  '.oexec{background:var(--surface2)}'+
  '.oclust{cursor:pointer;background:var(--surface2)}'+
  '.oclust:hover{border-color:var(--ink)}'+
  '.otog{font-family:var(--mono);width:1em;display:inline-block;color:var(--muted)}'+
  '.ostat{font-size:.76rem;color:var(--muted)}'+
  '.ovac{opacity:.6;border-style:dashed;background:none}'+
  '</style>';}

function orgStaffCard(s){
  const flags=[];if(!started(s))flags.push('starts '+daysLeft(s.start));if(s.away>S.day)flags.push('away');if(s.leaveOn!=null)flags.push('<span class="neg">leaving</span>');
  let stat='';
  if(s.role==='am')stat=amLoad(s)+'/'+amCap(s)+' clients';
  else stat=dots(s.skill);
  return '<div class="onode ostaff click" data-act="staff" data-v="'+s.id+'">'+roleDot(s.role)+'<b>'+esc(s.name)+'</b> <span class="mut">'+ROLES[s.role].short+'</span> <span class="ostat">'+stat+' · morale '+Math.round(s.morale)+(flags.length?' · '+flags.join(' · '):'')+'</span></div>';
}
function orgExecCard(r){
  const e=exec(r),R=EXEC_ROLE[r];
  if(!e)return '<div class="onode oexec ovac">'+R.t+' <span class="mut">vacant</span></div>';
  const f=R.focuses.find(x=>x.k===e.focus);
  return '<div class="onode oexec click" data-act="tab" data-v="strategy" title="Manage on the Strategy tab">👤 <b>'+esc(e.name)+'</b> <span class="mut">'+R.t+'</span> <span class="ostat">'+(f?f.t.toLowerCase():'')+'</span></div>';
}
function orgClusterNode(role,list){
  const open=ui.orgOpen&&ui.orgOpen[role];
  const avgM=Math.round(list.reduce((a,s)=>a+s.morale,0)/list.length);
  const away=list.filter(s=>s.away>S.day||!started(s)||s.leaveOn!=null).length;
  const head='<div class="onode oclust" data-act="orgTog" data-v="'+role+'"><span class="otog">'+(open?'▾':'▸')+'</span>'+roleDot(role)+'<b>'+list.length+' '+ORG_PLURAL[role]+'</b> <span class="ostat">avg morale '+avgM+(away?' · '+away+' out/leaving':'')+'</span></div>';
  let kids='';
  if(open)kids='<ul>'+list.slice().sort((a,b)=>b.skill-a.skill).map(s=>'<li>'+orgStaffCard(s)+'</li>').join('')+'</ul>';
  return '<li>'+head+kids+'</li>';
}

function orgChartHTML(){
  const P=(typeof exec==='function');
  const present=r=>P&&!!exec(r);
  const you=founderSt()||{name:S.co.founder||'You',role:'founder'};
  const placed={};
  // one node per manager role (first of each); collect extras as leftovers
  const mgrByRole={};const extraStaff=[];
  for(const s of staffOn()){
    if(ORG_MGR_ROLES.includes(s.role)){if(!mgrByRole[s.role]){mgrByRole[s.role]=s;placed[s.id]=1;}else extraStaff.push(s);}
  }
  const icByRole={};for(const r of ORG_IC_ROLES){icByRole[r]=staffOn().filter(s=>s.role===r);icByRole[r].forEach(s=>placed[s.id]=1);}
  // where each IC cluster hangs
  const clusterParent={};
  for(const r of ORG_IC_ROLES){if(!icByRole[r].length)continue;const mr=ORG_IC_MGR[r];if(mgrByRole[mr])clusterParent[r]='mgr:'+mr;else if(present(ORG_IC_EXECFB[r]))clusterParent[r]='exec:'+ORG_IC_EXECFB[r];else clusterParent[r]='ceo';}
  // where each manager hangs
  const mgrParent={};for(const role in mgrByRole){const ex=ORG_MGR_EXEC[role];mgrParent[role]=present(ex)?('exec:'+ex):'ceo';}

  const mgrNode=role=>{let kids='';for(const r of ORG_IC_ROLES)if(clusterParent[r]==='mgr:'+role)kids+=orgClusterNode(r,icByRole[r]);return '<li>'+orgStaffCard(mgrByRole[role])+(kids?'<ul>'+kids+'</ul>':'')+'</li>';};
  const execNode=r=>{let kids='';for(const role in mgrByRole)if(mgrParent[role]==='exec:'+r)kids+=mgrNode(role);for(const ic of ORG_IC_ROLES)if(clusterParent[ic]==='exec:'+r)kids+=orgClusterNode(ic,icByRole[ic]);return '<li>'+orgExecCard(r)+(kids?'<ul>'+kids+'</ul>':'')+'</li>';};

  // CEO's direct children
  let ceoKids='';
  const execsShown=EXEC_ORDER.filter(r=>present(r));
  for(const r of execsShown)ceoKids+=execNode(r);
  // vacant execs that own a present manager, shown faint so the structure reads
  for(const r of EXEC_ORDER)if(!present(r)&&Object.keys(mgrByRole).some(role=>ORG_MGR_EXEC[role]===r)){/* managers attach to CEO instead; skip vacant box */}
  for(const role in mgrByRole)if(mgrParent[role]==='ceo')ceoKids+=mgrNode(role);
  for(const ic of ORG_IC_ROLES)if(clusterParent[ic]==='ceo')ceoKids+=orgClusterNode(ic,icByRole[ic]);
  // any leftover staff (e.g. a second manager of the same role)
  const leftovers=extraStaff.concat(staffOn().filter(s=>!placed[s.id]&&s.id!=='you'));
  for(const s of leftovers)ceoKids+='<li>'+orgStaffCard(s)+'</li>';

  const ceoCard='<div class="onode oceo">'+roleDot('founder')+'<b>'+esc(you.name)+'</b> <span class="mut">Founder · CEO</span></div>';
  let h=orgCss()+'<div class="org"><ul><li>'+ceoCard+(ceoKids?'<ul>'+ceoKids+'</ul>':'')+'</li></ul></div>';
  if(!execsShown.length&&staffOn().length>3)h+='<p class="mut" style="font-size:.78rem;margin-top:8px">No C-suite yet. Hire executives on the Strategy tab and your managers will report up to them.</p>';
  return h;
}

/* swap the flat team list on the Team tab for the org chart */
if(typeof paneTeam==='function'){
  const _pt=paneTeam;
  paneTeam=function(){
    let h=_pt.apply(this,arguments);
    try{
      h=h.replace(/(<h3>The team<\/h3><p class="lede">[\s\S]*?<\/p>)<ul class="list">[\s\S]*?<\/ul>/, function(m,p1){return p1+orgChartHTML();});
    }catch(e){}
    return h;
  };
}
