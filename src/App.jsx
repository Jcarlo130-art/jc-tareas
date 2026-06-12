import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const STORAGE_TASKS = "jc_tasks_v4";
const STORAGE_BLOCKS = "jc_blocks_v4";
const STORAGE_MATERIAS = "jc_materias_v2";

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
  { id: "alta", label: "Alta", color: "#E24B4A", bg: "#FCEBEB", text: "#791F1F" },
  { id: "media", label: "Media", color: "#BA7517", bg: "#FAEEDA", text: "#633806" },
  { id: "baja", label: "Baja", color: "#639922", bg: "#EAF3DE", text: "#3B6D11" },
];

const CATS = [
  { id: "trabajo", label: "Trabajo", icon: "🎬", color: "#185FA5", bg: "#E6F1FB", text: "#0C447C" },
  { id: "escuela", label: "Escuela", icon: "📚", color: "#3B6D11", bg: "#EAF3DE", text: "#27500A" },
  { id: "personal", label: "Personal", icon: "🏠", color: "#534AB7", bg: "#EEEDFE", text: "#3C3489" },
];

const DAYS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const DAY_FULL = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const fmt24 = h => String(h).padStart(2,"0") + ":00";

const PRESET_COLORS = ["#378ADD","#E24B4A","#639922","#EF9F27","#7F77DD","#1D9E75","#D4537E","#888780","#185FA5","#BA7517","#534AB7","#3B6D11"];
const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const todayStr = () => new Date().toISOString().slice(0,10);
const daysUntil = d => { if (!d) return null; return Math.ceil((new Date(d) - new Date(todayStr())) / 86400000); };
const hexToRgba = (hex, a) => { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; };

function Badge({ color, bg, text, children }) {
  return (
    <span style={{ background:bg, color:text, border:`1px solid ${color}33`, fontSize:11, fontWeight:500, padding:"2px 8px", borderRadius:99, whiteSpace:"nowrap" }}>
      {children}
    </span>
  );
}

function DeadlineBadge({ date }) {
  if (!date) return null;
  const d = daysUntil(date);
  const fmt = new Date(date+"T00:00:00").toLocaleDateString("es-MX",{day:"2-digit",month:"short"});
  const u = d < 0 ? {c:"#E24B4A",bg:"#FCEBEB",t:"#791F1F",label:`⚠ ${fmt}`}
    : d===0 ? {c:"#E24B4A",bg:"#FCEBEB",t:"#791F1F",label:`Hoy · ${fmt}`}
    : d<=1   ? {c:"#BA7517",bg:"#FAEEDA",t:"#633806",label:`Mañana · ${fmt}`}
    : d<=3   ? {c:"#EF9F27",bg:"#FAEEDA",t:"#633806",label:`${d}d · ${fmt}`}
    :          {c:"#888780",bg:"#F1EFE8",t:"#444441",label:fmt};
  return <Badge color={u.c} bg={u.bg} text={u.t}>{u.label}</Badge>;
}

