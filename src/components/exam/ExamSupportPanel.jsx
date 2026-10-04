import { AlertTriangle, Clock, Info, LifeBuoy, Map as MapIcon, Timer } from "lucide-react";
import { formatSecondsPerQuestion } from "../../utils/examAnalysisDisplay";

function PaceGauge({ ratio }) {
  const angle = ratio == null ? null : -90 + (Math.max(0.5, Math.min(1.5, ratio)) - 0.5) * 180;
  return (
    <svg viewBox="0 0 200 118" className="w-full max-w-[280px] mx-auto" aria-hidden="true">
      <defs><linearGradient id="saPace" x1="0" x2="1"><stop offset="0" stopColor="#60a5fa" /><stop offset=".5" stopColor="#e2e8f0" /><stop offset="1" stopColor="#fb7185" /></linearGradient></defs>
      <path d="M20,100 A80,80 0 0 1 180,100" fill="none" stroke="url(#saPace)" strokeWidth="16" strokeLinecap="round" />
      <line x1="100" y1="16" x2="100" y2="30" stroke="#64748b" strokeWidth="2" />
      {angle != null && <g transform={`rotate(${angle} 100 100)`}><line x1="100" y1="100" x2="100" y2="34" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" /></g>}
      <circle cx="100" cy="100" r="8" fill={angle != null ? "#0f172a" : "#94a3b8"} />
      <text x="20" y="116" fontSize="12" fill="#3b82f6" fontWeight="700">เร็ว</text>
      <text x="180" y="116" fontSize="12" textAnchor="end" fill="#f43f5e" fontWeight="700">ช้า</text>
    </svg>
  );
}

const AiLabel = ({ model }) => <span className="text-[11px] font-semibold bg-orange-100 text-orange-700 rounded-full px-2 py-0.5">เขียนโดย Google Gemini ({model || "ไม่ทราบรุ่น"})</span>;
const questionRefs = (item) => {
  const numbers = item.questionNos || item.questionNumbers;
  if (Array.isArray(numbers)) return [...new Set(numbers)].slice(0, 12);
  const out = [];
  for (const match of String(item.evidence || "").matchAll(/ข้อ(?:ที่)?\s*(\d+(?:\s*(?:,|และ)\s*\d+)*)/g)) {
    match[1].split(/\s*(?:,|และ)\s*/).forEach((n) => { if (n && !out.includes(n)) out.push(n); });
  }
  return out.slice(0, 12);
};

function TimeFact({ label, value, unit }) {
  return <div className="min-w-0 rounded-xl border border-slate-100 bg-white px-4 py-3">
    <p className="text-xs font-semibold text-slate-500">{label}</p>
    <p className="mt-1 text-xl font-bold tabular-nums text-slate-800">{value}<span className="ml-1 text-xs font-semibold text-slate-500">{unit}</span></p>
  </div>;
}

export default function ExamSupportPanel({ latest, roomPace, previous, aiRow, notice }) {
  const misconceptions = aiRow?.misconceptions || [];
  const focusNext = aiRow?.focusNext || [];
  const myPace = latest?.avgTimePerQuestion ?? null;
  const ratio = myPace != null && roomPace > 0 ? myPace / roomPace : null;
  const difference = myPace != null && roomPace != null ? myPace - roomPace : null;
  const timeDelta = myPace != null && previous?.avgTimePerQuestion != null ? myPace - previous.avgTimePerQuestion : null;
  const timeAvailable = myPace != null;
  const timeMessage = !timeAvailable
    ? latest?.timingStatus === "not_consented" ? "ไม่ได้เก็บข้อมูลเวลารายข้อของนักเรียนคนนี้" : "ข้อมูลเวลารายข้อไม่ครบหรือยังไม่ผ่านการตรวจสอบ จึงยังสรุปเวลาไม่ได้"
    : difference == null ? "ยังไม่มีค่าเฉลี่ยห้องสำหรับเปรียบเทียบ"
      : Math.abs(difference) < 0.05 ? "ใช้เวลาใกล้เคียงค่าเฉลี่ยห้อง"
        : `${difference < 0 ? "เร็วกว่าห้อง" : "ช้ากว่าห้อง"} ${formatSecondsPerQuestion(Math.abs(difference))} วินาที/ข้อ`;
  const previousMessage = timeDelta == null ? "ยังไม่มีเวลารอบก่อนสำหรับเปรียบเทียบ"
    : Math.abs(timeDelta) < 0.05 ? `ใช้เวลาใกล้เคียง ${previous.label}`
      : `${timeDelta < 0 ? "เร็วขึ้น" : "ช้าลง"} ${formatSecondsPerQuestion(Math.abs(timeDelta))} วินาที/ข้อ จาก ${previous.label}`;

  return (
    <div id="sec-help" className="sa-rise grid lg:grid-cols-2 gap-4 items-stretch" style={{ animationDelay: ".18s" }}>
      <section className="min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-5">
      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><LifeBuoy className="h-4 w-4 text-orange-500" /> สิ่งที่ต้องช่วย</h3>
      <div className="space-y-3">
        <p className="text-xs font-bold text-slate-500 flex flex-wrap items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-rose-500" /> เรื่องที่ควรทบทวน {aiRow && <AiLabel model={aiRow.model} />}</p>
        {!aiRow || misconceptions.length === 0 ? (
          <p className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-600">
            {!aiRow ? notice : "ผลวิเคราะห์รอบนี้ไม่มีข้อสังเกตเพิ่มเติมในส่วนนี้"}
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {misconceptions.map((item, index) => {
              const refs = questionRefs(item);
              return <article key={index} className={`relative min-w-0 rounded-2xl bg-gradient-to-br from-rose-50 to-white border border-rose-100 p-4 pl-5 overflow-hidden ${misconceptions.length % 2 === 1 && index === misconceptions.length - 1 ? "md:col-span-2" : ""}`}>
                <div className="absolute left-0 inset-y-0 w-1.5 bg-gradient-to-b from-rose-400 to-red-500" />
                <p className="text-sm font-bold text-rose-800 break-words">{item.topic}</p>
                <p className="text-sm text-rose-900/80 leading-relaxed mt-1 break-words">{item.pattern}</p>
                {refs.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{refs.map((n) => <span key={n} className="text-[11px] font-bold bg-white border border-rose-200 text-rose-600 rounded-lg px-2 py-0.5">ข้อ {n}</span>)}</div>}
                {item.evidence && <p className="mt-2 text-xs leading-relaxed text-rose-700/80 break-words">หลักฐาน: {item.evidence}</p>}
              </article>;
            })}
          </div>
        )}
      </div>

      {focusNext.length > 0 && <div>
        <p className="text-xs font-bold text-slate-500 flex flex-wrap items-center gap-1.5 mb-3"><MapIcon className="h-4 w-4 text-orange-500" /> แนวทางที่ควรทำต่อ <AiLabel model={aiRow?.model} /></p>
        <ol className="grid gap-3">
          {focusNext.map((item, index) => <li key={index} className="flex gap-3 rounded-xl bg-orange-50/70 border border-orange-100 p-4">
            <span className="shrink-0 h-7 w-7 rounded-lg bg-orange-500 text-white text-sm font-bold flex items-center justify-center">{index + 1}</span>
            <div className="min-w-0"><p className="text-sm font-semibold text-slate-800 leading-relaxed break-words">{typeof item === "string" ? item : item.action}</p>{typeof item !== "string" && item.why && <p className="text-xs text-slate-500 leading-relaxed mt-1 break-words">{item.why}</p>}</div>
          </li>)}
        </ol>
      </div>}
      </section>

      <section className="min-w-0 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white shadow-sm p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-bold text-slate-600 flex items-center gap-1.5"><Timer className="h-4 w-4" /> จังหวะการทำข้อสอบ · {latest?.label || "—"}
            <span title="รวมเวลาที่อยู่ในแต่ละข้อทุกครั้งที่เปิด แล้วหารด้วยจำนวนข้อทั้งหมด รวมข้อที่มีเวลา 0 วินาทีเฉพาะเมื่อข้อมูลครบ" aria-label="วิธีคำนวณเวลาเฉลี่ยต่อข้อ" tabIndex={0} className="cursor-help"><Info className="h-3.5 w-3.5 text-slate-400" /></span>
          </h4>
          <span className="text-[11px] font-semibold rounded-full bg-slate-200/70 px-2 py-0.5 text-slate-600">ข้อมูลจากการทำข้อสอบ</span>
        </div>
        {!timeAvailable ? <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-5 space-y-3">
          <p className="text-sm font-bold text-amber-900">ยังไม่มีเวลารายข้อที่ตรวจสอบได้</p>
          <p className="text-sm text-amber-800 leading-relaxed">{timeMessage}</p>
          {latest?.timingStatus !== "not_consented" && latest?.elapsedSeconds != null && <div className="rounded-xl bg-white p-4">
            <p className="text-xs font-semibold text-slate-500">เวลาตั้งแต่เริ่มทำจนส่งข้อสอบ</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{formatSecondsPerQuestion(latest.elapsedSeconds)} <span className="text-sm font-medium text-slate-500">วินาที</span></p>
            <p className="mt-1 text-xs text-slate-500">ค่านี้อาจรวมช่วงที่ไม่ได้อยู่ในข้อสอบ จึงไม่ใช้แทนเวลารายข้อ</p>
          </div>}
        </div> : <div className="mt-4 grid items-center gap-5">
          <div className="text-center min-w-0">
            <PaceGauge ratio={ratio} />
            <p className="mt-1 tabular-nums text-4xl font-bold text-slate-900">{formatSecondsPerQuestion(myPace)}<span className="ml-1 text-sm font-semibold text-slate-500">วินาที/ข้อ</span></p>
            <p className="mt-1 text-xs font-semibold text-slate-500">เวลาเฉลี่ยของนักเรียน</p>
          </div>
          <div className="min-w-0 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <TimeFact label="ค่าเฉลี่ยห้อง" value={formatSecondsPerQuestion(roomPace)} unit="วินาที/ข้อ" />
              <TimeFact label="เวลารวมรายข้อ" value={formatSecondsPerQuestion(latest?.secondsUsed)} unit="วินาที" />
            </div>
            <p className={`rounded-xl px-4 py-3 text-sm font-semibold leading-relaxed ${timeAvailable ? "bg-white border border-slate-100 text-slate-700" : "bg-amber-50 text-amber-800"}`}>{timeMessage}</p>
            {timeAvailable && <p className="text-sm text-slate-600 leading-relaxed flex items-start gap-2"><Clock className="h-4 w-4 mt-0.5 shrink-0" />{previousMessage}</p>}
          </div>
        </div>}

      </section>
    </div>
  );
}
