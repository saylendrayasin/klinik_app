/**
 * Data contoh yang realistis untuk `npm run check:visual` dan `npm run dev:demo`.
 * Semua dibuat lewat API (bukan insert langsung), jadi field turunan —
 * diagnosis, metodes, usia kehamilan, trimester, nomor KF — dihitung server.
 *
 * Record pertama tiap modul dipakai uji alur visual-check: jangan diubah urutannya.
 * KB sengaja ≤ 9 record (satu halaman daftar) karena uji hapus menghitung baris.
 */

const hari = (n) => new Date(Date.now() + n * 864e5).toISOString();
const tgl = (n) => hari(n).slice(0, 10);

const DIAGNOSIS = ["ISPA", "Demam", "Hipertensi", "Diare", "Gastritis", "Dermatitis", "Anemia", "Cephalgia", "Myalgia"];

const PASIEN = [
  { name: "Ny. Siti Aminah Wulandari", dateOfBirth: "1992-03-20", gender: "Female", address: "Jl. Mawar 10, Bitung",
    visits: [
      [-40, "Demam tinggi sejak 2 hari, nyeri tenggorokan", "Paracetamol 3x500 mg, Amoxicillin 3x500 mg", ["ISPA", "Demam"]],
      [-12, "Pusing berputar, tengkuk terasa berat", "Amlodipine 1x5 mg", ["Hipertensi", "Cephalgia"]],
      [-2, "Kontrol tekanan darah", "Lanjut Amlodipine 1x5 mg", ["Hipertensi"]],
    ] },
  { name: "Ny. Dewi Lestari", dateOfBirth: "1988-07-11", gender: "Female", address: "Kel. Girian Weru, Bitung",
    visits: [[-6, "Mencret 5x sejak pagi, lemas", "Oralit, Zinc 1x20 mg", ["Diare"]]] },
  { name: "Bpk. Ahmad Riyadi", dateOfBirth: "1979-01-30", gender: "Male", address: "Jl. Sam Ratulangi 21, Bitung",
    visits: [
      [-25, "Nyeri ulu hati setelah makan", "Omeprazole 2x20 mg, Antasida", ["Gastritis"]],
      [-4, "Nyeri otot punggung setelah mengangkat beban", "Ibuprofen 3x400 mg", ["Myalgia"]],
    ] },
  { name: "An. Rafael Tumbelaka", dateOfBirth: "2018-09-02", gender: "Male", address: "Kel. Manembo-nembo, Bitung",
    visits: [[-1, "Batuk pilek, demam ringan", "Paracetamol sirup 3x1 cth", ["ISPA"]]] },
  { name: "Ny. Maria Wenas", dateOfBirth: "1965-12-05", gender: "Female", address: "Jl. Yos Sudarso 7, Bitung",
    visits: [
      [-60, "Lemas, mudah lelah, pucat", "Tablet Fe 1x1", ["Anemia"]],
      [-30, "Kontrol, keluhan berkurang", "Lanjut tablet Fe", ["Anemia"]],
    ] },
  { name: "Sdr. Kevin Lumowa", dateOfBirth: "2001-04-18", gender: "Male", address: "Kel. Aertembaga, Bitung",
    visits: [[-8, "Gatal kemerahan di lengan", "Salep hidrokortison 2x sehari", ["Dermatitis"]]] },
  { name: "Ny. Fitri Handayani", dateOfBirth: "1995-06-23", gender: "Female", address: "Jl. Pelabuhan 3, Bitung", visits: [] },
  { name: "Bpk. Johny Sondakh", dateOfBirth: "1970-02-14", gender: "Male", address: "Kel. Madidir, Bitung",
    visits: [[-15, "Sakit kepala dan tekanan darah tinggi", "Captopril 2x25 mg", ["Hipertensi", "Cephalgia"]]] },
  { name: "Ny. Grace Pangemanan", dateOfBirth: "1990-10-09", gender: "Female", address: "Kel. Wangurer, Bitung",
    visits: [[-3, "Demam dan nyeri sendi", "Paracetamol 3x500 mg", ["Demam", "Myalgia"]]] },
  { name: "Nn. Putri Mokoginta", dateOfBirth: "2004-08-27", gender: "Female", address: "Kel. Bitung Barat", visits: [] },
  { name: "Bpk. Hendra Kalangi", dateOfBirth: "1983-03-03", gender: "Male", address: "Kel. Pakadoodan, Bitung",
    visits: [[-20, "Mual, nyeri lambung", "Ranitidine 2x150 mg", ["Gastritis"]]] },
  { name: "An. Nadia Rumengan", dateOfBirth: "2020-01-15", gender: "Female", address: "Kel. Sagerat, Bitung",
    visits: [[-9, "Diare 3x, rewel", "Oralit, Zinc sirup", ["Diare"]]] },
];

