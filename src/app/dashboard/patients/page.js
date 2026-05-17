"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import { FaEye, FaTrash, FaUsers } from "react-icons/fa";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from "lucide-react";

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
    <div className="sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shrink-0">
            <FaUsers size={17} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 leading-tight">Daftar Pasien</h1>
            <p className="text-gray-500 text-xs mt-0.5">Kelola data pasien dan riwayat kunjungan</p>
          </div>
        </div>
        <Link
          href="/dashboard/patients/new"
          className="w-full sm:w-auto inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-md text-center transition"
        >
          + Tambah Pasien
        </Link>
      </div>

      {/* Search and Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama pasien..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="appearance-none w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
          >
            <option value="name">Nama A–Z</option>
            <option value="gender">Jenis Kelamin</option>
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
          <thead className="bg-blue-50 border-b border-blue-100">
            <tr>
              <th className="py-3.5 px-6 text-left text-xs font-semibold text-blue-800 uppercase tracking-wide">
                Nama
              </th>
              <th className="py-3.5 px-6 text-left text-xs font-semibold text-blue-800 uppercase tracking-wide">
                Umur
              </th>
              <th className="py-3.5 px-6 text-left text-xs font-semibold text-blue-800 uppercase tracking-wide">
                Jenis Kelamin
              </th>
              <th className="py-3.5 px-6 text-center text-xs font-semibold text-blue-800 uppercase tracking-wide">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse border-t">
                  <td className="py-4 px-6 skeleton">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  </td>
                  <td className="py-4 px-6 skeleton">
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </td>
                  <td className="py-4 px-6 skeleton">
                    <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                  </td>
                  <td className="py-4 px-6 skeleton">
                    <div className="mx-auto h-8 bg-gray-300 rounded w-24"></div>
                  </td>
                </tr>
              ))
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-12 text-center">
                  <FaUsers size={28} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm font-medium text-gray-400">Tidak ada pasien ditemukan.</p>
                  <p className="text-xs text-gray-300 mt-0.5">Coba ubah pencarian atau tambah data baru.</p>
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
              className="bg-white border rounded-lg shadow p-4 space-y-3 animate-pulse"
            >
              <div className="h-5 bg-gray-300 rounded w-1/2 skeleton"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 skeleton"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 skeleton"></div>
              <div className="flex gap-2 mt-4">
                <div className="flex-1 h-8 bg-gray-300 rounded-md skeleton"></div>
                <div className="flex-1 h-8 bg-gray-300 rounded-md skeleton"></div>
              </div>
            </div>
          ))
        ) : patients.length === 0 ? (
          <div className="text-center py-12">
            <FaUsers size={32} className="mx-auto text-gray-200 mb-2" />
            <p className="text-sm font-medium text-gray-400">Tidak ada pasien ditemukan.</p>
            <p className="text-xs text-gray-300 mt-0.5">Coba ubah pencarian atau tambah data baru.</p>
          </div>
        ) : (
          patients.map((patient) => (
            <div
              key={patient._id}
              className="bg-white border-l-4 border-blue-500 rounded-lg shadow-sm p-4 space-y-2"
            >
              <h2 className="text-base font-bold text-gray-800">{patient.name}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-gray-500">
                <span>{calculateAge(patient.dateOfBirth)} tahun</span>
                <span>{patient.gender === "Male" ? "Laki-laki" : "Perempuan"}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Link
                  href={`/dashboard/patients/${patient._id}`}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <FaEye />
                  Lihat
                </Link>
                <button
                  onClick={() => handleDelete(patient._id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <FaTrash />
                  Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {patients.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 mt-10">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1 || loading}
            className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition shadow-sm"
          >
            <ChevronsLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1 || loading}
            className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition shadow-sm"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="px-3 py-1.5 rounded-md border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm min-w-[60px] text-center">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages || loading}
            className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition shadow-sm"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages || loading}
            className="p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition shadow-sm"
          >
            <ChevronsRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  );
}
