export function todayYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function daysBetweenInclusive(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const ms = e.getTime() - s.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
}
