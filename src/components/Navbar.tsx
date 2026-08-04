import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Menu, X, LogOut, Compass, Sparkles, Sun, Moon, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/lib/theme";
import { toast } from "sonner";
import { showPageLoader } from "@/lib/nav-loader";

function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, , toggle] = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`size-9 inline-flex items-center justify-center rounded-full border border-white/15 dark:border-white/15 border-black/10 bg-white/[0.04] dark:bg-white/[0.04] text-foreground/80 hover:text-foreground hover:bg-white/[0.1] dark:hover:bg-white/[0.08] transition-colors ${className}`}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

type NavChild = { label: string; to: string };
type NavItem = { label: string; to: string; children: NavChild[] };

const navigation: NavItem[] = [
  {
    label: "Home",
    to: "/",
    children: [
      { label: "How It Works", to: "/how-it-works" },
      { label: "Success Stories", to: "/success-stories" },
      { label: "Features", to: "/features" },
      { label: "Pricing", to: "/pricing" },
      { label: "FAQ", to: "/faq" },
    ],
  },
  {
    label: "Assessment",
    to: "/assessment",
    children: [
      { label: "Personality Test", to: "/assessment/personality" },
      { label: "Technical Skills", to: "/assessment/technical" },
      { label: "Aptitude & Logic", to: "/assessment/aptitude" },
      { label: "Career Fit Analyzer", to: "/assessment/career-fit" },
      { label: "AI Resume Grader", to: "/assessment/resume" },
      { label: "Mock Interview", to: "/assessment/interview" },
      { label: "Mock Interview Studio", to: "/assessment/mock-interview" },
    ],
  },
  {
    label: "Dashboard",
    to: "/dashboard",
    children: [
      { label: "My Profile", to: "/dashboard/profile" },
      { label: "Application Tracker", to: "/dashboard/applications" },
      { label: "Saved Jobs", to: "/dashboard/saved" },
      { label: "Analytics", to: "/dashboard/analytics" },
      { label: "Badges", to: "/dashboard/badges" },
      { label: "Settings", to: "/dashboard/settings" },
    ],
  },
  {
    label: "Roadmap",
    to: "/roadmap",
    children: [
      { label: "Tech & Engineering", to: "/roadmap/tech" },
      { label: "Business & Management", to: "/roadmap/business" },
      { label: "Creative & Design", to: "/roadmap/creative" },
      { label: "AI Roadmap", to: "/roadmap/ai" },
      { label: "Milestone Tracker", to: "/roadmap/milestones" },
      { label: "Resource Library", to: "/roadmap/resources" },
    ],
  },
  {
    label: "Mentors",
    to: "/mentors",
    children: [
      { label: "Find a Mentor", to: "/mentors/find" },
      { label: "Top Rated", to: "/mentors/top" },
      { label: "Book 1:1", to: "/mentors/book" },
      { label: "My Sessions", to: "/mentors/sessions" },
      { label: "Become a Mentor", to: "/mentors/become" },
    ],
  },
  {
    label: "Scholarships",
    to: "/scholarships",
    children: [
      { label: "Browse All", to: "/scholarships/browse" },
      { label: "Merit-Based", to: "/scholarships/merit" },
      { label: "Need-Based", to: "/scholarships/need" },
      { label: "Study Abroad", to: "/scholarships/abroad" },
      { label: "Diversity", to: "/scholarships/diversity" },
    ],
  },
  {
    label: "Internships",
    to: "/internships",
    children: [
      { label: "Summer Internships", to: "/internships/summer" },
      { label: "Remote Roles", to: "/internships/remote" },
      { label: "Tech & Startups", to: "/internships/startup" },
      { label: "Corporate Programs", to: "/internships/corporate" },
      { label: "Interview Prep", to: "/internships/prep" },
    ],
  },
  {
    label: "Blog",
    to: "/blog",
    children: [
      { label: "Career Advice", to: "/blog/advice" },
      { label: "Industry News", to: "/blog/news" },
      { label: "Success Stories", to: "/blog/stories" },
    ],
  },
];


