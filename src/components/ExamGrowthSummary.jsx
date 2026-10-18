// สรุปพัฒนาการคะแนนสอบของนักเรียน 1 คน — ใช้ร่วมกันในหน้า "ข้อมูลนักเรียน" (การ์ดย่อ)
// และหน้า "รายละเอียดนักเรียน" (แบบเต็ม) ให้ใช้ถ้อยคำและหน้าตาเดียวกัน
//
// improvement (จาก backend): { from, to, max, delta, basis: 'pre-mid'|'pre-post',
//   subjectsCounted, growth, growthCapped, fromPct, room }
// growth = เก็บคะแนนส่วนที่ยังขาดได้กี่ % (สูตรกลางเดียวกับหน้าแอดมิน)
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { fmtScore } from "../utils/examScore";

const TONE = {
  up: { chip: "bg-green-50 text-green-800 border-green-200", bar: "bg-green-500", text: "text-green-700", Icon: TrendingUp, word: "ดีขึ้น" },
  down: { chip: "bg-red-50 text-red-800 border-red-200", bar: "bg-red-500", text: "text-red-700", Icon: TrendingDown, word: "ลดลง" },
  same: { chip: "bg-amber-50 text-amber-800 border-amber-200", bar: "bg-amber-500", text: "text-amber-800", Icon: Minus, word: "เท่าเดิม" },
};

const clampPct = (v) => Math.max(0, Math.min(100, Number(v) || 0));

// แถบคะแนน 1 รอบ: ชื่อรอบ + ตัวเลข + แถบเทียบคะแนนเต็ม
function ScoreBar({ label, score, max, barClass }) {
  const pct = max > 0 ? clampPct((score / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-600">{label}</span>
        <span className="tabular-nums text-slate-600">
          <b className="text-sm text-slate-900">{fmtScore(score)}</b> / {fmtScore(max)}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// countedSubjects = ชื่อวิชาที่นำมาคิด (สอบครบทั้งสองรอบ) · pendingSubjects = สอบไปแล้วแต่ยังไม่ครบสองรอบ
export default function ExamGrowthSummary({ improvement, totalSubjects, untestedSubjects = [], countedSubjects = [], pendingSubjects = [], variant = "compact" }) {
  if (!improvement) return null;
  const { from, to, max, delta, basis, subjectsCounted, growth, growthCapped } = improvement;
  const tone = delta > 0 ? TONE.up : delta < 0 ? TONE.down : TONE.same;
  const ToneIcon = tone.Icon;
  const toLabel = basis === "pre-mid" ? "Mid-test" : "Post-test";
  const deltaText = `${delta > 0 ? "+" : ""}${fmtScore(delta)} คะแนน`;
  const missing = Math.max(0, Number(max) - Number(from));
  const full = variant === "full";

  // ประโยคหลัก อ่านแล้วเข้าใจทันที
  const multi = subjectsCounted > 1;
  const scope = multi ? `คะแนนรวม ${subjectsCounted} วิชา` : "คะแนน";
  const headline = delta > 0 ? `${scope}เพิ่มขึ้น ${fmtScore(delta)} คะแนน`
    : delta < 0 ? `${scope}ลดลง ${fmtScore(Math.abs(delta))} คะแนน`
      : `${scope}เท่าเดิม`;

  // หมายเหตุว่าเทียบจากอะไร
  const notes = [];
  if (totalSubjects && subjectsCounted < totalSubjects) notes.push(`คำนวณจาก ${subjectsCounted} จาก ${totalSubjects} วิชา (เฉพาะวิชาที่สอบครบทั้งสองรอบ วิชาละ ${fmtScore(max / Math.max(1, subjectsCounted))} คะแนน)`);
  else notes.push(`คำนวณจาก ${subjectsCounted} วิชาที่สอบครบทั้งสองรอบ (วิชาละ ${fmtScore(max / Math.max(1, subjectsCounted))} คะแนน)`);
  if (pendingSubjects.length) notes.push(`ยังไม่นับ ${pendingSubjects.join(", ")} (สอบยังไม่ครบสองรอบ)`);
  if (untestedSubjects.length) notes.push(`ยังไม่นับ ${untestedSubjects.join(", ")} (ยังไม่ได้สอบ)`);
  if (basis === "pre-mid") notes.push("ยังไม่มีผล Post-test จึงเทียบกับ Mid-test");

  return (
    <div className={full ? "grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : "space-y-3"}>
      {/* ── คะแนน 2 รอบ ── */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={`font-bold text-slate-900 ${full ? "text-base" : "text-sm"}`}>{headline}</p>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${tone.chip}`}>
            <ToneIcon className="h-3.5 w-3.5" aria-hidden="true" />{deltaText}
          </span>
        </div>
        <ScoreBar label={multi ? "Pre-test (รวม)" : "Pre-test"} score={from} max={max} barClass="bg-slate-400" />
        <ScoreBar label={multi ? `${toLabel} (รวม)` : toLabel} score={to} max={max} barClass={tone.bar} />
        {countedSubjects.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[11px] text-slate-500">วิชาที่นำมาคิด:</span>
            {countedSubjects.map((name) => (
              <span key={name} className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700">{name}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── เก็บคะแนนที่ยังขาดได้กี่ % ── */}
      <div className={full ? "rounded-xl border border-slate-200 bg-white p-4" : "rounded-lg bg-slate-50 p-2.5"}>
        {growth != null ? (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700">{growth < 0 ? "ถอยห่างจากคะแนนเต็ม" : "เก็บคะแนนที่ยังขาดได้"}</span>
              <span className={`tabular-nums font-bold ${tone.text} ${full ? "text-2xl" : "text-base"}`}>{Math.abs(growth)}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
              <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${clampPct(growth)}%` }} />
            </div>
            <p className="mt-1.5 text-[11px] leading-5 text-slate-600">
              Pre-test ยังขาดอีก {fmtScore(missing)} คะแนนจากคะแนนเต็ม
              {delta > 0 ? ` · ${toLabel} ทำเพิ่มได้ ${fmtScore(delta)} คะแนน` : ""}
            </p>
            {growthCapped && (
              <p className="mt-1 text-[11px] leading-5 text-slate-600">
                ผู้เรียนมีพื้นฐานเดิมสูง จึงไม่ควรเทียบตัวเลขนี้กับผู้เรียนที่เริ่มจากคะแนนต่ำกว่าโดยตรง
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-slate-600">ยังคำนวณสัดส่วนพัฒนาการไม่ได้</p>
        )}
        <p className={`flex items-start gap-1 text-[11px] leading-5 text-slate-500 ${full ? "mt-3 border-t border-slate-100 pt-2" : "mt-1.5"}`}>
          <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{notes.join(" · ")}</span>
        </p>
      </div>
    </div>
  );
}
