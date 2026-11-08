import { ruteRingkasan } from "@/lib/surat";
import { SuratSakit } from "@/models/suratSakit";

export const GET = ruteRingkasan(SuratSakit, "surat keterangan sakit");
