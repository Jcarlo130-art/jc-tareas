import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

// ── FIREBASE ─────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyD35L7qlQyf6vCE343H5dMzLnte1aLtcZA",
  authDomain: "jc-tareas.firebaseapp.com",
  projectId: "jc-tareas",
  storageBucket: "jc-tareas.firebasestorage.app",
  messagingSenderId: "598613169106",
  appId: "1:598613169106:web:b9af19288ad606f76b6e0b"
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// ── STORAGE LOCAL (cache) ─────────────────────────────────
const LS = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};

async function fbGet(key, def) {
  try {
    const snap = await getDoc(doc(db, "jc", key));
    if (snap.exists() && snap.data().value) return snap.data().value;
  } catch(e) { console.warn("fbGet error", key, e); }
  return def;
}
async function fbSet(key, value) {
  try { await setDoc(doc(db, "jc", key), { value }); } catch(e) { console.warn("fbSet error", key, e); }
}

// ── CONSTANTS ────────────────────────────────────────────
const TRABAJOS = [
  { id: "ecatepec", label: "CINETOP Ecatepec" },
  { id: "azcapotzalco", label: "CINETOP Azcapotzalco" },
  { id: "aguascalientes", label: "CINETOP Aguascalientes" },
  { id: "tequisquiapan", label: "CINETOP Tequisquiapan" },
  { id: "director", label: "Encargos Director" },
];
const DEFAULT_MATERIAS = [
  { id: "lya", label: "Lenguajes y Autómatas", color: "#378ADD" },
  { id: "sp", label: "Sistemas Programables", color: "#E24B4A" },
  { id: "bd", label: "Administración BD", color: "#639922" },
  { id: "graf", label: "Graficación", color: "#EF9F27" },
  { id: "redes", label: "Administración de Redes", color: "#7F77DD" },
];
const PRIOS = [
  { id: "alta", label: "Alta", color: "#ff003c", bg: "rgba(255,0,60,0.12)", text: "#ff003c" },
  { id: "media", label: "Media", color: "#EF9F27", bg: "rgba(239,159,39,0.12)", text: "#EF9F27" },
  { id: "baja", label: "Baja", color: "#1D9E75", bg: "rgba(29,158,117,0.12)", text: "#1D9E75" },
];
const CATS = [
  { id: "trabajo", label: "Trabajo", icon: "🎬", color: "rgb(208,0,112)", bg: "rgba(208,0,112,0.12)", text: "rgb(208,0,112)" },
  { id: "escuela", label: "Escuela", icon: "📚", color: "#378ADD", bg: "rgba(55,138,221,0.12)", text: "#378ADD" },
  { id: "personal", label: "Personal", icon: "🏠", color: "#00e5ff", bg: "rgba(0,229,255,0.08)", text: "#00e5ff" },
];
const DAYS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const DAY_FULL = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const HOURS = Array.from({length:24},(_,i)=>i);
const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const fmt24 = h => String(h).padStart(2,"0")+":00";
const todayStr = () => new Date().toISOString().slice(0,10);
const daysUntil = d => { if(!d) return null; return Math.ceil((new Date(d)-new Date(todayStr()))/86400000); };
const PRESET_COLORS = ["rgb(208,0,112)","#ff003c","#378ADD","#7F77DD","#1D9E75","#EF9F27","#00e5ff","#639922","#888780","#ffffff","#E24B4A","#D4537E"];
const FRASES = [
  "El éxito es la suma de pequeños esfuerzos repetidos cada día.",
  "No cuentes los días, haz que los días cuenten.",
  "La disciplina es el puente entre metas y logros.",
  "Cada tarea completada es un paso hacia tu mejor versión.",
  "El trabajo duro hoy es el éxito de mañana.",
  "Enfócate en el progreso, no en la perfección.",
  "Tú decides qué tan lejos llegas.",
];
const DEFAULT_BLOCKS = [
  {id:1,day:0,start:7,end:8,label:"Traslado",color:"#888780",salon:""},
  {id:2,day:0,start:9,end:11,label:"Administración BD",color:"#639922",salon:"Q203"},
  {id:3,day:0,start:14,end:22,label:"Trabajo",color:"rgb(208,0,112)",salon:""},
  {id:4,day:1,start:7,end:9,label:"Lenguajes y Autómatas",color:"#378ADD",salon:"Q203"},
  {id:5,day:1,start:9,end:11,label:"Graficación",color:"#EF9F27",salon:"Q203"},
  {id:6,day:1,start:11,end:13,label:"Adm. de Redes",color:"#7F77DD",salon:"2S3"},
  {id:7,day:1,start:14,end:22,label:"Trabajo",color:"rgb(208,0,112)",salon:""},
  {id:8,day:2,start:7,end:8,label:"GYM",color:"#00e5ff",salon:""},
  {id:9,day:2,start:9,end:11,label:"Administración BD",color:"#639922",salon:"Q203"},
  {id:10,day:2,start:13,end:15,label:"Sistemas Programables",color:"#E24B4A",salon:"Q203"},
  {id:11,day:3,start:7,end:9,label:"Sistemas Programables",color:"#E24B4A",salon:"Q203"},
  {id:12,day:3,start:9,end:11,label:"Graficación",color:"#EF9F27",salon:"Q203"},
  {id:13,day:3,start:15,end:22,label:"Trabajo",color:"rgb(208,0,112)",salon:""},
  {id:14,day:4,start:8,end:10,label:"Lenguajes y Autómatas",color:"#378ADD",salon:"Q203"},
  {id:15,day:4,start:9,end:11,label:"Administración BD",color:"#639922",salon:"Q203"},
  {id:16,day:4,start:11,end:13,label:"Lenguajes y Autómatas",color:"#378ADD",salon:"Q203"},
  {id:17,day:4,start:14,end:22,label:"Trabajo",color:"rgb(208,0,112)",salon:""},
  {id:18,day:5,start:14,end:22,label:"Trabajo",color:"rgb(208,0,112)",salon:""},
];

// ── THEME ────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg:"#0a0a0f",surface:"rgba(255,255,255,0.03)",border:"rgba(255,255,255,0.08)",
    text:"#e8e6f0",textSub:"rgba(255,255,255,0.45)",textMuted:"rgba(255,255,255,0.22)",
    input:"rgba(255,255,255,0.06)",inputBorder:"rgba(255,255,255,0.12)",
    sidebar:"rgba(255,255,255,0.02)",card:"rgba(255,255,255,0.03)",
    accent:"rgb(208,0,112)",accentGlow:"rgba(208,0,112,0.25)",
  },
  light: {
    bg:"#f4f1f8",surface:"rgba(255,255,255,0.85)",border:"rgba(208,0,112,0.15)",
    text:"#1a0a14",textSub:"rgba(0,0,0,0.5)",textMuted:"rgba(0,0,0,0.3)",
    input:"rgba(255,255,255,0.9)",inputBorder:"rgba(208,0,112,0.25)",
    sidebar:"rgba(255,255,255,0.7)",card:"rgba(255,255,255,0.8)",
    accent:"rgb(208,0,112)",accentGlow:"rgba(208,0,112,0.15)",
  }
};

