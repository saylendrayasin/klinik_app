"use client";

import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { FaSpinner, FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn({ ...form, rememberMe });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0b1120]">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 -left-24 w-96 h-96 bg-blue-600/25 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-48 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-700/10 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo floating above card */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl shadow-blue-900/50 flex items-center justify-center mb-3">
            <img src="/icons/icon-192x192.png" alt="Logo" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">Klinik Iya</h1>
          <p className="text-slate-400 text-sm mt-1">Sistem Manajemen Klinik</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/[0.06] backdrop-blur-xl rounded-2xl shadow-2xl border border-white/[0.1] overflow-hidden"
        >
          {/* Top accent */}
          <div className="h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />

          <div className="p-7 space-y-5">
            <div className="text-center mb-1">
              <h2 className="text-white font-bold text-lg">Masuk ke Akun</h2>
              <p className="text-slate-400 text-sm mt-0.5">Silakan login sebagai administrator</p>
            </div>

            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-sm font-semibold text-slate-300">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <FaUser size={13} />
                </span>
                <input
                  id="username"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Masukkan username"
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.08] border border-white/[0.12] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-slate-300">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <FaLock size={13} />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-11 py-3 bg-white/[0.08] border border-white/[0.12] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-slate-400 text-sm select-none cursor-pointer">
                Ingat Saya
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white font-semibold py-3 rounded-xl transition-all duration-150 disabled:opacity-60 shadow-lg shadow-blue-900/40"
            >
              {loading ? (
                <><FaSpinner className="animate-spin" size={14} /> Memproses...</>
              ) : "Masuk"}
            </button>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
        </form>

        <p className="text-center text-slate-600 text-xs mt-5">
          © {new Date().getFullYear()} Klinik Iya · Sistem Manajemen
        </p>
      </div>
    </div>
  );
}
