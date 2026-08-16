import Link from "next/link";

const features = [
  {
    icon: "🎙️",
    title: "Voice AI Interview",
    description:
      "Practice realistic interviews using natural voice conversations with an AI interviewer.",
  },
  {
    icon: "🤖",
    title: "AI-Powered Questions",
    description:
      "Get interview questions tailored to your selected role, experience, and skills.",
  },
  {
    icon: "🗣️",
    title: "Speech Recognition",
    description:
      "Answer naturally using your voice while the AI converts your speech into text.",
  },
  {
    icon: "📊",
    title: "Performance Analysis",
    description:
      "Receive detailed feedback on your answers, confidence, communication, and performance.",
  },
];

const steps = [
  {
    number: "01",
    title: "Choose your role",
    description: "Select the job role and interview type you want to practice.",
  },
  {
    number: "02",
    title: "Start the interview",
    description: "Have a realistic voice conversation with your AI interviewer.",
  },
  {
    number: "03",
    title: "Get your analysis",
    description: "Review your score, strengths, weaknesses, and improvement tips.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#08090d] text-white">
      {/* Navbar */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-bold text-black">
            AI
          </div>

          <span className="text-xl font-semibold tracking-tight">
            Mock<span className="text-gray-400">Interview</span>
          </span>
        </div>

        <div className="hidden items-center gap-8 text-sm text-gray-400 md:flex">
          <a href="#features" className="transition hover:text-white">
            Features
          </a>
          <a href="#how-it-works" className="transition hover:text-white">
            How it works
          </a>
        </div>

        <Link
          href="/dashboard"
          className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium transition hover:bg-white/10"
        >
          Get Started
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute left-1/2 top-20 -z-0 h-80 w-80 -translate-x-1/2 rounded-full bg-purple-600/20 blur-[120px]" />

        <div className="mx-auto max-w-5xl px-6 pb-24 pt-20 text-center lg:pt-28">
          <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            AI-powered interview practice
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Your next interview
            <span className="block bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
              starts here.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-gray-400">
            Practice realistic job interviews with an AI interviewer.
            Speak naturally, get instant feedback, and become interview-ready.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="rounded-full bg-white px-7 py-3.5 font-semibold text-black transition hover:scale-105 hover:bg-gray-200"
            >
              Start Your Interview →
            </Link>

            <a
              href="#how-it-works"
              className="rounded-full border border-white/15 px-7 py-3.5 font-medium text-gray-300 transition hover:bg-white/5"
            >
              See How It Works
            </a>
          </div>

          <div className="mt-16 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
            <span>✓ AI-generated questions</span>
            <span>✓ Voice interaction</span>
            <span>✓ Instant feedback</span>
            <span>✓ Performance analysis</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-white/10 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              Features
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to ace the interview.
            </h2>

            <p className="mt-4 text-gray-400">
              A complete AI-powered environment designed to make interview
              preparation more realistic and effective.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.06]"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-xl">
                  {feature.icon}
                </div>

                <h3 className="text-lg font-semibold">{feature.title}</h3>

                <p className="mt-3 text-sm leading-6 text-gray-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-white/10 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              Simple process
            </p>

            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              From practice to confidence.
            </h2>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-8"
              >
                <span className="text-sm font-bold text-gray-600">
                  {step.number}
                </span>

                <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>

                <p className="mt-3 leading-7 text-gray-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Ready to face your next interview?
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-gray-400">
            Stop practicing with imaginary interviewers. Start practicing with
            AI.
          </p>

          <Link
            href="/dashboard"
            className="mt-8 inline-block rounded-full bg-white px-8 py-4 font-semibold text-black transition hover:scale-105 hover:bg-gray-200"
          >
            Start Practicing →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-gray-600 sm:flex-row lg:px-8">
          <p>© 2026 MockInterview. Built with AI.</p>

          <p>Practice smarter. Interview better.</p>
        </div>
      </footer>
    </main>
  );
}