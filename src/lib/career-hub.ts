/**
 * Career Discovery Hub data layer.
 * Streams -> groups (sectors / PCM / PCB / PCMB / commerce / arts) -> careers.
 * Every career is expanded into a rich, page-ready record.
 */

export type StreamId = "high-school" | "science" | "commerce" | "arts";

export type CareerFlag =
  | "remote"
  | "government"
  | "private"
  | "abroad"
  | "freelance"
  | "startup"
  | "ai";

export type Career = {
  slug: string;
  title: string;
  stream: StreamId;
  group: string;
  blurb: string;
  overview: string;
  dailyWork: string[];
  skills: string[];
  aiSkills: string[];
  companies: string[];
  colleges: string[];
  exams: string[];
  subjects: string[];
  certifications: string[];
  salary: { entry: number; mid: number; senior: number };
  growth: number;
  demand: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  duration: string;
  placement: number;
  match: number;
  flags: CareerFlag[];
  roadmap: { phase: string; title: string; detail: string }[];
  jobs: string[];
  story: { name: string; line: string };
  portfolioTip: string;
};

type Seed = {
  t: string; // title
  b: string; // blurb
  s: string; // skills csv
  c: string; // companies csv
  sal: [number, number, number]; // entry / mid / senior LPA
  g: number; // growth %
  d: 1 | 2 | 3 | 4 | 5; // difficulty
  x?: string; // exams csv
  col?: string; // colleges csv
  sub?: string; // subjects csv
  f?: CareerFlag[];
  dur?: string;
};

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/* ------------------------------------------------------------------ */
/* Stream definitions                                                  */
/* ------------------------------------------------------------------ */

export const streams: {
  id: StreamId;
  label: string;
  icon: string;
  tagline: string;
  description: string;
  accent: string; // tailwind gradient stops
}[] = [
  {
    id: "high-school",
    label: "High School",
    icon: "🎓",
    tagline: "Class 10 · Explore everything",
    description:
      "You haven't picked a stream yet. Explore 23 sectors, entrance exams, scholarships and future skills before you decide.",
    accent: "from-cyan-400 to-blue-500",
  },
  {
    id: "science",
    label: "Science",
    icon: "🔬",
    tagline: "PUC · 11th / 12th · PCM / PCB / PCMB",
    description:
      "Engineering, medicine, research and deep-tech. Pick your combination and see every career it unlocks.",
    accent: "from-fuchsia-400 to-purple-500",
  },
  {
    id: "commerce",
    label: "Commerce",
    icon: "💼",
    tagline: "Finance · Business · Analytics",
    description:
      "CA, CS, banking, markets, analytics and entrepreneurship — the money and decision side of every industry.",
    accent: "from-amber-400 to-orange-500",
  },
  {
    id: "arts",
    label: "Arts & Humanities",
    icon: "🎨",
    tagline: "Law · Media · Design · Civil Services",
    description:
      "Law, design, media, psychology and civil services. The most creative and most people-facing careers.",
    accent: "from-emerald-400 to-teal-500",
  },
];

export const streamById = (id: string) => streams.find((s) => s.id === id);

/* ------------------------------------------------------------------ */
/* Seeds                                                               */
/* ------------------------------------------------------------------ */

