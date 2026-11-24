import webpush from 'web-push';
const langs=['fr','it','en','es','de','pt'];
const messages={fr:'Votre notification de test est arrivée.',it:'La notifica di prova è arrivata.',en:'Your test notification arrived.',es:'Tu notificación de prueba ha llegado.',de:'Deine Testbenachrichtigung ist angekommen.',pt:'Sua notificação de teste chegou.'};
function validEndpoint(s){try{const u=new URL(s);return s.length<=2048&&u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&!u.hash&&(['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com','wns2-par02p.notify.windows.com'].includes(u.hostname)||u.hostname.endsWith('.push.apple.com'))}catch{return false}}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(process.env.VERCEL_ENV!=='preview'||process.env.V4_ADMIN_ENABLED!=='true')return res.status(503).json({error:'Indisponível'});
 const base=process.env.V4_SUPABASE_URL,key=process.env.V4_SUPABASE_PUBLISHABLE_KEY,pub=process.env.V4_VAPID_PUBLIC,priv=process.env.V4_VAPID_PRIVATE;
 if(!base||!key||!pub||!priv)return res.status(503).json({error:'Push não configurado'});
 const token=(req.headers.authorization||'').match(/^Bearer ([\w.-]{1,8192})$/)?.[1];if(!token)return res.status(401).json({error:'Login necessário'});
 const headers={apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json'};
 const db=(path,opts={})=>fetch(base+'/rest/v1/'+path,{...opts,headers:{...headers,...opts.headers},signal:AbortSignal.timeout(8000)});
 try{
 const u=await fetch(base+'/auth/v1/user',{headers,signal:AbortSignal.timeout(8000)});if(!u.ok)return res.status(401).json({error:'Sessão inválida'});
 const user=await u.json(),owner='owner_id=eq.'+encodeURIComponent(user.id);
 const a=await db('v4_admins?select=user_id&active=eq.true&user_id=eq.'+encodeURIComponent(user.id));if(!a.ok||!(await a.json()).length)return res.status(403).json({error:'Sem permissão'});
 if(req.method==='GET'){const q=await db('v4_push_subscriptions?select=language&revoked_at=is.null&'+owner);if(!q.ok)return res.status(503).json({error:'Banco indisponível'});const rows=await q.json();return res.status(200).json({publicKey:pub,segments:Object.fromEntries(langs.map(l=>[l,rows.filter(r=>r.language===l).length]))})}
 if(req.method!=='POST')return res.status(405).json({error:'Método inválido'});
 const b=req.body||{},action=b.action,endpoint=b.endpoint,language=b.language;
 if(!validEndpoint(endpoint))return res.status(400).json({error:'Dispositivo inválido ou incompatível'});
 const filter=owner+'&endpoint=eq.'+encodeURIComponent(endpoint);
 if(action==='revoke'){const r=await db('v4_push_subscriptions?'+filter,{method:'DELETE'});return res.status(r.ok?200:503).json({ok:r.ok})}
 if(!langs.includes(language))return res.status(400).json({error:'Idioma inválido'});
 if(action==='subscribe'){let timezone=null;try{timezone=new Intl.DateTimeFormat('en',{timeZone:b.timezone}).resolvedOptions().timeZone}catch{};if(b.dailyConsent===true&&(!b.timezone||!timezone))return res.status(400).json({error:'Fuso horário inválido'});if(b.consent!==true||typeof b.p256dh!=='string'||typeof b.auth!=='string'||!/^[A-Za-z0-9_-]{87}$/.test(b.p256dh)||!/^[A-Za-z0-9_-]{22}$/.test(b.auth))return res.status(400).json({error:'Consentimento ou inscrição inválida'});
 const r=await db('v4_push_subscriptions?on_conflict=endpoint',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({owner_id:user.id,endpoint,p256dh:b.p256dh,auth_key:b.auth,language,consent_at:new Date().toISOString(),updated_at:new Date().toISOString(),revoked_at:null,daily_opt_in:b.dailyConsent===true,timezone,daily_consent_at:b.dailyConsent===true?new Date().toISOString():null})});return res.status(r.ok?200:503).json(r.ok?{ok:true}:{error:'Cadastro recusado pelo banco (HTTP '+r.status+')'})}
 if(action!=='test')return res.status(400).json({error:'Ação inválida'});
 const s=await db('v4_push_subscriptions?select=endpoint,p256dh,auth_key&revoked_at=is.null&language=eq.'+language+'&'+filter);if(!s.ok)return res.status(503).json({error:'Banco indisponível'});const row=(await s.json())[0];if(!row||!validEndpoint(row.endpoint))return res.status(404).json({error:'Ative este dispositivo no idioma selecionado'});
 const l=await db('v4_push_test_log',{method:'POST',body:JSON.stringify({owner_id:user.id,language})});if(!l.ok)return res.status(l.status===409?429:503).json({error:'Limite de teste ou registro indisponível'});
 try{await webpush.sendNotification({endpoint:row.endpoint,keys:{p256dh:row.p256dh,auth:row.auth_key}},JSON.stringify({title:'Tchat Love Club',body:messages[language]}),{TTL:60,timeout:8000,vapidDetails:{subject:'mailto:viniciusleone99@gmail.com',publicKey:pub,privateKey:priv}});return res.status(200).json({ok:true,accepted:true})}catch(e){if([404,410].includes(e.statusCode))await db('v4_push_subscriptions?'+filter,{method:'DELETE'});return res.status(502).json({error:'Provedor não aceitou o envio; reinscreva o dispositivo se necessário'})}
 }catch{return res.status(503).json({error:'Serviço indisponível'})}
}
