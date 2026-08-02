import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard, BarChart3, Globe2, Shield, LogOut, ChevronLeft, ChevronRight, Search,
  ChevronUp, ChevronDown, Sparkles, Send, Minus, Maximize2, Trash2, Palette, Activity,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { clearCareerPilotSession, getHydratedCareerPilotSession } from "@/lib/auth-persistence";

export const Route = createFileRoute("/workspace")({
  head: () => ({ meta: [{ title: "Workspace — Aether" }, { name: "description", content: "Aether enterprise workspace." }] }),
  component: Workspace,
});

type Tab = "overview" | "analytics" | "network" | "identity";
type AccentKey = "amethyst" | "emerald" | "amber";
const ACCENTS: Record<AccentKey, { from: string; to: string; glow: string; label: string }> = {
  amethyst: { from: "#6366F1", to: "#4F46E5", glow: "99,102,241", label: "Royal Amethyst" },
  emerald:  { from: "#34D399", to: "#10B981", glow: "16,185,129", label: "Emerald Mint" },
  amber:    { from: "#FBBF24", to: "#F59E0B", glow: "245,158,11", label: "Cosmic Amber" },
};

type ChatMsg = { id: string; role: "user" | "bot"; text: string };
const KB: { keys: RegExp; reply: string }[] = [
  { keys: /\b(hi|hello|hey)\b/i, reply: "Welcome back. I can summarize **revenue**, **latency**, recent **activity**, or walk you through the **modules**." },
  { keys: /\b(revenue|earn|income)\b/i, reply: "Revenue is tracking +12.4% week-over-week. Open the *Overview* module for the live sparkline." },
  { keys: /\b(latency|speed|perf)\b/i, reply: "Global P50 latency is currently in the 32–50 ms band across our 14 PoPs. No SLA breaches in the last 7 days." },
  { keys: /\b(security|access|role|permission)\b/i, reply: "Open **Identity Settings** to review roles. Click any row's status pill to instantly suspend or reactivate access." },
  { keys: /\b(theme|color|accent)\b/i, reply: "Use **System Controls** to swap the accent — Amethyst, Emerald, or Amber. The change propagates across the entire workspace instantly." },
  { keys: /\b(help|support)\b/i, reply: "I can navigate you to a module — try asking for *overview*, *analytics*, *network*, or *identity*." },
];
const md = (s: string) => s
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  .replace(/\*([^*]+)\*/g, "<em>$1</em>")
  .replace(/\n/g, "<br/>");
const reply = (q: string) => KB.find((k) => k.keys.test(q))?.reply ?? "Got it. I'll surface relevant context from your workspace shortly.";