const HS: Record<string, Seed[]> = {
  Engineering: [
    { t: "Engineering", b: "Design and build the physical and digital systems the world runs on.", s: "Maths,Physics,Problem Solving,CAD", c: "L&T,Tata,Siemens,Infosys", sal: [5, 14, 32], g: 18, d: 4, x: "JEE Main,JEE Advanced,BITSAT,State CET", sub: "Physics,Chemistry,Maths", f: ["private", "abroad"] },
  ],
  Medical: [
    { t: "Medical", b: "Diagnose, treat and research human health across dozens of specialities.", s: "Biology,Diagnostics,Empathy,Stamina", c: "AIIMS,Apollo,Fortis,Manipal", sal: [7, 20, 60], g: 12, d: 5, x: "NEET UG,AIIMS,INI-CET", sub: "Physics,Chemistry,Biology", f: ["private", "government"], dur: "5.5 years" },
  ],
  Law: [
    { t: "Law", b: "Advise, litigate and shape the rules society operates by.", s: "Reasoning,Writing,Argumentation,Research", c: "Cyril Amarchand,Khaitan,Trilegal,AZB", sal: [6, 18, 50], g: 10, d: 4, x: "CLAT,AILET,LSAT India", sub: "Any stream", f: ["private", "government"] },
  ],
  Defence: [
    { t: "Defence", b: "Lead and serve in the Army, Navy or Air Force.", s: "Leadership,Fitness,Strategy,Discipline", c: "Indian Army,Indian Navy,IAF", sal: [8, 15, 28], g: 6, d: 4, x: "NDA,CDS,AFCAT", sub: "Any stream", f: ["government"] },
  ],
  Commerce: [
    { t: "Commerce Careers", b: "Accounting, finance, markets and business operations.", s: "Accounting,Analysis,Excel,Communication", c: "Deloitte,EY,KPMG,HDFC", sal: [4, 12, 30], g: 12, d: 3, x: "CUET,CA Foundation,IPMAT", sub: "Accountancy,Economics,Maths", f: ["private"] },
  ],
  Arts: [
    { t: "Arts & Humanities", b: "Literature, history, psychology, sociology and public policy.", s: "Writing,Critical Thinking,Research,Empathy", c: "Universities,NGOs,Media Houses", sal: [3, 9, 22], g: 8, d: 2, x: "CUET,DUET", sub: "History,Political Science,English", f: ["private", "government"] },
  ],
  Design: [
    { t: "Design", b: "Shape products, spaces and brands people love to use.", s: "Sketching,Figma,Typography,Research", c: "Titan,Zomato,Swiggy,Godrej", sal: [4, 12, 30], g: 16, d: 3, x: "NID DAT,UCEED,NIFT", sub: "Any stream", f: ["private", "freelance", "remote"] },
  ],
  Animation: [
    { t: "Animation & VFX", b: "Bring characters, films and games to life frame by frame.", s: "Blender,Maya,Rigging,Storyboarding", c: "DNEG,Technicolor,Prime Focus,Netflix", sal: [3, 10, 26], g: 14, d: 3, x: "NID DAT,Portfolio Review", sub: "Any stream", f: ["private", "freelance", "remote"] },
  ],
  "Government Jobs": [
    { t: "Government Jobs", b: "Stable, high-impact roles across central and state services.", s: "General Studies,Aptitude,Writing,Ethics", c: "UPSC,SSC,RRB,State PSC", sal: [5, 12, 25], g: 5, d: 4, x: "UPSC CSE,SSC CGL,RRB NTPC", sub: "Any stream", f: ["government"] },
  ],
  "Digital Careers": [
    { t: "Digital Careers", b: "Marketing, content, growth and community in a screen-first economy.", s: "SEO,Analytics,Copywriting,Ads", c: "Google,Meta,Zomato,Nykaa", sal: [3, 11, 28], g: 20, d: 2, x: "None", sub: "Any stream", f: ["remote", "freelance", "private"] },
  ],
  Sports: [
    { t: "Sports", b: "Compete, coach, or build the science behind performance.", s: "Training,Nutrition,Discipline,Strategy", c: "SAI,IPL Franchises,Decathlon", sal: [3, 12, 100], g: 9, d: 4, x: "Sports Quota Trials", sub: "Physical Education", f: ["private", "government"] },
  ],
  Hospitality: [
    { t: "Hospitality", b: "Run hotels, restaurants and world-class guest experiences.", s: "Operations,Service,Leadership,Languages", c: "Taj,Oberoi,Marriott,Hyatt", sal: [3, 9, 24], g: 11, d: 2, x: "NCHMCT JEE", sub: "Any stream", f: ["private", "abroad"] },
  ],
  Agriculture: [
    { t: "Agriculture & AgriTech", b: "Feed the planet with soil science, IoT and supply chains.", s: "Agronomy,Data,IoT,Supply Chain", c: "ITC,Mahindra Agri,DeHaat,Ninjacart", sal: [3, 9, 20], g: 12, d: 3, x: "ICAR AIEEA,State CET", sub: "Biology,Chemistry", f: ["private", "government"] },
  ],
  "AI & Robotics": [
    { t: "AI & Robotics", b: "Build machines that perceive, reason and act.", s: "Python,ML,ROS,Control Theory", c: "Google DeepMind,Boston Dynamics,Nvidia,Tata Elxsi", sal: [8, 25, 70], g: 38, d: 5, x: "JEE,GATE", sub: "Physics,Maths,Computer Science", f: ["ai", "private", "remote", "abroad"] },
  ],
  "Cyber Security": [
    { t: "Cyber Security", b: "Defend organisations from the fastest-growing category of crime.", s: "Networking,Linux,Pen Testing,Forensics", c: "Palo Alto,CrowdStrike,TCS,Wipro", sal: [6, 18, 45], g: 34, d: 4, x: "JEE,CUET", sub: "Computer Science,Maths", f: ["remote", "private", "abroad"] },
  ],
  "Space Science": [
    { t: "Space Science", b: "Design satellites, launch vehicles and missions beyond Earth.", s: "Physics,Aerospace,Simulation,Maths", c: "ISRO,Skyroot,Agnikul,SpaceX", sal: [7, 18, 40], g: 15, d: 5, x: "JEE Advanced,IIST,GATE", sub: "Physics,Maths", f: ["government", "abroad"] },
  ],
  "Data Science": [
    { t: "Data Science", b: "Turn messy data into decisions, forecasts and products.", s: "Python,SQL,Statistics,Storytelling", c: "Amazon,Flipkart,Swiggy,Fractal", sal: [7, 20, 50], g: 28, d: 4, x: "JEE,CUET,ISI Admission", sub: "Maths,Statistics,Computer Science", f: ["ai", "remote", "private"] },
  ],
  Teaching: [
    { t: "Teaching", b: "Shape the next generation in schools, colleges or online.", s: "Pedagogy,Subject Depth,Empathy,Communication", c: "Schools,Universities,BYJU'S,Unacademy", sal: [3, 8, 20], g: 7, d: 2, x: "CTET,NET,B.Ed Entrance", sub: "Any stream", f: ["government", "private", "remote"] },
  ],
  Banking: [
    { t: "Banking", b: "Credit, operations and wealth across public and private banks.", s: "Aptitude,Finance,Compliance,Sales", c: "SBI,HDFC,ICICI,RBI", sal: [4, 11, 28], g: 9, d: 3, x: "IBPS PO,SBI PO,RBI Grade B", sub: "Any stream", f: ["government", "private"] },
  ],
  Police: [
    { t: "Police Services", b: "Law enforcement, investigation and public safety leadership.", s: "Fitness,Law,Investigation,Leadership", c: "State Police,CBI,CRPF", sal: [5, 12, 24], g: 5, d: 4, x: "UPSC CSE,State PSC,SSC GD", sub: "Any stream", f: ["government"] },
  ],
  Fashion: [
    { t: "Fashion", b: "Design, style and merchandise what the world wears next.", s: "Sketching,Textiles,Trend Research,Draping", c: "Aditya Birla Fashion,Myntra,Zara,Raymond", sal: [3, 10, 28], g: 10, d: 3, x: "NIFT,NID,Pearl Academy", sub: "Any stream", f: ["private", "freelance"] },
  ],
  Gaming: [
    { t: "Gaming", b: "Build, design or compete in interactive worlds.", s: "Unity,C#,Game Design,3D Math", c: "Ubisoft,Rockstar,Krafton,Dream11", sal: [4, 14, 35], g: 17, d: 4, x: "JEE,Portfolio Review", sub: "Computer Science,Maths", f: ["private", "remote", "startup"] },
  ],
  "Content Creator": [
    { t: "Content Creator", b: "Build an audience and turn attention into a business.", s: "Video,Storytelling,Editing,Branding", c: "YouTube,Instagram,Spotify,Brands", sal: [2, 15, 100], g: 22, d: 2, x: "None", sub: "Any stream", f: ["freelance", "remote", "startup"] },
  ],
};