function TaskCard({ task, onToggle, onDelete, onEdit, onAddSub, onToggleSub, onDeleteSub, materias }) {
  const [exp, setExp] = useState(false);
  const [subIn, setSubIn] = useState("");
  const cat = CATS.find(c => c.id === task.cat);
  const prio = PRIOS.find(p => p.id === task.prio);
  const materia = materias.find(m => m.id === task.materia);
  const trabajo = TRABAJOS.find(t => t.id === task.subtrabajo);
  const doneCnt = task.subs.filter(s => s.done).length;
  const total = task.subs.length;
  const pct = total > 0 ? Math.round(doneCnt/total*100) : null;
  const accent = materia?.color || cat?.color || "#534AB7";
  const addSub = () => { if (subIn.trim()) { onAddSub(task.id, subIn.trim()); setSubIn(""); } };

  return (
    <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:10, padding:"10px 12px", marginBottom:7, opacity:task.done?0.65:1, borderLeft:`3px solid ${accent}` }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:9 }}>
        <input type="checkbox" checked={task.done} onChange={() => onToggle(task.id)} style={{ marginTop:3, width:14, height:14, cursor:"pointer", accentColor:accent, flexShrink:0 }} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:5, marginBottom:4 }}>
            <span style={{ fontSize:13, fontWeight:500, color:"var(--color-text-primary)", textDecoration:task.done?"line-through":"none" }}>{task.title}</span>
            {cat && <Badge color={cat.color} bg={cat.bg} text={cat.text}>{cat.icon} {cat.label}</Badge>}
            {trabajo && <Badge color="#185FA5" bg="#E6F1FB" text="#0C447C">{trabajo.label}</Badge>}
            {materia && <Badge color={materia.color} bg={hexToRgba(materia.color,0.12)} text={materia.color}>{materia.label}</Badge>}
            {prio && <Badge color={prio.color} bg={prio.bg} text={prio.text}>{prio.label}</Badge>}
            <DeadlineBadge date={task.deadline} />
          </div>
          {task.notes && <p style={{ fontSize:12, color:"var(--color-text-secondary)", margin:"0 0 5px", lineHeight:1.5 }}>{task.notes}</p>}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {total > 0 && <span style={{ fontSize:11, color:"var(--color-text-tertiary)" }}>{doneCnt}/{total} · {pct}%</span>}
            <button onClick={() => setExp(e => !e)} style={{ background:"none", border:"none", cursor:"pointer", padding:0, fontSize:11, color:"var(--color-text-tertiary)" }}>{exp ? "▲ ocultar" : "▼ subtareas"}</button>
          </div>
          {exp && (
            <div style={{ marginTop:7, paddingTop:7, borderTop:"0.5px solid var(--color-border-tertiary)" }}>
              {task.subs.map(s => (
                <div key={s.id} style={{ display:"flex", alignItems:"center", gap:7, padding:"3px 0" }}>
                  <input type="checkbox" checked={s.done} onChange={() => onToggleSub(task.id, s.id)} style={{ width:13, height:13, cursor:"pointer", accentColor:accent }} />
                  <span style={{ fontSize:12, flex:1, color:s.done?"var(--color-text-tertiary)":"var(--color-text-secondary)", textDecoration:s.done?"line-through":"none" }}>{s.text}</span>
                  <button onClick={() => onDeleteSub(task.id, s.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-text-tertiary)", fontSize:13 }}>×</button>
                </div>
              ))}
              <div style={{ display:"flex", gap:5, marginTop:5 }}>
                <input value={subIn} onChange={e => setSubIn(e.target.value)} onKeyDown={e => e.key==="Enter" && addSub()} placeholder="Nueva subtarea..." style={{ flex:1, fontSize:12, padding:"3px 7px" }} />
                <button onClick={addSub} style={{ padding:"3px 9px", fontSize:12, cursor:"pointer", background:"var(--color-background-secondary)", border:"0.5px solid var(--color-border-secondary)", borderRadius:6 }}>+</button>
              </div>
            </div>
          )}
        </div>
        <div style={{ display:"flex", gap:3, flexShrink:0 }}>
          <button onClick={() => onEdit(task)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-text-tertiary)", fontSize:14, padding:"2px 4px" }}>✏</button>
          <button onClick={() => onDelete(task.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-text-tertiary)", fontSize:15, padding:"2px 4px" }}>×</button>
        </div>
      </div>
      {total > 0 && (
        <div style={{ marginTop:7, height:3, background:"var(--color-background-tertiary)", borderRadius:9 }}>
          <div style={{ height:"100%", width:pct+"%", background:accent, borderRadius:9, transition:"width .3s" }} />
        </div>
      )}
    </div>
  );
}

