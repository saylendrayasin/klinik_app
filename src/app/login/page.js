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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Decorative blob */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Top accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500" />

          <div className="p-7 space-y-5">
            {/* Logo + title */}
            <div className="flex flex-col items-center gap-3 mb-2">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 shadow-lg flex items-center justify-center">
                <img src="/icons/icon-192x192.png" alt="Logo" className="w-9 h-9 object-contain" />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold text-gray-800">Klinik Iya</h1>
                <p className="text-gray-400 text-sm">Silakan masuk ke akun admin</p>
              </div>
            </div>

            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-sm font-semibold text-gray-700">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
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
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
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
                  className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="rememberMe" className="text-gray-500 text-sm select-none cursor-pointer">
                Ingat Saya
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60 shadow-sm"
            >
              {loading ? (
                <><FaSpinner className="animate-spin" size={14} /> Memproses...</>
              ) : "Masuk"}
            </button>
          </div>
        </form>

        <p className="text-center text-slate-500 text-xs mt-4">
          © {new Date().getFullYear()} Klinik Iya
        </p>
      </div>
    </div>
  );
}
