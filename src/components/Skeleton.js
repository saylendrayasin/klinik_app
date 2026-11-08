// Kerangka muat (skeleton) bersama. Bentuknya meniru isi yang akan datang
// agar halaman tidak "melompat" saat data tiba. Tanpa hooks, jadi bisa
// dipakai dari komponen mana pun.

export function Tulang({ className = "" }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

function IsiKartu({ baris }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Tulang className="w-7 h-7 rounded-full" />
        <Tulang className="h-4 w-40" />
      </div>
      {Array.from({ length: baris }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Tulang className={`h-3.5 ${i % 2 ? "w-24" : "w-32"}`} />
          <Tulang className="h-11 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

/** Isi tab / kartu yang sedang dimuat. */
export function SkeletonKartu({ baris = 4, label = "Memuat data..." }) {
  return (
    <div role="status" className="anim-masuk">
      <span className="sr-only">{label}</span>
      <IsiKartu baris={baris} />
    </div>
  );
}

/** Satu halaman penuh (judul + kartu form) yang sedang dimuat. */
export function SkeletonHalaman({ baris = 5, label = "Memuat halaman...", lebar = "max-w-3xl" }) {
  return (
    <div role="status" className={`${lebar} mx-auto space-y-5 anim-masuk`}>
      <span className="sr-only">{label}</span>
      <div className="flex items-center gap-3">
        <Tulang className="w-11 h-11 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Tulang className="h-5 w-56 max-w-full" />
          <Tulang className="h-3.5 w-72 max-w-full" />
        </div>
      </div>
      <IsiKartu baris={baris} />
    </div>
  );
}
