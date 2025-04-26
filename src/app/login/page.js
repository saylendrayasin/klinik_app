"use client";

import { useAuth } from "@/lib/auth";
import { useState } from "react";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signIn(form);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="max-w-sm w-full bg-white p-6 rounded-lg shadow-md space-y-4"
      >
        <h1 className="text-2xl font-bold text-center text-gray-800">Login</h1>

        <div className="flex flex-col">
          <label
            htmlFor="username"
            className="text-gray-700 mb-1 font-semibold"
          >
            Username
          </label>
          <input
            id="username"
            name="username"
            value={form.username}
            onChange={handleChange}
            className="p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="password"
            className="text-gray-700 mb-1 font-semibold"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            className="p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-md transition"
        >
          Masuk
        </button>
      </form>
    </div>
  );
}