const HARI_METODE = { "Suntik 1 Bulan": 29, "Suntik 3 Bulan": 84, Implant: 1095, "IUD TCU 380A": 1825, Pil: 28 };
const KB = [
  // [nama, nik, lahir, anak, alamat, [[hariLalu, metode, catatan]]]
  ["Ny. Dewi Lestari", "7172011000000001", "1992-03-20", 2, "Kel. Girian Weru, Bitung",
    [[-170, "Suntik 3 Bulan", "Akseptor baru"], [-86, "Suntik 3 Bulan", ""], [-2, "Suntik 3 Bulan", "TD 110/70, BB 54 kg"]]],
  ["Ny. Ayu Pratiwi", "7172011000000002", "1985-01-05", 3, "Jl. Sam Ratulangi 4, Bitung",
    [[-400, "Implant", "Pemasangan lengan kiri"]]],
  ["Ny. Rina Wati Kusuma", "7172011000000003", "1994-04-04", 1, "Kel. Manembo-nembo, Bitung",
    [[-120, "Suntik 1 Bulan", ""], [-91, "Suntik 1 Bulan", ""], [-60, "Suntik 1 Bulan", "Datang terlambat 2 hari"]]],
  ["Ny. Lisa Rondonuwu", "7172011000000004", "1990-11-30", 2, "Kel. Madidir, Bitung",
    [[-700, "IUD TCU 380A", "Pasca persalinan"]]],
  ["Ny. Yuni Kaunang", "7172011000000005", "1998-02-17", 1, "Kel. Aertembaga, Bitung",
    [[-45, "Pil", ""], [-17, "Pil", "Keluhan mual berkurang"]]],
  ["Ny. Sarah Lengkong", "7172011000000006", "1987-06-08", 4, "Kel. Wangurer, Bitung",
    [[-200, "Suntik 3 Bulan", ""], [-110, "Suntik 3 Bulan", "Belum kembali sesuai jadwal"]]],
  ["Ny. Mega Tumewu", "7172011000000007", "2000-09-19", 0, "Kel. Bitung Barat", []],
];

