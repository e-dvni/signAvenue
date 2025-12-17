// src/utils/scheduling.js

// Normalize a JS Date to local midnight
export const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// 3–30 day window rule
export const isInInstallWindow = (date) => {
  const d = normalizeDate(date);

  const today = normalizeDate(new Date());

  const min = new Date(today);
  min.setDate(min.getDate() + 3); // at least 3 days from today

  const max = new Date(today);
  max.setDate(max.getDate() + 30); // up to 30 days

  return d >= min && d <= max;
};

// US holiday helper (same holiday list we discussed)
export const isUsHoliday = (date) => {
  const d = normalizeDate(date);
  const y = d.getFullYear();

  const mm = d.getMonth() + 1; // 1–12
  const dd = d.getDate();

  const sameDay = (m, day) => mm === m && dd === day;

  // Fixed-date holidays
  if (sameDay(1, 1)) return true;   // New Year's Day
  if (sameDay(7, 4)) return true;   // Independence Day
  if (sameDay(11, 11)) return true; // Veterans Day
  if (sameDay(12, 24)) return true; // Christmas Eve
  if (sameDay(12, 25)) return true; // Christmas Day
  if (sameDay(12, 31)) return true; // New Year's Eve

  // Thanksgiving: 4th Thursday of November
  if (mm === 11) {
    const firstOfNov = new Date(y, 10, 1);
    const firstDay = firstOfNov.getDay(); // 0–6
    const firstThursday = 1 + ((4 - firstDay + 7) % 7);
    const thanksgiving = firstThursday + 21; // 4th Thursday
    if (dd === thanksgiving) return true;
  }

  return false;
};

// Weekend or holiday
export const isWeekendOrHoliday = (date) => {
  const d = normalizeDate(date);
  const weekday = d.getDay(); // 0=Sun..6=Sat
  const isWeekend = weekday === 0 || weekday === 6;
  return isWeekend || isUsHoliday(d);
};
