import { motion } from "framer-motion";

// High-quality Unsplash sources — realistic, dark-mode friendly
const DOMAINS = [
  { label: "Surgeons", img: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&q=80" },
  { label: "Engineers", img: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80" },
  { label: "Pilots", img: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80" },
  { label: "Designers", img: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&q=80" },
  { label: "Data Scientists", img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80" },
  { label: "Architects", img: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80" },
  { label: "Filmmakers", img: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80" },
  { label: "Chefs", img: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800&q=80" },
  { label: "Scientists", img: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80" },
  { label: "Marketers", img: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80" },
  { label: "Astronauts", img: "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=800&q=80" },
  { label: "Athletes", img: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80" },
  { label: "Musicians", img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80" },
  { label: "Lawyers", img: "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=800&q=80" },
  { label: "Educators", img: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80" },
  { label: "Photographers", img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80" },
  { label: "Researchers", img: "https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=800&q=80" },
  { label: "Founders", img: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80" },
];

function Card({ label, img }: { label: string; img: string }) {
  return (
    <div className="relative shrink-0 w-[260px] h-[340px] rounded-2xl overflow-hidden border border-white/10 group">
      <img
        src={img}
        alt={label}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#05060d] via-[#05060d]/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <div className="text-xs font-mono uppercase tracking-widest text-cyan-300/80">Career</div>
        <div className="text-xl font-semibold text-white mt-1">{label}</div>
      </div>
      {/* neon border on hover */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-transparent group-hover:ring-violet-400/40 transition" />
    </div>
  );
}

export function DomainMarquee() {
  const row = [...DOMAINS, ...DOMAINS];
  return (
    <section data-theme-surface="dark" className="relative py-24 bg-[#05060d] overflow-hidden border-y border-white/5">
      <div className="max-w-6xl mx-auto px-6 mb-12">
        <div className="text-xs font-mono uppercase tracking-widest text-cyan-300 mb-3">Coverage · 45+ industries</div>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white max-w-3xl">
          Every calling.{" "}
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
            One neural map.
          </span>
        </h2>
        <p className="mt-4 text-white/60 max-w-2xl">
          From operating rooms to cockpits, studios to trading floors — CareerPilot maps the real
          humans shipping real work across every domain.
        </p>
      </div>

      {/* edge fades */}
      <div aria-hidden className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#05060d] to-transparent z-10 pointer-events-none" />
      <div aria-hidden className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#05060d] to-transparent z-10 pointer-events-none" />

      <motion.div
        className="flex gap-5 w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 55, ease: "linear", repeat: Infinity }}
      >
        {row.map((d, i) => (
          <Card key={i} {...d} />
        ))}
      </motion.div>

      <motion.div
        className="flex gap-5 w-max mt-5"
        animate={{ x: ["-50%", "0%"] }}
        transition={{ duration: 65, ease: "linear", repeat: Infinity }}
      >
        {row.map((d, i) => (
          <Card key={`b-${i}`} {...d} />
        ))}
      </motion.div>
    </section>
  );
}