const PCM: Seed[] = [
  { t: "Software Engineer", b: "Design and ship production software used by millions.", s: "DSA,TypeScript,System Design,Git", c: "Google,Microsoft,Atlassian,Razorpay", sal: [8, 24, 60], g: 18, d: 4, x: "JEE Main,JEE Advanced,BITSAT", f: ["remote", "private", "abroad", "startup"] },
  { t: "AI Engineer", b: "Build, fine-tune and deploy LLM-powered products.", s: "Python,PyTorch,LLMs,MLOps", c: "OpenAI,Google DeepMind,Nvidia,Sarvam AI", sal: [12, 32, 90], g: 38, d: 5, x: "JEE Advanced,GATE", f: ["ai", "remote", "abroad", "private"] },
  { t: "Data Scientist", b: "Model behaviour and forecast outcomes from data.", s: "Python,SQL,Statistics,ML", c: "Amazon,Fractal,Swiggy,Mu Sigma", sal: [8, 22, 55], g: 26, d: 4, x: "JEE,ISI Admission,GATE", f: ["ai", "remote", "private"] },
  { t: "Machine Learning Engineer", b: "Take models from notebook to production scale.", s: "Python,TensorFlow,Kubernetes,Feature Stores", c: "Meta,Uber,Flipkart,Zeta", sal: [10, 28, 70], g: 33, d: 5, x: "JEE,GATE", f: ["ai", "remote", "abroad"] },
  { t: "Cyber Security Analyst", b: "Detect, hunt and stop attackers in real time.", s: "Networking,SIEM,Pen Testing,Linux", c: "CrowdStrike,Palo Alto,TCS,Deloitte", sal: [6, 18, 45], g: 34, d: 4, x: "JEE,CUET", f: ["remote", "private", "abroad"] },
  { t: "Cloud Engineer", b: "Architect resilient distributed infrastructure.", s: "AWS,Kubernetes,Terraform,Linux", c: "AWS,Azure,Google Cloud,Infosys", sal: [7, 20, 50], g: 27, d: 4, x: "JEE,State CET", f: ["remote", "private", "abroad"] },
  { t: "Mechanical Engineer", b: "Design machines, engines and manufacturing systems.", s: "CAD,Thermodynamics,FEA,Manufacturing", c: "Tata Motors,Bosch,L&T,Ashok Leyland", sal: [4, 12, 30], g: 8, d: 4, x: "JEE Main,GATE,State CET", f: ["private"] },
  { t: "Civil Engineer", b: "Build bridges, metros, towers and smart cities.", s: "STAAD Pro,AutoCAD,Structures,Surveying", c: "L&T,AECOM,Shapoorji,NHAI", sal: [4, 11, 28], g: 7, d: 3, x: "JEE Main,GATE,State CET", f: ["private", "government"] },
  { t: "Electrical Engineer", b: "Power systems, grids and electric mobility.", s: "Circuits,Power Systems,MATLAB,PLC", c: "Siemens,ABB,Tata Power,Ola Electric", sal: [4, 12, 30], g: 10, d: 4, x: "JEE Main,GATE", f: ["private", "government"] },
  { t: "Robotics Engineer", b: "Make machines that perceive, decide and act.", s: "ROS,Control Theory,C++,CAD", c: "Boston Dynamics,Tata Elxsi,GreyOrange,ABB", sal: [7, 20, 50], g: 28, d: 5, x: "JEE Advanced,GATE", f: ["ai", "abroad", "private"] },
  { t: "Game Developer", b: "Engineer immersive interactive worlds.", s: "Unity,Unreal,C#,3D Math", c: "Ubisoft,Krafton,Rockstar,Nazara", sal: [5, 15, 38], g: 17, d: 4, x: "JEE,Portfolio Review", f: ["remote", "startup", "private"] },
  { t: "Space Scientist", b: "Work on launch vehicles, payloads and deep-space missions.", s: "Orbital Mechanics,Physics,Simulation,MATLAB", c: "ISRO,Skyroot,Agnikul,NASA", sal: [7, 18, 40], g: 15, d: 5, x: "IIST,JEE Advanced,GATE", f: ["government", "abroad"] },
  { t: "Pilot", b: "Command commercial aircraft on domestic and global routes.", s: "Navigation,Situational Awareness,Physics,Comms", c: "IndiGo,Air India,Emirates,Vistara", sal: [12, 30, 80], g: 11, d: 4, x: "DGCA CPL,Airline Cadet Programs", f: ["private", "abroad"], dur: "18–24 months" },
  { t: "Merchant Navy Officer", b: "Move 90% of world trade across oceans.", s: "Navigation,Marine Engineering,Discipline,Safety", c: "Maersk,MSC,Shipping Corp of India", sal: [8, 22, 60], g: 8, d: 4, x: "IMU CET,Sponsorship Tests", f: ["abroad", "private"] },
  { t: "Architect", b: "Design the spaces people live, work and gather in.", s: "AutoCAD,Revit,Design Theory,Site Planning", c: "Morphogenesis,HOK,L&T,Godrej Properties", sal: [4, 12, 32], g: 8, d: 4, x: "NATA,JEE Paper 2", f: ["private", "freelance"], dur: "5 years" },
  { t: "Physics Researcher", b: "Push the frontier of what humanity knows.", s: "Theory,Experimentation,Python,Academic Writing", c: "TIFR,IISc,CERN,IITs", sal: [5, 14, 30], g: 9, d: 5, x: "JEST,IIT JAM,GATE", f: ["government", "abroad"] },
  { t: "Mathematician", b: "Model the world with pure and applied mathematics.", s: "Proof,Statistics,Optimisation,Python", c: "ISI,IISc,Jane Street,Goldman Sachs", sal: [6, 18, 45], g: 12, d: 5, x: "ISI Admission,IIT JAM,CMI", f: ["abroad", "private"] },
  { t: "Data Analyst", b: "Answer business questions with dashboards and SQL.", s: "SQL,Excel,Power BI,Storytelling", c: "Deloitte,Zomato,Flipkart,PhonePe", sal: [4, 12, 28], g: 21, d: 2, x: "CUET,JEE", f: ["remote", "private"] },
  { t: "Electronics Engineer", b: "Design chips, embedded systems and IoT hardware.", s: "VLSI,Embedded C,PCB Design,Signals", c: "Qualcomm,Intel,Texas Instruments,Bosch", sal: [5, 16, 40], g: 14, d: 4, x: "JEE Main,GATE", f: ["private", "abroad"] },
  { t: "Chemical Engineer", b: "Scale reactions into plants, energy and materials.", s: "Process Design,Thermodynamics,Aspen,Safety", c: "Reliance,IOCL,BASF,Unilever", sal: [5, 14, 34], g: 8, d: 4, x: "JEE Main,GATE", f: ["private", "government"] },
  { t: "Blockchain Developer", b: "Build decentralised protocols and smart contracts.", s: "Solidity,Cryptography,Node.js,EVM", c: "Polygon,CoinDCX,Consensys,Coinbase", sal: [8, 22, 60], g: 19, d: 4, x: "JEE,Portfolio Review", f: ["remote", "freelance", "startup", "abroad"] },
  { t: "AR/VR Developer", b: "Build spatial computing experiences.", s: "Unity,C#,3D Modelling,Spatial UX", c: "Meta,Apple,Tata Elxsi,Lenskart", sal: [6, 17, 42], g: 24, d: 4, x: "JEE,Portfolio Review", f: ["remote", "startup", "abroad"] },
  { t: "Automobile Engineer", b: "Engineer vehicles and the EV transition.", s: "CAD,Vehicle Dynamics,Battery Systems,Testing", c: "Tata Motors,Mahindra,Ola Electric,Bosch", sal: [4, 13, 32], g: 12, d: 4, x: "JEE Main,GATE", f: ["private"] },
];

