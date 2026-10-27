
"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
} from "react";

import rulesData from "./rules.json";

type Rule = {
  intent: string;
  keywords: string[];
  reply: string;
};

type Message = {
  id: number;
  role: "bot" | "user";
  text: string;
};

type IconName =
  | "chat"
  | "arrow"
  | "admission"
  | "fee"
  | "clock"
  | "library"
  | "hostel"
  | "spark"
  | "check"
  | "menu"
  | "close"
  | "send"
  | "trash"
  | "shield";

const rules = rulesData as Rule[];

const WELCOME =
  "Hello! Welcome to UOS Helpdesk Bot. I can help you with admissions, fees, university timings, library facilities and hostel information. What would you like to know?";

const FALLBACK =
  "I'm sorry, I don't have information about that yet. You can ask about admissions, fees, university timings, library facilities, or hostels.";

const QUICK_QUESTIONS = [
  "How can I apply?",
  "What is the semester fee?",
  "What are the class timings?",
  "Tell me about the library",
  "Is hostel accommodation available?",
];

const SERVICES: {
  title: string;
  description: string;
  icon: IconName;
  question: string;
  tint: string;
}[] = [
  {
    title: "Admissions",
    description:
      "Explore admission guidance, eligibility information and application procedures.",
    icon: "admission",
    question: "How can I apply for admission?",
    tint: "bg-blue-50 text-blue-600",
  },
  {
    title: "Fee Structure",
    description:
      "Find out where to check programme fees, payment information and dues.",
    icon: "fee",
    question: "What is the semester fee?",
    tint: "bg-violet-50 text-violet-600",
  },
  {
    title: "Campus Timings",
    description:
      "Get guidance on departmental timetables and campus operating hours.",
    icon: "clock",
    question: "What are the class timings?",
    tint: "bg-cyan-50 text-cyan-700",
  },
  {
    title: "Library Facilities",
    description:
      "Learn where to check library access, borrowing and study resources.",
    icon: "library",
    question: "Tell me about library facilities",
    tint: "bg-indigo-50 text-indigo-600",
  },
  {
    title: "Hostel Accommodation",
    description:
      "Get guidance on hostel eligibility, applications and room allotment.",
    icon: "hostel",
    question: "Is hostel accommodation available?",
    tint: "bg-sky-50 text-sky-700",
  },
];

