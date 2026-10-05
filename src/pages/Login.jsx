import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, GraduationCap, KeyRound, Sparkles, X } from "lucide-react";
import { API_URL } from "../config";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { clearGoogleRegistration, finishStudentLogin, readGoogleRegistration, saveGoogleRegistration, studentReturnContext } from "../utils/studentSession";
import GoogleRegistrationForm from "./GoogleRegistrationForm";
import TutorApply from "./TutorApply";
import { getParentProfileTypes } from "../callapi/callusers_student";
import ForgotPasswordForm from "./ForgotPasswordForm";
import "./AuthPage.css";

const emptyRegistration = {
  firstname: "", lastname: "", nickname: "", phoneNo: "", schoolName: "",
  lineId: "", birthOfDate: "", remark: "", username: "", password: "",
  confirmPassword: "", gradeLevelId: "", genderId: "",
  parentFirstname: "", parentLastname: "", parentNickname: "", parentPhoneNo: "",
  parentLineId: "", parentBirthOfDate: "", parentProfilesTypeId: "", parentAcknowledged: "false",
};
const grades = [
  ...Array.from({ length: 6 }, (_, index) => `ประถมศึกษาปีที่ ${index + 1}`),
  ...Array.from({ length: 6 }, (_, index) => `มัธยมศึกษาปีที่ ${index + 1}`),
];
const inputClass = "auth-input";

