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
    // options di-spread lebih dulu, lalu headers di-set terakhir.
    // Kalau dibalik, options.headers akan menimpa hasil merge dan
    // Content-Type default ikut hilang.
    const res = await fetch(url, {
      credentials: "include",
      cache: "no-store",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (res.status === 401 || res.status === 403) {
      await signOutFetcher();
      throw new Error("Sesi habis, silakan login ulang");
    }

    let data = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { message: text };
    }

    if (!res.ok) {
      const msg = data?.message || `Permintaan gagal (${res.status})`;
      throw new Error(msg);
    }

    if (data?.status === "error") {
      throw new Error(data?.message || "Permintaan gagal");
    }

    return data;
  } catch (error) {
    // Permintaan yang sengaja dibatalkan (ketikan pencarian baru) bukan galat.
    if (error?.name !== "AbortError") console.error("Fetcher error:", error);
    throw error;
  }
}

/**
 * Untuk unduhan berkas (Excel): penanganan sesi sama dengan fetcher(),
 * tetapi mengembalikan Blob mentah, bukan JSON.
 */
export async function fetchBlob(url) {
  const res = await fetch(url, { credentials: "include", cache: "no-store" });
  if (res.status === 401 || res.status === 403) {
    await signOutFetcher();
    throw new Error("Sesi habis, silakan login ulang");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || "Gagal mengunduh berkas");
  }
  return res.blob();
}