const PCB: Seed[] = [
  { t: "Doctor", b: "Diagnose and treat patients across specialities.", s: "Clinical Reasoning,Anatomy,Empathy,Stamina", c: "AIIMS,Apollo,Fortis,Max", sal: [8, 24, 70], g: 12, d: 5, x: "NEET UG,NEET PG,INI-CET", dur: "5.5 + 3 years", f: ["private", "government", "abroad"] },
  { t: "Dentist", b: "Restore oral health, aesthetics and function.", s: "Dexterity,Anatomy,Patient Care,Prosthodontics", c: "Clove Dental,Apollo White,Private Practice", sal: [4, 12, 35], g: 9, d: 4, x: "NEET UG,NEET MDS", f: ["private", "freelance"] },
  { t: "Nurse", b: "Front-line patient care and clinical advocacy.", s: "Patient Care,Pharmacology,Triage,Empathy", c: "AIIMS,Manipal,NHS,Apollo", sal: [3, 8, 20], g: 14, d: 3, x: "NEET UG (BSc Nursing)", f: ["government", "private", "abroad"] },
  { t: "Pharmacist", b: "Medication safety, dispensing and pharma R&D.", s: "Pharmacology,Chemistry,Regulatory,Counselling", c: "Sun Pharma,Cipla,Dr Reddy's,Apollo", sal: [3, 9, 22], g: 10, d: 3, x: "NEET UG,GPAT,State CET", f: ["private", "government"] },
  { t: "Veterinarian", b: "Treat animals and safeguard livestock health.", s: "Animal Anatomy,Surgery,Diagnostics,Empathy", c: "Govt Vet Hospitals,Zoetis,Private Clinics", sal: [4, 10, 24], g: 8, d: 4, x: "NEET UG (BVSc)", f: ["government", "private"] },
  { t: "Microbiologist", b: "Study microbes for health, food and industry.", s: "Lab Technique,Culturing,Data Analysis,Sterility", c: "Serum Institute,Biocon,FSSAI,Novozymes", sal: [3, 9, 20], g: 11, d: 3, x: "CUET,NEET,GATE BT", f: ["private", "government"] },
  { t: "Biotechnologist", b: "Engineer biology into medicine and materials.", s: "Molecular Biology,CRISPR,Bioinformatics,Lab Ops", c: "Biocon,Syngene,Novartis,Bharat Biotech", sal: [4, 12, 30], g: 16, d: 4, x: "CUET,GATE BT,JEE (B.Tech BT)", f: ["private", "abroad"] },
  { t: "Genetic Scientist", b: "Decode genomes to treat and prevent disease.", s: "Genomics,Bioinformatics,Python,Statistics", c: "MedGenome,Illumina,CSIR,Broad Institute", sal: [5, 15, 38], g: 20, d: 5, x: "CSIR-NET,GATE BT,CUET", f: ["abroad", "private"] },
  { t: "Physiotherapist", b: "Restore movement after injury, surgery or illness.", s: "Anatomy,Manual Therapy,Rehab Planning,Empathy", c: "Apollo,Sports Teams,Private Clinics", sal: [3, 8, 20], g: 13, d: 3, x: "NEET UG,State BPT Entrance", f: ["private", "freelance"] },
  { t: "Nutritionist", b: "Design diets for health, performance and recovery", s: "Biochemistry,Diet Planning,Counselling,Research", c: "Hospitals,Cult.fit,HealthifyMe,Sports Teams", sal: [3, 8, 20], g: 15, d: 2, x: "CUET,State Entrance", f: ["freelance", "remote", "private"] },
  { t: "Psychologist", b: "Assess and treat the architecture of the mind.", s: "Therapy,Assessment,Research,Empathy", c: "Hospitals,Amaha,Practo,Schools", sal: [3, 10, 25], g: 18, d: 4, x: "CUET,NIMHANS Entrance", f: ["private", "freelance", "remote"] },
  { t: "Forensic Scientist", b: "Turn physical evidence into courtroom truth.", s: "Chemistry,Toxicology,Documentation,Ethics", c: "CFSL,State FSL,CBI,NIA", sal: [4, 10, 22], g: 12, d: 4, x: "CUET,State FSL Entrance", f: ["government"] },
  { t: "Medical Lab Technician", b: "Run the diagnostics every treatment depends on.", s: "Sample Handling,Instrumentation,QC,Biochemistry", c: "Dr Lal PathLabs,Metropolis,Apollo,SRL", sal: [2, 6, 14], g: 12, d: 2, x: "State Paramedical Entrance,CUET", f: ["private", "government"] },
  { t: "Public Health Officer", b: "Design programmes that protect whole populations.", s: "Epidemiology,Statistics,Policy,Field Ops", c: "WHO,UNICEF,NHM,Gates Foundation", sal: [5, 14, 32], g: 14, d: 4, x: "CUET,MPH Entrance", f: ["government", "abroad"] },
  { t: "Biomedical Engineer", b: "Build the devices modern medicine runs on.", s: "Instrumentation,Signals,CAD,Regulatory", c: "GE Healthcare,Philips,Siemens Healthineers", sal: [5, 14, 34], g: 17, d: 4, x: "JEE Main,GATE BM,CUET", f: ["private", "abroad"] },
  { t: "Radiologist", b: "Read imaging to find what no one else can see.", s: "Imaging,Anatomy,AI Tools,Pattern Recognition", c: "AIIMS,Apollo,Qure.ai,Max", sal: [12, 30, 80], g: 15, d: 5, x: "NEET UG,NEET PG", f: ["private", "abroad"] },
];

