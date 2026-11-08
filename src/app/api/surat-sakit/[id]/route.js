import { ruteDetail } from "@/lib/surat";
import { KONFIG_SAKIT } from "@/lib/suratSakit";

export const { GET, PATCH, DELETE } = ruteDetail(KONFIG_SAKIT);
