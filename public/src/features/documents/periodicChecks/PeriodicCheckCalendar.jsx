import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "../../../components/icons/index.jsx";
import { getCategoryLabel, getCheckStatusStyle } from "../../../constants/periodicCheck.js";
import { toLocalIsoDate } from "../../../utils/dateUtils.js";

const WEEKDAY_LABELS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];
const RANGE_MODES = [
  { key: "today", label: "Bugün" },
  { key: "week", label: "Bu Hafta" },
  { key: "month", label: "Bu Ay" },
];

function toIsoDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function startOfWeek(date) {
  const d = new Date(date);
  const offset = (d.getDay() + 6) % 7; // Pazartesi=0
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Sprint 7.2.2 — Takvim görünümü (ay ızgarası). Sprint 7.2.3 ile Bugün / Bu Hafta / Bu Ay
 * görünüm modları eklendi — yeni bir kütüphane KULLANILMADI, hepsi mevcut `checks`
 * verisinin (`nextDueDate` eşleşmesi) farklı gruplamalarıdır.
 *
 * @param {{ theme: object, checks: object[] }} props
 */
export default function PeriodicCheckCalendar({ theme, checks }) {
  const [rangeMode, setRangeMode] = useState("month");
  const [viewDate, setViewDate] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDate, setSelectedDate] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const checksByDate = useMemo(() => {
    const map = {};
    for (const c of checks) {
      if (!c.nextDueDate) continue;
      (map[c.nextDueDate] ||= []).push(c);
    }
    return map;
  }, [checks]);

  const cells = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    // Pazartesi=0 olacak şekilde ofset (getDay(): Pazar=0..Cumartesi=6)
    const offset = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const list = [];
    for (let i = 0; i < offset; i++) list.push(null);
    for (let day = 1; day <= daysInMonth; day++) list.push(day);
    return list;
  }, [year, month]);

  const monthLabel = viewDate.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  const todayIso = toLocalIsoDate(new Date());
  const selectedChecks = selectedDate ? checksByDate[selectedDate] || [] : [];

  function changeMonth(delta) {
    setViewDate((prev) => { const d = new Date(prev); d.setMonth(d.getMonth() + delta); return d; });
    setSelectedDate(null);
  }

  function worstStatusOf(dateChecks) {
    if (dateChecks.some((c) => c.status === "overdue")) return "overdue";
    if (dateChecks.some((c) => c.status === "upcoming")) return "upcoming";
    return "ok";
  }

  const weekDays = useMemo(() => {
    const start = startOfWeek(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, []);

  const todaysChecks = checksByDate[todayIso] || [];

  const rangeTabs = (
    <div className="flex gap-1.5 mb-3">
      {RANGE_MODES.map((m) => (
        <button
          key={m.key}
          onClick={() => { setRangeMode(m.key); setSelectedDate(null); }}
          className="text-[11px] font-semibold px-2.5 py-1.5 rounded-full"
          style={rangeMode === m.key ? { background: theme.accent, color: theme.onAccent } : { background: theme.surfaceAlt, color: theme.textMuted, border: `1px solid ${theme.border}` }}
        >
          {m.label}
        </button>
      ))}
    </div>
  );

  // --- "Bugün" görünümü: basit, tek günlük liste ---
  if (rangeMode === "today") {
    return (
      <div>
        {rangeTabs}
        <p className="text-sm font-semibold mb-2" style={{ color: theme.textPrimary }}>
          {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        {todaysChecks.length === 0 ? (
          <p className="text-xs" style={{ color: theme.textFaint }}>Bugün planlanan kontrol yok.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {todaysChecks.map((c) => {
              const style = getCheckStatusStyle(c.status, theme);
              return (
                <div key={c.id} className="rounded-lg border px-3 py-2 flex items-center justify-between gap-2" style={{ borderColor: theme.border, background: theme.surface }}>
                  <div className="min-w-0">
                    <p className="text-sm truncate" style={{ color: theme.textPrimary }}>{c.itemName}</p>
                    <p className="text-[10.5px]" style={{ color: theme.textFaint }}>{getCategoryLabel(c.category)}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ background: style.bg, color: style.text }}>{style.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // --- "Bu Hafta" görünümü: 7 günlük tek satır şerit ---
  if (rangeMode === "week") {
    return (
      <div>
        {rangeTabs}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {weekDays.map((d) => {
            const iso = toLocalIsoDate(d);
            const dateChecks = checksByDate[iso] || [];
            const isToday = iso === todayIso;
            const isSelected = iso === selectedDate;
            const status = dateChecks.length > 0 ? worstStatusOf(dateChecks) : null;
            const statusStyle = status ? getCheckStatusStyle(status, theme) : null;
            return (
              <button
                key={iso}
                onClick={() => dateChecks.length > 0 && setSelectedDate(isSelected ? null : iso)}
                className="rounded-lg flex flex-col items-center justify-center py-2 gap-0.5"
                style={{
                  background: isSelected ? theme.accent : statusStyle ? statusStyle.bg : theme.surfaceAlt,
                  border: isToday ? `1.5px solid ${theme.accent}` : "1px solid transparent",
                  cursor: dateChecks.length > 0 ? "pointer" : "default",
                }}
              >
                <span className="text-[9px] font-semibold" style={{ color: isSelected ? theme.onAccent : statusStyle ? statusStyle.text : theme.textFaint }}>
                  {WEEKDAY_LABELS[(d.getDay() + 6) % 7]}
                </span>
                <span className="text-[13px] font-bold" style={{ color: isSelected ? theme.onAccent : statusStyle ? statusStyle.text : theme.textMuted }}>
                  {d.getDate()}
                </span>
                {dateChecks.length > 0 && (
                  <span className="text-[8px] font-bold" style={{ color: isSelected ? theme.onAccent : statusStyle.text }}>{dateChecks.length}</span>
                )}
              </button>
            );
          })}
        </div>
        {selectedDate && (
          <div className="rounded-lg border px-3 py-2.5" style={{ borderColor: theme.border, background: theme.surface }}>
            <p className="text-[11px] font-semibold mb-1.5" style={{ color: theme.textFaint }}>
              {new Date(selectedDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })} tarihinde planlanan
            </p>
            <div className="flex flex-col gap-1">
              {selectedChecks.map((c) => (
                <div key={c.id} className="text-xs" style={{ color: theme.textPrimary }}>• {c.itemName}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- "Bu Ay" görünümü: mevcut ay ızgarası (Sprint 7.2.2'den, değişmedi) ---
  return (
    <div>
      {rangeTabs}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => changeMonth(-1)} aria-label="Önceki ay" className="p-1.5 rounded-lg" style={{ background: theme.surfaceAlt }}>
          <ChevronLeft style={{ fontSize: "14px", color: theme.textMuted }} />
        </button>
        <p className="text-sm font-semibold capitalize" style={{ color: theme.textPrimary }}>{monthLabel}</p>
        <button onClick={() => changeMonth(1)} aria-label="Sonraki ay" className="p-1.5 rounded-lg" style={{ background: theme.surfaceAlt }}>
          <ChevronRight style={{ fontSize: "14px", color: theme.textMuted }} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold py-1" style={{ color: theme.textFaint }}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`pad-${i}`} />;
          const iso = toIsoDate(year, month, day);
          const dateChecks = checksByDate[iso] || [];
          const isToday = iso === todayIso;
          const isSelected = iso === selectedDate;
          const status = dateChecks.length > 0 ? worstStatusOf(dateChecks) : null;
          const statusStyle = status ? getCheckStatusStyle(status, theme) : null;

          return (
            <button
              key={iso}
              onClick={() => dateChecks.length > 0 && setSelectedDate(isSelected ? null : iso)}
              className="aspect-square rounded-lg flex flex-col items-center justify-center relative"
              style={{
                background: isSelected ? theme.accent : statusStyle ? statusStyle.bg : "transparent",
                border: isToday ? `1.5px solid ${theme.accent}` : "1px solid transparent",
                cursor: dateChecks.length > 0 ? "pointer" : "default",
              }}
            >
              <span className="text-[11px] font-medium" style={{ color: isSelected ? theme.onAccent : statusStyle ? statusStyle.text : theme.textMuted }}>
                {day}
              </span>
              {dateChecks.length > 0 && (
                <span className="text-[8px] font-bold" style={{ color: isSelected ? theme.onAccent : statusStyle.text }}>
                  {dateChecks.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-3 rounded-lg border px-3 py-2.5" style={{ borderColor: theme.border, background: theme.surface }}>
          <p className="text-[11px] font-semibold mb-1.5" style={{ color: theme.textFaint }}>
            {new Date(selectedDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })} tarihinde planlanan
          </p>
          <div className="flex flex-col gap-1">
            {selectedChecks.map((c) => (
              <div key={c.id} className="text-xs" style={{ color: theme.textPrimary }}>• {c.itemName}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
