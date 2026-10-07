const $ = (s) => document.querySelector(s);
const messagesEl = $("#messages"), input = $("#input"), send = $("#send"), list = $("#chatList");
let chats = JSON.parse(localStorage.getItem("reporsity_chats") || "[]");
let activeId = localStorage.getItem("reporsity_active") || null;

function save(){localStorage.setItem("reporsity_chats",JSON.stringify(chats)); if(activeId)localStorage.setItem("reporsity_active",activeId);}
function current(){return chats.find(c=>c.id===activeId)}
function renderList(){
  list.innerHTML="";
  chats.forEach(c=>{const row=document.createElement("div");row.className="chat-item"+(c.id===activeId?" active":"");
    const name=document.createElement("span");name.className="chat-name";name.textContent=c.title||"New chat";
    const del=document.createElement("button");del.className="delete";del.textContent="×";del.title="Delete chat";
    del.onclick=(e)=>{e.stopPropagation();chats=chats.filter(x=>x.id!==c.id);if(activeId===c.id)activeId=chats[0]?.id||null;save();render();};
    row.onclick=()=>{activeId=c.id;save();render()};row.append(name,del);list.append(row);
  });
}
function bubble(role,text){
  const item=document.createElement("div");item.className="message "+role;
  const av=document.createElement("div");av.className="avatar";av.textContent=role==="user"?"You":"AI";
  const b=document.createElement("div");b.className="bubble";b.textContent=text;item.append(av,b);messagesEl.append(item);messagesEl.scrollTop=messagesEl.scrollHeight;return b;
}
function render(){
  messagesEl.innerHTML="";
  const c=current();
  if(!c){messagesEl.innerHTML='<div class="welcome"><h1>How can I help?</h1><p>Ask anything and I will explain the work instead of silently ignoring your request.</p></div>'}
  else c.messages.forEach(m=>bubble(m.role,m.content));
  renderList();
}
function newChat(){const c={id:crypto.randomUUID(),title:"New chat",messages:[]};chats.unshift(c);activeId=c.id;save();render();input.focus()}
$("#newChat").onclick=newChat;
$("#clearAll").onclick=()=>{if(confirm("Delete all saved chats?")){chats=[];activeId=null;save();render()}};
$("#composer").onsubmit=async(e)=>{
  e.preventDefault();const text=input.value.trim();if(!text)return;
  if(!current())newChat();const c=current();c.messages.push({role:"user",content:text});if(c.title==="New chat")c.title=text.slice(0,45);input.value="";render();send.disabled=true;
  const loading=bubble("assistant","Thinking…");
  try{
    const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:c.messages})});
    const data=await r.json();if(!r.ok)throw new Error(data.error||"Request failed");
    loading.textContent=data.text;c.messages.push({role:"assistant",content:data.text});save();render();
  }catch(err){loading.textContent="Sorry about that — I couldn't complete the request. "+err.message}
  finally{send.disabled=false;input.focus()}
};
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("#composer").requestSubmit()}});
fetch("/api/health").then(r=>r.json()).then(x=>$("#status").textContent=x.configured?"• API ready":"• API key missing").catch(()=>$("#status").textContent="• Offline");
render();