const PCMB_EXTRA: Seed[] = [
  { t: "Bioinformatics Scientist", b: "Where biology meets code — genomes at compute scale.", s: "Python,Genomics,Statistics,Linux", c: "MedGenome,Strand Life,Illumina", sal: [6, 16, 38], g: 22, d: 5, x: "GATE BT,CUET,JAM", f: ["ai", "abroad", "remote"] },
  { t: "Medical AI Researcher", b: "Train models that read scans, notes and genomes.", s: "Deep Learning,Medical Imaging,Python,Ethics", c: "Qure.ai,Google Health,Nvidia,AIIMS", sal: [10, 26, 65], g: 35, d: 5, x: "JEE,GATE,NEET (dual paths)", f: ["ai", "abroad", "remote"] },
  { t: "Agricultural Scientist", b: "Improve yield, resilience and food security.", s: "Agronomy,Genetics,Field Trials,Data", c: "ICAR,Bayer,Syngenta,DeHaat", sal: [4, 11, 26], g: 10, d: 4, x: "ICAR AIEEA,CUET", f: ["government", "private"] },
];

const COMMERCE: Seed[] = [
  { t: "Chartered Accountant", b: "The final word on financial truth in any organisation.", s: "Accounting,Audit,Tax,IndAS", c: "Deloitte,EY,PwC,KPMG", sal: [8, 20, 50], g: 10, d: 5, x: "CA Foundation,CA Intermediate,CA Final", dur: "4–5 years", f: ["private"] },
  { t: "Company Secretary", b: "Governance, compliance and boardroom law.", s: "Corporate Law,Compliance,Drafting,Ethics", c: "Reliance,Infosys,Law Firms,Listed Cos", sal: [5, 14, 32], g: 8, d: 4, x: "CSEET,CS Executive,CS Professional", f: ["private"] },
  { t: "Cost & Management Accountant", b: "Own unit economics, costing and margins.", s: "Costing,Budgeting,ERP,Analysis", c: "Tata Steel,ITC,L&T,Maruti", sal: [5, 13, 30], g: 9, d: 4, x: "CMA Foundation,CMA Inter,CMA Final", f: ["private", "government"] },
  { t: "Investment Banker", b: "Architect the deals that move global capital.", s: "Valuation,Financial Modelling,M&A,Pitching", c: "Goldman Sachs,JP Morgan,Kotak,Avendus", sal: [12, 35, 100], g: 12, d: 5, x: "CAT,CFA,GMAT", f: ["private", "abroad"] },
  { t: "Business Analyst", b: "Translate business problems into data and requirements.", s: "SQL,Excel,Process Mapping,Stakeholder Mgmt", c: "Accenture,Deloitte,Amazon,Zomato", sal: [5, 14, 32], g: 18, d: 3, x: "CAT,CUET,CFA L1", f: ["remote", "private"] },
  { t: "Accountant", b: "Keep the books accurate, compliant and audit-ready.", s: "Tally,GST,Bookkeeping,Excel", c: "SMEs,CA Firms,Corporates", sal: [3, 7, 16], g: 6, d: 2, x: "B.Com,CA Foundation (optional)", f: ["private"] },
  { t: "Financial Analyst", b: "Forecast, value and advise on capital decisions.", s: "Modelling,Valuation,Excel,Equity Research", c: "Morgan Stanley,Nomura,HDFC AMC,Zerodha", sal: [6, 18, 42], g: 14, d: 4, x: "CFA,CAT,FRM", f: ["remote", "private", "abroad"] },
  { t: "Stock Market Trader", b: "Take positions and manage risk in live markets.", s: "Technical Analysis,Risk Management,Psychology,Python", c: "Prop Desks,Zerodha,Jane Street,Edelweiss", sal: [5, 20, 100], g: 13, d: 5, x: "NISM Certifications,CFA", f: ["remote", "freelance", "private"] },
  { t: "Bank Manager", b: "Run a branch: credit, operations, people and growth.", s: "Credit Appraisal,Leadership,Compliance,Sales", c: "SBI,HDFC,ICICI,Axis", sal: [6, 15, 32], g: 8, d: 3, x: "IBPS PO,SBI PO,RBI Grade B", f: ["government", "private"] },
  { t: "Insurance Officer", b: "Underwrite risk and design protection products.", s: "Underwriting,Actuarial Basics,Sales,Compliance", c: "LIC,HDFC Life,ICICI Lombard,Bajaj Allianz", sal: [4, 10, 24], g: 7, d: 3, x: "LIC AAO,IRDA Certifications", f: ["government", "private"] },
  { t: "Digital Marketing Manager", b: "Grow brands with performance, SEO and lifecycle.", s: "SEO,Google Ads,Analytics,Copywriting", c: "Nykaa,Zomato,Meta,Dentsu", sal: [4, 13, 32], g: 20, d: 2, x: "None,Google/Meta Certifications", f: ["remote", "freelance", "startup"] },
  { t: "HR Manager", b: "Hire, develop and retain the people who build the company.", s: "Recruiting,Employee Relations,Analytics,Policy", c: "Infosys,Accenture,Flipkart,Unilever", sal: [4, 13, 32], g: 11, d: 3, x: "CAT,XAT,TISSNET", f: ["private", "remote"] },
  { t: "Supply Chain Manager", b: "Move goods across the world on time and on cost.", s: "Logistics,SAP,Forecasting,Negotiation", c: "Amazon,Flipkart,Delhivery,Maersk", sal: [5, 15, 36], g: 15, d: 3, x: "CAT,SCM Certifications", f: ["private"] },
  { t: "Entrepreneur", b: "Build a company from zero to one.", s: "Sales,Product Sense,Fundraising,Resilience", c: "Your own venture,Y Combinator,Sequoia", sal: [0, 15, 200], g: 25, d: 5, x: "None,IPMAT (for BBA)", f: ["startup", "freelance", "remote"] },
  { t: "Economist", b: "Explain and forecast how markets and policy behave.", s: "Econometrics,Statistics,Research,Writing", c: "RBI,NITI Aayog,World Bank,Crisil", sal: [6, 16, 40], g: 10, d: 5, x: "ISI Admission,DSE Entrance,UPSC IES", f: ["government", "abroad"] },
  { t: "Tax Consultant", b: "Optimise and defend tax positions legally.", s: "Direct Tax,GST,Drafting,Advisory", c: "EY,PwC,BDO,Independent Practice", sal: [4, 12, 30], g: 9, d: 4, x: "CA,LLB,CMA", f: ["freelance", "private"] },
  { t: "Auditor", b: "Independently verify that the numbers tell the truth.", s: "Audit Standards,Sampling,Internal Controls,Ethics", c: "Deloitte,Grant Thornton,CAG,KPMG", sal: [5, 13, 30], g: 8, d: 4, x: "CA,CIA,CAG Exams", f: ["private", "government"] },
  { t: "E-commerce Manager", b: "Own an online storefront end to end.", s: "Catalogue Ops,CRO,Ads,Analytics", c: "Amazon,Myntra,Nykaa,Shopify Brands", sal: [4, 13, 32], g: 17, d: 3, x: "None,CAT (for MBA)", f: ["remote", "startup", "private"] },
  { t: "Retail Manager", b: "Run stores, teams and category performance.", s: "Merchandising,People Ops,Inventory,Sales", c: "Reliance Retail,DMart,Tata Cliq,IKEA", sal: [3, 10, 24], g: 8, d: 2, x: "CAT,Retail Management Diploma", f: ["private"] },
  { t: "International Business Manager", b: "Trade, export and expand across borders.", s: "Trade Finance,Cross-cultural Comms,Logistics,Languages", c: "Maersk,ITC,Tata International,DHL", sal: [5, 15, 38], g: 12, d: 3, x: "CAT,IIFT Entrance", f: ["abroad", "private"] },
];

