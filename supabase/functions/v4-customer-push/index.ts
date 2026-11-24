import webpush from "npm:web-push@3.6.7";
const base=Deno.env.get("SUPABASE_URL")!,key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const langs=["fr","it","en","es","de","pt"];
const db=async(path:string,method="GET",body?:unknown,prefer?:string)=>{const r=await fetch(base+"/rest/v1/"+path,{method,headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",...(prefer?{Prefer:prefer}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(8000)});if(!r.ok)throw new Error("database "+r.status);return r.status===204?null:await r.json().catch(()=>null)};
const rpc=(name:string,body:unknown)=>db("rpc/"+name,"POST",body);
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
function endpointOK(s:unknown){if(typeof s!=="string"||s.length>2048)return false;try{const u=new URL(s);return u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&!u.hash&&(["fcm.googleapis.com","updates.push.services.mozilla.com","web.push.apple.com"].includes(u.hostname)||u.hostname.endsWith(".push.apple.com")||/^wns[0-9a-z-]*\.notify\.windows\.com$/.test(u.hostname))}catch{return false}}
async function keypair(){let k=await rpc("v4_customer_keypair",{});if(!k.publicKey){const newKeys=webpush.generateVAPIDKeys();k=await rpc("v4_customer_keypair",{p_pub:newKeys.publicKey,p_priv:newKeys.privateKey})}if(!k.publicKey||!k.privateKey)throw Error("key unavailable");return k}
async function hash(s:string){return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s))),x=>x.toString(16).padStart(2,"0")).join("")}
Deno.serve(async req=>{try{
if(req.method!=="POST")return json({error:"method"},405);
const b=await req.json();
if(b.action==="run"){
 if(!await rpc("v4_customer_cron_auth",{p_token:req.headers.get("x-cron-token")||""}))return json({error:"unauthorized"},401);
 const jobs=await rpc("v4_customer_claim_due",{});if(!jobs.length)return json({accepted:0,failed:0});
 const keys=await keypair();let accepted=0,failed=0;
 for(let i=0;i<jobs.length;i+=5)await Promise.all(jobs.slice(i,i+5).map(async (j:any)=>{let status="failed";try{const row=(await db("v4_customer_push?select=revoked_at&limit=1&id=eq."+j.subscription_id))[0];if(row&&row.revoked_at===null&&endpointOK(j.endpoint)){await webpush.sendNotification({endpoint:j.endpoint,keys:{p256dh:j.p256dh,auth:j.auth_key}},JSON.stringify({title:j.title,body:j.body,kind:"daily"}),{TTL:900,timeout:7000,vapidDetails:{subject:"mailto:viniciusleone99@gmail.com",publicKey:keys.publicKey,privateKey:keys.privateKey}});status="accepted"}}catch(e:any){if([404,410].includes(e?.statusCode))await db("v4_customer_push?id=eq."+j.subscription_id,"PATCH",{revoked_at:new Date().toISOString()},"return=minimal").catch(()=>{})}await db("v4_customer_push_attempts?subscription_id=eq."+j.subscription_id+"&local_day=eq."+j.local_day,"PATCH",{status},"return=minimal");if(status==="accepted")accepted++;else failed++}));
 return json({accepted,failed})
}
if(b.action==="key"){const k=await keypair();return json({publicKey:k.publicKey})}
if(!endpointOK(b.endpoint)||typeof b.token!=="string"||!/^[a-f0-9]{64}$/.test(b.token))return json({error:"invalid_device"},400);
const revoke_hash=await hash(b.token),filter="endpoint=eq."+encodeURIComponent(b.endpoint);
const old=(await db("v4_customer_push?select=id,revoke_hash,revoked_at&"+filter))[0];
if(old&&old.revoke_hash!==revoke_hash)return json({error:"device_conflict"},409);
if(b.action==="revoke"){if(old)await db("v4_customer_push?"+filter+"&revoke_hash=eq."+revoke_hash,"PATCH",{revoked_at:new Date().toISOString()},"return=minimal");return json({ok:true})}
if(b.action!=="subscribe"||b.consent!==true||!langs.includes(b.language)||typeof b.timezone!=="string"||!(/^[A-Za-z0-9_-]{87}$/).test(b.p256dh)||!(/^[A-Za-z0-9_-]{22}$/).test(b.auth))return json({error:"invalid_consent"},400);
let timezone:string;try{timezone=new Intl.DateTimeFormat("en",{timeZone:b.timezone}).resolvedOptions().timeZone}catch{return json({error:"invalid_timezone"},400)}
const row={endpoint:b.endpoint,p256dh:b.p256dh,auth_key:b.auth,revoke_hash,language:b.language,timezone,updated_at:new Date().toISOString(),revoked_at:null,...(!old||old.revoked_at?{consent_at:new Date().toISOString()}:{})};
if(old)await db("v4_customer_push?"+filter+"&revoke_hash=eq."+revoke_hash,"PATCH",row,"return=minimal");else await db("v4_customer_push","POST",row,"return=minimal");return json({ok:true})
}catch{return json({error:"service_unavailable"},503)}});
