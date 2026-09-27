#!/usr/bin/env bash
# Build Tier One: concatenate the source fragments (in order) into a single self-contained index.html
set -e
cd "$(dirname "$0")"
cat src/a.html src/b.js src/c.js src/g.js src/i.js src/d.js src/e.js src/h.js src/j.js src/k.js src/l.js src/m.js src/n.js src/o.js src/p.js src/q.js src/r.js src/s.js src/t.js src/u.js src/v.js src/w.js src/x.js src/y.js src/z.js src/zz.js src/zc.js src/zd.js src/ze.js src/zf.js src/zg.js src/zh.js src/zi.js src/zj.js src/zk.js src/zl.js src/zm.js src/zn.js src/zo.js src/zp.js src/zq.js src/zr.js src/zs.js src/zt.js src/zu.js src/zv.js src/zw.js src/zx.js src/zy.js src/zza.js src/zzb.js src/zzc.js src/zzd.js src/zze.js src/zzf.js src/zzg.js src/zzh.js src/zzi.js src/zzj.js src/zzk.js src/zzl.js src/zzm.js src/zzn.js src/zzo.js src/zzp.js src/zzq.js src/zzr.js src/zzs.js src/zzt.js src/zzu.js src/zzv.js src/zzw.js src/zzx.js src/f.js > index.html
# syntax check the bundled script
sed -n '/<script>/,/<\/script>/p' index.html | sed '1d;$d' > /tmp/tierone-check.js && node --check /tmp/tierone-check.js
echo "Built index.html ($(wc -c < index.html) bytes)"
