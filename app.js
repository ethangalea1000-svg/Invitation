const $=id=>document.getElementById(id);
const fields=["type","title","message","date","time","place","details","host","contact","rsvp","accent","textColor","font","compact","symbol","subtitle","image","askGuests","askNote","customQuestion"];
const typeNames={birthday:"ANNIVERSAIRE",party:"INVITATION",outing:"SORTIE",dinner:"DÎNER",custom:"INVITATION"};
let data={type:"birthday",title:"Mon anniversaire",message:"J’aimerais beaucoup que tu sois là pour partager ce moment avec moi !",date:"",time:"14:30",place:"",details:"",host:"Ethan",contact:"",rsvp:true,theme:"midnight",accent:"#756ff5",textColor:"#ffffff",font:"classic",compact:false,symbol:"✦",subtitle:"",image:"",askGuests:false,askNote:false,customQuestion:""};

function read(){fields.forEach(k=>{const el=$(k);if(!el)return;data[k]=el.type==="checkbox"?el.checked:el.value});return data}
function fill(d){data={...data,...d};fields.forEach(k=>{const el=$(k);if(!el)return;if(el.type==="checkbox")el.checked=!!data[k];else el.value=data[k]??""});document.querySelectorAll(".theme").forEach(x=>x.classList.toggle("active",x.dataset.theme===data.theme));render()}
function render(){
 read();
 $("pType").textContent=typeNames[data.type]||"INVITATION";
 $("pTitle").textContent=data.title||"Votre événement";$("pMessage").textContent=data.message||"";
 $("pDate").textContent=data.date?new Date(data.date+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"}):"—";
 $("pTime").textContent=data.time||"—";$("pPlace").textContent=data.place||"—";$("pDetails").textContent=data.details||"";
 $("pHost").textContent=data.host||"";$("pContact").textContent=data.contact||"";
 $("pSubtitle").textContent=data.subtitle||"";$("pSymbol").textContent=(data.symbol||"✦")+"　·　✧　·　"+(data.symbol||"✦");
 $("rsvpBox").style.display=data.rsvp?"block":"none";
 const inv=$("invitation");inv.className="invitation theme-"+data.theme+" font-"+data.font+(data.compact?" compact":"");inv.style.setProperty("--accent",data.accent||"#756ff5");
 inv.style.color=data.textColor||"";
 $("pImage").style.display=data.image?"block":"none";$("pImage").style.backgroundImage=data.image?"url("+JSON.stringify(data.image)+")":"none";
 $("guestCountWrap").style.display=data.askGuests?"block":"none";$("guestNoteWrap").style.display=data.askNote?"block":"none";$("guestCustomWrap").style.display=data.customQuestion?"block":"none";$("guestCustom").placeholder=data.customQuestion||"";
}
fields.forEach(k=>$(k)?.addEventListener("input",render));
document.querySelectorAll(".theme").forEach(b=>b.onclick=()=>{data.theme=b.dataset.theme;document.querySelectorAll(".theme").forEach(x=>x.classList.remove("active"));b.classList.add("active");render()});
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".tab-panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("tab-"+b.dataset.tab).classList.add("active")});

function encoded(){return btoa(unescape(encodeURIComponent(JSON.stringify(read())))).replaceAll("+","-").replaceAll("/","_").replaceAll("=","")}
function decode(s){try{let x=s.replaceAll("-","+").replaceAll("_","/");x+="=".repeat((4-x.length%4)%4);return JSON.parse(decodeURIComponent(escape(atob(x))))}catch{return null}}
function makeUrl(){let u=new URL(location.href);u.search="";u.hash="invite="+encoded();return u.href}
function toast(t){$("toast").textContent=t;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2200)}
$("shareBtn").onclick=async()=>{read();let u=makeUrl();$("shareUrl").value=u;try{await navigator.clipboard.writeText(u);toast("Lien créé et copié")}catch{toast("Lien créé")}};
$("shareTop").onclick=()=>{read();$("shareUrl").value=makeUrl();$("shareUrl").scrollIntoView({behavior:"smooth",block:"center"});toast("Lien prêt à partager")};
$("copyBtn").onclick=async()=>{if(!$("shareUrl").value)$("shareUrl").value=makeUrl();try{await navigator.clipboard.writeText($("shareUrl").value);toast("Lien copié")}catch{toast("Sélectionne le lien pour le copier")}};
$("openBtn").onclick=()=>window.open(makeUrl(),"_blank");
$("saveBtn").onclick=()=>{read();let list=JSON.parse(localStorage.getItem("invitations")||"[]");data.id=Date.now();list.unshift({...data});localStorage.setItem("invitations",JSON.stringify(list.slice(0,50)));toast("Invitation enregistrée")};
$("resetBtn").onclick=()=>fill({type:"birthday",title:"Mon anniversaire",message:"J’aimerais beaucoup que tu sois là pour partager ce moment avec moi !",date:"",time:"14:30",place:"",details:"",host:"Ethan",contact:"",rsvp:true,theme:"midnight",accent:"#756ff5",textColor:"#ffffff",font:"classic",compact:false,symbol:"✦",subtitle:"",image:"",askGuests:false,askNote:false,customQuestion:""});
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function showSaved(){let list=JSON.parse(localStorage.getItem("invitations")||"[]");$("savedList").innerHTML=list.length?list.map((x,i)=>'<div class="saved"><div><strong>'+esc(x.title||"Sans titre")+'</strong><small>'+esc(x.date||"Sans date")+'</small></div><button class="ghost small" data-load="'+i+'">Ouvrir</button></div>').join(""):"<p style='color:#999'>Aucune création enregistrée.</p>";document.querySelectorAll("[data-load]").forEach(b=>b.onclick=()=>{fill(list[+b.dataset.load]);$("modal").classList.add("hidden")})}
$("loadBtn").onclick=()=>{$("modal").classList.remove("hidden");showSaved()};$("closeModal").onclick=()=>$("modal").classList.add("hidden");

