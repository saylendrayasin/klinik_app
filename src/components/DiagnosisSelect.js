"use client";

import Select from "react-select";

export default function DiagnosisSelect({ value, onChange }) {
  const diagnosisOptions = [
    { value: "Flu", label: "Flu" },
    { value: "Batuk", label: "Batuk" },
    { value: "Demam", label: "Demam" },
    { value: "Sakit Kepala", label: "Sakit Kepala" },
    { value: "Asma", label: "Asma" },
  ];

  return (
    <Select
      options={diagnosisOptions}
      isMulti
      value={diagnosisOptions.filter((option) => value.includes(option.value))}
      onChange={onChange}
      className="text-black"
      classNamePrefix="select"
      placeholder="Pilih diagnosis..."
    />
  );
}
