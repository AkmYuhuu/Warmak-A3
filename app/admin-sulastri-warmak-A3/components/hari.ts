// Filter tampilan per hari (YYYY-MM-DD, konvensi sama seperti aggregate + submit Laku).
export const dayKey = (d: Date) => d.toISOString().slice(0, 10);
export const todayKey = () => dayKey(new Date());
export const addDays = (key: string, n: number) => {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return dayKey(d);
};
// "Senin, 14 September 2026" — khusus tampilan, bukan kunci filter.
export const fmtHari = (key: string) =>
  new Date(`${key}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

// Filter tampilan per bulan (YYYY-MM, slice(0,7) sama seperti aggregate).
export const monthKey = (d: Date) => d.toISOString().slice(0, 7);
export const thisMonthKey = () => monthKey(new Date());
export const addMonths = (key: string, n: number) => {
  const d = new Date(Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1 + n, 1));
  return d.toISOString().slice(0, 7);
};
// "September 2026" — khusus tampilan.
export const fmtBulan = (key: string) =>
  new Date(`${key}-01T00:00:00`).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
