import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { Check, AlertCircle, Clock, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { fmtScore, displayExamPercent } from "../utils/examScore";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";
import {
  getCurrentUserId, formatTime,
  fetchExamByToken, startExam, saveAnswer, submitExam,
  logQuestionEnter, logQuestionLeave, logIntegrityEvent,
  markExamActive, clearExamActive,
} from "../utils/studentExamShared";
import { PAGE_TITLE } from "../components/ui/tokens";
import Breadcrumb from "../components/ui/Breadcrumb";
import ExamMathText from "../components/ExamMathText";
import { Sprout as LuSprout } from "lucide-react";
import { BTN } from "../components/ui/tokens";

const OPTION_LABELS = ["A", "B", "C", "D"];

// ─── Shared page shell ───────────────────────────────────────────────────────
function PageShell({ maxWidth = "max-w-md", align = "center", children }) {
  // เผื่อความสูง navbar ที่ fixed อยู่ (~90px) + ระยะหายใจ ถ้าไม่เว้นไว้
  // การ์ดที่เนื้อหายาวจะถูกจัดกึ่งกลางจนลอยขึ้นไปชิด/ทับ navbar
  // โหมดกึ่งกลาง (หน้าเริ่มสอบ) เว้นมากกว่า เพราะการ์ดสั้นกว่าจึงลอยขึ้นไปชิดง่ายกว่า
  return (
    <div className={`min-h-[calc(100vh-6rem)] flex ${align === "start" ? "items-start pt-[110px]" : "items-center pt-[128px]"} justify-center px-4 pb-12`}>
      <div className={`w-full ${maxWidth} ${align === "start" ? "mt-8" : ""}`}>
        {children}
      </div>
    </div>
  );
}

// ─── Loading skeleton ────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <PageShell maxWidth="max-w-md">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 text-center space-y-4 animate-pulse">
        <div className="h-5 w-2/3 bg-slate-200 rounded mx-auto" />
        <div className="flex justify-center gap-6">
          <div className="h-4 w-16 bg-slate-200 rounded" />
          <div className="h-4 w-10 bg-slate-200 rounded" />
        </div>
        <div className="h-11 w-full bg-slate-200 rounded-xl" />
      </div>
    </PageShell>
  );
}

// ─── Landing screen (before starting / resuming) ────────────────────────────