const ARTS: Seed[] = [
  { t: "Lawyer", b: "Advise, litigate and negotiate inside complex legal systems.", s: "Legal Research,Drafting,Argumentation,Ethics", c: "Cyril Amarchand,Trilegal,AZB,Khaitan", sal: [6, 18, 60], g: 10, d: 4, x: "CLAT,AILET,LSAT India", dur: "5 years", f: ["private", "government"] },
  { t: "Journalist", b: "Report the truth and hold power accountable.", s: "Reporting,Interviewing,Writing,Verification", c: "The Hindu,Indian Express,Reuters,Scroll", sal: [3, 9, 24], g: 6, d: 3, x: "CUET,IIMC Entrance", f: ["private", "freelance"] },
  { t: "Mass Communication Specialist", b: "Shape narratives across PR, media and broadcast.", s: "Media Planning,PR,Scripting,Production", c: "Ogilvy,Adfactors,NDTV,Netflix", sal: [3, 10, 26], g: 12, d: 2, x: "CUET,IIMC,XIC", f: ["private", "freelance"] },
  { t: "Graphic Designer", b: "Make ideas visible through type, colour and layout.", s: "Illustrator,Photoshop,Typography,Branding", c: "Ogilvy,Zomato,Dentsu,Freelance", sal: [3, 9, 24], g: 12, d: 2, x: "NID DAT,UCEED,Portfolio Review", f: ["freelance", "remote"] },
  { t: "UI/UX Designer", b: "Craft interfaces people love to use every day.", s: "Figma,User Research,Prototyping,Design Systems", c: "Swiggy,Razorpay,Google,Microsoft", sal: [5, 15, 40], g: 18, d: 3, x: "UCEED,NID DAT,Portfolio Review", f: ["remote", "private", "abroad"] },
  { t: "Animator", b: "Bring characters and stories to life.", s: "Blender,Maya,Rigging,Timing", c: "DNEG,Prime Focus,Netflix,Technicolor", sal: [3, 10, 28], g: 14, d: 3, x: "NID DAT,Portfolio Review", f: ["freelance", "remote", "private"] },
  { t: "Fashion Designer", b: "Define what people wear next season.", s: "Draping,Textiles,Sketching,Trend Research", c: "Sabyasachi,Aditya Birla Fashion,Zara,Myntra", sal: [3, 10, 30], g: 10, d: 3, x: "NIFT,NID,Pearl Academy", f: ["freelance", "private"] },
  { t: "Interior Designer", b: "Turn empty space into experience.", s: "SketchUp,Space Planning,Materials,Client Mgmt", c: "Livspace,Design Cafe,Godrej Interio,Freelance", sal: [3, 10, 28], g: 13, d: 3, x: "NID DAT,UCEED,NATA", f: ["freelance", "private"] },
  { t: "Teacher", b: "Shape how a generation learns to think.", s: "Pedagogy,Classroom Mgmt,Empathy,Assessment", c: "Schools,DAV,Kendriya Vidyalaya,Online Platforms", sal: [3, 8, 18], g: 7, d: 2, x: "CTET,B.Ed Entrance,TET", f: ["government", "private", "remote"] },
  { t: "Professor", b: "Teach, research and publish at university level.", s: "Research,Academic Writing,Lecturing,Mentoring", c: "DU,JNU,Ashoka,IITs", sal: [6, 15, 32], g: 6, d: 5, x: "UGC NET,JRF,PhD Entrance", dur: "7+ years", f: ["government", "abroad"] },
  { t: "Historian", b: "Reconstruct the past from evidence and archives.", s: "Archival Research,Languages,Writing,Analysis", c: "ASI,Universities,Museums,Publishers", sal: [3, 9, 20], g: 4, d: 4, x: "CUET,UGC NET", f: ["government"] },
  { t: "Clinical Psychologist", b: "Help people navigate the mind and heal.", s: "Therapy,Assessment,Ethics,Empathy", c: "NIMHANS,Amaha,Hospitals,Private Practice", sal: [4, 11, 28], g: 18, d: 4, x: "CUET,NIMHANS,RCI M.Phil", f: ["private", "freelance", "remote"] },
  { t: "Social Worker", b: "Build programmes that change lives at community scale.", s: "Fieldwork,Counselling,Programme Design,Advocacy", c: "UNICEF,Pratham,CRY,Govt Schemes", sal: [3, 8, 18], g: 9, d: 2, x: "TISSNET,CUET", f: ["government", "abroad"] },
  { t: "Writer / Author", b: "Turn ideas into books, scripts and long-form work.", s: "Storytelling,Editing,Research,Discipline", c: "Penguin,HarperCollins,Netflix,Substack", sal: [2, 8, 40], g: 8, d: 3, x: "None", f: ["freelance", "remote"] },
  { t: "Filmmaker", b: "Translate scripts into cinematic moments.", s: "Direction,Screenwriting,Editing,Leadership", c: "Dharma,Netflix,Amazon Studios,Independent", sal: [3, 12, 60], g: 9, d: 5, x: "FTII,SRFTI,Portfolio Review", f: ["freelance", "private"] },
  { t: "Actor", b: "Perform for screen, stage and streaming.", s: "Acting Technique,Voice,Movement,Auditioning", c: "Netflix,Amazon,Theatre Groups,Ad Films", sal: [2, 10, 100], g: 8, d: 4, x: "NSD,FTII Auditions", f: ["freelance"] },
  { t: "Musician", b: "Compose, produce and perform across genres.", s: "Composition,DAW,Mixing,Performance", c: "T-Series,Spotify,Studios,Live Circuits", sal: [2, 9, 50], g: 9, d: 3, x: "None,Music College Auditions", f: ["freelance", "remote"] },
  { t: "Photographer", b: "Capture the moments brands and people remember.", s: "Lighting,Composition,Lightroom,Client Mgmt", c: "Brands,Studios,Magazines,Freelance", sal: [2, 8, 25], g: 7, d: 2, x: "None,Portfolio Review", f: ["freelance", "remote"] },
  { t: "Event Manager", b: "Produce experiences from concept to curtain.", s: "Planning,Vendor Mgmt,Budgeting,Ops", c: "Wizcraft,BookMyShow,Percept,Freelance", sal: [3, 9, 24], g: 11, d: 2, x: "CUET,NIEM", f: ["freelance", "private"] },
  { t: "Civil Services Officer", b: "Lead public administration and nation-building.", s: "General Studies,Policy,Ethics,Leadership", c: "IAS,IPS,IFS,State Services", sal: [7, 15, 30], g: 5, d: 5, x: "UPSC CSE Prelims,Mains,Interview", dur: "2–4 years prep", f: ["government"] },
  { t: "Travel & Tourism Manager", b: "Design journeys and run travel operations.", s: "Itinerary Design,Sales,Languages,Ops", c: "MakeMyTrip,Thomas Cook,Taj,Airbnb", sal: [3, 9, 22], g: 12, d: 2, x: "CUET,IITTM Entrance", f: ["abroad", "private"] },
  { t: "Language Expert", b: "Translate, interpret and localise across cultures.", s: "Fluency,Translation,Localisation,Cultural Context", c: "Embassies,Netflix,Google,UN", sal: [3, 10, 28], g: 14, d: 3, x: "CUET,JNU Entrance,Proficiency Tests", f: ["remote", "freelance", "abroad"] },
];

