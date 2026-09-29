const $=id=>document.getElementById(id);
const fields=["type","title","message","date","time","place","details","host","contact","rsvp"];
const typeNames={birthday:"ANNIVERSAIRE",party:"INVITATION",outing:"SORTIE",dinner:"DÎNER",custom:"INVITATION"};
let data={type:"birthday",title:"Mon anniversaire",message:"J’aimerais beaucoup que tu sois là pour partager ce moment avec moi !",date:"",time:"14:30",place:"",details:"",host:"Ethan",contact:"",rsvp:true,theme:"midnight"};

function read(){fields.forEach(k=>data[k]=$("rsvp")?.checked && k==="rsvp"?true:$(k).value);data.rsvp=$("rsvp").checked;return data}
function fill(d){data={...data,...d};fields.forEach(k=>{if($(k)){if(k==="rsvp")$(k).checked=!!data[k];else $(k).value=data[k]??""}});render()}
function render(){
read();
$("pType").textContent=typeNames[data.type]||"INVITATION";
$("pTitle").textContent=data.title||"Votre événement";
$("pMessage").textContent=data.message||"";
$("pDate").textContent=data.date?new Date(data.date+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"}):"—";
$("pTime").textContent=data.time||"—";$("pPlace").textContent=data.place||"—";$("pDetails").textContent=data.details||"";
$("pHost").textContent=data.host||"";
$("pContact").textContent=data.contact||"";
$("rsvpBox").style.display=data.rsvp?"block":"none";
$("invitation").className="invitation theme-"+data.theme;
}
fields.forEach(k=>$(k).addEventListener("input",render));
document.querySelectorAll(".theme").forEach(b=>b.onclick=()=>{data.theme=b.dataset.theme;document.querySelectorAll(".theme").forEach(x=>x.classList.remove("active"));b.classList.add("active");render()});
function encoded(){return btoa(unescape(encodeURIComponent(JSON.stringify({...read(),theme:data.theme})))).replaceAll("+","-").replaceAll("/","_").replaceAll("=","")}
function decode(s){try{return JSON.parse(decodeURIComponent(escape(atob(s.replaceAll("-","+").replaceAll("_","/")))))}catch{return null}}
function makeUrl(){let u=new URL(location.href);u.search="";u.hash="invite="+encoded();return u.href}
function toast(t){$("toast").textContent=t;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2200)}
$("shareBtn").onclick=async()=>{read();let u=makeUrl();$("shareUrl").value=u;try{await navigator.clipboard.writeText(u);toast("Lien créé et copié")}catch{toast("Lien créé")}};
$("shareTop").onclick=()=>{read();$("shareUrl").value=makeUrl();$("shareUrl").scrollIntoView({behavior:"smooth",block:"center"});toast("Lien prêt à partager")};
$("copyBtn").onclick=async()=>{if(!$("shareUrl").value)$("shareUrl").value=makeUrl();try{await navigator.clipboard.writeText($("shareUrl").value);toast("Lien copié")}catch{toast("Sélectionne le lien pour le copier")}};
$("openBtn").onclick=()=>window.open(makeUrl(),"_blank");
$("saveBtn").onclick=()=>{read();let list=JSON.parse(localStorage.getItem("invitations")||"[]");data.id=Date.now();list.unshift({...data});localStorage.setItem("invitations",JSON.stringify(list.slice(0,30)));toast("Invitation enregistrée")};
$("resetBtn").onclick=()=>fill({type:"birthday",title:"Mon anniversaire",message:"J’aimerais beaucoup que tu sois là pour partager ce moment avec moi !",date:"",time:"14:30",place:"",details:"",host:"Ethan",contact:"",rsvp:true,theme:"midnight"});
function showSaved(){let list=JSON.parse(localStorage.getItem("invitations")||"[]");$("savedList").innerHTML=list.length?list.map((x,i)=>'<div class="saved"><div><strong>'+esc(x.title||"Sans titre")+'</strong><small>'+esc(x.date||"Sans date")+'</small></div><button class="ghost small" data-load="'+i+'">Ouvrir</button></div>').join(""):"<p style='color:#999'>Aucune création enregistrée.</p>";document.querySelectorAll("[data-load]").forEach(b=>b.onclick=()=>{fill(list[+b.dataset.load]);$("modal").classList.add("hidden")})}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
$("loadBtn").onclick=()=>{$("modal").classList.remove("hidden");showSaved()};
$("closeModal").onclick=()=>$("modal").classList.add("hidden");
const hash=location.hash.match(/^#invite=(.+)$/);const shared=hash&&decode(hash[1]);if(shared){fill(shared);$("shareUrl").value=location.href}else{render()}