// ─── น้องหมาโกลเด้นประจำหน้าเริ่มสอบ ────────────────────────────────────────
// วาดเป็น SVG ในตัว ไม่ต้องโหลดรูปจากที่ไหน ไม่เพิ่ม dependency และไม่ถ่วงเวลาโหลดหน้า
function GoldenRetriever({ className = "" }) {
  return (
    <svg viewBox="0 0 120 116" className={className} role="img" aria-label="น้องหมาโกลเด้นยิ้มทักทาย">
      {/* หูตกสองข้าง */}
      <ellipse cx="26" cy="62" rx="15" ry="26" fill="#C9873A" />
      <ellipse cx="94" cy="62" rx="15" ry="26" fill="#C9873A" />
      {/* หัว */}
      <ellipse cx="60" cy="54" rx="37" ry="34" fill="#EFB05C" />
      {/* ขนกระหม่อมสีอ่อน */}
      <ellipse cx="60" cy="38" rx="27" ry="17" fill="#F6C57E" />
      {/* ปากกระบอก */}
      <ellipse cx="60" cy="74" rx="22" ry="17" fill="#FCEBD0" />
      {/* ตา */}
      <ellipse cx="46" cy="50" rx="5" ry="5.8" fill="#4A3418" />
      <ellipse cx="74" cy="50" rx="5" ry="5.8" fill="#4A3418" />
      <circle cx="47.8" cy="47.8" r="1.8" fill="#ffffff" />
      <circle cx="75.8" cy="47.8" r="1.8" fill="#ffffff" />
      {/* แก้มแดงจาง */}
      <ellipse cx="33" cy="63" rx="6" ry="4" fill="#F2A98F" opacity="0.5" />
      <ellipse cx="87" cy="63" rx="6" ry="4" fill="#F2A98F" opacity="0.5" />
      {/* ลิ้น (วาดก่อนเส้นปาก เพื่อให้เส้นปากทับด้านบน) */}
      <path d="M52 79 q8 12 16 0 z" fill="#F28B8B" />
      {/* จมูกและปากยิ้ม */}
      <ellipse cx="60" cy="67" rx="7" ry="5.2" fill="#4A3418" />
      <path d="M60 72 v4" stroke="#4A3418" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M60 76 q-7 6 -13 1" stroke="#4A3418" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M60 76 q7 6 13 1" stroke="#4A3418" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function LandingCard({ status, exam, onStart, starting }) {
  const startDisabled = starting;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center space-y-5">
      <GoldenRetriever className="h-24 w-24 mx-auto" />

      <div className="space-y-2">
        <h1 className={`${PAGE_TITLE}`}>{exam.name}</h1>
        <div className="flex justify-center gap-7 text-base text-slate-600">
          <div className="flex items-center gap-2"><Clock className="h-5 w-5 text-slate-400" />{exam.duration} นาที</div>
          <div>{exam.totalQuestions} ข้อ</div>
        </div>
      </div>

      {status === "in-progress" && (
        <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">คุณเข้าสอบชุดนี้ไปแล้ว กดปุ่มด้านล่างเพื่อทำต่อจากเดิม</p>
        </div>
      )}

      {/* ข้อความก่อนเริ่มสอบ — ลดแรงกดดัน และอธิบายว่าทำไมการตอบตามความเข้าใจจริง
          เป็นผลดีกับตัวนักเรียนเอง ตั้งใจไม่ใช้ bullet เพราะอ่านเหมือนระเบียบข้อบังคับ */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left space-y-3.5">
        <p className="text-lg font-bold text-slate-700 text-center">อ่านสักครู่ก่อนเริ่มนะ</p>
        <p className="text-base text-slate-600 leading-relaxed">
          ข้อสอบชุดนี้ไม่ได้เอาไปตัดเกรด จัดอันดับ หรือตัดสินอะไรทั้งนั้น หน้าที่เดียวของมันคือบอกว่าตอนนี้เธอเข้าใจเรื่องไหนแล้ว และเรื่องไหนที่ติวเตอร์ควรช่วยเพิ่ม
        </p>
        <p className="text-base text-slate-600 leading-relaxed">
          ตอบไปตามที่เข้าใจจริงเลย ยิ่งตรงกับความเข้าใจของเธอมากเท่าไหร่ ติวเตอร์ก็ยิ่งช่วยได้ตรงจุดเท่านั้น และรอบหน้าเธอจะเห็นพัฒนาการของตัวเองชัดขึ้นด้วย
        </p>
        <p className="text-lg font-bold text-orange-600 text-center pt-0.5">“ทำเท่าที่ทำได้ เต็มที่ของวันนี้ก็พอแล้ว”</p>
      </div>

      <button
        onClick={onStart}
        disabled={startDisabled}
        className={`${BTN.primary} w-full disabled:opacity-50 rounded-2xl py-4 text-base font-semibold transition`}
      >
        {starting
          ? "กำลังเข้าสู่ห้องสอบ…"
          : status === "in-progress"
          ? "ทำข้อสอบต่อ"
          : "เริ่มทำข้อสอบ"}
      </button>
    </div>
  );
}

// ─── Empty questions guard ───────────────────────────────────────────────────

function NoQuestionsNotice() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 text-center space-y-3">
      <AlertCircle className="h-10 w-10 text-amber-400 mx-auto" />
      <p className="text-sm font-semibold text-slate-700">ไม่พบข้อสอบสำหรับการสอบนี้</p>
      <p className="text-xs text-slate-500">กรุณาติดต่อผู้สอนของคุณ</p>
    </div>
  );
}

// ─── Taking the exam ─────────────────────────────────────────────────────────

// คำตอบที่ autosave ไม่สำเร็จ เก็บสำรองในเบราว์เซอร์ด้วย — รีเฟรช/ปิดแท็บแล้วกลับมา
// จะเติมคำตอบคืนและส่งขึ้นเซิร์ฟเวอร์ให้อัตโนมัติ (ไม่เก็บอย่างอื่นนอกจาก questionId → ตัวเลือก)
const unsavedKey = (examJoinId) => `exam-unsaved:${examJoinId}`;
function readUnsaved(examJoinId) {
  try {
    const raw = JSON.parse(localStorage.getItem(unsavedKey(examJoinId)) || "[]");
    return new Map(Array.isArray(raw) ? raw.filter(([q, v]) => q != null && Number.isInteger(v)) : []);
  } catch { return new Map(); }
}
function writeUnsaved(examJoinId, map) {
  try {
    if (map.size) localStorage.setItem(unsavedKey(examJoinId), JSON.stringify([...map]));
    else localStorage.removeItem(unsavedKey(examJoinId));
  } catch { /* เบราว์เซอร์ไม่ให้ใช้ storage — ยังมีสำเนาในหน่วยความจำ */ }
}

