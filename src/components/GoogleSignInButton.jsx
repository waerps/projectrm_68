import { useEffect, useRef, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { postStudentAuth } from "../utils/studentSession";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

export default function GoogleSignInButton({ disabled, onBusyChange = () => {}, onAuthenticated, mode = "login" }) {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [linkButtonWidth, setLinkButtonWidth] = useState(300);
  const [loginButtonWidth, setLoginButtonWidth] = useState(300);
  const buttonContainer = useRef(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (mode !== "link") return;
    const resize = () => setLinkButtonWidth(Math.min(300, Math.max(200, window.innerWidth - 120)));
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [mode]);

  useEffect(() => {
    if (!challenge || !buttonContainer.current || mode === "link") return;
    const element = buttonContainer.current;
    const measure = () => setLoginButtonWidth(Math.min(400, Math.floor(element.getBoundingClientRect().width)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [challenge, mode]);

  useEffect(() => {
    if (!clientId) return;
    const controller = new AbortController();
    setLoading(true);
    setChallenge(null);
    setError("");
    postStudentAuth("/auth/google/challenge", {}, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        if (!data.challengeToken || !data.nonce || !(Number(data.expiresIn) > 0)) throw new Error("เตรียมการเข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง");
        setChallenge({ ...data, expiresAt: Date.now() + Number(data.expiresIn) * 1000 });
      })
      .catch((failure) => { if (!controller.signal.aborted) setError(failure.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    if (!challenge) return;
    const timeout = setTimeout(() => {
      if (!inFlight.current) setAttempt((value) => value + 1);
    }, Math.max(0, challenge.expiresAt - Date.now() - 60_000));
    return () => clearTimeout(timeout);
  }, [challenge]);

  async function handleSuccess(result) {
    if (disabled || inFlight.current) return;
    if (!result.credential || !challenge || challenge.expiresAt <= Date.now()) {
      setChallenge(null);
      setAttempt((value) => value + 1);
      return;
    }
    inFlight.current = true;
    setBusy(true);
    onBusyChange(true);
    setError("");
    try {
      const data = await postStudentAuth(mode === "link" ? "/auth/google/link" : "/auth/google", {
        credential: result.credential,
        challengeToken: challenge.challengeToken,
      }, undefined, mode === "link" ? localStorage.getItem("student_token") : undefined);
      await onAuthenticated(data);
      if (mode === "link") {
        setChallenge(null);
        setAttempt((value) => value + 1);
      }
    } catch (failure) {
      setChallenge(null);
      if (failure.code === "CHALLENGE_EXPIRED") {
        setAttempt((value) => value + 1);
      } else {
        setError(failure.message);
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
      onBusyChange(false);
    }
  }

  if (!clientId) {
    return <p className="text-center text-sm text-gray-500">Google ยังไม่พร้อมใช้งาน กรุณาเข้าสู่ระบบหรือสมัครด้วยชื่อผู้ใช้ก่อน</p>;
  }

  return (
    <div className="space-y-3 text-center" aria-busy={busy || loading}>
      {loading && !error && <p role="status" className="text-sm text-gray-500">รอโหลด...</p>}
      {busy && <p role="status" className="text-sm text-orange-600">กำลังเข้าสู่ระบบด้วย Google...</p>}
      {challenge && !error && (
        <div ref={buttonContainer} className={`w-full flex justify-center ${disabled || busy ? "hidden" : ""}`}>
          <GoogleLogin
            key={`${challenge.challengeToken}-${mode === "link" ? linkButtonWidth : loginButtonWidth}`}
            nonce={challenge.nonce}
            onSuccess={handleSuccess}
            onError={() => { setChallenge(null); setError("เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองอีกครั้ง"); }}
            text={mode === "link" ? "continue_with" : "signin_with"}
            theme="outline"
            shape={mode === "link" ? "rectangular" : "pill"}
            size="large"
            width={mode === "link" ? linkButtonWidth : loginButtonWidth}
            locale="th"
            useOneTap={false}
            auto_select={false}
          />
        </div>
      )}
      {error && !busy && (
        <div>
          <p role="alert" className="text-sm text-red-600">{error}</p>
          <button type="button" disabled={disabled} onClick={() => setAttempt((value) => value + 1)} className="mt-2 text-sm font-semibold text-orange-600 underline disabled:opacity-50">ลองอีกครั้ง</button>
        </div>
      )}
    </div>
  );
}
