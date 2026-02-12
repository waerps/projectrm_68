import React from "react";

// ================= Login Page =================
export function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center ">
    <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200 rounded-full blur-3xl opacity-20 animate-pulse"></div>
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-gray-100">
        {/* Left Image Section */}
        
        <div className="relative hidden md:block">
          <img
            src="/img333.jpg"
            alt="students"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-orange-500/80" />
          <div className="absolute top-0 left-0 w-full h-full p-10 flex items-start">
            <h1 className="text-white text-4xl font-bold">เข้าสู่ระบบ</h1>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="flex flex-col justify-center px-8 md:px-16 py-12">
          <h2 className="text-3xl font-bold text-orange-500 mb-8 md:hidden">
            เข้าสู่ระบบ
          </h2>

          <form className="space-y-6">
            <input
              type="text"
              name="username"
              placeholder="ชื่อผู้ใช้ (Username)"
              className="w-full px-5 py-3 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />

            <input
              type="password"
              name="password"
              placeholder="รหัสผ่าน (Password)"
              className="w-full px-5 py-3 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600">
                <input type="checkbox" className="accent-orange-500" />
                จำฉันไว้ในระบบ
              </label>
              <a href="#" className="text-orange-500 hover:underline">
                ลืมรหัสผ่าน?
              </a>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-orange-500 text-white font-semibold hover:bg-orange-600 transition"
            >
              เข้าสู่ระบบ
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ยังไม่มีบัญชีผู้ใช้?{" "}
            <a href="/register" className="text-orange-500 hover:underline">
              ลงทะเบียน
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
export default Login