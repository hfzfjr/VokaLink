"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/use-auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [statusMessage, setStatusMessage] = useState("Menghubungkan akun Google ke VokaLink...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuth() {
      try {
        const apiUrl = process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:3001/api/v1";

        // 1. Ambil session Supabase (tunggu auth state jika perlu)
        let token: string | null = null;
        let email: string | null = null;

        const { data: initialSession } = await supabase.auth.getSession();
        if (initialSession.session?.access_token) {
          token = initialSession.session.access_token;
          email = initialSession.session.user.email ?? null;
        } else {
          // Tunggu listener sampai session tersedia
          await new Promise<void>((resolve, _reject) => {
            const timeout = setTimeout(() => {
              subscription.unsubscribe();
              resolve();
            }, 6000);

            const {
              data: { subscription },
            } = supabase.auth.onAuthStateChange((_event, session) => {
              if (session?.access_token) {
                clearTimeout(timeout);
                token = session.access_token;
                email = session.user.email ?? null;
                subscription.unsubscribe();
                resolve();
              }
            });
          });
        }

        if (!token) {
          throw new Error("Gagal menginisialisasi sesi Google. Silakan coba kembali.");
        }

        if (!isMounted) return;
        setStatusMessage("Memverifikasi pendaftaran sekolah dan hak akses...");

        // 2. Verifikasi ke backend API VokaLink
        const res = await fetch(`${apiUrl}/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (res.status === 403) {
          const errorData = await res.json().catch(() => ({}));
          // Akun Google belum terhubung ke sekolah manapun di VokaLink
          await supabase.auth.signOut();
          const targetEmail = errorData.email || email || "";
          router.replace(`/login?error=unlinked&email=${encodeURIComponent(targetEmail)}`);
          return;
        }

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.detail || "Gagal memverifikasi akun ke server VokaLink.");
        }

        const json = await res.json();
        const verifiedUser = json?.data;
        const role = verifiedUser?.role;

        // Simpan sesi ke AuthContext & cookies
        setSession(token, verifiedUser);

        if (!isMounted) return;
        setStatusMessage("Verifikasi berhasil! Mengalihkan ke ruang kerja...");

        // 3. Arahkan pengguna sesuai peran multi-tenant
        if (role === "SCHOOL_ADMIN") {
          router.replace("/school/dashboard");
        } else if (role === "TEACHER") {
          router.replace("/teacher/dashboard");
        } else if (role === "STUDENT") {
          router.replace("/student/home");
        } else {
          router.replace("/school/dashboard");
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat masuk.";
        setErrorMessage(msg);
      }
    }

    handleAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 selection:bg-sky-500 selection:text-white font-sans">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto text-sky-600">
          {errorMessage ? (
            <AlertCircle className="w-6 h-6 text-rose-500" />
          ) : (
            <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
          )}
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {errorMessage ? "Gagal Masuk" : "Menghubungkan ke VokaLink"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
            {errorMessage ? errorMessage : statusMessage}
          </p>
        </div>

        {errorMessage && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
            >
              Kembali ke Halaman Masuk
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
