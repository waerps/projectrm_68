import React, { useState } from 'react';

export default function TutorSchedule() {
    const [showModal, setShowModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [startPhoto, setStartPhoto] = useState(null);
    const [endPhoto, setEndPhoto] = useState(null);
    const [attendance, setAttendance] = useState({});

    // 🔍 Filter States
    const [filterSubject, setFilterSubject] = useState('all');
    const [filterLevel, setFilterLevel] = useState('all');
    const [filterCourseType, setFilterCourseType] = useState('all');
    const [viewMode, setViewMode] = useState('week');

    const today = 'ศุกร์';
    const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

    // ⏰ Time Slots - ครอบคลุมทั้งวันธรรมดาและวันหยุด
    const timeSlots = [
        '09:00-10:30',
        '10:30-12:00',
        '12:00-13:00', // พักเที่ยง
        '13:00-14:30',
        '14:30-16:00',
        '17:00-18:30',
        '19:00-20:30',
    ];

    // 🏫 Room to Floor Mapping
    const roomFloorMap = {
        'ห้อง 1': 'ชั้น 1',
        'ห้อง 2': 'ชั้น 2',
        'ห้อง 3': 'ชั้น 2',
        'ห้อง 4': 'ชั้น 2',
        'ห้อง 5': 'ชั้น 3',
        'ห้อง 6': 'ชั้น 3',
        'ห้อง 7': 'ชั้น 3',
        'Online': 'Online',
    };

    // 📊 ข้อมูลตารางสอนจริงตามที่กำหนด
    const scheduleData = {
        'จันทร์': {
            '17:00-18:30': {
                subject: 'คณิต',
                level: 'ป.4-6',
                room: 'ห้อง 1',
                students: 8,
                maxStudents: 15,
                courseType: 'คอร์สรวม'
            },
            '19:00-20:30': {
                subject: 'NETSAT',
                level: 'ม.4-6',
                room: 'Online',
                students: 12,
                maxStudents: 20,
                courseType: 'คอร์สรวม'
            },
        },
        'อังคาร': {
            '17:00-18:30': {
                subject: 'วิทย์',
                level: 'ม.4',
                room: 'ห้อง 2',
                students: 16,
                maxStudents: 20,
                courseType: 'คอร์สเดี่ยว'
            },
            '19:00-20:30': {
                subject: 'NETSAT',
                level: 'ม.4-6',
                room: 'Online',
                students: 10,
                maxStudents: 20,
                courseType: 'คอร์สรวม'
            },
        },
        'พุธ': {
            '17:00-18:30': {
                subject: 'อังกฤษ',
                level: 'ป.5-6',
                room: 'ห้อง 3',
                students: 9,
                maxStudents: 15,
                courseType: 'คอร์สรวม'
            },
            '19:00-20:30': {
                subject: 'NETSAT',
                level: 'ม.4-6',
                room: 'Online',
                students: 15,
                maxStudents: 20,
                courseType: 'คอร์สรวม'
            },
        },
        'พฤหัสบดี': {
            '17:00-18:30': {
                subject: 'ไทย',
                level: 'ป.4-6',
                room: 'ห้อง 4',
                students: 8,
                maxStudents: 15,
                courseType: 'คอร์สรวม'
            },
            '19:00-20:30': {
                subject: 'NETSAT',
                level: 'ม.4-6',
                room: 'Online',
                students: 11,
                maxStudents: 20,
                courseType: 'คอร์สรวม'
            },
        },
        'ศุกร์': {
            '17:00-18:30': {
                subject: 'คณิต',
                level: 'ป.5',
                room: 'ห้อง 1',
                students: 5,
                maxStudents: 10,
                courseType: 'คอร์สเดี่ยว'
            },
            '19:00-20:30': {
                subject: 'NETSAT',
                level: 'ม.4-6',
                room: 'Online',
                students: 14,
                maxStudents: 20,
                courseType: 'คอร์สรวม'
            },
        },
        'เสาร์': {
            '09:00-10:30': {
                subject: 'คณิต',
                level: 'ป.4-6',
                room: 'ห้อง 1',
                students: 8,
                maxStudents: 15,
                courseType: 'คอร์สรวม'
            },
            '10:30-12:00': {
                subject: 'NETSAT',
                level: 'ม.4-6',
                room: 'ห้อง 5',
                students: 12,
                maxStudents: 15,
                courseType: 'คอร์สรวม'
            },
            '13:00-14:30': {
                subject: 'วิทย์',
                level: 'ม.1',
                room: 'ห้อง 2',
                students: 12,
                maxStudents: 15,
                courseType: 'คอร์สรวม'
            },
            '14:30-16:00': {
                subject: 'สังคม',
                level: 'ม.1',
                room: 'ห้อง 6',
                students: 12,
                maxStudents: 15,
                courseType: 'คอร์สรวม'
            },
        },
        'อาทิตย์': {
            '09:00-10:30': {
                subject: 'คณิต',
                level: 'ป.4-6',
                room: 'ห้อง 1',
                students: 8,
                maxStudents: 15,
                courseType: 'คอร์สรวม'
            },
            '10:30-12:00': {
                subject: 'อังกฤษ',
                level: 'ป.5-6',
                room: 'ห้อง 3',
                students: 9,
                maxStudents: 15,
                courseType: 'คอร์สรวม'
            },
            '13:00-14:30': {
                subject: 'วิทย์',
                level: 'ม.2-3',
                room: 'ห้อง 2',
                students: 22,
                maxStudents: 25,
                courseType: 'คอร์สรวม'
            },
            '14:30-16:00': {
                subject: 'ไทย',
                level: 'ม.2-3',
                room: 'ห้อง 4',
                students: 22,
                maxStudents: 25,
                courseType: 'คอร์สรวม'
            },
        },
    };

    // 🎨 สีประจำวิชา
    const subjectColors = {
        'คณิต': 'bg-orange-500',
        'วิทย์': 'bg-blue-500',
        'ไทย': 'bg-pink-500',
        'สังคม': 'bg-yellow-600',
        'อังกฤษ': 'bg-purple-500',
        'NETSAT': 'bg-red-500',
        'A-Level': 'bg-teal-500',
    };

    // 🔍 Filter Function
    const applyFilters = (cls) => {
        if (!cls) return false;

        if (filterSubject !== 'all' && cls.subject !== filterSubject) return false;

        if (filterLevel !== 'all') {
            const level = cls.level;
            if (filterLevel.startsWith('ป.') && !level.includes('ป.')) return false;
            if (filterLevel.startsWith('ม.') && !level.includes('ม.')) return false;
            if (filterLevel !== 'all' && filterLevel.length === 3) {
                if (!level.includes(filterLevel)) return false;
            }
        }

        if (filterCourseType !== 'all' && cls.courseType !== filterCourseType) return false;

        return true;
    };

    const handleClick = (day, time, data) => {
        if (day !== today) return;
        setSelectedClass({ day, time, ...data });
        setShowModal(true);
    };

    // 🎓 Mock Students Data
    const studentsMock = [
        { id: 1, name: 'ด.ช. ภูมิพัฒน์' },
        { id: 2, name: 'ด.ญ. ณัฐวดี' },
        { id: 3, name: 'ด.ช. กฤษณะ' },
        { id: 4, name: 'ด.ญ. พิมพ์ชนก' },
    ];

    const toggleAttendance = (id) => {
        setAttendance((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const markAllPresent = (checked) => {
        const result = {}
        studentsMock.forEach((student) => {
          result[student.id] = checked
        })
        setAttendance(result)
    }

    const isAllChecked =
        studentsMock.length > 0 &&
        studentsMock.every((s) => attendance[s.id])


    const totalStudents = studentsMock.length;
    const presentCount = Object.values(attendance).filter(Boolean).length;
    const absentCount = totalStudents - presentCount;

    return (
        <div className="space-y-6 mt-[90px]">
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 max-w-[1384px] mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900">
                            ตารางสอนของฉัน
                        </h1>
                        <p className="text-sm text-neutral-500 mt-1">
                            แสดงคลาสที่คุณรับผิดชอบในแต่ละวัน
                        </p>
                    </div>

                    <div className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium">
                        วันนี้: {today}
                    </div>
                </div>

                {/* 🔍 Filter Bar - ยึดติดกับตาราง */}
                <div className="bg-white border border-neutral-200 rounded-xl p-3 mb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Filter: วิชา */}
                        <select
                            className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            value={filterSubject}
                            onChange={(e) => setFilterSubject(e.target.value)}
                        >
                            <option value="all">ทุกวิชา</option>
                            <option value="คณิต">คณิต</option>
                            <option value="วิทย์">วิทย์</option>
                            <option value="ไทย">ไทย</option>
                            <option value="สังคม">สังคม</option>
                            <option value="อังกฤษ">อังกฤษ</option>
                            <option value="NETSAT">NETSAT</option>
                            <option value="A-Level">A-Level</option>
                        </select>

                        {/* Filter: ระดับชั้น */}
                        <select
                            className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            value={filterLevel}
                            onChange={(e) => setFilterLevel(e.target.value)}
                        >
                            <option value="all">ทุกระดับ</option>
                            <option value="ป.3">ป.3</option>
                            <option value="ป.4">ป.4</option>
                            <option value="ป.5">ป.5</option>
                            <option value="ป.6">ป.6</option>
                            <option value="ม.1">ม.1</option>
                            <option value="ม.2">ม.2</option>
                            <option value="ม.3">ม.3</option>
                            <option value="ม.4">ม.4</option>
                            <option value="ม.5">ม.5</option>
                            <option value="ม.6">ม.6</option>
                        </select>

                        {/* Filter: ประเภทคอร์ส */}
                        <select
                            className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            value={filterCourseType}
                            onChange={(e) => setFilterCourseType(e.target.value)}
                        >
                            <option value="all">ทุกประเภท</option>
                            <option value="คอร์สเดี่ยว">คอร์สเดี่ยว</option>
                            <option value="คอร์สรวม">คอร์สรวม</option>
                        </select>

                        {/* View Mode Toggle */}
                        <div className="ml-auto flex bg-neutral-100 rounded-lg p-0.5">
                            <button
                                className={`px-4 py-1.5 rounded-md text-sm transition ${viewMode === 'day' ? 'bg-white shadow-sm text-orange-600 font-medium' : 'text-neutral-600'}`}
                                onClick={() => setViewMode('day')}
                            >
                                วัน
                            </button>
                            <button
                                className={`px-4 py-1.5 rounded-md text-sm transition ${viewMode === 'week' ? 'bg-white shadow-sm text-orange-600 font-medium' : 'text-neutral-600'}`}
                                onClick={() => setViewMode('week')}
                            >
                                สัปดาห์
                            </button>
                        </div>
                    </div>
                </div>

                {/* ตาราง */}
                <div className="bg-neutral-50 rounded-2xl p-4">
                    <div className="grid grid-cols-8 gap-2">
                        <div className="text-center font-semibold text-neutral-700 py-2 text-sm">เวลา</div>

                        {days.map((d) => (
                            <div
                                key={d}
                                className={`text-center font-semibold py-2 rounded-xl text-sm ${d === today
                                        ? 'bg-orange-500 text-white'
                                        : 'text-neutral-700'
                                    }`}
                            >
                                {d}
                            </div>
                        ))}

                        {timeSlots.map((time) => (
                            <React.Fragment key={time}>
                                <div className="text-center text-xs text-neutral-600 py-3 font-medium flex items-center justify-center">
                                    {time}
                                </div>

                                {days.map((d) => {
                                    const cls = scheduleData[d]?.[time];
                                    const isLunch = time === '12:00-13:00';
                                    const isToday = d === today;
                                    const showClass = cls && applyFilters(cls);

                                    let cn = 'min-h-[85px] p-2 rounded-xl border-2 transition-all duration-200 ';

                                    if (isLunch) {
                                        cn += 'bg-neutral-100 border-neutral-200';
                                    } else if (isToday && showClass) {
                                        cn += 'bg-white border-neutral-300 hover:shadow-md cursor-pointer';
                                    } else if (showClass) {
                                        cn += 'bg-neutral-100 border-neutral-200 opacity-70 cursor-not-allowed';
                                    } else {
                                        cn += 'bg-neutral-50 border-neutral-100';
                                    }

                                    return (
                                        <div
                                            key={d + time}
                                            className={cn}
                                            onClick={() => !isLunch && isToday && showClass && handleClick(d, time, cls)}
                                        >
                                            {isLunch ? (
                                                <div className="flex items-center justify-center h-full">
                                                    <span className="text-xs text-neutral-400">พักเที่ยง</span>
                                                </div>
                                            ) : showClass ? (
                                                <div className="space-y-0.5">
                                                    <div className={`${subjectColors[cls.subject]} text-white text-xs font-semibold px-2 py-1 rounded-md`}>
                                                        {cls.subject}
                                                    </div>
                                                    <div className="text-xs text-neutral-700 font-medium px-1">
                                                        {cls.level}
                                                    </div>
                                                    <div className="text-xs text-neutral-600 px-1">
                                                        {cls.room}
                                                    </div>
                                                    <div className="text-xs text-neutral-500 px-1">
                                                        {roomFloorMap[cls.room]}
                                                    </div>
                                                    <div className="text-xs text-neutral-700 font-medium px-1">
                                                        {cls.students}/{cls.maxStudents}
                                                    </div>

                                                    {isToday && (
                                                        <div className="mt-1 text-[10px] text-orange-600 font-medium px-1">
                                                            กดเพื่อบันทึก
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* 📝 Modal บันทึกการสอน */}
            {showModal && selectedClass && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between sticky top-0 bg-white">
                            <h2 className="text-xl font-bold">บันทึกการสอนวันนี้</h2>
                            <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-600">
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <div className="text-sm text-neutral-600">วิชา</div>
                                    <div className="bg-neutral-50 rounded-xl p-3 font-medium">
                                        {selectedClass.subject}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-neutral-600">ชั้นเรียน</div>
                                    <div className="bg-neutral-50 rounded-xl p-3 font-medium">
                                        {selectedClass.level}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-neutral-600">ห้อง</div>
                                    <div className="bg-neutral-50 rounded-xl p-3 font-medium">
                                        {selectedClass.room}
                                    </div>
                                </div>
                            </div>

                            {/* 📸 รูปต้นคาบ / ท้ายคาบ */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm text-neutral-600">รูปต้นคาบ</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={(e) => setStartPhoto(e.target.files[0])}
                                        className="mt-1 block w-full text-sm"
                                    />
                                    {startPhoto && (
                                        <p className="text-xs text-green-600 mt-1">✓ เลือกรูปแล้ว</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm text-neutral-600">รูประหว่างคาบ</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={(e) => setStartPhoto(e.target.files[0])}
                                        className="mt-1 block w-full text-sm"
                                    />
                                    {startPhoto && (
                                        <p className="text-xs text-green-600 mt-1">✓ เลือกรูปแล้ว</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm text-neutral-600">รูปท้ายคาบ</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={(e) => setEndPhoto(e.target.files[0])}
                                        className="mt-1 block w-full text-sm"
                                    />
                                    {endPhoto && (
                                        <p className="text-xs text-green-600 mt-1">✓ เลือกรูปแล้ว</p>
                                    )}
                                </div>
                            </div>

                            <textarea
                                rows="3"
                                placeholder="บันทึกสิ่งที่สอนในคาบนี้…"
                                className="w-full border rounded-xl p-3"
                            />

                            {/* 📋 เช็กชื่อนักเรียน */}
                            <div className="space-y-3">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-sm text-neutral-800">
                                        เช็กชื่อนักเรียน
                                    </h3>

                                    {/* ✅ มาเรียนทั้งหมด */}
                                    <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={isAllChecked}
                                            onChange={(e) => markAllPresent(e.target.checked)}
                                            className="accent-orange-500"
                                        />
                                        <span className="text-orange-600 font-medium">
                                            มาเรียนทั้งหมด
                                        </span>
                                    </label>
                                </div>

                                {/* List */}
                                <div className="max-h-44 overflow-y-auto rounded-2xl bg-neutral-50 p-3 space-y-2">
                                    {studentsMock.map((student) => (
                                        <label
                                            key={student.id}
                                            className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-sm cursor-pointer hover:bg-orange-50 transition"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={attendance[student.id] || false}
                                                onChange={() => toggleAttendance(student.id)}
                                                className="accent-orange-500"
                                            />
                                            <span className="text-neutral-800">{student.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* 🔢 สรุปการเข้าเรียน */}
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-neutral-50 rounded-xl p-3">
                                    <div className="text-xs text-neutral-500">ทั้งหมด</div>
                                    <div className="text-lg font-bold">{totalStudents}</div>
                                </div>

                                <div className="bg-green-50 rounded-xl p-3">
                                    <div className="text-xs text-green-600">มาเรียน</div>
                                    <div className="text-lg font-bold text-green-700">
                                        {presentCount}
                                    </div>
                                </div>

                                <div className="bg-red-50 rounded-xl p-3">
                                    <div className="text-xs text-red-600">ขาด</div>
                                    <div className="text-lg font-bold text-red-700">
                                        {absentCount}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2 border rounded-xl"
                            >
                                ยกเลิก
                            </button>
                            <button className="px-6 py-2 bg-orange-500 text-white rounded-xl">
                                บันทึก
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}