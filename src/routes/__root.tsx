import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChatWidget } from "@/components/ChatWidget";
import { GuestConcierge } from "@/components/GuestConcierge";
import { ChatOpenGate } from "@/components/ChatOpenGate";
import { SessionManager } from "@/components/SessionManager";
import { AmbientBackground } from "@/components/AmbientBackground";
import { Toaster } from "@/components/ui/sonner";
import { PageLoaderHost } from "@/components/PageLoaderHost";
import { supabase } from "@/integrations/supabase/client";
import { AuthProvider, useAuth } from "@/context/AuthContext";


import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-mono text-xs text-primary tracking-widest mb-2">ERR_NO_ROUTE</div>
        <h1 className="text-7xl font-extrabold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Off the flight path</h2>
        <p className="mt-2 text-sm text-muted-foreground">This destination doesn't exist in our airspace.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:scale-105 transition-transform">
            Return to base
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try refreshing or head back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Try again</button>
          <a href="/" className="rounded-full border border-border px-4 py-2 text-sm font-medium">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CareerPilot AI — Navigate your career airspace" },
      { name: "description", content: "AI-powered career counselor. Get personalized career suggestions, skill gap analysis, salary predictions, and learning roadmaps." },
      { name: "author", content: "CareerPilot AI" },
      { property: "og:title", content: "CareerPilot AI — Navigate your career airspace" },
      { property: "og:description", content: "AI-powered career counselor. Get personalized career suggestions, skill gap analysis, salary predictions, and learning roadmaps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "CareerPilot AI — Navigate your career airspace" },
      { name: "twitter:description", content: "AI-powered career counselor. Get personalized career suggestions, skill gap analysis, salary predictions, and learning roadmaps." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/066df5db-9721-467c-a233-225ec06f0d0f/id-preview-abf2f119--9c241149-bfdb-4b0e-ac65-bbd02c8f65e2.lovable.app-1779089788644.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/066df5db-9721-467c-a233-225ec06f0d0f/id-preview-abf2f119--9c241149-bfdb-4b0e-ac65-bbd02c8f65e2.lovable.app-1779089788644.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }, { rel: "preconnect", href: "https://fonts.googleapis.com" }, { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');}}catch(e){}" }} />
        <style dangerouslySetInnerHTML={{ __html: `
          #cp-splash{position:fixed;inset:0;z-index:100000;background:#ffffff;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:20px;transition:opacity .35s ease}
          html.dark #cp-splash{background:#050505}
          #cp-splash.cp-hide{opacity:0;pointer-events:none}
          #cp-splash img{width:96px;height:96px;object-fit:contain;filter:drop-shadow(0 0 24px rgba(6,182,212,.45));animation:cpFloat 2.4s ease-in-out infinite}
          #cp-splash .cp-dot{width:8px;height:8px;border-radius:9999px;background:rgba(15,23,42,.35);animation:cpPulse 1.2s ease-in-out infinite}
          html.dark #cp-splash .cp-dot{background:rgba(255,255,255,.4)}
          #cp-splash .cp-dots{display:flex;gap:8px}
          #cp-splash .cp-dot:nth-child(2){animation-delay:.15s}
          #cp-splash .cp-dot:nth-child(3){animation-delay:.3s}
          @keyframes cpFloat{0%,100%{transform:translateY(-6px)}50%{transform:translateY(6px)}}
          @keyframes cpPulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}
        ` }} />
      </head>
      <body className="text-foreground bg-white dark:bg-[#05060d] transition-colors duration-500">
        <div id="cp-splash" aria-hidden="true" suppressHydrationWarning>
          <img src="/robot-avatar.png" alt="" />
          <div className="cp-dots"><span className="cp-dot" /><span className="cp-dot" /><span className="cp-dot" /></div>
        </div>
        {children}
        <Scripts />
      </body>
    </html>
  );
}


function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootAppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootAppContent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onAuthRoute =
    pathname === "/login" ||
    pathname === "/admin-login" ||
    pathname === "/reset-password" ||
    pathname.startsWith("/auth");

  return (
    <>
        <AuthSync />
        <SplashHider />
        {!onAuthRoute && <AmbientBackground />}
        <div className="relative min-h-screen flex flex-col text-foreground">
          {!onAuthRoute && <Navbar />}
          <main className="flex-1" data-auth-route={onAuthRoute ? "1" : undefined}>
            <Outlet />
          </main>
          {!onAuthRoute && <Footer />}
          <ChatWidget />
          {!onAuthRoute && <GuestConcierge />}
          <ChatOpenGate />
          <SessionManager />
          <Toaster />
          <PageLoaderHost />
        </div>
    </>
  );
}


function SplashHider() {
  const { loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Hard fail-safe: never let the splash outlive 3s, even if auth stalls.
  useEffect(() => {
    const t = window.setTimeout(() => {
      const el = document.getElementById("cp-splash");
      if (!el) return;
      el.classList.add("cp-hide");
      window.setTimeout(() => el.remove(), 400);
    }, 3000);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const isAuthRoute = pathname === "/login" || pathname === "/admin-login" || pathname === "/reset-password" || pathname.startsWith("/auth");
    if (loading && !isAuthRoute) return;
    const el = document.getElementById("cp-splash");
    if (!el) return;
    const hide = () => {
      el.classList.add("cp-hide");
      window.setTimeout(() => el.remove(), 400);
    };
    const t = window.setTimeout(hide, isAuthRoute ? 250 : 0);
    return () => window.clearTimeout(t);
  }, [loading, pathname]);
  return null;
}



function AuthSync() {
  const router = useRouter();
  const qc = useQueryClient();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event === "SIGNED_OUT") qc.clear();
      else qc.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, qc]);
  return null;
}
