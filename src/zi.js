
/* ============ build 52: personal tax (income, dividends, capital gains) ============ */
/* UK owner-manager tax, simplified to current bands. The point is the tension: salary
   is taxed hardest (income tax + employee NI), dividends less, and a capital gain on
   exit least of all, thanks to Business Asset Disposal Relief at 10% on the first £1m.
   Building value for the sale beats stripping cash out along the way. */
const TAX={pa:12570,br:50270,hr:125140};
function incomeTaxNI(a){a=Math.max(0,a);let t=0,ti=Math.max(0,a-TAX.pa);
  t+=Math.min(ti,TAX.br-TAX.pa)*0.20;ti-=Math.min(ti,TAX.br-TAX.pa);
  if(ti>0){t+=Math.min(ti,TAX.hr-TAX.br)*0.40;ti-=Math.min(ti,TAX.hr-TAX.br);}
  if(ti>0)t+=ti*0.45;
  let ni=Math.min(Math.max(0,a-TAX.pa),TAX.br-TAX.pa)*0.08;if(a>TAX.br)ni+=(a-TAX.br)*0.02;
  return t+ni;}
function salaryNet(a){return Math.max(0,a-incomeTaxNI(a));}
/* marginal dividend tax, stacked on the salary and dividends already drawn this year */
function divTaxOn(gross){const f=founderSt();const sal=(f&&f.salary||0)*12;
  const prior=(S.co.divLog||[]).filter(x=>S.day-x.d<YEAR).reduce((a,x)=>a+x.v,0);
  const allow=Math.max(0,500-prior);let g=Math.max(0,gross-allow),pos=Math.max(sal,TAX.pa)+prior,tax=0;
  const seg=(top,r)=>{if(g<=0)return;const room=Math.max(0,top-pos);const amt=Math.min(g,room);tax+=amt*r;g-=amt;pos+=amt;};
  seg(TAX.br,0.0875);seg(TAX.hr,0.3375);seg(Infinity,0.3935);return tax;}
function divNet(g){return Math.max(0,g-divTaxOn(g));}
/* capital gains with Business Asset Disposal Relief: 10% to £1m lifetime, then 20% */
function cgtOn(gain){gain=Math.max(0,gain);const used=S.co.cgtUsed||0;const badr=Math.max(0,1e6-used);
  const a=Math.min(gain,badr);return a*0.10+(gain-a)*0.20;}
/* net a capital disposal and record the relief used */
function exitNet(p){p=Math.max(0,Math.round(p));const tax=Math.round(cgtOn(p));S.co.cgtUsed=(S.co.cgtUsed||0)+p;return {net:p-tax,cgt:tax,gross:p};}

/* teach the three-way tax tension on the Money tab */
if(typeof ownerSec==='function'){const _o=ownerSec;ownerSec=function(){
  const tip=(typeof tipBox==='function')?tipBox('tax','Three ways to pay yourself, taxed very differently. Salary is hit hardest, by income tax and National Insurance. Dividends are lighter but only come out of profit. Lightest of all is a capital gain when you sell or float: Business Asset Disposal Relief taxes the first million at just 10%. The figures below are what actually reaches your pocket, after tax.'):'';
  return tip+_o.apply(this,arguments);};}
