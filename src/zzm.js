
/* ============ build 112: an Opportunities tab in the markets window ============
   A glanceable, always-there view of what's in play: open tenders first, then the leads and
   cross-sells in the pipeline. Late on, account managers write and send most proposals, so the
   list can get long — a filter keeps it to what needs you (sign-offs), the big ones, or the
   likely ones, and the list is capped with a link through to the full Pipeline tab. It reads
   the same data as the Pipeline and Tenders tabs under Sales & market, which are unchanged. */

const OPP_CAP=10;                 // most proposals shown here before the "+N more" link
function dealVal(d){return d.kind==='project'?Math.round((d.proj&&d.proj.value||0)/12):Math.round(dealMRR(d,1));}
function dealWin(d){if(d.stage==='pitched')return d.win||0;try{const E=(typeof dealEstimate==='function')?dealEstimate(d,1):null;if(E&&E.pct!=null)return E.pct;}catch(e){}return (typeof winChance==='function')?winChance(d,1):0;}
function oppNeedsMe(d){return !!d.draft||!d.drafter;}   // ready to sign off, or nobody's writing it yet
ACT_EXT.oppFilter=v=>{if(S&&S.co)S.co.oppFilter=v;};

/* actionable-item alerts, for the notification dots on the Tenders / Opportunities tabs */
function oppTenderAlert(){const T=(typeof tenders==='function')?tenders():{open:[]};return (T.open||[]).some(x=>x.state==='open'&&!x.bid);}
function oppPipeAlert(){return (S.deals||[]).some(d=>d.stage==='open'&&oppNeedsMe(d));}

/* ---- Tenders: open public and framework tenders ---- */
function invTenders(){
  const T=(typeof tenders==='function')?tenders():{open:[]};
  const tOpen=(T.open||[]).filter(x=>x.state==='open').sort((a,b)=>(b.opened||0)-(a.opened||0));
  const tval=x=>Math.round((typeof tenderVal==='function'?tenderVal(x):(typeof tenderValue==='function'?tenderValue(x):0)));
  let h='<div class="sec" style="margin:0"><h3 style="font-size:.95rem">Tenders <button class="linkbtn" style="font-size:.76rem;font-weight:600" data-act="tab" data-v="tenders">Full tab →</button></h3><p class="lede">Public and framework tenders open to bid. Act here, or open the Tenders tab for the detail.</p>'+
    '<div class="tiles"><div class="tile"><span class="k">Open</span><span class="v">'+tOpen.length+'</span><small>to bid</small></div><div class="tile"><span class="k">Not yet bid</span><span class="v">'+tOpen.filter(x=>!x.bid).length+'</span><small>need a decision</small></div></div></div>';
  h+='<div class="sec" style="margin:10px 0 0">';
  if(tOpen.length){
    h+='<ul class="list">'+tOpen.map(x=>{
      const R=(typeof reqList==='function')?reqList(x):[];const miss=R.filter(r=>!r.ok).length;
      const rname=(typeof reg==='function'&&x.region)?reg(x.region).t:'';
      const tag=x.framework?(x.years+'yr framework'):x.callOff?'call-off':x.mega?'MAJOR':((typeof TENDER_SIZES!=='undefined'&&TENDER_SIZES[x.size])?TENDER_SIZES[x.size].t:'');
      return '<li class="item click" data-act="tender" data-v="'+x.id+'"><span><b>'+esc(x.name)+'</b> <span class="mut">'+(tag?tag+' · ':'')+x.seats+' users · '+x.term+'m'+(rname?' · '+rname:'')+'</span></span><span class="r">~'+gbp(tval(x))+'/mo</span><span class="sub">'+(x.bid?'<b class="pos">Bid in.</b> ':'')+'Closes '+dLabel(x.close)+' · '+(R.length?(miss?'<span class="neg">'+miss+' of '+R.length+' requirements to meet</span>':'<span class="pos">you meet every requirement</span>'):'no set requirements')+'</span></li>';
    }).join('')+'</ul>';
  } else h+='<p class="empty">No open tenders right now. New ones appear every few weeks.</p>';
  return h+'</div>';
}

/* ---- Opportunities: the leads and cross-sells in your pipeline ---- */
function invOpps(){
  const deals=(S.deals||[]);
  const open=deals.filter(d=>d.stage==='open');
  const sent=deals.filter(d=>d.stage==='pitched');
  const needs=open.filter(oppNeedsMe).length;

  let h='<div class="sec" style="margin:0"><h3 style="font-size:.95rem">Opportunities</h3><p class="lede">Leads and cross-sells in your pipeline. Sign off proposals here, or open the Pipeline tab for the detail.</p>'+
    '<div class="tiles"><div class="tile"><span class="k">To quote</span><span class="v">'+open.length+'</span><small>in the pipeline</small></div>'+
    '<div class="tile"><span class="k">Needs you</span><span class="v'+(needs?' neg':'')+'">'+needs+'</span><small>to sign off or start</small></div>'+
    '<div class="tile"><span class="k">Awaiting</span><span class="v">'+sent.length+'</span><small>proposals out</small></div></div></div>';

  /* ---- proposals, with a filter and a cap so the list stays manageable ---- */
  const filt=(S.co&&S.co.oppFilter)||'all';
  const pass=d=>filt==='signoff'?oppNeedsMe(d):filt==='value'?dealVal(d)>=750:filt==='likely'?dealWin(d)>=0.5:true;
  const filtered=open.filter(pass).sort((a,b)=>dealVal(b)-dealVal(a));
  const shown=filtered.slice(0,OPP_CAP),more=filtered.length-shown.length;
  const chips=[['all','All'],['signoff','Needs me'],['value','Big'],['likely','Likely']]
    .map(c=>'<button data-act="oppFilter" data-v="'+c[0]+'" aria-pressed="'+(filt===c[0])+'">'+c[1]+'</button>').join('');
  h+='<div class="sec" style="margin:10px 0 0"><h3 style="font-size:.92rem">Pipeline <button class="linkbtn" style="font-size:.76rem;font-weight:600" data-act="tab" data-v="sales">Pipeline →</button></h3>'+
    '<div class="seg" style="margin:0 0 8px">'+chips+'</div>';
  if(!open.length)h+='<p class="empty">Nothing in the pipeline. New leads and cross-sell chances turn up here.</p>';
  else if(!shown.length)h+='<p class="empty">Nothing matches this filter. Your account managers are handling the rest.</p>';
  else h+=(typeof dealRow==='function'?'<ul class="list">'+shown.map(dealRow).join('')+'</ul>':'')+
    (more>0?'<p class="mut" style="font-size:.8rem;margin:6px 0 0">and '+more+' more. <button class="linkbtn" data-act="tab" data-v="sales">See all in the Pipeline →</button></p>':'');
  h+='</div>';

  if(sent.length&&typeof dealRow==='function'){
    const sShown=sent.slice().sort((a,b)=>dealVal(b)-dealVal(a)).slice(0,6),sMore=sent.length-sShown.length;
    h+='<div class="sec" style="margin:10px 0 0"><h3 style="font-size:.92rem">Waiting to hear back</h3><ul class="list">'+sShown.map(dealRow).join('')+'</ul>'+
      (sMore>0?'<p class="mut" style="font-size:.8rem;margin:6px 0 0">and '+sMore+' more out with clients.</p>':'')+'</div>';
  }
  return h;
}
