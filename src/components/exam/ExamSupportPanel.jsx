import { AlertTriangle, LifeBuoy, Map as MapIcon } from "lucide-react";

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

export default function ExamSupportPanel({ aiRow, notice, factTopics = [] }) {
  const misconceptions = aiRow?.misconceptions || [];
  const focusNext = aiRow?.focusNext || [];

  return (
    <div id="sec-help" className="sa-rise space-y-4" style={{ animationDelay: ".18s" }}>
      <section className="min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col gap-5">
      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><LifeBuoy className="h-4 w-4 text-orange-500" /> สิ่งที่ต้องช่วย</h3>
      <div className={`space-y-3 ${!aiRow || misconceptions.length === 0 ? "flex-1 flex flex-col" : ""}`}>
        <p className="text-xs font-bold text-slate-500 flex flex-wrap items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-rose-500" /> เรื่องที่ควรทบทวน {aiRow && <AiLabel model={aiRow.model} />}</p>
        {!aiRow || misconceptions.length === 0 ? (
          <p className="flex-1 flex items-center rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-600">
            {!aiRow ? notice : "ผลวิเคราะห์รอบนี้ไม่มีข้อสังเกตเพิ่มเติมในส่วนนี้"}
          </p>
        ) : null}
        {!aiRow && factTopics.length > 0 && (
          <>
            <p className="text-xs font-bold text-slate-500">หมวดที่ยังได้คะแนนไม่เต็ม <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">จากผลสอบจริง</span></p>
            <ul className="grid gap-3 md:grid-cols-2">
              {factTopics.map((t) => (
                <li key={t.topic} className="min-w-0 rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <p className="text-sm font-bold text-slate-800 break-words">{t.topic}</p>
                  <p className="text-sm text-slate-600 mt-1 tabular-nums">{t.points || "-"} · {Math.round(t.pct * 100)}%</p>
                </li>
              ))}
            </ul>
          </>
        )}
        {!aiRow || misconceptions.length === 0 ? null : (
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
      </section>

      {focusNext.length > 0 && <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
        <p className="text-sm font-bold text-slate-800 flex flex-wrap items-center gap-1.5 mb-3"><MapIcon className="h-4 w-4 text-orange-500" /> แนวทางที่ควรทำต่อ <AiLabel model={aiRow?.model} /></p>
        <ol className="grid md:grid-cols-2 gap-3">
          {focusNext.map((item, index) => <li key={index} className={`flex gap-3 rounded-xl bg-orange-50/70 border border-orange-100 p-4 ${focusNext.length % 2 === 1 && index === focusNext.length - 1 ? "md:col-span-2" : ""}`}>
            <span className="shrink-0 h-7 w-7 rounded-lg bg-orange-500 text-white text-sm font-bold flex items-center justify-center">{index + 1}</span>
            <div className="min-w-0"><p className="text-sm font-semibold text-slate-800 leading-relaxed break-words">{typeof item === "string" ? item : item.action}</p>{typeof item !== "string" && item.why && <p className="text-xs text-slate-500 leading-relaxed mt-1 break-words">{item.why}</p>}</div>
          </li>)}
        </ol>
      </section>}
    </div>
  );
}
