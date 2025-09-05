import React, { useEffect, useMemo, useState } from "react";

/**
 * ZV Rewards Manager (versión mejorada)
 * - Selector de evaluado (múltiples perfiles)
 * - KPIs, puntos y nivel se actualizan por retos/evaluaciones/canje
 * - Persistencia en localStorage por usuario
 * - Botón para restaurar datos del evaluado actual
 * - Vite + React + Tailwind (sin libs externas)
 */

const cx = (...c) => c.filter(Boolean).join(" ");
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const deepClone = (o) => JSON.parse(JSON.stringify(o));

const KPI_KEYS = ["productividad", "colaboracion", "bienestar", "innovacion", "ausentismo", "cultura"];
const KPI_LABEL = {
  productividad: "Productividad digital",
  colaboracion: "Colaboración",
  bienestar: "Bienestar",
  innovacion: "Innovación",
  ausentismo: "Ausentismo digital (↓ es mejor)",
  cultura: "Cultura ZV (rotación / promociones / clima)",
};

// Plantilla de retos
const CHALLENGE_TPL = [
  { id: "c1", title: "+10% eficiencia de línea", desc: "Completa 3 mejoras de proceso.", kpi: "productividad", reward: 120, progress: 0, target: 3, status: "En progreso" },
  { id: "c2", title: "Reducir mermas a < 2%", desc: "Ejecuta 2 acciones correctivas.", kpi: "colaboracion",  reward: 90,  progress: 0, target: 2, status: "Pendiente" },
  { id: "c3", title: "Capacitación de seguridad", desc: "Completa el curso obligatorio.",  kpi: "bienestar",     reward: 60,  progress: 0, target: 1, status: "Pendiente" },
];

const REWARDS = [
  { id: "r1", title: "Gift cards / vales",            type: "No financiera", cost: 250,  horizon: "Corto (<3m)"   },
  { id: "r2", title: "Badge \"Innovador ZV\"",        type: "No financiera", cost: 120,  horizon: "Corto (<3m)"   },
  { id: "r3", title: "Bono trimestral ligado a KPIs", type: "Financiera",    cost: 650,  horizon: "Mediano (3–6m)"},
  { id: "r4", title: "Día libre",                     type: "No financiera", cost: 400,  horizon: "Mediano (3–6m)"},
  { id: "r5", title: "Mentoría interna",              type: "No financiera", cost: 350,  horizon: "Mediano (3–6m)"},
  { id: "r6", title: "Incremento salarial/utilidades",type: "Financiera",    cost: 1500, horizon: "Largo (6–12m)" },
  { id: "r7", title: "Promoción interna",             type: "No financiera", cost: 1000, horizon: "Largo (6–12m)" },
  { id: "r8", title: "Membresía de bienestar",        type: "No financiera", cost: 900,  horizon: "Largo (6–12m)" },
];

const BADGES = [
  { id: "b1", name: "Innovador ZV",  icon: "💡" },
  { id: "b2", name: "Colaborador",   icon: "🤝" },
  { id: "b3", name: "Bienestar",     icon: "🧘" },
  { id: "b4", name: "Productividad", icon: "⏱️" },
];

// Datos iniciales por evaluado
const DEFAULT_EMPLOYEES = {
  alex: {
    profile: { name: "Alex Ramírez", role: "Supervisor/a de Producción", avatar: "🙂" },
    level: 2,
    points: 420,
    badges: ["b4"],
    kpis: { productividad: 62, colaboracion: 48, bienestar: 40, innovacion: 35, ausentismo: 28, cultura: 72 },
    challenges: deepClone(CHALLENGE_TPL),
    evaluations: [],
    feedback: [],
  },
  maria: {
    profile: { name: "María López", role: "Gerente de Calidad", avatar: "🧑‍🔧" },
    level: 3,
    points: 780,
    badges: ["b2", "b4"],
    kpis: { productividad: 70, colaboracion: 55, bienestar: 52, innovacion: 41, ausentismo: 22, cultura: 76 },
    challenges: deepClone(CHALLENGE_TPL),
    evaluations: [],
    feedback: [],
  },
  jorge: {
    profile: { name: "Jorge Pérez", role: "Líder de Mantenimiento", avatar: "🧰" },
    level: 1,
    points: 180,
    badges: [],
    kpis: { productividad: 50, colaboracion: 44, bienestar: 38, innovacion: 30, ausentismo: 35, cultura: 65 },
    challenges: deepClone(CHALLENGE_TPL),
    evaluations: [],
    feedback: [],
  },
};

