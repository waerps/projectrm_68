import { useState } from 'react';
import { BookOpen, Plus, Search, Filter, Edit, Trash2, Eye, Users, Clock, Calendar, X, Check, FileText } from 'lucide-react';

export default function AdminCourses() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [tutorFilter, setTutorFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([
    { id: 1, name: 'คณิตศาสตร์ ม.3 เทอม 1/2567', level: 'ม.3', subject: 'คณิต', tutor: 'ครูเป้ว', type: 'คอร์สรวม', location: 'Onsite', startDate: '15 พ.ค. 2567', students: 24, maxStudents: 30, status: 'active', hours: 48, progress: 65 },
    { id: 2, name: 'ภาษาไทย ม.3 เทอม 1/2567', level: 'ม.3', subject: 'ไทย', tutor: 'ครูเป้ว', type: 'คอร์สรวม', location: 'Onsite', startDate: '15 พ.ค. 2567', students: 24, maxStudents: 30, status: 'active', hours: 48, progress: 55 },
    { id: 3, name: 'วิทย์ ม.4', level: 'ม.4', subject: 'วิทย์', tutor: 'ครูเป้ว', type: 'คอร์สเดี่ยว', location: 'Onsite', startDate: '1 มิ.ย. 2567', students: 16, maxStudents: 20, status: 'active', hours: 48, progress: 45 },
    { id: 4, name: 'NETSAT (Online)', level: 'ม.4-6', subject: 'NETSAT', tutor: 'ครูเป้ว', type: 'คอร์สรวม', location: 'Online', startDate: '1 มิ.ย. 2567', students: 62, maxStudents: 80, status: 'active', hours: 60, progress: 80 },
    { id: 5, name: 'คณิต ม.4 เทอม 2/2566', level: 'ม.4', subject: 'คณิต', tutor: 'ครูเป้ว', type: 'คอร์สรวม', location: 'Onsite', startDate: '1 พ.ย. 2566', students: 22, maxStudents: 25, status: 'completed', hours: 48, progress: 100 },
    { id: 6, name: 'ภาษาไทย ม.6 เทอม 1/2568', level: 'ม.6', subject: 'ไทย', tutor: 'ครูเป้ว', type: 'คอร์สรวม', location: 'Onsite', startDate: '20 มิ.ย. 2567', students: 0, maxStudents: 20, status: 'upcoming', hours: 40, progress: 0 },
    { id: 7, name: 'อังกฤษ ป.5-6', level: 'ป.5-6', subject: 'อังกฤษ', tutor: 'ครูเป้ว', type: 'คอร์สรวม', location: 'Onsite', startDate: '15 พ.ค. 2567', students: 9, maxStudents: 15, status: 'active', hours: 48, progress: 70 },
    { id: 8, name: 'สังคม ม.1', level: 'ม.1', subject: 'สังคม', tutor: 'ครูเป้ว', type: 'คอร์สรวม', location: 'Onsite', startDate: '1 มิ.ย. 2567', students: 12, maxStudents: 15, status: 'active', hours: 36, progress: 50 },
  ]);

  const filteredCourses = courses.filter((course) => {
    if (searchQuery && !course.name.toLowerCase().includes(searchQuery.toLowerCase()) && !course.subject.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== 'all' && course.status !== statusFilter) return false;
    if (typeFilter !== 'all' && course.type !== typeFilter) return false;
    if (tutorFilter !== 'all' && course.tutor !== tutorFilter) return false;
    if (locationFilter !== 'all' && course.location.toLowerCase() !== locationFilter.toLowerCase()) return false;
    return true;
  });

  const getStatusBadge = (status) => {
    const map = { active: 'bg-green-100 text-green-700', completed: 'bg-neutral-200 text-neutral-700', upcoming: 'bg-blue-100 text-blue-700' };
    const labels = { active: 'กำลังสอน', completed: 'สอนจบแล้ว', upcoming: 'ยังไม่เริ่ม' };
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[status]}`}>{labels[status]}</span>;
  };

  const handleDelete = (id) => {
    setCourses(courses.filter(c => c.id !== id));
    setShowDeleteConfirm(false);
    setSelectedCourse(null);
  };

  const confirmDelete = (course) => {
    setSelectedCourse(course);
    setShowDeleteConfirm(true);
  };

  const handleEdit = (course) => {
    setSelectedCourse(course);
    setShowEditModal(true);
  };

  return (
    <div className="min-h-screen space-y-6 mt-[90px] ">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">จัดการคอร์สเรียน</h1>
              <p className="mt-1 text-sm text-neutral-500">จัดการและติดตามคอร์สทั้งหมดในระบบ</p>
            </div>
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-medium">
              <Plus className="h-4 w-4" />
              เพิ่มคอร์สใหม่
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border-2 border-neutral-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">คอร์สทั้งหมด</p>
                <p className="text-2xl font-bold text-neutral-900">{courses.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border-2 border-neutral-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">นักเรียนทั้งหมด</p>
                <p className="text-2xl font-bold text-neutral-900">{courses.reduce((sum, c) => sum + c.students, 0)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border-2 border-neutral-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">กำลังสอน</p>
                <p className="text-2xl font-bold text-neutral-900">{courses.filter(c => c.status === 'active').length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border-2 border-neutral-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">ชั่วโมงรวม</p>
                <p className="text-2xl font-bold text-neutral-900">{courses.reduce((sum, c) => sum + c.hours, 0)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-3 mb-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
              <Filter className="h-4 w-4 text-orange-600" />
              <span>กรองข้อมูล</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input type="text" placeholder="ค้นหาคอร์ส..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 w-full bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500">
                <option value="all">ทุกสถานะ</option>
                <option value="active">กำลังสอน</option>
                <option value="completed">สอนจบแล้ว</option>
                <option value="upcoming">ยังไม่เริ่ม</option>
              </select>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500">
                <option value="all">ทุกประเภท</option>
                <option value="คอร์สรวม">คอร์สรวม</option>
                <option value="คอร์สเดี่ยว">คอร์สเดี่ยว</option>
              </select>
              <select value={tutorFilter} onChange={(e) => setTutorFilter(e.target.value)} className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500">
                <option value="all">ทุกติวเตอร์</option>
                <option value="ครูเป้ว">ครูเป้ว</option>
                <option value="ครูโลตัส">ครูโลตัส</option>
                <option value="ครูช้าง">ครูช้าง</option>
                <option value="ครูไก่">ครูไก่</option>
              </select>
              <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500">
                <option value="all">ทุกรูปแบบ</option>
                <option value="onsite">Onsite</option>
                <option value="online">Online</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">แสดง <span className="font-bold text-neutral-900">{filteredCourses.length}</span> จาก {courses.length} คอร์ส</span>
            <button className="text-orange-600 hover:underline font-medium">ล้างตัวกรอง</button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border-2 border-neutral-200">
              <BookOpen className="h-16 w-16 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500 text-sm">ไม่พบคอร์สที่ค้นหา</p>
            </div>
          ) : (
            filteredCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-2xl border-2 border-neutral-200 hover:border-orange-300 transition overflow-hidden">
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-bold text-neutral-900 text-lg">{course.name}</h3>
                        {getStatusBadge(course.status)}
                        <span className={`text-xs px-2 py-1 rounded-full border ${course.type === 'คอร์สเดี่ยว' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>{course.type}</span>
                        <span className={`text-xs px-2 py-1 rounded-full border ${course.location === 'Online' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-green-50 text-green-700 border-green-200'}`}>{course.location}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600">
                        <span>วิชา: {course.subject}</span>
                        <span>ระดับ: {course.level}</span>
                        <span>ครู: {course.tutor}</span>
                        <span>เริ่มเรียน: {course.startDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className="text-center p-3 bg-neutral-50 rounded-xl">
                      <Users className="mx-auto mb-1 h-5 w-5 text-orange-600" />
                      <p className="font-bold text-neutral-900">{course.students}/{course.maxStudents}</p>
                      <p className="text-xs text-neutral-600">นักเรียน</p>
                    </div>
                    <div className="text-center p-3 bg-neutral-50 rounded-xl">
                      <Clock className="mx-auto mb-1 h-5 w-5 text-orange-600" />
                      <p className="font-bold text-neutral-900">{course.hours}</p>
                      <p className="text-xs text-neutral-600">ชั่วโมง</p>
                    </div>
                    <div className="text-center p-3 bg-neutral-50 rounded-xl col-span-2">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-neutral-600">ความคืบหน้า</span>
                        <span className="font-bold text-orange-600">{course.progress}%</span>
                      </div>
                      <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500" style={{ width: `${course.progress}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-neutral-200">
                    <button className="flex-1 flex items-center justify-center gap-2 border-2 border-neutral-300 text-neutral-700 rounded-xl py-2 hover:bg-neutral-100 transition font-medium text-sm">
                      <Eye className="h-4 w-4" />
                      ดูรายละเอียด
                    </button>
                    <button onClick={() => handleEdit(course)} className="flex-1 flex items-center justify-center gap-2 border-2 border-orange-300 text-orange-700 rounded-xl py-2 hover:bg-orange-50 transition font-medium text-sm">
                      <Edit className="h-4 w-4" />
                      แก้ไข
                    </button>

                    <button className="flex-1 flex items-center justify-center gap-2 border-2 border-blue-300 text-blue-700 rounded-xl py-2 hover:bg-blue-50 transition font-medium text-sm">
                      <FileText className="h-4 w-4" />
                      จัดการคลิป/เอกสาร
                    </button>

                    <button onClick={() => confirmDelete(course)} className="flex-1 flex items-center justify-center gap-2 border-2 border-red-300 text-red-700 rounded-xl py-2 hover:bg-red-50 transition font-medium text-sm">
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

      {showDeleteConfirm && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-neutral-900 mb-2">ยืนยันการลบคอร์ส</h3>
            <p className="text-sm text-neutral-600 mb-4">คุณต้องการลบคอร์ส "<span className="font-semibold">{selectedCourse.name}</span>" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-neutral-50 transition font-medium">ยกเลิก</button>
              <button onClick={() => handleDelete(selectedCourse.id)} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-medium">ลบคอร์ส</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}