import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { TiltSpotlight } from "@/components/motion/TiltSpotlight";

type Props = {
  image: string;
  title: string;
  roles: string;
  to?: string;
  slug?: string;
};

export function DomainCard({ image, title, roles, to = "/dashboard", slug }: Props) {
  const href = slug ? `/domain/${slug}` : to;
  return (
    <TiltSpotlight tilt={5} className="rounded-2xl">
      <Link
        to={href}
        data-spotlight
        data-theme-surface="dark"
        className="group card-spotlight shimmer-sweep relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 block bg-neutral-950 transition-shadow duration-500 hover:shadow-[0_20px_60px_-20px_rgba(139,92,246,0.55)]"
      >
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
        />

        {/* Base scrim for image legibility */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Bottom glass overlay */}
        <div className="absolute bottom-0 left-0 w-full p-6 bg-black/40 backdrop-blur-xl border-t border-white/10 flex flex-col gap-2 translate-y-0 z-10">
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/50">{roles}</div>
          <h3 className="text-lg font-semibold text-white tracking-tight leading-snug">{title}</h3>
          <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-white/70 group-hover:text-white transition-colors">
            Explore path
            <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </Link>
    </TiltSpotlight>
  );
}
