import { API_URL } from "../config";
import React, { useState } from 'react';
import { formatPhone, formatGPA } from "../utils/format";
import { useToast } from "../components/useToast";
import { ToastContainer } from "../components/Toast";
import { Eye, EyeOff } from "lucide-react";

export function Register() {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    nickname: '',
    phoneNo: '',
    schoolName: '',
    lineId: '',
    birthOfDate: '',
    remark: '',
    username: '',
    password: '',
    confirmPassword: '',
    gpa: '',
    parentId: '',
    gradeLevelId: '',
    genderId: ''
  });

  const [pdpaAcknowledged, setPdpaAcknowledged] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const { toasts, showToast, removeToast } = useToast();

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0] || null;
    setPhotoFile(file);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let nextValue = type === 'checkbox' ? checked : value;
    if (name === 'phoneNo') nextValue = formatPhone(nextValue);
    if (name === 'gpa') nextValue = formatGPA(nextValue);
    setFormData({
      ...formData,
      [name]: nextValue
    });
  };

const handleSubmit = async (e) => {
    // ป้องกันปุ่ม submit ทำงานซ้ำซ้อน (ถ้าใส่ใน form tag)
    if(e) e.preventDefault(); 

    // 1. Validation เบื้องต้น
    if (!formData.firstname || !formData.lastname || !formData.username || !formData.password) {
      showToast('error', 'กรอกข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ที่มีเครื่องหมาย *)');
      return;
    }

    if (!formData.gradeLevelId) {
      showToast('error', 'ยังไม่ได้เลือกระดับชั้น', 'กรุณาเลือกระดับชั้นก่อนสมัครสมาชิก');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showToast('error', 'รหัสผ่านไม่ตรงกัน', 'กรุณาตรวจสอบรหัสผ่านและยืนยันรหัสผ่านอีกครั้ง');
      return;
    }

    if (!pdpaAcknowledged) {
      showToast('error', 'กรุณารับทราบข้อมูลก่อน', 'กรุณาติ๊กรับทราบเรื่องการเก็บและใช้ข้อมูลก่อนลงทะเบียน');
      return;
    }

    try {
      // 2. ส่งข้อมูลไปที่ Backend — ใช้ FormData แทน JSON เพราะรองรับแนบรูปโปรไฟล์ (ไม่บังคับ) ด้วย
      const fd = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        fd.append(key, value ?? '');
      });
      if (photoFile) fd.append('photo', photoFile);

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        body: fd,
      });

      const data = await response.json();

      if (response.ok) {
        // 3. กรณีสำเร็จ
        showToast('success', 'ลงทะเบียนสำเร็จ', 'กำลังพาท่านไปหน้าเข้าสู่ระบบ...');
        // หน่วงสักครู่ให้เห็น toast ก่อนค่อยเด้งไปหน้า login (เดิมใช้ alert ซึ่งบล็อกจน user กดปิดเอง)
        setTimeout(() => { window.location.href = '/login'; }, 1200);
      } else {
        // 4. กรณี Error (เช่น Username ซ้ำ)
        showToast('error', 'ลงทะเบียนไม่สำเร็จ', data.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
      }

    } catch (error) {
      console.error('Error:', error);
      showToast('error', 'เชื่อมต่อไม่สำเร็จ', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    }
  };

  return (
    <div className="min-h-screen  via-white to-orange-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {/* Background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200 rounded-full blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-300 rounded-full blur-3xl opacity-15 animate-pulse" style={{animationDelay: '1s'}}></div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600 mb-3">
            ลงทะเบียนผู้ใช้งาน
          </h1>
          <p className="text-gray-600 text-lg">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อสร้างบัญชีผู้ใช้งาน</p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 backdrop-blur-lg border border-gray-100">
          <div className="space-y-8">
            {/* ข้อมูลส่วนตัว */}
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                ข้อมูลส่วนตัว
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ชื่อ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstname"
                    value={formData.firstname}
                    onChange={handleChange}
                    placeholder="กรอกชื่อ"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100 outline-none focus:border-orange-500 focus:bg-white transition-all duration-300 text-gray-700"
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastname"
                    value={formData.lastname}
                    onChange={handleChange}
                    placeholder="กรอกนามสกุล"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100 outline-none focus:border-orange-500 focus:bg-white transition-all duration-300 text-gray-700"
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ชื่อเล่น
                  </label>
                  <input
                    type="text"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    placeholder="กรอกชื่อเล่น"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100 outline-none focus:border-orange-500 focus:bg-white transition-all duration-300 text-gray-700"
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    เพศ
                  </label>
                  <select
                    name="genderId"
                    value={formData.genderId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100 outline-none focus:border-orange-500 focus:bg-white transition-all duration-300 text-gray-700"
                  >
                    <option value="">เลือกเพศ</option>
                    <option value="1">ชาย</option>
                    <option value="2">หญิง</option>
                    <option value="3">ไม่ระบุ</option>
                  </select>
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    วันเกิด
                  </label>
                  <input
                    type="date"
                    name="birthOfDate"
                    value={formData.birthOfDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100 outline-none focus:border-orange-500 focus:bg-white transition-all duration-300 text-gray-700"
                  />
                </div>
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    name="phoneNo"
                    value={formData.phoneNo}
                    onChange={handleChange}
                    placeholder="0xx-xxx-xxxx"
                    maxLength={12}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100 outline-none focus:border-orange-500 focus:bg-white transition-all duration-300 text-gray-700"
                  />
                </div>

                <div className="group md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    รูปโปรไฟล์ (ถ้าอยากใส่ตอนนี้ ไม่บังคับ)
                  </label>
                  <div className="flex items-center gap-4">
                    {photoPreview && (
                      <img
                        src={photoPreview}
                        alt="ตัวอย่างรูปโปรไฟล์"
                        className="h-16 w-16 rounded-full object-cover border-2 border-orange-200"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="block text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-orange-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ข้อมูลการศึกษา */}
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                ข้อมูลการศึกษา
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    โรงเรียน
                  </label>
                  <input
                    type="text"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleChange}
                    placeholder="กรอกชื่อโรงเรียน"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100 outline-none focus:border-orange-500 focus:bg-white transition-all duration-300 text-gray-700"
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ระดับชั้น <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gradeLevelId"
                    value={formData.gradeLevelId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100 outline-none focus:border-orange-500 focus:bg-white transition-all duration-300 text-gray-700"
                  >
                    <option value="">เลือกระดับชั้น</option>
                    <option value="1">ประถมศึกษาปีที่ 1</option>
                    <option value="2">ประถมศึกษาปีที่ 2</option>
                    <option value="3">ประถมศึกษาปีที่ 3</option>
                    <option value="4">ประถมศึกษาปีที่ 4</option>
                    <option value="5">ประถมศึกษาปีที่ 5</option>
                    <option value="6">ประถมศึกษาปีที่ 6</option>
                    <option value="7">มัธยมศึกษาปีที่ 1</option>
                    <option value="8">มัธยมศึกษาปีที่ 2</option>
                    <option value="9">มัธยมศึกษาปีที่ 3</option>
                    <option value="10">มัธยมศึกษาปีที่ 4</option>
                    <option value="11">มัธยมศึกษาปีที่ 5</option>
                    <option value="12">มัธยมศึกษาปีที่ 6</option>
                  </select>
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    เกรดเฉลี่ย (GPA)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    name="gpa"
                    value={formData.gpa}
                    onChange={handleChange}
                    onBlur={(e) => {
                      if (!e.target.value) return;
                      let n = parseFloat(e.target.value);
                      if (isNaN(n)) return setFormData((f) => ({ ...f, gpa: '' }));
                      n = Math.min(4, Math.max(0, n));
                      setFormData((f) => ({ ...f, gpa: n.toFixed(2) }));
                    }}
                    placeholder="0.00 - 4.00"
                    maxLength={4}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100 outline-none focus:border-orange-500 focus:bg-white transition-all duration-300 text-gray-700"
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    รหัสผู้ปกครอง
                  </label>
                  <input
                    type="text"
                    name="parentId"
                    value={formData.parentId}
                    onChange={handleChange}
                    placeholder="กรอกรหัสผู้ปกครอง (ถ้ามี)"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100 outline-none focus:border-orange-500 focus:bg-white transition-all duration-300 text-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* ข้อมูลติดต่อ */}
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                ข้อมูลติดต่อและอื่นๆ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Line ID
                  </label>
                  <input
                    type="text"
                    name="lineId"
                    value={formData.lineId}
                    onChange={handleChange}
                    placeholder="กรอก Line ID"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100 outline-none focus:border-orange-500 focus:bg-white transition-all duration-300 text-gray-700"
                  />
                </div>

                <div className="group md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    หมายเหตุ
                  </label>
                  <textarea
                    name="remark"
                    value={formData.remark}
                    onChange={handleChange}
                    placeholder="กรอกหมายเหตุเพิ่มเติม (ถ้ามี)"
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100 outline-none focus:border-orange-500 focus:bg-white transition-all duration-300 text-gray-700 resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* ข้อมูลบัญชีผู้ใช้ */}
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                ข้อมูลบัญชีผู้ใช้
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="group md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ชื่อผู้ใช้ (Username) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="กรอกชื่อผู้ใช้"
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100 outline-none focus:border-orange-500 focus:bg-white transition-all duration-300 text-gray-700"
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    รหัสผ่าน <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="กรอกรหัสผ่าน"
                      className="w-full px-4 py-3 pr-11 bg-gray-50 rounded-xl border-2 border-gray-100 outline-none focus:border-orange-500 focus:bg-white transition-all duration-300 text-gray-700"
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

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="กรอกรหัสผ่านอีกครั้ง"
                      className="w-full px-4 py-3 pr-11 bg-gray-50 rounded-xl border-2 border-gray-100 outline-none focus:border-orange-500 focus:bg-white transition-all duration-300 text-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showConfirmPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* PDPA — ข้อความแจ้งการเก็บ/ใช้ข้อมูล (ประกาศเฉย ๆ ไม่มีการขอความยินยอมที่หน้านี้) */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="rounded-xl bg-orange-50 border border-orange-100 p-4">
                <p className="text-xs text-gray-600 leading-relaxed">
                  สถาบันจะเก็บและใช้ข้อมูลที่ท่านกรอกในหน้านี้ เพื่อจัดการบัญชีผู้เรียนและการเรียนการสอนเท่านั้น
                  ส่วนข้อมูลอื่นที่อาจกระทบความเป็นส่วนตัวมากกว่านี้ เช่น การบันทึกพฤติกรรมระหว่างทำข้อสอบ
                  ระบบจะขอความยินยอมจากท่านแยกต่างหากอีกครั้งก่อนชำระเงินซื้อคอร์สเรียน โดยจะถามเพียงครั้งเดียวเท่านั้น
                </p>
                <label className="mt-3 flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pdpaAcknowledged}
                    onChange={(e) => setPdpaAcknowledged(e.target.checked)}
                    className="mt-0.5 accent-orange-500 w-4 h-4 shrink-0"
                  />
                  <span className="text-xs font-semibold text-gray-700">
                    ข้าพเจ้ารับทราบเรื่องการเก็บและใช้ข้อมูลข้างต้นแล้ว <span className="text-red-500">*</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="border-t border-gray-200 pt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleSubmit}
                disabled={!pdpaAcknowledged}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-lg"
              >
                ลงทะเบียน
              </button>
              <button
                onClick={() => window.history.back()}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl transition-all duration-300"
              >
                ยกเลิก
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center text-gray-600">
              มีบัญชีผู้ใช้อยู่แล้วใช่ไหม?{' '}
              <button
                type="button"
                onClick={() => { window.location.href = '/login'; }}
                className="text-orange-500 hover:text-orange-600 font-bold hover:underline transition-all"
              >
                เข้าสู่ระบบ
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>หมายเหตุ: ข้อมูลที่มีเครื่องหมาย <span className="text-red-500">*</span> จำเป็นต้องกรอก</p>
        </div>
      </div>
    </div>
  );
}

export default Register