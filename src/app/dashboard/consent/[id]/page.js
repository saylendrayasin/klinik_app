"use client";

import { use } from "react";
import HalamanSurat from "@/components/surat/HalamanSurat";

export default function DetailSuratPage({ params }) {
  const { id } = use(params);
  return <HalamanSurat key={id} jenis="consent" id={id} />;
}
