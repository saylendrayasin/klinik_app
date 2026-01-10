"use client";

import { toast } from "react-hot-toast";

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
      toast.error(error?.message || "Gagal menyimpan perubahan!", {
        id: toastId,
      });
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return "-";

    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return "-";

    const today = new Date();

    if (birth > today) return 0;

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return Math.max(0, age);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <form
        onSubmit={handleUpdateKb}
        className="space-y-6 bg-white rounded-md shadow-md p-4"
      >
        <h1 className="text-2xl font-bold mb-6">Edit Data KB</h1>

        <div className="flex flex-col">
          <label htmlFor="name" className="text-gray-700 font-semibold mb-2">
            Nama
          </label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={handleInputChange}
            required
            className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="nik" className="text-gray-700 font-semibold mb-2">
            NIK
          </label>
          <input
            id="nik"
            name="nik"
            value={form.nik}
            onChange={handleInputChange}
            required
            className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="dateOfBirth"
            className="text-gray-700 font-semibold mb-2"
          >
            Tanggal Lahir
          </label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            value={form.dateOfBirth}
            onChange={handleInputChange}
            required
            className="p-2 border w-full rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <span className="text-sm text-gray-600 mt-1">
            Usia: <strong>{calculateAge(form.dateOfBirth)}</strong> tahun
          </span>
        </div>

        <div className="flex flex-col">
          <label htmlFor="address" className="text-gray-700 font-semibold mb-2">
            Alamat
          </label>
          <input
            id="address"
            name="address"
            value={form.address}
            onChange={handleInputChange}
            className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="numberOfChildren"
            className="text-gray-700 font-semibold mb-2"
          >
            Jumlah Anak
          </label>
          <input
            id="numberOfChildren"
            name="numberOfChildren"
            type="number"
            min="0"
            value={form.numberOfChildren}
            onChange={handleInputChange}
            className="p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-gray-700 font-semibold mb-2">Metode KB</label>
          <div className="p-2 border rounded-md bg-gray-100 text-gray-600">
            {kb.metodes?.length > 0
              ? kb.metodes.join(", ")
              : "Belum ada metode"}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-md font-semibold"
        >
          Simpan Perubahan
        </button>
      </form>
    </div>
  );
}
