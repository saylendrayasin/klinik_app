import mongoose from "mongoose";

const VisitSchema = new mongoose.Schema({
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
});

const PatientSchema = new mongoose.Schema({
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
  visits: [VisitSchema],
});

export const Patient =
  mongoose.models.Patient || mongoose.model("Patient", PatientSchema);
