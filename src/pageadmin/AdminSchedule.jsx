import React, { useState } from 'react';
import { 
  Calendar, Users, MapPin, Clock, Plus, Edit, Trash2, Copy, 
  AlertTriangle, Filter, Search, Eye, ChevronDown, X, Save,
  Building, UserCheck, BookOpen, Layers
} from 'lucide-react';

export default function AdminSchedule() {
  // View Mode State
  const [viewMode, setViewMode] = useState('weekly'); // weekly, by-tutor, by-room
  const [selectedDate, setSelectedDate] = useState('15 ม.ค. 2568');
  
  // Filter States
  const [filterTutor, setFilterTutor] = useState('all');
  const [filterRoom, setFilterRoom] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    subject: '',
    level: '',
    tutor: '',
    room: '',
    day: '',
    time: '',
    students: 0,
    maxStudents: 15,
    courseType: 'คอร์สรวม'
  });

  const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
  const timeSlots = [
    '09:00-10:30', '10:30-12:00', '12:00-13:00', '13:00-14:30', 
    '14:30-16:00', '17:00-18:30', '19:00-20:30'
  ];
  
  const tutors = ['ครูเป้ว', 'ครูโลตัส', 'ครูไก่', 'ครูช้าง', 'ครูหมี'];
  const rooms = ['ห้อง 1', 'ห้อง 2', 'ห้อง 3', 'ห้อง 4', 'ห้อง 5', 'ห้อง 6', 'ห้อง 7','Online'];
  const subjects = ['คณิต', 'วิทย์', 'ไทย', 'สังคม', 'อังกฤษ', 'NETSAT', 'A-Level'];
  const levels = ['ป.3', 'ป.4', 'ป.5', 'ป.6', 'ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];

  // Mock Schedule Data with Tutor Info
  const [scheduleData, setScheduleData] = useState({
    'จันทร์': {
      '17:00-18:30': { subject: 'คณิต', level: 'ป.4-6', room: 'ห้อง 1', tutor: 'ครูเป้ว', students: 8, maxStudents: 15, courseType: 'คอร์สรวม' },
      '19:00-20:30': { subject: 'NETSAT', level: 'ม.4-6', room: 'Online', tutor: 'ครูเป้ว', students: 12, maxStudents: 20, courseType: 'คอร์สรวม' },
    },
    'อังคาร': {
      '17:00-18:30': { subject: 'วิทย์', level: 'ม.4', room: 'ห้อง 2', tutor: 'ครูเป้ว', students: 16, maxStudents: 20, courseType: 'คอร์สเดี่ยว' },
      '19:00-20:30': { subject: 'NETSAT', level: 'ม.4-6', room: 'Online', tutor: 'ครูเป้ว', students: 10, maxStudents: 20, courseType: 'คอร์สรวม' },
    },
    'พุธ': {
      '17:00-18:30': { subject: 'อังกฤษ', level: 'ป.5-6', room: 'ห้อง 3', tutor: 'ครูเป้ว', students: 9, maxStudents: 15, courseType: 'คอร์สรวม' },
      '19:00-20:30': { subject: 'NETSAT', level: 'ม.4-6', room: 'Online', tutor: 'ครูเป้ว', students: 15, maxStudents: 20, courseType: 'คอร์สรวม' },
    },
    'พฤหัสบดี': {
      '09:00-10:30': { subject: 'คณิต', level: 'ป.3', room: 'ห้อง 1', tutor: 'ครูไก่', students: 6, maxStudents: 10, courseType: 'คอร์สเดี่ยว' },
      '17:00-18:30': { subject: 'ไทย', level: 'ป.4-6', room: 'ห้อง 4', tutor: 'ครูเป้ว', students: 8, maxStudents: 15, courseType: 'คอร์สรวม' },
      '19:00-20:30': { subject: 'NETSAT', level: 'ม.4-6', room: 'Online', tutor: 'ครูเป้ว', students: 11, maxStudents: 20, courseType: 'คอร์สรวม' },
    },
    'ศุกร์': {
      '17:00-18:30': { subject: 'คณิต', level: 'ป.5', room: 'ห้อง 1', tutor: 'ครูเป้ว', students: 5, maxStudents: 10, courseType: 'คอร์สเดี่ยว' },
      '19:00-20:30': { subject: 'NETSAT', level: 'ม.4-6', room: 'Online', tutor: 'ครูเป้ว', students: 14, maxStudents: 20, courseType: 'คอร์สรวม' },
    },
    'เสาร์': {
      '09:00-10:30': { subject: 'คณิต', level: 'ป.4-6', room: 'ห้อง 1', tutor: 'ครูเป้ว', students: 8, maxStudents: 15, courseType: 'คอร์สรวม' },
      '10:30-12:00': { subject: 'NETSAT', level: 'ม.4-6', room: 'ห้อง 5', tutor: 'ครูโลตัส', students: 12, maxStudents: 15, courseType: 'คอร์สรวม' },
      '13:00-14:30': { subject: 'วิทย์', level: 'ม.1', room: 'ห้อง 2', tutor: 'ครูไก่', students: 12, maxStudents: 15, courseType: 'คอร์สรวม' },
      '14:30-16:00': { subject: 'สังคม', level: 'ม.1', room: 'ห้อง 6', tutor: 'ครูช้าง', students: 12, maxStudents: 15, courseType: 'คอร์สรวม' },
    },
    'อาทิตย์': {
      '09:00-10:30': { subject: 'คณิต', level: 'ป.4-6', room: 'ห้อง 1', tutor: 'ครูเป้ว', students: 8, maxStudents: 15, courseType: 'คอร์สรวม' },
      '10:30-12:00': { subject: 'อังกฤษ', level: 'ป.5-6', room: 'ห้อง 3', tutor: 'ครูเป้ว', students: 9, maxStudents: 15, courseType: 'คอร์สรวม' },
      '13:00-14:30': { subject: 'วิทย์', level: 'ม.2-3', room: 'ห้อง 2', tutor: 'ครูไก่', students: 22, maxStudents: 25, courseType: 'คอร์สรวม' },
      '14:30-16:00': { subject: 'ไทย', level: 'ม.2-3', room: 'ห้อง 4', tutor: 'ครูช้าง', students: 22, maxStudents: 25, courseType: 'คอร์สรวม' },
    },
  });

  // Subject Colors
  const subjectColors = {
    'คณิต': 'bg-orange-500',
    'วิทย์': 'bg-blue-500',
    'ไทย': 'bg-pink-500',
    'สังคม': 'bg-yellow-600',
    'อังกฤษ': 'bg-purple-500',
    'NETSAT': 'bg-red-500',
    'A-Level': 'bg-teal-500',
  };

  // Detect Conflicts
  const detectConflicts = () => {
    const conflicts = [];
    Object.entries(scheduleData).forEach(([day, slots]) => {
      Object.entries(slots).forEach(([time, cls]) => {
        // Check room conflicts
        Object.entries(slots).forEach(([t2, cls2]) => {
          if (time !== t2 && cls.room === cls2.room && cls.room !== 'Online') {
            conflicts.push({ type: 'room', day, time, room: cls.room });
          }
        });
        // Check tutor conflicts
        Object.entries(slots).forEach(([t2, cls2]) => {
          if (time !== t2 && cls.tutor === cls2.tutor) {
            conflicts.push({ type: 'tutor', day, time, tutor: cls.tutor });
          }
        });
      });
    });
    return conflicts.length;
  };

  // Filter Classes
  const applyFilters = (cls) => {
    if (!cls) return false;
    if (filterTutor !== 'all' && cls.tutor !== filterTutor) return false;
    if (filterRoom !== 'all' && cls.room !== filterRoom) return false;
    if (filterSubject !== 'all' && cls.subject !== filterSubject) return false;
    if (filterLevel !== 'all' && !cls.level.includes(filterLevel)) return false;
    if (searchQuery && !cls.subject.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  };

  // Calculate Stats
  const totalClasses = Object.values(scheduleData).reduce((sum, day) => sum + Object.keys(day).length, 0);
  const totalStudents = Object.values(scheduleData).reduce((sum, day) => 
    sum + Object.values(day).reduce((s, cls) => s + cls.students, 0), 0
  );
  const conflictsCount = detectConflicts();

  // Handle Add Class
  const handleAddClass = () => {
    if (!formData.day || !formData.time) return;
    
    const newSchedule = { ...scheduleData };
    if (!newSchedule[formData.day]) newSchedule[formData.day] = {};
    newSchedule[formData.day][formData.time] = {
      subject: formData.subject,
      level: formData.level,
      tutor: formData.tutor,
      room: formData.room,
      students: formData.students,
      maxStudents: formData.maxStudents,
      courseType: formData.courseType
    };
    
    setScheduleData(newSchedule);
    setShowAddModal(false);
    setFormData({ subject: '', level: '', tutor: '', room: '', day: '', time: '', students: 0, maxStudents: 15, courseType: 'คอร์สรวม' });
  };

  // Handle Delete Class
  const handleDeleteClass = () => {
    if (!selectedClass) return;
    
    const newSchedule = { ...scheduleData };
    delete newSchedule[selectedClass.day][selectedClass.time];
    
    setScheduleData(newSchedule);
    setShowDeleteModal(false);
    setSelectedClass(null);
  };

  // Open Edit Modal
  const openEditModal = (day, time, cls) => {
    setSelectedClass({ day, time, ...cls });
    setFormData({
      subject: cls.subject,
      level: cls.level,
      tutor: cls.tutor,
      room: cls.room,
      day: day,
      time: time,
      students: cls.students,
      maxStudents: cls.maxStudents,
      courseType: cls.courseType
    });
    setShowEditModal(true);
  };

  return (
    <div className="min-h-screen space-y-6 mt-[90px]">
      <div className="mx-auto max-w-[1400px] px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">จัดการตารางเรียน</h1>
              <p className="mt-1 text-sm text-neutral-500">ตารางสอนทั้งหมดในสถาบัน - {selectedDate}</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-medium">
                <Plus className="h-4 w-4" />
                เพิ่มคาบสอน
              </button>
              {/* <button className="flex items-center gap-2 px-4 py-2 border-2 border-neutral-300 text-neutral-700 rounded-xl hover:bg-neutral-50 transition font-medium">
                <Copy className="h-4 w-4" />
                คัดลอกตาราง
              </button> */}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border-2 border-neutral-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">คาบทั้งหมด</p>
                <p className="text-2xl font-bold text-neutral-900">{totalClasses}</p>
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
                <p className="text-2xl font-bold text-neutral-900">{totalStudents}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border-2 border-neutral-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <UserCheck className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">ติวเตอร์</p>
                <p className="text-2xl font-bold text-neutral-900">{tutors.length}</p>
              </div>
            </div>
          </div>
          
          {/* <div className="bg-white rounded-xl border-2 border-neutral-200 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${conflictsCount > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                <AlertTriangle className={`h-6 w-6 ${conflictsCount > 0 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Conflicts</p>
                <p className={`text-2xl font-bold ${conflictsCount > 0 ? 'text-red-600' : 'text-green-600'}`}>{conflictsCount}</p>
              </div>
            </div>
          </div> */}
        </div>

        {/* Filter Bar */}
        <div className="bg-white border-2 border-neutral-200 rounded-xl p-4 mb-4">
          <div className="flex flex-col gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                <Layers className="h-4 w-4 text-orange-600" />
                <span>กรองข้อมูล</span>
              </div>
              <div className="flex bg-neutral-100 rounded-lg p-1">
                {/* <button onClick={() => setViewMode('weekly')} className={`px-4 py-2 rounded-md text-sm transition ${viewMode === 'weekly' ? 'bg-white shadow-sm text-orange-600 font-medium' : 'text-neutral-600'}`}>
                  <Calendar className="h-4 w-4 inline mr-1" />
                  ตารางสัปดาห์
                </button>
                <button onClick={() => setViewMode('by-tutor')} className={`px-4 py-2 rounded-md text-sm transition ${viewMode === 'by-tutor' ? 'bg-white shadow-sm text-orange-600 font-medium' : 'text-neutral-600'}`}>
                  <Users className="h-4 w-4 inline mr-1" />
                  ตามติวเตอร์
                </button>
                <button onClick={() => setViewMode('by-room')} className={`px-4 py-2 rounded-md text-sm transition ${viewMode === 'by-room' ? 'bg-white shadow-sm text-orange-600 font-medium' : 'text-neutral-600'}`}>
                  <Building className="h-4 w-4 inline mr-1" />
                  ตามห้อง
                </button> */}
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input type="text" placeholder="ค้นหาวิชา..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 w-full bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" />
              </div>
              
              <select value={filterTutor} onChange={(e) => setFilterTutor(e.target.value)} className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500">
                <option value="all">ทุกติวเตอร์</option>
                {tutors.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              
              <select value={filterRoom} onChange={(e) => setFilterRoom(e.target.value)} className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500">
                <option value="all">ทุกห้อง</option>
                {rooms.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              
              <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500">
                <option value="all">ทุกวิชา</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              
              <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500">
                <option value="all">ทุกระดับ</option>
                {levels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              
              <button onClick={() => {
                setFilterTutor('all');
                setFilterRoom('all');
                setFilterSubject('all');
                setFilterLevel('all');
                setSearchQuery('');
              }} className="px-4 py-2 border border-neutral-300 rounded-lg text-sm hover:bg-neutral-50 transition">
                ล้างตัวกรอง
              </button>
            </div>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="bg-white rounded-2xl border-2 border-neutral-200 p-4">
          <div className="overflow-x-auto">
            <div className="min-w-[1100px]">
              <div className="grid grid-cols-8 gap-2">
                {/* Header */}
                <div className="text-center font-semibold text-neutral-700 py-3 text-sm">เวลา</div>
                {days.map((d) => (
                  <div key={d} className="text-center font-semibold py-3 rounded-xl text-sm bg-orange-50 text-orange-700">
                    {d}
                  </div>
                ))}

                {/* Time Slots */}
                {timeSlots.map((time) => (
                  <React.Fragment key={time}>
                    <div className="text-center text-xs text-neutral-600 py-3 font-medium flex items-center justify-center bg-neutral-50 rounded-xl">
                      {time}
                    </div>

                    {days.map((day) => {
                      const cls = scheduleData[day]?.[time];
                      const isLunch = time === '12:00-13:00';
                      const showClass = cls && applyFilters(cls);

                      let cn = 'min-h-[100px] p-2 rounded-xl border-2 transition-all duration-200 ';

                      if (isLunch) {
                        cn += 'bg-neutral-100 border-neutral-200';
                      } else if (showClass) {
                        cn += 'bg-white border-neutral-300 hover:shadow-lg cursor-pointer group';
                      } else {
                        cn += 'bg-neutral-50 border-dashed border-neutral-200 hover:border-orange-300 hover:bg-orange-50 cursor-pointer';
                      }

                      return (
                        <div key={day + time} className={cn} onClick={() => {
                          if (isLunch) return;
                          if (showClass) {
                            openEditModal(day, time, cls);
                          } else {
                            setFormData({ ...formData, day, time });
                            setShowAddModal(true);
                          }
                        }}>
                          {isLunch ? (
                            <div className="flex items-center justify-center h-full">
                              <span className="text-xs text-neutral-400">พักเที่ยง</span>
                            </div>
                          ) : showClass ? (
                            <div className="space-y-1 relative">
                              <div className={`${subjectColors[cls.subject]} text-white text-xs font-semibold px-2 py-1 rounded-md`}>
                                {cls.subject}
                              </div>
                              <div className="text-xs text-neutral-700 font-medium px-1">{cls.level}</div>
                              <div className="text-xs text-neutral-600 px-1 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {cls.room}
                              </div>
                              <div className="text-xs text-neutral-600 px-1 flex items-center gap-1">
                                <UserCheck className="h-3 w-3" />
                                {cls.tutor}
                              </div>
                              <div className="text-xs text-neutral-700 font-medium px-1 flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {cls.students}/{cls.maxStudents}
                              </div>
                              
                              {/* Quick Actions */}
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition flex gap-1">
                                <button onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(day, time, cls);
                                }} className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedClass({ day, time, ...cls });
                                  setShowDeleteModal(true);
                                }} className="p-1 bg-red-500 text-white rounded hover:bg-red-600">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Plus className="h-5 w-5 text-neutral-300 group-hover:text-orange-500" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-neutral-900">เพิ่มคาบสอนใหม่</h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-neutral-600 mb-1 block">วัน</label>
                  <select value={formData.day} onChange={(e) => setFormData({...formData, day: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm">
                    <option value="">เลือกวัน</option>
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-neutral-600 mb-1 block">เวลา</label>
                  <select value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm">
                    <option value="">เลือกเวลา</option>
                    {timeSlots.filter(t => t !== '12:00-13:00').map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-neutral-600 mb-1 block">วิชา</label>
                  <select value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm">
                    <option value="">เลือกวิชา</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-neutral-600 mb-1 block">ระดับ</label>
                  <select value={formData.level} onChange={(e) => setFormData({...formData, level: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm">
                    <option value="">เลือกระดับ</option>
                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-neutral-600 mb-1 block">ติวเตอร์</label>
                  <select value={formData.tutor} onChange={(e) => setFormData({...formData, tutor: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm">
                    <option value="">เลือกติวเตอร์</option>
                    {tutors.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-neutral-600 mb-1 block">ห้อง</label>
                  <select value={formData.room} onChange={(e) => setFormData({...formData, room: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm">
                    <option value="">เลือกห้อง</option>
                    {rooms.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-neutral-600 mb-1 block">ประเภท</label>
                  <select value={formData.courseType} onChange={(e) => setFormData({...formData, courseType: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm">
                    <option value="คอร์สรวม">คอร์สรวม</option>
                    <option value="คอร์สเดี่ยว">คอร์สเดี่ยว</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-neutral-600 mb-1 block">จำนวนนักเรียนสูงสุด</label>
                  <input type="number" value={formData.maxStudents} onChange={(e) => setFormData({...formData, maxStudents: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-neutral-50 transition font-medium">
                ยกเลิก
              </button>
              <button onClick={handleAddClass} className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-medium flex items-center justify-center gap-2">
                <Save className="h-4 w-4" />
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-neutral-900">แก้ไขคาบสอน</h3>
              <button onClick={() => setShowEditModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-neutral-600 mb-1 block">วัน</label>
                  <select value={formData.day} onChange={(e) => setFormData({...formData, day: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm">
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-neutral-600 mb-1 block">เวลา</label>
                  <select value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm">
                    {timeSlots.filter(t => t !== '12:00-13:00').map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-neutral-600 mb-1 block">วิชา</label>
                  <select value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm">
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-neutral-600 mb-1 block">ระดับ</label>
                  <select value={formData.level} onChange={(e) => setFormData({...formData, level: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm">
                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-neutral-600 mb-1 block">ติวเตอร์</label>
                  <select value={formData.tutor} onChange={(e) => setFormData({...formData, tutor: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm">
                    {tutors.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-neutral-600 mb-1 block">ห้อง</label>
                  <select value={formData.room} onChange={(e) => setFormData({...formData, room: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm">
                    {rooms.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm text-neutral-600 mb-1 block">ประเภท</label>
                  <select value={formData.courseType} onChange={(e) => setFormData({...formData, courseType: e.target.value})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm">
                    <option value="คอร์สรวม">คอร์สรวม</option>
                    <option value="คอร์สเดี่ยว">คอร์สเดี่ยว</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-neutral-600 mb-1 block">นักเรียนปัจจุบัน</label>
                  <input type="number" value={formData.students} onChange={(e) => setFormData({...formData, students: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-sm text-neutral-600 mb-1 block">สูงสุด</label>
                  <input type="number" value={formData.maxStudents} onChange={(e) => setFormData({...formData, maxStudents: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-neutral-50 transition font-medium">
                ยกเลิก
              </button>
              <button onClick={() => {
                handleDeleteClass();
                handleAddClass();
                setShowEditModal(false);
              }} className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-medium flex items-center justify-center gap-2">
                <Save className="h-4 w-4" />
                บันทึกการแก้ไข
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-neutral-900 mb-2">ยืนยันการลบคาบสอน</h3>
            <p className="text-sm text-neutral-600 mb-4">
              คุณต้องการลบคาบ <span className="font-semibold">{selectedClass.subject} {selectedClass.level}</span> วัน{selectedClass.day} เวลา {selectedClass.time} ใช่หรือไม่?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-neutral-50 transition font-medium">
                ยกเลิก
              </button>
              <button onClick={handleDeleteClass} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition font-medium">
                ลบคาบสอน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}