"use client";

import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { FaSpinner, FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

const inputCls =
  "w-full pl-11 pr-4 h-12 bg-white border border-slate-300 rounded-xl text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-500 transition";

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
    <div className="min-h-dvh grid lg:grid-cols-2 bg-brand-50">
      {/* Panel brand (desktop) */}
      <div className="hidden lg:flex relative overflow-hidden flex-col justify-between p-12 bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 text-white">
        <div aria-hidden="true" className="absolute -right-32 -top-32 w-[28rem] h-[28rem] rounded-full bg-white/[0.06]" />
        <div aria-hidden="true" className="absolute -left-20 bottom-[-10rem] w-[24rem] h-[24rem] rounded-full bg-white/[0.04]" />

        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg">
            <img src="/kop/logo-klinik.png" alt="" className="w-10 h-10 object-contain" />
          </div>
          <span className="text-lg font-bold">Klinik Iya</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight">
            Pelayanan ibu &amp; anak, tercatat rapi.
          </h2>
          <p className="mt-4 text-brand-100/80 text-base leading-relaxed">
            Kelola data pasien, KB, kehamilan, persalinan, dan persetujuan tindakan dalam satu tempat.
          </p>
        </div>

        <p className="relative text-brand-200/60 text-sm">
          © {new Date().getFullYear()} Klinik Iya · Sistem Manajemen
        </p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-6 lg:hidden">
            <div className="w-20 h-20 rounded-3xl bg-white shadow-lg shadow-brand-900/10 ring-1 ring-brand-100 flex items-center justify-center mb-3">
              <img src="/kop/logo-klinik.png" alt="Logo Klinik Iya" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="text-brand-900 text-2xl font-bold tracking-tight">Klinik Iya</h1>
            <p className="text-slate-500 text-sm mt-1">Sistem Manajemen Klinik</p>
          </div>

          {/* method="post": bila ditekan sebelum JS siap, sandi tidak ikut ke URL/riwayat/log */}
          <form
            method="post"
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl shadow-xl shadow-brand-900/[0.07] ring-1 ring-slate-200/70 p-6 sm:p-8 space-y-5"
          >
            <div>
              <h2 className="text-slate-900 font-bold text-xl">Masuk ke Akun</h2>
              <p className="text-slate-500 text-sm mt-1">Silakan login sebagai administrator</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-sm font-semibold text-slate-700">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400" aria-hidden="true">
                  <FaUser size={14} />
                </span>
                <input
                  id="username"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Masukkan username"
                  autoComplete="username"
                  required
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400" aria-hidden="true">
                  <FaLock size={14} />
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
                  className={`${inputCls} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 w-12 flex items-center justify-center rounded-r-xl text-slate-400 hover:text-brand-700 transition"
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>

            <label htmlFor="rememberMe" className="inline-flex items-center gap-3 min-h-11 select-none text-sm text-slate-600">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-5 h-5 accent-brand-600 rounded"
              />
              Ingat Saya
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 flex justify-center items-center gap-2 bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-semibold rounded-xl transition disabled:opacity-60 shadow-lg shadow-brand-600/25"
            >
              {loading ? (
                <><FaSpinner className="animate-spin" size={14} /> Memproses...</>
              ) : "Masuk"}
            </button>
          </form>

          <p className="text-center text-slate-400 text-xs mt-6 lg:hidden">
            © {new Date().getFullYear()} Klinik Iya · Sistem Manajemen
          </p>
        </div>
      </div>
    </div>
  );
}
