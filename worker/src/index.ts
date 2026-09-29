export interface Env { DB: D1Database; }
const CORS={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type,X-Organizer-Token","Access-Control-Allow-Methods":"GET,POST,DELETE,OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json",...CORS}});
const sha=async(s:string)=>{const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")};
const id=()=>crypto.randomUUID();
const clean=(x:any)=>{const keys=["inviteId","type","title","message","date","time","place","details","host","contact","rsvp","theme","accent","textColor","font","compact","symbol","subtitle","image","askGuests","askNote","customQuestion"];const o:any={};for(const k of keys)if(k in x)o[k]=x[k];o.title=String(o.title||"Invitation").slice(0,80);o.message=String(o.message||"").slice(0,600);return o};
const token=(r:Request)=>r.headers.get("X-Organizer-Token")||new URL(r.url).searchParams.get("token")||"";
export default {async fetch(request:Request,env:Env){
 if(request.method==="OPTIONS")return new Response(null,{headers:CORS});
 try{
  const url=new URL(request.url);
  if(request.method==="POST"&&url.pathname==="/api/invitations"){
   const b:any=await request.json(); if(!b.token||!b.invitation?.inviteId)return json({error:"Code organisateur ou identifiant manquant."},400);
   const h=await sha(b.token),d=clean(b.invitation),now=Date.now();
   await env.DB.prepare("INSERT INTO invitations(invite_id,owner_token_hash,data_json,created_at,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(invite_id) DO UPDATE SET owner_token_hash=excluded.owner_token_hash,data_json=excluded.data_json,updated_at=excluded.updated_at").bind(d.inviteId,h,JSON.stringify(d),now,now).run();
   return json({ok:true,inviteId:d.inviteId});
  }
  const responseMatch=url.pathname.match(/^\/api\/invitations\/([^/]+)\/responses$/);
  if(request.method==="POST"&&responseMatch){
   const inviteId=decodeURIComponent(responseMatch[1]),b:any=await request.json();
   if(!["yes","no"].includes(b.answer)||!String(b.name||"").trim())return json({error:"Nom et réponse requis."},400);
   const exists=await env.DB.prepare("SELECT invite_id FROM invitations WHERE invite_id=?").bind(inviteId).first(); if(!exists)return json({error:"Invitation introuvable."},404);
   const rid=id(); await env.DB.prepare("INSERT INTO responses(id,invite_id,answer,name,count,note,custom,created_at) VALUES(?,?,?,?,?,?,?,?)").bind(rid,inviteId,b.answer,String(b.name).slice(0,60),Math.max(1,Math.min(20,Number(b.count)||1)),String(b.note||"").slice(0,300),String(b.custom||"").slice(0,160),Date.now()).run();
   return json({ok:true,id:rid});
  }
  if(request.method==="GET"&&url.pathname==="/api/invitations"){
   const t=token(request); if(!t)return json({error:"Code organisateur requis."},401); const h=await sha(t);
   const rows:any=await env.DB.prepare("SELECT * FROM invitations WHERE owner_token_hash=? ORDER BY updated_at DESC").bind(h).all(); const invitations:any[]=[];
   for(const r of rows.results as any[]){const d=JSON.parse(r.data_json);const rs:any=await env.DB.prepare("SELECT id,answer,name,count,note,custom,created_at as createdAt FROM responses WHERE invite_id=? ORDER BY created_at DESC").bind(r.invite_id).all();invitations.push({...d,responses:rs.results});}
   return json({invitations});
  }
  const deleteMatch=url.pathname.match(/^\/api\/invitations\/([^/]+)$/);
  if(request.method==="DELETE"&&deleteMatch){
   const t=token(request);if(!t)return json({error:"Code organisateur requis."},401);const inviteId=decodeURIComponent(deleteMatch[1]),h=await sha(t);
   const row:any=await env.DB.prepare("SELECT invite_id FROM invitations WHERE invite_id=? AND owner_token_hash=?").bind(inviteId,h).first();if(!row)return json({error:"Invitation introuvable ou code incorrect."},404);
   await env.DB.prepare("DELETE FROM responses WHERE invite_id=?").bind(inviteId).run();await env.DB.prepare("DELETE FROM invitations WHERE invite_id=? AND owner_token_hash=?").bind(inviteId,h).run();return json({ok:true});
  }
  return json({error:"Route inconnue."},404);
 }catch(e:any){return json({error:e?.message||"Erreur serveur."},500)}
}};