function GlobalStyle({theme}) {
  const t=THEMES[theme];
  return <style>{`
    *{box-sizing:border-box;margin:0;padding:0;}
    body{background:${t.bg};color:${t.text};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden;transition:background .3s,color .3s;}
    ::-webkit-scrollbar{width:4px;height:4px;}
    ::-webkit-scrollbar-thumb{background:rgba(208,0,112,0.3);border-radius:4px;}
    input,select,textarea{background:${t.input};border:1px solid ${t.inputBorder};border-radius:8px;color:${t.text};padding:7px 10px;outline:none;font-family:inherit;transition:border .2s;}
    input:focus,select:focus,textarea:focus{border-color:rgba(208,0,112,0.6);box-shadow:0 0 0 2px rgba(208,0,112,0.1);}
    button{font-family:inherit;cursor:pointer;}
    select option{background:${theme==="dark"?"#1a1a2e":"#fff"};color:${t.text};}
    @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
    .fade-in{animation:fadeIn 0.2s ease;}
  `}</style>;
}

function Badge({color,bg,text,children}) {
  return <span style={{background:bg||"rgba(255,255,255,0.08)",color:text||color||"#fff",border:`1px solid ${color}44`,fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:99,whiteSpace:"nowrap"}}>{children}</span>;
}
function DeadlineBadge({date}) {
  if(!date) return null;
  const d=daysUntil(date);
  const fmt=new Date(date+"T00:00:00").toLocaleDateString("es-MX",{day:"2-digit",month:"short"});
  const u=d<0?{c:"#ff003c",label:`⚠ ${fmt}`}:d===0?{c:"#ff003c",label:`Hoy · ${fmt}`}:d<=1?{c:"#EF9F27",label:`Mañana · ${fmt}`}:d<=3?{c:"#EF9F27",label:`${d}d · ${fmt}`}:{c:"#888",label:fmt};
  return <Badge color={u.c} bg={`${u.c}18`} text={u.c}>{u.label}</Badge>;
}

function Clock({theme}) {
  const t=THEMES[theme];
  const [time,setTime]=useState(new Date());
  useEffect(()=>{const i=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(i);},[]);
  const h=String(time.getHours()).padStart(2,"0");
  const m=String(time.getMinutes()).padStart(2,"0");
  const s=String(time.getSeconds()).padStart(2,"0");
  const day=DAY_FULL[time.getDay()===0?6:time.getDay()-1];
  return (
    <div style={{textAlign:"center",padding:"14px 0 10px"}}>
      <div style={{fontSize:30,fontWeight:700,letterSpacing:2,color:t.accent,fontVariantNumeric:"tabular-nums"}}>
        {h}<span style={{animation:"pulse 1s infinite",display:"inline-block"}}>:</span>{m}
        <span style={{fontSize:18,color:t.textMuted,marginLeft:3}}>:{s}</span>
      </div>
      <div style={{fontSize:11,color:t.textSub,marginTop:2}}>{day}</div>
      <div style={{fontSize:10,color:t.textMuted}}>{time.getDate()} {MONTH_NAMES[time.getMonth()]} {time.getFullYear()}</div>
    </div>
  );
}

function Bookmarks({theme}) {
  const t=THEMES[theme];
  const [bms,setBms]=useState(()=>LS.get("jc_bookmarks",[
    {id:1,label:"Sistema Cine",url:"https://google.com",color:"rgb(208,0,112)"},
    {id:2,label:"Página Web",url:"https://google.com",color:"#378ADD"},
    {id:3,label:"Admin Web",url:"https://google.com",color:"#7F77DD"},
  ]));
  const [adding,setAdding]=useState(false);
  const [nl,setNl]=useState(""); const [nu,setNu]=useState(""); const [nc,setNc]=useState("rgb(208,0,112)");
  useEffect(()=>LS.set("jc_bookmarks",bms),[bms]);
  const add=()=>{if(!nl.trim()||!nu.trim())return;setBms(b=>[...b,{id:Date.now(),label:nl.trim(),url:nu.trim().startsWith("http")?nu.trim():"https://"+nu.trim(),color:nc}]);setNl("");setNu("");setAdding(false);};
  const del=id=>setBms(b=>b.filter(x=>x.id!==id));
  return (
    <div>
      <div style={{fontSize:10,fontWeight:700,color:t.textMuted,letterSpacing:1.5,marginBottom:8,textTransform:"uppercase"}}>🔖 Marcadores</div>
      <div style={{display:"flex",flexDirection:"column",gap:4}}>
        {bms.map(b=>(
          <div key={b.id} style={{display:"flex",alignItems:"center",gap:5}}>
            <a href={b.url} target="_blank" rel="noreferrer" style={{flex:1,display:"flex",alignItems:"center",gap:7,padding:"7px 9px",background:t.card,border:`1px solid ${b.color}40`,borderLeft:`3px solid ${b.color}`,borderRadius:8,textDecoration:"none",color:t.text,fontSize:12,transition:"all .15s"}}
              onMouseEnter={e=>e.currentTarget.style.background=`${b.color}18`}
              onMouseLeave={e=>e.currentTarget.style.background=t.card}>
              <span style={{width:7,height:7,borderRadius:"50%",background:b.color,flexShrink:0,boxShadow:`0 0 5px ${b.color}`}}/>
              <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.label}</span>
              <span style={{fontSize:9,color:t.textMuted}}>↗</span>
            </a>
            <button onClick={()=>del(b.id)} style={{background:"none",border:"none",color:t.textMuted,fontSize:13,padding:"4px"}}>×</button>
          </div>
        ))}
      </div>
      {adding?(
        <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:5}}>
          <input value={nl} onChange={e=>setNl(e.target.value)} placeholder="Nombre" style={{fontSize:12}}/>
          <input value={nu} onChange={e=>setNu(e.target.value)} placeholder="https://..." style={{fontSize:12}}/>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {["rgb(208,0,112)","#378ADD","#7F77DD","#1D9E75","#EF9F27","#00e5ff"].map(c=>(
              <div key={c} onClick={()=>setNc(c)} style={{width:16,height:16,borderRadius:"50%",background:c,cursor:"pointer",border:nc===c?"2px solid #fff":"2px solid transparent",flexShrink:0}}/>
            ))}
          </div>
          <div style={{display:"flex",gap:5}}>
            <button onClick={()=>setAdding(false)} style={{flex:1,padding:"5px",fontSize:11,background:t.surface,border:`1px solid ${t.border}`,borderRadius:6,color:t.text}}>Cancelar</button>
            <button onClick={add} style={{flex:1,padding:"5px",fontSize:11,background:"rgb(208,0,112)",border:"none",borderRadius:6,color:"#fff",fontWeight:600}}>Agregar</button>
          </div>
        </div>
      ):(
        <button onClick={()=>setAdding(true)} style={{width:"100%",marginTop:6,padding:"6px",fontSize:11,background:"transparent",border:`1px dashed ${t.border}`,borderRadius:8,color:t.textMuted}}>+ Marcador</button>
      )}
    </div>
  );
}

function QuickNotes({theme}) {
  const t=THEMES[theme];
  const [notes,setNotes]=useState(()=>LS.get("jc_qnotes",""));
  useEffect(()=>LS.set("jc_qnotes",notes),[notes]);
  return (
    <div>
      <div style={{fontSize:10,fontWeight:700,color:t.textMuted,letterSpacing:1.5,marginBottom:6,textTransform:"uppercase"}}>📝 Notas rápidas</div>
      <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Escribe aquí..." rows={4}
        style={{width:"100%",resize:"none",fontSize:12,lineHeight:1.6}}/>
    </div>
  );
}