// HPHT dihitung mundur dari hari ini; kunjungan [hariSetelahHPHT, data].
const KEHAMILAN = [
  { name: "Ny. Siti Aminah Wulandari", nik: "7172022000000001", dateOfBirth: "1994-04-04", hpht: -200, gravida: 2, para: 1,
    phone: "081234567801", bloodType: "O", address: "Jl. Mawar 10, Bitung",
    visits: [
      [60, { beratBadan: 52, tekananDarahSistol: 110, tekananDarahDiastol: 70, keluhan: "Mual muntah pagi hari", tindakan: "Konseling gizi, vitamin B6" }],
      [100, { beratBadan: 54, tekananDarahSistol: 110, tekananDarahDiastol: 80, tfu: 14, djj: 148, keluhan: "Tidak ada keluhan", tindakan: "Tablet Fe 1x1" }],
      [170, { beratBadan: 58, tekananDarahSistol: 120, tekananDarahDiastol: 80, tfu: 24, djj: 142, letakJanin: "kepala", tindakan: "Pemeriksaan Hb: 11,2 g/dL" }],
      [190, { beratBadan: 59, tekananDarahSistol: 120, tekananDarahDiastol: 80, tfu: 26, djj: 140, letakJanin: "kepala", jadwalBerikutnya: 14 }],
    ] },
  { name: "Ny. Fitri Handayani", nik: "7172022000000002", dateOfBirth: "1995-06-23", hpht: -70, gravida: 1, para: 0,
    phone: "081234567802", bloodType: "A", address: "Jl. Pelabuhan 3, Bitung",
    visits: [[56, { beratBadan: 49, tekananDarahSistol: 100, tekananDarahDiastol: 70, keluhan: "Mual, nafsu makan turun", tindakan: "Asam folat 1x400 mcg", jadwalBerikutnya: 20 }]] },
  { name: "Ny. Grace Pangemanan", nik: "7172022000000003", dateOfBirth: "1990-10-09", hpht: -250, gravida: 3, para: 2,
    phone: "081234567803", bloodType: "B", address: "Kel. Wangurer, Bitung",
    visits: [
      [70, { beratBadan: 60, tekananDarahSistol: 120, tekananDarahDiastol: 80 }],
      [180, { beratBadan: 66, tekananDarahSistol: 135, tekananDarahDiastol: 85, tfu: 25, djj: 144, letakJanin: "kepala", keluhan: "Kaki bengkak" }],
      [235, { beratBadan: 69, tekananDarahSistol: 150, tekananDarahDiastol: 95, tfu: 31, djj: 150, letakJanin: "kepala", keluhan: "Pusing, pandangan kabur", tindakan: "Cek protein urin, rencana rujuk bila menetap", jadwalBerikutnya: -5 }],
    ] },
  { name: "Ny. Yuni Kaunang", nik: "7172022000000004", dateOfBirth: "1998-02-17", hpht: -150, gravida: 1, para: 0,
    phone: "081234567804", bloodType: "AB", address: "Kel. Aertembaga, Bitung",
    visits: [
      [60, { beratBadan: 50, tekananDarahSistol: 110, tekananDarahDiastol: 70 }],
      [110, { beratBadan: 53, tekananDarahSistol: 110, tekananDarahDiastol: 70, tfu: 16, djj: 152, jadwalBerikutnya: 35 }],
    ] },
  { name: "Ny. Novita Mamahit", nik: "7172022000000005", dateOfBirth: "1993-05-12", hpht: -268, gravida: 2, para: 1,
    phone: "081234567805", bloodType: "O", address: "Kel. Madidir, Bitung",
    visits: [
      [62, { beratBadan: 55, tekananDarahSistol: 110, tekananDarahDiastol: 70 }],
      [100, { beratBadan: 57, tekananDarahSistol: 110, tekananDarahDiastol: 70, tfu: 15, djj: 146 }],
      [180, { beratBadan: 62, tekananDarahSistol: 120, tekananDarahDiastol: 80, tfu: 25, djj: 140, letakJanin: "kepala" }],
      [210, { beratBadan: 64, tekananDarahSistol: 120, tekananDarahDiastol: 80, tfu: 28, djj: 138, letakJanin: "kepala" }],
      [245, { beratBadan: 66, tekananDarahSistol: 120, tekananDarahDiastol: 80, tfu: 32, djj: 140, letakJanin: "kepala" }],
      [260, { beratBadan: 67, tekananDarahSistol: 120, tekananDarahDiastol: 80, tfu: 34, djj: 142, letakJanin: "kepala", tindakan: "Persiapan persalinan, P4K", jadwalBerikutnya: 7 }],
    ] },
  { name: "Ny. Lisa Rondonuwu", nik: "7172022000000006", dateOfBirth: "1990-11-30", hpht: -230, gravida: 3, para: 1, abortus: 1,
    phone: "081234567806", bloodType: "A", address: "Kel. Madidir, Bitung",
    visits: [
      [90, { beratBadan: 58, tekananDarahSistol: 110, tekananDarahDiastol: 70 }],
      [200, { beratBadan: 63, tekananDarahSistol: 120, tekananDarahDiastol: 80, tfu: 27, djj: 136, letakJanin: "sungsang", keluhan: "Gerak janin terasa di bawah", tindakan: "Anjuran posisi knee-chest", jadwalBerikutnya: -12 }],
    ] },
  { name: "Ny. Mega Tumewu", nik: "7172022000000007", dateOfBirth: "2000-09-19", hpht: -120, gravida: 1, para: 0,
    phone: "081234567807", bloodType: "", address: "Kel. Bitung Barat", status: "keguguran",
    visits: [[50, { beratBadan: 48, tekananDarahSistol: 100, tekananDarahDiastol: 60, keluhan: "Flek darah", tindakan: "Dirujuk ke RSUD" }]] },
  { name: "Ny. Sarah Lengkong", nik: "7172022000000008", dateOfBirth: "1987-06-08", hpht: -300, gravida: 4, para: 3, status: "selesai",
    phone: "081234567808", bloodType: "O", address: "Kel. Wangurer, Bitung",
    visits: [
      [60, { beratBadan: 61, tekananDarahSistol: 110, tekananDarahDiastol: 70 }],
      [150, { beratBadan: 65, tekananDarahSistol: 120, tekananDarahDiastol: 80, tfu: 20, djj: 144 }],
      [250, { beratBadan: 70, tekananDarahSistol: 120, tekananDarahDiastol: 80, tfu: 33, djj: 140, letakJanin: "kepala" }],
    ] },
];

