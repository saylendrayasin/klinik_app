"use client";

import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { fetcher } from "@/lib/fetcher";

export default function DiagnosisSelect({ value = [], onChange, inputId }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetcher("/api/config?type=diagnosis&limit=200");
        const items = res?.data || [];
        const opts = items.map((c) => ({ value: c._id, label: c.label }));
        if (alive) setOptions(opts);
      } catch (e) {
        console.error(e);
        if (alive) setOptions([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const selected = useMemo(() => {
    const isObjectId = (v) => typeof v === "string" && /^[a-f\d]{24}$/i.test(v);
    const set = new Set(value || []);

    // value berisi id
    if ([...set].some(isObjectId))
      return options.filter((o) => set.has(o.value));

    // value berisi label (legacy)
    return options.filter((o) => set.has(o.label));
  }, [options, value]);

  return (
    <Select
      inputId={inputId}
      options={options}
      isMulti
      isLoading={loading}
      value={selected}
      onChange={onChange}
      className="text-black"
      classNamePrefix="select"
      placeholder="Pilih diagnosis..."
    />
  );
}
