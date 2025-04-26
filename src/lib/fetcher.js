"use client";

import { toast } from "react-hot-toast";

async function signOutFetcher() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    toast.error("Sesi habis, silakan login ulang");
    window.location.href = "/login";
  } catch (error) {
    console.error("Logout error:", error);
    window.location.href = "/login";
  }
}

export async function fetcher(url, options = {}) {
  try {
    const res = await fetch(url, {
      credentials: "include",
      cache: "no-store",
      ...options,
    });

    if (res.status === 401 || res.status === 403) {
      await signOutFetcher();
      return;
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Fetcher error:", error);
    toast.error("Gagal memuat data");
    throw error;
  }
}
