import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, MapPin, Briefcase, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { jobs, formatSalary } from "@/lib/jobs";
import { getMyProfile, updateMyProfile, applyToJob } from "@/lib/careers-profile.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/apply/$jobId")({
  head: ({ params }) => {
    const job = jobs.find((j) => j.id === params.jobId);
    const title = job ? `Apply for ${job.title} — CareerPilot AI` : "Apply — CareerPilot AI";
    const description = job
      ? `One-click apply for ${job.title}${job.company ? ` at ${job.company}` : ""} with your saved CareerPilot AI profile.`
      : "One-click apply with your saved profile.";
    const url = `https://jobinvite.lovable.app/apply/${params.jobId}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: ApplyPage,
});

function ApplyPage() {
  const { jobId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const job = jobs.find((j) => j.id === jobId);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (!job) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-bold mb-3">Role not found</h1>
        <Link to="/jobs" className="text-primary hover:underline">← Back to jobs</Link>
      </div>
    );
  }
  if (loading || !user) {
    return <div className="max-w-3xl mx-auto px-6 py-20"><div className="h-80 glass rounded-2xl animate-pulse" /></div>;
  }

  return <ApplyForm job={job} email={user.email ?? ""} />;
}

function ApplyForm({ job, email }: { job: typeof jobs[number]; email: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const getProfile = useServerFn(getMyProfile);
  const updateProfile = useServerFn(updateMyProfile);
  const apply = useServerFn(applyToJob);

  const { data, isLoading } = useQuery({ queryKey: ["my-profile"], queryFn: () => getProfile() });
  const profile = data?.profile;

  const [full_name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [resume_url, setResume] = useState("");
  const [years, setYears] = useState<number | "">("");
  const [cover, setCover] = useState("");

  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name ?? "");
    setHeadline(profile.headline ?? "");
    setPhone(profile.phone ?? "");
    setLocation(profile.location ?? "");
    setResume(profile.resume_url ?? "");
    setYears(profile.years_experience ?? "");
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      await updateProfile({
        data: {
          full_name, headline, phone, location, resume_url,
          years_experience: years === "" ? undefined : Number(years),
        },
      });
      await apply({ data: { job_id: job.id, job_title: job.title, company: job.company, cover_note: cover || undefined } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      qc.invalidateQueries({ queryKey: ["my-applications"] });
      toast.success("Application submitted");
      navigate({ to: "/dashboard" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to apply"),
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link to="/jobs" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6">
        <ArrowLeft className="size-3" /> Back to jobs
      </Link>

      <div className="glass-strong rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="size-14 rounded-xl bg-white/5 flex items-center justify-center text-2xl">{job.logo}</div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <div className="text-sm text-muted-foreground">{job.company}</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {job.location}</span>
              <span className="inline-flex items-center gap-1"><Briefcase className="size-3" /> {job.employment} · {job.arrangement}</span>
              <span className="inline-flex items-center gap-1 text-success"><DollarSign className="size-3" /> {formatSalary(job.salaryMin, job.salaryMax)}</span>
            </div>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
        className="glass-strong rounded-2xl p-6 space-y-5"
      >
        <div>
          <h2 className="font-bold text-lg mb-1">Your profile</h2>
          <p className="text-xs text-muted-foreground">Saved once, reused on every future apply. No re-typing.</p>
        </div>

        {isLoading ? (
          <div className="h-64 rounded-xl bg-muted animate-pulse" />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Full name" value={full_name} onChange={setName} required />
            <Field label="Headline" value={headline} onChange={setHeadline} placeholder="Senior Product Designer" />
            <Field label="Email" value={email} disabled />
            <Field label="Phone" value={phone} onChange={setPhone} />
            <Field label="Location" value={location} onChange={setLocation} placeholder="City, Country" />
            <Field label="Years of experience" type="number" value={years === "" ? "" : String(years)} onChange={(v) => setYears(v === "" ? "" : Number(v))} />
            <div className="md:col-span-2">
              <Field label="Resume link (Google Drive, Dropbox, or personal site)" value={resume_url} onChange={setResume} placeholder="https://..." />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Cover note (optional)</label>
              <textarea
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder={`Why you're a fit for ${job.title} at ${job.company}...`}
                className="mt-1 w-full glass rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50 resize-none"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="size-4 text-success" /> Your profile will be saved for future one-click applies.
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={save.isPending || isLoading}
            className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-bold disabled:opacity-60 hover:scale-[1.01] transition-transform"
          >
            {save.isPending ? "Submitting..." : "Submit application"}
          </button>
          <Link to="/jobs" className="px-5 py-3 rounded-xl glass text-sm font-semibold hover:border-primary/50">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required, disabled, placeholder }: {
  label: string; value: string; onChange?: (v: string) => void; type?: string; required?: boolean; disabled?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className="mt-1 w-full glass rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50 disabled:opacity-60"
      />
    </div>
  );
}
