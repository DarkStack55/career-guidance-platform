import { motion } from "framer-motion";

export function PageLoader({ label = "Connecting..." }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background dark:bg-[#050505] text-foreground">
      <div className="relative flex items-center justify-center w-20 h-20">
        <motion.div
          className="w-4 h-4 bg-foreground rounded-full absolute -top-6"
          animate={{ y: [-4, 4, -4], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="w-8 h-8 bg-foreground rounded-sm shadow-[0_0_25px_rgba(120,120,140,0.35)]"
          animate={{
            rotate: [0, 90, 180, 270, 360],
            borderRadius: ["10%", "30%", "10%", "30%", "10%"],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <motion.p
        className="mt-6 text-xs tracking-[0.3em] uppercase text-muted-foreground font-mono"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {label}
      </motion.p>
    </div>
  );
}
