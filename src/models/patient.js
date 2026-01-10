import mongoose from "mongoose";

const VisitSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    complaint: {
      type: String,
      required: true,
    },
    medication: {
      type: String,
    },
    visitDiagnosis: {
      type: [String],
    },
    visitDiagnosisIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Config",
      },
    ],
  },
  { _id: true }
);

const PatientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    address: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: true,
    },
    diagnosis: {
      type: [String],
      default: [],
    },
    diagnosisIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Config",
      },
    ],
    visits: [VisitSchema],
  },
  { timestamps: true }
);

export const Patient =
  mongoose.models.Patient || mongoose.model("Patient", PatientSchema);
