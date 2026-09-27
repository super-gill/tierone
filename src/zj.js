
/* ============ build 55: in-game feedback button ============ */
/* A small "Feedback" control that opens the claude.ai comment composer anchored to
   itself, so anyone playing the published game can leave notes that land in the
   artifact's comment threads. Uses the composer-only `comments` capability, which
   keeps the game publicly shareable and asks for no consent. Absent in the local
   harness (no window.claude) — the button simply stays hidden there. */
(function(){
  function make(){
    if(document.getElementById('fbBtn'))return;
    var btn=document.createElement('button');
    btn.id='fbBtn';btn.type='button';btn.textContent='Feedback';
    btn.setAttribute('aria-label','Send feedback about the game');
    btn.style.cssText='position:fixed;right:14px;bottom:14px;z-index:9000;display:none;'+
      'font:600 12px/1 ui-sans-serif,system-ui,sans-serif;padding:8px 12px;border-radius:999px;'+
      'border:1px solid rgba(0,0,0,.12);background:var(--p,#2f6feb);color:#fff;cursor:pointer;'+
      'box-shadow:0 2px 8px rgba(0,0,0,.18);opacity:.9';
    btn.onmouseenter=function(){btn.style.opacity='1';};
    btn.onmouseleave=function(){btn.style.opacity='.9';};
    var ns=null,dead=false;
    btn.addEventListener('click',function(){
      if(dead||!ns)return;
      try{
        var r=ns.openComposer({element:btn});
        if(r&&r.then)r.then(function(res){/* res.opened false = soft refusal, nothing to do */},
          function(e){var code=e&&e.code;if(code==='unavailable'||code==='forbidden'||code==='not_granted'||code==='capability_disabled'||code==='capability_removed'){dead=true;btn.style.display='none';}});
      }catch(e){}
    });
    document.body.appendChild(btn);
    // resolve the capability after load; show the button only if this view can comment
    try{
      if(window.claude&&typeof claude.use==='function'){
        claude.use('comments').then(function(c){if(c){ns=c;btn.style.display='block';}},function(){});
      }
    }catch(e){}
  }
  if(document.body)make();
  else document.addEventListener('DOMContentLoaded',make);
})();