/* ------------------------------------------------------------------ */
/* Expansion                                                           */
/* ------------------------------------------------------------------ */

const DEFAULT_COLLEGES: Record<StreamId, string[]> = {
  "high-school": ["Kendriya Vidyalaya", "DPS", "Narayana", "Allen Career Institute"],
  science: ["IIT Bombay", "IISc Bangalore", "AIIMS Delhi", "BITS Pilani", "NIT Trichy"],
  commerce: ["SRCC Delhi", "St. Xavier's Mumbai", "Christ University", "NMIMS", "IIM Indore (IPM)"],
  arts: ["St. Stephen's Delhi", "NLSIU Bangalore", "NID Ahmedabad", "TISS Mumbai", "JNU"],
};

const DEFAULT_SUBJECTS: Record<string, string[]> = {
  PCM: ["Physics", "Chemistry", "Mathematics"],
  PCB: ["Physics", "Chemistry", "Biology"],
  PCMB: ["Physics", "Chemistry", "Maths", "Biology"],
  Commerce: ["Accountancy", "Business Studies", "Economics"],
  Arts: ["Any Humanities Combination"],
};

const csv = (v?: string) => (v ? v.split(",").map((x) => x.trim()).filter(Boolean) : []);

function expand(seed: Seed, stream: StreamId, group: string): Career {
  const skills = csv(seed.s);
  const flags = seed.f ?? ["private"];
  const demand = Math.min(99, 45 + seed.g + (flags.includes("ai") ? 8 : 0));
  const match = Math.max(52, Math.min(98, Math.round(demand * 0.7 + (6 - seed.d) * 5)));
  return {
    slug: slugify(`${seed.t}`),
    title: seed.t,
    stream,
    group,
    blurb: seed.b,
    overview: `${seed.t} sits at the intersection of ${skills.slice(0, 2).join(" and ")}. ${seed.b} Demand is growing at roughly ${seed.g}% year over year, and the role is increasingly augmented — not replaced — by AI tooling.`,
    dailyWork: [
      `Deep work on ${skills[0] ?? "core craft"} for 3–4 hours`,
      `Collaborating with teammates and stakeholders`,
      `Reviewing outputs, quality and edge cases`,
      `Learning: staying current with tools in ${group}`,
    ],
    skills,
    aiSkills: flags.includes("ai")
      ? ["Prompt Engineering", "Model Evaluation", "Vector Databases", "AI Ethics"]
      : ["AI-assisted research", "Prompt Engineering", `AI tooling for ${group}`],
    companies: csv(seed.c),
    colleges: csv(seed.col).length ? csv(seed.col) : DEFAULT_COLLEGES[stream],
    exams: csv(seed.x).length ? csv(seed.x) : ["CUET"],
    subjects: csv(seed.sub).length ? csv(seed.sub) : DEFAULT_SUBJECTS[group] ?? ["Any stream"],
    certifications: [
      `Foundation certificate in ${skills[0] ?? seed.t}`,
      `Industry certification in ${skills[1] ?? group}`,
      "Portfolio / capstone project",
    ],
    salary: { entry: seed.sal[0], mid: seed.sal[1], senior: seed.sal[2] },
    growth: seed.g,
    demand,
    difficulty: seed.d,
    duration: seed.dur ?? "3–4 years",
    placement: Math.min(97, 60 + Math.round(seed.g * 0.8)),
    match,
    flags,
    roadmap: [
      { phase: "Year 0–1", title: "Foundations", detail: `Master ${skills.slice(0, 2).join(", ")} and clear the entrance path (${csv(seed.x)[0] ?? "CUET"}).` },
      { phase: "Year 1–2", title: "Specialisation", detail: `Go deep on ${skills[2] ?? skills[0]} and build two real projects.` },
      { phase: "Year 2–3", title: "Proof of work", detail: `Internship at a company like ${csv(seed.c)[0]} plus a public portfolio.` },
      { phase: "Year 3–4", title: "Launch", detail: `Target entry roles at ₹${seed.sal[0]}–${seed.sal[1]} LPA and keep compounding.` },
    ],
    jobs: [
      `Junior ${seed.t}`,
      `${seed.t} — Associate`,
      `Senior ${seed.t}`,
      `Lead / Head of ${group}`,
    ],
    story: {
      name: ["Aarav", "Priya", "Meera", "Rohan", "Ananya", "Kabir"][seed.t.length % 6],
      line: `Started with zero background, cleared ${csv(seed.x)[0] ?? "the entrance"} and now works as a ${seed.t}.`,
    },
    portfolioTip: `Show three ${group.toLowerCase()} projects that prove ${skills[0]} — depth beats volume every time.`,
  };
}