function TaskForm({ initial, onSave, onCancel, materias }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [cat, setCat] = useState(initial?.cat || "escuela");
  const [prio, setPrio] = useState(initial?.prio || "media");
  const [deadline, setDeadline] = useState(initial?.deadline || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [subtrabajo, setSubtrabajo] = useState(initial?.subtrabajo || "ecatepec");
  const [materia, setMateria] = useState(initial?.materia || "");
  const save = () => {
    if (!title.trim()) return;
    onSave({ title:title.trim(), cat, prio, deadline, notes, subtrabajo:cat==="trabajo"?subtrabajo:null, materia:cat==="escuela"?materia:null });
  };
  return (
    <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-primary)", borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nombre de la tarea..." style={{ width:"100%", fontSize:13, fontWeight:500, marginBottom:9, boxSizing:"border-box" }} onKeyDown={e => e.key==="Enter" && save()} autoFocus />
      <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:9 }}>
        <select value={cat} onChange={e => setCat(e.target.value)} style={{ fontSize:12, flex:1, minWidth:90 }}>
          {CATS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
        <select value={prio} onChange={e => setPrio(e.target.value)} style={{ fontSize:12, flex:1, minWidth:90 }}>
          {PRIOS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ fontSize:12, flex:1, minWidth:110 }} />
      </div>
      {cat==="trabajo" && (
        <select value={subtrabajo} onChange={e => setSubtrabajo(e.target.value)} style={{ width:"100%", fontSize:12, marginBottom:9 }}>
          {TRABAJOS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      )}
      {cat==="escuela" && (
        <select value={materia} onChange={e => setMateria(e.target.value)} style={{ width:"100%", fontSize:12, marginBottom:9 }}>
          <option value="">— Sin materia —</option>
          {materias.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      )}
      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas..." rows={2} style={{ width:"100%", fontSize:12, resize:"vertical", marginBottom:9, boxSizing:"border-box" }} />
      <div style={{ display:"flex", gap:7, justifyContent:"flex-end" }}>
        <button onClick={onCancel} style={{ fontSize:12, padding:"5px 12px", cursor:"pointer" }}>Cancelar</button>
        <button onClick={save} style={{ fontSize:12, padding:"5px 14px", cursor:"pointer", background:"#534AB7", color:"#fff", border:"none", borderRadius:6, fontWeight:500 }}>{initial ? "Guardar" : "Agregar"}</button>
      </div>
    </div>
  );
}

const DEFAULT_BLOCKS = [
  {id:1,day:0,start:7,end:8,label:"Traslado",color:"#888780",salon:""},
  {id:2,day:0,start:8,end:9,label:"Traslado / Casa",color:"#888780",salon:""},
  {id:3,day:0,start:9,end:11,label:"Administración BD",color:"#639922",salon:"Q203"},
  {id:4,day:0,start:13,end:14,label:"Traslado",color:"#888780",salon:""},
  {id:5,day:0,start:14,end:22,label:"Trabajo",color:"#185FA5",salon:""},
  {id:6,day:1,start:7,end:9,label:"Lenguajes y Autómatas",color:"#378ADD",salon:"Q203"},
  {id:7,day:1,start:9,end:11,label:"Graficación",color:"#EF9F27",salon:"Q203"},
  {id:8,day:1,start:11,end:13,label:"Adm. de Redes",color:"#7F77DD",salon:"2S3"},
  {id:9,day:1,start:13,end:14,label:"Traslado",color:"#888780",salon:""},
  {id:10,day:1,start:14,end:22,label:"Trabajo",color:"#185FA5",salon:""},
  {id:11,day:2,start:7,end:8,label:"GYM",color:"#7F77DD",salon:""},
  {id:12,day:2,start:8,end:9,label:"Traslado",color:"#888780",salon:""},
  {id:13,day:2,start:9,end:11,label:"Administración BD",color:"#639922",salon:"Q203"},
  {id:14,day:2,start:11,end:12,label:"Traslado",color:"#888780",salon:""},
  {id:15,day:2,start:12,end:13,label:"GYM",color:"#7F77DD",salon:""},
  {id:16,day:2,start:13,end:15,label:"Sistemas Programables",color:"#E24B4A",salon:"Q203"},
  {id:17,day:3,start:7,end:9,label:"Sistemas Programables",color:"#E24B4A",salon:"Q203"},
  {id:18,day:3,start:9,end:11,label:"Graficación",color:"#EF9F27",salon:"Q203"},
  {id:19,day:3,start:11,end:12,label:"Traslado",color:"#888780",salon:""},
  {id:20,day:3,start:13,end:15,label:"Sistemas Programables",color:"#E24B4A",salon:"Q203"},
  {id:21,day:3,start:15,end:22,label:"Trabajo",color:"#185FA5",salon:""},
  {id:22,day:4,start:7,end:8,label:"Traslado",color:"#888780",salon:""},
  {id:23,day:4,start:8,end:10,label:"Lenguajes y Autómatas",color:"#378ADD",salon:"Q203"},
  {id:24,day:4,start:9,end:11,label:"Administración BD",color:"#639922",salon:"Q203"},
  {id:25,day:4,start:11,end:13,label:"Lenguajes y Autómatas",color:"#378ADD",salon:"Q203"},
  {id:26,day:4,start:13,end:14,label:"Traslado",color:"#888780",salon:""},
  {id:27,day:4,start:14,end:22,label:"Trabajo",color:"#185FA5",salon:""},
  {id:28,day:5,start:12,end:13,label:"Traslado",color:"#888780",salon:""},
  {id:29,day:5,start:14,end:22,label:"Trabajo",color:"#185FA5",salon:""},
];

