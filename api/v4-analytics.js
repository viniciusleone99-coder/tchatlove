export default async function handler(req,res){
res.setHeader('Cache-Control','no-store');
if(process.env.VERCEL_ENV!=='preview'||process.env.V4_ADMIN_ENABLED!=='true')return res.status(503).json({error:'disabled'});
if(req.method!=='POST')return res.status(405).end();
if(req.headers['sec-fetch-site']&&req.headers['sec-fetch-site']!=='same-origin')return res.status(403).end();
const b=req.body||{},uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
if(b.consent!==true||!uuid.test(b.device)||!uuid.test(b.session)||b.device===b.session||!['fr','it','en','es','de','pt','unknown'].includes(b.language))return res.status(400).end();
const base=process.env.V4_SUPABASE_URL,key=process.env.V4_SUPABASE_PUBLISHABLE_KEY;
if(!base||!key)return res.status(503).end();
try{const r=await fetch(base+'/rest/v1/v4_device_sessions',{method:'POST',headers:{apikey:key,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({device_id:b.device,session_id:b.session,language:b.language}),signal:AbortSignal.timeout(7000)});return res.status(r.ok||r.status===409?204:503).end()}catch{return res.status(503).end()}
}