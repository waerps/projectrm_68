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

export default function ExamGrowthSummary({ improvement, totalSubjects, untestedSubjects = [], variant = "compact" }) {
  if (!improvement) return null;
  const { from, to, max, delta, basis, subjectsCounted, growth, growthCapped } = improvement;
  const tone = delta > 0 ? TONE.up : delta < 0 ? TONE.down : TONE.same;
  const ToneIcon = tone.Icon;
  const toLabel = basis === "pre-mid" ? "Mid-test" : "Post-test";
  const deltaText = `${delta > 0 ? "+" : ""}${fmtScore(delta)} คะแนน`;
  const missing = Math.max(0, Number(max) - Number(from));
  const full = variant === "full";

  // ประโยคหลัก อ่านแล้วเข้าใจทันที
  const headline = delta > 0 ? `ได้คะแนนเพิ่ม ${fmtScore(delta)} คะแนน`
    : delta < 0 ? `คะแนนลดลง ${fmtScore(Math.abs(delta))} คะแนน`
      : "คะแนนเท่าเดิม";

  // หมายเหตุว่าเทียบจากอะไร
  const notes = [];
  if (totalSubjects && subjectsCounted < totalSubjects) notes.push(`เทียบจาก ${subjectsCounted} ใน ${totalSubjects} วิชาที่สอบครบทั้งสองรอบ`);
  else notes.push(`เทียบจาก ${subjectsCounted} วิชาที่สอบครบทั้งสองรอบ`);
  if (untestedSubjects.length) notes.push(`ยังไม่นับ ${untestedSubjects.join(", ")} (ยังไม่ได้สอบ)`);
  if (basis === "pre-mid") notes.push("ยังไม่มี Post-test จึงเทียบกับ Mid-test ไปก่อน");

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
        <ScoreBar label="Pre-test" score={from} max={max} barClass="bg-slate-400" />
        <ScoreBar label={toLabel} score={to} max={max} barClass={tone.bar} />
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
              รอบแรกยังขาดอีก {fmtScore(missing)} คะแนนถึงจะเต็ม
              {delta > 0 ? ` · รอบนี้เก็บเพิ่มมาได้ ${fmtScore(delta)} คะแนน` : ""}
            </p>
            {growthCapped && (
              <p className="mt-1 text-[11px] leading-5 text-slate-600">
                น้องพื้นฐานดีตั้งแต่แรก เหลือที่ให้เพิ่มน้อย จึงไม่ควรเทียบตัวเลขนี้กับน้องที่เริ่มจากคะแนนต่ำกว่า
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
