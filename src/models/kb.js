import mongoose from "mongoose";

const visitSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    returnDate: {
      type: Date,
      required: false,
    },
    metode: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
  },
  { _id: true }
);

const kbSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    nik: {
      type: String,
      required: true,
      unique: true,
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
      default: "Female",
      enum: ["Female"],
    },
    numberOfChildren: {
      type: Number,
      default: 0,
    },
    metodes: {
      type: [String],
      default: [],
    },
    visits: [visitSchema],
  },
  {
    timestamps: true,
  }
);

export const Kb = mongoose.models.Kb || mongoose.model("Kb", kbSchema);
