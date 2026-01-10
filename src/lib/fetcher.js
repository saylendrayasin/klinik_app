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
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    if (res.status === 401 || res.status === 403) {
      await signOutFetcher();
      throw new Error("Unauthorized");
    }

    let data = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { message: text };
    }

    if (!res.ok) {
      const msg = data?.message || `Request failed (${res.status})`;
      throw new Error(msg);
    }

    if (data?.status === false) {
      throw new Error(data?.message || "Request failed");
    }

    return data;
  } catch (error) {
    console.error("Fetcher error:", error);
    throw error;
  }
}
