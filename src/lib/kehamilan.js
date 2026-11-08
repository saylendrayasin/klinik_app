export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Fragmen query untuk "jadwal kunjungan terlewat".
 *
 * Definisinya (sesuai docs/modul-kehamilan.md §5 dan getFlags() di halaman list):
 * jadwalBerikutnya milik kunjungan TERAKHIR sudah lewat dari hari ini.
 *
 * Sebelumnya dipakai `{ "visits.jadwalBerikutnya": { $lt: today } }` yang cocok
 * ke kunjungan mana pun, sehingga angka summary card selalu lebih besar dari
 * jumlah baris yang benar-benar ber-badge "Jadwal Lewat".
 *
 * Gabungkan dengan filter lain, mis:
 *   Kehamilan.countDocuments({ status: "aktif", ...jadwalTerlewatQuery(today) })
 */
export function jadwalTerlewatQuery(today) {
  return {
    $expr: {
      $let: {
        vars: {
          last: {
            $reduce: {
              input: { $ifNull: ["$visits", []] },
              initialValue: null,
              in: {
                $cond: [
                  {
                    $or: [
                      { $eq: ["$$value", null] },
                      { $gt: ["$$this.date", "$$value.date"] },
                    ],
                  },
                  "$$this",
                  "$$value",
                ],
              },
            },
          },
        },
        in: {
          $and: [
            { $ne: ["$$last", null] },
            { $ne: [{ $ifNull: ["$$last.jadwalBerikutnya", null] }, null] },
            { $lt: ["$$last.jadwalBerikutnya", today] },
          ],
        },
      },
    },
  };
}
