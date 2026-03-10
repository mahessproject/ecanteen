"use client";

import { useState, useTransition, useEffect } from "react";
import { Sparkles, UtensilsCrossed } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { loginAction, registerAction, forceLogoutAction } from "@/app/actions/auth";

export default function LandingPage() {
  const [isLogin, setIsLogin] = useState(true);

  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    forceLogoutAction();
  }, []);

  async function handleLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await loginAction(fd);
      if (res && !res.success) setLoginError(res.error ?? "Login gagal");
    });
  }

  async function handleRegisterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRegisterError(null);
    setRegisterSuccess(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await registerAction(fd);
      if (res.success) {
        setRegisterSuccess(res.message ?? "Pendaftaran berhasil! Silakan masuk.");
        (e.target as HTMLFormElement).reset();

        setTimeout(() => {
          setIsLogin(true);
          setRegisterSuccess(null);
        }, 3000);
      } else {
        setRegisterError(res.error ?? "Gagal mendaftar");
      }
    });
  }

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500/30 overflow-hidden">
      {/* Left Panel: Branding & Welcome */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a0a0a] flex-col justify-between p-12 border-r border-white/5">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Food Illustration Background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.img
              src="/food-bg.svg"
              alt=""
              className="w-[90%] h-[90%] object-contain"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px]" />
        </div>

        {/* Logo/Icon */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-black shadow-xl shadow-orange-500/20">
              <UtensilsCrossed size={24} />
            </div>
            <span className="text-xl font-serif tracking-tight font-bold">eCanteen</span>
          </div>
        </div>

        {/* Main Welcome Text */}
        <div className="relative z-10 max-w-lg mb-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-6xl font-serif font-light leading-[1.1] tracking-tighter mb-6">
              MAU MAKAN <br />
              <span className="font-bold text-orange-500">APA HARI INI?</span>
            </h1>
            <p className="text-lg text-white/50 font-light leading-relaxed max-w-md">
              Jelajahi menu kantin, pesan dari mana saja, dan ambil saat istirahat. Simpel.
            </p>
          </motion.div>
        </div>

        {/* Footer info */}
        <div className="relative z-10">
          <p className="text-[11px] text-white/30 font-medium">
            &copy; {new Date().getFullYear()} eCanteen System Hak Cipta Dilindungi.
          </p>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        {/* Mobile background glows */}
        <div className="absolute top-0 right-0 w-[50vh] h-[50vh] bg-orange-500/5 rounded-full blur-[120px] lg:hidden -z-10" />
        <div className="absolute bottom-0 left-0 w-[50vh] h-[50vh] bg-white/5 rounded-full blur-[120px] lg:hidden -z-10" />

        <div className="w-full max-w-[420px]">
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="flex flex-col mb-12 lg:hidden">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-black mb-6 shadow-xl shadow-orange-500/20">
              <UtensilsCrossed size={24} />
            </div>
            <h1 className="text-4xl font-serif font-light tracking-tighter mb-2">
              MAU MAKAN <span className="font-bold text-orange-500">APA?</span>
            </h1>
            <p className="text-sm text-white/50 font-light">Pesan dari mana saja, ambil saat istirahat. Simpel.</p>
          </div>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-10 lg:mb-12">
                  <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                  <p className="text-sm text-white/40">Enter your credentials to access the vault.</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <div>
                    <input
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="Email Address"
                      className="w-full bg-[#0a0a0a] border border-white/10 hover:border-white/20 rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-orange-500 text-white placeholder:text-white/30 transition-all"
                    />
                  </div>

                  <div>
                    <input
                      name="password"
                      type="password"
                      required
                      autoComplete="current-password"
                      placeholder="Password"
                      className="w-full bg-[#0a0a0a] border border-white/10 hover:border-white/20 rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-orange-500 text-white placeholder:text-white/30 transition-all"
                    />
                  </div>

                  {loginError && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm px-4 py-3 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20"
                    >
                      {loginError}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-white/10 disabled:text-white/30 text-black font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-500/20 text-sm active:scale-[0.98] mt-2"
                  >
                    {isPending ? "Authenticating..." : "Sign In"}
                  </button>
                </form>

                <p className="text-center text-sm font-medium text-white/40 mt-8">
                  Belum punya akun?{" "}
                  <button
                    onClick={() => {
                      setIsLogin(false);
                      setLoginError(null);
                    }}
                    className="text-orange-500 hover:text-orange-400 transition-colors"
                  >
                    Daftar Sekarang
                  </button>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-10 lg:mb-12">
                  <h2 className="text-2xl font-bold text-white mb-2">Join the Vault</h2>
                  <p className="text-sm text-white/40">Buat akun untuk mulai memesan.</p>
                </div>

                {registerSuccess ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-8 text-center">
                    <p className="text-emerald-400 font-medium mb-6">{registerSuccess}</p>
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : (
                  <form onSubmit={handleRegisterSubmit} className="space-y-5">
                    <div>
                      <input
                        name="nama"
                        type="text"
                        required
                        placeholder="Nama Lengkap"
                        className="w-full bg-[#0a0a0a] border border-white/10 hover:border-white/20 rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-orange-500 text-white placeholder:text-white/30 transition-all"
                      />
                    </div>

                    <div>
                      <input
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="Email Address"
                        className="w-full bg-[#0a0a0a] border border-white/10 hover:border-white/20 rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-orange-500 text-white placeholder:text-white/30 transition-all"
                      />
                    </div>

                    <div>
                      <input
                        name="password"
                        type="password"
                        required
                        autoComplete="new-password"
                        placeholder="Password (Min. 6 karakter)"
                        className="w-full bg-[#0a0a0a] border border-white/10 hover:border-white/20 rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-orange-500 text-white placeholder:text-white/30 transition-all"
                      />
                    </div>

                    {registerError && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm px-4 py-3 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20"
                      >
                        {registerError}
                      </motion.p>
                    )}

                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-white/10 disabled:text-white/30 text-black font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-500/20 text-sm active:scale-[0.98] mt-2"
                    >
                      {isPending ? "Processing..." : "Sign Up"}
                    </button>
                  </form>
                )}

                {!registerSuccess && (
                  <p className="text-center text-sm font-medium text-white/40 mt-8">
                    Sudah punya akun?{" "}
                    <button
                      onClick={() => {
                        setIsLogin(true);
                        setRegisterError(null);
                      }}
                      className="text-orange-500 hover:text-orange-400 transition-colors"
                    >
                      Masuk Di Sini
                    </button>
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
