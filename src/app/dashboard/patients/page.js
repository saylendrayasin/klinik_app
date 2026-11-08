"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetcher } from "@/lib/fetcher";
import toast from "react-hot-toast";
import { FaEye, FaTrash, FaUsers, FaPlus } from "react-icons/fa";
import {
  Search,
  SlidersHorizontal,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import Paginasi from "@/components/Paginasi";

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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-md shadow-brand-200 shrink-0">
            <FaUsers size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">Daftar Pasien</h1>
            <p className="text-slate-500 text-xs mt-0.5">Kelola data pasien dan riwayat kunjungan</p>
          </div>
        </div>
        <Link
          href="/dashboard/patients/new"
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-all duration-150 shadow-md shadow-brand-200 hover:shadow-lg hover:-translate-y-px active:scale-95"
        >
          <FaPlus size={11} />
          Tambah Pasien
        </Link>
      </div>

      {/* Search and Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input aria-label="Cari nama pasien"
            type="text"
            placeholder="Cari nama pasien..."
            value={search}
            onChange={handleSearchChange}
            className="field pl-10"
          />
        </div>
        <div className="relative w-full sm:w-44">
          <SlidersHorizontal size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select aria-label="Urutkan daftar"
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="field pl-9"
          >
            <option value="name">Nama A–Z</option>
            <option value="gender">Jenis Kelamin</option>
          </select>
        </div>
      </div>

      {/* Table (Desktop / Tablet) */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-brand-50 to-brand-50/50 border-b border-brand-100">
              <th className="py-3.5 px-5 text-left text-[11px] font-bold text-brand-700 uppercase tracking-wider">Nama Pasien</th>
              <th className="py-3.5 px-5 text-left text-[11px] font-bold text-brand-700 uppercase tracking-wider">Umur</th>
              <th className="py-3.5 px-5 text-left text-[11px] font-bold text-brand-700 uppercase tracking-wider">Jenis Kelamin</th>
              <th className="py-3.5 px-5 text-center text-[11px] font-bold text-brand-700 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 anim-stagger">
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx}>
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
                  <td className="py-3.5 px-5 text-slate-600 whitespace-nowrap">{calculateAge(patient.dateOfBirth)} tahun</td>
                  <td className="py-3.5 px-5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      patient.gender === "Male"
                        ? "bg-brand-100 text-brand-700"
                        : "bg-pink-100 text-pink-700"
                    }`}>
                      {patient.gender === "Male" ? "Laki-laki" : "Perempuan"}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex justify-center gap-2">
                      <Link
                        href={`/dashboard/patients/${patient._id}`}
                        className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-1.5 min-h-11 lg:min-h-9 rounded-lg text-xs font-semibold transition active:scale-95"
                      >
                        <FaEye size={11} />
                        <span>Lihat</span>
                      </Link>
                      <button
                        onClick={() => setDeleteTarget({ id: patient._id, name: patient.name })}
                        className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-500 px-3.5 py-1.5 min-h-11 lg:min-h-9 rounded-lg text-xs font-semibold transition active:scale-95"
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
      <div className="block sm:hidden space-y-3 anim-stagger">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
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
              <div className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-800 flex-1 truncate min-w-0">{patient.name}</h2>
                  <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    patient.gender === "Male" ? "bg-brand-100 text-brand-700" : "bg-pink-100 text-pink-700"
                  }`}>
                    {patient.gender === "Male" ? "Laki-laki" : "Perempuan"}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{calculateAge(patient.dateOfBirth)} tahun</p>
                <div className="flex gap-2 pt-1">
                  <Link
                    href={`/dashboard/patients/${patient._id}`}
                    className="flex-1 min-h-11 bg-brand-50 hover:bg-brand-100 text-brand-700 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition active:scale-[0.98]"
                  >
                    <FaEye size={12} /> Lihat
                  </Link>
                  <button
                    onClick={() => setDeleteTarget({ id: patient._id, name: patient.name })}
                    aria-label={`Hapus ${patient.name}`} className="shrink-0 min-h-11 min-w-11 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 flex items-center justify-center rounded-xl transition active:scale-[0.98]"
                  >
                    <FaTrash size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {patients.length > 0 && (
        <Paginasi page={page} totalPages={totalPages} loading={loading} onChange={setPage} />
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

