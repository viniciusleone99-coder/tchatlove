// Preview-only administration API. No service-role key required.
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(process.env.VERCEL_ENV!=='preview'||process.env.V4_ADMIN_ENABLED!=='true')return res.status(503).json({error:'Administração desativada'});
 if(req.method!=='GET')return res.status(405).json({error:'Método não permitido'});
 const base=process.env.V4_SUPABASE_URL,key=process.env.V4_SUPABASE_PUBLISHABLE_KEY;
 if(!base||!key)return res.status(503).json({error:'Configuração indisponível'});
 const token=(req.headers.authorization||'').match(/^Bearer ([\w.-]{1,8192})$/)?.[1];
 if(!token)return res.status(401).json({error:'Autenticação necessária'});
 const headers={apikey:key,Authorization:'Bearer '+token};
 try{
 const u=await fetch(base+'/auth/v1/user',{headers,signal:AbortSignal.timeout(10000)});
 if(!u.ok)return res.status(401).json({error:'Sessão inválida'});
 const user=await u.json();
 const a=await fetch(base+'/rest/v1/v4_admins?select=user_id&active=eq.true&user_id=eq.'+encodeURIComponent(user.id),{headers,signal:AbortSignal.timeout(10000)});
 if(!a.ok)return res.status(503).json({error:'Permissão indisponível'});
 if(!(await a.json()).length)return res.status(403).json({error:'Administrador autorizado necessário'});
 const days=Number(req.query.days||7),lang=String(req.query.lang||'all');
 if(![7,30,90].includes(days)||!['all','fr','it','en','es','de','pt','unknown'].includes(lang))return res.status(400).json({error:'Filtro inválido'});
 const visit=await fetch(base+'/rest/v1/v4_admin_visits?on_conflict=day,user_id',{method:'POST',headers:{...headers,'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify({user_id:user.id}),signal:AbortSignal.timeout(10000)});
 const start=new Date();start.setUTCDate(start.getUTCDate()-days+1);
 const q=new URLSearchParams({select:'day,language,event_type,total',day:'gte.'+start.toISOString().slice(0,10),order:'day.asc',limit:'10000'});
 if(lang!=='all')q.set('language','eq.'+lang);
 const m=await fetch(base+'/rest/v1/v4_daily_metrics?'+q,{headers,signal:AbortSignal.timeout(10000)});
 if(!m.ok)return res.status(503).json({error:'Métricas indisponíveis'});
 const v=await fetch(base+'/rest/v1/v4_admin_visits?select=day&day=gte.'+start.toISOString().slice(0,10),{headers:{...headers,Prefer:'count=exact',Range:'0-0'},signal:AbortSignal.timeout(10000)});
 const count=v.ok?Number(v.headers.get('content-range')?.split('/')[1]):NaN;
 const analytics=await fetch(base+'/rest/v1/rpc/v4_device_summary',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({p_days:days,p_lang:lang}),signal:AbortSignal.timeout(10000)});return res.status(200).json({rows:await m.json(),collectionEnabled:true,analytics:analytics.ok?await analytics.json():null,adminDays:visit.ok&&Number.isFinite(count)?count:null});
 }catch{return res.status(503).json({error:'Serviço temporariamente indisponível'})}
}
