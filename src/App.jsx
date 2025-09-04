import React, { useMemo, useState } from "react";

/**
 * ZV Rewards Manager — Versión completa (UI tipo mockups)
 * Vite + React + Tailwind (sin backend; datos en memoria)
 */

const cx = (...c) => c.filter(Boolean).join(" ");
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const KPI_KEYS = ["productividad","colaboracion","bienestar","innovacion","ausentismo","cultura"];
const KPI_LABEL = {
  productividad: "Productividad digital",
  colaboracion: "Colaboración",
  bienestar: "Bienestar",
  innovacion: "Innovación",
  ausentismo: "Ausentismo digital (↓ es mejor)",
  cultura: "Cultura ZV (rotación/promociones/clima)",
};

const BASE_CHALLENGES = [
  { id: "c1", title: "+10% eficiencia de línea", desc: "Completa 3 mejoras de proceso.", kpi: "productividad", reward: 120, progress: 0, target: 3, status: "En progreso" },
  { id: "c2", title: "Reducir mermas a < 2%", desc: "Ejecuta 2 acciones correctivas.", kpi: "colaboracion", reward: 90, progress: 0, target: 2, status: "Pendiente" },
  { id: "c3", title: "Capacitación de seguridad", desc: "Completa el curso obligatorio.", kpi: "bienestar", reward: 60, progress: 1, target: 1, status: "Completado" },
];

const REWARDS = [
  { id: "r1", title: "Gift cards / vales", type: "No financiera", cost: 250, horizon: "Corto (<3m)" },
  { id: "r2", title: "Badge \"Innovador ZV\"", type: "No financiera", cost: 120, horizon: "Corto (<3m)" },
  { id: "r3", title: "Bono trimestral ligado a KPIs", type: "Financiera", cost: 650, horizon: "Mediano (3–6m)" },
  { id: "r4", title: "Día libre", type: "No financiera", cost: 400, horizon: "Mediano (3–6m)" },
  { id: "r5", title: "Mentoría interna", type: "No financiera", cost: 350, horizon: "Mediano (3–6m)" },
  { id: "r6", title: "Incremento salarial / utilidades", type: "Financiera", cost: 1500, horizon: "Largo (6–12m)" },
  { id: "r7", title: "Promoción interna", type: "No financiera", cost: 1000, horizon: "Largo (6–12m)" },
  { id: "r8", title: "Membresía de bienestar", type: "No financiera", cost: 900, horizon: "Largo (6–12m)" },
];

const BADGES = [
  { id: "b1", name: "Innovador ZV", icon: "💡" },
  { id: "b2", name: "Colaborador", icon: "🤝" },
  { id: "b3", name: "Bienestar", icon: "🧘" },
  { id: "b4", name: "Productividad", icon: "⏱️" },
];

const ProgressBar = ({ value }) => (
  <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
    <div className="h-2 rounded-full bg-gray-900" style={{ width: `${clamp(value, 0, 100)}%` }} />
  </div>
);

