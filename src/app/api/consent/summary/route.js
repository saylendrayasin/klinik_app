import { ruteRingkasan } from "@/lib/surat";
import { Consent } from "@/models/consent";

export const GET = ruteRingkasan(Consent, "surat persetujuan");