export function Login({ initialMode = "login" }) {
  const [mode, setMode] = useState(() => new URLSearchParams(window.location.search).get("apply") === "tutor" ? "tutorApply" : initialMode);
  const [pendingGoogle, setPendingGoogle] = useState(() => initialMode === "google" ? readGoogleRegistration() : null);
  const [role, setRole] = useState(() => new URLSearchParams(window.location.search).get("apply") === "tutor" ? "admin" : "user");
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registration, setRegistration] = useState(emptyRegistration);
  const [registrationPhoto, setRegistrationPhoto] = useState(null);
  const [registrationPhotoPreview, setRegistrationPhotoPreview] = useState(null);
  const [pdpaAcknowledged, setPdpaAcknowledged] = useState(false);
  const [parentTypes, setParentTypes] = useState([]);
  const [loginBusy, setLoginBusy] = useState(false);
  const [registerBusy, setRegisterBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => setMode(new URLSearchParams(location.search).get("apply") === "tutor" ? "tutorApply" : initialMode), [initialMode, location.search]);
  useEffect(() => { getParentProfileTypes().then(setParentTypes).catch(() => setParentTypes([])); }, []);
  useEffect(() => () => {
    if (registrationPhotoPreview) URL.revokeObjectURL(registrationPhotoPreview);
  }, [registrationPhotoPreview]);

  function updateRegistrationPhoto(event) {
    const file = event.target.files?.[0] || null;
    if (file && (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024)) {
      setRegisterError("รูปโปรไฟล์ต้องเป็น JPG, PNG หรือ WEBP และไม่เกิน 10 MB");
      event.target.value = "";
      return;
    }
    setRegisterError("");
    setRegistrationPhoto(file);
    setRegistrationPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  function switchMode(next) {
    if (location.pathname === "/forgot-password" && next === "login") {
      navigate("/login", { replace: true });
      return;
    }
    if (mode === "google" && next !== "google") {
      clearGoogleRegistration();
      setPendingGoogle(null);
    }
    setMode(next);
    setLoginError("");
    setRegisterError("");
    if (next === "register") setRole("user");
    if (next === "tutorApply") setRole("admin");
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError("");
    setLoginBusy(true);
    try {
      const response = await fetch(`${API_URL}${role === "user" ? "/auth/login" : "/auth/login-admin"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      if (role === "user") {
        finishStudentLogin(data, navigate, studentReturnContext(location));
      } else {
        localStorage.setItem("student_token", data.token);
        localStorage.setItem("user_role", data.user?.roleId || "student");
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate(data.user?.roleId === 1 ? "/admin" : data.user?.roleId === 2 ? "/tutor" : "/");
      }
    } catch (error) {
      setLoginError(error.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoginBusy(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setRegisterError("");
    if (!pdpaAcknowledged) {
      setRegisterError("กรุณารับทราบเรื่องการเก็บและใช้ข้อมูลก่อนสมัครบัญชี");
      return;
    }
    if (registration.password !== registration.confirmPassword) {
      setRegisterError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }
    if ((registration.parentFirstname || registration.parentLastname) && (!registration.parentFirstname.trim() || !registration.parentLastname.trim() || registration.parentAcknowledged !== "true")) {
      setRegisterError("กรุณากรอกชื่อและนามสกุลผู้ปกครอง พร้อมรับทราบการเก็บข้อมูล");
      return;
    }
    setRegisterBusy(true);
    try {
      const formData = new FormData();
      Object.entries(registration).forEach(([key, value]) => {
        if (key !== "confirmPassword") formData.append(key, value ?? "");
      });
      if (registrationPhoto) formData.append("photo", registrationPhoto);
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "สมัครบัญชีไม่สำเร็จ กรุณาลองใหม่");
      setLoginData({ username: registration.username.trim(), password: "" });
      setRegistration(emptyRegistration);
      setRegistrationPhoto(null);
      setRegistrationPhotoPreview(null);
      setPdpaAcknowledged(false);
      navigate("/login", { replace: true, state: { registered: true } });
    } catch (error) {
      setRegisterError(error.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setRegisterBusy(false);
    }
  }

  async function handleGoogleAuthenticated(data) {
    if (data.needsOnboarding) {
      saveGoogleRegistration(data, studentReturnContext(location));
      setPendingGoogle(readGoogleRegistration());
      setMode("google");
      return;
    }
    finishStudentLogin(data, navigate, studentReturnContext(location));
  }

  function updateRegistration(event) {
    const { name, value } = event.target;
    setRegistration(current => ({ ...current, [name]: value }));
  }

  return (
    <main className="auth-page">
      <div className="auth-page-glow auth-page-glow-one" aria-hidden="true" />
      <div className="auth-page-glow auth-page-glow-two" aria-hidden="true" />
      <div className="auth-stage" data-mode={mode === "login" ? "login" : "register"}>
        <button type="button" onClick={() => navigate("/")} className="auth-close" aria-label="ปิดและกลับหน้าแรก"><X size={18} /></button>

        <section className="auth-pane auth-pane-login" aria-hidden={mode !== "login"} inert={mode !== "login"}>
          <div className="auth-pane-inner">
            <span className="auth-eyebrow">ยินดีต้อนรับกลับ</span>
            <h1 className="auth-heading">เข้าสู่ระบบ</h1>
            <p className="auth-intro">เรียนรู้ต่อได้ทันทีด้วยบัญชีของคุณ</p>
            <div className="auth-role-switch" role="group" aria-label="ประเภทบัญชี">
              <button type="button" className={role === "user" ? "active" : ""} onClick={() => { setRole("user"); setLoginError(""); }}>นักเรียน</button>
              <button type="button" className={role === "admin" ? "active" : ""} onClick={() => { setRole("admin"); setLoginError(""); }}>ติวเตอร์ / แอดมิน</button>
            </div>
            {location.state?.registered && <p className="auth-success" role="status">สมัครบัญชีสำเร็จ เข้าสู่ระบบได้เลย</p>}
            <form onSubmit={handleLogin} className="auth-form">
              <label htmlFor="auth-username">ชื่อผู้ใช้</label>
              <input id="auth-username" className={inputClass} name="username" type="text" autoComplete="username" required value={loginData.username} onChange={event => setLoginData(current => ({ ...current, username: event.target.value }))} placeholder="กรอกชื่อผู้ใช้" />
              <label htmlFor="auth-password">รหัสผ่าน</label>
              <input id="auth-password" className={inputClass} name="password" type="password" autoComplete="current-password" required value={loginData.password} onChange={event => setLoginData(current => ({ ...current, password: event.target.value }))} placeholder="กรอกรหัสผ่าน" />
              <div className={role === "user" ? "auth-form-meta" : "auth-form-meta auth-hidden-slot"} aria-hidden={role !== "user"} inert={role !== "user"}><button type="button" onClick={() => switchMode("forgot")} tabIndex={role === "user" ? 0 : -1}>ลืมรหัสผ่าน?</button></div>
              {loginError && <p className="auth-error" role="alert">{loginError}</p>}
              <button className="auth-primary" disabled={loginBusy} type="submit">{loginBusy ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}</button>
            </form>
            <div className="auth-google-area">
              <div className="auth-divider"><span>หรือ</span></div>
              {role === "user" && mode === "login" ? <GoogleSignInButton disabled={googleBusy} onBusyChange={setGoogleBusy} onAuthenticated={handleGoogleAuthenticated} /> : <button type="button" className="auth-tutor-apply-link" onClick={() => switchMode("tutorApply")}>สมัครเป็นติวเตอร์ <ArrowRight size={16} /></button>}
            </div>
            {role === "user" && <p className="auth-mobile-switch">ยังไม่มีบัญชี? <button type="button" onClick={() => switchMode("register")}>สมัครบัญชี</button></p>}
          </div>
        </section>

        <section className="auth-pane auth-pane-register" aria-hidden={mode === "login"} inert={mode === "login"}>
          {mode === "google" ? <GoogleRegistrationForm pending={pendingGoogle} onCancel={() => switchMode("login")} /> : mode === "forgot" ? <ForgotPasswordForm onBack={() => switchMode("login")} /> : mode === "tutorApply" ? <div className="auth-pane-inner"><TutorApply embedded /><p className="auth-mobile-switch">มีบัญชีแล้ว? <button type="button" onClick={() => switchMode("login")}>เข้าสู่ระบบติวเตอร์</button></p></div> : <div className="auth-pane-inner">
            <span className="auth-eyebrow">เริ่มต้นเรียนรู้ไปด้วยกัน</span>
            <h1 className="auth-heading">สร้างบัญชี</h1>
            <p className="auth-intro">กรอกข้อมูลนักเรียนเพื่อสมัครใช้งาน</p>
            <form onSubmit={handleRegister} className="auth-form auth-register-form">
              <div className="auth-two-columns">
                <div><label htmlFor="register-firstname">ชื่อ <span>*</span></label><input id="register-firstname" className={inputClass} name="firstname" autoComplete="given-name" required maxLength={100} value={registration.firstname} onChange={updateRegistration} placeholder="ชื่อ" /></div>
                <div><label htmlFor="register-lastname">นามสกุล <span>*</span></label><input id="register-lastname" className={inputClass} name="lastname" autoComplete="family-name" required maxLength={100} value={registration.lastname} onChange={updateRegistration} placeholder="นามสกุล" /></div>
              </div>
              <label htmlFor="register-username">ชื่อผู้ใช้ <span>*</span></label>
              <input id="register-username" className={inputClass} name="username" autoComplete="username" required minLength={4} maxLength={32} pattern="[A-Za-z0-9](?:[A-Za-z0-9._]|-){2,30}[A-Za-z0-9]" title="4–32 ตัว ใช้ตัวอักษรอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง" value={registration.username} onChange={updateRegistration} placeholder="ตั้งชื่อผู้ใช้" />
              <div className="auth-two-columns">
                <div><label htmlFor="register-password">รหัสผ่าน <span>*</span></label><input id="register-password" className={inputClass} name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={registration.password} onChange={updateRegistration} placeholder="อย่างน้อย 8 ตัว" /></div>
                <div><label htmlFor="register-confirm">ยืนยันรหัสผ่าน <span>*</span></label><input id="register-confirm" className={inputClass} name="confirmPassword" type="password" autoComplete="new-password" required value={registration.confirmPassword} onChange={updateRegistration} placeholder="กรอกอีกครั้ง" /></div>
              </div>
              <details className="auth-optional">
                <summary>ข้อมูลเพิ่มเติม <span>เพิ่มภายหลังได้</span></summary>
                <div className="auth-optional-fields">
                  <div className="auth-two-columns">
                    <div><label htmlFor="register-nickname">ชื่อเล่น</label><input id="register-nickname" className={inputClass} name="nickname" value={registration.nickname} onChange={updateRegistration} /></div>
                    <div><label htmlFor="register-phone">เบอร์โทรศัพท์</label><input id="register-phone" className={inputClass} name="phoneNo" type="tel" autoComplete="tel" value={registration.phoneNo} onChange={updateRegistration} /></div>
                  </div>
                  <div className="auth-two-columns">
                    <div><label htmlFor="register-school">โรงเรียน</label><input id="register-school" className={inputClass} name="schoolName" value={registration.schoolName} onChange={updateRegistration} /></div>
                    <div><label htmlFor="register-grade">ระดับชั้น</label><select id="register-grade" className={inputClass} name="gradeLevelId" value={registration.gradeLevelId} onChange={updateRegistration}><option value="">เลือกระดับชั้น</option>{grades.map((grade, index) => <option value={index + 1} key={grade}>{grade}</option>)}</select></div>
                  </div>
                  <div className="auth-two-columns">
                    <div><label htmlFor="register-gender">เพศ</label><select id="register-gender" className={inputClass} name="genderId" value={registration.genderId} onChange={updateRegistration}><option value="">เลือกเพศ</option><option value="1">ชาย</option><option value="2">หญิง</option><option value="3">ไม่ระบุ</option></select></div>
                    <div><label htmlFor="register-birth">วันเกิด</label><input id="register-birth" className={inputClass} name="birthOfDate" type="date" value={registration.birthOfDate} onChange={updateRegistration} /></div>
                  </div>
                  <div><label htmlFor="register-line">LINE ID</label><input id="register-line" className={inputClass} name="lineId" value={registration.lineId} onChange={updateRegistration} /></div>
                  <div className="auth-parent-fields">
                    <strong>ข้อมูลผู้ปกครอง</strong>
                    <p>เพิ่มตอนนี้หรือภายหลังได้ เพื่อใช้ติดต่อเรื่องการเรียนและการชำระเงิน</p>
                    <div className="auth-two-columns">
                      <div><label htmlFor="register-parent-firstname">ชื่อผู้ปกครอง</label><input id="register-parent-firstname" className={inputClass} name="parentFirstname" value={registration.parentFirstname} onChange={updateRegistration} /></div>
                      <div><label htmlFor="register-parent-lastname">นามสกุลผู้ปกครอง</label><input id="register-parent-lastname" className={inputClass} name="parentLastname" value={registration.parentLastname} onChange={updateRegistration} /></div>
                    </div>
                    <div className="auth-two-columns">
                      <div><label htmlFor="register-parent-nickname">ชื่อเล่น</label><input id="register-parent-nickname" className={inputClass} name="parentNickname" value={registration.parentNickname} onChange={updateRegistration} /></div>
                      <div><label htmlFor="register-parent-phone">เบอร์โทร</label><input id="register-parent-phone" className={inputClass} name="parentPhoneNo" value={registration.parentPhoneNo} onChange={updateRegistration} /></div>
                    </div>
                    <div className="auth-two-columns">
                      <div><label htmlFor="register-parent-line">LINE ID</label><input id="register-parent-line" className={inputClass} name="parentLineId" value={registration.parentLineId} onChange={updateRegistration} /></div>
                      <div><label htmlFor="register-parent-birth">วันเกิด</label><input id="register-parent-birth" type="date" className={inputClass} name="parentBirthOfDate" value={registration.parentBirthOfDate} onChange={updateRegistration} /></div>
                    </div>
                    <label htmlFor="register-parent-type">ความสัมพันธ์</label><select id="register-parent-type" className={inputClass} name="parentProfilesTypeId" value={registration.parentProfilesTypeId} onChange={updateRegistration}><option value="">เลือกความสัมพันธ์</option>{parentTypes.map((type) => <option key={type.ParentProfilesType_Id} value={type.ParentProfilesType_Id}>{type.ParentProfilesType_Name}</option>)}</select>
                    {(registration.parentFirstname || registration.parentLastname) && <label className="auth-parent-consent"><input type="checkbox" checked={registration.parentAcknowledged === "true"} onChange={(event) => setRegistration((current) => ({ ...current, parentAcknowledged: event.target.checked ? "true" : "false" }))} />รับทราบเรื่องการเก็บข้อมูลผู้ปกครองเพื่อดูแลการเรียนและการชำระเงิน</label>}
                  </div>
                  <div className="auth-photo-upload">
                    <label htmlFor="register-photo">รูปโปรไฟล์ <span className="auth-optional-label">ไม่บังคับ</span></label>
                    <div className="auth-photo-row">
                      {registrationPhotoPreview && <img src={registrationPhotoPreview} alt="ตัวอย่างรูปโปรไฟล์" />}
                      <input id="register-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={updateRegistrationPhoto} />
                    </div>
                    <p>รองรับ JPG, PNG, WEBP ไม่เกิน 10 MB</p>
                  </div>
                  <label htmlFor="register-remark">หมายเหตุ</label><textarea id="register-remark" className={inputClass} name="remark" rows={2} value={registration.remark} onChange={updateRegistration} />
                </div>
              </details>
              <div className="auth-pdpa-notice">
                <strong>การเก็บและใช้ข้อมูลส่วนบุคคล</strong>
                <p>สถาบันจะใช้ข้อมูลที่กรอกเพื่อจัดการบัญชีผู้เรียนและการเรียนการสอน ข้อมูลที่กระทบความเป็นส่วนตัวเพิ่มเติม เช่น พฤติกรรมระหว่างทำข้อสอบ ระบบจะขอความยินยอมแยกต่างหากก่อนซื้อคอร์สเรียน</p>
                <label htmlFor="register-pdpa"><input id="register-pdpa" type="checkbox" checked={pdpaAcknowledged} onChange={event => setPdpaAcknowledged(event.target.checked)} required /><span>ข้าพเจ้ารับทราบเรื่องการเก็บและใช้ข้อมูลข้างต้นแล้ว *</span></label>
              </div>
              {registerError && <p className="auth-error" role="alert">{registerError}</p>}
              <button className="auth-primary" disabled={registerBusy || !pdpaAcknowledged} type="submit">{registerBusy ? "กำลังสมัคร..." : "สร้างบัญชี"}</button>
            </form>
            <p className="auth-mobile-switch">มีบัญชีแล้ว? <button type="button" onClick={() => switchMode("login")}>เข้าสู่ระบบ</button></p>
          </div>}
        </section>

        <aside className="auth-swipe" aria-label="สลับระหว่างเข้าสู่ระบบกับสมัครบัญชี">
          <div className="auth-swipe-glow" aria-hidden="true" />
          <div className={mode === "login" ? "auth-swipe-copy auth-learning-copy is-visible" : "auth-swipe-copy auth-learning-copy"} aria-hidden={mode !== "login"}>
            <div className="auth-learning-art" aria-hidden="true">
              <span className="auth-learning-art-orbit" />
              <span className="auth-learning-art-book"><BookOpen size={60} strokeWidth={1.6} /></span>
              <span className="auth-learning-art-spark"><Sparkles size={25} strokeWidth={2} /></span>
              <span className="auth-learning-art-dot" />
            </div>
            <p className="auth-grade-pill"><GraduationCap size={16} strokeWidth={2} /> สถาบันศรเสริมติวเตอร์ ขอนแก่น</p>
            <h2 className="auth-learning-title">เรียนสนุกขึ้น<br /><span>เริ่มได้ที่นี่</span></h2>
            <p className="auth-swipe-description">เลือกคอร์สที่สนใจ แล้วค่อย ๆ เติบโตในแบบของตัวเอง</p>
            <button type="button" onClick={() => switchMode("register")} tabIndex={mode === "login" ? 0 : -1}>สมัครบัญชี <ArrowRight size={16} /></button>
          </div>
          <div className={mode !== "login" ? "auth-swipe-copy auth-learning-copy auth-return-copy is-visible" : "auth-swipe-copy auth-learning-copy auth-return-copy"} aria-hidden={mode === "login"}>
            <div className="auth-learning-art" aria-hidden="true">
              <span className="auth-learning-art-orbit" />
              <span className="auth-learning-art-book">{mode === "forgot" ? <KeyRound size={60} strokeWidth={1.6} /> : <GraduationCap size={60} strokeWidth={1.6} />}</span>
              <span className="auth-learning-art-spark"><Sparkles size={25} strokeWidth={2} /></span>
              <span className="auth-learning-art-dot" />
            </div>
            <p className="auth-grade-pill">{mode === "forgot" ? <><Sparkles size={16} strokeWidth={2} /> กู้คืนบัญชี</> : <><GraduationCap size={16} strokeWidth={2} /> สถาบันศรเสริมติวเตอร์ ขอนแก่น</>}</p>
            <h2 className="auth-learning-title">{mode === "tutorApply" ? <>ส่งต่อความรู้<br /><span>ไปด้วยกัน</span></> : mode === "forgot" ? <>กลับมาเรียนต่อ<br /><span>ได้อีกครั้ง</span></> : mode === "google" ? <>อีกนิดเดียว<br /><span>ก็พร้อมเรียน</span></> : <>พร้อมเรียนต่อ<br /><span>ไปด้วยกันไหม?</span></>}</h2>
            <p className="auth-swipe-description">{mode === "tutorApply" ? "กรอกประวัติและช่องทางติดต่อ ทีมงานจะพิจารณาใบสมัครของคุณ" : mode === "forgot" ? "ให้เจ้าหน้าที่ช่วยตรวจสอบบัญชี แล้วกลับมาเรียนต่อได้อีกครั้ง" : mode === "google" ? "เติมข้อมูลนักเรียนให้ครบ แล้วเริ่มเรียนรู้ไปด้วยกัน" : "บทเรียนที่สนใจยังรออยู่ เข้าสู่ระบบแล้วกลับไปเรียนต่อกัน"}</p>
            <button type="button" onClick={() => switchMode("login")} tabIndex={mode !== "login" ? 0 : -1}><ArrowLeft size={16} /> {mode === "forgot" ? "กลับไปเข้าสู่ระบบ" : mode === "google" ? "ยกเลิก" : "เข้าสู่ระบบ"}</button>
          </div>
          <BookOpen className="auth-swipe-book" size={210} strokeWidth={0.7} aria-hidden="true" />
        </aside>
      </div>
    </main>
  );
}

export default Login;