const STORAGE_KEY = "zv_rm_v2_employees";

const ProgressBar = ({ value }) => (
  <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
    <div className="h-2 rounded-full bg-gray-900" style={{ width: `${clamp(value, 0, 100)}%` }} />
  </div>
);

const Pill = ({ children }) => (
  <span className="px-3 py-1 rounded-full text-sm border bg-white text-gray-700 border-gray-200">{children}</span>
);

export default function App() {
  // Carga segura desde localStorage solo en navegador
  const [employees, setEmployees] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      }
    } catch (_) {}
    return deepClone(DEFAULT_EMPLOYEES);
  });
  const employeeIds = Object.keys(employees);
  const [tab, setTab] = useState("inicio");
  const [currentId, setCurrentId] = useState(employeeIds[0] || "alex");

  // Persistencia
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
      }
    } catch (_) {}
  }, [employees]);

  const me = employees[currentId] || employees[employeeIds[0]];

  const nextLevelAt = useMemo(() => (me.level + 1) * 500, [me.level]);
  const progressToNext = useMemo(() => clamp((me.points / nextLevelAt) * 100, 0, 100), [me.points, nextLevelAt]);

  const mutate = (fn) =>
    setEmployees((prev) => {
      const next = deepClone(prev);
      fn(next[currentId]);
      return next;
    });

  const addPoints = (n) =>
    mutate((u) => {
      u.points = Math.max(0, u.points + n);
      u.level = Math.floor(u.points / 500) + 1;
    });

  const completeChallenge = (id) =>
    mutate((u) => {
      const c = u.challenges.find((x) => x.id === id);
      if (!c) return;
      if (c.progress >= c.target) return;
      c.progress += 1;
      if (c.progress >= c.target) {
        c.status = "Completado";
        addPoints(c.reward);
        // Ajuste KPI (ausentismo baja, el resto sube)
        const k = c.kpi;
        const inc = k === "ausentismo" ? -5 : 5;
        u.kpis[k] = clamp(u.kpis[k] + inc, 0, 100);
        u.kpis.cultura = clamp(u.kpis.cultura + 2, 0, 100);
        if (k === "innovacion" && !u.badges.includes("b1")) u.badges.push("b1");
      }
    });

  const redeem = (r) => {
    if (me.points < r.cost) return alert("Te faltan puntos.");
    addPoints(-r.cost);
    alert("Canjeaste: " + r.title);
  };

  const saveEvaluation = (payload) =>
    mutate((u) => {
      u.evaluations.push(payload);
      // Efecto en KPIs basado en evaluación (centra en 3)
      KPI_KEYS.forEach((k) => {
        const s = payload.scores[k]; // 1..5
        if (!s) return;
        let delta = (s - 3) * 4; // escala suave
        if (k === "ausentismo") delta = -delta; // 1=peor (↑ ausentismo), 5=mejor (↓ ausentismo)
        u.kpis[k] = clamp(u.kpis[k] + delta, 0, 100);
      });
      u.kpis.cultura = clamp(u.kpis.cultura + 1, 0, 100);
      u.points = Math.max(0, u.points + 30);
      u.level = Math.floor(u.points / 500) + 1;
    });

  const saveFeedback = (payload) =>
    mutate((u) => {
      u.feedback.unshift(payload);
      u.points = Math.max(0, u.points + 10);
    });

  const resetCurrent = () =>
    setEmployees((prev) => {
      const next = deepClone(prev);
      next[currentId] = deepClone(DEFAULT_EMPLOYEES[currentId]);
      return next;
    });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center gap-3">
          <div className="mr-auto">
            <h1 className="text-2xl font-semibold">ZV Rewards Manager</h1>
            <div className="text-sm text-gray-500">Programa de Recompensa Total · Zefiv Fizz</div>
          </div>

          {/* Selector de evaluado */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-medium">{me.profile.name}</div>
              <div className="text-xs text-gray-500">{me.profile.role}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-100 grid place-items-center">{me.profile.avatar}</div>
            <select
              className="px-3 py-2 rounded-full border text-sm bg-white"
              value={currentId}
              onChange={(e) => setCurrentId(e.target.value)}
              aria-label="Cambiar evaluado"
            >
              {employeeIds.map((id) => (
                <option key={id} value={id}>
                  {employees[id].profile.name}
                </option>
              ))}
            </select>
            <button onClick={resetCurrent} className="px-3 py-2 rounded-full border text-sm hover:bg-gray-50">
              Restaurar
            </button>
          </div>
        </div>

        {/* Píldoras de navegación */}
        <nav className="max-w-6xl mx-auto px-4 pb-4 flex flex-wrap items-center gap-2">
          {[
            { id: "inicio", label: "Inicio" },
            { id: "retos", label: "Retos" },
            { id: "recompensas", label: "Recompensas" },
            { id: "evaluacion", label: "Evaluación" },
            { id: "sbi", label: "Feedback SBI" },
            { id: "analytics", label: "Analytics EPM" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cx(
                "px-4 py-2 rounded-full border text-sm",
                tab === t.id ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              )}
            >
              {t.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <Pill>Lvl {me.level}</Pill>
            <Pill>{me.points} pts</Pill>
          </div>
        </nav>
      </header>

      {/* Contenido */}
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
              <div className="text-2xl font-semibold">{me.evaluations.length}</div>
            </div>
            <div className="p-5 bg-white rounded-2xl border">
              <div className="text-sm text-gray-500">Feedbacks (SBI)</div>
              <div className="text-2xl font-semibold">{me.feedback.length}</div>
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
                      <span className={cx("font-semibold", k === "ausentismo" ? "text-emerald-700" : "text-gray-900")}>{me.kpis[k]}</span>
                    </div>
                    <ProgressBar value={me.kpis[k]} />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border">
              <h3 className="font-semibold mb-3">Insignias</h3>
              <div className="flex flex-wrap gap-2">
                {BADGES.map((b) => (
                  <span
                    key={b.id}
                    className={cx(
                      "px-3 py-2 rounded-xl border text-sm flex items-center gap-2",
                      me.badges.includes(b.id) ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200 opacity-60"
                    )}
                  >
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
                {me.challenges.map((c) => {
                  const done = c.progress >= c.target;
                  return (
                    <div key={c.id} className="p-3 rounded-xl border flex items-center justify-between">
                      <div>
                        <div className="font-medium">{c.title}</div>
                        <div className="text-xs text-gray-500">{c.desc}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cx(
                            "px-2 py-1 rounded-full text-xs border",
                            c.status === "Completado"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : c.status === "En progreso"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-gray-50 text-gray-700 border-gray-200"
                          )}
                        >
                          {c.status}
                        </span>
                        <button
                          onClick={() => completeChallenge(c.id)}
                          disabled={done}
                          className={cx("px-3 py-2 rounded-lg text-sm border", done ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50")}
                        >
                          Progresar
                        </button>
                      </div>
                    </div>
                  );
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
            {["Corto (<3m)", "Mediano (3–6m)", "Largo (6–12m)"].map((group) => (
              <div key={group} className="p-5 bg-white rounded-2xl border">
                <h3 className="font-semibold mb-1">
                  {group === "Corto (<3m)" ? "Corto plazo (<3m)" : group === "Mediano (3–6m)" ? "Mediano plazo (3–6m)" : "Largo plazo (6–12m)"}
                </h3>
                <ul className="list-disc ml-5 text-sm space-y-1">
                  {REWARDS.filter((r) => r.horizon === group).map((r) => (
                    <li key={r.id} className="flex items-center justify-between">
                      <span>{r.title}</span>
                      <button onClick={() => redeem(r)} className="text-xs px-2 py-1 rounded-lg border hover:bg-gray-50">
                        Canjear
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {tab === "evaluacion" && <EvaluationForm onSave={saveEvaluation} />}
        {tab === "sbi" && <FeedbackSBI onSave={saveFeedback} />}

        {tab === "analytics" && (
          <section className="p-5 bg-white rounded-2xl border space-y-3">
            <h3 className="font-semibold">Analytics EPM (demo)</h3>
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              <div className="p-3 rounded-xl border">Clima (aprobación): <b>90%</b></div>
              <div className="p-3 rounded-xl border">Rotación (áreas críticas): <b>↓15%</b></div>
              <div className="p-3 rounded-xl border">Promociones internas: <b>75%</b></div>
            </div>
            <div className="text-xs text-gray-500">Conectar a datos reales vía API/Firebase cuando esté listo.</div>
          </section>
        )}
      </main>
    </div>
  );
}

/* ---------- Formularios ---------- */

function EvaluationForm({ onSave }) {
  const [type, setType] = useState("Autoevaluación");
  const [scores, setScores] = useState({ productividad: 3, colaboracion: 3, bienestar: 3, innovacion: 3, ausentismo: 3, cultura: 3 });
  const [comment, setComment] = useState("");

  const set = (k, v) => setScores((s) => ({ ...s, [k]: v }));
  const save = () => {
    onSave({ type, scores, comment, createdAt: new Date().toISOString() });
    alert("Evaluación registrada.");
  };

  return (
    <section className="p-5 bg-white rounded-2xl border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Evaluación</h3>
        <select className="px-3 py-2 rounded-full border text-sm" value={type} onChange={(e) => setType(e.target.value)}>
          {["Autoevaluación", "Coevaluación", "Evaluación de líder/gerente"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {KPI_KEYS.map((key) => (
          <div key={key} className="p-3 rounded-xl border">
            <div className="text-sm font-medium mb-1">{KPI_LABEL[key]}</div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => set(key, n)}
                  className={cx("w-9 h-9 rounded-lg border grid place-items-center text-sm", scores[key] === n ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-50")}
                >
                  {n}
                </button>
              ))}
              <span className="text-xs text-gray-500 ml-2">(1–5)</span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Comentarios</label>
        <textarea className="w-full min-h-[100px] p-3 rounded-xl border" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Observaciones, ejemplos, acuerdos…" />
      </div>

      <div className="flex gap-2">
        <button onClick={save} className="px-4 py-2 rounded-full border hover:bg-gray-50">
          Guardar evaluación
        </button>
        <button
          onClick={() => {
            setScores({ productividad: 3, colaboracion: 3, bienestar: 3, innovacion: 3, ausentismo: 3, cultura: 3 });
            setComment("");
          }}
          className="px-4 py-2 rounded-full border hover:bg-gray-50"
        >
          Limpiar
        </button>
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

  const save = () => {
    if (!to || !s || !b || !i) return alert("Completa todos los campos (SBI).");
    onSave({ to, s, b, i, private: priv, createdAt: new Date().toISOString() });
    alert("Feedback enviado.");
  };

  return (
    <section className="p-5 bg-white rounded-2xl border space-y-4">
      <h3 className="font-semibold">Feedback con método SBI</h3>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Para</label>
          <input className="w-full p-3 rounded-xl border" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Nombre o correo" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Privado</label>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={priv} onChange={(e) => setPriv(e.target.checked)} />
            <span className="text-sm text-gray-600">Solo el receptor podrá verlo</span>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Situación</label>
        <textarea className="w-full p-3 rounded-xl border" value={s} onChange={(e) => setS(e.target.value)} placeholder="Cuándo/dónde ocurrió…" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Comportamiento</label>
        <textarea className="w-full p-3 rounded-xl border" value={b} onChange={(e) => setB(e.target.value)} placeholder="Acción observable…" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Impacto</label>
        <textarea className="w-full p-3 rounded-xl border" value={i} onChange={(e) => setI(e.target.value)} placeholder="Consecuencia en equipo/proyecto…" />
      </div>

      <div className="flex gap-2">
        <button onClick={save} className="px-4 py-2 rounded-full border hover:bg-gray-50">
          Enviar feedback
        </button>
        <button
          onClick={() => {
            setTo("");
            setS("");
            setB("");
            setI("");
            setPriv(true);
          }}
          className="px-4 py-2 rounded-full border hover:bg-gray-50"
        >
          Limpiar
        </button>
      </div>
    </section>
  );
}


