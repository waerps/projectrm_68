import { useEffect, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import ExamMathText from "../ExamMathText";

// คำตอบรายข้อของนักเรียนหนึ่งคน: เลือกตัวไหน เฉลยคืออะไร ถูกหรือผิด และผิดซ้ำจากรอบก่อน
// วางคู่กับคำแนะนำของ AI เพื่อให้เห็นว่า AI อ้างอิงจากตัวเลือกที่เด็กตอบจริง
// ฝั่งติวเตอร์เห็นข้อความตัวเลือก ฝั่งแอดมิน backend ตัดเนื้อหาออก (contentHidden) จึงเห็นแค่ตัวอักษร A–D
const L = ["A", "B", "C", "D"];

export default function AnswerSheetCard({ api, exam }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const examId = exam?.examRealId;
  const examJoinId = exam?.examJoinId;

  useEffect(() => {
    if (!open || !api?.fetchAnswerSheet || !examId || !examJoinId) return undefined;
    let cancelled = false;
    setData(null); setError(false);
    api.fetchAnswerSheet(examId, examJoinId)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [open, api, examId, examJoinId]);

  if (!api?.fetchAnswerSheet || !exam?.submitted || !examId || !examJoinId) return null;
  const qs = data?.questions || [];
  const wrong = qs.filter((q) => !q.isCorrect);
  const repeat = qs.filter((q) => q.repeatWrong?.length);

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex flex-wrap items-center justify-between gap-2 text-left">
        <span className="text-base font-bold text-slate-900 flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-orange-500" /> คำตอบรายข้อ · {exam.label}</span>
        <span className="text-xs font-semibold text-orange-600">{open ? "ซ่อน ▲" : "ดูว่าเลือกตัวเลือกไหน ▼"}</span>
      </button>
      {open && (
        <div className="mt-3">
          <p className="text-[11px] text-slate-500 mb-3">ใช้ตรวจคำแนะนำของ AI ได้ — AI อธิบายจากตัวเลือกที่นักเรียนเลือกจริงในแต่ละข้อ{data?.contentHidden ? " · แอดมินเห็นเฉพาะตัวอักษรตัวเลือก ไม่เห็นโจทย์ (คลังข้อสอบเป็นของติวเตอร์)" : ""}</p>
          {error ? <p className="text-sm text-slate-500">โหลดคำตอบรายข้อไม่สำเร็จ</p>
            : !data ? <div className="h-24 animate-pulse rounded-xl bg-slate-50" aria-hidden="true" />
            : (
              <>
                <p className="text-xs text-slate-600 mb-2">ผิด {wrong.length} ข้อ{repeat.length ? ` · ผิดซ้ำจากรอบก่อน ${repeat.length} ข้อ` : ""}</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="text-left text-slate-500 border-b border-slate-100">
                      <th className="py-1.5 pr-2">ข้อ</th><th className="py-1.5 pr-2">หมวด</th><th className="py-1.5 pr-2">เลือก</th><th className="py-1.5 pr-2">เฉลย</th><th className="py-1.5">หมายเหตุ</th>
                    </tr></thead>
                    <tbody>
                      {qs.map((q) => (
                        <tr key={q.no} className={`border-b border-slate-50 align-top ${q.isCorrect ? "" : "bg-rose-50/50"}`}>
                          <td className="py-1.5 pr-2 font-bold tabular-nums">{q.no}</td>
                          <td className="py-1.5 pr-2 text-slate-600">{q.category || "—"}</td>
                          <td className={`py-1.5 pr-2 font-semibold ${q.isCorrect ? "text-green-700" : "text-rose-600"}`}>
                            {q.selectedLetter ? <>{q.isCorrect ? "✓ " : "✗ "}{q.selectedLetter}{q.selectedText != null && <span className="font-normal"> · <ExamMathText text={String(q.selectedText)} /></span>}</> : <span className="text-slate-400">ไม่ได้ตอบ</span>}
                          </td>
                          <td className="py-1.5 pr-2 text-green-700">{q.correctLetter || "—"}{q.correctText != null && !q.isCorrect && <span> · <ExamMathText text={String(q.correctText)} /></span>}</td>
                          <td className="py-1.5 text-amber-800">{q.repeatWrong?.length ? `ผิดซ้ำจาก ${q.repeatWrong.map((r) => r.round).join(", ")}${q.repeatWrong.some((r) => r.selectedLetter && r.selectedLetter === q.selectedLetter) ? " · เลือกตัวเดิม" : ""}` : ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
        </div>
      )}
    </section>
  );
}
