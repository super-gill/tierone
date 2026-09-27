
/* ============ build 61: realistic regional SME model (installed base / in-play flow / share ceiling) ============ */
/* A region isn't a tank you drain. It's a large installed base of SMEs. Only a slice is winnable
   each year (contracts renew, or a trigger puts an account in play), and your growth plateaus as
   you approach a sustainable SHARE of the base that your reputation and capacity can hold, not
   because the region empties. Rivals hold real slices of the same base and grow the same way.
   Numbers are ONS-shaped and scaled so a strong local MSP tops out near ~100-130 home clients. */
const REG_BASE={home:2200,se:8000,north:5000,scot:1900,east:2600,sw:2000,wales:2800};
const SWITCH_RATE=0.18;                                   // share of the base that comes into play each year
function regBase(k){return REG_BASE[k]||2000;}
function regInPlay(k){return Math.round(regBase(k)*SWITCH_RATE);}                       // contestable accounts a year
function rivFootprint(r){return r.tier===3?Math.round((r.clients||0)*0.22):(r.clients||0);} // a national is spread across regions
function regRivalsHeld(k){let n=0;for(const r of regRivals(k))n+=rivFootprint(r);return Math.round(n);}
function regServed(k){return regClients(k)+regRivalsHeld(k);}
function regServedFrac(k){const b=regBase(k);return b?clamp(regServed(k)/b,0,1):0;}
/* the share your reputation lets you hold, scaled by difficulty */
function regShareCap(k){const rr=(typeof regRep==='function')?regRep(k):(S.co.rep||50);const d=S.diff==='hard'?0.85:S.diff==='easy'?1.12:1;return clamp((0.02+rr/100*0.035)*d,0.02,0.065);}
function regCeiling(k){return Math.round(regShareCap(k)*regBase(k));}
function regHeadroom(k){const cap=regCeiling(k);return cap?clamp(1-regClients(k)/cap,0,1):0;}
function regYoursShare(k){const b=regBase(k);return b?regClients(k)/b:0;}
function regRivalsShare(k){const b=regBase(k);return b?regRivalsHeld(k)/b:0;}
/* how full you are relative to your sustainable ceiling: 0 while there's room, ramping to 1 near it.
   The 0.55 knee keeps flow full through the mid-game cash crunch. */
function regFullness(k){const cap=regCeiling(k);const pen=cap?regClients(k)/cap:1;return clamp((pen-0.55)/0.45,0,1);}

/* your new-logo flow: full until you near your sustainable share of the region, then a trickle */
marketRoom=function(){const k=(typeof regionOf==='function')?regionOf():'home';return clamp(Math.pow(1-regFullness(k),1.8),0.006,1);};
/* how "full" you are here, for the deal-size taper, cross-sell taper and the coach */
function homeSaturation(){return regFullness((typeof regionOf==='function')?regionOf():'home');}
/* cross-sell room: a client only wants so many services, and a filling region slows attach too, so
   MRR plateaus with the client count instead of every client marching to the full catalogue */
function attachRoom(c){const n=Object.keys(c.svc||{}).length;return clamp(1-(n-1)/3,0,1)*(1-0.6*homeSaturation());} // attach effectively caps a client around ~4 services, so MRR plateaus with the client count

/* keep the pivot coach visible for a spell, not one day */
if(typeof COACH_EVENT!=='undefined')COACH_EVENT.saturated=1;
/* coach: point at the plays once you near your ceiling (region maturity, not an MRR floor) */
if(typeof coachDaily==='function'){const _cd_reg=coachDaily;coachDaily=function(){_cd_reg();
  if(S.staff.length>1&&homeSaturation()>0.72&&(S.salesH||0)>0&&active().length>=25)
    coach('saturated','You’re near the ceiling of what you can realistically hold in your home region: you already serve a strong share of the businesses that come into play here, so winning more locally is slow going. Real growth now comes from elsewhere.','Open the map on the Strategy tab: expand into a new region, buy a local firm to inherit its share, or bid for a big tender.');};}
