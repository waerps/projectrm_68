import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { Star, Phone, Pencil, Save, X, AlertTriangle, Camera, Users, Clock ,ImagePlus, Landmark} from "lucide-react"


export default function TutorProfile() {
    const fileInputRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [alertModal, setAlertModal] = useState({ show: false, fields: [] })
    const TUTOR_ID = 1;

    const [formData, setFormData] = useState({
        firstname: "", lastname: "", nickname: "", phone: "",
        lineId: "", birthDate: "", occupation: "",
        emergencyName: "", emergencyPhone: "",
        studentCount: 0, experience: 0, subjects: [], photo: null,
        bankName: "", bankAccount: "", bankAccountName: ""
    })
    const [originalData, setOriginalData] = useState({})

    useEffect(() => {
        const fetchTutorData = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/api/tutor/${TUTOR_ID}`);
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
            } catch (error) {
                console.error("Error:", error);
                setIsLoading(false);
            }
        };
        fetchTutorData();
    }, []);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const data = new FormData();
        data.append('profileImage', file);
        try {
            const res = await axios.post(`http://localhost:3000/api/tutor/${TUTOR_ID}/upload-profile`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData(prev => ({ ...prev, photo: res.data.imageUrl }));
            alert("อัปโหลดสำเร็จ!");
        } catch (error) {
            console.error(error);
            alert("อัปโหลดไม่สำเร็จ: " + (error.response?.data?.message || "Check Backend"));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSave = async () => {
        const requiredFields = {
            firstname:      'ชื่อ',
            lastname:       'นามสกุล',
            nickname:       'ชื่อเล่น',
            phone:          'เบอร์โทรศัพท์',
            lineId:         'Line ID',
            birthDate:      'วันเกิด',
            occupation:     'อาชีพ',
            emergencyName:  'ชื่อผู้ติดต่อฉุกเฉิน',
            emergencyPhone: 'เบอร์โทรฉุกเฉิน',
        }
    
        const emptyFields = Object.entries(requiredFields)
            .filter(([key]) => !formData[key] || formData[key].trim() === '')
            .map(([, label]) => label)
    
        if (emptyFields.length > 0) {
            setAlertModal({ show: true, fields: emptyFields })
            return
        }
    
        setIsSaving(true)
        try {
            await axios.put(`http://localhost:3000/api/tutor/${TUTOR_ID}`, formData);
            setOriginalData(formData);
            setIsEditing(false);
        } catch (error) {
            alert("เกิดข้อผิดพลาดในการบันทึก");
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        setFormData(originalData)
        setIsEditing(false)
    }

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
                <p className="text-orange-600 font-medium text-sm">กำลังโหลด...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 mt-[100px]">
            <div className="">

                {/* ── Edit Mode Banner ── */}
                {isEditing && (
                    <div className="mb-4 flex items-center justify-between rounded-2xl bg-orange-400 px-5 py-3 shadow-md">
                        <div className="flex items-center gap-2.5 text-white">
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
                                className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-1.5 text-sm text-orange-600 font-bold hover:bg-orange-50 transition shadow-sm disabled:opacity-60"
                            >
                                <Save className="h-3.5 w-3.5" />
                                {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Profile Header Card ── */}
                <div className="mb-6 overflow-hidden rounded-2xl shadow-lg">
                    <div className="bg-gradient-to-br from-orange-500 to-orange-300 p-8 md:p-10">
                        <div className="flex flex-col gap-8 md:flex-row md:items-center">

                            {/* รูปโปรไฟล์ */}
                            <div className="relative shrink-0 mx-auto md:mx-0">
                                <div className="relative h-36 w-36 md:h-40 md:w-40 overflow-hidden rounded-2xl border-4 border-white/80 shadow-2xl bg-gray-100">
                                    <img
                                        src={formData.photo ? `http://localhost:3000${formData.photo}` : "/tutor.jpeg"}
                                        className="h-full w-full object-cover"
                                        alt="Tutor"
                                    />
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                </div>
                                <button
                                    onClick={() => fileInputRef.current.click()}
                                    className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-orange-500 shadow-lg hover:scale-110 transition-transform border-2 border-orange-100"
                                >
                                    <ImagePlus className="h-4.5 w-4.5" />
                                </button>
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
                                                className="rounded-xl px-3 py-2 text-neutral-800 text-lg font-semibold w-36 outline-none border-2 border-transparent focus:border-orange-300 bg-white shadow-sm transition"
                                            />
                                            <input
                                                name="lastname"
                                                value={formData.lastname}
                                                onChange={handleChange}
                                                placeholder="นามสกุล"
                                                className="rounded-xl px-3 py-2 text-neutral-800 text-lg font-semibold w-40 outline-none border-2 border-transparent focus:border-orange-300 bg-white shadow-sm transition"
                                            />
                                        </div>
                                    ) : (
                                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
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
                                <div className="flex justify-center md:justify-start gap-5 text-sm font-medium">
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
                                    className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-orange-600 font-bold hover:bg-orange-50 shadow-lg transition-all text-sm shrink-0"
                                >
                                    <Pencil className="h-4 w-4" />
                                    แก้ไขข้อมูล
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Detail Cards ── */}
                <div className="grid gap-5 md:grid-cols-2">

                    {/* ข้อมูลส่วนตัว */}
                    <SectionCard
                        title="ข้อมูลส่วนตัว"
                        icon={<Users className="h-4.5 w-4.5 text-orange-500" />}
                        isEditing={isEditing}
                    >
                        <InfoRow label="ชื่อ"      name="firstname"  value={formData.firstname}  isEditing={isEditing} onChange={handleChange} />
                        <InfoRow label="นามสกุล"   name="lastname"   value={formData.lastname}   isEditing={isEditing} onChange={handleChange} />
                        <InfoRow label="ชื่อเล่น"  name="nickname"   value={formData.nickname}   isEditing={isEditing} onChange={handleChange} />
                        <InfoRow label="วันเกิด"   name="birthDate"  value={formData.birthDate}  isEditing={isEditing} onChange={handleChange} type="date" />
                        <InfoRow label="อาชีพ"     name="occupation" value={formData.occupation} isEditing={isEditing} onChange={handleChange} />
                    </SectionCard>

                    {/* ข้อมูลติดต่อ */}
                    <SectionCard
                        title="ข้อมูลติดต่อ"
                        icon={<Phone className="h-4.5 w-4.5 text-orange-500" />}
                        isEditing={isEditing}
                    >
                        <InfoRow label="เบอร์โทรศัพท์" name="phone"  value={formData.phone}  isEditing={isEditing} onChange={handleChange} />
                        <InfoRow label="Line ID"        name="lineId" value={formData.lineId} isEditing={isEditing} onChange={handleChange} />
                    </SectionCard>

                    {/* 🟢 ข้อมูลการเงินและเรทค่าสอน (รวมกันแล้ว) */}
                    <SectionCard
                        title="ข้อมูลการเงินและเรทค่าสอน"
                        icon={<Landmark className="h-4.5 w-4.5 text-orange-500" />}
                        isEditing={isEditing}
                    >
                        {/* ส่วนโชว์เรทค่าสอน */}
                        <div className="flex justify-between items-center rounded-xl border border-orange-200 p-5 bg-gradient-to-br from-orange-50 to-amber-50 mt-1 mb-4">
                            <div>
                                <p className="text-xs text-neutral-500 mb-1">ค่าตอบแทนต่อคาบ</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    {Number(formData.ratePerTutors).toLocaleString()}
                                    <span className="text-base font-normal text-neutral-500 ml-1">บาท</span>
                                </p>
                            </div>
                            <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full border border-orange-200">
                                ต่อ 1.5 ชม.
                            </span>
                        </div>
                        
                        {/* ส่วนข้อมูลบัญชีธนาคาร */}
                        <div className="border-t border-neutral-100 pt-2 space-y-0.5">
                            <InfoRow label="ธนาคาร" name="bankName" value={formData.bankName} isEditing={isEditing} onChange={handleChange} />
                            <InfoRow label="เลขที่บัญชี" name="bankAccount" value={formData.bankAccount} isEditing={isEditing} onChange={handleChange} />
                            <InfoRow label="ชื่อบัญชี" name="bankAccountName" value={formData.bankAccountName} isEditing={isEditing} onChange={handleChange} />
                        </div>

                        {/* หมายเหตุ */}
                        <p className="mt-4 text-xs text-neutral-400 text-center">
                            * เรทค่าสอนถูกกำหนดโดยฝ่ายบริหาร
                        </p>
                    </SectionCard>

                    {/* ผู้ติดต่อฉุกเฉิน */}
                    <SectionCard
                        title="ผู้ติดต่อฉุกเฉิน"
                        icon={<AlertTriangle className="h-4.5 w-4.5 text-red-500" />}
                        isEditing={isEditing}
                    >
                        <InfoRow label="ชื่อผู้ติดต่อ"    name="emergencyName"  value={formData.emergencyName}  isEditing={isEditing} onChange={handleChange} />
                        <InfoRow label="เบอร์โทรฉุกเฉิน" name="emergencyPhone" value={formData.emergencyPhone} isEditing={isEditing} onChange={handleChange} />
                    </SectionCard>
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
        <div className={`rounded-2xl bg-white shadow-sm overflow-hidden border-2 transition-all duration-200 ${isEditing ? 'border-orange-200 shadow-md' : 'border-neutral-100'}`}>
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center gap-2">
                {icon}
                <h2 className="text-sm font-bold text-neutral-800">{title}</h2>
            </div>
            <div className="p-5 space-y-0.5">
                {children}
            </div>
        </div>
    )
}

// ── Info Row ──────────────────────────────────────────────────
function InfoRow({ label, value, name, isEditing, onChange, type = "text" }) {
    return (
        <div className="flex justify-between items-center py-3 border-b border-neutral-50 last:border-0 min-h-[52px] gap-4">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wide shrink-0">{label}</span>
            <div className="flex-1 text-right">
                {isEditing ? (
                    <input
                        type={type}
                        name={name}
                        value={value}
                        onChange={onChange}
                        className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-right text-sm text-neutral-800 font-medium outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
                    />
                ) : (
                    <span className="text-sm font-semibold text-neutral-800">{value || <span className="text-neutral-300 font-normal">-</span>}</span>
                )}
            </div>
        </div>
    )
}

function ValidationModal({ fields, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden animate-in">
                {/* Top accent */}
                <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 to-amber-400" />

                <div className="p-6">
                    {/* Icon + Title */}
                    <div className="flex flex-col items-center text-center mb-5">
                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 border border-orange-100">
                            <AlertTriangle className="h-7 w-7 text-orange-500" />
                        </div>
                        <h3 className="text-lg font-bold text-neutral-800">กรอกข้อมูลไม่ครบ</h3>
                        <p className="text-sm text-neutral-400 mt-1">กรุณากรอกข้อมูลในฟิลต่อไปนี้ให้ครบก่อนบันทึก</p>
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
                        className="w-full rounded-xl bg-orange-500 py-2.5 text-sm font-bold text-white hover:bg-orange-600 active:scale-95 transition-all shadow-sm"
                    >
                        รับทราบ แก้ไขต่อ
                    </button>
                </div>
            </div>
        </div>
    )
}