import mongoose from "mongoose";

const bayiSchema = new mongoose.Schema(
  {
    jenisKelamin: {
      type: String,
      enum: ["laki-laki", "perempuan", "tidak_diketahui"],
      default: "tidak_diketahui",
    },
    beratLahir: { type: Number },
    panjangBadan: { type: Number },
    lingkarKepala: { type: Number },
    lingkarDada: { type: Number },
    nilaiApgar1: { type: Number, min: 0, max: 10 },
    nilaiApgar5: { type: Number, min: 0, max: 10 },
    nilaiApgar10: { type: Number, min: 0, max: 10 },
    kondisiBayi: {
      type: String,
      enum: ["hidup", "meninggal", "iufd"],
      default: "hidup",
    },
    komplikasiBayi: { type: String },
    tindakanBayi: { type: String },
    imd: { type: Boolean, default: false },
    resusitasi: { type: Boolean, default: false },
    injeksiVitaminK: { type: Boolean, default: false },
    salepMata: { type: Boolean, default: false },
    imunisasiHB0: { type: Boolean, default: false },
  },
  { _id: false }
);

const visitNifasSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    hariPascaSalin: { type: Number },
    nomorKF: { type: Number, enum: [1, 2, 3, 4] },
    tekananDarahSistol: { type: Number },
    tekananDarahDiastol: { type: Number },
    nadi: { type: Number },
    suhu: { type: Number },
    pernapasan: { type: Number },
    tfu: { type: String },
    lokhia: {
      type: String,
      enum: ["rubra", "sanguinolenta", "serosa", "alba"],
    },
    kondisiPerineum: {
      type: String,
      enum: ["baik", "edema", "infeksi", "tidak_ada_luka"],
    },
    kondisiLukaOperasi: {
      type: String,
      enum: ["baik", "kemerahan", "basah", "infeksi"],
    },
    asi: {
      type: String,
      enum: ["lancar", "kurang", "tidak_ada"],
    },
    kondisiBayi: {
      type: String,
      enum: ["baik", "ikterus", "infeksi", "rujuk"],
    },
    beratBayiSekarang: { type: Number },
    pemberianVitaminA: { type: Boolean, default: false },
    pemberianFe: { type: Boolean, default: false },
    konselingDiberikan: { type: Boolean, default: false },
    rencanKb: {
      type: String,
      enum: ["belum", "kondom", "pil", "suntik", "iud", "implant", "mow", "mop"],
      default: "belum",
    },
    keluhan: { type: String },
    tindakan: { type: String },
    notes: { type: String },
  },
  { _id: true }
);

const persalinanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    nik: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    address: { type: String },
    phone: { type: String },
    bloodType: { type: String, enum: ["A", "B", "AB", "O", ""] },
    gravida: { type: Number, default: 1, min: 1 },
    para: { type: Number, default: 0, min: 0 },
    abortus: { type: Number, default: 0, min: 0 },
    tanggalPersalinan: { type: Date, default: null },
    usiaKehamilanSaatPersalinan: { type: Number },
    lamaPersalinanKala1: { type: Number },
    lamaPersalinanKala2: { type: Number },
    lamaPersalinanKala3: { type: Number },
    lamaPersalinanKala4: { type: Number },
    kondisiKetuban: {
      type: String,
      enum: ["jernih", "keruh", "mekonium", "darah", ""],
    },
    kondisiPerineumPersalinan: {
      type: String,
      enum: [
        "utuh",
        "laserasi_grade1",
        "laserasi_grade2",
        "laserasi_grade3",
        "laserasi_grade4",
        "episiotomi",
        "",
      ],
    },
    plasentaLengkap: {
      type: String,
      enum: ["lengkap", "tidak_lengkap", ""],
    },
    tekananDarahSistol: { type: Number },
    tekananDarahDiastol: { type: Number },
    beratBadan: { type: Number },
    pendarahan: { type: Number },
    kondisiIbu: {
      type: String,
      enum: ["baik", "lemah", "buruk"],
      default: "baik",
    },
    komplikasiIbu: { type: String },
    tindakanIbu: { type: String },
    bayi: { type: bayiSchema, default: () => ({}) },
    status: {
      type: String,
      enum: ["terdaftar", "aktif", "selesai", "rujuk", "meninggal"],
      default: "terdaftar",
    },
    notes: { type: String },
    visits: [visitNifasSchema],
  },
  { timestamps: true }
);

// NIK tidak unique — satu ibu bisa punya lebih dari satu record persalinan
persalinanSchema.index({ nik: 1 });

// Field data ibu & proses persalinan yang boleh diisi klien (POST dan PATCH updateData).
// Bayi, visits, status, hariPascaSalin dan nomorKF diatur lewat aksi masing-masing.
export const FIELD_DATA_PERSALINAN = [
  "name", "nik", "dateOfBirth", "address", "phone", "bloodType",
  "gravida", "para", "abortus", "usiaKehamilanSaatPersalinan",
  "lamaPersalinanKala1", "lamaPersalinanKala2", "lamaPersalinanKala3", "lamaPersalinanKala4",
  "kondisiKetuban", "kondisiPerineumPersalinan", "plasentaLengkap",
  "tekananDarahSistol", "tekananDarahDiastol", "beratBadan", "pendarahan",
  "kondisiIbu", "komplikasiIbu", "tindakanIbu", "tanggalPersalinan", "notes",
];

export const Persalinan =
  mongoose.models.Persalinan || mongoose.model("Persalinan", persalinanSchema);
