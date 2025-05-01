"use client";

import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export function useAuth() {
  const router = useRouter();

  const signIn = async ({ username, password, rememberMe = false }) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login gagal");
      }

      toast.success("Login berhasil");
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error(error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      toast.success("Berhasil logout");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Gagal logout");
    }
  };

  return { signIn, signOut };
}