/* ------------------------------------------------------------------ */
/* Registry                                                            */
/* ------------------------------------------------------------------ */

const all: Career[] = [];

export const highSchoolSectors = Object.keys(HS);
for (const [sector, seeds] of Object.entries(HS)) {
  for (const s of seeds) all.push({ ...expand(s, "high-school", sector), slug: slugify(`hs-${s.t}`) });
}
for (const s of PCM) all.push(expand(s, "science", "PCM"));
for (const s of PCB) all.push(expand(s, "science", "PCB"));
for (const s of PCMB_EXTRA) all.push(expand(s, "science", "PCMB"));
for (const s of COMMERCE) all.push(expand(s, "commerce", "Commerce"));
for (const s of ARTS) all.push(expand(s, "arts", "Arts"));

export const careersHub = all;

export const careerBySlug = (slug: string) => all.find((c) => c.slug === slug);
export const careersByStream = (stream: StreamId) => all.filter((c) => c.stream === stream);
export const careersByGroup = (stream: StreamId, group: string) =>
  all.filter((c) => c.stream === stream && c.group === group);

export const scienceGroups = ["PCM", "PCB", "PCMB"] as const;

export const filterOptions: { id: CareerFlag; label: string }[] = [
  { id: "remote", label: "Remote friendly" },
  { id: "government", label: "Government" },
  { id: "private", label: "Private" },
  { id: "abroad", label: "Abroad" },
  { id: "freelance", label: "Freelancing" },
  { id: "startup", label: "Startup" },
  { id: "ai", label: "AI careers" },
];

/* Extra dashboard content ------------------------------------------- */

export const futureSkills = [
  "AI literacy & prompting",
  "Data reasoning",
  "Systems thinking",
  "Cross-cultural communication",
  "Creative problem solving",
  "Digital security hygiene",
  "Adaptability & learning velocity",
  "Financial literacy",
];

export const topEntranceExams = [
  { name: "JEE Main / Advanced", when: "Jan & Apr", for: "Engineering" },
  { name: "NEET UG", when: "May", for: "Medical" },
  { name: "CUET UG", when: "May–Jun", for: "All streams" },
  { name: "CLAT", when: "Dec", for: "Law" },
  { name: "NID DAT / UCEED / NIFT", when: "Jan", for: "Design" },
  { name: "NDA", when: "Apr & Sep", for: "Defence" },
  { name: "CA Foundation", when: "Jun & Dec", for: "Commerce" },
  { name: "IPMAT", when: "May", for: "Management" },
];

export const scholarshipList = [
  { name: "National Means-cum-Merit Scholarship", amount: "₹12,000/yr", who: "Class 9–12, merit + means" },
  { name: "INSPIRE Scholarship (SHE)", amount: "₹80,000/yr", who: "Top 1% in Class 12, science" },
  { name: "PM YASASVI", amount: "Up to ₹1.25L", who: "OBC / EBC / DNT students" },
  { name: "Reliance Foundation UG Scholarship", amount: "Up to ₹2L", who: "UG students, all streams" },
  { name: "Tata Trusts Scholarship", amount: "Varies", who: "Merit + need based" },
  { name: "Fulbright-Nehru", amount: "Full funding", who: "Study abroad, postgrad" },
];

export const careerClusters = [
  { name: "Build & Engineer", sectors: ["Engineering", "AI & Robotics", "Space Science", "Automobile"], color: "cyan" },
  { name: "Heal & Care", sectors: ["Medical", "Psychology", "Nutrition", "Public Health"], color: "emerald" },
  { name: "Money & Markets", sectors: ["Commerce", "Banking", "Investment", "Analytics"], color: "amber" },
  { name: "Create & Tell", sectors: ["Design", "Animation", "Film", "Content"], color: "fuchsia" },
  { name: "Lead & Serve", sectors: ["Civil Services", "Defence", "Police", "Teaching"], color: "blue" },
  { name: "Trade & Grow", sectors: ["E-commerce", "Hospitality", "Agriculture", "Startup"], color: "orange" },
];

export const universePlanets = [
  { name: "Engineering", stream: "science" as StreamId, group: "PCM", color: "#22d3ee", size: 88 },
  { name: "Medical", stream: "science" as StreamId, group: "PCB", color: "#34d399", size: 80 },
  { name: "AI & Data", stream: "science" as StreamId, group: "PCMB", color: "#a78bfa", size: 70 },
  { name: "Commerce", stream: "commerce" as StreamId, group: "Commerce", color: "#fbbf24", size: 84 },
  { name: "Arts & Law", stream: "arts" as StreamId, group: "Arts", color: "#f472b6", size: 82 },
  { name: "Explore All", stream: "high-school" as StreamId, group: "", color: "#60a5fa", size: 66 },
];
