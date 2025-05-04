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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-blue-100 to-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-6 sm:p-8 rounded-lg shadow-lg space-y-6"
      >
        {/* 🏥 Logo Klinik */}
        <div className="flex justify-center">
          <img
            src="/icons/icon-192x192.png"
            alt="Logo Klinik"
            className="w-40 h-40 object-contain "
          />
        </div>

        {/* ✨ Welcome Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-blue-700">
          Selamat Datang
        </h1>
        <p className="text-center text-gray-500 text-sm">
          Silakan masuk ke akun admin Anda.
        </p>

        {/* Username */}
        <div className="flex flex-col gap-2">
          <label htmlFor="username" className="text-gray-700 font-semibold">
            Username
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              <FaUser />
            </span>
            <input
              id="username"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Masukkan username"
              className="w-full pl-10 pr-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
        </div>

        {/* Password with toggle */}
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-gray-700 font-semibold">
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
              <FaLock />
            </span>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              placeholder="Masukkan password"
              className="w-full pl-10 pr-10 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <span
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 cursor-pointer"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center gap-2">
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="rememberMe" className="text-gray-600 text-sm">
            Ingat Saya
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-md transition disabled:opacity-70"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              Loading...
            </>
          ) : (
            "Masuk"
          )}
        </button>
      </form>
    </div>
  );
}
