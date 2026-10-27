import { useEffect, useState } from "react";
import { ListChecks, Info } from "lucide-react";
import ExamMathText from "../ExamMathText";

// สถิติรายข้อของทั้งห้อง — ข้อไหนห้องผิดเยอะ และตัวเลือกผิดตัวไหนถูกเลือกบ่อย
// คำนวณจากคำตอบจริงที่ backend (ไม่ใช้ AI) ใช้ร่วมกันทั้งหน้าติวเตอร์และแอดมิน
// ฝั่งแอดมิน backend ตัดเนื้อหาข้อสอบออกแล้ว (contentHidden) จึงแสดงเฉพาะเลขข้อ/หมวด/ตัวเลข
const SHOW = 6;

export default function ItemAnalysisCard({ api, examId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!api?.fetchItemAnalysis || !examId) return undefined;
    let cancelled = false;
    setData(null); setError(false);
    api.fetchItemAnalysis(examId)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [api, examId]);

  if (!api?.fetchItemAnalysis || !examId) return null;

  const items = (data?.items || []).filter((it) => it.studentCount > 0).sort((a, b) => a.correctPct - b.correctPct || a.no - b.no);
  const hard = items.filter((it) => it.correctPct < 50);
  const shown = showAll ? items : items.slice(0, SHOW);

  return (
    <section className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><ListChecks className="h-4 w-4 text-orange-500" /> สถิติรายข้อของห้อง</h3>
        <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">คำนวณจากคำตอบจริง ไม่ใช้ AI</span>
      </div>
      {error ? (
        <p className="text-sm text-slate-500">โหลดสถิติรายข้อไม่สำเร็จ</p>
      ) : !data ? (
        <div className="h-24 animate-pulse rounded-xl bg-slate-50" aria-hidden="true" />
      ) : data.eligibleCount === 0 ? (
        <p className="flex items-start gap-2 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-slate-600">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
          {data.submittedCount === 0 ? "ยังไม่มีนักเรียนส่งข้อสอบรอบนี้" : "ยังไม่มีข้อมูลสำหรับสถิติห้อง — ผู้ส่งข้อสอบทุกคนไม่ได้ยินยอมให้นำผลไปรวมกับสถิติของห้อง (ดูผลรายคนได้ตามปกติ)"}
        </p>
      ) : (
        <>
          <p className="text-xs text-slate-500 mb-3">
            จากนักเรียน {data.eligibleCount} คน{data.excludedCount > 0 ? ` (ไม่นับ ${data.excludedCount} คนที่ไม่ยินยอมให้รวมสถิติห้อง)` : ""} · เรียงจากข้อที่ตอบถูกน้อยที่สุด
            {hard.length > 0 && <> · <b className="text-rose-600">{hard.length} ข้อ</b> ที่ห้องตอบถูกไม่ถึงครึ่ง</>}
          </p>
          <ul className="space-y-2">
            {shown.map((it) => {
              const tone = it.correctPct < 50 ? "bg-rose-500" : it.correctPct < 70 ? "bg-orange-400" : "bg-green-500";
              const top = it.topWrongChoice;
              return (
                <li key={it.questionId} className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-slate-800 min-w-0 flex-1 break-words">
                      <b className="mr-1.5">ข้อ {it.no}</b>
                      {it.contentHidden ? <span className="text-slate-500">{it.category || "ไม่ระบุหมวด"}</span> : (it.text ? <ExamMathText text={it.text} /> : it.hasImage ? "โจทย์เป็นรูปภาพ" : "")}
                    </p>
                    <span className="shrink-0 text-xs font-bold tabular-nums text-slate-700">ถูก {it.correctCount}/{it.studentCount}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-slate-200 overflow-hidden" aria-hidden="true"><div className={`h-full ${tone}`} style={{ width: `${Math.max(2, it.correctPct)}%` }} /></div>
                  {top && top.count >= 2 && (
                    <p className="mt-1.5 text-xs text-slate-600">
                      {it.contentHidden
                        ? <>นักเรียน {top.count} คนเลือกตัวเลือกผิดตัวเดียวกัน</>
                        : <>ตัวเลือกผิดที่เลือกบ่อย: <b className="text-rose-600"><ExamMathText text={String(top.text ?? "")} /></b> ({top.count} คน) · เฉลย <b className="text-green-700"><ExamMathText text={String(it.correctText ?? "")} /></b></>}
                    </p>
                  )}
                  {it.unansweredCount > 0 && <p className="mt-1 text-[11px] text-slate-500">ไม่ได้ตอบ {it.unansweredCount} คน</p>}
                </li>
              );
            })}
          </ul>
          {items.length > SHOW && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-3 text-xs font-semibold text-orange-600 hover:text-orange-700">
              {showAll ? "แสดงน้อยลง" : `ดูทั้งหมด ${items.length} ข้อ`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
