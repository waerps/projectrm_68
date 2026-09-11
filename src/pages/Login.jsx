import { API_URL } from "../config";
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Eye, EyeOff } from "lucide-react";

// รายการรูปภาพสำหรับสไลด์
const images = [
  "/img333.jpg",
  "/444.jpg",
  "/555.jpg",
];

export function Login() {
  const [role, setRole] = useState("user"); // user | admin
  const [currentImage, setCurrentImage] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotForm, setForgotForm] = useState({ username: '', phoneNo: '' });
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

  // 2. สร้าง State สำหรับเก็บค่าที่พิมพ์ในฟอร์ม
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const navigate = useNavigate(); // เรียกใช้ hook สำหรับเปลี่ยนหน้า
  const location = useLocation();

  // ตั้งเวลาเปลี่ยนรูปภาพอัตโนมัติ
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 4000);

    return () => clearInterval(slideInterval);
  }, []);

  // ฟังก์ชันเก็บค่าจาก Input ลง State
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 3. ฟังก์ชันเมื่อกดปุ่ม "เข้าสู่ระบบ"
  const handleSubmit = async (e) => {
    e.preventDefault();

    const endpoint = role === "user"
      ? `${API_URL}/auth/login`
      : `${API_URL}/auth/login-admin`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {

        localStorage.setItem("student_token", data.token);
        localStorage.setItem("user_role", data.user?.roleId || "student");

        localStorage.setItem("user", JSON.stringify(data.user));

        // ★ "จำฉันไว้ในระบบ" — ถ้าไม่ติ๊ก ให้ session หมดอายุเมื่อปิดเบราว์เซอร์/แท็บไปจริง ๆ
        //   (เดิมติ๊กหรือไม่ก็ไม่มีผลอะไรเลย เพราะ token เก็บใน localStorage ซึ่งไม่มีวันหมดอายุเอง)
        //   วิธีเช็ค: sessionStorage จะหายไปเองเมื่อปิดแท็บ/เบราว์เซอร์ (ต่างจาก localStorage)
        //   จึงใช้เป็นตัวบอกว่า "แท็บนี้ยังเป็น session เดิมอยู่ไหม" — ดูจุดตรวจสอบจริงที่ main.jsx
        localStorage.setItem("remember_me", rememberMe ? "true" : "false");
        sessionStorage.setItem("session_active", "1");

        if (role === "user") {
          const returnTo = location.state?.returnTo || "/";
          navigate(returnTo, { replace: true, state: { openCheckout: Boolean(location.state?.openCheckout) } });
        } else {
          if (data.user.roleId === 1) {
            navigate("/admin");
          } else if (data.user.roleId === 2) {
            navigate("/tutor");
          } else {
            navigate("/");
          }
        }
      } else {
        alert(data.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
  };

  // ฟังก์ชันขอรีเซ็ตรหัสผ่าน — ยืนยันตัวตนด้วยเบอร์โทรที่มีอยู่ในระบบ แล้วส่งคำขอไปหาแอดมิน
  // (ระบบนี้ไม่มี email/SMS ให้รีเซ็ตเอง ดู routes/auth.routes.js POST /forgot-password)
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotForm.username || !forgotForm.phoneNo) {
      alert("กรุณากรอกชื่อผู้ใช้และเบอร์โทรศัพท์");
      return;
    }
    setForgotSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...forgotForm, role }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "ส่งคำขอไปหาแอดมินแล้ว กรุณารอแอดมินติดต่อกลับ");
        setShowForgotModal(false);
        setForgotForm({ username: '', phoneNo: '' });
      } else {
        alert(data.message || "ส่งคำขอไม่สำเร็จ");
      }
    } catch (error) {
      console.error("Forgot Password Error:", error);
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setForgotSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-gray-50/50 p-4">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200 rounded-full blur-3xl opacity-20 animate-pulse -z-10"></div>

      <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-gray-100">
        <button type="button" onClick={() => navigate("/")} className="absolute right-4 top-4 z-30 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-gray-500 shadow-md backdrop-blur transition hover:bg-white hover:text-orange-500" aria-label="ปิดและกลับหน้า Home" title="กลับหน้า Home">
          <X className="h-5 w-5" />
        </button>

        {/* ================= Left Section (Slider + Buttons) ================= แก้รอบแรกไม่ไป */}
        <div className="hidden md:flex flex-col relative"> 

          {/* ส่วนแสดงรูปภาพสไลด์ */}
          <div className="relative overflow-hidden group" style={{ height: "400px" }}>
            <div
              className="flex h-full w-full transition-transform duration-1000 ease-in-out"
              style={{ transform: `translateX(-${currentImage * 100}%)` }}
            >
              {images.map((src, index) => (   // ✅ ต้องมี .map() ตรงนี้
                <img
                  key={index}
                  src={src}
                  alt={`Slide ${index + 1}`}
                  className="min-w-full w-full h-full object-cover flex-shrink-0"
                  style={{ minWidth: "100%" }}
                />
              ))}
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-orange-900/70 via-transparent to-transparent" />

            <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2 z-10">
              {images.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${currentImage === index ? "bg-white w-6" : "bg-white/50 w-2"
                    }`}
                />
              ))}
            </div>
          </div>

          {/* ปุ่มสลับ Role */}
          <div className="p-6 bg-white border-t border-orange-100 z-10">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setRole("user")}
                className={`flex-1 py-3 rounded-xl font-bold transition-all duration-300 border-2 ${role === "user"
                  ? "bg-orange-500 text-white border-orange-500 shadow-lg scale-105"
                  : "bg-white text-gray-500 border-gray-100 hover:border-orange-200 hover:text-orange-500"
                  }`}
              >
                นักเรียน
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`flex-1 py-3 rounded-xl font-bold transition-all duration-300 border-2 ${role === "admin"
                  ? "bg-gray-800 text-white border-gray-800 shadow-lg scale-105"
                  : "bg-white text-gray-500 border-gray-100 hover:border-gray-400 hover:text-gray-700"
                  }`}
              >
                ผู้ดูแลระบบ
              </button>
            </div>
          </div>
        </div>

        {/* ================= Right Form Section ================= */}
        <div className="flex flex-col justify-center px-8 md:px-16 py-12 transition-all duration-500 bg-white">

          <h2 className="text-3xl font-bold text-orange-500 mb-2 md:hidden">
            เข้าสู่ระบบ
          </h2>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800">
              {role === "user" ? "เข้าสู่ระบบนักเรียน" : "เข้าสู่ระบบติวเตอร์และ Admin"}
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              {role === "user"
                ? "ยินดีต้อนรับเข้าสู่ระบบการเรียนรู้ออนไลน์"
                : "เฉพาะติวเตอร์และเจ้าหน้าที่ผู้มีสิทธิ์เข้าถึงเท่านั้น"}
            </p>
          </div>

          {/* Form เชื่อมต่อกับ handleSubmit */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 ml-1">
                {role === "user" ? "ชื่อผู้ใช้" : "ชื่อติวเตอร์ / ชื่อผู้ดูแลระบบ"}
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}     // Bind ค่า
                onChange={handleChange}       // รับค่าเมื่อพิมพ์
                placeholder={role === "user" ? "กรอกชื่อผู้ใช้ของคุณ" : "กรอกรหัส Admin"}
                className="w-full px-5 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 ml-1">รหัสผ่าน</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}     // Bind ค่า
                  onChange={handleChange}       // รับค่าเมื่อพิมพ์
                  placeholder="กรอกรหัสผ่าน"
                  className="w-full px-5 py-3 pr-11 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-orange-500 w-4 h-4"
                />
                จำฉันไว้ในระบบ
              </label>
              <button
                type="button"
                onClick={() => { setForgotForm({ username: formData.username, phoneNo: '' }); setShowForgotModal(true); }}
                className="text-orange-500 hover:underline"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>

            <button
              type="submit"
              className={`w-full py-3.5 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1 ${role === "user"
                ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-orange-200"
                : "bg-gray-800 hover:shadow-gray-400"
                }`}
            >
              {role === "user" ? "เข้าสู่ระบบ" : "เข้าสู่ระบบ Admin"}
            </button>
          </form>

          {role === "user" && (
            <p className="text-center text-sm text-gray-500 mt-8">
              ยังไม่มีบัญชีผู้ใช้?{" "}
              <a href="/register" className="text-orange-500 font-bold hover:underline">
                ลงทะเบียน
              </a>
            </p>
          )}
        </div>
      </div>

      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">ลืมรหัสผ่าน</h3>
              <button type="button" onClick={() => setShowForgotModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              กรอกชื่อผู้ใช้และเบอร์โทรศัพท์ที่ลงทะเบียนไว้ในระบบ เพื่อยืนยันตัวตน — ระบบจะแจ้งไปหาแอดมินให้ตั้งรหัสผ่านใหม่ให้ แล้วแจ้งกลับมาหาคุณอีกครั้ง
            </p>
            <form onSubmit={handleForgotSubmit} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 ml-1">ชื่อผู้ใช้</label>
                <input
                  type="text"
                  value={forgotForm.username}
                  onChange={(e) => setForgotForm((f) => ({ ...f, username: e.target.value }))}
                  placeholder="กรอกชื่อผู้ใช้"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 ml-1">เบอร์โทรศัพท์ที่ลงทะเบียนไว้</label>
                <input
                  type="tel"
                  value={forgotForm.phoneNo}
                  onChange={(e) => setForgotForm((f) => ({ ...f, phoneNo: e.target.value }))}
                  placeholder="0xx-xxx-xxxx"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={forgotSubmitting}
                className="w-full py-3 rounded-xl text-white font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-orange-200 shadow-lg transition-all disabled:opacity-50"
              >
                {forgotSubmitting ? "กำลังส่งคำขอ..." : "ส่งคำขอไปหาแอดมิน"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
