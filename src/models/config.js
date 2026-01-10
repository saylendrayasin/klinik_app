import mongoose from "mongoose";

const ConfigSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

ConfigSchema.index({ type: 1, code: 1 }, { unique: true });

export const Config =
  mongoose.models.Config || mongoose.model("Config", ConfigSchema);
