// === ZV Rewards Manager - App.jsx (completo) ===
// Incluye: selector evaluado, KPIs dinámicos, retos, recompensas,
// evaluación, feedback SBI, gráficas (Recharts), modo oscuro, toasts,
// confeti, racha diaria (streak) + badge "Constancia", leaderboard, export/import JSON.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// ---------- Utilidades ----------
const cx = (...c) => c.filter(Boolean).join(" ");
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const deepClone = (o) => JSON.parse(JSON.stringify(o));

// Helpers de fecha (para racha)
const toLocalYMD = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
const isSameLocalDay = (a, b) => a && b && toLocalYMD(a) === toLocalYMD(b);
const isYesterdayLocal = (a, b) => {
  if (!a || !b) return false;
  const ya = new Date(a), yb = new Date(b);
  const d = new Date(yb);
  d.setDate(d.getDate() - 1);
  return toLocalYMD(ya) === toLocalYMD(d);
};

// ---------- Constantes ----------
// === AJUSTES: Etiquetas de KPI ===
const KPI_KEYS = ["productividad", "colaboracion", "bienestar", "innovacion", "ausentismo", "cultura"];
const KPI_LABEL = {
  productividad: "Productividad digital",
  colaboracion: "Colaboración",
  bienestar: "Bienestar",
  innovacion: "Innovación",
  ausentismo: "Ausentismo digital (↓ es mejor)",
  cultura: "Cultura ZV (rotación / promociones / clima)",
};

// === AJUSTES: Plantilla de retos iniciales ===
const CHALLENGE_TPL = [
  { id: "c1", title: "+10% eficiencia de línea", desc: "Completa 3 mejoras de proceso.", kpi: "productividad", reward: 120, progress: 0, target: 3, status: "En progreso" },
  { id: "c2", title: "Reducir mermas a < 2%", desc: "Ejecuta 2 acciones correctivas.", kpi: "colaboracion",  reward: 90,  progress: 0, target: 2, status: "Pendiente" },
  { id: "c3", title: "Capacitación de seguridad", desc: "Completa el curso obligatorio.",  kpi: "bienestar",     reward: 60,  progress: 0, target: 1, status: "Pendiente" },
];

// === AJUSTES: Catálogo de recompensas ===
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

// === AJUSTES: Insignias disponibles ===
const BADGES = [
  { id: "b1", name: "Innovador ZV",  icon: "💡" },
  { id: "b2", name: "Colaborador",   icon: "🤝" },
  { id: "b3", name: "Bienestar",     icon: "🧘" },
  { id: "b4", name: "Productividad", icon: "⏱️" },
  { id: "b5", name: "Constancia",    icon: "🔥" }, // NUEVO (streak)
];

// === AJUSTES: Usuarios/evaluados iniciales ===
const DEFAULT_EMPLOYEES = {
  alex: {
    profile: { name: "Alex Ramírez", role: "Supervisor/a de Producción", avatar: "🙂" },
    level: 2,
    points: 420,
    badges: ["b4"],
    kpis: { productividad: 62, colaboracion: 48, bienestar: 40, innovacion: 35, ausentismo: 28, cultura: 72 },
    kpiHistory: [],
    challenges: deepClone(CHALLENGE_TPL),
    evaluations: [],
    feedback: [],
    streak: 0,
    lastCheckIn: null,
  },
  maria: {
    profile: { name: "María López", role: "Gerente de Calidad", avatar: "🧑‍🔧" },
    level: 3,
    points: 780,
    badges: ["b2", "b4"],
    kpis: { productividad: 70, colaboracion: 55, bienestar: 52, innovacion: 41, ausentismo: 22, cultura: 76 },
    kpiHistory: [],
    challenges: deepClone(CHALLENGE_TPL),
    evaluations: [],
    feedback: [],
    streak: 0,
    lastCheckIn: null,
  },
  jorge: {
    profile: { name: "Jorge Pérez", role: "Líder de Mantenimiento", avatar: "🧰" },
    level: 1,
    points: 180,
    badges: [],
    kpis: { productividad: 50, colaboracion: 44, bienestar: 38, innovacion: 30, ausentismo: 35, cultura: 65 },
    kpiHistory: [],
    challenges: deepClone(CHALLENGE_TPL),
    evaluations: [],
    feedback: [],
    streak: 0,
    lastCheckIn: null,
  },
};

// Storage keys
const STORAGE_KEY = "zv_rm_v2_employees";
const THEME_KEY = "zv_rm_theme"; // "light" | "dark"

