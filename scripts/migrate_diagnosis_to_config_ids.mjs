// scripts/migrate_diagnosis_to_config_ids.cjs
const mongoose = require("mongoose");

function normLabel(s) {
  return String(s || "").trim();
}
function normKey(s) {
  return normLabel(s).toLowerCase();
}
function slugify(s) {
  return normKey(s)
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI missing. Set env dulu.");

  const REMOVE_LEGACY_FIELDS = process.env.REMOVE_LEGACY_FIELDS === "1"; // JANGAN dipakai dulu
  const TYPE = "diagnosis";

  await mongoose.connect(uri);

  // --- Define schema MINIMAL di sini (tanpa import dari src) ---
  const ConfigSchema = new mongoose.Schema(
    {
      type: { type: String, required: true, index: true },
      code: { type: String, required: true },
      label: { type: String, required: true },
      isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
  );
  ConfigSchema.index({ type: 1, code: 1 }, { unique: true });

  // Pakai koleksi "configs" (default plural dari model Config)
  const Config =
    mongoose.models.Config || mongoose.model("Config", ConfigSchema);

  const VisitSchema = new mongoose.Schema(
    {
      date: Date,
      complaint: String,
      medication: String,
      visitDiagnosis: [String], // legacy
      visitDiagnosisIds: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Config" },
      ], // new
    },
    { _id: true }
  );

  const PatientSchema = new mongoose.Schema(
    {
      name: String,
      dateOfBirth: Date,
      address: String,
      gender: String,
      diagnosis: [String], // legacy
      diagnosisIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Config" }], // new
      visits: [VisitSchema],
    },
    { timestamps: true }
  );

  // Pakai koleksi "patients" (default plural dari model Patient)
  const Patient =
    mongoose.models.Patient || mongoose.model("Patient", PatientSchema);

  // 1) Scan semua label diagnosis dari data lama
  const patients = await Patient.find({}, { diagnosis: 1, visits: 1 });

  const labelSet = new Set();
  for (const p of patients) {
    for (const d of p.diagnosis || []) {
      const v = normLabel(d);
      if (v) labelSet.add(v);
    }
    for (const v of p.visits || []) {
      for (const d of v.visitDiagnosis || []) {
        const x = normLabel(d);
        if (x) labelSet.add(x);
      }
    }
  }

  const labels = Array.from(labelSet);

  // 2) Upsert Config diagnosis untuk label yang ditemukan (tidak overwrite existing)
  for (const label of labels) {
    const base = slugify(label) || "diagnosis";
    let code = base;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await Config.updateOne(
          { type: TYPE, code },
          { $setOnInsert: { type: TYPE, code, label, isActive: true } },
          { upsert: true }
        );
        break;
      } catch (e) {
        // kalau slug bentrok unique index
        if (String(e?.code) === "11000") {
          code = `${base}-${Math.random().toString(16).slice(2, 8)}`;
          continue;
        }
        throw e;
      }
    }
  }

  // 3) Build mapping label -> configId
  const configs = await Config.find({ type: TYPE }).lean();
  const mapLabelToId = new Map();
  for (const c of configs) {
    mapLabelToId.set(normKey(c.label), String(c._id));
  }

  // 4) Migrasi patients: visits.visitDiagnosis => visits.visitDiagnosisIds
  let updatedCount = 0;
  let noChangeCount = 0;
  const unknown = new Set();

  for (const p of patients) {
    let changed = false;

    for (const v of p.visits || []) {
      const legacy = Array.isArray(v.visitDiagnosis) ? v.visitDiagnosis : [];

      // kalau sudah pernah migrasi, skip (tapi tetap boleh update)
      if (legacy.length > 0) {
        const ids = [];
        for (const label of legacy) {
          const id = mapLabelToId.get(normKey(label));
          if (id) ids.push(id);
          else unknown.add(label);
        }

        v.visitDiagnosisIds = Array.from(new Set(ids));
        changed = true;

        if (REMOVE_LEGACY_FIELDS) {
          v.visitDiagnosis = undefined;
          changed = true;
        }
      }
    }

    // Set diagnosisIds dari gabungan visitDiagnosisIds
    const allIds = (p.visits || [])
      .flatMap((v) => v.visitDiagnosisIds || [])
      .filter(Boolean)
      .map((x) => String(x));

    const uniqueIds = Array.from(new Set(allIds));

    const existing = (p.diagnosisIds || []).map((x) => String(x));
    const same =
      existing.length === uniqueIds.length &&
      existing.every((x) => uniqueIds.includes(x));

    if (!same) {
      p.diagnosisIds = uniqueIds;
      changed = true;
    }

    if (REMOVE_LEGACY_FIELDS) {
      p.diagnosis = undefined;
      changed = true;
    }

    if (changed) {
      await p.save();
      updatedCount++;
    } else {
      noChangeCount++;
    }
  }

  console.log("Diagnosis labels found:", labels.length);
  console.log("Config count (type=diagnosis):", configs.length);
  console.log("Patients updated:", updatedCount);
  console.log("Patients no-change:", noChangeCount);

  if (unknown.size > 0) {
    console.log("Unknown labels (harusnya 0):", [...unknown]);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
