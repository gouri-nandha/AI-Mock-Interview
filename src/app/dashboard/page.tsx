"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

type PastInterview = {
  id: string;
  role: string;
  experience: string;
  type: string;
  difficulty: string;
  createdAt: string;
  overallScore: number;
};

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<PastInterview[]>([]);
  const [stats, setStats] = useState({ total: 0, average: "--" });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);

      try {
        // Fetch interviews for this user
        const q = query(
          collection(db, "interviews"),
          where("userId", "==", currentUser.uid)
        );

        const querySnapshot = await getDocs(q);
        const fetched: PastInterview[] = [];

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetched.push({
            id: docSnap.id,
            role: data.role,
            experience: data.experience,
            type: data.type,
            difficulty: data.difficulty,
            createdAt: data.createdAt,
            overallScore: data.overallScore,
          });
        });

        // Sort client-side by date descending
        fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setInterviews(fetched);

        // Calculate stats
        if (fetched.length > 0) {
          const sum = fetched.reduce((acc, curr) => acc + curr.overallScore, 0);
          const avg = Math.round(sum / fetched.length);
          setStats({
            total: fetched.length,
            average: `${avg}%`,
          });
        } else {
          setStats({ total: 0, average: "--" });
        }
      } catch (error) {
        console.error("Error fetching interviews:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const getScoreBadgeClass = (score: number) => {
    if (score >= 75) return "text-green-400 border-green-500/20 bg-green-500/5";
    if (score >= 50) return "text-yellow-400 border-yellow-500/20 bg-yellow-500/5";
    return "text-red-400 border-red-500/20 bg-red-500/5";
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08090d] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <p className="mt-4 text-sm text-gray-400">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08090d] text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10 sticky top-0 z-10 backdrop-blur-md bg-[#08090d]/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-black">
              AI
            </div>
            <span className="text-xl font-semibold">
              Mock<span className="text-gray-500">Interview</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-gray-500">Interview Candidate</p>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Dashboard Body */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        {/* Welcome */}
        <div>
          <p className="text-sm font-medium text-gray-500">Your Dashboard</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Welcome back 👋</h1>
          <p className="mt-3 text-gray-500">Practice your technical and behavioral responses to prepare for real-world loops.</p>
        </div>

        {/* Main Stats Cards */}
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {/* New Interview Trigger */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-8 lg:col-span-1">
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-xl">🎙️</div>
              <h2 className="mt-6 text-2xl font-semibold">Start Mock</h2>
              <p className="mt-3 leading-7 text-gray-500 text-sm">
                Initiate a voice interview tailored to your skills and track detailed AI feedback on completion.
              </p>
              <Link
                href="/interview/setup"
                className="mt-8 w-full justify-center inline-flex rounded-xl bg-white px-6 py-3.5 font-semibold text-black hover:bg-gray-200 transition"
              >
                Configure Interview →
              </Link>
            </div>
          </div>

          {/* Stats Analytics */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-xl">📊</div>
              <h2 className="mt-6 text-2xl font-semibold">Performance Metrics</h2>
              <p className="mt-1 text-sm text-gray-500">Aggregated results across your completed sessions.</p>
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm text-gray-500">Interviews Completed</p>
                <p className="mt-2 text-3xl font-bold font-mono text-white">{stats.total}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm text-gray-500">Average AI Score</p>
                <p className="mt-2 text-3xl font-bold font-mono text-white">{stats.average}</p>
              </div>
            </div>
          </div>
        </div>

        {/* History / Recent interviews */}
        <section className="mt-12">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Recent Sessions</h2>
            <p className="mt-1 text-sm text-gray-500">Review your past evaluation feedback and question breakdowns.</p>
          </div>

          {interviews.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {interviews.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold font-mono ${getScoreBadgeClass(item.overallScore)}`}>
                        {item.overallScore}%
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-bold text-white leading-snug">{item.role}</h3>
                    
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-400">
                      <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                        {item.experience}
                      </span>
                      <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                        {item.type}
                      </span>
                      <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                        {item.difficulty}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/interview/results?id=${item.id}`}
                    className="mt-6 w-full text-center inline-block rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition"
                  >
                    View Analysis →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-white/10 py-16 text-center bg-white/[0.01]">
              <div className="text-4xl">🎯</div>
              <h3 className="mt-5 text-lg font-medium text-white">No interviews completed yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500 leading-relaxed">
                Configure and take your first AI mock interview, and we'll record your progress metrics here.
              </p>
              <Link
                href="/interview/setup"
                className="mt-6 inline-block text-sm font-semibold text-purple-400 hover:text-purple-300 transition hover:underline"
              >
                Take your first interview →
              </Link>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}