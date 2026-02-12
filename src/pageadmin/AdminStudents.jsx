import { useState } from 'react';
import {
    Users, Plus, Search, Filter, Edit, Trash2, Eye, Phone, Mail,
    Calendar, BookOpen, DollarSign, AlertCircle, X, Save, UserPlus,
    GraduationCap, MapPin, User, School, CheckCircle, Clock, FileText
} from 'lucide-react';

export default function AdminStudents() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [levelFilter, setLevelFilter] = useState('all');
    const [courseFilter, setCourseFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all');

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        nickname: '',
        level: '',
        school: '',
        phone: '',
        parentPhone: '',
        email: '',
        address: '',
        courses: [],
        status: 'active'
    });

    const [students, setStudents] = useState([
        {
            id: 1,
            name: 'ด.ญ. สมใจ รักเรียน',
            nickname: 'ใจ',
            level: 'ป.6',
            school: 'โรงเรียนสาธิตมหาวิทยาลัย',
            phone: '081-234-5678',
            parentPhone: '089-765-4321',
            email: 'somjai@email.com',
            address: 'กรุงเทพมหานคร',
            courses: ['NETSAT'],
            enrollDate: '1 มิ.ย. 2567',
            status: 'active',
            paymentStatus: 'paid',
            totalPaid: 17000,
            attendance: 95,
            lastAttend: '14 ม.ค. 2568'
        },
        {
            id: 2,
            name: 'ด.ช. วิทย์ ขยัน',
            nickname: 'วิทย์',
            level: 'ม.3',
            school: 'โรงเรียนแก่นนครวิทยาลัย',
            phone: '082-345-6789',
            parentPhone: '088-654-3210',
            email: 'wit@email.com',
            address: 'นนทบุรี',
            courses: ['คอร์สรวมเทอม 1/2568'],
            enrollDate: '15 พ.ค. 2567',
            status: 'active',
            paymentStatus: 'pending',
            totalPaid: 8500,
            attendance: 88,
            lastAttend: '13 ม.ค. 2568'
        },
        {
            id: 3,
            name: 'ด.ญ. สุดา เก่ง',
            nickname: 'ดา',
            level: 'ม.4',
            school: 'โรงเรียนกัลยาณวัตร',
            phone: '083-456-7890',
            parentPhone: '087-543-2109',
            email: 'suda@email.com',
            address: 'ปทุมธานี',
            courses: ['คอร์สรวมเทอม 1/2568'],
            enrollDate: '1 มิ.ย. 2567',
            status: 'active',
            paymentStatus: 'paid',
            totalPaid: 16000,
            attendance: 92,
            lastAttend: '15 ม.ค. 2568'
        },
        {
            id: 4,
            name: 'ด.ช. มานะ พยายาม',
            nickname: 'มานะ',
            level: 'ม.1',
            school: 'โรงเรียนขอนแก่นวิทยายน',
            phone: '084-567-8901',
            parentPhone: '086-432-1098',
            email: 'mana@email.com',
            address: 'กรุงเทพมหานคร',
            courses: ['คอร์สรวมเทอม 1/2568'],
            enrollDate: '1 มิ.ย. 2567',
            status: 'active',
            paymentStatus: 'overdue',
            totalPaid: 4250,
            attendance: 75,
            lastAttend: '10 ม.ค. 2568'
        },
        {
            id: 5,
            name: 'ด.ญ. ปัญญา ฉลาด',
            nickname: 'ปัญ',
            level: 'ป.5',
            school: 'โรงเรียนอนุบาลขอนแก่น',
            phone: '085-678-9012',
            parentPhone: '085-321-0987',
            email: 'panya@email.com',
            address: 'สมุทรปราการ',
            courses: ['คอร์สรวมเทอม 1/2568'],
            enrollDate: '15 พ.ค. 2567',
            status: 'active',
            paymentStatus: 'paid',
            totalPaid: 8500,
            attendance: 98,
            lastAttend: '15 ม.ค. 2568'
        },
        {
            id: 6,
            name: 'ด.ช. ธนา สู้งาน',
            nickname: 'ธนา',
            level: 'ม.6',
            school: 'โรงเรียนขอนแก่นวิทยายน',
            phone: '086-789-0123',
            parentPhone: '084-210-9876',
            email: 'tana@email.com',
            address: 'กรุงเทพมหานคร',
            courses: ['คอร์สรวมเทอม 1/2568'],
            enrollDate: '20 มิ.ย. 2567',
            status: 'inactive',
            paymentStatus: 'none',
            totalPaid: 0,
            attendance: 0,
            lastAttend: '-'
        },
    ]);

    const levels = ['ป.3', 'ป.4', 'ป.5', 'ป.6', 'ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];
    const allCourses = [
        'คณิต ป.4-6', 'คณิต ม.3 เทอม 1/2567', 'ภาษาไทย ม.3 เทอม 1/2567',
        'วิทย์ ม.4', 'วิทย์ ม.1', 'สังคม ม.1', 'อังกฤษ ป.5-6',
        'NETSAT ม.4-6', 'ภาษาไทย ม.6 เทอม 1/2568'
    ];

    // Filter Students
    const filteredStudents = students.filter((student) => {
        if (searchQuery && !student.name.toLowerCase().includes(searchQuery.toLowerCase()) && !student.nickname.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (statusFilter !== 'all' && student.status !== statusFilter) return false;
        if (levelFilter !== 'all' && student.level !== levelFilter) return false;
        if (courseFilter !== 'all' && !student.courses.includes(courseFilter)) return false;
        if (paymentFilter !== 'all' && student.paymentStatus !== paymentFilter) return false;
        return true;
    });

    // Status Badges
    const getStatusBadge = (status) => {
        const map = {
            active: 'bg-green-100 text-green-700',
            inactive: 'bg-neutral-200 text-neutral-700',
            suspended: 'bg-red-100 text-red-700'
        };
        const labels = {
            active: 'กำลังเรียน',
            inactive: 'ไม่ได้เรียน',
            suspended: 'พักเรียน'
        };
        return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[status]}`}>{labels[status]}</span>;
    };

    const getPaymentBadge = (status) => {
        const map = {
            paid: 'bg-green-100 text-green-700',
            pending: 'bg-yellow-100 text-yellow-700',
            overdue: 'bg-red-100 text-red-700',
            none: 'bg-neutral-100 text-neutral-500'
        };
        const labels = {
            paid: 'ชำระแล้ว',
            pending: 'รอชำระ',
            overdue: 'เกินกำหนด',
            none: 'ไม่มีข้อมูล'
        };
        return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${map[status]}`}>{labels[status]}</span>;
    };

    // CRUD Operations
    const handleAddStudent = () => {
        const newStudent = {
            id: students.length + 1,
            ...formData,
            enrollDate: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
            paymentStatus: 'none',
            totalPaid: 0,
            attendance: 0,
            lastAttend: '-'
        };
        setStudents([...students, newStudent]);
        setShowAddModal(false);
        resetForm();
    };

    const handleEditStudent = () => {
        setStudents(students.map(s => s.id === selectedStudent.id ? { ...s, ...formData } : s));
        setShowEditModal(false);
        resetForm();
    };

    const handleDeleteStudent = () => {
        setStudents(students.filter(s => s.id !== selectedStudent.id));
        setShowDeleteModal(false);
        setSelectedStudent(null);
    };

    const openEditModal = (student) => {
        setSelectedStudent(student);
        setFormData({
            name: student.name,
            nickname: student.nickname,
            level: student.level,
            school: student.school,
            phone: student.phone,
            parentPhone: student.parentPhone,
            email: student.email,
            address: student.address,
            courses: student.courses,
            status: student.status
        });
        setShowEditModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            nickname: '',
            level: '',
            school: '',
            phone: '',
            parentPhone: '',
            email: '',
            address: '',
            courses: [],
            status: 'active'
        });
        setSelectedStudent(null);
    };

    // Stats
    const activeStudents = students.filter(s => s.status === 'active').length;
    const totalRevenue = students.reduce((sum, s) => sum + s.totalPaid, 0);
    const avgAttendance = Math.round(students.reduce((sum, s) => sum + s.attendance, 0) / students.length);

    return (
        <div className="min-h-screen space-y-6 mt-[90px]">
            <div className="mx-auto max-w-[1400px] px-4">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-900">จัดการนักเรียน</h1>
                            <p className="mt-1 text-sm text-neutral-500">จัดการข้อมูลนักเรียนทั้งหมดในระบบ</p>
                        </div>
                        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-medium">
                            <Plus className="h-4 w-4" />
                            เพิ่มนักเรียนใหม่
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <div className="bg-white rounded-xl border-2 border-neutral-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">นักเรียนทั้งหมด</p>
                                <p className="text-2xl font-bold text-neutral-900">{students.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border-2 border-neutral-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">กำลังเรียน</p>
                                <p className="text-2xl font-bold text-neutral-900">{activeStudents}</p>
                            </div>
                        </div>
                    </div>

                    

                    <div className="bg-white rounded-xl border-2 border-neutral-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-orange-100 rounded-xl">
                                <Clock className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">เข้าเรียนเฉลี่ย</p>
                                <p className="text-2xl font-bold text-neutral-900">{avgAttendance}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white border border-neutral-200 rounded-xl p-3 mb-6">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                            <Filter className="h-4 w-4 text-orange-600" />
                            <span>กรองข้อมูล</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
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

                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500">
                                <option value="all">ทุกสถานะ</option>
                                <option value="active">กำลังเรียน</option>
                                <option value="inactive">ไม่ได้เรียน</option>
                                <option value="suspended">พักเรียน</option>
                            </select>

                            <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500">
                                <option value="all">ทุกระดับ</option>
                                {levels.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>

                            <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500">
                                <option value="all">ทุกคอร์ส</option>
                                {allCourses.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500">
                                <option value="all">ทุกสถานะการชำระ</option>
                                <option value="paid">ชำระแล้ว</option>
                                <option value="pending">รอชำระ</option>
                                <option value="overdue">เกินกำหนด</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results Summary */}
                <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600">แสดง <span className="font-bold text-neutral-900">{filteredStudents.length}</span> จาก {students.length} คน</span>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setStatusFilter('all');
                                setLevelFilter('all');
                                setCourseFilter('all');
                                setPaymentFilter('all');
                            }}
                            className="text-orange-600 hover:underline font-medium"
                        >
                            ล้างตัวกรอง
                        </button>
                    </div>
                </div>

                {/* Students List */}
                <div className="space-y-4">
                    {filteredStudents.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border-2 border-neutral-200">
                            <Users className="h-16 w-16 text-neutral-300 mx-auto mb-3" />
                            <p className="text-neutral-500 text-sm">ไม่พบนักเรียนที่ค้นหา</p>
                        </div>
                    ) : (
                        filteredStudents.map((student) => (
                            <div key={student.id} className="bg-white rounded-2xl border-2 border-neutral-200 hover:border-orange-300 transition overflow-hidden">
                                <div className="p-5">
                                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <h3 className="font-bold text-neutral-900 text-lg">{student.name}</h3>
                                                <span className="text-sm text-neutral-600">({student.nickname})</span>
                                                {getStatusBadge(student.status)}
                                                {getPaymentBadge(student.paymentStatus)}
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600">
                                                <span className="flex items-center gap-1">
                                                    <GraduationCap className="h-3 w-3" />
                                                    ระดับ: {student.level}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <School className="h-3 w-3" />
                                                    {student.school}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {student.phone}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    สมัคร: {student.enrollDate}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Courses */}
                                    <div className="mb-4">
                                        <p className="text-xs text-neutral-600 mb-2 font-medium">คอร์สที่เรียน:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {student.courses.map((course, idx) => (
                                                <span key={idx} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs border border-orange-200">
                                                    {course}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        <div className="text-center p-3 bg-neutral-50 rounded-xl">
                                            <BookOpen className="mx-auto mb-1 h-5 w-5 text-orange-600" />
                                            <p className="font-bold text-neutral-900">{student.courses.length}</p>
                                            <p className="text-xs text-neutral-600">คอร์ส</p>
                                        </div>
                                        <div className="text-center p-3 bg-neutral-50 rounded-xl">
                                            <Clock className="mx-auto mb-1 h-5 w-5 text-orange-600" />
                                            <p className="font-bold text-neutral-900">{student.attendance}%</p>
                                            <p className="text-xs text-neutral-600">เข้าเรียน</p>
                                        </div>
                                        <div className="text-center p-3 bg-neutral-50 rounded-xl">
                                            <DollarSign className="mx-auto mb-1 h-5 w-5 text-orange-600" />
                                            <p className="font-bold text-neutral-900">{student.totalPaid.toLocaleString()}฿</p>
                                            <p className="text-xs text-neutral-600">ชำระแล้ว</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-4 border-t border-neutral-200">
                                        <button
                                            onClick={() => {
                                                setSelectedStudent(student);
                                                setShowDetailModal(true);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 border-2 border-neutral-300 text-neutral-700 rounded-xl py-2 hover:bg-neutral-100 transition font-medium text-sm"
                                        >
                                            <Eye className="h-4 w-4" />
                                            ดูรายละเอียด
                                        </button>
                                        <button
                                            onClick={() => openEditModal(student)}
                                            className="flex-1 flex items-center justify-center gap-2 border-2 border-orange-300 text-orange-700 rounded-xl py-2 hover:bg-orange-50 transition font-medium text-sm"
                                        >
                                            <Edit className="h-4 w-4" />
                                            แก้ไข
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedStudent(student);
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

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-neutral-900">เพิ่มนักเรียนใหม่</h3>
                            <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-neutral-400 hover:text-neutral-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-neutral-600 mb-1 block">ชื่อ-นามสกุล *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                        placeholder="ด.ช./ด.ญ. ชื่อ นามสกุล"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-neutral-600 mb-1 block">ชื่อเล่น *</label>
                                    <input
                                        type="text"
                                        value={formData.nickname}
                                        onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                        placeholder="ชื่อเล่น"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-neutral-600 mb-1 block">ระดับชั้น *</label>
                                    <select
                                        value={formData.level}
                                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="">เลือกระดับชั้น</option>
                                        {levels.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-neutral-600 mb-1 block">โรงเรียน</label>
                                    <input
                                        type="text"
                                        value={formData.school}
                                        onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                        placeholder="ชื่อโรงเรียน"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-neutral-600 mb-1 block">เบอร์นักเรียน</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                        placeholder="08X-XXX-XXXX"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-neutral-600 mb-1 block">เบอร์ผู้ปกครอง</label>
                                    <input
                                        type="tel"
                                        value={formData.parentPhone}
                                        onChange={(e) =>
                                            setFormData({ ...formData, parentPhone: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                        placeholder="08X-XXX-XXXX"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-neutral-600 mb-1 block">อีเมล</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                        placeholder="email@example.com"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="text-sm text-neutral-600 mb-1 block">ที่อยู่</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) =>
                                            setFormData({ ...formData, address: e.target.value })
                                        }
                                        rows={2}
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="text-sm text-neutral-600 mb-1 block">คอร์สที่เรียน</label>
                                    <div className="flex flex-wrap gap-2">
                                        {allCourses.map((course) => (
                                            <label
                                                key={course}
                                                className="flex items-center gap-2 text-sm border px-3 py-1 rounded-full cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.courses.includes(course)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setFormData({
                                                                ...formData,
                                                                courses: [...formData.courses, course],
                                                            })
                                                        } else {
                                                            setFormData({
                                                                ...formData,
                                                                courses: formData.courses.filter(
                                                                    (c) => c !== course
                                                                ),
                                                            })
                                                        }
                                                    }}
                                                />
                                                {course}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    onClick={() => {
                                        setShowAddModal(false)
                                        resetForm()
                                    }}
                                    className="px-4 py-2 border rounded-xl text-sm"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleAddStudent}
                                    className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600"
                                >
                                    <Save className="inline h-4 w-4 mr-1" />
                                    บันทึก
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-xl w-full p-6">
                        <h3 className="text-lg font-bold mb-4">แก้ไขข้อมูลนักเรียน</h3>
                        <button
                            onClick={handleEditStudent}
                            className="w-full mt-4 bg-orange-500 text-white py-2 rounded-xl font-medium"
                        >
                            บันทึกการแก้ไข
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
                        <AlertCircle className="mx-auto text-red-500 h-10 w-10 mb-2" />
                        <p className="font-bold mb-2">ยืนยันการลบ</p>
                        <p className="text-sm text-neutral-600 mb-4">
                            ต้องการลบนักเรียน "{selectedStudent?.name}" ใช่หรือไม่
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 border py-2 rounded-xl"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleDeleteStudent}
                                className="flex-1 bg-red-500 text-white py-2 rounded-xl"
                            >
                                ลบ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedStudent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-xl w-full p-6">
                        <h3 className="text-xl font-bold mb-4">รายละเอียดนักเรียน</h3>
                        <ul className="text-sm space-y-2 text-neutral-700">
                            <li>ชื่อ: {selectedStudent.name}</li>
                            <li>ชื่อเล่น: {selectedStudent.nickname}</li>
                            <li>ระดับ: {selectedStudent.level}</li>
                            <li>โรงเรียน: {selectedStudent.school}</li>
                            <li>เบอร์: {selectedStudent.phone}</li>
                            <li>ผู้ปกครอง: {selectedStudent.parentPhone}</li>
                            <li>อีเมล: {selectedStudent.email}</li>
                            <li>ที่อยู่: {selectedStudent.address}</li>
                        </ul>
                        <button
                            onClick={() => setShowDetailModal(false)}
                            className="mt-4 w-full border py-2 rounded-xl"
                        >
                            ปิด
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
