import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { getVideoLearningState, submitVideoQuestionAnswer, updateVideoWatchSegments } from "../callapi/callusers_student";

const requestId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;

export default function InteractiveVideoPlayer({ video, token, onProgress, onLearningChange }) {
  const videoRef = useRef(null);
  const pendingSegments = useRef(new Set());
  const pendingEvents = useRef([]);
  const currentVisit = useRef({ index: null, seconds: 0, reported: false });
  const watchSessionId = useRef(requestId());
  const lastSample = useRef(null);
  const furthestAllowed = useRef(0);
  const correctingSeek = useRef(false);
  const flushInFlight = useRef(false);
  const learningRef = useRef({ questions: [] });
  const activeRef = useRef(null);
  const [learning, setLearning] = useState({ questions: [], correctPercent: 100 });
  const [active, setActive] = useState(null);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [watchPercent, setWatchPercent] = useState(Number(video.WatchPercent || 0));
  useEffect(() => { learningRef.current = learning; }, [learning]);
  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    let cancelled = false;
    setActive(null); setFeedback(null); setError(""); setWatchPercent(Number(video.WatchPercent || 0));
    getVideoLearningState(token, video.VideoId).then(data => { if (!cancelled) setLearning(data); })
      .catch(err => { if (!cancelled) setError(String(err)); });
    return () => { cancelled = true; };
  }, [token, video.VideoId]);

  const openQuestion = useCallback(question => {
    if (!question || activeRef.current) return;
    videoRef.current?.pause();
    activeRef.current = question;
    setSelected(null); setFeedback(null); setActive(question);
  }, []);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return undefined;
    const flush = async (force = false) => {
      if (!Number.isFinite(element.duration)) return;
      if (flushInFlight.current) return;
      const indexes = [...pendingSegments.current];
      const events = [...pendingEvents.current];
      if (!indexes.length && !events.length && !force) return;
      pendingSegments.current.clear();
      pendingEvents.current = [];
      flushInFlight.current = true;
      try {
        const result = await updateVideoWatchSegments(token, video.VideoId, {
          segmentIndexes: indexes, segmentEvents: events,
          sessionId: watchSessionId.current, lastWatchTime: element.currentTime,
        });
        const data = result?.data || {};
        setWatchPercent(Number(data.watchPercent || 0));
        onProgress?.(video.VideoId, Number(data.watchPercent || 0), Number(data.lastWatchTime || element.currentTime));
        if (data.blockedByQuestion) {
          openQuestion(learningRef.current.questions.find(q => String(q.questionId) === String(data.blockedByQuestion.questionId) && !q.answered));
        }
      } catch (err) { indexes.forEach(i => pendingSegments.current.add(i)); pendingEvents.current.unshift(...events); console.error(err); }
      finally { flushInFlight.current = false; }
    };
    const reset = () => { lastSample.current = null; };
    const sample = () => {
      if (activeRef.current) return;
      const current = element.currentTime;
      const due = learningRef.current.questions.filter(q => !q.answered).sort((a, b) => a.timestampMs - b.timestampMs)[0];
      if (due && current >= due.timestampMs / 1000 - 0.15) {
        element.currentTime = due.timestampMs / 1000; flush(true); openQuestion(due); return;
      }
      const now = performance.now();
      const previous = lastSample.current;
      lastSample.current = { current, now };
      if (!previous || element.paused || element.seeking || document.hidden) return;
      const mediaDelta = current - previous.current;
      const wallDelta = (now - previous.now) / 1000;
      if (mediaDelta <= 0 || mediaDelta > 1.5 || wallDelta > 2 || Math.abs(mediaDelta - wallDelta * element.playbackRate) > 0.75) return;
      const index = Math.floor(previous.current / 10);
      if (Math.floor(current / 10) !== index) return;
      if (currentVisit.current.index !== index) currentVisit.current = { index, seconds: 0, reported: false };
      currentVisit.current.seconds = Math.min(10, currentVisit.current.seconds + mediaDelta);
      furthestAllowed.current = Math.max(furthestAllowed.current, current);
      if (!currentVisit.current.reported && currentVisit.current.seconds >= Math.max(1, Math.min(10, element.duration - index * 10) * 0.8)) {
        currentVisit.current.reported = true;
        pendingSegments.current.add(index);
        pendingEvents.current.push({ eventId: requestId(), segmentIndex: index });
      }
    };
    const resume = () => {
      const verified = Math.min(Number(video.LastWatchTime || 0), element.duration * Number(video.WatchPercent || 0) / 100);
      furthestAllowed.current = Math.max(0, verified);
      if (verified > 0 && verified < element.duration - 3) element.currentTime = verified;
    };
    const guardSeek = () => {
      reset();
      currentVisit.current = { index: null, seconds: 0, reported: false };
      if (correctingSeek.current) return;
      const nextQuestion = learningRef.current.questions.filter(q => !q.answered).sort((a, b) => a.timestampMs - b.timestampMs)[0];
      const questionLimit = nextQuestion ? nextQuestion.timestampMs / 1000 : Infinity;
      if (element.currentTime > Math.min(furthestAllowed.current + 1, questionLimit)) {
        correctingSeek.current = true;
        element.currentTime = Math.max(0, Math.min(furthestAllowed.current, questionLimit));
        queueMicrotask(() => { correctingSeek.current = false; });
      }
    };
    const pause = () => { reset(); flush(); };
    const timer = setInterval(() => flush(), 10000);
    element.addEventListener("loadedmetadata", resume, { once: true });
    element.addEventListener("timeupdate", sample); element.addEventListener("seeking", guardSeek);
    element.addEventListener("seeked", reset); element.addEventListener("pause", pause); element.addEventListener("ended", pause);
    return () => { clearInterval(timer); element.removeEventListener("timeupdate", sample); element.removeEventListener("seeking", guardSeek); element.removeEventListener("seeked", reset); element.removeEventListener("pause", pause); element.removeEventListener("ended", pause); };
  }, [token, video.VideoId, openQuestion, onProgress]);

  const answer = async () => {
    if (!selected || !active) return;
    setSubmitting(true); setError("");
    try {
      const result = await submitVideoQuestionAnswer(token, video.VideoId, active.questionId, selected, requestId());
      setFeedback(result);
      setLearning(current => {
        const questions = current.questions.map(q => q.questionId === active.questionId ? { ...q, answered: true, isCorrect: result.isCorrect } : q);
        const correct = questions.filter(q => q.isCorrect).length;
        onLearningChange?.(video.VideoId, { correctCount: correct, totalQuestions: questions.length });
        return { ...current, questions, correctPercent: questions.length ? correct / questions.length * 100 : 100 };
      });
    } catch (err) { setError(String(err)); } finally { setSubmitting(false); }
  };

  return <div className="bg-white">
    <video ref={videoRef} src={video.VideoUrl} controls controlsList="nodownload" playsInline className="aspect-video w-full bg-black" preload="metadata" />
    {error && <div className="bg-red-50 px-4 py-2 text-xs text-red-700">{error}</div>}
    {active && <div className="bg-gradient-to-b from-orange-50/70 to-white p-4 sm:p-6">
      <div className="mx-auto w-full max-w-xl overflow-hidden rounded-[28px] bg-white shadow-[0_12px_40px_rgba(249,115,22,0.13)]">
        <div className="bg-gradient-to-r from-orange-400 to-amber-400 px-6 py-5 text-white"><p className="text-xl font-bold">หยุดคิดสักนิด 🌟</p><p className="mt-1 text-sm text-orange-50">คำถามสั้นๆ ระหว่างเรียน ช่วยเช็กว่าเราเข้าใจเนื้อหาช่วงนี้แล้วหรือยัง</p></div>
        <div className="p-6"><div className="mb-4 rounded-2xl bg-orange-50 p-4"><p className="text-xs font-bold text-orange-600">ทำอย่างไรถึงจะดูต่อได้?</p><p className="mt-1 text-sm text-neutral-700">เลือกคำตอบ 1 ข้อ แล้วกด “ส่งคำตอบ” ไม่ว่าจะตอบถูกหรือไม่ วิดีโอก็สามารถเล่นต่อได้</p></div>
        <h3 className="mb-4 text-lg font-bold text-neutral-900">{active.text}</h3>
        <div className="space-y-2">{active.options.map((option, index) => <button key={option.optionId} disabled={Boolean(feedback)} onClick={() => setSelected(option.optionId)} className={`flex w-full items-center gap-3 rounded-2xl border-0 px-4 py-3 text-left text-sm outline-none transition focus:outline-none ${selected === option.optionId ? "bg-orange-100 text-orange-900 shadow-[0_3px_12px_rgba(249,115,22,0.14)]" : "bg-neutral-50 text-neutral-700 hover:bg-orange-50"}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${selected === option.optionId ? "bg-orange-500 text-white" : "bg-white text-neutral-500 shadow-sm"}`}>{String.fromCharCode(65 + index)}</span>{option.text}</button>)}</div>
        {feedback && <div className={`mt-4 rounded-2xl p-4 text-sm ${feedback.isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}><div className="flex items-center gap-2 font-bold">{feedback.isCorrect ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}{feedback.isCorrect ? "เยี่ยมมาก! คำตอบนี้ถูกต้อง" : "ยังไม่ถูก แต่ไม่เป็นไร ลองจดไว้ทบทวนอีกครั้งนะ"}</div>{feedback.explanation && <p className="mt-2 leading-relaxed">{feedback.explanation}</p>}</div>}
        {!feedback ? <button onClick={answer} disabled={!selected || submitting} className="mt-5 flex w-full justify-center rounded-2xl border-0 bg-orange-500 py-3.5 font-bold text-white outline-none transition hover:bg-orange-600 focus:outline-none disabled:bg-neutral-200 disabled:text-neutral-400">{submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : selected ? "ส่งคำตอบและตรวจผล" : "เลือกคำตอบก่อน"}</button> : <button onClick={() => { activeRef.current = null; setActive(null); setFeedback(null); videoRef.current?.play(); }} className="mt-5 w-full rounded-2xl border-0 bg-orange-500 py-3.5 font-bold text-white outline-none hover:bg-orange-600 focus:outline-none">เล่นวิดีโอต่อ ▶</button>}
        </div>
      </div>
    </div>}
  </div>;
}