function BlockModal({ block, onSave, onClose, onDelete }) {
  const [label, setLabel] = useState(block?.label || "");
  const [color, setColor] = useState(block?.color || "#378ADD");
  const [day, setDay] = useState(block?.day ?? 0);
  const [start, setStart] = useState(block?.start ?? 8);
  const [end, setEnd] = useState(block?.end ?? 9);
  const [salon, setSalon] = useState(block?.salon || "");
  const save = () => { if (!label.trim() || end <= start) return; onSave({ label:label.trim(), color, day, start, end, salon }); };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:"var(--color-background-primary)", borderRadius:12, padding:"18px 20px", width:300, border:"0.5px solid var(--color-border-primary)", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ fontWeight:500, fontSize:14, marginBottom:12 }}>{block?.id ? "Editar bloque" : "Nuevo bloque"}</div>
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Nombre" style={{ width:"100%", fontSize:13, marginBottom:8, boxSizing:"border-box" }} autoFocus />
        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:11, color:"var(--color-text-secondary)", marginBottom:5 }}>Color</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:6 }}>
            {PRESET_COLORS.map(c => (
              <div key={c} onClick={() => setColor(c)} style={{ width:22, height:22, borderRadius:4, background:c, cursor:"pointer", border:color===c?"2px solid var(--color-text-primary)":"2px solid transparent", boxSizing:"border-box" }} />
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width:32, height:28, border:"none", cursor:"pointer", padding:0 }} />
            <span style={{ fontSize:11, color:"var(--color-text-secondary)" }}>Personalizado</span>
          </div>
        </div>
        <select value={day} onChange={e => setDay(+e.target.value)} style={{ width:"100%", fontSize:13, marginBottom:8 }}>
          {DAY_FULL.map((d,i) => <option key={i} value={i}>{d}</option>)}
        </select>
        <div style={{ display:"flex", gap:8, marginBottom:8 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, color:"var(--color-text-secondary)", marginBottom:3 }}>Inicio</div>
            <select value={start} onChange={e => setStart(+e.target.value)} style={{ width:"100%", fontSize:13 }}>
              {HOURS.map(h => <option key={h} value={h}>{fmt24(h)}</option>)}
            </select>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, color:"var(--color-text-secondary)", marginBottom:3 }}>Fin</div>
            <select value={end} onChange={e => setEnd(+e.target.value)} style={{ width:"100%", fontSize:13 }}>
              {HOURS.filter(h => h > start).map(h => <option key={h} value={h}>{fmt24(h)}</option>)}
            </select>
          </div>
        </div>
        <input value={salon} onChange={e => setSalon(e.target.value)} placeholder="Salón (opcional)" style={{ width:"100%", fontSize:13, marginBottom:12, boxSizing:"border-box" }} />
        <div style={{ display:"flex", gap:7, justifyContent:"space-between" }}>
          {block?.id && <button onClick={() => onDelete(block.id)} style={{ fontSize:12, padding:"5px 10px", cursor:"pointer", color:"#E24B4A", background:"#FCEBEB", border:"none", borderRadius:6 }}>Eliminar</button>}
          <div style={{ display:"flex", gap:7, marginLeft:"auto" }}>
            <button onClick={onClose} style={{ fontSize:12, padding:"5px 11px", cursor:"pointer" }}>Cancelar</button>
            <button onClick={save} style={{ fontSize:12, padding:"5px 13px", cursor:"pointer", background:"#534AB7", color:"#fff", border:"none", borderRadius:6, fontWeight:500 }}>Guardar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScheduleTab({ blocks, setBlocks }) {
  const [modal, setModal] = useState(null);
  const CELL = 38, TIME_W = 40, N = DAYS.length;
  const saveBlock = data => { if (modal.id) setBlocks(bs => bs.map(b => b.id===modal.id ? {...b,...data} : b)); else setBlocks(bs => [...bs, {...data, id:Date.now()}]); setModal(null); };
  const delBlock = id => { setBlocks(bs => bs.filter(b => b.id !== id)); setModal(null); };
  const gridH = HOURS.length * CELL;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <span style={{ fontSize:12, color:"var(--color-text-secondary)" }}>Formato 24h · toca un bloque para editar</span>
        <button onClick={() => setModal({})} style={{ fontSize:12, padding:"5px 12px", cursor:"pointer", background:"#534AB7", color:"#fff", border:"none", borderRadius:7, fontWeight:500 }}>+ Bloque</button>
      </div>
      <div style={{ overflowX:"auto", overflowY:"auto", maxHeight:500 }}>
        <div style={{ minWidth:480, position:"relative" }}>
          <div style={{ display:"flex", marginLeft:TIME_W, position:"sticky", top:0, background:"var(--color-background-primary)", zIndex:10, borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
            {DAYS.map((d,i) => <div key={i} style={{ flex:1, textAlign:"center", fontSize:10, fontWeight:500, color:"var(--color-text-secondary)", padding:"4px 0", borderLeft:"0.5px solid var(--color-border-tertiary)" }}>{d}</div>)}
          </div>
          <div style={{ position:"relative", height:gridH }}>
            {HOURS.map((h,hi) => (
              <div key={h} style={{ position:"absolute", top:hi*CELL, left:0, right:0, display:"flex", height:CELL, borderTop:"0.5px solid var(--color-border-tertiary)" }}>
                <div style={{ width:TIME_W, flexShrink:0, fontSize:9, color:"var(--color-text-tertiary)", paddingRight:4, textAlign:"right", paddingTop:2 }}>{fmt24(h)}</div>
                {DAYS.map((_,di) => <div key={di} style={{ flex:1, borderLeft:"0.5px solid var(--color-border-tertiary)" }} />)}
              </div>
            ))}
            {blocks.map(b => {
              const colW = `calc((100% - ${TIME_W}px) / ${N})`;
              return (
                <div key={b.id} onClick={() => setModal(b)} style={{
                  position:"absolute",
                  top: b.start * CELL,
                  left: `calc(${TIME_W}px + ${b.day} * ${colW})`,
                  width: `calc(${colW} - 2px)`,
                  height: (b.end - b.start) * CELL - 2,
                  background: b.color, borderRadius:4, padding:"2px 3px",
                  cursor:"pointer", overflow:"hidden", boxSizing:"border-box", zIndex:2
                }}>
                  <div style={{ fontSize:9, fontWeight:500, color:"#fff", lineHeight:1.25, wordBreak:"break-word" }}>{b.label}</div>
                  {b.salon && <div style={{ fontSize:8, color:"rgba(255,255,255,0.8)" }}>{b.salon}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {modal !== null && <BlockModal block={modal} onSave={saveBlock} onClose={() => setModal(null)} onDelete={delBlock} />}
    </div>
  );
}

function CalendarTab({ tasks }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(null);
  const DOW = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month+1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const rows = Math.ceil((startOffset + lastDay.getDate()) / 7);
  const todayISO = todayStr();

  const tasksByDate = {};
  tasks.forEach(t => {
    if (t.deadline && !t.done) {
      if (!tasksByDate[t.deadline]) tasksByDate[t.deadline] = [];
      tasksByDate[t.deadline].push(t);
    }
  });

  const prevMonth = () => { if (month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); setSelected(null); };
  const nextMonth = () => { if (month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); setSelected(null); };

  const selectedISO = selected ? `${year}-${String(month+1).padStart(2,"0")}-${String(selected).padStart(2,"0")}` : null;
  const selectedTasks = selectedISO ? (tasksByDate[selectedISO] || []) : [];

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <button onClick={prevMonth} style={{ fontSize:18, background:"none", border:"none", cursor:"pointer", color:"var(--color-text-secondary)", padding:"4px 12px" }}>‹</button>
        <span style={{ fontSize:15, fontWeight:500, color:"var(--color-text-primary)" }}>{MONTH_NAMES[month]} {year}</span>
        <button onClick={nextMonth} style={{ fontSize:18, background:"none", border:"none", cursor:"pointer", color:"var(--color-text-secondary)", padding:"4px 12px" }}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1, marginBottom:3 }}>
        {DOW.map(d => <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:500, color:"var(--color-text-tertiary)", padding:"3px 0" }}>{d}</div>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
        {Array.from({ length:rows*7 }).map((_,i) => {
          const dayNum = i - startOffset + 1;
          const valid = dayNum >= 1 && dayNum <= lastDay.getDate();
          const iso = valid ? `${year}-${String(month+1).padStart(2,"0")}-${String(dayNum).padStart(2,"0")}` : null;
          const isToday = iso === todayISO;
          const isSelected = dayNum === selected && valid;
          const dayTasks = iso ? (tasksByDate[iso] || []) : [];
          const hasTrabajo = dayTasks.some(t => t.cat==="trabajo");
          const hasEscuela = dayTasks.some(t => t.cat==="escuela");
          const hasPersonal = dayTasks.some(t => t.cat==="personal");
          const hasAlta = dayTasks.some(t => t.prio==="alta");
          return (
            <div key={i} onClick={() => valid && setSelected(isSelected ? null : dayNum)} style={{
              minHeight:46, borderRadius:7, padding:"4px 3px",
              background: isSelected ? "#534AB7" : isToday ? "#EEEDFE" : "var(--color-background-primary)",
              border: isToday && !isSelected ? "1.5px solid #534AB7" : "0.5px solid var(--color-border-tertiary)",
              cursor: valid ? "pointer" : "default",
              opacity: valid ? 1 : 0,
              position:"relative"
            }}>
              {valid && (
                <>
                  <div style={{ fontSize:11, fontWeight:isToday?600:400, color:isSelected?"#fff":isToday?"#534AB7":"var(--color-text-primary)", textAlign:"center", marginBottom:2 }}>{dayNum}</div>
                  {hasAlta && <div style={{ position:"absolute", top:3, right:3, width:5, height:5, borderRadius:"50%", background:"#E24B4A" }} />}
                  <div style={{ display:"flex", justifyContent:"center", gap:1, flexWrap:"wrap" }}>
                    {hasTrabajo && <span style={{ fontSize:9 }}>🎬</span>}
                    {hasEscuela && <span style={{ fontSize:9 }}>📚</span>}
                    {hasPersonal && <span style={{ fontSize:9 }}>🏠</span>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      {selectedISO && (
        <div style={{ marginTop:12, background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:10, padding:"10px 14px" }}>
          <div style={{ fontSize:12, fontWeight:500, color:"var(--color-text-secondary)", marginBottom:6 }}>
            {selected} de {MONTH_NAMES[month]}{selectedTasks.length===0 && " — sin tareas pendientes"}
          </div>
          {selectedTasks.map(t => {
            const cat = CATS.find(c => c.id===t.cat);
            const prio = PRIOS.find(p => p.id===t.prio);
            return (
              <div key={t.id} style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 0", borderTop:"0.5px solid var(--color-border-tertiary)" }}>
                <span style={{ fontSize:13 }}>{cat?.icon}</span>
                <span style={{ fontSize:12, flex:1, color:"var(--color-text-primary)" }}>{t.title}</span>
                {prio && <Badge color={prio.color} bg={prio.bg} text={prio.text}>{prio.label}</Badge>}
              </div>
            );
          })}
        </div>
      )}
      <div style={{ display:"flex", gap:10, marginTop:10, flexWrap:"wrap" }}>
        {[{icon:"🎬",label:"Trabajo"},{icon:"📚",label:"Escuela"},{icon:"🏠",label:"Personal"},{icon:"🔴",label:"Alta prioridad"}].map(l => (
          <span key={l.label} style={{ display:"flex", alignItems:"center", gap:4, fontSize:11, color:"var(--color-text-secondary)" }}><span>{l.icon}</span>{l.label}</span>
        ))}
      </div>
    </div>
  );
}

function MateriasTab({ materias, setMaterias }) {
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#378ADD");
  const add = () => { if (!label.trim()) return; setMaterias(ms => [...ms, { id:Date.now().toString(), label:label.trim(), color }]); setLabel(""); setColor("#378ADD"); };
  const del = id => setMaterias(ms => ms.filter(m => m.id !== id));
  const upColor = (id, c) => setMaterias(ms => ms.map(m => m.id===id ? {...m,color:c} : m));
  return (
    <div>
      <div style={{ fontSize:13, fontWeight:500, marginBottom:10 }}>Materias registradas</div>
      {materias.map(m => (
        <div key={m.id} style={{ display:"flex", alignItems:"center", gap:9, padding:"6px 10px", background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:8, marginBottom:6, borderLeft:`3px solid ${m.color}` }}>
          <input type="color" value={m.color} onChange={e => upColor(m.id, e.target.value)} style={{ width:26, height:22, border:"none", cursor:"pointer", padding:0, flexShrink:0 }} />
          <span style={{ flex:1, fontSize:13 }}>{m.label}</span>
          <button onClick={() => del(m.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-text-tertiary)", fontSize:15 }}>×</button>
        </div>
      ))}
      <div style={{ display:"flex", gap:7, marginTop:12, alignItems:"center" }}>
        <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width:32, height:32, border:"none", cursor:"pointer", padding:0, flexShrink:0 }} />
        <input value={label} onChange={e => setLabel(e.target.value)} onKeyDown={e => e.key==="Enter" && add()} placeholder="Nueva materia..." style={{ flex:1, fontSize:13 }} />
        <button onClick={add} style={{ padding:"6px 14px", fontSize:13, cursor:"pointer", background:"#534AB7", color:"#fff", border:"none", borderRadius:7, fontWeight:500 }}>Agregar</button>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("tareas");
  const [tasks, setTasks] = useState([]);
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS);
  const [materias, setMaterias] = useState(DEFAULT_MATERIAS);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("fecha");
  const [showDone, setShowDone] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);


useEffect(() => {
  (async () => {
    try {
      const snap = await getDoc(doc(db, "jc", "tasks"));
      if (snap.exists()) setTasks(snap.data().value || []);
    } catch {}
    try {
      const snap = await getDoc(doc(db, "jc", "blocks"));
      if (snap.exists()) setBlocks(snap.data().value || DEFAULT_BLOCKS);
    } catch {}
    try {
      const snap = await getDoc(doc(db, "jc", "materias"));
      if (snap.exists()) setMaterias(snap.data().value || DEFAULT_MATERIAS);
    } catch {}
    setLoaded(true);
  })();
}, []);

useEffect(() => {
  if (!loaded) return;
  setDoc(doc(db, "jc", "tasks"), { value: tasks }).catch(() => {});
}, [tasks, loaded]);

useEffect(() => {
  if (!loaded) return;
  setDoc(doc(db, "jc", "blocks"), { value: blocks }).catch(() => {});
}, [blocks, loaded]);

useEffect(() => {
  if (!loaded) return;
  setDoc(doc(db, "jc", "materias"), { value: materias }).catch(() => {});
}, [materias, loaded]);

  const addTask = d => { setTasks(ts => [{...d, done:false, subs:[], id:Date.now()}, ...ts]); setAddOpen(false); };
  const saveEdit = d => { setTasks(ts => ts.map(t => t.id===editTask.id ? {...t,...d} : t)); setEditTask(null); };
  const toggleTask = id => setTasks(ts => ts.map(t => t.id===id ? {...t, done:!t.done} : t));
  const deleteTask = id => setTasks(ts => ts.filter(t => t.id !== id));
  const addSub = (tid, text) => setTasks(ts => ts.map(t => t.id===tid ? {...t, subs:[...t.subs,{id:Date.now(),text,done:false}]} : t));
  const toggleSub = (tid, sid) => setTasks(ts => ts.map(t => t.id===tid ? {...t, subs:t.subs.map(s => s.id===sid ? {...s,done:!s.done} : s)} : t));
  const deleteSub = (tid, sid) => setTasks(ts => ts.map(t => t.id===tid ? {...t, subs:t.subs.filter(s => s.id!==sid)} : t));

  const pending = tasks.filter(t => !t.done).length;
  const urgent = tasks.filter(t => !t.done && t.prio==="alta").length;
  const byDue = tasks.filter(t => !t.done && t.deadline && daysUntil(t.deadline) <= 3).length;

  const FILTERS = [
    {id:"all", label:`Todas (${pending})`},
    {id:"urgente", label:`🔴 (${urgent})`},
    ...CATS.map(c => ({id:c.id, label:c.icon})),
  ];

  let visible = tasks.filter(t => {
    if (!showDone && t.done) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !(t.notes||"").toLowerCase().includes(search.toLowerCase())) return false;
    if (filter==="urgente") return t.prio==="alta" && !t.done;
    if (filter!=="all") return t.cat===filter;
    return true;
  });
  visible = [...visible].sort((a,b) => {
    if (sortBy==="prioridad") { const po={alta:0,media:1,baja:2}; return (po[a.prio]||1)-(po[b.prio]||1); }
    if (sortBy==="fecha") { if (!a.deadline&&!b.deadline) return 0; if (!a.deadline) return 1; if (!b.deadline) return -1; return new Date(a.deadline)-new Date(b.deadline); }
    return 0;
  });

  const TABS = [{id:"tareas",label:"📋 Tareas"},{id:"calendario",label:"📅 Calendario"},{id:"horario",label:"🗓 Horario"},{id:"materias",label:"🎨 Materias"}];

  if (!loaded) return <div style={{padding:"2rem",color:"var(--color-text-secondary)",fontSize:13}}>Cargando...</div>;

  return (
    <div style={{padding:"0.8rem 0", maxWidth:640, margin:"0 auto"}}>
      <div style={{display:"flex", gap:4, marginBottom:14, background:"var(--color-background-secondary)", borderRadius:10, padding:4}}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex:1, padding:"7px 2px", fontSize:11, fontWeight:500, cursor:"pointer", borderRadius:7,
            background: tab===t.id ? "#534AB7" : "transparent",
            color: tab===t.id ? "#fff" : "var(--color-text-secondary)",
            border:"none", transition:"all .15s"
          }}>{t.label}</button>
        ))}
      </div>

      {tab==="tareas" && (
        <>
          <div style={{display:"flex", gap:8, marginBottom:12, flexWrap:"wrap"}}>
            {[{label:"Pendientes",val:pending,c:"#534AB7",bg:"#EEEDFE",t:"#3C3489"},{label:"Urgentes",val:urgent,c:"#E24B4A",bg:"#FCEBEB",t:"#791F1F"},{label:"Vencen 3d",val:byDue,c:"#BA7517",bg:"#FAEEDA",t:"#633806"}].map(m => (
              <div key={m.label} style={{flex:1, minWidth:90, background:m.bg, borderRadius:9, padding:"8px 12px", border:`0.5px solid ${m.c}33`}}>
                <div style={{fontSize:10, color:m.t, marginBottom:1}}>{m.label}</div>
                <div style={{fontSize:20, fontWeight:500, color:m.t}}>{m.val}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex", gap:7, marginBottom:10}}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar..." style={{flex:1, fontSize:13, padding:"6px 10px"}} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{fontSize:12, padding:"5px 8px"}}>
              <option value="fecha">Fecha</option>
              <option value="prioridad">Prioridad</option>
            </select>
          </div>
          <div style={{display:"flex", gap:5, flexWrap:"wrap", marginBottom:11, alignItems:"center"}}>
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{padding:"4px 10px", fontSize:11, cursor:"pointer", borderRadius:99, background:filter===f.id?"#534AB7":"var(--color-background-secondary)", color:filter===f.id?"#fff":"var(--color-text-secondary)", border:filter===f.id?"none":"0.5px solid var(--color-border-tertiary)", fontWeight:filter===f.id?500:400}}>{f.label}</button>
            ))}
            <button onClick={() => setShowDone(s => !s)} style={{padding:"4px 10px", fontSize:11, cursor:"pointer", borderRadius:99, marginLeft:"auto", background:showDone?"#1D9E75":"var(--color-background-secondary)", color:showDone?"#fff":"var(--color-text-secondary)", border:showDone?"none":"0.5px solid var(--color-border-tertiary)"}}>✓ hechas</button>
          </div>
          {editTask
            ? <TaskForm initial={editTask} onSave={saveEdit} onCancel={() => setEditTask(null)} materias={materias} />
            : addOpen
            ? <TaskForm onSave={addTask} onCancel={() => setAddOpen(false)} materias={materias} />
            : <button onClick={() => setAddOpen(true)} style={{width:"100%", padding:"9px 0", marginBottom:12, cursor:"pointer", background:"var(--color-background-secondary)", border:"0.5px dashed var(--color-border-secondary)", borderRadius:9, fontSize:13, color:"var(--color-text-secondary)", fontWeight:500}}>+ Nueva tarea</button>
          }
          {visible.length===0
            ? <div style={{textAlign:"center", padding:"2rem 0", color:"var(--color-text-tertiary)", fontSize:13}}>{tasks.length===0 ? "Agrega tu primera tarea ↑" : "Sin resultados"}</div>
            : visible.map(t => <TaskCard key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} onEdit={t => { setAddOpen(false); setEditTask(t); }} onAddSub={addSub} onToggleSub={toggleSub} onDeleteSub={deleteSub} materias={materias} />)
          }
        </>
      )}
      {tab==="calendario" && <CalendarTab tasks={tasks} />}
      {tab==="horario" && <ScheduleTab blocks={blocks} setBlocks={setBlocks} />}
      {tab==="materias" && <MateriasTab materias={materias} setMaterias={setMaterias} />}
    </div>
  );
}