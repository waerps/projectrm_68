import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { Check, AlertCircle, Clock, ChevronLeft, ChevronRight, CheckCircle2, X } from "lucide-react";
import {
  getCurrentUserId, formatTime,
  fetchExamByToken, startExam, saveAnswer, submitExam, fetchExamResult,
  logQuestionEnter,
} from "../utils/studentExamShared";

const OPTION_LABELS = ["A", "B", "C", "D"];

// ─── Shared page shell ───────────────────────────────────────────────────────
function PageShell({ maxWidth = "max-w-md", align = "center", children }) {
  return (
    <div className={`min-h-[calc(100vh-6rem)] flex ${align === "start" ? "items-start" : "items-center"} justify-center px-4 py-12`}>
      <div className={`w-full ${maxWidth} ${align === "start" ? "mt-36" : ""}`}>
        {children}
      </div>
    </div>
  );
}

// ─── Loading skeleton ────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <PageShell maxWidth="max-w-md">
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 text-center space-y-4 animate-pulse">
        <div className="h-5 w-2/3 bg-neutral-200 rounded mx-auto" />
        <div className="flex justify-center gap-6">
          <div className="h-4 w-16 bg-neutral-200 rounded" />
          <div className="h-4 w-10 bg-neutral-200 rounded" />
        </div>
        <div className="h-11 w-full bg-neutral-200 rounded-xl" />
      </div>
    </PageShell>
  );
}

// ─── Landing screen (before starting / resuming) ────────────────────────────

function LandingCard({ status, exam, onStart, starting }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6 text-center space-y-4">
      <h1 className="text-lg font-bold text-neutral-900">{exam.name}</h1>
      <div className="flex justify-center gap-6 text-sm text-neutral-600">
        <div className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-neutral-400" />{exam.duration} นาที</div>
        <div>{exam.totalQuestions} ข้อ</div>
      </div>
      {status === "in-progress" && (
        <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
          <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">คุณเข้าสอบชุดนี้ไปแล้ว กดปุ่มด้านล่างเพื่อทำต่อจากเดิม</p>
        </div>
      )}
      <button
        onClick={onStart}
        disabled={starting}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl py-3 text-sm font-semibold transition"
      >
        {starting ? "กำลังเข้าสู่ห้องสอบ…" : status === "in-progress" ? "ทำข้อสอบต่อ" : "เริ่มทำข้อสอบ"}
      </button>
    </div>
  );
}

// ─── Empty questions guard ───────────────────────────────────────────────────

function NoQuestionsNotice() {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6 text-center space-y-3">
      <AlertCircle className="h-10 w-10 text-amber-400 mx-auto" />
      <p className="text-sm font-semibold text-neutral-700">ไม่พบข้อสอบสำหรับการสอบนี้</p>
      <p className="text-xs text-neutral-400">กรุณาติดต่อผู้สอนของคุณ</p>
    </div>
  );
}

// ─── Taking the exam ─────────────────────────────────────────────────────────

