
/* ============ build 102: back-fill the wider market into existing saves ============
   The market is generated once when a game starts and then lives in the save. A save
   made before the market was widened keeps its old, smaller field — genMarket only
   runs for a brand-new game. This tops an existing save up to the current target
   density, one time, and fully forms each new firm (region, name, history, stance)
   so it behaves and shows up in the market table and the share listings like any other. */
(function(){
  const TARGET=[20,16,9,6];   /* sole, small, mid, national — matches genMarket */
  function nameNewFirm(r,used){
    /* mid and national firms keep their pool names from mkRival; only the small end
       gets a region-appropriate name, the same touch nameToRegion gives a fresh game */
    if(r.tier>=2)return;
    const pl=(typeof REG_PLACES!=='undefined'&&REG_PLACES[r.region||'home'])||(typeof REG_PLACES!=='undefined'&&REG_PLACES.home);
    if(!pl)return;
    for(let i=0;i<25;i++){const n=pick(pl)+' '+pick(MKT_SUFFIX);if(!used.has(n)){r.name=n;used.add(n);return;}}
  }
  function topUp(){
    if(!S.mkt||!Array.isArray(S.mkt.r))return;
    if(S.mkt.expanded102)return;                 /* once only */
    const big=Math.max(1,active().length/300);
    const used=new Set(S.mkt.r.map(r=>r.name));
    let added=0;
    for(let t=0;t<4;t++){
      const have=S.mkt.r.filter(r=>r.tier===t).length;
      for(let i=have;i<TARGET[t];i++){
        const r=mkRival(t,t===3?big:1);
        used.add(r.name);
        r.region=(typeof spawnRegion==='function')?spawnRegion():'home';
        nameNewFirm(r,used);
        if(typeof backfill==='function')backfill(r);   /* client history for the spark line */
        if(typeof relInit==='function')relInit(r);      /* stance / trust / personality */
        S.mkt.r.push(r);
        added++;
      }
    }
    S.mkt.expanded102=true;
    if(added&&typeof log==='function')log('The local market has filled out: '+added+' more MSPs are now trading in your patch.','info');
  }
  if(typeof migrateSave==='function'){const _m=migrateSave;migrateSave=function(){_m.apply(this,arguments);try{topUp();}catch(e){}};}
})();