let responseAnswer="";let hash=location.hash.match(/^#invite=(.+)$/);let shared=hash&&decode(hash[1]);
if(shared){
 fill(shared);$("shareUrl").value=location.href;document.body.classList.add("guest-mode");
 document.querySelector(".editor").style.display="none";document.querySelector(".preview-area").style.position="static";document.querySelector(".preview-area").style.maxWidth="520px";document.querySelector(".preview-area").style.margin="40px auto";document.querySelector(".share-card").style.display="none";
 $("openBtn").style.display="none";$("loadBtn").style.display="none";$("shareTop").textContent="Créer ma propre invitation";$("shareTop").onclick=()=>{location.href=location.pathname};document.querySelector(".topbar").style.justifyContent="center";
}else render();

document.querySelectorAll(".rsvp-buttons button").forEach(b=>b.onclick=()=>{
 if(!data.rsvp)return;responseAnswer=b.dataset.answer;$("responseTitle").textContent=responseAnswer==="yes"?"Je viens":"Je ne peux pas";$("responseModal").classList.remove("hidden");$("guestName").focus();
});
$("closeResponse").onclick=()=>$("responseModal").classList.add("hidden");
function responseText(){let parts=[data.title||"Invitation",responseAnswer==="yes"?"Je viens":"Je ne peux pas","Nom : "+($("guestName").value||"Non indiqué")];if(data.askGuests)parts.push("Personnes : "+$("guestCount").value);if(data.askNote&&$("guestNote").value)parts.push("Message : "+$("guestNote").value);if(data.customQuestion&&$("guestCustom").value)parts.push(data.customQuestion+" : "+$("guestCustom").value);return parts.join("\n")}
$("copyResponse").onclick=async()=>{let t=responseText();try{await navigator.clipboard.writeText(t);toast("Réponse copiée")}catch{toast("Impossible de copier automatiquement")}};
$("sendResponse").onclick=()=>{let t=responseText();if(data.contact&&data.contact.includes("@")){location.href="mailto:"+encodeURIComponent(data.contact.trim())+"?subject="+encodeURIComponent("Réponse à l’invitation — "+(data.title||"Invitation"))+"&body="+encodeURIComponent(t)}else{navigator.clipboard?.writeText(t);toast(data.contact?"Réponse préparée et copiée":"Réponse copiée : partage-la à l’organisateur");$("responseModal").classList.add("hidden")}};