function ExamRunner({ examJoinId, userId, examStartedAt, durationMinutes, questions: initialQuestions, onSubmitted }) {
  const [questions, setQuestions] = useState(initialQuestions);
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
  const didInitialLog = useRef(false); // ข้อแรกถูก log ไว้แล้วตอน /start ที่ backend

  const current = questions[activeIdx];
  const answeredCount = questions.filter((q) => q.selected !== null && q.selected !== undefined).length;

  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const result = await submitExam(examJoinId, userId);
      onSubmitted(result);
    } catch (err) {
      console.error("Submit failed:", err);
      setError("ส่งข้อสอบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [examJoinId, userId, onSubmitted]);

  // Countdown — auto-submits the moment time runs out.
  useEffect(() => {
    if (questions.length === 0) return; // nothing to time if there's no exam content
    if (remainingSec <= 0) { doSubmit(); return; }
    const iv = setInterval(() => setRemainingSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(iv);
  }, [remainingSec, doSubmit, questions.length]);

  useEffect(() => {
    if (!current) return;
    if (!didInitialLog.current) {
      // ข้อแรก (activeIdx=0 ตอน mount) backend เปิด log ให้แล้วตอน /start — ข้ามรอบนี้ไป
      didInitialLog.current = true;
      return;
    }
    logQuestionEnter({ examJoinId, userId, questionId: current.id }).catch((err) => {
      console.error('log enter failed:', err);
    });
  }, [activeIdx, current, examJoinId, userId]);

  const pickAnswer = (optIdx) => {
    setQuestions((prev) => prev.map((q, i) => (i === activeIdx ? { ...q, selected: optIdx } : q)));
    saveAnswer({ examJoinId, userId, questionId: current.id, selected: optIdx }).catch((err) => {
      console.error("Autosave failed:", err);
    });
  };

  // Guard: exam has no questions at all — show a clear message instead of
  // crashing on current.text (current would be undefined).
  if (questions.length === 0 || !current) {
    return <NoQuestionsNotice />;
  }

  const lowTime = remainingSec <= 60;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 items-start">
      {/* ── ฝั่งซ้าย: เนื้อหาข้อสอบ ── */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 flex flex-col">
        {/* min-height keeps the Prev/Next/Submit row from jumping when
           question text length differs between questions */}
        <div className="min-h-[280px]">
          <div className="flex items-baseline justify-between gap-3 mb-5">
            <div className="flex items-baseline gap-3">
              <span className="text-lg font-black text-orange-500">{activeIdx + 1}.</span>
              <p className="text-base font-medium text-neutral-900 leading-relaxed">{current.text}</p>
            </div>
            <span className="flex-shrink-0 text-xs font-semibold text-neutral-400 bg-neutral-100 px-2.5 py-1 rounded-full">
              {current.score} คะแนน
            </span>
          </div>
          <div className="space-y-2.5">
            {OPTION_LABELS.map((label, optIdx) => {
              const isSelected = current.selected === optIdx;
              return (
                <button
                  key={label}
                  onClick={() => pickAnswer(optIdx)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition ${isSelected ? "border-orange-400 bg-orange-50" : "border-neutral-200 hover:border-orange-200"}`}
                >
                  <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${isSelected ? "bg-orange-500 text-white" : "bg-neutral-100 text-neutral-600"}`}>{label}</span>
                  <span className="text-sm text-neutral-800">{current.options?.[optIdx]}</span>
                  {isSelected && <Check className="h-4 w-4 text-orange-600 ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-100">
          <button onClick={() => setActiveIdx((i) => Math.max(0, i - 1))} disabled={activeIdx === 0} className="flex items-center gap-1 text-sm text-neutral-500 disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" /> ข้อก่อนหน้า
          </button>
          {activeIdx < questions.length - 1 ? (
            <button onClick={() => setActiveIdx((i) => Math.min(questions.length - 1, i + 1))} className="flex items-center gap-1 text-sm text-orange-600 font-semibold">
              ข้อถัดไป <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={() => setConfirmSubmit(true)} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-5 py-2 text-sm font-semibold">
              ส่งข้อสอบ
            </button>
          )}
        </div>

        {error && <p className="text-sm text-red-500 text-center mt-3">{error}</p>}
      </div>

      {/* ── ฝั่งขวา: ผังข้อสอบ (Question Map) ── */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-4 lg:sticky lg:top-4">
        <div>
          <p className="text-xs font-semibold text-neutral-500 mb-2">ข้อสอบ</p>
          <div className="grid grid-cols-4 gap-1.5">
            {questions.map((q, i) => {
              const answered = q.selected !== null && q.selected !== undefined;
              const isActive = i === activeIdx;
              return (
                <button
                  key={q.id}
                  onClick={() => setActiveIdx(i)}
                  title={`ข้อ ${i + 1}${answered ? " (ตอบแล้ว)" : " (ยังไม่ตอบ)"}`}
                  className={`h-9 w-full rounded-lg text-xs font-semibold border-2 transition ${isActive
                      ? "border-orange-500 bg-orange-500 text-white"
                      : answered
                        ? "border-green-300 bg-green-50 text-green-700"
                        : "border-neutral-200 text-neutral-500"
                    }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-neutral-100 pt-3 space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-neutral-600">
              <span className="h-2.5 w-2.5 rounded-sm bg-green-300 border border-green-400 inline-block" /> ตอบแล้ว
            </span>
            <span className="font-semibold text-neutral-700">{answeredCount}/{questions.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-neutral-600">
              <span className="h-2.5 w-2.5 rounded-sm bg-neutral-100 border border-neutral-300 inline-block" /> ยังไม่ตอบ
            </span>
            <span className="font-semibold text-neutral-700">{questions.length - answeredCount}/{questions.length}</span>
          </div>
        </div>

        <div className={`border-t border-neutral-100 pt-3 ${lowTime ? "text-red-600" : "text-neutral-700"}`}>
          <p className="text-xs font-semibold text-neutral-500 mb-1">เวลาที่เหลือ</p>
          <div className="flex items-center gap-1.5 font-mono font-bold text-lg">
            <Clock className="h-4 w-4" /> {formatTime(remainingSec)}
          </div>
        </div>
      </div>

      {confirmSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setConfirmSubmit(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="h-14 w-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3"><AlertCircle className="h-7 w-7 text-orange-600" /></div>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">ยืนยันส่งข้อสอบ?</h3>
              <p className="text-sm text-neutral-500">
                คุณตอบแล้ว {answeredCount}/{questions.length} ข้อ
                {answeredCount < questions.length && " — ข้อที่ไม่ได้ตอบจะได้ 0 คะแนน"}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmSubmit(false)} className="flex-1 border border-neutral-200 rounded-xl py-2.5 text-sm font-semibold text-neutral-700">ตรวจทานอีกครั้ง</button>
              <button onClick={doSubmit} disabled={submitting} className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-semibold">
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
function QuestionReviewRow({ q, index }) {
  const OPTION_LABELS = ["A", "B", "C", "D"];
  const wasAnswered = q.selected !== null && q.selected !== undefined;

  return (
    <div className={`border rounded-xl p-4 ${q.isCorrect ? "border-green-200 bg-green-50/40" : "border-red-200 bg-red-50/40"}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-black text-neutral-400">{index + 1}.</span>
          <p className="text-sm font-medium text-neutral-900 leading-relaxed">{q.text}</p>
        </div>
        <span className={`flex-shrink-0 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${q.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
          {q.isCorrect ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          {q.scoreAwarded}/{q.score} คะแนน
        </span>
      </div>

      <div className="space-y-1.5 pl-6">
        {(q.options || []).map((opt, optIdx) => {
          const isCorrectOpt = optIdx === q.correct;
          const isSelectedOpt = optIdx === q.selected;
          let cls = "border-neutral-200 text-neutral-500";
          if (isCorrectOpt) cls = "border-green-400 bg-green-100 text-green-800 font-medium";
          else if (isSelectedOpt && !isCorrectOpt) cls = "border-red-300 bg-red-100 text-red-700 font-medium";

          return (
            <div key={optIdx} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${cls}`}>
              <span className="h-5 w-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 bg-white/70">
                {OPTION_LABELS[optIdx]}
              </span>
              <span className="flex-1">{opt}</span>
              {isCorrectOpt && <span className="text-[10px] font-bold text-green-700">คำตอบที่ถูก</span>}
              {isSelectedOpt && !isCorrectOpt && <span className="text-[10px] font-bold text-red-600">คำตอบของคุณ</span>}
            </div>
          );
        })}
        {!wasAnswered && (
          <p className="text-[11px] text-neutral-400 italic pt-0.5">ไม่ได้ตอบข้อนี้</p>
        )}

        {/* ↓↓↓ เพิ่มบล็อกนี้ ↓↓↓ */}
        {q.explanation && q.explanation.trim() && (
          <div className="mt-3 ml-6 flex gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3">
            <span className="text-sm flex-shrink-0">💡</span>
            <div>
              <p className="text-xs font-semibold text-blue-700 mb-0.5">คำอธิบายเฉลย</p>
              <p className="text-xs text-blue-700/90 leading-relaxed">{q.explanation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({ result }) {
  const pct = result.percentage ?? (result.maxScore ? Math.round((result.totalScore / result.maxScore) * 100) : 0);
  const hasQuestions = Array.isArray(result.questions) && result.questions.length > 0;

  return (
    <div className="space-y-4 pt-16">
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 text-center space-y-4">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
        <h1 className="text-lg font-bold text-neutral-900">ส่งข้อสอบเรียบร้อยแล้ว</h1>
        <div className="bg-neutral-50 rounded-xl p-5">
          <p className="text-sm text-neutral-500 mb-1">คะแนน</p>
          <p className="text-3xl font-bold text-orange-600">
            {result.totalScore}/{result.maxScore}
          </p>
          <p className="text-sm text-neutral-500 mt-1">{pct}%</p>
        </div>
        {result.correctCount != null && (
          <p className="text-sm text-neutral-500">ตอบถูก {result.correctCount}/{result.totalQuestions} ข้อ</p>
        )}
      </div>

      {hasQuestions && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-3">
          <p className="text-sm font-semibold text-neutral-700 mb-1">เฉลยรายข้อ</p>
          {result.questions.map((q, i) => (
            <QuestionReviewRow key={q.id ?? i} q={q} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function StudentExam() {
  const { token } = useParams();
  const navigate = useNavigate();
  const userId = getCurrentUserId();

  const [phase, setPhase] = useState("loading"); // loading | landing | running | result | error
  const [landing, setLanding] = useState(null);
  const [runData, setRunData] = useState(null);
  const [result, setResult] = useState(null);
  const [starting, setStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!userId) {
      navigate(`/login?returnTo=/exam/${token}`);
      return;
    }
    let cancelled = false;
    fetchExamByToken(token, userId)
      .then((data) => {
        if (cancelled) return;
        if (data.status === "submitted") {
          setResult(data.result);
          setPhase("result");
        } else {
          setLanding(data);
          setPhase("landing");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err.response?.data?.message || "ไม่สามารถเข้าสอบได้");
        setPhase("error");
      });
    return () => { cancelled = true; };
  }, [token, userId, navigate]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const data = await startExam(token, userId);
      setRunData(data);
      setPhase("running");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "เริ่มสอบไม่สำเร็จ");
      setPhase("error");
    } finally {
      setStarting(false);
    }
  };

  const handleSubmitted = async (submitResult) => {
    setResult(submitResult);
    setPhase("result");
    // Best-effort refresh with the full breakdown. Merge instead of overwrite:
    // GET /result doesn't include fields like correctCount/totalQuestions that
    // the UI needs, so spreading `full` on top of `prev` keeps whatever the
    // submit response already gave us for any key `full` doesn't have.
    try {
      const full = await fetchExamResult(runData.examJoinId, userId);
      setResult((prev) => ({ ...prev, ...full }));
    } catch { /* keep the submit response as-is */ }
  };

  if (phase === "loading") {
    return <LoadingSkeleton />;
  }
  if (phase === "error") {
    return (
      <PageShell maxWidth="max-w-md">
        <div className="text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
          <p className="text-sm text-neutral-600">{errorMsg}</p>
        </div>
      </PageShell>
    );
  }
  if (phase === "landing") {
    return (
      <PageShell maxWidth="max-w-md">
        <LandingCard status={landing.status} exam={landing.exam} onStart={handleStart} starting={starting} />
      </PageShell>
    );
  }
  if (phase === "running") {
    return (
      <PageShell maxWidth="max-w-2xl" align="start">
        <ExamRunner
          examJoinId={runData.examJoinId}
          userId={userId}
          examStartedAt={runData.examStartedAt}
          durationMinutes={runData.durationMinutes}
          questions={runData.questions}
          onSubmitted={handleSubmitted}
        />
      </PageShell>
    );
  }
  if (phase === "result") {
    return (
      <PageShell maxWidth="max-w-2xl" align="start">
        <ResultCard result={result} />
      </PageShell>
    );
  }
  return null;
}