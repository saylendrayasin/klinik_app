import mongoose from "mongoose";

/**
 * Penghitung nomor surat. `_id` adalah kunci periode, mis:
 *   "consent-2026"      → reset tahunan
 *   "consent-2026-02"   → reset bulanan
 *   "consent"           → tidak pernah reset
 *
 * Selalu di-increment lewat findOneAndUpdate + $inc supaya aman
 * kalau ada dua permintaan bersamaan.
 */
const counterSchema = new mongoose.Schema({
  _id: { type: String },
  seq: { type: Number, default: 0 },
});

export const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

export async function nextSeq(key) {
  const doc = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return doc.seq;
}

export async function peekSeq(key) {
  const doc = await Counter.findById(key).lean();
  return doc?.seq || 0;
}

export async function setSeq(key, seq) {
  await Counter.findOneAndUpdate(
    { _id: key },
    { $set: { seq } },
    { upsert: true }
  );
}
