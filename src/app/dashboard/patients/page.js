"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { FaEye, FaTrash } from "react-icons/fa";

export default function DashboardPatientsPage() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const limit = 5;

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await fetcher(
        `/api/patients?page=${page}&limit=${limit}&search=${search}&sort=${sort}`
      );
      setPatients(data.data);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search, sort, page]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSort(e.target.value);
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus pasien ini?")) return;

    try {
      await fetcher(`/api/patients/${id}`, {
        method: "DELETE",
      });
      fetchPatients();
    } catch (error) {
      console.error(error);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return "-";
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  return (
    <div className="sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">
          Daftar Pasien
        </h1>
        <Link
          href="/dashboard/patients/new"
          className="w-full sm:w-auto inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-md text-center transition"
        >
          + Tambah Pasien
        </Link>
      </div>

      {/* Search and Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <input
          type="text"
          placeholder="Cari nama pasien..."
          value={search}
          onChange={handleSearchChange}
          className="flex-1 p-2 border border-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div className="relative w-full sm:w-48">
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="appearance-none w-full p-2 border border-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
          >
            <option value="name">Urutkan Nama</option>
            <option value="gender">Urutkan Jenis Kelamin</option>
          </select>
          {/* Custom arrow */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-4 w-4 text-gray-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
              stroke="currentColor"
            >
              <path
                d="M7 7l3-3 3 3m0 6l-3 3-3-3"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Table (Desktop) */}
      <div className="hidden sm:block overflow-x-auto bg-white rounded-md shadow-md">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-4 px-6 text-left font-semibold text-gray-700">
                Nama
              </th>
              <th className="py-4 px-6 text-left font-semibold text-gray-700">
                Umur
              </th>
              <th className="py-4 px-6 text-left font-semibold text-gray-700">
                Jenis Kelamin
              </th>
              <th className="py-4 px-6 text-center font-semibold text-gray-700">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse border-t">
                  <td className="py-4 px-6">
                    <div className="h-4 bg-gray-300 rounded w-3/4 skeleton"></div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-4 bg-gray-300 rounded w-1/2 skeleton"></div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-4 bg-gray-300 rounded w-1/3 skeleton"></div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="mx-auto h-8 bg-gray-300 rounded w-24 skeleton"></div>
                  </td>
                </tr>
              ))
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-10 text-gray-500">
                  Tidak ada pasien ditemukan.
                </td>
              </tr>
            ) : (
              patients.map((patient) => (
                <tr
                  key={patient._id}
                  className="border-t hover:bg-gray-50 transition-all"
                >
                  <td className="py-4 px-6">{patient.name}</td>
                  <td className="py-4 px-6">
                    {calculateAge(patient.dateOfBirth)} Tahun
                  </td>
                  <td className="py-4 px-6">
                    {patient.gender === "Male" ? "Laki-laki" : "Perempuan"}
                  </td>
                  <td className="py-4 px-6 flex justify-center gap-3">
                    <Link
                      href={`/dashboard/patients/${patient._id}`}
                      className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2 px-4 py-2 rounded-md text-sm"
                    >
                      <FaEye />
                      <span className="hidden md:inline">Lihat</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(patient._id)}
                      className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2 px-4 py-2 rounded-md text-sm"
                    >
                      <FaTrash />
                      <span className="hidden md:inline">Hapus</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Card (Mobile) */}
      <div className="block sm:hidden space-y-6 mt-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white border rounded-lg shadow p-4 space-y-3 animate-pulse skeleton-mobile"
            >
              <div className="h-5 bg-gray-300 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="flex gap-2 mt-4">
                <div className="flex-1 h-8 bg-gray-300 rounded-md"></div>
                <div className="flex-1 h-8 bg-gray-300 rounded-md"></div>
              </div>
            </div>
          ))
        ) : patients.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            Tidak ada pasien ditemukan.
          </div>
        ) : (
          patients.map((patient) => (
            <div
              key={patient._id}
              className="bg-white border rounded-lg shadow p-4 space-y-3"
            >
              <h2 className="text-lg font-semibold text-gray-800">
                {patient.name}
              </h2>
              <p className="text-gray-600">
                Umur: {calculateAge(patient.dateOfBirth)} Tahun
              </p>
              <p className="text-gray-600">
                Jenis Kelamin:{" "}
                {patient.gender === "Male" ? "Laki-laki" : "Perempuan"}
              </p>
              <div className="flex gap-2 mt-4">
                <Link
                  href={`/dashboard/patients/${patient._id}`}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm"
                >
                  <FaEye />
                  <span>Lihat</span>
                </Link>
                <button
                  onClick={() => handleDelete(patient._id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm"
                >
                  <FaTrash />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-4 mt-10">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1 || loading}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded disabled:opacity-50 transition"
        >
          {page === 1 ? "Awal" : "← Sebelumnya"}
        </button>

        <div className="text-sm sm:text-base text-gray-700 font-semibold">
          Halaman {page} dari {totalPages}
        </div>

        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages || loading}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded disabled:opacity-50 transition"
        >
          {page === totalPages ? "Akhir" : "Selanjutnya →"}
        </button>
      </div>
    </div>
  );
}