function Icon({
  name,
  size = 22,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const paths: Record<IconName, ReactNode> = {
    chat: (
      <>
        <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-5.5a9 9 0 0 1-.9-4A8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5Z" />
        <path d="M8 11.5h9M8 15h5" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </>
    ),
    admission: (
      <>
        <path d="m2 9 10-5 10 5-10 5L2 9Z" />
        <path d="M6 11v6c4 3 8 3 12 0v-6M22 9v7" />
      </>
    ),
    fee: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M3 10h18M7 15h4" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
    library: (
      <>
        <path d="M4 5.5C7 4 10 4 12 6v14c-2-2-5-2-8-.5V5.5Z" />
        <path d="M20 5.5c-3-1.5-6-1.5-8 .5v14c2-2 5-2 8-.5V5.5Z" />
      </>
    ),
    hostel: (
      <>
        <path d="M4 21V7l8-4 8 4v14M2 21h20" />
        <path d="M9 21v-7h6v7M8 9h1M15 9h1" />
      </>
    ),
    spark: (
      <>
        <path d="m12 2 1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8L12 2Z" />
        <path d="m19 17 .7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7L19 17Z" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="M5 5l14 14M19 5 5 19" />,
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4 20-7Z" />
        <path d="M22 2 11 13" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" />
        <path d="M10 11v6M14 11v6" />
      </>
    ),
    shield: (
      <>
        <path d="M12 2 4 5v6c0 5 3 8 8 11 5-3 8-6 8-11V5l-8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

// Normalise input without matching inside unrelated words.
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Match complete words and complete phrases.
function containsPhrase(message: string, phrase: string): boolean {
  const cleaned = normalise(phrase);
  if (!cleaned) return false;

  return (` ${message} `).includes(` ${cleaned} `);
}

// More specific phrases get higher scores.
// Multiple relevant keywords strengthen a category's score.
// Equal scores follow the order in rules.json.
function findReply(question: string): string {
  const message = normalise(question);

  if (!message) return FALLBACK;

  let bestRule: Rule | null = null;
  let highestScore = 0;

  for (const rule of rules) {
    let score = 0;
    let longestMatch = 0;

    for (const keyword of rule.keywords) {
      const phrase = normalise(keyword);

      if (containsPhrase(message, phrase)) {
        const words = phrase.split(" ").length;
        const points = words * 10 + phrase.length;

        score += points;
        longestMatch = Math.max(longestMatch, points);
      }
    }

    score += longestMatch;

    if (score > highestScore) {
      highestScore = score;
      bestRule = rule;
    }
  }

  return bestRule?.reply ?? FALLBACK;
}

function Brand({ light = false }: { light?: boolean }) {
  return (
    <a
      href="#home"
      className="inline-flex items-center gap-3"
      aria-label="UOS CONNECT homepage"
    >
      <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
        <span className="absolute inset-[5px] rounded-[7px] border border-white/40" />
        <span className="relative text-sm font-black tracking-tighter text-white">
          UC
        </span>
      </span>
      <span className="flex flex-col leading-tight">
        <span
          className={`text-[15px] font-extrabold tracking-[0.13em] ${
            light ? "text-white" : "text-slate-950"
          }`}
        >
          UOS CONNECT
        </span>
        <span
          className={`text-[10px] font-medium tracking-[0.15em] ${
            light ? "text-slate-400" : "text-slate-500"
          }`}
        >
          STUDENT HELP DESK
        </span>
      </span>
    </a>
  );
}

export default function Home() {
  const [chatOpen, setChatOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: "bot", text: WELCOME },
  ]);

  const nextId = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const queueEnd = useRef(0);

  useEffect(() => {
    return () => {
      pendingTimers.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (chatOpen) {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, typing, chatOpen]);

  useEffect(() => {
    if (chatOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 260);
      return () => clearTimeout(timer);
    }
  }, [chatOpen]);

  function sendQuestion(value: string) {
    const question = value.trim();
    if (!question) return;

    setChatOpen(true);
    setMenuOpen(false);
    setInput("");

    const userId = nextId.current++;

    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", text: question },
    ]);

    setTyping(true);

    // Queue answers to preserve response order.
    const now = Date.now();
    const replyAt = Math.max(now, queueEnd.current) + 700;
    queueEnd.current = replyAt;

    const timer = setTimeout(() => {
      const botId = nextId.current++;

      setMessages((prev) => [
        ...prev,
        {
          id: botId,
          role: "bot",
          text: findReply(question),
        },
      ]);

      if (Date.now() + 50 >= queueEnd.current) {
        setTyping(false);
      }
    }, replyAt - now);

    pendingTimers.current.push(timer);
  }

  function clearChat() {
    pendingTimers.current.forEach(clearTimeout);
    pendingTimers.current = [];
    queueEnd.current = 0;
    nextId.current = 1;
    setMessages([{ id: 0, role: "bot", text: WELCOME }]);
    setInput("");
    setTyping(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendQuestion(input);
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-[#f7f9fd]">
      {/* NAVIGATION */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-[78px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Brand />

          <div className="hidden items-center gap-9 lg:flex">
            <a
              href="#home"
              className="text-sm font-semibold text-slate-700 transition hover:text-blue-600"
            >
              Home
            </a>
            <a
              href="#services"
              className="text-sm font-semibold text-slate-600 transition hover:text-blue-600"
            >
              Student Services
            </a>
            <a
              href="#about"
              className="text-sm font-semibold text-slate-600 transition hover:text-blue-600"
            >
              About
            </a>
          </div>

          <button
            onClick={() => setChatOpen(true)}
            className="hidden items-center gap-2 rounded-full bg-[#1728a0] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-0.5 hover:bg-blue-700 lg:flex"
          >
            Ask UOS Assistant
            <Icon name="arrow" size={16} />
          </button>

          <button
            type="button"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="rounded-xl border border-slate-200 p-2.5 text-slate-800 lg:hidden"
          >
            <Icon name={menuOpen ? "close" : "menu"} />
          </button>
        </nav>

        {menuOpen && (
          <div className="border-t border-slate-100 bg-white px-6 py-5 shadow-lg lg:hidden">
            <div className="flex flex-col gap-5">
              {[
                ["Home", "#home"],
                ["Student Services", "#services"],
                ["About", "#about"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-semibold text-slate-700"
                >
                  {label}
                </a>
              ))}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setChatOpen(true);
                }}
                className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white"
              >
                Ask UOS Assistant
              </button>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section
        id="home"
        className="hero-gradient relative isolate overflow-hidden text-white"
      >
        <div className="grid-pattern pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-blue-500/20 blur-[100px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-20 sm:px-8 lg:min-h-[650px] lg:grid-cols-[1.06fr_0.94fr] lg:gap-10 lg:px-10 lg:py-24">
          <div className="max-w-2xl">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-300/25 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-blue-100">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              SMARTER CAMPUS SUPPORT
            </div>

            <h1 className="text-5xl font-extrabold leading-[1.09] tracking-[-0.055em] sm:text-6xl lg:text-[68px]">
              Campus life,
              <br />
              <span className="bg-gradient-to-r from-blue-300 via-cyan-200 to-violet-300 bg-clip-text text-transparent">
                made simpler.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              Your digital companion for university life. Get quick
              answers about admissions, fees, class timings, library
              services, and hostel information.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setChatOpen(true)}
                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-7 py-4 text-sm font-bold text-[#14235d] shadow-xl shadow-black/10 transition hover:-translate-y-1 hover:bg-blue-50"
              >
                Start a Conversation
                <Icon name="arrow" size={18} />
              </button>

              <a
                href="#services"
                className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-7 py-4 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/15"
              >
                Explore Services
              </a>
            </div>

            <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-xs font-medium text-slate-300">
              {[
                "No sign-up required",
                "Instant rule-based answers",
                "Free student demo",
              ].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <span className="text-cyan-300">
                    <Icon name="check" size={15} />
                  </span>
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* HERO CHAT PREVIEW */}
          <div className="relative mx-auto w-full max-w-[510px]">
            <div className="absolute -inset-5 rounded-[36px] bg-gradient-to-br from-blue-500/20 to-violet-400/10 blur-3xl" />

            <div className="glass-card relative overflow-hidden rounded-[27px] p-3 shadow-2xl shadow-black/20 sm:p-4">
              <div className="overflow-hidden rounded-[21px] bg-white text-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white">
                      <Icon name="chat" size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold">
                        UOS Helpdesk Bot
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Rule-based assistant
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-700">
                    DEMO
                  </span>
                </div>

                <div className="space-y-5 bg-gradient-to-b from-white to-slate-50 px-5 py-7">
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                      <Icon name="spark" size={17} />
                    </div>
                    <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-[#eef2fb] px-4 py-3 text-xs leading-6 text-slate-700">
                      Hi there! I&apos;m your UOS student helpdesk
                      assistant. How can I help you today?
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <div className="max-w-[83%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-blue-700 to-indigo-700 px-4 py-3 text-xs leading-6 text-white shadow-lg shadow-blue-700/10">
                      How can I apply for admission?
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                      <Icon name="spark" size={17} />
                    </div>
                    <div className="max-w-[83%] rounded-2xl rounded-tl-sm bg-[#eef2fb] px-4 py-3 text-xs leading-6 text-slate-700">
                      You can find programme eligibility,
                      application guidance and current admission notices
                      on the official university website.
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 p-4">
                  <button
                    onClick={() =>
                      sendQuestion("How can I apply for admission?")
                    }
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs text-slate-500 transition hover:border-blue-300"
                  >
                    Try asking a question...
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-white">
                      <Icon name="arrow" size={15} />
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-3 hidden items-center gap-2 rounded-2xl border border-white/60 bg-white px-4 py-3 text-xs font-bold text-slate-800 shadow-2xl sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Icon name="check" size={17} />
              </span>
              Instant guidance
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section
        id="services"
        className="scroll-mt-24 px-5 py-24 sm:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">
              STUDENT SERVICES
            </span>
            <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.045em] text-slate-950 sm:text-5xl">
              Everything you need,
              <br />
              <span className="text-slate-500">one conversation away.</span>
            </h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
              Whether you&apos;re starting university or navigating
              campus life, find the right direction without unnecessary
              complexity.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service, index) => (
              <button
                key={service.title}
                onClick={() => sendQuestion(service.question)}
                className={`service-card group flex min-h-[260px] flex-col items-start rounded-[24px] border border-slate-200 bg-white p-7 text-left shadow-sm ${
                  index === 4 ? "lg:col-span-2" : ""
                }`}
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${service.tint}`}
                >
                  <Icon name={service.icon} size={25} />
                </span>

                <h3 className="mt-6 text-xl font-bold tracking-tight text-slate-950">
                  {service.title}
                </h3>

                <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
                  {service.description}
                </p>

                <span className="mt-auto flex items-center gap-2 pt-6 text-sm font-bold text-blue-700">
                  Ask a Question
                  <Icon
                    name="arrow"
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        className="scroll-mt-24 border-y border-slate-200 bg-white px-5 py-20 sm:px-8"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">
              BUILT FOR CLARITY
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              A simpler way to find student guidance.
            </h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              UOS CONNECT is an independent student-built demonstration
              of a rule-based helpdesk. It uses a curated local
              knowledge base to recognise common questions and return
              predefined responses.
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-500">
              It is not affiliated with or endorsed by the University
              of Sargodha. Always verify official policies,
              announcements and figures with the university.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["01", "No account needed", "Open the assistant and start asking."],
              ["02", "Focused answers", "A dedicated knowledge base for student topics."],
              ["03", "Privacy-conscious", "No questions sent to a chatbot API."],
              ["04", "Easy to explore", "Accessible on desktop and mobile."],
            ].map(([number, title, description]) => (
              <div
                key={number}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
              >
                <span className="text-xs font-bold text-blue-600">
                  {number}
                </span>
                <h3 className="mt-5 text-base font-bold text-slate-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 py-20 sm:px-8 lg:py-24">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[30px] bg-[#101e49] px-7 py-16 text-center text-white sm:px-12">
          <div className="pointer-events-none absolute -right-20 -top-36 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="relative">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-blue-100">
              HERE TO HELP
            </span>
            <h2 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Have a question? Just ask.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-slate-300">
              From application guidance to campus facilities, your
              student helpdesk is just one click away.
            </p>
            <button
              onClick={() => setChatOpen(true)}
              className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-white px-7 py-4 text-sm font-bold text-[#1728a0] transition hover:-translate-y-1 hover:bg-blue-50"
            >
              Chat with UOS Assistant
              <Icon name="arrow" size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white px-5 py-12 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Brand />
            <p className="mt-4 max-w-sm text-xs leading-6 text-slate-500">
              Independent student demonstration project. Not an official
              University of Sargodha website or support service.
            </p>
          </div>

          <div className="text-sm text-slate-500">
            <a
              href="https://su.edu.pk/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-700 underline-offset-4 hover:underline"
            >
              Official University of Sargodha Website
            </a>
           <p className="mt-3 text-xs">
  © 2026 UOS CONNECT. Student project.
</p>
          </div>
        </div>
      </footer>

      {/* FLOATING CHAT BUTTON */}
      {!chatOpen && (
        <div className="fixed bottom-5 right-4 z-50 flex items-center gap-3 sm:bottom-7 sm:right-7">
          <span className="hidden rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 shadow-xl sm:block">
            Need help? Chat with us
          </span>

          <button
            onClick={() => setChatOpen(true)}
            aria-label="Open UOS Helpdesk Bot"
            className="floating-button flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-800/30 transition hover:scale-105"
          >
            <Icon name="chat" size={29} />
          </button>
        </div>
      )}

      {/* CHAT POPUP */}
      {chatOpen && (
        <section
          role="dialog"
          aria-label="UOS Helpdesk Bot"
          className="chat-panel fixed inset-x-2 bottom-2 z-50 flex h-[min(650px,calc(100dvh-16px))] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[min(650px,calc(100dvh-48px))] sm:w-[410px]"
        >
          {/* CHAT HEADER */}
          <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#101e49] to-[#2338a4] px-4 py-4 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <Icon name="chat" size={22} />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-extrabold">
                  UOS Helpdesk Bot
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-blue-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Local rule-based assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                title="Clear Chat"
                aria-label="Clear Chat"
                className="rounded-lg p-2 text-white/80 transition hover:bg-white/15 hover:text-white"
              >
                <Icon name="trash" size={18} />
              </button>
              <button
                onClick={() => setChatOpen(false)}
                title="Close Chat"
                aria-label="Close Chat"
                className="rounded-lg p-2 text-white/80 transition hover:bg-white/15 hover:text-white"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
          </div>

          {/* CHAT MESSAGES */}
          <div
            ref={scrollRef}
            aria-label="Chat messages"
            aria-live="polite"
            className="chat-scroll min-h-0 flex-1 space-y-5 overflow-y-auto bg-[#f8faff] px-4 py-5"
          >
            <div className="mb-6 text-center">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-500">
                Independent student demo
              </span>
            </div>

            {messages.map((message) => (
              <div
                key={message.id}
                className={`message-enter flex ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {message.role === "bot" && (
                  <span className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                    <Icon name="spark" size={15} />
                  </span>
                )}

                <div
                  className={`max-w-[83%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-[13px] leading-[1.7] ${
                    message.role === "user"
                      ? "rounded-tr-sm bg-gradient-to-br from-blue-700 to-indigo-700 text-white"
                      : "rounded-tl-sm border border-slate-100 bg-white text-slate-700 shadow-sm"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                  <Icon name="spark" size={15} />
                </span>
                <div
                  aria-label="Assistant is responding"
                  className="flex gap-1.5 rounded-2xl rounded-tl-sm border border-slate-100 bg-white px-4 py-4"
                >
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}
          </div>

          {/* QUICK QUESTIONS */}
          <div className="shrink-0 border-t border-slate-100 bg-white px-4 pb-3 pt-3">
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
              QUICK QUESTIONS
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {QUICK_QUESTIONS.map((question) => (
                <button
                  key={question}
                  onClick={() => sendQuestion(question)}
                  className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* MESSAGE INPUT */}
          <form
            onSubmit={handleSubmit}
            className="flex shrink-0 items-center gap-2 border-t border-slate-100 bg-white px-3 py-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type your question..."
              aria-label="Type your question"
              autoComplete="off"
              maxLength={400}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send message"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white transition hover:bg-blue-800 disabled:opacity-40"
            >
              <Icon name="send" size={18} />
            </button>
          </form>

          <div className="flex shrink-0 items-center justify-center gap-1.5 border-t border-slate-100 bg-white px-3 py-2 text-[10px] text-slate-400">
            <Icon name="shield" size={12} />
            Predefined answers
          </div>
        </section>
      )}
    </main>
  );
}