const Pill = ({ children, active }) => (
  <span className={cx("px-3 py-1 rounded-full text-sm border", active ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200")}>{children}</span>
);

export default function App() {
  const [tab, setTab] = useState("inicio");
  const [points, setPoints] = useState(420);
  const [level, setLevel] = useState(2);
  const [badges, setBadges] = useState(["b4"]);
  const [kpis, setKpis] = useState({ productividad: 62, colaboracion: 48, bienestar: 40, innovacion: 35, ausentismo: 28, cultura: 72 });
  const [challenges, setChallenges] = useState(BASE_CHALLENGES);
  const [evaluations, setEvaluations] = useState([]);
  const [feedback, setFeedback] = useState([]);

  const nextLevelAt = useMemo(() => (level + 1) * 500, [level]);
  const progressToNext = useMemo(() => clamp((points / nextLevelAt) * 100, 0, 100), [points, nextLevelAt]);

  const addPoints = (n) => {
    const p = Math.max(0, points + n);
    setPoints(p);
    const newLevel = Math.floor(p / 500) + 1;
    if (newLevel !== level) setLevel(newLevel);
  };

  const completeChallenge = (id) => {
    setChallenges(prev => prev.map(c => {
      if (c.id !== id) return c;
      const progress = clamp(c.progress + 1, 0, c.target);
      const done = progress === c.target;
      if (done) {
        addPoints(c.reward);
        setKpis(kv => {
          const copy = { ...kv };
          const inc = c.kpi === "ausentismo" ? -5 : 5;
          copy[c.kpi] = clamp(copy[c.kpi] + inc, 0, 100);
          copy.cultura = clamp(copy.cultura + 2, 0, 100);
          return copy;
        });
        if (c.kpi === "innovacion" && !badges.includes("b1")) setBadges(b => [...b, "b1"]);
      }
      return { ...c, progress, status: done ? "Completado" : c.status };
    }));
  };

  const redeem = (r) => {
    if (points < r.cost) return alert("Te faltan puntos.");
    addPoints(-r.cost);
    alert("Canjeaste: " + r.title);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">ZV Rewards Manager</h1>
            <div className="text-sm text-gray-500">Programa de Recompensa Total · Zefiv Fizz</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-medium">Alex Ramírez</div>
              <div className="text-xs text-gray-500">Supervisor/a de Producción</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-200 grid place-items-center">🙂</div>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-4 pb-4 flex flex-wrap gap-2">
          {[
            {id:"inicio", label:"Inicio"},
            {id:"retos", label:"Retos"},
            {id:"recompensas", label:"Recompensas"},
            {id:"evaluacion", label:"Evaluación"},
            {id:"sbi", label:"Feedback SBI"},
            {id:"analytics", label:"Analytics EPM"},
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cx("px-4 py-2 rounded-full border text-sm", tab===t.id ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50")}>{t.label}</button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <Pill>Lvl {level}</Pill>
            <Pill>{points} pts</Pill>
          </div>
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {tab === "inicio" && (
          <section className="grid md:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-2xl border">
              <div className="text-sm text-gray-500 mb-1">Progreso al siguiente nivel</div>
              <ProgressBar value={progressToNext} />
              <div className="text-sm text-gray-600 mt-2">{progressToNext.toFixed(0)}%</div>
            </div>
            <div className="p-5 bg-white rounded-2xl border">
              <div className="text-sm text-gray-500">Evaluaciones enviadas</div>
              <div className="text-2xl font-semibold">{evaluations.length}</div>
            </div>
            <div className="p-5 bg-white rounded-2xl border">
              <div className="text-sm text-gray-500">Feedbacks (SBI)</div>
              <div className="text-2xl font-semibold">{feedback.length}</div>
            </div>

            <div className="md:col-span-2 p-5 bg-white rounded-2xl border space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">KPIs</h3>
                <span className="text-xs text-gray-500">(0–100)</span>
              </div>
              <div className="space-y-4">
                {KPI_KEYS.map((k) => (
                  <div key={k}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-700">{KPI_LABEL[k]}</span>
                      <span className={cx("font-semibold", k==="ausentismo" ? "text-emerald-700" : "text-gray-900")}>{kpis[k]}</span>
                    </div>
                    <ProgressBar value={kpis[k]} />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border">
              <h3 className="font-semibold mb-3">Insignias</h3>
              <div className="flex flex-wrap gap-2">
                {BADGES.map(b => (
                  <span key={b.id} className={cx("px-3 py-2 rounded-xl border text-sm flex items-center gap-2", badges.includes(b.id) ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200 opacity-60")}>
                    <span className="text-lg">{b.icon}</span>
                    {b.name}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {tab === "retos" && (
          <section className="grid md:grid-cols-2 gap-4">
            <div className="p-5 bg-white rounded-2xl border">
              <h3 className="font-semibold mb-3">Retos Activos</h3>
              <div className="space-y-3">
                {challenges.map((c) => {
                  const done = c.progress >= c.target;
                  return (
                    <div key={c.id} className="p-3 rounded-xl border flex items-center justify-between">
                      <div>
                        <div className="font-medium">{c.title}</div>
                        <div className="text-xs text-gray-500">{c.desc}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cx("px-2 py-1 rounded-full text-xs border", 
                          c.status === "Completado" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          c.status === "En progreso" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          "bg-gray-50 text-gray-700 border-gray-200")}>{c.status}</span>
                        <button onClick={() => completeChallenge(c.id)} disabled={done} className={cx("px-3 py-2 rounded-lg text-sm border", done ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50")}>
                          Progresar
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="p-5 bg-white rounded-2xl border">
              <h3 className="font-semibold mb-3">Indicadores & Premios</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="px-3 py-2 rounded-xl border text-sm">Badge: ZV Safety</div>
                <div className="px-3 py-2 rounded-xl border text-sm">Vales $500</div>
                <div className="px-3 py-2 rounded-xl border text-sm">Mentoría</div>
              </div>
            </div>
          </section>
        )}

        {tab === "recompensas" && (
          <section className="grid md:grid-cols-3 gap-4">
            {["Corto (<3m)", "Mediano (3–6m)", "Largo (6–12m)"].map(group => (
              <div key={group} className="p-5 bg-white rounded-2xl border">
                <h3 className="font-semibold mb-1">{group === "Corto (<3m)" ? "Corto plazo (<3m)" : group === "Mediano (3–6m)" ? "Mediano plazo (3–6m)" : "Largo plazo (6–12m)"}</h3>
                <ul className="list-disc ml-5 text-sm space-y-1">
                  {REWARDS.filter(r => r.horizon === group).map(r => (
                    <li key={r.id} className="flex items-center justify-between">
                      <span>{r.title}</span>
                      <button onClick={() => redeem(r)} className="text-xs px-2 py-1 rounded-lg border hover:bg-gray-50">Canjear</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {tab === "evaluacion" && <EvaluationForm onSave={(p)=>setEvaluations(e=>[...e,p])} />}
        {tab === "sbi" && <FeedbackSBI onSave={(f)=>setFeedback(prev=>[f, ...prev])} />}

        {tab === "analytics" && (
          <section className="p-5 bg-white rounded-2xl border space-y-3">
            <h3 className="font-semibold">Analytics EPM (mock)</h3>
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              <div className="p-3 rounded-xl border">Clima (aprobación): <b>90%</b></div>
              <div className="p-3 rounded-xl border">Rotación (áreas críticas): <b>↓15%</b></div>
              <div className="p-3 rounded-xl border">Promociones internas: <b>75%</b></div>
            </div>
            <div className="text-xs text-gray-500">Conectar a datos reales vía API / Firebase cuando esté listo.</div>
          </section>
        )}
      </main>
    </div>
  );
}

/* ---- Formularios ---- */

function EvaluationForm({ onSave }) {
  const [type, setType] = useState("Autoevaluación");
  const [scores, setScores] = useState({ productividad:3, colaboracion:3, bienestar:3, innovacion:3, ausentismo:3, cultura:3 });
  const [comment, setComment] = useState("");
  const set = (k,v)=>setScores((s)=>({...s,[k]:v}));
  const save = ()=>{ onSave({ type, scores, comment, createdAt: new Date().toISOString() }); alert("Evaluación registrada."); };

  return (
    <section className="p-5 bg-white rounded-2xl border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Evaluación</h3>
        <select className="px-3 py-2 rounded-full border text-sm" value={type} onChange={(e)=>setType(e.target.value)}>
          {["Autoevaluación","Coevaluación","Evaluación de líder/gerente"].map(t=><option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {KPI_KEYS.map(key => (
          <div key={key} className="p-3 rounded-xl border">
            <div className="text-sm font-medium mb-1">{KPI_LABEL[key]}</div>
            <div className="flex items-center gap-2">
              {[1,2,3,4,5].map(n=>(
                <button key={n} onClick={()=>set(key,n)} className={cx("w-9 h-9 rounded-lg border grid place-items-center text-sm", scores[key]===n ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-50")}>{n}</button>
              ))}
              <span className="text-xs text-gray-500 ml-2">(1–5)</span>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Comentarios</label>
        <textarea className="w-full min-h-[100px] p-3 rounded-xl border" value={comment} onChange={(e)=>setComment(e.target.value)} placeholder="Observaciones objetivas, ejemplos, acuerdos…" />
      </div>
      <div className="flex gap-2">
        <button onClick={save} className="px-4 py-2 rounded-full border hover:bg-gray-50">Guardar evaluación</button>
        <button onClick={()=>{ setScores({ productividad:3, colaboracion:3, bienestar:3, innovacion:3, ausentismo:3, cultura:3 }); setComment(""); }} className="px-4 py-2 rounded-full border hover:bg-gray-50">Limpiar</button>
      </div>
    </section>
  );
}

function FeedbackSBI({ onSave }) {
  const [to, setTo] = useState("");
  const [s, setS] = useState("");
  const [b, setB] = useState("");
  const [i, setI] = useState("");
  const [priv, setPriv] = useState(true);
  const save = () => { if(!to || !s || !b || !i) return alert("Completa todos los campos (SBI)."); onSave({ to, s, b, i, private: priv, createdAt: new Date().toISOString() }); alert("Feedback enviado."); };

  return (
    <section className="p-5 bg-white rounded-2xl border space-y-4">
      <h3 className="font-semibold">Feedback con método SBI</h3>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Para</label>
          <input className="w-full p-3 rounded-xl border" value={to} onChange={(e)=>setTo(e.target.value)} placeholder="Nombre o correo" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Privado</label>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={priv} onChange={(e)=>setPriv(e.target.checked)} />
            <span className="text-sm text-gray-600">Solo el receptor podrá verlo</span>
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Situación</label>
        <textarea className="w-full p-3 rounded-xl border" value={s} onChange={(e)=>setS(e.target.value)} placeholder="Cuándo/dónde ocurrió…" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Comportamiento</label>
        <textarea className="w-full p-3 rounded-xl border" value={b} onChange={(e)=>setB(e.target.value)} placeholder="Acción observable…" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Impacto</label>
        <textarea className="w-full p-3 rounded-xl border" value={i} onChange={(e)=>setI(e.target.value)} placeholder="Consecuencia en equipo/proyecto…" />
      </div>
      <div className="flex gap-2">
        <button onClick={save} className="px-4 py-2 rounded-full border hover:bg-gray-50">Enviar feedback</button>
        <button onClick={()=>{ setTo(""); setS(""); setB(""); setI(""); setPriv(true); }} className="px-4 py-2 rounded-full border hover:bg-gray-50">Limpiar</button>
      </div>
    </section>
  );
}

Actualización UI completa