function Sidebar({tab,setTab,theme,isMobile}) {
  const t=THEMES[theme];
  const [avatar,setAvatar]=useState(()=>LS.get("jc_avatar",null));
  const [name,setName]=useState(()=>LS.get("jc_name","Jean Carlo"));
  const [editName,setEditName]=useState(false);
  const [frase]=useState(()=>FRASES[new Date().getDay()%FRASES.length]);
  const fileRef=useRef();
  useEffect(()=>LS.set("jc_avatar",avatar),[avatar]);
  useEffect(()=>LS.set("jc_name",name),[name]);
  const onFile=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setAvatar(ev.target.result);r.readAsDataURL(f);};
  const TABS=[{id:"tareas",icon:"✓",label:"Tareas"},{id:"calendario",icon:"📅",label:"Calendario"},{id:"horario",icon:"🗓",label:"Horario"},{id:"notas",icon:"📝",label:"Notas"},{id:"materias",icon:"🎨",label:"Materias"},{id:"config",icon:"⚙",label:"Config"}];

  if(isMobile) return (
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:50,background:theme==="dark"?"rgba(10,10,20,0.97)":"rgba(244,241,248,0.97)",backdropFilter:"blur(12px)",borderTop:`1px solid ${t.border}`,display:"flex",padding:"6px 0 10px"}}>
      {TABS.map(tb=>(
        <button key={tb.id} onClick={()=>setTab(tb.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:1,background:"none",border:"none",color:tab===tb.id?t.accent:t.textMuted,fontSize:8,fontWeight:tab===tb.id?700:400,padding:"4px 0"}}>
          <span style={{fontSize:17}}>{tb.icon}</span>{tb.label}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{width:200,flexShrink:0,height:"100vh",background:t.sidebar,borderRight:`1px solid ${t.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"18px 14px 12px",borderBottom:`1px solid ${t.border}`}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:10}}>
          <div onClick={()=>fileRef.current.click()} style={{width:70,height:70,borderRadius:"50%",background:`${t.accent}20`,border:`2px solid ${t.accent}`,cursor:"pointer",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>
            {avatar?<img src={avatar} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="avatar"/>:"👤"}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{display:"none"}}/>
        </div>
        {editName
          ?<input value={name} onChange={e=>setName(e.target.value)} onBlur={()=>setEditName(false)} onKeyDown={e=>e.key==="Enter"&&setEditName(false)} autoFocus style={{width:"100%",textAlign:"center",fontSize:13,fontWeight:600,background:"transparent",border:"none",borderBottom:`1px solid ${t.accent}`,borderRadius:0,color:t.text,padding:"2px 0"}}/>
          :<div onClick={()=>setEditName(true)} style={{textAlign:"center",fontSize:13,fontWeight:600,color:t.text,cursor:"pointer",marginBottom:6}}>{name} ✏</div>
        }
        <div style={{fontSize:10,color:t.textSub,textAlign:"center",lineHeight:1.5,fontStyle:"italic",padding:"0 4px"}}>"{frase}"</div>
      </div>
      <nav style={{padding:"8px",flex:1,overflowY:"auto"}}>
        {TABS.map(tb=>(
          <button key={tb.id} onClick={()=>setTab(tb.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"8px 10px",marginBottom:2,background:tab===tb.id?`${t.accent}18`:"transparent",border:tab===tb.id?`1px solid ${t.accent}35`:"1px solid transparent",borderRadius:9,color:tab===tb.id?t.accent:t.textSub,fontSize:13,fontWeight:tab===tb.id?600:400,transition:"all .15s",textAlign:"left"}}>
            <span style={{fontSize:15}}>{tb.icon}</span>{tb.label}
          </button>
        ))}
      </nav>
      <div style={{padding:"10px",borderTop:`1px solid ${t.border}`}}>
        <QuickNotes theme={theme}/>
      </div>
    </div>
  );
}

function RightPanel({theme,show,onToggle}) {
  const t=THEMES[theme];
  return (
    <>
      <button onClick={onToggle} style={{position:"fixed",right:show?218:8,top:16,zIndex:40,width:28,height:28,borderRadius:"50%",background:t.accent,border:"none",color:"#fff",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 10px ${t.accentGlow}`,transition:"right .3s"}}>
        {show?"›":"‹"}
      </button>
      <div style={{width:show?210:0,flexShrink:0,height:"100vh",background:t.sidebar,borderLeft:show?`1px solid ${t.border}`:"none",display:"flex",flexDirection:"column",overflow:"hidden",transition:"width .3s"}}>
        {show&&<>
          <div style={{padding:"10px 14px",borderBottom:`1px solid ${t.border}`}}><Clock theme={theme}/></div>
          <div style={{padding:"12px 14px",flex:1,overflowY:"auto"}}><Bookmarks theme={theme}/></div>
        </>}
      </div>
    </>
  );
}

function requestNotifPermission(){if("Notification" in window&&Notification.permission==="default")Notification.requestPermission();}
function sendNotif(title,body){if("Notification" in window&&Notification.permission==="granted"&&!LS.get("jc_dnd",false))new Notification(title,{body});}

