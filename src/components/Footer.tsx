import { Link } from "@tanstack/react-router";
import { Compass, Twitter, Linkedin, Github } from "lucide-react";
import { MouseGlow } from "@/components/motion/MouseGlow";

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-background/80 backdrop-blur-3xl shadow-sm mt-24 overflow-hidden">
      <MouseGlow size={520} color="color-mix(in oklab, var(--primary) 22%, transparent)" />

      <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-5 gap-10">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2.5 mb-4">
            <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Compass className="size-4" strokeWidth={2.4} />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">CareerPilot</span>
          </Link>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            Personalized career intelligence built on millions of verified job market signals.
          </p>
          <div className="flex items-center gap-2 mt-5">
            {[
              { href: "https://twitter.com", icon: Twitter, label: "Twitter" },
              { href: "https://linkedin.com", icon: Linkedin, label: "LinkedIn" },
              { href: "https://github.com", icon: Github, label: "GitHub" },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="size-9 rounded-lg border border-border bg-card backdrop-blur-xl text-muted-foreground hover:text-foreground hover:bg-accent/10 hover:border-primary/40 flex items-center justify-center transition-colors"
              >
                <s.icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        <FooterCol title="Product" links={[
          { to: "/assessment", label: "Assessment" },
          { to: "/resume", label: "Resume scan" },
          { to: "/skills", label: "Skill analysis" },
          { to: "/roadmap", label: "Roadmap" },
        ]} />
        <FooterCol title="Discover" links={[
          { to: "/jobs", label: "Jobs" },
          { to: "/mentors", label: "Mentors" },
          { to: "/scholarships", label: "Scholarships" },
          { to: "/internships", label: "Internships" },
        ]} />
        <FooterCol title="Company" links={[
          { to: "/about", label: "About" },
          { to: "/contact", label: "Contact" },
          { to: "/blog", label: "Insights" },
          { to: "/login", label: "Sign in" },
        ]} />
      </div>
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">

          <span>© {new Date().getFullYear()} CareerPilot, Inc. All rights reserved.</span>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <h5 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">{title}</h5>
      <ul className="space-y-2.5 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="hover:text-foreground transition-colors">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
