"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import toast from "react-hot-toast";
import { FaEye, FaTrash, FaUsers, FaPlus } from "react-icons/fa";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

export default function DashboardPatientsPage() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const limit = 10;

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await fetcher(
        `/api/patients?page=${page}&limit=${limit}&search=${search}&sort=${sort}`
      );
      setPatients(data.data);
      const tp = data.totalPages || 1;
      setTotalPages(tp);
      if (page > tp) setPage(Math.max(1, tp));
    } catch (error) {
      toast.error("Gagal memuat data pasien");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search, sort, page]); // eslint-disable-line

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetcher(`/api/patients/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      toast.success("Pasien berhasil dihapus");
      fetchPatients();
    } catch (error) {
      toast.error(error?.message || "Gagal menghapus pasien");
    } finally {
      setDeleting(false);
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
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return Math.max(0, age);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
            <FaUsers size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">Daftar Pasien</h1>
            <p className="text-slate-500 text-xs mt-0.5">Kelola data pasien dan riwayat kunjungan</p>
          </div>
        </div>
        <Link
          href="/dashboard/patients/new"
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-all duration-150 shadow-md shadow-blue-200 hover:shadow-lg hover:-translate-y-px active:scale-95"
        >
          <FaPlus size={11} />
          Tambah Pasien
        </Link>
      </div>

      {/* Search and Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama pasien..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 transition shadow-sm placeholder:text-slate-400"
          />
        </div>
        <div className="relative w-full sm:w-44">
          <SlidersHorizontal size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="appearance-none w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-300 transition shadow-sm text-slate-700"
          >
            <option value="name">Nama A–Z</option>
            <option value="gender">Jenis Kelamin</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" stroke="currentColor">
              <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Table (Desktop / Tablet) */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-blue-50 to-blue-50/50 border-b border-blue-100">
              <th className="py-3.5 px-5 text-left text-[11px] font-bold text-blue-700 uppercase tracking-wider">Nama Pasien</th>
              <th className="py-3.5 px-5 text-left text-[11px] font-bold text-blue-700 uppercase tracking-wider">Umur</th>
              <th className="py-3.5 px-5 text-left text-[11px] font-bold text-blue-700 uppercase tracking-wider">Jenis Kelamin</th>
              <th className="py-3.5 px-5 text-center text-[11px] font-bold text-blue-700 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-3.5 px-5"><div className="h-4 bg-slate-100 rounded-lg w-3/4 skeleton" /></td>
                  <td className="py-3.5 px-5"><div className="h-4 bg-slate-100 rounded-lg w-1/2 skeleton" /></td>
                  <td className="py-3.5 px-5"><div className="h-4 bg-slate-100 rounded-lg w-1/3 skeleton" /></td>
                  <td className="py-3.5 px-5"><div className="mx-auto h-8 bg-slate-100 rounded-lg w-28 skeleton" /></td>
                </tr>
              ))
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-14 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <FaUsers size={24} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-400">Tidak ada pasien ditemukan</p>
                  <p className="text-xs text-slate-300 mt-1">Coba ubah pencarian atau tambah data baru.</p>
                </td>
              </tr>
            ) : (
              patients.map((patient) => (
                <tr key={patient._id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-3.5 px-5 font-medium text-slate-800">{patient.name}</td>
                  <td className="py-3.5 px-5 text-slate-600">{calculateAge(patient.dateOfBirth)} tahun</td>
                  <td className="py-3.5 px-5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      patient.gender === "Male"
                        ? "bg-sky-100 text-sky-700"
                        : "bg-pink-100 text-pink-700"
                    }`}>
                      {patient.gender === "Male" ? "Laki-laki" : "Perempuan"}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex justify-center gap-2">
                      <Link
                        href={`/dashboard/patients/${patient._id}`}
                        className="inline-flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95"
                      >
                        <FaEye size={11} />
                        <span>Lihat</span>
                      </Link>
                      <button
                        onClick={() => setDeleteTarget({ id: patient._id, name: patient.name })}
                        className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border border-red-200 hover:border-red-500 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95"
                      >
                        <FaTrash size={10} />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Card (Mobile) */}
      <div className="block sm:hidden space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 animate-pulse shadow-sm">
              <div className="h-5 bg-slate-100 rounded-lg w-1/2 skeleton" />
              <div className="h-4 bg-slate-100 rounded-lg w-1/3 skeleton" />
              <div className="flex gap-2 mt-3">
                <div className="flex-1 h-9 bg-slate-100 rounded-xl skeleton" />
                <div className="flex-1 h-9 bg-slate-100 rounded-xl skeleton" />
              </div>
            </div>
          ))
        ) : patients.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-2xl border border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <FaUsers size={24} className="text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-400">Tidak ada pasien ditemukan</p>
          </div>
        ) : (
          patients.map((patient) => (
            <div key={patient._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
              <div className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-800 flex-1 truncate min-w-0">{patient.name}</h2>
                  <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    patient.gender === "Male" ? "bg-sky-100 text-sky-700" : "bg-pink-100 text-pink-700"
                  }`}>
                    {patient.gender === "Male" ? "Laki-laki" : "Perempuan"}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{calculateAge(patient.dateOfBirth)} tahun</p>
                <div className="flex gap-2 pt-1">
                  <Link
                    href={`/dashboard/patients/${patient._id}`}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition active:scale-95"
                  >
                    <FaEye size={12} /> Lihat
                  </Link>
                  <button
                    onClick={() => setDeleteTarget({ id: patient._id, name: patient.name })}
                    className="flex-1 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border border-red-200 hover:border-red-500 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition active:scale-95"
                  >
                    <FaTrash size={11} /> Hapus
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {patients.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 pt-2">
          <PagBtn onClick={() => setPage(1)} disabled={page === 1 || loading}><ChevronsLeft className="w-4 h-4" /></PagBtn>
          <PagBtn onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1 || loading}><ChevronLeft className="w-4 h-4" /></PagBtn>
          <span className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 shadow-sm min-w-[64px] text-center">
            {page} / {totalPages}
          </span>
          <PagBtn onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages || loading}><ChevronRight className="w-4 h-4" /></PagBtn>
          <PagBtn onClick={() => setPage(totalPages)} disabled={page === totalPages || loading}><ChevronsRight className="w-4 h-4" /></PagBtn>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="Hapus Pasien"
        message={`Apakah Anda yakin ingin menghapus data pasien "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
      />
    </div>
  );
}

function PagBtn({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-35 disabled:cursor-not-allowed transition shadow-sm"
    >
      {children}
    </button>
  );
}