const DATA_SALIN_NORMAL = {
  usiaKehamilanSaatPersalinan: 39, lamaPersalinanKala1: 480, lamaPersalinanKala2: 45,
  lamaPersalinanKala3: 10, lamaPersalinanKala4: 120, kondisiKetuban: "jernih",
  kondisiPerineumPersalinan: "laserasi_grade1", plasentaLengkap: "lengkap",
  tekananDarahSistol: 120, tekananDarahDiastol: 80, beratBadan: 64, pendarahan: 250, kondisiIbu: "baik",
};
const BAYI_SEHAT = {
  jenisKelamin: "perempuan", beratLahir: 3100, panjangBadan: 49, lingkarKepala: 33, lingkarDada: 32,
  nilaiApgar1: 8, nilaiApgar5: 9, nilaiApgar10: 10, kondisiBayi: "hidup",
  imd: true, injeksiVitaminK: true, salepMata: true, imunisasiHB0: true,
};
const NIFAS_BAIK = {
  tekananDarahSistol: 110, tekananDarahDiastol: 70, nadi: 82, suhu: 36.6, pernapasan: 20,
  tfu: "2 jari di bawah pusat", lokhia: "rubra", kondisiPerineum: "baik", asi: "lancar", kondisiBayi: "baik",
};

const PERSALINAN = [
  { ibu: { name: "Ny. Novita Mamahit", nik: "7172044000000001", dateOfBirth: "1993-05-12", gravida: 2, para: 1, phone: "081234567811", bloodType: "O", address: "Kel. Madidir, Bitung" },
    lahir: -10, data: DATA_SALIN_NORMAL, bayi: BAYI_SEHAT,
    nifas: [[1, { ...NIFAS_BAIK, pemberianVitaminA: true, konselingDiberikan: true }], [5, { ...NIFAS_BAIK, lokhia: "sanguinolenta", tfu: "Pertengahan pusat-simfisis", beratBayiSekarang: 3050 }]] },
  { ibu: { name: "Ny. Maya Supit", nik: "7172044000000002", dateOfBirth: "1996-08-01", gravida: 1, para: 0, phone: "081234567812", bloodType: "A", address: "Kel. Girian Weru, Bitung" },
    lahir: -3, data: { ...DATA_SALIN_NORMAL, usiaKehamilanSaatPersalinan: 38, kondisiPerineumPersalinan: "episiotomi", pendarahan: 300 },
    bayi: { ...BAYI_SEHAT, jenisKelamin: "laki-laki", beratLahir: 2350, panjangBadan: 46, nilaiApgar1: 7, nilaiApgar5: 8, komplikasiBayi: "BBLR", tindakanBayi: "Metode kanguru, pantau suhu" },
    nifas: [[1, { ...NIFAS_BAIK, asi: "kurang", keluhan: "ASI belum lancar", tindakan: "Konseling menyusui" }]] },
  { ibu: { name: "Ny. Sarah Lengkong", nik: "7172044000000003", dateOfBirth: "1987-06-08", gravida: 4, para: 3, phone: "081234567808", bloodType: "O", address: "Kel. Wangurer, Bitung" },
    lahir: -50, data: { ...DATA_SALIN_NORMAL, usiaKehamilanSaatPersalinan: 40, kondisiPerineumPersalinan: "utuh", pendarahan: 200 },
    bayi: { ...BAYI_SEHAT, jenisKelamin: "laki-laki", beratLahir: 3400, panjangBadan: 51 }, status: "selesai",
    nifas: [
      [1, NIFAS_BAIK],
      [6, { ...NIFAS_BAIK, lokhia: "sanguinolenta", pemberianFe: true }],
      [20, { ...NIFAS_BAIK, lokhia: "serosa", tfu: "Tidak teraba", beratBayiSekarang: 4100 }],
      [40, { ...NIFAS_BAIK, lokhia: "alba", tfu: "Tidak teraba", rencanKb: "suntik", konselingDiberikan: true }],
    ] },
  { ibu: { name: "Ny. Christin Watung", nik: "7172044000000004", dateOfBirth: "1991-03-25", gravida: 2, para: 1, phone: "081234567814", bloodType: "B", address: "Kel. Aertembaga, Bitung" },
    lahir: -12, data: DATA_SALIN_NORMAL, bayi: BAYI_SEHAT, nifas: [] }, // KF2 terlewat → peringatan
  { ibu: { name: "Ny. Grace Pangemanan", nik: "7172044000000005", dateOfBirth: "1990-10-09", gravida: 3, para: 2, phone: "081234567803", bloodType: "B", address: "Kel. Wangurer, Bitung" },
    lahir: null, data: { notes: "Taksiran persalinan bulan depan, riwayat TD tinggi" }, nifas: [] },
  { ibu: { name: "Ny. Ratna Lumi", nik: "7172044000000006", dateOfBirth: "1989-12-12", gravida: 3, para: 2, phone: "081234567816", bloodType: "AB", address: "Kel. Sagerat, Bitung" },
    lahir: -2, data: { ...DATA_SALIN_NORMAL, kondisiPerineumPersalinan: "laserasi_grade3", pendarahan: 650, kondisiIbu: "lemah", komplikasiIbu: "Perdarahan pascasalin", tindakanIbu: "Uterotonika, dirujuk ke RSUD" },
    bayi: BAYI_SEHAT, status: "rujuk", nifas: [] },
];