function TaskCard({task,onToggle,onDelete,onEdit,onAddSub,onToggleSub,onDeleteSub,materias,theme}) {
  const t=THEMES[theme];
  const [exp,setExp]=useState(false);
  const [subIn,setSubIn]=useState("");
  const cat=CATS.find(c=>c.id===task.cat);
  const prio=PRIOS.find(p=>p.id===task.prio);
  const materia=materias.find(m=>m.id===task.materia);
  const trabajo=TRABAJOS.find(w=>w.id===task.subtrabajo);
  const done=task.subs.filter(s=>s.done).length;
  const total=task.subs.length;
  const pct=total>0?Math.round(done/total*100):null;
  const accent=materia?.color||cat?.color||t.accent;
  const addSub=()=>{if(subIn.trim()){onAddSub(task.id,subIn.trim());setSubIn("");}};
  return (
    <div className="fade-in" style={{background:t.card,border:`1px solid ${accent}33`,borderLeft:`3px solid ${accent}`,borderRadius:10,padding:"10px 12px",marginBottom:7,opacity:task.done?0.5:1,boxShadow:task.prio==="alta"?`0 0 14px ${accent}22`:"none"}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:9}}>
        <div onClick={()=>onToggle(task.id)} style={{width:16,height:16,borderRadius:4,border:`2px solid ${accent}`,background:task.done?accent:"transparent",cursor:"pointer",flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center"}}>
          {task.done&&<span style={{fontSize:10,color:"#fff",fontWeight:700}}>✓</span>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:4,marginBottom:4}}>
            <span style={{fontSize:13,fontWeight:500,color:t.text,textDecoration:task.done?"line-through":"none",opacity:task.done?0.5:1}}>{task.title}</span>
            {cat&&<Badge color={cat.color} bg={cat.bg} text={cat.text}>{cat.icon} {cat.label}</Badge>}
            {trabajo&&<Badge color="rgb(208,0,112)" bg="rgba(208,0,112,0.1)" text="rgb(208,0,112)">{trabajo.label}</Badge>}
            {materia&&<Badge color={materia.color} bg={`${materia.color}18`} text={materia.color}>{materia.label}</Badge>}
            {prio&&<Badge color={prio.color} bg={prio.bg} text={prio.text}>{prio.label}</Badge>}
            <DeadlineBadge date={task.deadline}/>
          </div>
          {task.notes&&<p style={{fontSize:11,color:t.textSub,margin:"0 0 5px",lineHeight:1.5}}>{task.notes}</p>}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {total>0&&<span style={{fontSize:10,color:t.textMuted}}>{done}/{total} · {pct}%</span>}
            <button onClick={()=>setExp(e=>!e)} style={{background:"none",border:"none",padding:0,fontSize:10,color:t.textMuted}}>{exp?"▲ ocultar":"▼ subtareas"}</button>
          </div>
          {exp&&(
            <div style={{marginTop:7,paddingTop:7,borderTop:`1px solid ${t.border}`}}>
              {task.subs.map(s=>(
                <div key={s.id} style={{display:"flex",alignItems:"center",gap:7,padding:"3px 0"}}>
                  <div onClick={()=>onToggleSub(task.id,s.id)} style={{width:13,height:13,borderRadius:3,border:`1.5px solid ${accent}`,background:s.done?accent:"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {s.done&&<span style={{fontSize:8,color:"#fff",fontWeight:700}}>✓</span>}
                  </div>
                  <span style={{fontSize:11,flex:1,color:s.done?t.textMuted:t.textSub,textDecoration:s.done?"line-through":"none"}}>{s.text}</span>
                  <button onClick={()=>onDeleteSub(task.id,s.id)} style={{background:"none",border:"none",color:t.textMuted,fontSize:12}}>×</button>
                </div>
              ))}
              <div style={{display:"flex",gap:5,marginTop:5}}>
                <input value={subIn} onChange={e=>setSubIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addSub()} placeholder="Nueva subtarea..." style={{flex:1,fontSize:11,padding:"4px 7px"}}/>
                <button onClick={addSub} style={{padding:"4px 9px",fontSize:11,background:t.surface,border:`1px solid ${t.border}`,borderRadius:6,color:t.text}}>+</button>
              </div>
            </div>
          )}
        </div>
        <div style={{display:"flex",gap:3,flexShrink:0}}>
          <button onClick={()=>onEdit(task)} style={{background:"none",border:"none",color:t.textMuted,fontSize:13,padding:"2px 4px"}}>✏</button>
          <button onClick={()=>onDelete(task.id)} style={{background:"none",border:"none",color:t.textMuted,fontSize:14,padding:"2px 4px"}}>×</button>
        </div>
      </div>
      {total>0&&<div style={{marginTop:7,height:2,background:t.border,borderRadius:9}}><div style={{height:"100%",width:pct+"%",background:accent,borderRadius:9,transition:"width .4s"}}/></div>}
    </div>
  );
}

function TaskForm({initial,onSave,onCancel,materias,theme}) {
  const t=THEMES[theme];
  const [title,setTitle]=useState(initial?.title||"");
  const [cat,setCat]=useState(initial?.cat||"escuela");
  const [prio,setPrio]=useState(initial?.prio||"media");
  const [deadline,setDeadline]=useState(initial?.deadline||"");
  const [notes,setNotes]=useState(initial?.notes||"");
  const [subtrabajo,setSubtrabajo]=useState(initial?.subtrabajo||"ecatepec");
  const [materia,setMateria]=useState(initial?.materia||"");
  const [reminderDays,setReminderDays]=useState(initial?.reminderDays||"none");
  const [reminderHour,setReminderHour]=useState(initial?.reminderHour||"08:00");
  const save=()=>{
    if(!title.trim()) return;
    onSave({title:title.trim(),cat,prio,deadline,notes,subtrabajo:cat==="trabajo"?subtrabajo:null,materia:cat==="escuela"?materia:null,reminderDays,reminderHour});
    if(reminderDays!=="none"&&deadline){const d=daysUntil(deadline);const rd=reminderDays==="same"?0:parseInt(reminderDays);if(d<=rd)sendNotif(`🔔 ${title.trim()}`,`Vence en ${d} día(s)`);}
  };
  const catObj=CATS.find(c=>c.id===cat);
  return (
    <div className="fade-in" style={{background:t.card,border:`1px solid ${catObj?.color||t.border}44`,borderRadius:12,padding:"14px",marginBottom:14}}>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Nombre de la tarea..." style={{width:"100%",fontSize:13,fontWeight:500,marginBottom:10,background:"transparent",border:"none",borderBottom:`1px solid ${t.border}`,borderRadius:0,padding:"4px 0",color:t.text}} onKeyDown={e=>e.key==="Enter"&&save()} autoFocus/>
      <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:9}}>
        <select value={cat} onChange={e=>setCat(e.target.value)} style={{fontSize:12,flex:1,minWidth:90}}>{CATS.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select>
        <select value={prio} onChange={e=>setPrio(e.target.value)} style={{fontSize:12,flex:1,minWidth:90}}>{PRIOS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select>
        <input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} style={{fontSize:12,flex:1,minWidth:110}}/>
      </div>
      {cat==="trabajo"&&<select value={subtrabajo} onChange={e=>setSubtrabajo(e.target.value)} style={{width:"100%",fontSize:12,marginBottom:9}}>{TRABAJOS.map(w=><option key={w.id} value={w.id}>{w.label}</option>)}</select>}
      {cat==="escuela"&&<select value={materia} onChange={e=>setMateria(e.target.value)} style={{width:"100%",fontSize:12,marginBottom:9}}><option value="">— Sin materia —</option>{materias.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}</select>}
      <div style={{display:"flex",gap:7,marginBottom:9,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:11,color:t.textSub,whiteSpace:"nowrap"}}>🔔 Recordatorio</span>
        <select value={reminderDays} onChange={e=>setReminderDays(e.target.value)} style={{fontSize:12,flex:1,minWidth:120}}>
          <option value="none">Sin recordatorio</option>
          <option value="7">7 días antes</option>
          <option value="5">5 días antes</option>
          <option value="3">3 días antes</option>
          <option value="2">2 días antes</option>
          <option value="1">1 día antes</option>
          <option value="same">El mismo día</option>
        </select>
        {reminderDays!=="none"&&<input type="time" value={reminderHour} onChange={e=>setReminderHour(e.target.value)} style={{fontSize:12,width:90}}/>}
      </div>
      <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notas..." rows={2} style={{width:"100%",fontSize:12,resize:"vertical",marginBottom:10}}/>
      <div style={{display:"flex",gap:7,justifyContent:"flex-end"}}>
        <button onClick={onCancel} style={{fontSize:12,padding:"6px 13px",background:t.surface,border:`1px solid ${t.border}`,borderRadius:7,color:t.textSub}}>Cancelar</button>
        <button onClick={save} style={{fontSize:12,padding:"6px 14px",background:"rgb(208,0,112)",border:"none",borderRadius:7,color:"#fff",fontWeight:600}}>{initial?"Guardar":"Agregar"}</button>
      </div>
    </div>
  );
}

function TareasTab({tasks,setTasks,materias,theme}) {
  const t=THEMES[theme];
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("all");
  const [subFilter,setSubFilter]=useState("all");
  const [sortBy,setSortBy]=useState("fecha");
  const [showDone,setShowDone]=useState(false);
  const [addOpen,setAddOpen]=useState(false);
  const [editTask,setEditTask]=useState(null);
  const [dnd,setDnd]=useState(()=>LS.get("jc_dnd",false));
  useEffect(()=>LS.set("jc_dnd",dnd),[dnd]);
  const addTask=d=>{setTasks(ts=>[{...d,done:false,subs:[],id:Date.now()},...ts]);setAddOpen(false);};
  const saveEdit=d=>{setTasks(ts=>ts.map(t=>t.id===editTask.id?{...t,...d}:t));setEditTask(null);};
  const toggleTask=id=>setTasks(ts=>ts.map(t=>t.id===id?{...t,done:!t.done}:t));
  const deleteTask=id=>setTasks(ts=>ts.filter(t=>t.id!==id));
  const addSub=(tid,text)=>setTasks(ts=>ts.map(t=>t.id===tid?{...t,subs:[...t.subs,{id:Date.now(),text,done:false}]}:t));
  const toggleSub=(tid,sid)=>setTasks(ts=>ts.map(t=>t.id===tid?{...t,subs:t.subs.map(s=>s.id===sid?{...s,done:!s.done}:s)}:t));
  const deleteSub=(tid,sid)=>setTasks(ts=>ts.map(t=>t.id===tid?{...t,subs:t.subs.filter(s=>s.id!==sid)}:t));
  const pending=tasks.filter(t=>!t.done).length;
  const urgent=tasks.filter(t=>!t.done&&t.prio==="alta").length;
  const byDue=tasks.filter(t=>!t.done&&t.deadline&&daysUntil(t.deadline)<=3).length;
  const FILTERS=[{id:"all",label:"Todas",count:pending,color:t.accent},{id:"urgente",label:"Urgentes",count:urgent,color:"#ff003c"},...CATS.map(c=>({id:c.id,label:c.label,icon:c.icon,color:c.color,count:tasks.filter(x=>!x.done&&x.cat===c.id).length}))];
  const getSubFilters=()=>{
    if(filter==="trabajo") return [{id:"all",label:"Todos"},...TRABAJOS.map(w=>({id:w.id,label:w.label,color:"rgb(208,0,112)"}))];
    if(filter==="escuela") return [{id:"all",label:"Todas"},...materias.map(m=>({id:m.id,label:m.label,color:m.color}))];
    return [];
  };
  let visible=tasks.filter(x=>{
    if(!showDone&&x.done) return false;
    if(search&&!x.title.toLowerCase().includes(search.toLowerCase())&&!(x.notes||"").toLowerCase().includes(search.toLowerCase())) return false;
    if(filter==="urgente") return x.prio==="alta"&&!x.done;
    if(filter!=="all"&&x.cat!==filter) return false;
    if(subFilter!=="all"){if(filter==="trabajo"&&x.subtrabajo!==subFilter)return false;if(filter==="escuela"&&x.materia!==subFilter)return false;}
    return true;
  });
  visible=[...visible].sort((a,b)=>{
    if(sortBy==="prioridad"){const po={alta:0,media:1,baja:2};return(po[a.prio]||1)-(po[b.prio]||1);}
    if(sortBy==="fecha"){if(!a.deadline&&!b.deadline)return 0;if(!a.deadline)return 1;if(!b.deadline)return -1;return new Date(a.deadline)-new Date(b.deadline);}
    return 0;
  });
  const subFilters=getSubFilters();
  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{display:"flex",gap:8,marginBottom:12,flexShrink:0,flexWrap:"wrap"}}>
        {[{label:"Pendientes",val:pending,color:"rgb(208,0,112)"},{label:"Urgentes",val:urgent,color:"#ff003c"},{label:"Vencen 3d",val:byDue,color:"#EF9F27"}].map(m=>(
          <div key={m.label} style={{flex:1,minWidth:80,background:`${m.color}10`,border:`1px solid ${m.color}30`,borderRadius:10,padding:"8px 12px"}}>
            <div style={{fontSize:10,color:`${m.color}bb`,marginBottom:2}}>{m.label}</div>
            <div style={{fontSize:20,fontWeight:700,color:m.color}}>{m.val}</div>
          </div>
        ))}
        <div onClick={()=>setDnd(d=>!d)} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"6px 12px",background:dnd?"rgba(255,0,60,0.08)":t.surface,border:dnd?"1px solid rgba(255,0,60,0.3)":`1px solid ${t.border}`,borderRadius:10,cursor:"pointer",gap:2}}>
          <span style={{fontSize:15}}>{dnd?"🔕":"🔔"}</span>
          <span style={{fontSize:9,color:dnd?"#ff003c":t.textMuted,whiteSpace:"nowrap"}}>{dnd?"No molestar":"Notifs ON"}</span>
        </div>
      </div>
      <div style={{display:"flex",gap:7,marginBottom:9,flexShrink:0}}>
        <div style={{flex:1,position:"relative"}}>
          <span style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",fontSize:13,color:t.textMuted}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." style={{width:"100%",paddingLeft:28,fontSize:13}}/>
        </div>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{fontSize:12,padding:"7px 8px"}}>
          <option value="fecha">Fecha</option>
          <option value="prioridad">Prioridad</option>
        </select>
      </div>
      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6,flexShrink:0}}>
        {FILTERS.map(f=>{const active=filter===f.id;return <button key={f.id} onClick={()=>{setFilter(f.id);setSubFilter("all");}} style={{padding:"4px 10px",fontSize:11,borderRadius:99,border:active?`1px solid ${f.color}`:`1px solid ${t.border}`,background:active?`${f.color}20`:"transparent",color:active?f.color:t.textSub,fontWeight:active?700:400}}>{f.icon&&<span style={{marginRight:3}}>{f.icon}</span>}{f.label} <span style={{opacity:0.5}}>({f.count})</span></button>;})}
        <button onClick={()=>setShowDone(s=>!s)} style={{padding:"4px 10px",fontSize:11,borderRadius:99,border:showDone?"1px solid #1D9E75":`1px solid ${t.border}`,background:showDone?"rgba(29,158,117,0.15)":"transparent",color:showDone?"#1D9E75":t.textMuted,marginLeft:"auto"}}>✓ hechas</button>
      </div>
      {subFilters.length>1&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:9,flexShrink:0,paddingLeft:4}}>
        {subFilters.map(f=>{const active=subFilter===f.id;const col=f.color||t.accent;return <button key={f.id} onClick={()=>setSubFilter(f.id)} style={{padding:"3px 9px",fontSize:10,borderRadius:99,border:active?`1px solid ${col}`:`1px solid ${t.border}`,background:active?`${col}20`:"transparent",color:active?col:t.textMuted}}>{f.label}</button>;})}
      </div>}
      {editTask?<TaskForm initial={editTask} onSave={saveEdit} onCancel={()=>setEditTask(null)} materias={materias} theme={theme}/>
        :addOpen?<TaskForm onSave={addTask} onCancel={()=>setAddOpen(false)} materias={materias} theme={theme}/>
        :<button onClick={()=>{requestNotifPermission();setAddOpen(true);}} style={{width:"100%",padding:"9px 0",marginBottom:10,background:"transparent",border:"1px dashed rgba(208,0,112,0.35)",borderRadius:9,fontSize:13,color:"rgba(208,0,112,0.7)",fontWeight:500,flexShrink:0}}>+ Nueva tarea</button>}
      <div style={{flex:1,overflowY:"auto",paddingRight:2}}>
        {visible.length===0?<div style={{textAlign:"center",padding:"3rem 0",color:t.textMuted,fontSize:13}}>{tasks.length===0?"Agrega tu primera tarea ↑":"Sin resultados"}</div>
          :visible.map(x=><TaskCard key={x.id} task={x} onToggle={toggleTask} onDelete={deleteTask} onEdit={x=>{setAddOpen(false);setEditTask(x);}} onAddSub={addSub} onToggleSub={toggleSub} onDeleteSub={deleteSub} materias={materias} theme={theme}/>)}
      </div>
    </div>
  );
}

