import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle, X } from "lucide-react";
import { postStudentAuth } from "../utils/studentSession";
import "./AuthPage.css";
import "./ResetPassword.css";

export default function ResetPassword({ setupRoute = false }) {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const preview = import.meta.env.DEV && params.get("preview") === "1";
  const [state, setState] = useState({ loading: true, valid: false, requiresUsername: false, username: "", purpose: null });
  const isSetup = setupRoute;
  const [form, setForm] = useState({ username: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (preview) {
      setState({ loading: false, valid: true, requiresUsername: setupRoute, username: "", purpose: setupRoute ? "credential_setup" : "password_reset" });
      return;
    }
    if (!token) {
      setState(current => ({ ...current, loading: false, valid: false }));
      setError("ไม่พบลิงก์ตั้งรหัสผ่าน กรุณาขอลิงก์ใหม่");
      return;
    }
    postStudentAuth("/auth/account/reset-password/inspect", { token })
      .then(data => {
        if ((data.purpose === "credential_setup") !== setupRoute) {
          setState(current => ({ ...current, loading: false, valid: false }));
          setError("ลิงก์นี้ไม่ตรงกับหน้านี้ กรุณาเปิดลิงก์จากอีเมลอีกครั้ง");
          return;
        }
        setState({ loading: false, ...data });
        setForm(current => ({ ...current, username: data.username || "" }));
      })
      .catch(failure => {
        setState(current => ({ ...current, loading: false, valid: false }));
        setError(failure.message || "ลิงก์หมดอายุหรือไม่ถูกต้อง");
      });
  }, [token, preview, setupRoute]);

  async function submit(event) {
    event.preventDefault();
    if (preview || saving) return;
    if (form.password !== form.confirmPassword) {
      setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await postStudentAuth("/auth/account/reset-password", { token, ...form });
      setDone(true);
    } catch (failure) {
      setError(failure.message || "บันทึกรหัสผ่านไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="auth-page reset-page">
      <div className="auth-page-glow auth-page-glow-one" aria-hidden="true" />
      <div className="auth-page-glow auth-page-glow-two" aria-hidden="true" />
      <div className={`auth-stage reset-stage${isSetup ? " reset-stage--credentials" : ""}`}>
        <aside className="reset-brand">
          <div className="reset-brand-content">
            <span className="reset-brand-kicker">{isSetup ? "เพิ่มอีกหนึ่งวิธีเข้าสู่ระบบ" : "กลับมาเรียนต่อกัน"}</span>
            <h2>{isSetup ? <>เรียนต่อได้<br /><em>ในแบบของคุณ</em></> : <>เริ่มต้นใหม่<br /><em>ไปด้วยกัน</em></>}</h2>
            <p>{isSetup ? "ตั้งชื่อผู้ใช้และรหัสผ่านไว้ใช้ควบคู่กับ Google แล้วเข้าเรียนได้สะดวกยิ่งขึ้น" : "ตั้งรหัสผ่านใหม่ให้เรียบร้อย แล้วกลับไปค้นพบสิ่งที่อยากเรียนรู้ต่อ"}</p>
          </div>
          <div className="reset-brand-foot"><KeyRound size={16} /> {isSetup ? "บัญชี Google ของคุณยังใช้ได้เหมือนเดิม" : "ดูแลบัญชีของคุณอย่างปลอดภัย"}</div>
        </aside>

        <section className="reset-panel">
          <Link to={isSetup ? "/profile" : "/login"} className="reset-close" aria-label={isSetup ? "กลับไปหน้าโปรไฟล์" : "กลับไปหน้าเข้าสู่ระบบ"}><X size={18} /></Link>
          <div className="reset-panel-inner">
            <span className="auth-eyebrow">{isSetup ? "บัญชีของคุณ" : "ความปลอดภัยของบัญชี"}</span>
            <h1 className="auth-heading">{isSetup ? "ตั้งชื่อผู้ใช้และรหัสผ่าน" : "ตั้งรหัสผ่านใหม่"}</h1>
            <p className="auth-intro">{isSetup ? "เพิ่มวิธีเข้าสู่ระบบอีกแบบโดยใช้บัญชีเดิมของคุณ" : "ใช้รหัสผ่านที่คุณจำได้ และไม่เคยใช้กับบัญชีอื่น"}</p>

            {preview && <p className="reset-preview-note" role="status">นี่คือตัวอย่างหน้าจอสำหรับตรวจดีไซน์ ปุ่มบันทึกจะใช้งานได้เมื่อเปิดจากลิงก์ในอีเมล</p>}

            {state.loading ? (
              <div className="reset-state"><LoaderCircle className="reset-spinner" size={27} /><p>กำลังตรวจสอบลิงก์...</p></div>
            ) : done ? (
              <div className="reset-state reset-done" role="status">
                <CheckCircle2 size={42} />
                <h2>เรียบร้อยแล้ว!</h2>
                <p>{isSetup ? "ตั้งชื่อผู้ใช้และรหัสผ่านสำเร็จ จากนี้เข้าได้ทั้ง Google และชื่อผู้ใช้" : "ตั้งรหัสผ่านใหม่สำเร็จ ใช้รหัสผ่านนี้เพื่อเข้าสู่ระบบได้เลย"}</p>
                <Link to="/login" className="auth-primary">เข้าสู่ระบบ</Link>
              </div>
            ) : state.valid ? (
              <form onSubmit={submit} className="reset-form">
                {state.requiresUsername && <div className="reset-field">
                  <label htmlFor="reset-username">{isSetup ? "ชื่อผู้ใช้" : "ชื่อผู้ใช้ใหม่"}</label>
                  <input id="reset-username" className="auth-input" name="username" value={form.username} onChange={event => setForm(current => ({ ...current, username: event.target.value }))} minLength={4} maxLength={32} required autoComplete="username" placeholder="ตั้งชื่อผู้ใช้" />
                  <p className="reset-helper">4–32 ตัว ใช้ตัวอักษรอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง</p>
                </div>}
                <div className="reset-field">
                  <label htmlFor="reset-password">{isSetup ? "รหัสผ่าน" : "รหัสผ่านใหม่"}</label>
                  <div className="reset-password-wrap">
                    <input id="reset-password" className="auth-input" type={showPassword ? "text" : "password"} value={form.password} onChange={event => setForm(current => ({ ...current, password: event.target.value }))} minLength={8} maxLength={128} required autoComplete="new-password" placeholder="อย่างน้อย 8 ตัวอักษร" />
                    <button type="button" onClick={() => setShowPassword(current => !current)} aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                </div>
                <div className="reset-field">
                  <label htmlFor="reset-confirm">{isSetup ? "ยืนยันรหัสผ่าน" : "ยืนยันรหัสผ่านใหม่"}</label>
                  <input id="reset-confirm" className="auth-input" type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={event => setForm(current => ({ ...current, confirmPassword: event.target.value }))} minLength={8} maxLength={128} required autoComplete="new-password" placeholder="กรอกรหัสผ่านอีกครั้ง" />
                </div>
                {error && <p className="auth-error" role="alert">{error}</p>}
                <button className="auth-primary" disabled={saving || preview} type="submit">{saving ? "กำลังบันทึก..." : isSetup ? "บันทึกชื่อผู้ใช้และรหัสผ่าน" : "บันทึกรหัสผ่านใหม่"}</button>
                <p className="reset-helper reset-security-hint"><KeyRound size={15} /> ลิงก์จากอีเมลใช้ได้ครั้งเดียวและมีเวลาจำกัด</p>
              </form>
            ) : (
              <div className="reset-state reset-invalid">
                <span className="reset-invalid-icon"><KeyRound size={28} /></span>
                <h2>ลิงก์นี้ใช้ไม่ได้แล้ว</h2>
                <p role="alert">{error || "ลิงก์หมดอายุหรือถูกใช้แล้ว"}</p>
                <Link to={isSetup ? "/profile" : "/forgot-password"} className="auth-primary">{isSetup ? "กลับไปขอลิงก์ใหม่" : "ขอลิงก์ใหม่"}</Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