function DesktopMegaMenu({ path }: { path: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenIndex(null), 140);
  };
  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const open = (i: number) => {
    cancelClose();
    setOpenIndex(i);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <nav className="hidden lg:flex items-center gap-1" onMouseLeave={scheduleClose}>
      {navigation.map((item, i) => {
        const isActive = path === item.to || (item.to !== "/" && path.startsWith(item.to));
        const isOpen = openIndex === i;
        return (
          <div
            key={item.label}
            className="relative"
            onMouseEnter={() => open(i)}
            onFocus={() => open(i)}
          >
            <Link
              to={item.to}
              className={`inline-flex items-center gap-1 px-3 py-2 text-sm rounded-md transition-colors ${
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-haspopup="menu"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(null)}
            >
              {item.label}
              <ChevronDown
                className={`size-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                strokeWidth={2.4}
              />
            </Link>

            <div
              role="menu"
              aria-label={item.label}
              className={`absolute left-0 top-full pt-2 min-w-56 z-50 origin-top transition-[opacity,transform] duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
                isOpen
                  ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                  : "opacity-0 -translate-y-2 scale-[0.96] pointer-events-none"
              }`}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
            >
              <div className="bg-popover/95 backdrop-blur-xl border border-border rounded-lg shadow-2xl p-2 text-popover-foreground">
                {item.children.map((c, ci) => (
                  <Link
                    key={c.to + c.label}
                    to={c.to}
                    role="menuitem"
                    onClick={() => setOpenIndex(null)}
                    style={{
                      transitionDelay: isOpen ? `${60 + ci * 35}ms` : "0ms",
                    }}
                    className={`block text-sm text-muted-foreground hover:text-primary hover:bg-accent/10 px-4 py-2 rounded-md transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:translate-x-1 ${
                      isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
                    }`}
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>

          </div>
        );
      })}
    </nav>
  );
}

function MobileAccordion({ onNavigate }: { onNavigate: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="space-y-1">
      {navigation.map((item, i) => {
        const isOpen = expanded === i;
        return (
          <div key={item.label} className="rounded-lg overflow-hidden">
            <div className="flex items-center">
              <Link
                to={item.to}
                onClick={onNavigate}
                className="flex-1 text-sm text-muted-foreground hover:text-foreground px-3 py-2.5"
              >
                {item.label}
              </Link>
              <button
                type="button"
                aria-label={`Toggle ${item.label} submenu`}
                aria-expanded={isOpen}
                onClick={() => setExpanded(isOpen ? null : i)}
                className="size-9 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <ChevronDown
                  className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  strokeWidth={2.4}
                />
              </button>
            </div>
            <div
              className={`grid transition-all duration-200 ease-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="pl-4 pb-2 space-y-0.5 border-l border-border ml-3">
                  {item.children.map((c) => (
                    <Link
                      key={c.to + c.label}
                      to={c.to}
                      onClick={onNavigate}
                      className="block text-sm text-muted-foreground hover:text-primary hover:bg-accent/10 px-4 py-2 rounded-md transition-colors"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const initial = (user?.user_metadata?.full_name || user?.email || "?")[0]?.toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/85 backdrop-blur-3xl border-b border-border shadow-sm gpu">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div className="relative size-9 rounded-xl bg-gradient-to-br from-cyan-500/30 to-purple-600/40 border border-white/15 backdrop-blur-md flex items-center justify-center shadow-[0_0_20px_-4px_rgba(139,92,246,0.6)]">
            <Compass className="size-4 text-cyan-300" strokeWidth={2.4} />
            <Sparkles className="absolute -top-1 -right-1 size-3 text-fuchsia-300 drop-shadow-[0_0_6px_rgba(236,72,153,0.9)]" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            CareerPilot<span className="text-gradient-ai font-bold ml-1">AI</span>
          </span>
        </Link>

        <DesktopMegaMenu path={path} />

        <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
          <ThemeToggle />
          {user ? (
            <>
              <Link to="/dashboard" className="hidden sm:flex size-9 rounded-full bg-primary text-primary-foreground items-center justify-center font-semibold text-sm" title={user.email ?? ""}>
                {initial}
              </Link>
              <button onClick={handleSignOut} className="hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground items-center gap-1.5 transition-colors" aria-label="Sign out">
                <LogOut className="size-4" /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" search={{ form: "1" }} onClick={() => showPageLoader()} className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sign in
              </Link>
              <Link
                to="/assessment"
                className="hidden sm:inline-flex btn-glass text-sm"
              >
                Get started
              </Link>
            </>
          )}
          <button className="lg:hidden text-foreground size-9 inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/[0.1] transition-colors" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-popover/95 text-popover-foreground backdrop-blur-xl px-4 py-4 space-y-2 max-h-[calc(100svh-4rem)] overflow-y-auto">
          <MobileAccordion onNavigate={() => setOpen(false)} />
          <div className="pt-3 border-t border-border flex gap-3">
            {user ? (
              <button onClick={() => { setOpen(false); handleSignOut(); }} className="text-sm font-medium">Sign out</button>
            ) : (
              <>
                <Link to="/login" search={{ form: "1" }} onClick={() => { setOpen(false); showPageLoader(); }} className="text-sm font-medium">Sign in</Link>
                <Link to="/assessment" onClick={() => setOpen(false)} className="ml-auto px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