function CalendarioTab({tasks,theme}) {
  const t=THEMES[theme];
  const now=new Date();
  const [year,setYear]=useState(now.getFullYear());
  const [month,setMonth]=useState(now.getMonth());
  const [selected,setSelected]=useState(null);
  const DOW=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
  const firstDay=new Date(year,month,1);
  const lastDay=new Date(year,month+1,0);
  const startOffset=(firstDay.getDay()+6)%7;
  const rows=Math.ceil((startOffset+lastDay.getDate())/7);
  const todayISO=todayStr();
  const tasksByDate={};
  tasks.forEach(x=>{if(x.deadline&&!x.done){if(!tasksByDate[x.deadline])tasksByDate[x.deadline]=[];tasksByDate[x.deadline].push(x);}});
  const prevMonth=()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);setSelected(null);};
  const nextMonth=()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);setSelected(null);};
  const selectedISO=selected?`${year}-${String(month+1).padStart(2,"0")}-${String(selected).padStart(2,"0")}`:null;
  const selectedTasks=selectedISO?(tasksByDate[selectedISO]||[]):[];
  return (
    <div style={{height:"100%",overflowY:"auto"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <button onClick={prevMonth} style={{fontSize:20,background:"none",border:"none",color:t.textSub,padding:"4px 12px"}}>‹</button>
        <span style={{fontSize:15,fontWeight:700,color:t.text}}>{MONTH_NAMES[month]} {year}</span>
        <button onClick={nextMonth} style={{fontSize:20,background:"none",border:"none",color:t.textSub,padding:"4px 12px"}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
        {DOW.map(d=><div key={d} style={{textAlign:"center",fontSize:10,fontWeight:700,color:t.textMuted,padding:"3px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {Array.from({length:rows*7}).map((_,i)=>{
          const dayNum=i-startOffset+1;
          const valid=dayNum>=1&&dayNum<=lastDay.getDate();
          const iso=valid?`${year}-${String(month+1).padStart(2,"0")}-${String(dayNum).padStart(2,"0")}`:null;
          const isToday=iso===todayISO;
          const isSel=dayNum===selected&&valid;
          const dt=iso?(tasksByDate[iso]||[]):[];
          return <div key={i} onClick={()=>valid&&setSelected(isSel?null:dayNum)} style={{minHeight:42,borderRadius:8,padding:"3px",background:isSel?"rgba(208,0,112,0.18)":isToday?"rgba(208,0,112,0.07)":t.surface,border:isToday?"1.5px solid rgba(208,0,112,0.5)":isSel?"1px solid rgba(208,0,112,0.5)":`1px solid ${t.border}`,cursor:valid?"pointer":"default",opacity:valid?1:0}}>
            {valid&&<>
              <div style={{fontSize:11,fontWeight:isToday?700:400,color:isSel||isToday?"rgb(208,0,112)":t.textSub,textAlign:"center",marginBottom:2}}>{dayNum}</div>
              {dt.some(x=>x.prio==="alta")&&<div style={{width:5,height:5,borderRadius:"50%",background:"#ff003c",margin:"0 auto 2px"}}/>}
              <div style={{display:"flex",justifyContent:"center",gap:1}}>{dt.some(x=>x.cat==="trabajo")&&<span style={{fontSize:8}}>🎬</span>}{dt.some(x=>x.cat==="escuela")&&<span style={{fontSize:8}}>📚</span>}{dt.some(x=>x.cat==="personal")&&<span style={{fontSize:8}}>🏠</span>}</div>
            </>}
          </div>;
        })}
      </div>
      {selectedISO&&<div style={{marginTop:12,background:t.card,border:`1px solid ${t.border}`,borderRadius:10,padding:"11px"}}>
        <div style={{fontSize:12,fontWeight:600,color:t.textSub,marginBottom:7}}>{selected} de {MONTH_NAMES[month]}{selectedTasks.length===0&&" — sin tareas"}</div>
        {selectedTasks.map(x=>{const cat=CATS.find(c=>c.id===x.cat);const prio=PRIOS.find(p=>p.id===x.prio);return <div key={x.id} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 0",borderTop:`1px solid ${t.border}`}}><span style={{fontSize:13}}>{cat?.icon}</span><span style={{fontSize:12,flex:1,color:t.text}}>{x.title}</span>{prio&&<Badge color={prio.color} bg={prio.bg} text={prio.text}>{prio.label}</Badge>}</div>;})}
      </div>}
    </div>
  );
}

function HorarioTab({blocks,setBlocks,theme}) {
  const t=THEMES[theme];
  const [modal,setModal]=useState(null);
  const [now,setNow]=useState(new Date());
  const CELL=38,TIME_W=40,N=DAYS.length;
  useEffect(()=>{const i=setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(i);},[]);
  const saveBlock=data=>{if(modal.id)setBlocks(bs=>bs.map(b=>b.id===modal.id?{...b,...data}:b));else setBlocks(bs=>[...bs,{...data,id:Date.now()}]);setModal(null);};
  const delBlock=id=>{setBlocks(bs=>bs.filter(b=>b.id!==id));setModal(null);};
  const gridH=HOURS.length*CELL;
  const lineTop=((now.getHours()*60+now.getMinutes())/60)*CELL;
  const todayCol=(now.getDay()+6)%7;

  function BModal({block,onSave,onClose,onDelete}) {
    const [label,setLabel]=useState(block?.label||"");
    const [color,setColor]=useState(block?.color||"rgb(208,0,112)");
    const [day,setDay]=useState(block?.day??0);
    const [start,setStart]=useState(block?.start??8);
    const [end,setEnd]=useState(block?.end??9);
    const [salon,setSalon]=useState(block?.salon||"");
    const save=()=>{if(!label.trim()||end<=start)return;onSave({label:label.trim(),color,day,start,end,salon});};
    return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:theme==="dark"?"#131320":"#fff",border:`1px solid ${t.border}`,borderRadius:14,padding:"20px",width:300,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{fontWeight:600,fontSize:14,color:t.text,marginBottom:14}}>{block?.id?"Editar":"Nuevo bloque"}</div>
        <input value={label} onChange={e=>setLabel(e.target.value)} placeholder="Nombre" style={{width:"100%",fontSize:13,marginBottom:9,boxSizing:"border-box"}} autoFocus/>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
          {PRESET_COLORS.map(c=><div key={c} onClick={()=>setColor(c)} style={{width:22,height:22,borderRadius:4,background:c,cursor:"pointer",border:color===c?"2px solid #888":"2px solid transparent",boxSizing:"border-box"}}/>)}
        </div>
        <select value={day} onChange={e=>setDay(+e.target.value)} style={{width:"100%",fontSize:13,marginBottom:9}}>{DAY_FULL.map((d,i)=><option key={i} value={i}>{d}</option>)}</select>
        <div style={{display:"flex",gap:8,marginBottom:9}}>
          <div style={{flex:1}}><div style={{fontSize:11,color:t.textSub,marginBottom:3}}>Inicio</div><select value={start} onChange={e=>setStart(+e.target.value)} style={{width:"100%",fontSize:13}}>{HOURS.map(h=><option key={h} value={h}>{fmt24(h)}</option>)}</select></div>
          <div style={{flex:1}}><div style={{fontSize:11,color:t.textSub,marginBottom:3}}>Fin</div><select value={end} onChange={e=>setEnd(+e.target.value)} style={{width:"100%",fontSize:13}}>{HOURS.filter(h=>h>start).map(h=><option key={h} value={h}>{fmt24(h)}</option>)}</select></div>
        </div>
        <input value={salon} onChange={e=>setSalon(e.target.value)} placeholder="Salón (opcional)" style={{width:"100%",fontSize:13,marginBottom:14,boxSizing:"border-box"}}/>
        <div style={{display:"flex",gap:7,justifyContent:"space-between"}}>
          {block?.id&&<button onClick={()=>onDelete(block.id)} style={{fontSize:12,padding:"6px 11px",background:"rgba(255,0,60,0.12)",border:"1px solid rgba(255,0,60,0.3)",borderRadius:7,color:"#ff003c"}}>Eliminar</button>}
          <div style={{display:"flex",gap:7,marginLeft:"auto"}}>
            <button onClick={onClose} style={{fontSize:12,padding:"6px 12px",background:t.surface,border:`1px solid ${t.border}`,borderRadius:7,color:t.textSub}}>Cancelar</button>
            <button onClick={save} style={{fontSize:12,padding:"6px 14px",background:"rgb(208,0,112)",border:"none",borderRadius:7,color:"#fff",fontWeight:600}}>Guardar</button>
          </div>
        </div>
      </div>
    </div>;
  }

  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:12,color:t.textSub}}>Formato 24h</span>
          <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#ff003c"}}><span style={{width:10,height:2,background:"#ff003c",display:"inline-block",borderRadius:2}}/> Ahora</span>
        </div>
        <button onClick={()=>setModal({})} style={{fontSize:12,padding:"6px 13px",background:"rgb(208,0,112)",border:"none",borderRadius:8,color:"#fff",fontWeight:600}}>+ Bloque</button>
      </div>
      <div style={{flex:1,overflowX:"auto",overflowY:"auto"}}>
        <div style={{minWidth:500,position:"relative"}}>
          <div style={{display:"flex",marginLeft:TIME_W,position:"sticky",top:0,background:theme==="dark"?"#0a0a0f":"#f4f1f8",zIndex:10,borderBottom:`1px solid ${t.border}`}}>
            {DAYS.map((d,i)=><div key={i} style={{flex:1,textAlign:"center",fontSize:10,fontWeight:700,color:i===todayCol?"rgb(208,0,112)":t.textMuted,padding:"5px 0",borderLeft:`1px solid ${t.border}`,background:i===todayCol?"rgba(208,0,112,0.06)":"transparent"}}>{d}</div>)}
          </div>
          <div style={{position:"relative",height:gridH}}>
            {HOURS.map((h,hi)=>(
              <div key={h} style={{position:"absolute",top:hi*CELL,left:0,right:0,display:"flex",height:CELL,borderTop:`1px solid ${t.border}`}}>
                <div style={{width:TIME_W,flexShrink:0,fontSize:9,color:t.textMuted,paddingRight:5,textAlign:"right",paddingTop:2}}>{fmt24(h)}</div>
                {DAYS.map((_,di)=><div key={di} style={{flex:1,borderLeft:`1px solid ${t.border}`,background:di===todayCol?"rgba(208,0,112,0.02)":"transparent"}}/>)}
              </div>
            ))}
            <div style={{position:"absolute",top:lineTop,left:TIME_W,right:0,height:2,background:"#ff003c",zIndex:5,boxShadow:"0 0 6px #ff003c",pointerEvents:"none"}}>
              <div style={{position:"absolute",left:-6,top:-4,width:10,height:10,borderRadius:"50%",background:"#ff003c"}}/>
              <div style={{position:"absolute",left:4,top:-8,fontSize:9,color:"#ff003c",fontWeight:700,background:theme==="dark"?"rgba(10,10,20,0.9)":"rgba(244,241,248,0.9)",padding:"1px 4px",borderRadius:3}}>
                {String(now.getHours()).padStart(2,"0")}:{String(now.getMinutes()).padStart(2,"0")}
              </div>
            </div>
            {blocks.map(b=>{
              const colW=`calc((100% - ${TIME_W}px) / ${N})`;
              return <div key={b.id} onClick={()=>setModal(b)} style={{position:"absolute",top:b.start*CELL,left:`calc(${TIME_W}px + ${b.day} * ${colW})`,width:`calc(${colW} - 2px)`,height:(b.end-b.start)*CELL-2,background:b.color,borderRadius:5,padding:"3px 4px",cursor:"pointer",overflow:"hidden",boxSizing:"border-box",zIndex:2,boxShadow:`0 0 8px ${b.color}55`}}>
                <div style={{fontSize:9,fontWeight:600,color:"#fff",lineHeight:1.3,wordBreak:"break-word"}}>{b.label}</div>
                {b.salon&&<div style={{fontSize:8,color:"rgba(255,255,255,0.75)"}}>{b.salon}</div>}
              </div>;
            })}
          </div>
        </div>
      </div>
      {modal!==null&&<BModal block={modal} onSave={saveBlock} onClose={()=>setModal(null)} onDelete={delBlock}/>}
    </div>
  );
}

function NotasTab({theme}) {
  const t=THEMES[theme];
  const [notes,setNotes]=useState(()=>LS.get("jc_daily_notes",{}));
  const [selDate,setSelDate]=useState(todayStr());
  useEffect(()=>LS.set("jc_daily_notes",notes),[notes]);
  const dates=Object.keys(notes).sort((a,b)=>b.localeCompare(a));
  const setNote=(date,val)=>setNotes(n=>({...n,[date]:val}));
  const delNote=date=>setNotes(n=>{const c={...n};delete c[date];return c;});
  return (
    <div style={{height:"100%",display:"flex",gap:14,overflow:"hidden"}}>
      <div style={{width:150,flexShrink:0,display:"flex",flexDirection:"column"}}>
        <div style={{fontSize:10,fontWeight:700,color:t.textMuted,letterSpacing:1.5,marginBottom:8,textTransform:"uppercase"}}>Fechas</div>
        <button onClick={()=>setSelDate(todayStr())} style={{padding:"7px 10px",marginBottom:7,background:"rgba(208,0,112,0.15)",border:"1px solid rgba(208,0,112,0.35)",borderRadius:8,color:"rgb(208,0,112)",fontSize:12,fontWeight:600,textAlign:"left"}}>+ Hoy</button>
        <div style={{overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:3}}>
          {dates.map(d=>(
            <div key={d} style={{display:"flex",alignItems:"center",gap:3}}>
              <button onClick={()=>setSelDate(d)} style={{flex:1,padding:"5px 8px",background:selDate===d?t.surface:"transparent",border:selDate===d?`1px solid ${t.border}`:"1px solid transparent",borderRadius:7,color:selDate===d?t.text:t.textMuted,fontSize:11,textAlign:"left"}}>{d}</button>
              <button onClick={()=>delNote(d)} style={{background:"none",border:"none",color:"rgba(255,0,60,0.4)",fontSize:12,padding:"2px"}}>×</button>
            </div>
          ))}
        </div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
        <div style={{fontSize:12,fontWeight:600,color:t.textSub}}>{selDate}</div>
        <textarea value={notes[selDate]||""} onChange={e=>setNote(selDate,e.target.value)} placeholder="Escribe tus notas del día..." style={{flex:1,resize:"none",fontSize:13,lineHeight:1.7,background:t.surface,border:`1px solid ${t.border}`,borderRadius:10,padding:"12px",color:t.text}}/>
      </div>
    </div>
  );
}

function MateriasTab({materias,setMaterias,theme}) {
  const t=THEMES[theme];
  const [label,setLabel]=useState("");
  const [color,setColor]=useState("#378ADD");
  const add=()=>{if(!label.trim())return;setMaterias(ms=>[...ms,{id:Date.now().toString(),label:label.trim(),color}]);setLabel("");setColor("#378ADD");};
  const del=id=>setMaterias(ms=>ms.filter(m=>m.id!==id));
  const upColor=(id,c)=>setMaterias(ms=>ms.map(m=>m.id===id?{...m,color:c}:m));
  return (
    <div style={{height:"100%",overflowY:"auto"}}>
      {materias.map(m=>(
        <div key={m.id} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 12px",background:t.card,border:`1px solid ${m.color}33`,borderRadius:9,marginBottom:7,borderLeft:`3px solid ${m.color}`}}>
          <input type="color" value={m.color} onChange={e=>upColor(m.id,e.target.value)} style={{width:26,height:22,border:"none",cursor:"pointer",padding:0,background:"none",flexShrink:0}}/>
          <span style={{flex:1,fontSize:13,color:t.text}}>{m.label}</span>
          <button onClick={()=>del(m.id)} style={{background:"none",border:"none",color:t.textMuted,fontSize:15}}>×</button>
        </div>
      ))}
      <div style={{display:"flex",gap:7,marginTop:12,alignItems:"center"}}>
        <input type="color" value={color} onChange={e=>setColor(e.target.value)} style={{width:32,height:32,border:"none",cursor:"pointer",padding:0,background:"none",flexShrink:0}}/>
        <input value={label} onChange={e=>setLabel(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Nueva materia..." style={{flex:1,fontSize:13}}/>
        <button onClick={add} style={{padding:"7px 15px",fontSize:13,background:"rgb(208,0,112)",border:"none",borderRadius:8,color:"#fff",fontWeight:600}}>Agregar</button>
      </div>
    </div>
  );
}

function ConfigTab({theme,setTheme,bg,setBg}) {
  const t=THEMES[theme];
  const fileRef=useRef();
  const onFile=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setBg(ev.target.result);r.readAsDataURL(f);};
  return (
    <div style={{height:"100%",overflowY:"auto"}}>
      <div style={{fontSize:13,fontWeight:700,color:t.text,marginBottom:18}}>⚙ Configuración</div>
      <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:12,padding:"16px",marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:t.textSub,marginBottom:12}}>Tema</div>
        <div style={{display:"flex",gap:10}}>
          {["dark","light"].map(th=>(
            <div key={th} onClick={()=>setTheme(th)} style={{flex:1,padding:"14px",borderRadius:10,border:theme===th?"2px solid rgb(208,0,112)":`1px solid ${t.border}`,background:th==="dark"?"#0a0a0f":"#f4f1f8",cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:22,marginBottom:6}}>{th==="dark"?"🌙":"☀️"}</div>
              <div style={{fontSize:12,fontWeight:600,color:th==="dark"?"#e8e6f0":"#1a0a14"}}>{th==="dark"?"Oscuro":"Claro"}</div>
              {theme===th&&<div style={{marginTop:6,fontSize:10,color:"rgb(208,0,112)",fontWeight:700}}>✓ Activo</div>}
            </div>
          ))}
        </div>
      </div>
      <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:12,padding:"16px",marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:t.textSub,marginBottom:10}}>Imagen de fondo</div>
        {bg&&<div style={{marginBottom:10,borderRadius:8,overflow:"hidden",height:80,position:"relative"}}>
          <img src={bg} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="fondo"/>
          <button onClick={()=>setBg(null)} style={{position:"absolute",top:5,right:5,background:"rgba(255,0,60,0.8)",border:"none",borderRadius:4,color:"#fff",fontSize:11,padding:"3px 7px"}}>Quitar</button>
        </div>}
        <button onClick={()=>fileRef.current.click()} style={{width:"100%",padding:"10px",background:"transparent",border:"1px dashed rgba(208,0,112,0.4)",borderRadius:8,color:"rgb(208,0,112)",fontSize:12}}>
          {bg?"🖼 Cambiar imagen":"🖼 Seleccionar imagen de fondo"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{display:"none"}}/>
      </div>
      <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:12,padding:"16px"}}>
        <div style={{fontSize:12,fontWeight:600,color:t.textSub,marginBottom:10}}>Notificaciones</div>
        <button onClick={requestNotifPermission} style={{width:"100%",padding:"9px",background:"rgba(208,0,112,0.15)",border:"1px solid rgba(208,0,112,0.3)",borderRadius:8,color:"rgb(208,0,112)",fontSize:12,fontWeight:600}}>
          🔔 Activar permisos de notificación
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [tab,setTab]=useState("tareas");
  const [tasks,setTasks]=useState([]);
  const [blocks,setBlocks]=useState(DEFAULT_BLOCKS);
  const [materias,setMaterias]=useState(DEFAULT_MATERIAS);
  const [bg,setBg]=useState(()=>LS.get("jc_bg",null));
  const [theme,setTheme]=useState(()=>LS.get("jc_theme","dark"));
  const [showRight,setShowRight]=useState(true);
  const [width,setWidth]=useState(window.innerWidth);
  const [loaded,setLoaded]=useState(false);

  // Cargar desde Firebase al iniciar
  useEffect(()=>{
    (async()=>{
      const t=await fbGet("tasks",null);
      const b=await fbGet("blocks",null);
      const m=await fbGet("materias",null);
      if(t&&t.length) setTasks(t);
      if(b&&b.length) setBlocks(b);
      if(m&&m.length) setMaterias(m);
      setLoaded(true);
    })();
  },[]);

  // Guardar en Firebase cuando cambian los datos
  useEffect(()=>{ if(!loaded) return; fbSet("tasks",tasks); },[tasks,loaded]);
  useEffect(()=>{ if(!loaded) return; fbSet("blocks",blocks); },[blocks,loaded]);
  useEffect(()=>{ if(!loaded) return; fbSet("materias",materias); },[materias,loaded]);

  useEffect(()=>LS.set("jc_bg",bg),[bg]);
  useEffect(()=>LS.set("jc_theme",theme),[theme]);
  useEffect(()=>{const h=()=>setWidth(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  useEffect(()=>requestNotifPermission(),[]);

  const isMobile=width<640;

  const tabContent=()=>{
    if(!loaded) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"rgba(255,255,255,0.4)",fontSize:14}}>Cargando datos...</div>;
    switch(tab){
      case "tareas": return <TareasTab tasks={tasks} setTasks={setTasks} materias={materias} theme={theme}/>;
      case "calendario": return <CalendarioTab tasks={tasks} theme={theme}/>;
      case "horario": return <HorarioTab blocks={blocks} setBlocks={setBlocks} theme={theme}/>;
      case "notas": return <NotasTab theme={theme}/>;
      case "materias": return <MateriasTab materias={materias} setMaterias={setMaterias} theme={theme}/>;
      case "config": return <ConfigTab theme={theme} setTheme={setTheme} bg={bg} setBg={setBg}/>;
      default: return null;
    }
  };

  return (
    <>
      <GlobalStyle theme={theme}/>
      {bg&&<div style={{position:"fixed",inset:0,zIndex:0,backgroundImage:`url(${bg})`,backgroundSize:"cover",backgroundPosition:"center",filter:"blur(4px) brightness(0.45)",transform:"scale(1.05)"}}/>}
      <div style={{position:"fixed",inset:0,zIndex:0,background:bg?(theme==="dark"?"rgba(10,10,20,0.55)":"rgba(244,241,248,0.55)"):(theme==="dark"?"#0a0a0f":"#f4f1f8")}}/>
      <div style={{position:"relative",zIndex:1,display:"flex",height:"100vh",overflow:"hidden"}}>
        {!isMobile&&<Sidebar tab={tab} setTab={setTab} theme={theme} isMobile={false}/>}
        <main style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column",height:"100vh"}}>
          <div style={{flex:1,overflow:"hidden",padding:isMobile?"14px 12px 70px":"18px 20px"}}>
            {tabContent()}
          </div>
        </main>
        {!isMobile&&<RightPanel theme={theme} show={showRight} onToggle={()=>setShowRight(s=>!s)}/>}
        {isMobile&&<Sidebar tab={tab} setTab={setTab} theme={theme} isMobile={true}/>}
      </div>
    </>
  );
}