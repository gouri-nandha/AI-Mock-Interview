"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

type Question = {
  id: number;
  question: string;
  category: string;
  difficulty: string;
};

type Answer = {
  question: string;
  answer: string;
};

type QuestionEvaluation = {
  questionId: number;
  question: string;
  candidateAnswer: string;
  score: number;
  sampleCorrectAnswer: string;
  feedback: string;
};

type RatingCategory = {
  category: string;
  score: number;
  feedback: string;
};

type EvaluationReport = {
  id?: string;
  role: string;
  experience: string;
  type: string;
  difficulty: string;
  createdAt: string;
  questions: Question[];
  answers: Answer[];
  overallScore: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  ratings: RatingCategory[];
  questionEvaluations: QuestionEvaluation[];
  isDemo?: boolean;
};

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportId = searchParams.get("id");

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingStep, setLoadingStep] = useState("");
  
  // Expanded state for accordion questions
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);

  // 1. Handle Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      if (!currentUser) {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // 2. Fetch or Generate Report
  useEffect(() => {
    if (authLoading || !user) return;

    const loadReport = async () => {
      try {
        setLoading(true);

        // Scenario A: View past report by ID
        if (reportId) {
          setLoadingStep("Fetching report from archive...");
          const docRef = doc(db, "interviews", reportId);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            // Validate that this report belongs to the current user
            if (data.userId !== user.uid) {
              throw new Error("You do not have permission to view this report.");
            }
            setReport({ id: docSnap.id, ...data } as EvaluationReport);
          } else {
            throw new Error("Report not found.");
          }
        } 
        // Scenario B: Evaluate direct interview from sessionStorage
        else {
          setLoadingStep("Reading session answers...");
          const stored = sessionStorage.getItem("mockInterview");
          
          if (!stored) {
            router.push("/dashboard");
            return;
          }

          const interviewData = JSON.parse(stored);
          const { role, experience, type, difficulty, questions, answers } = interviewData;

          // Call Evaluation API
          setLoadingStep("Analyzing your answers with AI...");
          const res = await fetch("/api/evaluate-interview", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ role, experience, type, difficulty, questions, answers }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || "Failed to generate AI evaluation report.");
          }

          // Save report to Firestore
          setLoadingStep("Saving evaluation to database...");
          const finalReport = {
            userId: user.uid,
            userEmail: user.email,
            role,
            experience,
            type,
            difficulty,
            createdAt: new Date().toISOString(),
            questions,
            answers,
            overallScore: data.overallScore,
            feedback: data.feedback,
            strengths: data.strengths,
            weaknesses: data.weaknesses,
            ratings: data.ratings,
            questionEvaluations: data.questionEvaluations,
          };

          const docRef = await addDoc(collection(db, "interviews"), finalReport);
          
          setReport({ id: docRef.id, ...finalReport });
          
          // Clear session storage & replace URL state so refreshing doesn't re-run evaluation
          sessionStorage.removeItem("mockInterview");
          router.replace(`/interview/results?id=${docRef.id}`);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "An error occurred while loading results.");
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [authLoading, user, reportId, router]);

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-400 border-green-500/30 bg-green-500/5";
    if (score >= 50) return "text-yellow-400 border-yellow-500/30 bg-yellow-500/5";
    return "text-red-400 border-red-500/30 bg-red-500/5";
  };

  const getScoreStroke = (score: number) => {
    if (score >= 75) return "#4ade80"; // green-400
    if (score >= 50) return "#facc15"; // yellow-400
    return "#f87171"; // red-400
  };

  if (authLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08090d] text-white">
        <div className="text-center max-w-sm px-6">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-purple-500/20 border-t-purple-500" />
          <h2 className="mt-6 text-xl font-semibold">Generating Your Analytics...</h2>
          <p className="mt-2 text-sm text-gray-500 font-mono tracking-tight">{loadingStep || "Loading..."}</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08090d] px-6 text-white">
        <div className="max-w-md text-center">
          <div className="text-5xl">⚠️</div>
          <h1 className="mt-6 text-2xl font-bold">Failed to load results</h1>
          <p className="mt-3 text-gray-500">{error}</p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded-xl bg-white px-6 py-3 font-semibold text-black hover:bg-gray-200 transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (!report) return null;

  // Calculate percentage circle details
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (report.overallScore / 100) * circumference;

  return (
    <main className="min-h-screen bg-[#08090d] text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10 sticky top-0 z-10 backdrop-blur-md bg-[#08090d]/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-black">
              AI
            </div>
            <span className="text-xl font-semibold">
              Mock<span className="text-gray-500">Interview</span>
            </span>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        {report.isDemo && (
          <div className="mb-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-6 py-4 text-sm text-yellow-400 flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-white">Demo Mock Mode Active</p>
              <p className="text-xs text-yellow-500/80 mt-0.5">
                The OpenAI API key exceeded its billing quota. Questions and evaluation metrics were generated locally offline.
              </p>
            </div>
          </div>
        )}
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 border-b border-white/10 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs text-purple-300 mb-3">
              🎯 Performance Report
            </div>
            <h1 className="text-4xl font-bold tracking-tight">{report.role}</h1>
            <p className="mt-2 text-sm text-gray-500">
              Mock Interview · {report.experience} Level · {report.type} Interview · Completed on {new Date(report.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Overall Score Circle */}
          <div className="flex items-center gap-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="relative h-28 w-28 flex items-center justify-center">
              <svg className="absolute -rotate-90 transform h-full w-full">
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  className="stroke-white/10"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  stroke={getScoreStroke(report.overallScore)}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
                />
              </svg>
              <div className="text-center z-10">
                <span className="text-3xl font-bold tracking-tight">{report.overallScore}</span>
                <span className="block text-[10px] text-gray-500 font-semibold tracking-widest uppercase">Score</span>
              </div>
            </div>
            
            <div className="max-w-[180px]">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Overall Rating</p>
              <p className="mt-1 text-lg font-bold text-white">
                {report.overallScore >= 75 ? "Excellent Job! 🎉" : report.overallScore >= 50 ? "Satisfactory Performance 👍" : "Need Improvement 💪"}
              </p>
              <p className="mt-1 text-xs text-gray-400">Your performance ranks compared to benchmark industry expectations.</p>
            </div>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          
          {/* Left Column: General Feedback, Strengths, Weaknesses, Ratings */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Executive Summary */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <span>📝</span> Executive Summary Feedback
              </h2>
              <p className="mt-4 text-gray-300 text-sm leading-8 whitespace-pre-line">{report.feedback}</p>
            </section>

            {/* Strengths & Weaknesses side-by-side */}
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Strengths */}
              <section className="rounded-3xl border border-green-500/10 bg-green-500/[0.01] p-6">
                <h3 className="text-lg font-bold text-green-400 flex items-center gap-2">
                  <span>✅</span> Demonstrated Strengths
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-gray-300">
                  {report.strengths.map((str, index) => (
                    <li key={index} className="flex gap-2.5 items-start leading-6">
                      <span className="text-green-500 mt-0.5">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Weaknesses */}
              <section className="rounded-3xl border border-red-500/10 bg-red-500/[0.01] p-6">
                <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                  <span>❌</span> Areas for Improvement
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-gray-300">
                  {report.weaknesses.map((weak, index) => (
                    <li key={index} className="flex gap-2.5 items-start leading-6">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Detailed Question breakdown */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <span>💬</span> Question-by-Question Analysis
              </h2>

              <div className="space-y-4">
                {report.questionEvaluations.map((evalItem, index) => {
                  const isExpanded = expandedQuestion === index;
                  return (
                    <div
                      key={index}
                      className={`rounded-2xl border transition duration-200 overflow-hidden ${
                        isExpanded ? "border-purple-500/30 bg-purple-500/[0.02]" : "border-white/10 bg-white/[0.01] hover:bg-white/[0.03]"
                      }`}
                    >
                      {/* Accordion Trigger */}
                      <button
                        onClick={() => setExpandedQuestion(isExpanded ? null : index)}
                        className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-bold text-gray-500">QUESTION {index + 1}</span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${getScoreColor(evalItem.score * 10)}`}>
                              {evalItem.score} / 10
                            </span>
                          </div>
                          <h3 className="mt-2 text-base font-semibold text-white leading-snug">{evalItem.question}</h3>
                        </div>
                        <span className="text-gray-500 text-lg transition-transform" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                          ▼
                        </span>
                      </button>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="px-6 pb-6 border-t border-white/5 pt-5 space-y-5 text-sm">
                          {/* Candidate Answer */}
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Your Answer</h4>
                            <div className="mt-2 rounded-xl bg-black/35 border border-white/5 p-4 text-gray-300 leading-7 font-mono text-[13px] whitespace-pre-wrap">
                              {evalItem.candidateAnswer}
                            </div>
                          </div>

                          {/* AI Feedback */}
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-400">AI Evaluation Feedback</h4>
                            <p className="mt-2 text-gray-300 leading-7 whitespace-pre-line">{evalItem.feedback}</p>
                          </div>

                          {/* Model Answer */}
                          <div>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-green-400">Proposed Outstanding Model Answer</h4>
                            <div className="mt-2 rounded-xl bg-green-500/[0.02] border border-green-500/10 p-4 text-gray-300 leading-7">
                              {evalItem.sampleCorrectAnswer}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right Column: Competency Metrics Sidebar */}
          <div className="space-y-8">
            
            {/* Scorecard Categories */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <span>📊</span> Competency Scorecard
              </h2>
              <p className="mt-1 text-xs text-gray-500">AI rating broken down by core dimensions.</p>

              <div className="mt-6 space-y-6">
                {report.ratings.map((cat, index) => {
                  const percentage = cat.score * 10;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-white">{cat.category}</span>
                        <span className="font-mono font-bold text-gray-300">{cat.score} / 10</span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <p className="text-xs text-gray-400 leading-5 pt-1">{cat.feedback}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Quick stats / Tips */}
            <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 p-8 text-center relative overflow-hidden">
              <div className="absolute -left-12 -bottom-12 h-32 w-32 bg-purple-500/10 rounded-full blur-2xl" />
              <div className="text-3xl">🚀</div>
              <h3 className="mt-4 text-lg font-bold">Practice makes perfect</h3>
              <p className="mt-2 text-xs text-gray-400 leading-5">
                Practice again to work on the highlighted weaknesses. A consistent mock schedule is proven to boost interview confidence by 67%.
              </p>
              
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/interview/setup"
                  className="w-full inline-block rounded-xl bg-white py-3 text-sm font-semibold text-black hover:bg-gray-200 transition"
                >
                  Start New Session
                </Link>
                
                <Link
                  href="/dashboard"
                  className="w-full inline-block rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition"
                >
                  View Performance History
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}