export async function isiDataContoh(api) {
  const kirim = (url, body, method = "POST") => api(url, { method, body: JSON.stringify(body) });
  const ids = {};

  for (const label of DIAGNOSIS) await kirim("/api/config", { type: "diagnosis", label });

  for (const { visits, ...p } of PASIEN) {
    const r = await kirim("/api/patients", p);
    ids.pasien ||= r.data._id;
    if (visits.length) {
      await kirim(`/api/patients/${r.data._id}`, {
        visits: visits.map(([n, complaint, medication, visitDiagnosis]) => ({ date: hari(n), complaint, medication, visitDiagnosis })),
      }, "PATCH");
    }
  }

  for (const [name, nik, dateOfBirth, numberOfChildren, address, visits] of KB) {
    const r = await kirim("/api/kb", { name, nik, dateOfBirth, numberOfChildren, address });
    ids.kb ||= r.data._id;
    if (visits.length) {
      await kirim(`/api/kb/${r.data._id}`, {
        name, nik, dateOfBirth: r.data.dateOfBirth, numberOfChildren, address,
        visits: visits.map(([n, metode, notes]) => ({ date: tgl(n), metode, notes, returnDate: tgl(n + HARI_METODE[metode]) })),
      }, "PATCH");
    }
  }

  for (const { visits, hpht, status, ...h } of KEHAMILAN) {
    const r = await kirim("/api/kehamilan", { ...h, hpht: hari(hpht) });
    ids.hamil ||= r.data._id;
    for (const [n, v] of visits) {
      const { jadwalBerikutnya, ...isi } = v;
      await kirim(`/api/kehamilan/${r.data._id}`, {
        action: "addVisit",
        visit: { ...isi, date: hari(hpht + n), ...(jadwalBerikutnya != null ? { jadwalBerikutnya: hari(jadwalBerikutnya) } : {}) },
      }, "PATCH");
    }
    if (status) await kirim(`/api/kehamilan/${r.data._id}`, { action: "updateStatus", status }, "PATCH");
  }

  for (const s of PERSALINAN) {
    const r = await kirim("/api/persalinan", { ...s.ibu, ...s.data, ...(s.lahir != null ? { tanggalPersalinan: hari(s.lahir) } : {}) });
    ids.salin ||= r.data._id;
    const url = `/api/persalinan/${r.data._id}`;
    if (s.bayi) await kirim(url, { action: "updateBayi", bayi: s.bayi }, "PATCH");
    for (const [n, v] of s.nifas) await kirim(url, { action: "addVisit", visit: { ...v, date: hari(s.lahir + n) } }, "PATCH");
    if (s.status) await kirim(url, { action: "updateStatus", status: s.status }, "PATCH");
  }

  const cfg = await api("/api/config?type=diagnosis");
  ids.config = cfg.data?.[0]?._id;
  return ids;
}

/**
 * Master Data surat + contoh surat. Gambar TTD & cap dibuat oleh pemanggil
 * (visual-check menggambarnya di kanvas browser) — TTD dan cap asli klinik
 * tidak pernah disimpan di repo.
 * gambar: { ttd, ttd2, cap } berupa data URL PNG.
 */