function ExamRunner({ examJoinId, userId, examStartedAt, durationMinutes, questions: initialQuestions, examBehaviorConsent, onSubmitted }) {
  const [questions, setQuestions] = useState(() => {
    const stored = readUnsaved(examJoinId);
    return stored.size ? initialQuestions.map((q) => (stored.has(q.id) ? { ...q, selected: stored.get(q.id) } : q)) : initialQuestions;
  });
  const [activeIdx, setActiveIdx] = useState(0);
  const [remainingSec, setRemainingSec] = useState(() => {
    // deadline is anchored to the tutor's session-open time (examStartedAt),
    // NOT each student's own JoinedAt — so everyone runs out at the same
    // wall-clock moment regardless of when they joined.
    const deadline = new Date(examStartedAt).getTime() + durationMinutes * 60 * 1000;
    return Math.max(0, Math.round((deadline - Date.now()) / 1000));
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [error, setError] = useState("");
  const submittedRef = useRef(false);
  const timingSessionRef = useRef(null);
  if (!timingSessionRef.current) timingSessionRef.current = crypto.randomUUID();
  const timingQueueRef = useRef(Promise.resolve());
  const timingCompleteRef = useRef(true);
  const currentVisitRef = useRef(null);
  const answerQueueRef = useRef(Promise.resolve());
  const unsavedAnswersRef = useRef(null);
  if (!unsavedAnswersRef.current) unsavedAnswersRef.current = readUnsaved(examJoinId);
  const persistUnsaved = useCallback(() => writeUnsaved(examJoinId, unsavedAnswersRef.current), [examJoinId]);
  // (แก้บั๊ก) ใช้แจ้งเตือนตอน autosave คำตอบล้มเหลว — ดูจุดแก้ที่ pickAnswer ด้านล่าง
  const { toasts, showToast, removeToast } = useToast();

  const current = questions[activeIdx];
  const answeredCount = questions.filter((q) => q.selected !== null && q.selected !== undefined).length;

  // Serialize transitions so a delayed enter cannot overtake the next question.
  // Each retry uses the same visit ID, making requests safe to repeat.
  const queueTiming = useCallback((operation) => {
    timingQueueRef.current = timingQueueRef.current.then(async () => {
      try { await operation(); }
      catch {
        try { await operation(); }
        catch { timingCompleteRef.current = false; }
      }
    });
    return timingQueueRef.current;
  }, []);

  const closeVisit = useCallback((keepalive = false) => {
    const visit = currentVisitRef.current;
    if (!visit) return timingQueueRef.current;
    currentVisitRef.current = null;
    // Capture before any network work: saving an answer must not add question time.
    const durationMs = Math.floor(performance.now() - visit.startedMono);
    const payload = { examJoinId: visit.examJoinId, questionId: visit.questionId, visitId: visit.visitId, sessionId: visit.sessionId };
    return queueTiming(() => logQuestionLeave({ ...payload, durationMs }, keepalive));
  }, [queueTiming]);

  const openVisit = useCallback((questionId) => {
    if (!questionId || examBehaviorConsent === false || submittedRef.current || document.hidden || currentVisitRef.current) return;
    const visit = { examJoinId, questionId, visitId: crypto.randomUUID(), sessionId: timingSessionRef.current };
    currentVisitRef.current = { ...visit, startedMono: performance.now() };
    queueTiming(() => logQuestionEnter(visit));
  }, [examJoinId, examBehaviorConsent, queueTiming]);

  // ติวเตอร์ปิดสอบ/หมดเวลา ระหว่างที่ยังทำอยู่ — server ส่งข้อสอบให้แล้ว (ตอบ 409)
  // ดึงคะแนนที่ส่งไว้มาแสดงแทนการเด้ง error
  const handleClosedByServer = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    try {
      const result = await submitExam(examJoinId, userId, { timingSessionId: timingSessionRef.current, timingComplete: false });
      unsavedAnswersRef.current.clear();
      persistUnsaved();
      onSubmitted({ ...result, closedByServer: true });
    } catch {
      submittedRef.current = false;
      setError("การสอบถูกปิดแล้ว กรุณารีเฟรชหน้าเพื่อดูคะแนน");
    }
  }, [examJoinId, userId, onSubmitted, persistUnsaved]);

  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    const closingVisit = closeVisit();
    try {
      // A last click must finish saving before the backend locks and grades the attempt.
      await answerQueueRef.current;
      for (const [questionId, selected] of unsavedAnswersRef.current) {
        try {
          await saveAnswer({ examJoinId, userId, questionId, selected });
        } catch (err) {
          // ถูกส่งไปแล้วฝั่ง server (ปิดสอบ/หมดเวลา) — ข้ามไปส่งเพื่อรับคะแนน
          if (err.response?.status !== 409) throw err;
        }
        unsavedAnswersRef.current.delete(questionId);
        persistUnsaved();
      }
      await closingVisit;
      const result = await submitExam(examJoinId, userId, {
        timingSessionId: timingSessionRef.current,
        timingComplete: examBehaviorConsent !== false && timingCompleteRef.current,
      });
      unsavedAnswersRef.current.clear();
      persistUnsaved();
      onSubmitted(result);
    } catch (err) {
      console.error("Submit failed:", err);
      setError("ส่งข้อสอบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      submittedRef.current = false;
      openVisit(current?.id);
    } finally {
      setSubmitting(false);
    }
  }, [examJoinId, userId, onSubmitted, examBehaviorConsent, closeVisit, openVisit, current?.id, persistUnsaved]);

  // Countdown — auto-submits the moment time runs out.
  useEffect(() => {
    if (questions.length === 0) return; // nothing to time if there's no exam content
    if (remainingSec <= 0) { doSubmit(); return; }
    const iv = setInterval(() => setRemainingSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(iv);
  }, [remainingSec, doSubmit, questions.length]);

  useEffect(() => {
    if (!current?.id || examBehaviorConsent === false) return;
    openVisit(current.id);
    const onVisibility = () => document.hidden ? closeVisit(true) : openVisit(current.id);
    const onPageHide = () => closeVisit(true);
    const onPageShow = () => openVisit(current.id);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
      closeVisit(true);
    };
  }, [current?.id, examBehaviorConsent, openVisit, closeVisit]);

  // ── ธงคุณภาพข้อมูล: บันทึกการออกจากหน้าสอบ และการคัดลอกข้อความ ──────────────
  // ไม่บล็อกอะไรทั้งสิ้น แค่บันทึกไว้ให้ติวเตอร์ประกอบการอ่านคะแนน (เบราว์เซอร์ไม่มีทางรู้ว่า
  // ออกไปเปิดอะไร รู้แค่ว่าออกไปนานเท่าไหร่) และทุก call ต้องเงียบเสมอ ห้ามทำให้การสอบสะดุด
  const hiddenAtRef = useRef(null);
  const currentQuestionIdRef = useRef(null);
  useEffect(() => { currentQuestionIdRef.current = current?.id ?? null; }, [current]);

  useEffect(() => {
    // PDPA: ไม่ยินยอม (สแนปช็อตตอนกดเข้าสอบรอบนี้) — ไม่แนบ listener เลย เท่ากับไม่มีการ
    // ยิง network call ใด ๆ ทั้งสิ้นฝั่งนี้ ไม่ใช่แค่ backend ปฏิเสธเงียบ ๆ
    if (examBehaviorConsent === false) return;

    const report = (eventType, extra = {}) => {
      if (submittedRef.current) return; // ส่งข้อสอบแล้วไม่ต้องเก็บอีก
      logIntegrityEvent({ examJoinId, eventType, questionId: currentQuestionIdRef.current, ...extra })
        .catch(() => { /* บันทึกไม่ได้ก็ปล่อยไป ห้ามรบกวนคนทำข้อสอบ */ });
    };

    const onVisibility = () => {
      if (document.hidden) { hiddenAtRef.current = Date.now(); return; }
      if (hiddenAtRef.current == null) return;
      const sec = Math.round((Date.now() - hiddenAtRef.current) / 1000);
      hiddenAtRef.current = null;
      // ต่ำกว่า 2 วินาทีถือเป็นสัญญาณรบกวน (เผลอคลิกออกแล้วคลิกกลับ) ไม่บันทึก
      if (sec >= 2) report("leave", { durationSec: sec });
    };

    const onCopy = () => report("copy");

    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("copy", onCopy);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("copy", onCopy);
    };
  }, [examJoinId, examBehaviorConsent]);

  // กลับมาหลังรีเฟรช/ปิดแท็บ: ส่งคำตอบที่ค้างไว้ขึ้นเซิร์ฟเวอร์อีกครั้ง
  useEffect(() => {
    const pending = [...unsavedAnswersRef.current];
    if (!pending.length) return;
    answerQueueRef.current = answerQueueRef.current.then(async () => {
      for (const [questionId, selected] of pending) {
        try {
          await saveAnswer({ examJoinId, userId, questionId, selected });
          if (unsavedAnswersRef.current.get(questionId) === selected) { unsavedAnswersRef.current.delete(questionId); persistUnsaved(); }
        } catch (err) {
          if (err.response?.status === 409) { handleClosedByServer(); return; }
          // ยังไม่ผ่าน — เก็บไว้ ระบบจะลองอีกครั้งตอนกดส่ง
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ยังมีคำตอบที่บันทึกไม่สำเร็จ แล้วจะปิด/รีเฟรชหน้า → ให้เบราว์เซอร์ถามยืนยันก่อน
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (submittedRef.current || !unsavedAnswersRef.current.size) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const pickAnswer = (optIdx) => {
    if (submittedRef.current) return;
    setQuestions((prev) => prev.map((q, i) => (i === activeIdx ? { ...q, selected: optIdx } : q)));
    const questionId = current.id;
    // Preserve answer order, including rapid changes to the same question.
    unsavedAnswersRef.current.set(questionId, optIdx);
    persistUnsaved();
    answerQueueRef.current = answerQueueRef.current.then(async () => {
      try {
        try { await saveAnswer({ examJoinId, userId, questionId, selected: optIdx }); }
        catch { await saveAnswer({ examJoinId, userId, questionId, selected: optIdx }); }
        if (unsavedAnswersRef.current.get(questionId) === optIdx) { unsavedAnswersRef.current.delete(questionId); persistUnsaved(); }
      } catch (err) {
        if (err.response?.status === 409) { handleClosedByServer(); return; }
        console.error("Autosave failed:", err);
        showToast?.("error", "บันทึกคำตอบไม่สำเร็จ", "ระบบจะลองบันทึกอีกครั้งก่อนส่งข้อสอบ");
      }
    });
  };

  // Guard: exam has no questions at all — show a clear message instead of
  // crashing on current.text (current would be undefined).
  if (questions.length === 0 || !current) {
    return <NoQuestionsNotice />;
  }

  const lowTime = remainingSec <= 60;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {/* ── ฝั่งซ้าย: เนื้อหาข้อสอบ ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-8 flex flex-col">
        {/* min-height keeps the Prev/Next/Submit row from jumping when
           question text length differs between questions */}
        <div className="min-h-[320px]">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-2 mb-5">
            <div className="flex min-w-0 items-baseline gap-3">
              <span className="text-2xl font-bold text-orange-500">{activeIdx + 1}.</span>
              {current.text && <p className="text-lg font-medium text-slate-900 leading-relaxed whitespace-pre-wrap break-words"><ExamMathText text={current.text} /></p>}
            </div>
            <span className="flex-shrink-0 text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              {fmtScore(current.score)} คะแนน
            </span>
          </div>
          {current.imagePath && <img src={current.imagePath} alt={`รูปประกอบโจทย์ข้อที่ ${activeIdx + 1}`} className="mb-5 max-h-[28rem] max-w-full rounded-xl border border-slate-200 object-contain" />}
          <div className="space-y-3">
            {OPTION_LABELS.map((label, optIdx) => {
              const isSelected = current.selected === optIdx;
              return (
                <button aria-label="ยืนยัน"
                  key={label}
                  onClick={() => pickAnswer(optIdx)}
                  className={`w-full flex items-center gap-3 sm:gap-4 px-3.5 sm:px-5 py-3.5 sm:py-4 rounded-2xl border-2 text-left transition ${isSelected ? "border-orange-400 bg-orange-50" : "border-slate-200 hover:border-orange-200"}`}
                >
                  <span className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${isSelected ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600"}`}>{label}</span>
                  <span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-base text-slate-800"><ExamMathText text={current.options?.[optIdx]} /></span>
                  {isSelected && <Check className="h-5 w-5 text-orange-600 ml-auto flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setActiveIdx((i) => Math.max(0, i - 1))} disabled={activeIdx === 0} className="flex items-center gap-1.5 text-sm sm:text-base text-slate-500 disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" /> ข้อก่อนหน้า
          </button>
          {activeIdx < questions.length - 1 ? (
            <button onClick={() => setActiveIdx((i) => Math.min(questions.length - 1, i + 1))} className="flex items-center gap-1.5 text-sm sm:text-base text-orange-600 font-semibold">
              ข้อถัดไป <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={() => setConfirmSubmit(true)} className={`${BTN.primary} rounded-xl px-5 sm:px-6 py-2.5 text-sm sm:text-base font-semibold`}>
              ส่งข้อสอบ
            </button>
          )}
        </div>

        {error && <p className="text-sm text-red-500 text-center mt-3">{error}</p>}
      </div>

      {/* ── ฝั่งขวา: ผังข้อสอบ (Question Map) ── */}
      {/* order-first ยกแผงเวลา/ความคืบหน้าขึ้นก่อนตัวข้อสอบบนมือถือ เพื่อไม่ต้องเลื่อนจอ
         ไปดูเวลาที่เหลือ ส่วนจอ lg+ กลับไปอยู่ลำดับปกติ (คอลัมน์ขวา, sticky) */}
      <div className="order-first lg:order-none bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4 lg:sticky lg:top-6">
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-2.5">ข้อสอบ</p>
          <div className="grid grid-cols-4 gap-1.5">
            {questions.map((q, i) => {
              const answered = q.selected !== null && q.selected !== undefined;
              const isActive = i === activeIdx;
              return (
                <button
                  key={q.id}
                  onClick={() => setActiveIdx(i)}
                  title={`ข้อ ${i + 1}${answered ? " (ตอบแล้ว)" : " (ยังไม่ตอบ)"}`}
                  className={`h-11 w-full rounded-lg text-sm font-semibold border-2 transition ${isActive
                      ? "border-orange-500 bg-orange-500 text-white"
                      : answered
                        ? "border-green-300 bg-green-50 text-green-700"
                        : "border-slate-200 text-slate-500"
                    }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3 space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-sm bg-green-300 border border-green-400 inline-block" /> ตอบแล้ว
            </span>
            <span className="font-semibold text-slate-700">{answeredCount}/{questions.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-sm bg-slate-100 border border-slate-300 inline-block" /> ยังไม่ตอบ
            </span>
            <span className="font-semibold text-slate-700">{questions.length - answeredCount}/{questions.length}</span>
          </div>
        </div>

        <div className={`border-t border-slate-100 pt-3 ${lowTime ? "text-red-600" : "text-slate-700"}`}>
          <p className="text-sm font-semibold text-slate-500 mb-1">เวลาที่เหลือ</p>
          <div className="flex items-center gap-2 font-mono font-bold text-xl">
            <Clock className="h-5 w-5" /> {formatTime(remainingSec)}
          </div>
        </div>
      </div>

      {confirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={() => setConfirmSubmit(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-sm w-full p-6 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="h-14 w-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3"><AlertCircle className="h-7 w-7 text-orange-600" /></div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">ยืนยันส่งข้อสอบ?</h2>
              <p className="text-sm text-slate-500">
                คุณตอบแล้ว {answeredCount}/{questions.length} ข้อ
                {answeredCount < questions.length && " — ข้อที่ไม่ได้ตอบจะได้ 0 คะแนน"}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmSubmit(false)} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-semibold text-slate-700">ตรวจทานอีกครั้ง</button>
              <button onClick={doSubmit} disabled={submitting} className={`${BTN.primary} flex-1 disabled:opacity-50 rounded-xl py-2.5 text-sm font-semibold`}>
                {submitting ? "กำลังส่ง…" : "ยืนยันส่ง"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Result screen ───────────────────────────────────────────────────────────
// ไม่แสดงเฉลยรายข้อให้นักเรียนแล้ว (กันเฉลยหลุดไปถึงเพื่อนที่ยังสอบอยู่ และไม่อยากให้เด็ก
// โฟกัสแค่ข้อที่ผิด) — เหลือแค่คะแนน + ข้อความให้กำลังใจที่ไม่ตัดสินจากคะแนน
const ENCOURAGEMENTS = [
  { title: "เก่งมากที่ทำจนจบ!", body: "คะแนนเป็นแค่ตัวเลขของวันนี้ ไม่ได้บอกว่าเราเก่งหรือไม่เก่ง สิ่งที่มีค่าที่สุดคือความตั้งใจที่เราใส่ลงไปในทุกข้อ" },
  { title: "ทุกข้อคือการเรียนรู้", body: "ข้อที่ยังไม่ถูก คือเรื่องที่เรากำลังจะเข้าใจมากขึ้น ครูจะช่วยทบทวนไปด้วยกันนะ ไม่ต้องกังวลเลย" },
  { title: "ขอบคุณที่พยายามเต็มที่", body: "เก่งขึ้นทีละนิดทุกวันก็ดีมากแล้ว ไม่จำเป็นต้องเปรียบเทียบกับใคร ขอแค่วันนี้เราดีกว่าเมื่อวาน" },
  { title: "ภูมิใจในตัวเองได้เลย", body: "คะแนนมากหรือน้อยไม่ได้บอกว่าเราเป็นคนแบบไหน ความพยายามของเราวันนี้คือสิ่งที่พาเราไปได้ไกล" },
  { title: "พักสมองสักหน่อยนะ", body: "ทำข้อสอบมาเหนื่อยแล้ว ให้รางวัลตัวเองสักนิด แล้วเรามาเรียนรู้ต่อไปด้วยกัน ครูเชื่อในตัวเราเสมอ" },
];

function ResultCard({ result }) {
  const pct = displayExamPercent(result.totalScore, result.maxScore) ?? result.percentage ?? 0;
  // สุ่มครั้งเดียวตอน mount — ไม่ผูกกับคะแนน ข้อความจึงไม่ "ตัดสิน" ว่าคะแนนดีหรือไม่ดี
  const [msg] = useState(() => ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);

  return (
    <div className="space-y-4 pt-0">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 text-center space-y-4">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
        <h1 className="text-lg font-bold text-slate-900">ส่งข้อสอบเรียบร้อยแล้ว</h1>
        {result.closedByServer && <p className="text-sm text-slate-500">ติวเตอร์ปิดการสอบแล้ว ระบบส่งข้อสอบให้ด้วยคำตอบที่บันทึกไว้</p>}
        <div className="bg-slate-50 rounded-xl p-5">
          <p className="text-sm text-slate-500 mb-1">คะแนนสอบรอบนี้</p>
          <p className="text-3xl font-bold text-orange-600">
            {fmtScore(result.totalScore)}/{fmtScore(result.maxScore)} <span className="text-sm">คะแนน</span>
          </p>
          <p className="text-sm text-slate-500 mt-1">{pct}% ของคะแนนเต็ม</p>
        </div>
        {result.correctCount != null && (
          <p className="text-sm text-slate-500">ตอบถูก {result.correctCount}/{result.totalQuestions} ข้อ</p>
        )}
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-left flex gap-3">
          <LuSprout className="h-6 w-6 shrink-0 text-emerald-500" />
          <div>
            <p className="text-sm font-bold text-orange-700 mb-1">{msg.title}</p>
            <p className="text-sm text-orange-800/90 leading-relaxed">{msg.body}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Breadcrumb ของหน้าสอบ ──────────────────────────────────────────────────
// backend ไม่ได้ส่งคอร์ส/วิชามากับลิงก์สอบ จึงอ่านจาก route state ที่หน้าต้นทาง
// (คอร์สเรียนของฉัน / หน้ารายวิชา) แนบมา ถ้าเปิดลิงก์ตรง ๆ จะเหลือแค่ชั้นที่รู้แน่
function ExamBreadcrumb({ from, examName }) {
  const items = [
    { label: "หน้าแรก", to: "/" },
    { label: "คอร์สเรียนของฉัน", to: "/profile/my-courses" },
  ];
  if (from?.courseId && from?.courseName) {
    items.push({ label: from.courseName, to: `/profile/course/${from.courseId}/subjects` });
  }
  if (from?.courseId && from?.subjectId) {
    items.push({
      label: from.subjectName || "รายวิชา",
      to: `/profile/course/${from.courseId}/subject/${from.subjectId}`,
      state: { tab: "exam" }, // กลับไปแล้วเปิดแท็บ "ข้อสอบ" ของวิชานั้น
    });
  }
  items.push({ label: examName || "ข้อสอบ" });
  return <Breadcrumb className="mb-4" items={items} />;
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function StudentExam() {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const cameFrom = location.state?.from || null;
  const userId = getCurrentUserId();
  const [examName, setExamName] = useState("");

  const [phase, setPhase] = useState("loading"); // loading | landing | running | result | error
  const [landing, setLanding] = useState(null);
  const [runData, setRunData] = useState(null);
  const [result, setResult] = useState(null);
  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!userId || !localStorage.getItem("student_token") || localStorage.getItem("user_role") !== "student") {
      navigate(`/login?${new URLSearchParams({ returnTo: `/exam/${encodeURIComponent(token)}` })}`, { replace: true });
      return;
    }
    let cancelled = false;
    setPhase("loading");
    fetchExamByToken(token, userId)
      .then((data) => {
        if (cancelled) return;
        setExamName(data.exam?.name || "");
        if (data.status === "submitted") {
          clearExamActive(); // เผื่อธงค้างจากรอบก่อน (เช่น backend บังคับส่งตอนหมดเวลา)
          setResult(data.result);
          setPhase("result");
        } else {
          setLanding(data);
          setPhase("landing");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.response?.status === 401) {
          navigate(`/login?${new URLSearchParams({ returnTo: `/exam/${encodeURIComponent(token)}` })}`, { replace: true });
          return;
        }
        setErrorMsg(err.response?.data?.message || "ไม่สามารถเข้าสอบได้");
        setPhase("error");
      });
    return () => { cancelled = true; };
  }, [token, userId, navigate, reloadKey]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const data = await startExam(token, userId);
      // ปักธงว่า "ยังสอบค้างอยู่" — ใช้ซ่อนแชตบอตทั่วทั้งเว็บจนกว่าจะกดส่ง
      markExamActive({
        examJoinId: data.examJoinId,
        deadlineAt: data.examStartedAt && data.durationMinutes != null
          ? new Date(new Date(data.examStartedAt).getTime() + data.durationMinutes * 60 * 1000).toISOString()
          : null,
      });
      setRunData(data);
      setPhase("running");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "เริ่มสอบไม่สำเร็จ");
      setPhase("error");
    } finally {
      setStarting(false);
    }
  };

  const handleSubmitted = (submitResult) => {
    clearExamActive(); // ส่งข้อสอบแล้ว — ปลดล็อกแชตบอตทั้งเว็บ
    setResult(submitResult);
    setPhase("result");
    // (ตัดเฉลยรายข้อออกแล้ว) ไม่ต้องดึง GET /result มาเติมอีก — คะแนนจาก submit ครบแล้ว
  };

  if (phase === "loading") {
    return <LoadingSkeleton />;
  }
  if (phase === "error") {
    return (
      <PageShell maxWidth="max-w-md">
        <ExamBreadcrumb from={cameFrom} examName={examName} />
        <div className="text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
          <p className="text-sm text-slate-600">{errorMsg}</p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button type="button" onClick={() => setReloadKey((k) => k + 1)}
              className={`${BTN.primary} rounded-xl px-4 py-2 text-sm font-semibold`}>ลองใหม่</button>
            <button type="button"
              onClick={() => navigate(cameFrom?.courseId && cameFrom?.subjectId
                ? `/profile/course/${cameFrom.courseId}/subject/${cameFrom.subjectId}`
                : "/profile/my-courses", cameFrom?.subjectId ? { state: { tab: "exam" } } : undefined)}
              className={`${BTN.secondary} rounded-xl px-4 py-2 text-sm font-semibold`}>
              {cameFrom?.subjectId ? "กลับไปหน้ารายวิชา" : "กลับไปคอร์สเรียนของฉัน"}
            </button>
          </div>
        </div>
      </PageShell>
    );
  }
  if (phase === "landing") {
    return (
      <PageShell maxWidth="max-w-2xl">
        <ExamBreadcrumb from={cameFrom} examName={examName} />
        <LandingCard
          status={landing.status}
          exam={landing.exam}
          onStart={handleStart}
          starting={starting}
        />
      </PageShell>
    );
  }
  // ระหว่างทำข้อสอบ (running) ตั้งใจไม่แสดง breadcrumb — ไม่อยากให้มีลิงก์ชวนกดออก
  // กลางคัน (นาฬิกายังเดินต่อฝั่ง server แม้ออกไป) และให้หน้าจอโฟกัสที่ข้อสอบอย่างเดียว
  // จะกลับมาแสดงอีกครั้งหลังส่งข้อสอบแล้ว
  if (phase === "running") {
    return (
      <PageShell maxWidth="max-w-4xl" align="start">
        <ExamRunner
          examJoinId={runData.examJoinId}
          userId={userId}
          examStartedAt={runData.examStartedAt}
          durationMinutes={runData.durationMinutes}
          questions={runData.questions}
          examBehaviorConsent={runData.examBehaviorConsent}
          onSubmitted={handleSubmitted}
        />
      </PageShell>
    );
  }
  if (phase === "result") {
    return (
      <PageShell maxWidth="max-w-4xl" align="start">
        <ExamBreadcrumb from={cameFrom} examName={examName} />
        <ResultCard result={result} />
      </PageShell>
    );
  }
  return null;
}