// ---------- UI helpers ----------
const ProgressBar = ({ value }) => (
  <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
    <div className="h-2 rounded-full bg-gray-900 dark:bg-white" style={{ width: `${clamp(value, 0, 100)}%` }} />
  </div>
);
const Chip = ({ children }) => (
  <span className="px-3 py-1 rounded-full text-sm border bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100 border-gray-200 dark:border-gray-700">
    {children}
  </span>
);

// ---------- App ----------
export default function App() {
  // Tema (oscuro/ligero) persistente
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) || "light"; } catch { return "light"; }
  });
  useEffect(() => {
    try {
      const root = document.documentElement;
      if (theme === "dark") root.classList.add("dark"); else root.classList.remove("dark");
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme]);

  // Estado principal con persistencia
  const [employees, setEmployees] = useState(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) return JSON.parse(saved); } catch {}
    return deepClone(DEFAULT_EMPLOYEES);
  });
  const employeeIds = Object.keys(employees);
  const [currentId, setCurrentId] = useState(employeeIds[0] || "alex");
  const me = employees[currentId] || employees[employeeIds[0]];

  const [tab, setTab] = useState("inicio");
  const [searchReward, setSearchReward] = useState("");
  const [horizonFilter, setHorizonFilter] = useState("all");

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(employees)); } catch {}
  }, [employees]);

  // Nivelación: === AJUSTE: puntos por nivel ===
  const nextLevelAt = useMemo(() => (me.level + 1) * 500, [me.level]); // cambia 500 si quieres subir/bajar dificultad
  const progressToNext = useMemo(() => clamp((me.points / nextLevelAt) * 100, 0, 100), [me.points, nextLevelAt]);

  const mutate = (fn) =>
    setEmployees((prev) => {
      const next = deepClone(prev);
      fn(next[currentId]);
      return next;
    });

  // Confeti (import dinámico)
  const shootConfetti = async () => {
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({ particleCount: 120, spread: 65, origin: { y: 0.6 } });
    } catch {}
  };

  // Acciones principales
  const addPoints = async (n) => {
    let leveledUp = false;
    mutate((u) => {
      const prevLevel = u.level;
      u.points = Math.max(0, u.points + n);
      u.level = Math.floor(u.points / 500) + 1; // mismo 500 que arriba
      leveledUp = u.level > prevLevel;
    });
    if (n > 0) toast.success(`+${n} pts`);
    if (n < 0) toast(`-${Math.abs(n)} pts`, { icon: "↩️" });
    if (leveledUp) { toast.success("¡Subiste de nivel! 🎉"); await shootConfetti(); }
  };

  const pushKpiSnapshot = () =>
    mutate((u) => {
      const snapshot = { ts: Date.now(), ...u.kpis };
      if (!Array.isArray(u.kpiHistory)) u.kpiHistory = [];
      u.kpiHistory.push(snapshot);
      if (u.kpiHistory.length > 20) u.kpiHistory.shift();
    });

  const completeChallenge = async (id) => {
    const reward = me.challenges.find((c) => c.id === id)?.reward || 0; // calcula antes
    let completed = false;
    mutate((u) => {
      const c = u.challenges.find((x) => x.id === id);
      if (!c || c.progress >= c.target) return;
      c.progress += 1;
      if (c.progress >= c.target) {
        c.status = "Completado";
        completed = true;
        // === AJUSTE: impacto KPI por reto ===
        const inc = c.kpi === "ausentismo" ? -5 : 5;
        u.kpis[c.kpi] = clamp(u.kpis[c.kpi] + inc, 0, 100);
        u.kpis.cultura = clamp(u.kpis.cultura + 2, 0, 100);
        if (c.kpi === "innovacion" && !u.badges.includes("b1")) u.badges.push("b1");
      }
    });
    if (completed) {
      await addPoints(reward);
      pushKpiSnapshot();
      toast.success("Reto completado");
    } else {
      toast("Progreso registrado");
    }
  };

  const createChallenge = (payload) =>
    mutate((u) => {
      const id = `c_${Math.random().toString(36).slice(2, 8)}`;
      u.challenges.unshift({ id, progress: 0, status: "Pendiente", ...payload });
      toast.success("Reto creado");
    });

  const redeem = async (r) => {
    if (me.points < r.cost) return toast.error("Te faltan puntos.");
    await addPoints(-r.cost);
    toast.success(`Canjeaste: ${r.title}`);
  };

  const saveEvaluation = (payload) =>
    mutate((u) => {
      u.evaluations.push(payload);
      // === AJUSTE: sensibilidad de evaluación -> KPI ===
      KPI_KEYS.forEach((k) => {
        const s = payload.scores[k] ?? 3;
        let delta = (s - 3) * 4; // cambia "4" si quieres más/menos impacto
        if (k === "ausentismo") delta = -delta;
        u.kpis[k] = clamp(u.kpis[k] + delta, 0, 100);
      });
      u.kpis.cultura = clamp(u.kpis.cultura + 1, 0, 100);
      u.points = Math.max(0, u.points + 30);
      u.level = Math.floor(u.points / 500) + 1;
      pushKpiSnapshot();
      toast.success("Evaluación registrada");
    });

  const saveFeedback = (payload) =>
    mutate((u) => {
      u.feedback.unshift(payload);
      u.points = Math.max(0, u.points + 10);
      toast("Feedback enviado", { icon: "✉️" });
    });

  const resetCurrent = () =>
    setEmployees((prev) => {
      const next = deepClone(prev);
      next[currentId] = deepClone(DEFAULT_EMPLOYEES[currentId]);
      toast("Restaurado", { icon: "↩️" });
      return next;
    });

  // Check-in diario con racha y badge
  const dailyCheckIn = () => {
    let justChecked = false;
    setEmployees((prev) => {
      const next = deepClone(prev);
      const u = next[currentId];
      const now = new Date();
      const last = u.lastCheckIn ? new Date(u.lastCheckIn) : null;

      if (isSameLocalDay(last, now)) {
        toast("Ya registraste tu check-in hoy", { icon: "📅" });
        return prev;
      }
      // === AJUSTE: reglas de racha (ayer => +1; si no => 1)
      if (isYesterdayLocal(last, now)) u.streak = (u.streak || 0) + 1;
      else u.streak = 1;

      u.lastCheckIn = now.toISOString();

      // === AJUSTE: recompensas por racha
      let reward = 10;           // base diaria
      if (u.streak === 5) reward += 20;
      if (u.streak === 10) reward += 50;
      u.points = Math.max(0, u.points + reward);
      u.level = Math.floor(u.points / 500) + 1;

      // === AJUSTE: umbral de badge "Constancia"
      if (u.streak >= 7 && !u.badges.includes("b5")) {
        u.badges.push("b5");
        toast.success("¡Logro desbloqueado: Constancia! 🔥");
      }

      justChecked = true;
      return next;
    });

    if (justChecked) {
      pushKpiSnapshot();
      toast.success("Check-in diario registrado");
    }
  };

  // Export/Import JSON
  const fileRef = useRef(null);
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(employees[currentId], null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${me.profile.name.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Exportado JSON", { icon: "💾" });
  };
  const importJSON = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        setEmployees((prev) => {
          const next = deepClone(prev);
          if (!data || !data.profile || !data.kpis) throw new Error("Formato inválido");
          next[currentId] = data;
          return next;
        });
        toast.success("Datos importados");
      } catch (e) {
        toast.error("No se pudo importar: " + e.message);
      }
    };
    reader.readAsText(file);
  };

  // Filtro de recompensas
  const rewardsFiltered = REWARDS.filter((r) => {
    const byText = r.title.toLowerCase().includes(searchReward.toLowerCase());
    const byH = horizonFilter === "all" ? true : r.horizon.startsWith(horizonFilter);
    return byText && byH;
  });

  // Datos de gráfica
  const chartData = useMemo(() => {
    const hist = Array.isArray(me.kpiHistory) ? me.kpiHistory : [];
    const now = { ts: Date.now(), ...me.kpis };
    const all = [...hist, now];
    return all.slice(-10).map((d, i) => ({ name: `${i + 1}`, ...d }));
  }, [me.kpiHistory, me.kpis]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50 transition-colors">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center gap-3">
          <div className="mr-auto">
            <h1 className="text-2xl font-semibold">ZV Rewards Manager</h1>
            <div className="text-sm text-gray-500 dark:text-gray-400">Programa de Recompensa Total · Zefiv Fizz</div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-medium">{me.profile.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{me.profile.role}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 grid place-items-center">{me.profile.avatar}</div>

            <select
              className="px-3 py-2 rounded-full border text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              value={currentId}
              onChange={(e) => setCurrentId(e.target.value)}
              aria-label="Cambiar evaluado"
            >
              {employeeIds.map((id) => (
                <option key={id} value={id}>{employees[id].profile.name}</option>
              ))}
            </select>

            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="px-3 py-2 rounded-full border text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
              {theme === "dark" ? "☀️ Claro" : "🌙 Oscuro"}
            </button>

            <button onClick={resetCurrent} className="px-3 py-2 rounded-full border text-sm hover:bg-gray-50 dark:hover:bg-gray-800">Restaurar</button>
            <button onClick={exportJSON} className="px-3 py-2 rounded-full border text-sm hover:bg-gray-50 dark:hover:bg-gray-800">Exportar JSON</button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importJSON(e.target.files[0])} />
            <button onClick={() => fileRef.current?.click()} className="px-3 py-2 rounded-full border text-sm hover:bg-gray-50 dark:hover:bg-gray-800">Importar JSON</button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="max-w-6xl mx-auto px-4 pb-4 flex flex-wrap items-center gap-2">
          {[
            { id: "inicio", label: "Inicio" },
            { id: "retos", label: "Retos" },
            { id: "recompensas", label: "Recompensas" },
            { id: "evaluacion", label: "Evaluación" },
            { id: "sbi", label: "Feedback SBI" },
            { id: "analytics", label: "Analytics EPM" },
            { id: "ranking", label: "Ranking" }, // NUEVO
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cx(
                "px-4 py-2 rounded-full border text-sm",
                tab === t.id
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              {t.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <Chip>Lvl {me.level}</Chip>
            <Chip>{me.points} pts</Chip>
          </div>
        </nav>
      </header>

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Inicio */}
        {tab === "inicio" && (
          <section className="grid md:grid-cols-3 gap-4">
            <div className="p-5 bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Progreso al siguiente nivel</div>
              <ProgressBar value={progressToNext} />
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">{progressToNext.toFixed(0)}%</div>
            </div>

            <div className="p-5 bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800">
              <div className="text-sm text-gray-500 dark:text-gray-400">Evaluaciones enviadas</div>
              <div className="text-2xl font-semibold">{me.evaluations.length}</div>
            </div>

            <div className="p-5 bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800">
              <div className="text-sm text-gray-500 dark:text-gray-400">Feedbacks (SBI)</div>
              <div className="text-2xl font-semibold">{me.feedback.length}</div>
            </div>

            {/* KPIs */}
            <div className="md:col-span-2 p-5 bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">KPIs</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">(0–100)</span>
              </div>
              <div className="space-y-4">
                {KPI_KEYS.map((k) => (
                  <div key={k}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-700 dark:text-gray-200">{KPI_LABEL[k]}</span>
                      <span className={cx("font-semibold", k === "ausentismo" ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white")}>
                        {me.kpis[k]}
                      </span>
                    </div>
                    <ProgressBar value={me.kpis[k]} />
                  </div>
                ))}
              </div>
            </div>

            {/* Gráfica */}
            <div className="p-5 bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold mb-3">Tendencia (muestras recientes)</h3>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="productividad" dot={false} />
                    <Line type="monotone" dataKey="colaboracion" dot={false} />
                    <Line type="monotone" dataKey="bienestar" dot={false} />
                    <Line type="monotone" dataKey="innovacion" dot={false} />
                    <Line type="monotone" dataKey="ausentismo" dot={false} />
                    <Line type="monotone" dataKey="cultura" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Insignias */}
            <div className="p-5 bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold mb-3">Insignias</h3>
              <div className="flex flex-wrap gap-2">
                {BADGES.map((b) => (
                  <span
                    key={b.id}
                    className={cx(
                      "px-3 py-2 rounded-xl border text-sm flex items-center gap-2",
                      me.badges.includes(b.id)
                        ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700"
                        : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-60"
                    )}
                  >
                    <span className="text-lg">{b.icon}</span>
                    {b.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Racha diaria */}
            <div className="p-5 bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800">
              <div className="text-sm text-gray-500 dark:text-gray-400">Racha (check-in diario)</div>
              <div className="text-2xl font-semibold">{me.streak || 0} días</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Último: {me.lastCheckIn ? toLocalYMD(me.lastCheckIn) : "—"}
              </div>
              <button
                onClick={dailyCheckIn}
                className="mt-3 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Hacer check-in hoy
              </button>
            </div>
          </section>
        )}

        {/* Retos */}
        {tab === "retos" && (
          <section className="grid md:grid-cols-2 gap-4">
            <div className="p-5 bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Retos Activos</h3>
                <CreateChallengeForm onCreate={createChallenge} />
              </div>
              <div className="space-y-3">
                {me.challenges.map((c) => {
                  const done = c.progress >= c.target;
                  const pct = (c.progress / c.target) * 100;
                  return (
                    <div key={c.id} className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{c.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{c.desc}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cx(
                              "px-2 py-1 rounded-full text-xs border",
                              c.status === "Completado"
                                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
                                : c.status === "En progreso"
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                                : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700"
                            )}
                          >
                            {c.status}
                          </span>
                          <button
                            onClick={() => completeChallenge(c.id)}
                            disabled={done}
                            className={cx("px-3 py-2 rounded-lg text-sm border hover:bg-gray-50 dark:hover:bg-gray-800",
                              done && "opacity-50 cursor-not-allowed")}
                          >
                            Progresar
                          </button>
                        </div>
                      </div>
                      <div className="mt-3">
                        <ProgressBar value={pct} />
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {c.progress}/{c.target} · KPI: <b>{KPI_LABEL[c.kpi]}</b> · Recompensa: <b>{c.reward} pts</b>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold mb-3">Indicadores & Premios</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-sm bg-white dark:bg-gray-900">Badge: ZV Safety</div>
                <div className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-sm bg-white dark:bg-gray-900">Vales $500</div>
                <div className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-sm bg-white dark:bg-gray-900">Mentoría</div>
              </div>
            </div>
          </section>
        )}

        {/* Recompensas */}
        {tab === "recompensas" && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 w-full bg-white dark:bg-gray-900"
                placeholder="Buscar recompensa…"
                value={searchReward}
                onChange={(e) => setSearchReward(e.target.value)}
              />
              <select
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
                value={horizonFilter}
                onChange={(e) => setHorizonFilter(e.target.value)}
              >
                <option value="all">Todos los horizontes</option>
                <option value="Corto">Corto</option>
                <option value="Mediano">Mediano</option>
                <option value="Largo">Largo</option>
              </select>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {["Corto (<3m)", "Mediano (3–6m)", "Largo (6–12m)"].map((group) => (
                <div key={group} className="p-5 bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800">
                  <h3 className="font-semibold mb-1">
                    {group === "Corto (<3m)" ? "Corto plazo (<3m)" : group === "Mediano (3–6m)" ? "Mediano plazo (3–6m)" : "Largo plazo (6–12m)"}
                  </h3>
                  <ul className="list-disc ml-5 text-sm space-y-1">
                    {rewardsFiltered.filter((r) => r.horizon === group).map((r) => (
                      <li key={r.id} className="flex items-center justify-between">
                        <span>{r.title}</span>
                        <button onClick={() => redeem(r)} className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                          Canjear ({r.cost})
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Evaluación */}
        {tab === "evaluacion" && <EvaluationForm onSave={saveEvaluation} />}

        {/* Feedback SBI */}
        {tab === "sbi" && <FeedbackSBI onSave={saveFeedback} />}

        {/* Analytics */}
        {tab === "analytics" && (
          <section className="p-5 bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-3">
            <h3 className="font-semibold">Analytics EPM (demo)</h3>
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">Clima (aprobación): <b>90%</b></div>
              <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">Rotación (áreas críticas): <b>↓15%</b></div>
              <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">Promociones internas: <b>75%</b></div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Conectar a datos reales vía API/Firebase cuando esté listo.</div>
          </section>
        )}

        {/* Ranking */}
        {tab === "ranking" && (
          <section className="p-5 bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-3">
            <h3 className="font-semibold">Leaderboard</h3>
            <Leaderboard employees={employees} currentId={currentId} />
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Sube posiciones completando retos, manteniendo rachas y canjeando estratégicamente.
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// ---------- Subcomponentes ----------
function CreateChallengeForm({ onCreate }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", desc: "", kpi: "productividad", reward: 50, target: 1 });

  const submit = () => {
    if (!form.title) return toast.error("Pon un título al reto.");
    onCreate(form);
    setOpen(false);
    setForm({ title: "", desc: "", kpi: "productividad", reward: 50, target: 1 });
  };

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
        + Crear reto
      </button>
    );

  return (
    <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
      <div className="grid md:grid-cols-2 gap-2">
        <input className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900" placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <select className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900" value={form.kpi} onChange={(e) => setForm({ ...form, kpi: e.target.value })}>
          {KPI_KEYS.map((k) => (<option key={k} value={k}>{KPI_LABEL[k]}</option>))}
        </select>
        <input className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 md:col-span-2" placeholder="Descripción (opcional)" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
        <input type="number" className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900" placeholder="Meta (target)" value={form.target} min={1} onChange={(e) => setForm({ ...form, target: Math.max(1, Number(e.target.value || 1)) })} />
        <input type="number" className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900" placeholder="Recompensa (pts)" value={form.reward} min={0} onChange={(e) => setForm({ ...form, reward: Math.max(0, Number(e.target.value || 0)) })} />
      </div>
      <div className="mt-2 flex gap-2">
        <button onClick={submit} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800">Guardar</button>
        <button onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800">Cancelar</button>
      </div>
    </div>
  );
}

function EvaluationForm({ onSave }) {
  const [type, setType] = useState("Autoevaluación");
  const [scores, setScores] = useState({ productividad: 3, colaboracion: 3, bienestar: 3, innovacion: 3, ausentismo: 3, cultura: 3 });
  const [comment, setComment] = useState("");

  const set = (k, v) => setScores((s) => ({ ...s, [k]: v }));
  const save = () => { onSave({ type, scores, comment, createdAt: new Date().toISOString() }); };

  return (
    <section className="p-5 bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Evaluación</h3>
        <select className="px-3 py-2 rounded-full border border-gray-200 dark:border-gray-800 text-sm bg-white dark:bg-gray-900" value={type} onChange={(e) => setType(e.target.value)}>
          {["Autoevaluación","Coevaluación","Evaluación de líder/gerente"].map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {KPI_KEYS.map((key) => (
          <div key={key} className="p-3 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="text-sm font-medium mb-1">{KPI_LABEL[key]}</div>
            <div className="flex items-center gap-2">
              {[1,2,3,4,5].map((n) => (
                <button
                  key={n}
                  onClick={() => set(key, n)}
                  className={cx(
                    "w-9 h-9 rounded-lg border grid place-items-center text-sm",
                    "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900",
                    scores[key] === n ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  {n}
                </button>
              ))}
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(1–5)</span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Comentarios</label>
        <textarea className="w-full min-h-[100px] p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
          value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Observaciones, ejemplos, acuerdos…" />
      </div>

      <div className="flex gap-2">
        <button onClick={save} className="px-4 py-2 rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
          Guardar evaluación
        </button>
        <button
          onClick={() => { setScores({ productividad:3, colaboracion:3, bienestar:3, innovacion:3, ausentismo:3, cultura:3 }); setComment(""); }}
          className="px-4 py-2 rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
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
    if (!to || !s || !b || !i) return toast.error("Completa todos los campos (SBI).");
    onSave({ to, s, b, i, private: priv, createdAt: new Date().toISOString() });
  };

  return (
    <section className="p-5 bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4">
      <h3 className="font-semibold">Feedback con método SBI</h3>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Para</label>
          <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Nombre o correo" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Privado</label>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={priv} onChange={(e) => setPriv(e.target.checked)} />
            <span className="text-sm text-gray-600 dark:text-gray-300">Solo el receptor podrá verlo</span>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Situación</label>
        <textarea className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900" value={s} onChange={(e) => setS(e.target.value)} placeholder="Cuándo/dónde ocurrió…" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Comportamiento</label>
        <textarea className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900" value={b} onChange={(e) => setB(e.target.value)} placeholder="Acción observable…" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Impacto</label>
        <textarea className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900" value={i} onChange={(e) => setI(e.target.value)} placeholder="Consecuencia en equipo/proyecto…" />
      </div>

      <div className="flex gap-2">
        <button onClick={save} className="px-4 py-2 rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
          Enviar feedback
        </button>
        <button onClick={() => { setTo(""); setS(""); setB(""); setI(""); setPriv(true); }} className="px-4 py-2 rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
          Limpiar
        </button>
      </div>
    </section>
  );
}

function Leaderboard({ employees, currentId }) {
  const data = Object.entries(employees)
    .map(([id, u]) => ({ id, name: u.profile?.name || id, points: u.points || 0, badges: u.badges || [] }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);

  const medal = (idx) => (idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`);

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-800 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {data.map((row, i) => (
        <div
          key={row.id}
          className={cx(
            "flex items-center justify-between px-4 py-3",
            row.id === currentId ? "bg-amber-50/60 dark:bg-amber-900/20" : "bg-white dark:bg-gray-950"
          )}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl w-8 text-center">{medal(i)}</span>
            <div>
              <div className="font-medium">{row.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Insignias: {row.badges.length}</div>
            </div>
          </div>
          <div className="text-sm"><b>{row.points}</b> pts</div>
        </div>
      ))}
    </div>
  );
}