export async function isiSuratContoh(api, { ttd, ttd2, cap }) {
  const kirim = (url, body, method = "POST") => api(url, { method, body: JSON.stringify(body) });
  const ids = {};

  await kirim("/api/master/surat", { cap }, "PATCH");
  const petugas = async (nama, jabatan, extra = {}) =>
    (await kirim("/api/master/penandatangan", { nama, jabatan, ...extra })).data._id;
  const bidan = await petugas("Bdn. Samsia Rembang, S.ST", "Bidan", { nip: "197701042005012008", ttd });
  const dokter = await petugas("dr. Maria Tumbel", "Dokter", { ttd: ttd2 });
  const perawat = await petugas("Ns. Yohana Lumintang, S.Kep", "Perawat");

  const ALAMAT = "Jl. Kumersot Tendeki No. 45, Kel. Girian Weru, Bitung";
  const CONSENT = [
    { terbit: true, tindakan: "Pemasangan IUD (AKDR) Copper T", petugas: bidan,
      pembuat: { nama: "Ny. Siti Aminah Wulandari", umur: 34, jenisKelamin: "P", alamat: ALAMAT },
      saksiKlinik: { aktif: true, penandatanganId: perawat },
      saksiKeluarga: { aktif: true, nama: "Bpk. Ahmad Riyadi", mode: "gambar" } },
    { terbit: true, tindakan: "Pertolongan Persalinan Normal", petugas: bidan, hubungan: "suami",
      pembuat: { nama: "Bpk. Ahmad Riyadi", umur: 38, jenisKelamin: "L", alamat: ALAMAT },
      pasien: { nama: "Ny. Dewi Lestari", umur: 31, jenisKelamin: "P", alamat: ALAMAT },
      saksiKlinik: { aktif: true, nama: "Ns. Anita Kaunang", mode: "basah" },
      saksiKeluarga: { aktif: true, nama: "", mode: "basah" } },
    { terbit: true, tindakan: "Pemasangan Implan 2 Batang", petugas: dokter, keputusan: "menolak",
      pembuat: { nama: "Ny. Rina Wati Kusuma", umur: 27, jenisKelamin: "P", alamat: "Kel. Manembo-nembo, Bitung" },
      ttdPembuat: { mode: "basah" },
      saksiKlinik: { aktif: false }, saksiKeluarga: { aktif: false } },
    { terbit: false, tindakan: "Suntik KB 3 Bulan", petugas: bidan,
      pembuat: { nama: "Ny. Ayu Pratiwi", umur: 25, jenisKelamin: "P", alamat: "Kel. Bitung Barat" },
      saksiKlinik: { aktif: true, penandatanganId: perawat },
      saksiKeluarga: { aktif: false } },
  ];
  for (const { terbit, petugas: p, ...c } of CONSENT) {
    const d = (await kirim("/api/consent", { tanggalSurat: tgl(0), hubungan: "diri_sendiri", ...c, petugas: { penandatanganId: p } })).data;
    if (terbit) {
      await kirim(`/api/consent/${d._id}`, { action: "issue", ttd: { pembuat: ttd2, saksiKlinik: ttd, saksiKeluarga: ttd } }, "PATCH");
      ids.consent ||= d._id;
    } else ids.consentDraf ||= d._id;
  }

  const SAKIT = [
    { terbit: true, nama: "Bpk. Ahmad Riyadi", umur: 47, pekerjaan: "Nelayan", alamat: "Jl. Sam Ratulangi 21, Bitung", mulai: 0, lama: 3, pemeriksa: dokter },
    { terbit: true, nama: "Ny. Dewi Lestari", umur: 38, pekerjaan: "Guru SD", alamat: "Kel. Girian Weru, Bitung", mulai: -1, lama: 2, pemeriksa: bidan, ttdBasah: true },
    { terbit: false, nama: "An. Rafael Tumbelaka", umur: 8, pekerjaan: "Pelajar", alamat: "Kel. Manembo-nembo, Bitung", mulai: 0, lama: 2, pemeriksa: bidan },
  ];
  for (const { terbit, mulai, lama, pemeriksa, ...s } of SAKIT) {
    const d = (await kirim("/api/surat-sakit", {
      ...s, tanggalSurat: tgl(0), mulai: tgl(mulai), selesai: tgl(mulai + lama - 1), pemeriksa: { penandatanganId: pemeriksa },
    })).data;
    if (terbit) {
      await kirim(`/api/surat-sakit/${d._id}`, { action: "issue" }, "PATCH");
      ids.sakit ||= d._id;
    } else ids.sakitDraf ||= d._id;
  }
  return ids;
}
