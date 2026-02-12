import { useState } from 'react';
import {
    Users, Plus, Search, Filter, Edit, Trash2, Eye, Phone, Mail,
    Calendar, BookOpen, DollarSign, AlertCircle, X, Save,
    GraduationCap, Award, CheckCircle, Clock,
    Briefcase, Star
} from 'lucide-react';

export default function AdminTutors() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [subjectFilter, setSubjectFilter] = useState('all');
    const [experienceFilter, setExperienceFilter] = useState('all');

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTutor, setSelectedTutor] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        nickname: '',
        subjects: [],
        phone: '',
        email: '',
        address: '',
        education: '',
        university: '',
        experience: '',
        salary: '',
        status: 'active'
    });

    const [tutors, setTutors] = useState([
        {
            id: 1,
            name: 'อ.สมชาย ใจดี',
            nickname: 'ชาย',
            subjects: ['คณิต ป.4-6', 'คณิต ม.3'],
            phone: '081-234-5678',
            email: 'somchai@email.com',
            address: 'กรุงเทพมหานคร',
            education: 'ปริญญาโท วิศวกรรมศาสตร์',
            university: 'จุฬาลงกรณ์มหาวิทยาลัย',
            experience: '8 ปี',
            joinDate: '1 ม.ค. 2563',
            status: 'active',
            totalClasses: 156,
            totalStudents: 45,
            rating: 4.8,
            salaryPerMonth: 35000,
            hoursThisMonth: 82
        },
        {
            id: 2,
            name: 'อ.วิไล สุขใจ',
            nickname: 'วิไล',
            subjects: ['วิทย์ ม.4', 'วิทย์ ม.1', 'ฟิสิกส์'],
            phone: '082-345-6789',
            email: 'wilai@email.com',
            address: 'นนทบุรี',
            education: 'ปริญญาตรี วิทยาศาสตร์',
            university: 'มหาวิทยาลัยเกษตรศาสตร์',
            experience: '5 ปี',
            joinDate: '15 มิ.ย. 2564',
            status: 'active',
            totalClasses: 98,
            totalStudents: 32,
            rating: 4.9,
            salaryPerMonth: 28000,
            hoursThisMonth: 68
        },
        {
            id: 3,
            name: 'อ.ประยุทธ์ รักเรียน',
            nickname: 'ยุทธ',
            subjects: ['เคมี ม.5-6', 'วิทย์ ม.2-3'],
            phone: '083-456-7890',
            email: 'prayut@email.com',
            address: 'ปทุมธานี',
            education: 'ปริญญาเอก เคมี',
            university: 'มหาวิทยาลัยมหิดล',
            experience: '12 ปี',
            joinDate: '1 ม.ค. 2562',
            status: 'active',
            totalClasses: 245,
            totalStudents: 67,
            rating: 4.7,
            salaryPerMonth: 42000,
            hoursThisMonth: 95
        }
    ]);

    const allSubjects = [
        'คณิต ป.4-6', 'คณิต ม.3', 'วิทย์ ม.4', 'วิทย์ ม.1', 'วิทย์ ม.2-3',
        'ฟิสิกส์', 'เคมี ม.5-6', 'ชีววิทยา ม.5-6', 'อังกฤษ ป.5-6',
        'ไทย ม.3', 'ไทย ป.4-6', 'สังคม ม.1', 'NETSAT', 'A-Level'
    ];

    const filteredTutors = tutors.filter((tutor) => {
        if (searchQuery && !tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !tutor.nickname.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (statusFilter !== 'all' && tutor.status !== statusFilter) return false;
        if (subjectFilter !== 'all' && !tutor.subjects.includes(subjectFilter)) return false;
        if (experienceFilter !== 'all') {
            const exp = parseInt(tutor.experience);
            if (experienceFilter === '0-3' && (exp < 0 || exp > 3)) return false;
            if (experienceFilter === '4-7' && (exp < 4 || exp > 7)) return false;
            if (experienceFilter === '8+' && exp < 8) return false;
        }
        return true;
    });

    const getStatusBadge = (status) => {
        const map = {
            active: 'bg-green-100 text-green-700',
            on_leave: 'bg-yellow-100 text-yellow-700',
            inactive: 'bg-neutral-200 text-neutral-700'
        };
        const labels = {
            active: 'ทำงานอยู่',
            on_leave: 'ลาพัก',
            inactive: 'ไม่ได้ทำงาน'
        };
        return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[status]}`}>{labels[status]}</span>;
    };

    const handleAddTutor = () => {
        const newTutor = {
            id: tutors.length + 1,
            ...formData,
            joinDate: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
            totalClasses: 0,
            totalStudents: 0,
            rating: 0,
            salaryPerMonth: parseInt(formData.salary) || 0,
            hoursThisMonth: 0
        };
        setTutors([...tutors, newTutor]);
        setShowAddModal(false);
        resetForm();
    };

    const handleEditTutor = () => {
        setTutors(tutors.map(t => t.id === selectedTutor.id ? { 
            ...t, 
            ...formData,
            salaryPerMonth: parseInt(formData.salary) || t.salaryPerMonth
        } : t));
        setShowEditModal(false);
        resetForm();
    };

    const handleDeleteTutor = () => {
        setTutors(tutors.filter(t => t.id !== selectedTutor.id));
        setShowDeleteModal(false);
        setSelectedTutor(null);
    };

    const openEditModal = (tutor) => {
        setSelectedTutor(tutor);
        setFormData({
            name: tutor.name,
            nickname: tutor.nickname,
            subjects: tutor.subjects,
            phone: tutor.phone,
            email: tutor.email,
            address: tutor.address,
            education: tutor.education,
            university: tutor.university,
            experience: tutor.experience,
            salary: tutor.salaryPerMonth.toString(),
            status: tutor.status
        });
        setShowEditModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            nickname: '',
            subjects: [],
            phone: '',
            email: '',
            address: '',
            education: '',
            university: '',
            experience: '',
            salary: '',
            status: 'active'
        });
        setSelectedTutor(null);
    };

    const activeTutors = tutors.filter(t => t.status === 'active').length;
    const totalHours = tutors.reduce((sum, t) => sum + t.hoursThisMonth, 0);
    const avgRating = (tutors.reduce((sum, t) => sum + t.rating, 0) / tutors.length).toFixed(1);

    return (
        <div className="min-h-screen space-y-6 mt-[90px]">
            <div className="mx-auto max-w-[1400px] px-4">
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-900">จัดการติวเตอร์</h1>
                            <p className="mt-1 text-sm text-neutral-500">จัดการข้อมูลติวเตอร์ทั้งหมดในระบบ</p>
                        </div>
                        <button 
                            onClick={() => setShowAddModal(true)} 
                            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-medium"
                        >
                            <Plus className="h-4 w-4" />
                            เพิ่มติวเตอร์ใหม่
                        </button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 mb-6">
                    <div className="bg-white rounded-xl border-2 border-neutral-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">ติวเตอร์ทั้งหมด</p>
                                <p className="text-2xl font-bold text-neutral-900">{tutors.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border-2 border-neutral-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">ทำงานอยู่</p>
                                <p className="text-2xl font-bold text-neutral-900">{activeTutors}</p>
                            </div>
                        </div>
                    </div>
{/* 
                    <div className="bg-white rounded-xl border-2 border-neutral-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-orange-100 rounded-xl">
                                <Clock className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">ชั่วโมงเดือนนี้</p>
                                <p className="text-2xl font-bold text-neutral-900">{totalHours}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border-2 border-neutral-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <Star className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">คะแนนเฉลี่ย</p>
                                <p className="text-2xl font-bold text-neutral-900">{avgRating}</p>
                            </div>
                        </div>
                    </div> */}
                </div>

                <div className="bg-white border border-neutral-200 rounded-xl p-3 mb-6">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                            <Filter className="h-4 w-4 text-orange-600" />
                            <span>กรองข้อมูล</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                <input
                                    type="text"
                                    placeholder="ค้นหาชื่อ/ชื่อเล่น..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-full bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)} 
                                className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="all">ทุกสถานะ</option>
                                <option value="active">ทำงานอยู่</option>
                                <option value="on_leave">ลาพัก</option>
                                <option value="inactive">ไม่ได้ทำงาน</option>
                            </select>

                            <select 
                                value={subjectFilter} 
                                onChange={(e) => setSubjectFilter(e.target.value)} 
                                className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="all">ทุกวิชา</option>
                                {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>

                            <select 
                                value={experienceFilter} 
                                onChange={(e) => setExperienceFilter(e.target.value)} 
                                className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="all">ประสบการณ์ทั้งหมด</option>
                                <option value="0-3">0-3 ปี</option>
                                <option value="4-7">4-7 ปี</option>
                                <option value="8+">8+ ปี</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600">
                            แสดง <span className="font-bold text-neutral-900">{filteredTutors.length}</span> จาก {tutors.length} คน
                        </span>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setStatusFilter('all');
                                setSubjectFilter('all');
                                setExperienceFilter('all');
                            }}
                            className="text-orange-600 hover:underline font-medium"
                        >
                            ล้างตัวกรอง
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {filteredTutors.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border-2 border-neutral-200">
                            <Users className="h-16 w-16 text-neutral-300 mx-auto mb-3" />
                            <p className="text-neutral-500 text-sm">ไม่พบติวเตอร์ที่ค้นหา</p>
                        </div>
                    ) : (
                        filteredTutors.map((tutor) => (
                            <div key={tutor.id} className="bg-white rounded-2xl border-2 border-neutral-200 hover:border-orange-300 transition overflow-hidden">
                                <div className="p-5">
                                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <h3 className="font-bold text-neutral-900 text-lg">{tutor.name}</h3>
                                                <span className="text-sm text-neutral-600">({tutor.nickname})</span>
                                                {getStatusBadge(tutor.status)}
                                                <div className="flex items-center gap-1 ml-2">
                                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                    <span className="text-sm font-semibold text-neutral-900">{tutor.rating}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600 mb-2">
                                                <span className="flex items-center gap-1">
                                                    <GraduationCap className="h-3 w-3" />
                                                    {tutor.education}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Award className="h-3 w-3" />
                                                    {tutor.university}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Briefcase className="h-3 w-3" />
                                                    ประสบการณ์: {tutor.experience}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600">
                                                <span className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {tutor.phone}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Mail className="h-3 w-3" />
                                                    {tutor.email}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    เข้าร่วม: {tutor.joinDate}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-xs text-neutral-600 mb-2 font-medium">วิชาที่สอน:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {tutor.subjects.map((subject, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs border border-orange-200">
                                                    {subject}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-3 mb-4">
                                        <div className="text-center p-3 bg-neutral-50 rounded-xl">
                                            <BookOpen className="mx-auto mb-1 h-5 w-5 text-orange-600" />
                                            <p className="font-bold text-neutral-900">{tutor.totalClasses}</p>
                                            <p className="text-xs text-neutral-600">คาบสอน</p>
                                        </div>
                                        <div className="text-center p-3 bg-neutral-50 rounded-xl">
                                            <Users className="mx-auto mb-1 h-5 w-5 text-orange-600" />
                                            <p className="font-bold text-neutral-900">{tutor.totalStudents}</p>
                                            <p className="text-xs text-neutral-600">นักเรียน</p>
                                        </div>
                                        <div className="text-center p-3 bg-neutral-50 rounded-xl">
                                            <Clock className="mx-auto mb-1 h-5 w-5 text-orange-600" />
                                            <p className="font-bold text-neutral-900">{tutor.hoursThisMonth}</p>
                                            <p className="text-xs text-neutral-600">ชม./เดือน</p>
                                        </div>
                                        <div className="text-center p-3 bg-neutral-50 rounded-xl">
                                            <DollarSign className="mx-auto mb-1 h-5 w-5 text-orange-600" />
                                            <p className="font-bold text-neutral-900">{tutor.salaryPerMonth.toLocaleString()}฿</p>
                                            <p className="text-xs text-neutral-600">เงินเดือน</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-4 border-t border-neutral-200">
                                        <button
                                            onClick={() => {
                                                setSelectedTutor(tutor);
                                                setShowDetailModal(true);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 border-2 border-neutral-300 text-neutral-700 rounded-xl py-2 hover:bg-neutral-100 transition font-medium text-sm"
                                        >
                                            <Eye className="h-4 w-4" />
                                            ดูรายละเอียด
                                        </button>
                                        <button
                                            onClick={() => openEditModal(tutor)}
                                            className="flex-1 flex items-center justify-center gap-2 border-2 border-orange-300 text-orange-700 rounded-xl py-2 hover:bg-orange-50 transition font-medium text-sm"
                                        >
                                            <Edit className="h-4 w-4" />
                                            แก้ไข
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedTutor(tutor);
                                                setShowDeleteModal(true);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 border-2 border-red-300 text-red-700 rounded-xl py-2 hover:bg-red-50 transition font-medium text-sm"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            ลบ
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-neutral-900">เพิ่มติวเตอร์ใหม่</h3>
                            <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-neutral-400 hover:text-neutral-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="text-center py-8">
                            <p className="text-neutral-600">ฟอร์มเพิ่มติวเตอร์</p>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => { setShowAddModal(false); resetForm(); }} className="px-4 py-2 border rounded-xl">ยกเลิก</button>
                            <button onClick={handleAddTutor} className="px-4 py-2 bg-orange-500 text-white rounded-xl">บันทึก</button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
                        <AlertCircle className="mx-auto text-red-500 h-10 w-10 mb-2" />
                        <p className="font-bold mb-2">ยืนยันการลบ</p>
                        <p className="text-sm text-neutral-600 mb-4">ต้องการลบติวเตอร์ "{selectedTutor?.name}" ใช่หรือไม่</p>
                        <div className="flex gap-2">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 border py-2 rounded-xl">ยกเลิก</button>
                            <button onClick={handleDeleteTutor} className="flex-1 bg-red-500 text-white py-2 rounded-xl">ลบ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}