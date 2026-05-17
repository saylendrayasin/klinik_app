import mongoose from "mongoose";

const visitSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    usiaKehamilan: { type: Number },
    trimester: { type: Number, enum: [1, 2, 3] },
    jadwalBerikutnya: { type: Date },
    beratBadan: { type: Number },
    tekananDarahSistol: { type: Number },
    tekananDarahDiastol: { type: Number },
    tfu: { type: Number },
    djj: { type: Number },
    letakJanin: {
      type: String,
      enum: ["kepala", "sungsang", "lintang", "belum_diketahui"],
      default: "belum_diketahui",
    },
    keluhan: { type: String },
    tindakan: { type: String },
    notes: { type: String },
  },
  { _id: true }
);

const kehamilanSchema = new mongoose.Schema(
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
    hpht: { type: Date, required: true },
    hpl: { type: Date },
    status: {
      type: String,
      enum: ["aktif", "selesai", "keguguran", "rujuk"],
      default: "aktif",
    },
    visits: [visitSchema],
  },
  { timestamps: true }
);

kehamilanSchema.index({ nik: 1, hpht: 1 }, { unique: true });

export const Kehamilan =
  mongoose.models.Kehamilan || mongoose.model("Kehamilan", kehamilanSchema);
