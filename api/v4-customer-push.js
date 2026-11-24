export default async function handler(req,res){
res.setHeader('Cache-Control','no-store');
if(process.env.VERCEL_ENV!=='preview'||process.env.V4_ADMIN_ENABLED!=='true')return res.status(503).json({error:'disabled'});
if(req.method!=='POST')return res.status(405).end();
if(req.headers['sec-fetch-site']&&req.headers['sec-fetch-site']!=='same-origin')return res.status(403).end();
const b=req.body||{};if(!['key','subscribe','revoke'].includes(b.action)||JSON.stringify(b).length>6000)return res.status(400).end();
try{const r=await fetch(process.env.V4_SUPABASE_URL+'/functions/v1/v4-customer-push',{method:'POST',headers:{'Content-Type':'application/json',apikey:process.env.V4_SUPABASE_PUBLISHABLE_KEY},body:JSON.stringify(b),signal:AbortSignal.timeout(12000)});const data=await r.json();return res.status(r.status).json(data)}catch{return res.status(503).json({error:'unavailable'})}
}