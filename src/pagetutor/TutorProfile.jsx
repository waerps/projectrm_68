import { API_URL } from "../config";
import InitialAvatar from "../components/ui/InitialAvatar";
import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { Phone, Pencil, Save, X, AlertTriangle, Users, Clock, ImagePlus, Landmark, Trash2 } from "lucide-react"
import { toast, confirmDialog } from "../components/ui/dialogs";
import Spinner from "../components/ui/Spinner";
import ErrorState from "../components/ui/ErrorState";
import { BTN } from "../components/ui/tokens";
import { readSessionCache, writeSessionCache } from "../utils/sessionCache";
import { birthDateMax } from "../utils/birthDateInput";

// แคชโปรไฟล์ในแท็บนี้ (ไม่เก็บข้อมูลบัญชีธนาคาร) — เปิดหน้าซ้ำจะเห็นชื่อ/รายละเอียดทันที
const PROFILE_CACHE = "tutor-profile";
const BANK_FIELDS = ["bankName", "bankAccount", "bankAccountName"];


export default function TutorProfile() {
    const fileInputRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(() => !readSessionCache(PROFILE_CACHE))
    // true เมื่อได้ข้อมูลจริงจากเซิร์ฟเวอร์แล้ว — ก่อนหน้านั้น (แสดงจากแคช) ยังไม่ให้กดแก้ไข
    const [isFresh, setIsFresh] = useState(false)
    const [loadError, setLoadError] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [alertModal, setAlertModal] = useState({ show: false, fields: [] })
    const TUTOR_ID = JSON.parse(localStorage.getItem("user"))?.id;
    // (แก้บั๊ก) เดิมไม่แนบ token เลย ตอนนี้ backend (/api/tutor/:id ฯลฯ) ต้อง login
    // ก่อนแล้ว ถ้าไม่แนบ Authorization header จะโดน 401 ทันที
    const token = localStorage.getItem("student_token");

    const [formData, setFormData] = useState(() => readSessionCache(PROFILE_CACHE) || {
        firstname: "", lastname: "", nickname: "", phone: "",
        lineId: "", birthDate: "", occupation: "",
        emergencyName: "", emergencyPhone: "",
        studentCount: 0, experience: 0, subjects: [], photo: null,
        bankName: "", bankAccount: "", bankAccountName: ""
    })
    const [originalData, setOriginalData] = useState({})

    useEffect(() => {
        const fetchTutorData = async () => {
            setLoadError(false);
            try {
                const response = await axios.get(`${API_URL}/api/tutor/${TUTOR_ID}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const dbData = response.data;
                const mappedData = {
                    firstname: dbData.Firstname || "",
                    lastname: dbData.Lastname || "",
                    nickname: dbData.Nickname || "",
                    phone: dbData.PhoneNo || "",
                    lineId: dbData.LineID || "",
                    birthDate: dbData.BirthOfDate ? dbData.BirthOfDate.split('T')[0] : "",
                    occupation: dbData.Occupation || "",
                    emergencyName: dbData.EmergencyContactName || "",
                    emergencyPhone: dbData.EmergencyContactPhoneNo || "",
                    studentCount: dbData.StudentCount || 0,
                    ratePerTutors: dbData.RatePerTutors || 0,
                    institutionRates: dbData.institutionRates || null,
                    singleCourseRates: Array.isArray(dbData.singleCourseRates) ? dbData.singleCourseRates : [],
                    subjects: dbData.Subjects ? dbData.Subjects.split(', ') : ["ยังไม่มีรายวิชา"],
                    experience: dbData.ExperienceYear || 1,
                    photo: dbData.Photo || null,
                    bankName: dbData.BankName || "",
                    bankAccount: dbData.BankAccountNumber || "",
                    bankAccountName: dbData.BankAccountName || ""
                }
                setFormData(mappedData);
                setOriginalData(mappedData);
                setIsLoading(false);
                setIsFresh(true);
                writeSessionCache(PROFILE_CACHE, Object.fromEntries(Object.entries(mappedData).filter(([k]) => !BANK_FIELDS.includes(k))));
            } catch (error) {
                console.error("Error:", error);
                setLoadError(true);
                setIsLoading(false);
            }
        };
        fetchTutorData();
    }, [TUTOR_ID, token]);

    // ให้รูปมุมขวาบน (navbar) เปลี่ยนตามทันที ไม่ต้องรีเฟรช/ล็อกอินใหม่
    const syncNavbarPhoto = (photo) => {
        try {
            const u = JSON.parse(localStorage.getItem("user") || "null");
            if (u) { localStorage.setItem("user", JSON.stringify({ ...u, photo })); window.dispatchEvent(new Event("user-updated")); }
        } catch { /* ignore */ }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const data = new FormData();
        data.append('profileImage', file);
        try {
            const res = await axios.post(`${API_URL}/api/tutor/${TUTOR_ID}/upload-profile`, data, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            });
            setFormData(prev => ({ ...prev, photo: res.data.imageUrl }));
            setOriginalData(prev => (prev ? { ...prev, photo: res.data.imageUrl } : prev));
            syncNavbarPhoto(res.data.imageUrl);
            toast("อัปโหลดรูปสำเร็จ");
        } catch (error) {
            console.error(error);
            toast("อัปโหลดไม่สำเร็จ: " + (error.response?.data?.message || "กรุณาลองใหม่อีกครั้ง"));
        } finally {
            e.target.value = "";
        }
    };

    const handleDeletePhoto = async () => {
        if (!await confirmDialog("ลบรูปโปรไฟล์? ระบบจะแสดงตัวอักษรย่อของชื่อแทน", { title: "ลบรูปโปรไฟล์", confirmText: "ลบรูป", danger: true })) return;
        try {
            await axios.delete(`${API_URL}/api/tutor/${TUTOR_ID}/delete-profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFormData(prev => ({ ...prev, photo: null }));
            setOriginalData(prev => (prev ? { ...prev, photo: null } : prev));
            syncNavbarPhoto(null);
            toast("ลบรูปโปรไฟล์แล้ว", "success");
        } catch (error) {
            console.error(error);
            toast("ลบรูปไม่สำเร็จ: " + (error.response?.data?.message || "กรุณาลองใหม่อีกครั้ง"), "error");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSave = async () => {
        const requiredFields = {
            firstname: 'ชื่อ',
            lastname: 'นามสกุล',
            nickname: 'ชื่อเล่น',
            phone: 'เบอร์โทรศัพท์',
            lineId: 'Line ID',
            birthDate: 'วันเกิด',
            occupation: 'อาชีพ',
            emergencyName: 'ชื่อผู้ติดต่อฉุกเฉิน',
            emergencyPhone: 'เบอร์โทรฉุกเฉิน',
        }

        const emptyFields = Object.entries(requiredFields)
            .filter(([key]) => !formData[key] || formData[key].trim() === '')
            .map(([, label]) => label)

        if (emptyFields.length > 0) {
            setAlertModal({ show: true, fields: emptyFields })
            return
        }

        // ถามยืนยันก่อนบันทึก พร้อมบอกว่าแก้ช่องไหนไปบ้าง (เบอร์โทร/บัญชีธนาคารแอดมินใช้ติดต่อและโอนเงิน)
        const FIELD_LABELS = {
            firstname: 'ชื่อ', lastname: 'นามสกุล', nickname: 'ชื่อเล่น', birthDate: 'วันเกิด', occupation: 'อาชีพ',
            phone: 'เบอร์โทรศัพท์', lineId: 'Line ID', bankName: 'ธนาคาร', bankAccount: 'เลขที่บัญชี',
            bankAccountName: 'ชื่อบัญชี', emergencyName: 'ชื่อผู้ติดต่อฉุกเฉิน', emergencyPhone: 'เบอร์โทรฉุกเฉิน',
        }
        const changed = Object.keys(formData)
            .filter((k) => k !== 'photo' && String(formData[k] ?? '') !== String(originalData?.[k] ?? ''))
            .map((k) => FIELD_LABELS[k] || k)
        if (changed.length === 0) {
            setIsEditing(false)
            toast('ไม่มีข้อมูลที่เปลี่ยนแปลง', 'warning')
            return
        }
        const ok = await confirmDialog(
            `บันทึกการแก้ไขโปรไฟล์?\nช่องที่แก้: ${changed.join(', ')}`,
            { title: 'ยืนยันการบันทึก', confirmText: 'บันทึก', cancelText: 'กลับไปแก้ต่อ', danger: false }
        )
        if (!ok) return

        setIsSaving(true)
        try {
            await axios.put(`${API_URL}/api/tutor/${TUTOR_ID}`, formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setOriginalData(formData);
            setIsEditing(false);
            toast('บันทึกโปรไฟล์แล้ว', 'success');
        } catch (error) {
            toast('บันทึกโปรไฟล์ไม่สำเร็จ: ' + (error.response?.data?.message || 'กรุณาลองใหม่อีกครั้ง'), 'error');
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        setFormData(originalData)
        setIsEditing(false)
    }

    // key แยกตัวโหลดกับหน้าจริง — เดิม React นำ <div> ของตัวโหลดกลางจอมาใช้เป็นเนื้อหา ทำให้ทั้งหน้ากระโดดขึ้น (CLS)
    if (isLoading) return (
        <div key="profile-loading"><Spinner block label="กำลังโหลดข้อมูลโปรไฟล์..." wrapperClassName="min-h-screen" /></div>
    );
    if (loadError) return <div className="px-4 lg:px-0"><ErrorState description="โหลดข้อมูลโปรไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" /></div>

    return (
        <div key="profile-content" className="space-y-6 px-4 lg:px-0">
            <div className="">

                {/* ── Edit Mode Banner ── */}
                {isEditing && (
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-orange-400 px-4 sm:px-5 py-3 shadow-md">
                        <div className="flex flex-wrap items-center gap-2.5 text-white">
                            <Pencil className="h-4 w-4" />
                            <span className="font-semibold text-sm">กำลังแก้ไขข้อมูล</span>
                            <span className="text-orange-200 text-xs">— กรอกข้อมูลให้ครบแล้วกดบันทึก</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCancel}
                                className="flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-4 py-1.5 text-sm text-white font-medium hover:bg-white/20 transition"
                            >
                                <X className="h-3.5 w-3.5" />
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-1.5 text-sm text-orange-700 font-bold hover:bg-orange-50 transition shadow-sm disabled:opacity-60"
                            >
                                <Save className="h-3.5 w-3.5" />
                                {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Profile Header Card ── */}
                <div className="mb-6 overflow-hidden rounded-2xl shadow-sm">
                    <div className="bg-gradient-to-br from-orange-500 to-orange-300 p-5 sm:p-8 md:p-10">
                        <div className="flex flex-col gap-4 sm:gap-8 md:flex-row md:items-center">

                            {/* รูปโปรไฟล์ */}
                            <div className="relative shrink-0 mx-auto md:mx-0">
                                <div className="relative h-24 w-24 sm:h-36 sm:w-36 md:h-40 md:w-40 overflow-hidden rounded-2xl border-4 border-white/80 shadow-2xl bg-white/30">
                                    <InitialAvatar photo={formData.photo} name={formData.firstname} alt="รูปโปรไฟล์ติวเตอร์"
                                        className="h-full w-full !bg-transparent !text-white" textClassName="text-5xl" />
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                </div>
                                <button aria-label="เปลี่ยนรูป"
                                    onClick={() => fileInputRef.current.click()}
                                    className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-orange-500 shadow-lg hover:scale-110 transition-transform border-2 border-orange-100"
                                >
                                    <ImagePlus className="h-4.5 w-4.5" />
                                </button>
                                {formData.photo && (
                                    <button aria-label="ลบรูปโปรไฟล์" title="ลบรูปโปรไฟล์"
                                        onClick={handleDeletePhoto}
                                        className="absolute -top-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-500 shadow-lg hover:scale-110 transition-transform border-2 border-red-100"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {/* ชื่อ + สถิติ */}
                            <div className="flex-1 space-y-3 text-center md:text-left text-white">
                                <div>
                                    {isEditing ? (
                                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                            <input
                                                name="firstname"
                                                value={formData.firstname}
                                                onChange={handleChange}
                                                placeholder="ชื่อ"
                                                className="rounded-xl px-3 h-10 text-slate-800 text-lg font-semibold w-36 outline-none border border-transparent focus:border-orange-400 bg-white shadow-sm transition"
                                            />
                                            <input
                                                name="lastname"
                                                value={formData.lastname}
                                                onChange={handleChange}
                                                placeholder="นามสกุล"
                                                className="rounded-xl px-3 h-10 text-slate-800 text-lg font-semibold w-40 outline-none border border-transparent focus:border-orange-400 bg-white shadow-sm transition"
                                            />
                                        </div>
                                    ) : (
                                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">
                                            {formData.firstname} {formData.lastname}
                                        </h1>
                                    )}
                                    <p className="text-lg opacity-80 mt-0.5">({formData.nickname})</p>
                                </div>
                                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                    {formData.subjects.map((sub, i) => (
                                        <span key={i} className="rounded-full bg-white/20 backdrop-blur-sm px-3 py-0.5 text-sm border border-white/30">
                                            {sub}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex flex-wrap justify-center md:justify-start gap-2 sm:gap-5 text-sm font-medium">
                                    <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                                        <Users className="h-4 w-4" />
                                        {formData.studentCount} นักเรียน
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
                                        <Clock className="h-4 w-4" />
                                        ประสบการณ์ {formData.experience} ปี
                                    </div>
                                </div>
                            </div>

                            {/* ปุ่มแก้ไข (เฉพาะตอนไม่ได้ edit) */}
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    disabled={!isFresh}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-orange-700 font-bold disabled:opacity-60 hover:bg-orange-50 shadow-lg transition-all text-sm shrink-0"
                                >
                                    <Pencil className="h-4 w-4" />
                                    แก้ไขข้อมูล
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Detail Cards ──
                    แถวบน: ข้อมูลส่วนตัว | ข้อมูลติดต่อ+ผู้ติดต่อฉุกเฉิน (5 แถวเท่ากันทั้งสองฝั่ง)
                    แถวล่าง: ค่าสอนและบัญชีรับเงิน เต็มความกว้าง แบ่งซ้าย-ขวาให้สูงเท่ากัน */}
                <div className="grid gap-5 md:grid-cols-2">

                    {/* ข้อมูลส่วนตัว */}
                    <SectionCard
                        title="ข้อมูลส่วนตัว"
                        icon={<Users className="h-4.5 w-4.5 text-orange-500" />}
                        isEditing={isEditing}
                    >
                        <InfoRow required label="ชื่อ" name="firstname" value={formData.firstname} isEditing={isEditing} onChange={handleChange} />
                        <InfoRow required label="นามสกุล" name="lastname" value={formData.lastname} isEditing={isEditing} onChange={handleChange} />
                        <InfoRow required label="ชื่อเล่น" name="nickname" value={formData.nickname} isEditing={isEditing} onChange={handleChange} />
                        <InfoRow required label="วันเกิด" name="birthDate" value={formData.birthDate} isEditing={isEditing} onChange={handleChange} type="date" max={birthDateMax()} />
                        <InfoRow required label="อาชีพ" name="occupation" value={formData.occupation} isEditing={isEditing} onChange={handleChange} />
                    </SectionCard>

                    {/* ข้อมูลติดต่อ + ผู้ติดต่อฉุกเฉิน รวมการ์ดเดียว ให้สูงเท่ากับการ์ดข้อมูลส่วนตัว */}
                    <SectionCard
                        title="ข้อมูลติดต่อ"
                        icon={<Phone className="h-4.5 w-4.5 text-orange-500" />}
                        isEditing={isEditing}
                    >
                        <InfoRow required label="เบอร์โทรศัพท์" name="phone" value={formData.phone} isEditing={isEditing} onChange={handleChange} />
                        <InfoRow required label="Line ID" name="lineId" value={formData.lineId} isEditing={isEditing} onChange={handleChange} />
                        <p className="flex items-center gap-1.5 pt-3 pb-1 text-xs font-bold text-red-600">
                            <AlertTriangle className="h-3.5 w-3.5" /> ผู้ติดต่อฉุกเฉิน
                        </p>
                        <InfoRow required label="ชื่อผู้ติดต่อ" name="emergencyName" value={formData.emergencyName} isEditing={isEditing} onChange={handleChange} />
                        <InfoRow required label="เบอร์โทรฉุกเฉิน" name="emergencyPhone" value={formData.emergencyPhone} isEditing={isEditing} onChange={handleChange} />
                    </SectionCard>

                    {/* ค่าสอนและบัญชีรับเงิน — เต็มความกว้าง */}
                    <div className="md:col-span-2">
                        <SectionCard
                            title="ค่าสอนและบัญชีรับเงิน"
                            icon={<Landmark className="h-4.5 w-4.5 text-orange-500" />}
                            isEditing={isEditing}
                        >
                            {/* วิธีคิดค่าสอนจริง: คอร์สรวม = เรทสถาบัน, คอร์สเดี่ยว = เรทที่ตั้งในแต่ละคอร์ส */}
                            <div className="grid gap-4 lg:grid-cols-2">
                                <InstitutionRatesBox institutionRates={formData.institutionRates} />
                                <div className="flex flex-col gap-4">
                                    <SingleCourseRatesBox singleCourseRates={formData.singleCourseRates || []} defaultSingleRate={formData.ratePerTutors} />
                                    <div className="flex-1 rounded-xl border border-slate-200 px-4 py-2">
                                        <p className="pt-2 text-sm font-bold text-slate-800">บัญชีรับเงิน</p>
                                        <InfoRow label="ธนาคาร" name="bankName" value={formData.bankName} isEditing={isEditing} onChange={handleChange} />
                                        <InfoRow label="เลขที่บัญชี" name="bankAccount" value={formData.bankAccount} isEditing={isEditing} onChange={handleChange} />
                                        <InfoRow label="ชื่อบัญชี" name="bankAccountName" value={formData.bankAccountName} isEditing={isEditing} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                            <p className="mt-4 text-xs text-slate-500 text-center">* เรทค่าสอนถูกกำหนดโดยฝ่ายบริหาร</p>
                        </SectionCard>
                    </div>
                </div>
            </div>
            {/* วางใต้สุดของ return ก่อนปิด div สุดท้าย */}
            {alertModal.show && (
                <ValidationModal
                    fields={alertModal.fields}
                    onClose={() => setAlertModal({ show: false, fields: [] })}
                />
            )}
        </div>
    )
}

// ── Section Card ──────────────────────────────────────────────
function SectionCard({ title, icon, children, isEditing }) {
    return (
        <div className={`rounded-2xl bg-white shadow-sm overflow-hidden border transition-all duration-200 ${isEditing ? 'border-orange-300 shadow-md' : 'border-slate-200'}`}>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                {icon}
                <h2 className="text-sm font-bold text-slate-800">{title}</h2>
            </div>
            <div className="p-5 space-y-0.5">
                {children}
            </div>
        </div>
    )
}

// ── Info Row ──────────────────────────────────────────────────
const rateRange = (t) => t.maxStudents == null ? `${t.minStudents} คนขึ้นไป` : t.minStudents === t.maxStudents ? `${t.minStudents} คน` : `${t.minStudents}–${t.maxStudents} คน`;

function InstitutionRatesBox({ institutionRates }) {
    const levels = [["elementary", "ประถม"], ["secondary", "มัธยม"]];
    return (
        <div className="flex h-full flex-col rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4">
            <p className="text-sm font-bold text-slate-800">คอร์สรวม: เรทสถาบัน</p>
            <p className="text-xs leading-5 text-slate-500">บาทต่อคาบ 1.5 ชม. ตามระดับชั้นของคอร์สและจำนวนนักเรียนที่มาเรียนจริง (คาบยาวกว่านี้คิดตามสัดส่วน)</p>
            {institutionRates ? (
                <table className="mt-3 w-full flex-1 text-sm">
                    <thead><tr className="text-xs text-slate-500"><th className="py-1.5 text-left font-semibold">นักเรียนที่มา</th>{levels.map(([k, l]) => <th key={k} className="py-1.5 text-right font-semibold">{l}</th>)}</tr></thead>
                    <tbody>
                        {institutionRates.elementary.map((tier, i) => (
                            <tr key={i} className="border-t border-orange-100">
                                <td className="py-2 text-slate-600">{rateRange(tier)}</td>
                                {levels.map(([k]) => <td key={k} className="py-2 text-right font-semibold tabular-nums text-orange-700">{Number(institutionRates[k][i]?.ratePerSession || 0).toLocaleString()} บาท</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : <p className="mt-3 text-xs text-slate-500">ไม่สามารถโหลดตารางเรทได้</p>}
        </div>
    );
}

const SINGLE_RATE_PREVIEW = 5;

function SingleCourseRatesBox({ singleCourseRates, defaultSingleRate }) {
    // สอนคอร์สเดี่ยวเยอะ: แสดง 5 รายการแรกก่อน ไม่ให้กล่องยืดยาวจนตารางเรทฝั่งซ้ายถูกยืดตาม
    const [showAll, setShowAll] = useState(false);
    const visible = showAll ? singleCourseRates : singleCourseRates.slice(0, SINGLE_RATE_PREVIEW);
    const hidden = singleCourseRates.length - SINGLE_RATE_PREVIEW;
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold text-slate-800">คอร์สเดี่ยว: เรทที่ตกลงในแต่ละคอร์ส</p>
            <p className="text-xs leading-5 text-slate-500">
                เรทตั้งต้นของคุณ {Number(defaultSingleRate) > 0 ? `${Number(defaultSingleRate).toLocaleString()} บาท/ชม.` : "ยังไม่ได้กำหนด"} — แต่ละคอร์สอาจต่างกันตามความยากง่าย
            </p>
            {singleCourseRates.length > 0 ? (
                <>
                <ul className={`mt-2 divide-y divide-slate-100 ${showAll ? "max-h-64 overflow-y-auto pr-1" : ""}`}>
                    {visible.map((c) => (
                        <li key={`${c.courseId}-${c.subjectName}`} className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
                            <span className="min-w-0 text-slate-600">{c.courseName}{c.subjectName ? ` · ${c.subjectName}` : ""}</span>
                            <span className={`shrink-0 font-semibold tabular-nums ${c.ratePerHour ? "text-slate-800" : "text-amber-700"}`}>{c.ratePerHour ? `${c.ratePerHour.toLocaleString()} บาท/ชม.` : "รอแอดมินตั้งเรท"}</span>
                        </li>
                    ))}
                </ul>
                {hidden > 0 && (
                    <button type="button" onClick={() => setShowAll(v => !v)}
                        className="mt-2 text-xs font-semibold text-orange-600 hover:text-orange-700">
                        {showAll ? "ย่อรายการ" : `ดูทั้งหมด (อีก ${hidden} คอร์ส)`}
                    </button>
                )}
                </>
            ) : <p className="mt-2 text-xs text-slate-400">ยังไม่มีคอร์สเดี่ยวที่สอนอยู่</p>}
        </div>
    );
}

function InfoRow({ label, required, value, name, isEditing, onChange, type = "text", max }) {
    return (
        <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] items-center py-3 border-b border-slate-50 last:border-0 min-h-[52px] gap-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}{required && isEditing && <span className="text-red-500 normal-case"> *</span>}</span>
            <div className="min-w-0 text-left">
                {isEditing ? (
                    <input
                        type={type}
                        name={name}
                        value={value}
                        max={max}
                        onChange={onChange}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 h-10 text-left text-sm text-slate-800 font-medium outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-400 transition-all"
                    />
                ) : (
                    <span className="text-sm font-semibold text-slate-800 break-words">{value || <span className="text-slate-300 font-normal">-</span>}</span>
                )}
            </div>
        </div>
    )
}

function ValidationModal({ fields, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden animate-in max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Icon + Title */}
                    <div className="flex flex-col items-center text-center mb-5">
                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
                            <AlertTriangle className="h-7 w-7 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">กรอกข้อมูลไม่ครบ</h3>
                        <p className="text-sm text-slate-500 mt-1">กรุณากรอกข้อมูลต่อไปนี้ให้ครบก่อนบันทึก</p>
                    </div>

                    {/* Field list */}
                    <div className="rounded-xl bg-orange-50 border border-orange-100 px-4 py-3 mb-5">
                        <ul className="space-y-2">
                            {fields.map((field, i) => (
                                <li key={i} className="flex items-center gap-2.5 text-sm text-orange-700 font-medium">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-200 text-orange-700 text-xs font-bold">
                                        {i + 1}
                                    </span>
                                    {field}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Button */}
                    <button
                        onClick={onClose}
                        className={`${BTN.primary} w-full rounded-xl py-2.5 text-sm font-bold active:scale-95 transition-all`}
                    >
                        รับทราบ แก้ไขต่อ
                    </button>
                </div>
            </div>
        </div>
    )
}