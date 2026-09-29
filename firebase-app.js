import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getDatabase, ref, set, push, onValue, remove, get } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

const config=window.INVITATION_FIREBASE_CONFIG||{};
const enabled=!!(config.apiKey&&config.authDomain&&config.projectId&&config.appId&&config.databaseURL);
let auth=null,db=null;
if(enabled){const app=initializeApp(config);auth=getAuth(app);db=getDatabase(app);}

window.firebaseBridge={
 enabled,
 getUser:()=>auth?.currentUser||null,
 signup:(email,password)=>enabled?createUserWithEmailAndPassword(auth,email,password):Promise.reject(new Error("Firebase n’est pas configuré.")),
 login:(email,password)=>enabled?signInWithEmailAndPassword(auth,email,password):Promise.reject(new Error("Firebase n’est pas configuré.")),
 logout:()=>enabled?signOut(auth):Promise.resolve(),
 onAuth:(cb)=>enabled?onAuthStateChanged(auth,cb):cb(null),
 publish:async invitation=>{
   if(!enabled||!auth.currentUser)throw new Error("Connexion organisateur requise.");
   const clean={...invitation,ownerUid:auth.currentUser.uid,publishedAt:Date.now()};
   await set(ref(db,"invitations/"+invitation.inviteId),clean);
   await set(ref(db,"users/"+auth.currentUser.uid+"/invitations/"+invitation.inviteId),{title:invitation.title||"Invitation",publishedAt:clean.publishedAt});
   return clean;
 },
 submitResponse:async(inviteId,response)=>{
   if(!enabled||!inviteId)throw new Error("Firebase non disponible.");
   const id=push(ref(db,"invitations/"+inviteId+"/responses")).key;
   await set(ref(db,"invitations/"+inviteId+"/responses/"+id),{...response,createdAt:Date.now()});
   return id;
 },
 watchMine:(cb)=>{
   if(!enabled||!auth.currentUser)return()=>{};
   const uid=auth.currentUser.uid;
   return onValue(ref(db,"users/"+uid+"/invitations"),async snap=>{
     const index=snap.val()||{};
     const invitations=await Promise.all(Object.keys(index).map(async id=>{
       const s=await get(ref(db,"invitations/"+id));return s.exists()?s.val():null;
     }));
     cb(invitations.filter(Boolean));
   });
 },
 removeResponse:(inviteId,responseId)=>remove(ref(db,"invitations/"+inviteId+"/responses/"+responseId))
};