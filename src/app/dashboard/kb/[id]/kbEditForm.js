"use client";

import { toast } from "react-hot-toast";

function calculateAge(dob) {
  if (!dob) return "-";
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return "-";
  const today = new Date();
  if (birth > today) return 0;
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return Math.max(0, age);
}

export default function KbEditForm({ kb, form, setForm, onRefresh }) {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === "numberOfChildren" ? Number(value) : value,
    });
  };

  const handleUpdateKb = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Menyimpan perubahan...");
    try {
      const res = await fetch(`/api/kb/${kb._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, visits: kb.visits }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.message || "Gagal menyimpan perubahan!");
      }

      toast.success("Perubahan berhasil disimpan!", { id: toastId });
      await onRefresh();
    } catch (error) {
      console.error(error);
      toast.error(error?.message || "Gagal menyimpan perubahan!", { id: toastId });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleUpdateKb} className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* Form header */}
        <div className="bg-purple-50 border-b border-purple-100 px-5 py-4">
          <h2 className="text-base font-bold text-purple-800">Edit Data KB</h2>
          <p className="text-xs text-purple-500 mt-0.5">Metode KB diisi otomatis dari data kunjungan</p>
        </div>

        <div className="p-5 space-y-4">
          {/* Nama + NIK */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="text-sm font-semibold text-gray-700">
                Nama <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleInputChange}
                required
                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="nik" className="text-sm font-semibold text-gray-700">
                NIK <span className="text-red-500">*</span>
              </label>
              <input
                id="nik"
                name="nik"
                value={form.nik}
                onChange={handleInputChange}
                required
                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          {/* Tanggal Lahir + Jumlah Anak */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="dateOfBirth" className="text-sm font-semibold text-gray-700">
                Tanggal Lahir
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={handleInputChange}
                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              {form.dateOfBirth && (
                <span className="text-xs text-gray-500 mt-0.5">
                  Usia: <strong className="text-gray-700">{calculateAge(form.dateOfBirth)}</strong> tahun
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="numberOfChildren" className="text-sm font-semibold text-gray-700">
                Jumlah Anak
              </label>
              <input
                id="numberOfChildren"
                name="numberOfChildren"
                type="number"
                min="0"
                value={form.numberOfChildren}
                onChange={handleInputChange}
                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          {/* Alamat */}
          <div className="flex flex-col gap-1">
            <label htmlFor="address" className="text-sm font-semibold text-gray-700">
              Alamat
            </label>
            <input
              id="address"
              name="address"
              value={form.address}
              onChange={handleInputChange}
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {/* Metode KB readonly */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Metode KB</label>
            <div className="flex flex-wrap gap-1.5 p-2.5 border border-gray-200 rounded-md bg-gray-50 min-h-[42px] items-center">
              {kb.metodes?.length > 0 ? (
                kb.metodes.map((m) => (
                  <span
                    key={m}
                    className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  >
                    {m}
                  </span>
                ))
              ) : (
                <span className="text-gray-400 text-sm">Belum ada metode</span>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-md font-semibold transition"
          >
            Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  );
}