function Workspace() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [accent, setAccent] = useState<AccentKey>(() => (localStorage.getItem("aether-accent") as AccentKey) ?? "amethyst");

  // Auth gate
  useEffect(() => {
    getHydratedCareerPilotSession().then((s) => {
      if (!s) { navigate({ to: "/login" }); return; }
      const md0 = (s.user.user_metadata ?? {}) as { full_name?: string };
      setUser({ email: s.user.email ?? "you@aether.dev", name: md0.full_name ?? s.user.email?.split("@")[0] ?? "Operator" });
    });
  }, [navigate]);

  // Apply accent CSS vars
  useEffect(() => {
    const a = ACCENTS[accent];
    document.documentElement.style.setProperty("--ac-from", a.from);
    document.documentElement.style.setProperty("--ac-to", a.to);
    document.documentElement.style.setProperty("--ac-glow", a.glow);
    localStorage.setItem("aether-accent", accent);
  }, [accent]);

  const logout = async () => {
    clearCareerPilotSession();
    await supabase.auth.signOut();
    toast.success("Signed out.");
    navigate({ to: "/" });
  };

  if (!user) {
    return <div className="fixed inset-0 grid place-items-center bg-[#09090B] text-[#A1A1AA] z-[60]">Loading workspace…</div>;
  }

  return (
    <div data-theme-surface="dark" className="aether-ws fixed inset-0 z-[60] flex bg-[#09090B] text-[#FAFAFA] overflow-hidden">
      <style>{wsStyles}</style>

      {/* Sidebar */}
      <aside className={`relative flex flex-col border-r border-[#1c1c20] bg-[#0c0c0e] transition-[width] duration-500 ${collapsed ? "w-[72px]" : "w-[248px]"}`}>
        <div className="flex items-center gap-3 px-4 h-16 border-b border-[#1c1c20]">
          <span className="relative grid place-items-center size-9 rounded-xl ws-brand">
            <svg viewBox="0 0 24 24" className="size-5 text-white"><path fill="currentColor" d="M12 2 3 20h6l3-6 3 6h6L12 2Zm0 8 1.6 3.2h-3.2L12 10Z"/></svg>
          </span>
          {!collapsed && <div className="leading-tight"><div className="text-[14px] font-semibold tracking-tight">Aether</div><div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#A1A1AA]">Enterprise Pro</div></div>}
          <button onClick={() => setCollapsed((c) => !c)} className="ml-auto size-7 grid place-items-center rounded-md text-[#A1A1AA] hover:text-white hover:bg-white/5" aria-label="Toggle sidebar">
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {([
            { id: "overview", label: "Overview", Icon: LayoutDashboard },
            { id: "analytics", label: "Analytics", Icon: BarChart3 },
            { id: "network", label: "Global Network", Icon: Globe2 },
            { id: "identity", label: "Identity Settings", Icon: Shield },
          ] as { id: Tab; label: string; Icon: typeof Shield }[]).map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)}
                className={`group relative w-full flex items-center gap-3 px-3 h-10 rounded-lg text-[13px] font-medium transition-colors ${active ? "bg-white/5 text-white" : "text-[#A1A1AA] hover:text-white hover:bg-white/[0.03]"}`}>
                {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r ws-accent-bar" aria-hidden />}
                <Icon className="size-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#1c1c20]">
          <div className={`rounded-xl bg-[#121214] border border-[#27272A] p-3 ${collapsed ? "text-center" : ""}`}>
            <div className="flex items-center gap-3">
              <span className="grid place-items-center size-9 rounded-full ws-brand text-[12px] font-semibold text-white">{user.name.slice(0, 1).toUpperCase()}</span>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold truncate">{user.name}</div>
                  <div className="text-[11px] text-[#A1A1AA] truncate">{user.email}</div>
                </div>
              )}
            </div>
            {!collapsed && <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#A1A1AA]">Plan · <span className="text-emerald-400">Enterprise Pro</span></div>}
            <button onClick={logout} className={`mt-3 w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-[#27272A] text-[12px] font-medium hover:border-rose-500/50 hover:text-rose-400 transition-colors ${collapsed ? "px-0" : ""}`} aria-label="Logout">
              <LogOut className="size-3.5" />{!collapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-8 border-b border-[#1c1c20] bg-[#09090B]/80 backdrop-blur-xl flex items-center gap-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#A1A1AA]">{tab}</div>
            <div className="text-[15px] font-semibold tracking-tight">{tabTitle(tab)}</div>
          </div>
          <div className="ml-auto flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-[#A1A1AA]">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> All systems nominal
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 ws-scroll">
          {tab === "overview" && <Overview />}
          {tab === "analytics" && <AnalyticsGrid />}
          {tab === "network" && <NetworkMap />}
          {tab === "identity" && <SystemControls accent={accent} onAccent={setAccent} />}
        </div>
      </main>

      <FloatingChat userName={user.name} onJump={(t) => setTab(t)} />
    </div>
  );
}

function tabTitle(t: Tab) {
  return { overview: "Executive Overview", analytics: "Identity Analytics", network: "Global Network Health", identity: "System Controls & Theme" }[t];
}

// ────────────────────────────── Overview ──────────────────────────────
function Overview() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick((x) => x + 1), 2200); return () => clearInterval(t); }, []);

  const metrics = useMemo(() => ([
    { key: "rev", label: "Revenue (MTD)", value: 482_193 + tick * 137, suffix: "$", delta: "+12.4%", series: gen(20, tick, 30, 70) },
    { key: "lat", label: "P50 Latency",   value: 38 + (tick % 7),       suffix: "ms", delta: "-3.1%", series: gen(20, tick + 3, 20, 55), invert: true },
    { key: "spd", label: "Processing",    value: 1240 + tick * 4,       suffix: "/s", delta: "+5.7%", series: gen(20, tick + 6, 40, 90) },
    { key: "cvr", label: "Conversion",    value: 4.62 + Math.sin(tick / 4) * 0.1, suffix: "%", delta: "+0.4 pts", series: gen(20, tick + 9, 25, 75), fixed: 2 },
  ]), [tick]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map(({ key, ...rest }) => <MetricBig key={key} {...rest} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2"><RevenueChart tick={tick} /></div>
        <ActivityFeed tick={tick} />
      </div>
    </div>
  );
}
function gen(n: number, seed: number, lo: number, hi: number) {
  return Array.from({ length: n }, (_, i) => {
    const v = Math.sin((i + seed) * 0.5) * 0.5 + Math.sin((i + seed) * 0.13) * 0.5;
    return lo + ((v + 1) / 2) * (hi - lo);
  });
}
function MetricBig({ label, value, suffix, delta, series, fixed, invert }: { label: string; value: number; suffix: string; delta: string; series: number[]; fixed?: number; invert?: boolean }) {
  const [open, setOpen] = useState(false);
  const path = pathFromSeries(series, 220, 60);
  const fillArea = areaFromSeries(series, 220, 60);
  const positive = delta.trim().startsWith("+") !== !!invert;
  const fmt = suffix === "$" ? `$${Math.round(value).toLocaleString()}` : `${fixed != null ? value.toFixed(fixed) : Math.round(value).toLocaleString()}${suffix === "$" ? "" : suffix}`;
  return (
    <button onClick={() => setOpen((o) => !o)} className="text-left rounded-2xl bg-[#121214] border border-[#27272A] p-5 hover:border-white/20 transition-colors group">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#A1A1AA]">{label}</span>
        <span className={`text-[11px] font-mono ${positive ? "text-emerald-400" : "text-rose-400"}`}>{delta}</span>
      </div>
      <div className="mt-2 text-[26px] font-semibold tabular-nums tracking-tight">{fmt}</div>
      <svg viewBox="0 0 220 60" className="mt-3 w-full h-[60px]" aria-hidden>
        <defs>
          <linearGradient id={`g-${label}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--ac-from)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--ac-from)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillArea} fill={`url(#g-${label})`} />
        <path d={path} fill="none" stroke="var(--ac-from)" strokeWidth={open ? 2.4 : 1.8} strokeLinejoin="round" strokeLinecap="round" />
        {open && series.map((v, i) => {
          const x = (i / (series.length - 1)) * 220;
          const y = 60 - ((v - Math.min(...series)) / (Math.max(...series) - Math.min(...series) || 1)) * 50 - 5;
          return <circle key={i} cx={x} cy={y} r={1.8} fill="var(--ac-from)" />;
        })}
      </svg>
    </button>
  );
}
function pathFromSeries(s: number[], w: number, h: number) {
  const min = Math.min(...s), max = Math.max(...s) || 1;
  return s.map((v, i) => {
    const x = (i / (s.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 10) - 5;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}
function areaFromSeries(s: number[], w: number, h: number) {
  return `${pathFromSeries(s, w, h)} L ${w} ${h} L 0 ${h} Z`;
}
function RevenueChart({ tick }: { tick: number }) {
  const series = gen(40, tick, 20, 90);
  return (
    <div className="rounded-2xl bg-[#121214] border border-[#27272A] p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#A1A1AA]">Revenue Trajectory</div>
          <div className="text-[18px] font-semibold tracking-tight mt-1">Rolling 40-day window</div>
        </div>
        <div className="flex gap-1.5">{["1D","1W","1M","ALL"].map((p, i) => <span key={p} className={`px-2.5 py-1 text-[11px] font-mono rounded-md border ${i === 2 ? "bg-white/5 border-white/15 text-white" : "border-[#27272A] text-[#A1A1AA]"}`}>{p}</span>)}</div>
      </div>
      <svg viewBox="0 0 800 220" className="w-full h-[220px] mt-4">
        <defs>
          <linearGradient id="bigG" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--ac-from)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--ac-from)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0,1,2,3,4].map((i) => <line key={i} x1="0" x2="800" y1={i * 55} y2={i * 55} stroke="#1c1c20" />)}
        <path d={areaFromSeries(series, 800, 220)} fill="url(#bigG)" />
        <path d={pathFromSeries(series, 800, 220)} fill="none" stroke="var(--ac-from)" strokeWidth={2.5} />
      </svg>
    </div>
  );
}
function ActivityFeed({ tick }: { tick: number }) {
  const events = useMemo(() => {
    const base = [
      "API token rotated · `prod-eu-01`",
      "New session · auth.region=us-west-2",
      "Policy update · `acl/admins` v14 → v15",
      "Webhook delivered · stripe.invoice.paid",
      "Cache rebuilt · 2.4MB → 1.8MB",
      "Node added · sgp-3 healthy",
      "Audit export complete · 12,402 rows",
      "AI sampling adjusted · temp 0.72",
    ];
    return Array.from({ length: 8 }, (_, i) => ({ t: `${i + 1}m`, msg: base[(tick + i) % base.length] }));
  }, [tick]);
  return (
    <div className="rounded-2xl bg-[#121214] border border-[#27272A] p-5 h-full">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#A1A1AA]">Live Activity</div>
        <Activity className="size-3.5 text-emerald-400" />
      </div>
      <ul className="mt-4 space-y-3">
        {events.map((e, i) => (
          <li key={`${tick}-${i}`} className="flex items-start gap-3 text-[12.5px] ws-fade">
            <span className="mt-1.5 size-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="flex-1 leading-snug" dangerouslySetInnerHTML={{ __html: md(e.msg) }} />
            <span className="text-[10px] font-mono text-[#52525B]">{e.t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ────────────────────────────── Analytics Grid ──────────────────────────────
type Row = { id: string; name: string; email: string; role: "Owner" | "Admin" | "Member" | "Guest"; region: string; status: "Active" | "Inactive"; last: string };
const seedRows = (): Row[] => [
  { id: "u_01", name: "Sasha Lindgren",  email: "sasha@aether.dev",   role: "Owner",  region: "us-east-1",  status: "Active",   last: "2m ago" },
  { id: "u_02", name: "Mateus Faria",    email: "mateus@aether.dev",  role: "Admin",  region: "eu-west-3",  status: "Active",   last: "11m ago" },
  { id: "u_03", name: "Naomi Okafor",    email: "naomi@aether.dev",   role: "Member", region: "af-south-1", status: "Active",   last: "1h ago" },
  { id: "u_04", name: "Yuki Tanabe",     email: "yuki@aether.dev",    role: "Member", region: "ap-northeast-1", status: "Inactive", last: "3d ago" },
  { id: "u_05", name: "Liam O'Brien",    email: "liam@aether.dev",    role: "Admin",  region: "eu-west-1",  status: "Active",   last: "8m ago" },
  { id: "u_06", name: "Priya Raman",     email: "priya@aether.dev",   role: "Guest",  region: "ap-south-1", status: "Active",   last: "4h ago" },
  { id: "u_07", name: "Hugo Marchetti",  email: "hugo@aether.dev",    role: "Member", region: "sa-east-1",  status: "Active",   last: "32m ago" },
  { id: "u_08", name: "Anastasia Volkov",email: "anastasia@aether.dev",role: "Admin", region: "eu-central-1", status: "Active", last: "5m ago" },
  { id: "u_09", name: "Marcus Chen",     email: "marcus@aether.dev",  role: "Member", region: "us-west-2",  status: "Inactive", last: "12d ago" },
  { id: "u_10", name: "Zara Abdullah",   email: "zara@aether.dev",    role: "Member", region: "me-south-1", status: "Active",   last: "1m ago" },
];
type SortKey = keyof Row;
function AnalyticsGrid() {
  const [rows, setRows] = useState<Row[]>(seedRows);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "name", dir: "asc" });

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    const f = t ? rows.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(t))) : rows;
    return [...f].sort((a, b) => {
      const av = String(a[sort.key]).toLowerCase();
      const bv = String(b[sort.key]).toLowerCase();
      return (av < bv ? -1 : av > bv ? 1 : 0) * (sort.dir === "asc" ? 1 : -1);
    });
  }, [rows, q, sort]);

  const toggleStatus = (id: string) => {
    setRows((rs) => rs.map((r) => r.id === id ? { ...r, status: r.status === "Active" ? "Inactive" : "Active" } : r));
    toast.success("Status updated.");
  };
  const toggleSort = (key: SortKey) => setSort((s) => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });

  return (
    <div className="rounded-2xl bg-[#121214] border border-[#27272A] overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-[#27272A]">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#A1A1AA]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search identities, roles, regions…"
            className="w-full bg-[#09090B] border border-[#27272A] rounded-lg pl-9 pr-3 py-2.5 text-[13px] outline-none focus:border-indigo-500/70" aria-label="Search" />
        </div>
        <div className="ml-auto text-[11px] font-mono uppercase tracking-[0.18em] text-[#A1A1AA]">{filtered.length} of {rows.length}</div>
      </div>
      <div className="overflow-x-auto ws-scroll">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11px] font-mono uppercase tracking-[0.16em] text-[#A1A1AA] bg-[#0e0e11]">
              {(["name","email","role","region","status","last"] as SortKey[]).map((k) => (
                <th key={k} className="px-4 py-3 cursor-pointer select-none" onClick={() => toggleSort(k)}>
                  <span className="inline-flex items-center gap-1">{k === "last" ? "Last Active" : k}{sort.key === k && (sort.dir === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />)}</span>
                </th>
              ))}
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-[#1c1c20] hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-3">
                    <span className="grid place-items-center size-7 rounded-full ws-brand text-[11px] font-semibold text-white">{r.name.split(" ").map((p) => p[0]).slice(0,2).join("")}</span>
                    {r.name}
                  </div>
                </td>
                <td className="px-4 py-3 text-[#A1A1AA]">{r.email}</td>
                <td className="px-4 py-3"><span className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-white/10 bg-white/5">{r.role}</span></td>
                <td className="px-4 py-3 text-[#A1A1AA] font-mono text-[12px]">{r.region}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded-full border ${r.status === "Active" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-rose-500/30 bg-rose-500/10 text-rose-300"}`}>
                    <span className={`size-1.5 rounded-full ${r.status === "Active" ? "bg-emerald-400" : "bg-rose-400"}`} />{r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#A1A1AA] text-[12px]">{r.last}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggleStatus(r.id)} className="text-[11px] font-medium px-3 py-1.5 rounded-md border border-[#27272A] hover:border-rose-500/50 hover:text-rose-400 transition-colors">
                    {r.status === "Active" ? "Suspend" : "Reactivate"}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-[#A1A1AA]">No identities match “{q}”.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ────────────────────────────── Global Network ──────────────────────────────
function NetworkMap() {
  const nodes = [
    { id: "us-east-1", x: 26, y: 42, load: 62 },
    { id: "us-west-2", x: 14, y: 40, load: 41 },
    { id: "eu-west-1", x: 47, y: 38, load: 71 },
    { id: "eu-central-1", x: 50, y: 36, load: 55 },
    { id: "ap-south-1", x: 66, y: 52, load: 48 },
    { id: "ap-northeast-1", x: 83, y: 42, load: 33 },
    { id: "sa-east-1", x: 33, y: 70, load: 22 },
    { id: "af-south-1", x: 53, y: 70, load: 18 },
  ];
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick((x) => x + 1), 1500); return () => clearInterval(t); }, []);
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-[#121214] border border-[#27272A] p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#A1A1AA]">Edge Network</div>
            <div className="text-[18px] font-semibold tracking-tight mt-1">14 Points of Presence · 8 active regions</div>
          </div>
          <div className="text-[11px] font-mono text-emerald-400">● Healthy</div>
        </div>
        <div className="mt-6 relative aspect-[16/8] rounded-xl bg-[#0c0c0e] border border-[#1c1c20] overflow-hidden">
          <svg viewBox="0 0 100 80" className="absolute inset-0 w-full h-full">
            {/* faint world dots */}
            {Array.from({ length: 400 }).map((_, i) => {
              const x = (i % 40) * 2.5 + 1.25, y = Math.floor(i / 40) * 8 + 4;
              return <circle key={i} cx={x} cy={y} r="0.4" fill="#1f1f24" />;
            })}
            {/* arcs */}
            {nodes.map((a, i) => nodes.slice(i + 1).map((b, j) => (
              <line key={`${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--ac-from)" strokeOpacity="0.08" strokeWidth="0.2" />
            )))}
            {/* nodes */}
            {nodes.map((n) => (
              <g key={n.id} className="ws-node">
                <circle cx={n.x} cy={n.y} r={2 + (n.load / 60)} fill="var(--ac-from)" opacity={0.18 + (((tick + n.x) % 5) / 12)} />
                <circle cx={n.x} cy={n.y} r="1" fill="var(--ac-from)" />
              </g>
            ))}
          </svg>
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {nodes.map((n) => (
            <div key={n.id} className="rounded-lg bg-[#0c0c0e] border border-[#1c1c20] p-3">
              <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#A1A1AA]">{n.id}</div>
              <div className="mt-1 text-[14px] font-semibold tabular-nums">{n.load}% load</div>
              <div className="mt-2 h-1.5 rounded-full bg-[#1c1c20] overflow-hidden">
                <div className="h-full ws-accent-bar" style={{ width: `${n.load}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────── System Controls ──────────────────────────────
function SystemControls({ accent, onAccent }: { accent: AccentKey; onAccent: (a: AccentKey) => void }) {
  const [cache, setCache] = useState(64);
  const [temp, setTemp] = useState(72);
  const [conc, setConc] = useState(8);
  const [analytics, setAnalytics] = useState(true);
  const [audit, setAudit] = useState(true);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-2xl bg-[#121214] border border-[#27272A] p-6">
        <div className="flex items-center gap-2"><Palette className="size-4 text-[#A1A1AA]" /><div className="text-[15px] font-semibold tracking-tight">Theme Accent</div></div>
        <p className="text-[13px] text-[#A1A1AA] mt-1">Live across the entire workspace via CSS variables.</p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {(Object.keys(ACCENTS) as AccentKey[]).map((k) => {
            const a = ACCENTS[k]; const active = accent === k;
            return (
              <button key={k} onClick={() => onAccent(k)}
                className={`relative rounded-xl border p-4 text-left transition-all ${active ? "border-white/30 bg-white/[0.04]" : "border-[#27272A] hover:border-white/15"}`}>
                <span className="block h-10 rounded-md" style={{ background: `linear-gradient(135deg, ${a.from}, ${a.to})`, boxShadow: `0 10px 24px -8px rgba(${a.glow},0.55)` }} />
                <div className="mt-3 text-[12px] font-semibold">{a.label}</div>
                <div className="text-[10px] font-mono text-[#A1A1AA] mt-0.5">{a.from} → {a.to}</div>
                {active && <span className="absolute top-2 right-2 size-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" aria-hidden />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl bg-[#121214] border border-[#27272A] p-6 space-y-5">
        <div className="text-[15px] font-semibold tracking-tight">Runtime Parameters</div>
        <Slider label="API Cache Lifespan" unit="min" value={cache} min={1} max={240} onChange={setCache} />
        <Slider label="AI Sampling Temperature" unit="" value={temp} min={0} max={100} onChange={setTemp} format={(v) => (v/100).toFixed(2)} />
        <Slider label="Worker Concurrency" unit="threads" value={conc} min={1} max={64} onChange={setConc} />
      </div>

      <div className="rounded-2xl bg-[#121214] border border-[#27272A] p-6 lg:col-span-2">
        <div className="text-[15px] font-semibold tracking-tight">Workspace Toggles</div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Toggle label="Real-time analytics streaming" desc="Push WebSocket updates to every connected dashboard." value={analytics} onChange={setAnalytics} />
          <Toggle label="Audit log mirroring" desc="Replicate immutable audit events to your cold storage." value={audit} onChange={setAudit} />
        </div>
        <button onClick={() => toast.success("Configuration saved · propagating to 14 PoPs")} className="ws-primary mt-6 h-11 px-6 rounded-xl font-semibold text-[13px]">Apply configuration</button>
      </div>
    </div>
  );
}
function Slider({ label, unit, value, min, max, onChange, format }: { label: string; unit: string; value: number; min: number; max: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[12px]"><span className="text-[#A1A1AA]">{label}</span><span className="font-mono text-white tabular-nums">{format ? format(value) : value}{unit && ` ${unit}`}</span></div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="ws-range mt-2 w-full" aria-label={label} />
    </div>
  );
}
function Toggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="flex items-start gap-4 text-left p-4 rounded-xl border border-[#27272A] bg-[#0c0c0e] hover:border-white/15 transition-colors">
      <span className={`relative inline-flex shrink-0 mt-0.5 h-6 w-10 rounded-full transition-colors ${value ? "ws-accent-bar" : "bg-[#27272A]"}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${value ? "translate-x-[18px]" : "translate-x-0.5"}`} />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold">{label}</span>
        <span className="block text-[12px] text-[#A1A1AA] mt-0.5">{desc}</span>
      </span>
    </button>
  );
}

// ────────────────────────────── Floating chat ──────────────────────────────
function FloatingChat({ userName, onJump }: { userName: string; onJump: (t: Tab) => void }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("aether-chat") ?? "[]"); } catch { return []; }
  });
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => { localStorage.setItem("aether-chat", JSON.stringify(msgs)); }, [msgs]);
  useEffect(() => { if (open) scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }); }, [msgs, typing, open]);
  useEffect(() => {
    if (msgs.length === 0 || !msgs.some((m) => m.text.includes(userName))) {
      setMsgs((m) => [...m, { id: crypto.randomUUID(), role: "bot", text: `Welcome inside, **${userName}**. Ask me about your *modules* or say *theme* to switch accents.` }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName]);

  const send = (text?: string) => {
    const t = (text ?? draft).trim();
    if (!t) return;
    setDraft("");
    setMsgs((m) => [...m, { id: crypto.randomUUID(), role: "user", text: t }]);
    setTyping(true);
    setTimeout(() => {
      const r = reply(t);
      setMsgs((m) => [...m, { id: crypto.randomUUID(), role: "bot", text: r }]);
      setTyping(false);
      if (/overview/i.test(t)) onJump("overview");
      else if (/(analytic|grid|identit)/i.test(t)) onJump("analytics");
      else if (/(network|region|node)/i.test(t)) onJump("network");
      else if (/(setting|control|theme)/i.test(t)) onJump("identity");
    }, 700 + Math.min(1100, t.length * 12));
  };

  if (!open) {
    return (
      <button onClick={() => { void import("@/lib/chatGate").then(m => m.openChatGate()); setOpen(true); }} className="ws-primary fixed bottom-6 right-6 z-[80] size-14 rounded-2xl grid place-items-center shadow-[0_20px_40px_-10px_rgba(var(--ac-glow),0.55)]" aria-label="Open Aether Concierge">
        <Sparkles className="size-5" />
      </button>
    );
  }
  return (
    <div className={`fixed z-[80] ${expanded ? "inset-6" : "bottom-6 right-6 w-[380px] max-w-[calc(100vw-3rem)]"}`}>
      <div className="rounded-2xl border border-[#27272A] bg-[#0c0c0e]/90 backdrop-blur-xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e1e22] bg-[#0e0e11]/80">
          <span className="grid place-items-center size-7 rounded-lg ws-brand"><Sparkles className="size-3.5 text-white" /></span>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold">Aether AI Concierge</div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-400"><span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online</div>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => setMsgs([{ id: crypto.randomUUID(), role: "bot", text: "History cleared." }])} className="size-7 grid place-items-center rounded-md text-[#A1A1AA] hover:text-white hover:bg-white/5" aria-label="Clear history"><Trash2 className="size-3.5" /></button>
            <button onClick={() => setExpanded((e) => !e)} className="size-7 grid place-items-center rounded-md text-[#A1A1AA] hover:text-white hover:bg-white/5" aria-label="Expand"><Maximize2 className="size-3.5" /></button>
            <button onClick={() => setOpen(false)} className="size-7 grid place-items-center rounded-md text-[#A1A1AA] hover:text-white hover:bg-white/5" aria-label="Minimize"><Minus className="size-3.5" /></button>
          </div>
        </div>
        <div ref={scroller} className={`ws-scroll px-4 py-4 space-y-3 overflow-y-auto flex-1 ${expanded ? "" : "h-[360px]"}`}>
          {msgs.map((m) => (
            <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "bot" && <span className="shrink-0 mt-0.5 grid place-items-center size-7 rounded-lg bg-white/5 border border-white/10"><Sparkles className="size-3.5 ws-accent-text" /></span>}
              <div className={`max-w-[78%] text-[13px] leading-[1.55] px-3.5 py-2.5 rounded-2xl ${m.role === "user" ? "ws-brand text-white rounded-br-md" : "bg-white/5 border border-white/10 text-[#FAFAFA] rounded-bl-md"}`}
                dangerouslySetInnerHTML={{ __html: md(m.text) }} />
            </div>
          ))}
          {typing && (
            <div className="flex gap-2 justify-start">
              <span className="shrink-0 mt-0.5 grid place-items-center size-7 rounded-lg bg-white/5 border border-white/10"><Sparkles className="size-3.5 ws-accent-text" /></span>
              <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white/5 border border-white/10 flex items-center gap-1.5"><span className="ws-dot" /><span className="ws-dot" style={{ animationDelay: "0.15s" }} /><span className="ws-dot" style={{ animationDelay: "0.3s" }} /></div>
            </div>
          )}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="p-3 border-t border-[#1e1e22] flex gap-2 bg-[#0e0e11]/80">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask about a module…"
            className="flex-1 bg-[#121214] border border-[#27272A] rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-indigo-500/70" aria-label="Message" />
          <button type="submit" disabled={!draft.trim()} className="ws-primary size-10 rounded-xl grid place-items-center disabled:opacity-40" aria-label="Send"><Send className="size-4" /></button>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────── Styles ──────────────────────────────
const wsStyles = `
.aether-ws, .aether-ws * { font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
.aether-ws button, .aether-ws a, .aether-ws input { transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.aether-ws button:active { transform: scale(0.98); }
.ws-brand { background: linear-gradient(135deg, var(--ac-from), var(--ac-to)); box-shadow: 0 8px 24px -8px rgba(var(--ac-glow), 0.55); }
.ws-accent-bar { background: linear-gradient(180deg, var(--ac-from), var(--ac-to)); }
.ws-accent-text { color: var(--ac-from); }
.ws-primary { background: linear-gradient(180deg, var(--ac-from), var(--ac-to)); color: white; box-shadow: 0 10px 30px -10px rgba(var(--ac-glow), 0.55), inset 0 1px 0 rgba(255,255,255,0.18); position: relative; }
.ws-primary:hover:not(:disabled) { box-shadow: 0 18px 40px -10px rgba(var(--ac-glow), 0.7), inset 0 1px 0 rgba(255,255,255,0.22); transform: translateY(-1px); }
.ws-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
.ws-scroll::-webkit-scrollbar-track { background: transparent; }
.ws-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 999px; }
.ws-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }
.ws-dot { width: 6px; height: 6px; border-radius: 999px; background: #A1A1AA; display: inline-block; animation: ws-dot 1.2s ease-in-out infinite; }
@keyframes ws-dot { 0%,80%,100% { transform: scale(0.7); opacity: 0.4; } 40% { transform: scale(1.1); opacity: 1; } }
.ws-fade { animation: ws-fade 0.5s ease-out both; }
@keyframes ws-fade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.ws-range { -webkit-appearance: none; appearance: none; height: 4px; background: #1f1f24; border-radius: 999px; outline: none; }
.ws-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 999px; background: linear-gradient(135deg, var(--ac-from), var(--ac-to)); cursor: pointer; box-shadow: 0 4px 12px -2px rgba(var(--ac-glow), 0.6); border: 2px solid #0c0c0e; }
.ws-range::-moz-range-thumb { width: 16px; height: 16px; border-radius: 999px; background: var(--ac-from); cursor: pointer; border: 2px solid #0c0c0e; }
.ws-node circle { transition: opacity 0.6s ease; }
@media (prefers-reduced-motion: reduce) { .aether-ws *, .ws-fade { animation: none !important; transition: none !important; } }
`;
