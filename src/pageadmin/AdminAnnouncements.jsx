import { useState } from 'react';
import {
    Megaphone, Plus, Search, Filter, Edit, Trash2, Eye, EyeOff,
    Pin, Image as ImageIcon, Calendar, Tag, Users, X, Save,
    TrendingUp, Bell, BookOpen, PartyPopper, AlertCircle
} from 'lucide-react';

export default function AdminAnnouncements() {
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [targetFilter, setTargetFilter] = useState('all');

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedNews, setSelectedNews] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        category: 'ข่าวประชาสัมพันธ์',
        target: 'public',
        date: '',
        content: '',
        image: null,
        isPinned: false,
        isVisible: true
    });

    const [announcements, setAnnouncements] = useState([
        {
            id: 1,
            title: 'ยินดีกับน้อง ๆ ศิษย์เก่าศรเสริม ติดคณะแพทยศาสตร์ จุฬาฯ หลายรายต่อเนื่อง',
            category: 'ข่าวประชาสัมพันธ์',
            target: 'public',
            date: '15/12/2567',
            content: 'ขอแสดงความยินดีกับนักเรียนศิษย์เก่าศรเสริมที่สอบติดคณะแพทยศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย',
            image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
            isPinned: true,
            isVisible: true,
            views: 245
        },
        {
            id: 2,
            title: 'รีวิวจากนักเรียน เรียนเนื้อหากระชับ เข้าใจง่าย ทำให้เกรดเพิ่มขึ้นอย่างเห็นได้ชัด',
            category: 'รีวิวจากนักเรียน',
            target: 'public',
            date: '10/12/2567',
            content: 'นักเรียนแชร์ประสบการณ์การเรียนที่ศรเสริม ติวเตอร์',
            image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
            isPinned: false,
            isVisible: true,
            views: 189
        },
        {
            id: 3,
            title: 'แจ้งการประชุมติวเตอร์ประจำเดือนมกราคม 2568 กรุณาเข้าร่วมทุกคน',
            category: 'ประกาศภายใน',
            target: 'tutors',
            date: '05/01/2568',
            content: 'ขอเชิญติวเตอร์ทุกท่านเข้าร่วมประชุมประจำเดือน วันที่ 15 มกราคม 2568 เวลา 14:00 น.',
            image: 'https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?w=800',
            isPinned: true,
            isVisible: true,
            views: 45
        },
        {
            id: 4,
            title: 'เปิดรับสมัครนักเรียนใหม่ ภาคเรียนที่ 2/2567',
            category: 'ข่าวประชาสัมพันธ์',
            target: 'students',
            date: '02/01/2568',
            content: 'เปิดรับสมัครนักเรียนใหม่ทุกระดับชั้น รับจำนวนจำกัด',
            image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800',
            isPinned: false,
            isVisible: true,
            views: 312
        },
        {
            id: 5,
            title: 'กิจกรรมทัศนศึกษาประจำปี 2568',
            category: 'ข่าวกิจกรรม',
            target: 'public',
            date: '28/12/2567',
            content: 'ชวนนักเรียนและผู้ปกครองร่วมทัศนศึกษาพิพิธภัณฑ์วิทยาศาสตร์',
            image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800',
            isPinned: false,
            isVisible: true,
            views: 156
        },
        {
            id: 6,
            title: 'ประกาศเปลี่ยนแปลงอัตราค่าสอน ประจำปี 2568',
            category: 'ประกาศภายใน',
            target: 'tutors',
            date: '20/12/2567',
            content: 'แจ้งเปลี่ยนแปลงอัตราค่าสอนและสวัสดิการติวเตอร์',
            image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800',
            isPinned: false,
            isVisible: false,
            views: 38
        },
    ]);

    const categories = [
        { value: 'ข่าวประชาสัมพันธ์', icon: Megaphone, color: 'bg-blue-100 text-blue-700' },
        { value: 'รีวิวจากนักเรียน', icon: Users, color: 'bg-purple-100 text-purple-700' },
        { value: 'ประกาศภายใน', icon: Bell, color: 'bg-orange-100 text-orange-700' },
        { value: 'ข่าวกิจกรรม', icon: PartyPopper, color: 'bg-pink-100 text-pink-700' },
    ];

    const targets = [
        { value: 'public', label: 'ทุกคน', icon: Users },
        { value: 'students', label: 'นักเรียน', icon: BookOpen },
        { value: 'tutors', label: 'ติวเตอร์', icon: Users },
    ];

    // Filter announcements
    const filteredAnnouncements = announcements.filter((item) => {
        if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) && !item.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
        if (statusFilter !== 'all') {
            if (statusFilter === 'visible' && !item.isVisible) return false;
            if (statusFilter === 'hidden' && item.isVisible) return false;
            if (statusFilter === 'pinned' && !item.isPinned) return false;
        }
        if (targetFilter !== 'all' && item.target !== targetFilter) return false;
        return true;
    });

    // Calculate stats
    const totalAnnouncements = announcements.length;
    const visibleAnnouncements = announcements.filter(a => a.isVisible).length;
    const pinnedAnnouncements = announcements.filter(a => a.isPinned).length;
    const totalViews = announcements.reduce((sum, a) => sum + a.views, 0);

    // Get category badge
    const getCategoryBadge = (category) => {
        const cat = categories.find(c => c.value === category);
        if (!cat) return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{category}</span>;
        const Icon = cat.icon;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${cat.color} flex items-center gap-1 w-fit`}>
                <Icon className="h-3 w-3" />
                {category}
            </span>
        );
    };

    // Get target badge
    const getTargetBadge = (target) => {
        const t = targets.find(t => t.value === target);
        if (!t) return null;
        const Icon = t.icon;
        return (
            <span className="px-2 py-1 rounded-full text-xs bg-neutral-100 text-neutral-700 flex items-center gap-1 w-fit">
                <Icon className="h-3 w-3" />
                {t.label}
            </span>
        );
    };

    // Handle image upload
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
                setFormData({ ...formData, image: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    // Toggle visibility
    const toggleVisibility = (id) => {
        setAnnouncements(announcements.map(a =>
            a.id === id ? { ...a, isVisible: !a.isVisible } : a
        ));
    };

    // Toggle pin
    const togglePin = (id) => {
        setAnnouncements(announcements.map(a =>
            a.id === id ? { ...a, isPinned: !a.isPinned } : a
        ));
    };

    // Handle add
    const handleAdd = () => {
        const newAnnouncement = {
            id: Date.now(),
            ...formData,
            date: new Date().toLocaleDateString('th-TH'),
            views: 0
        };
        setAnnouncements([newAnnouncement, ...announcements]);
        resetForm();
        setShowAddModal(false);
    };

    // Handle edit
    const handleEdit = () => {
        setAnnouncements(announcements.map(a =>
            a.id === selectedNews.id ? { ...a, ...formData } : a
        ));
        resetForm();
        setShowEditModal(false);
    };

    // Handle delete
    const handleDelete = () => {
        setAnnouncements(announcements.filter(a => a.id !== selectedNews.id));
        setShowDeleteModal(false);
        setSelectedNews(null);
    };

    // Open edit modal
    const openEditModal = (item) => {
        setSelectedNews(item);
        setFormData({
            title: item.title,
            category: item.category,
            target: item.target,
            date: item.date,
            content: item.content,
            image: item.image,
            isPinned: item.isPinned,
            isVisible: item.isVisible
        });
        setImagePreview(item.image);
        setShowEditModal(true);
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            title: '',
            category: 'ข่าวประชาสัมพันธ์',
            target: 'public',
            date: '',
            content: '',
            image: null,
            isPinned: false,
            isVisible: true
        });
        setImagePreview(null);
        setSelectedNews(null);
    };

    return (
        <div className="min-h-screen space-y-6 mt-[90px]">
            <div className="mx-auto max-w-[1400px] px-4">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-900">จัดการข่าวประชาสัมพันธ์</h1>
                            <p className="mt-1 text-sm text-neutral-500">จัดการข่าวสารและประกาศทั้งหมดในระบบ</p>
                        </div>
                        <button onClick={() => { resetForm(); setShowAddModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-medium">
                            <Plus className="h-4 w-4" />
                            เพิ่มข่าวใหม่
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl border-2 border-neutral-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Megaphone className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">ข่าวทั้งหมด</p>
                                <p className="text-2xl font-bold text-neutral-900">{totalAnnouncements}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border-2 border-neutral-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <Eye className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">กำลังแสดง</p>
                                <p className="text-2xl font-bold text-neutral-900">{visibleAnnouncements}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border-2 border-neutral-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-orange-100 rounded-xl">
                                <Pin className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">ข่าวปักหมุด</p>
                                <p className="text-2xl font-bold text-neutral-900">{pinnedAnnouncements}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border-2 border-neutral-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <TrendingUp className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600">การเข้าชมรวม</p>
                                <p className="text-2xl font-bold text-neutral-900">{totalViews}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white border-2 border-neutral-200 rounded-xl p-4 mb-6">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                            <Filter className="h-4 w-4 text-orange-600" />
                            <span>กรองข้อมูล</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                                <input type="text" placeholder="ค้นหาข่าว..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 w-full bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" />
                            </div>

                            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500">
                                <option value="all">ทุกหมวดหมู่</option>
                                {categories.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
                            </select>

                            <select value={targetFilter} onChange={(e) => setTargetFilter(e.target.value)} className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500">
                                <option value="all">ทุกกลุ่มเป้าหมาย</option>
                                {targets.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>

                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500">
                                <option value="all">ทุกสถานะ</option>
                                <option value="visible">กำลังแสดง</option>
                                <option value="hidden">ซ่อนอยู่</option>
                                <option value="pinned">ปักหมุด</option>
                            </select>

                            <button onClick={() => {
                                setSearchQuery('');
                                setCategoryFilter('all');
                                setTargetFilter('all');
                                setStatusFilter('all');
                            }} className="px-4 py-2 border border-neutral-300 rounded-lg text-sm hover:bg-neutral-50 transition">
                                ล้างตัวกรอง
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Counter */}
                <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-neutral-600">
                            แสดง <span className="font-bold text-neutral-900">{filteredAnnouncements.length}</span> จาก {announcements.length} ข่าว
                        </span>
                    </div>
                </div>

                {/* Announcements List */}
                <div className="space-y-4">
                    {filteredAnnouncements.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border-2 border-neutral-200">
                            <Megaphone className="h-16 w-16 text-neutral-300 mx-auto mb-3" />
                            <p className="text-neutral-500 text-sm">ไม่พบข่าวที่ค้นหา</p>
                        </div>
                    ) : (
                        filteredAnnouncements.map((item) => (
                            <div key={item.id} className="bg-white rounded-2xl border-2 border-neutral-200 hover:border-orange-300 transition overflow-hidden">
                                <div className="p-5">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        {/* Image */}
                                        <div className="md:w-[200px]">
                                            <img src={item.image} alt={item.title} onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=800'; }} className="h-32 md:h-32 w-full rounded-xl object-cover" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                        {item.isPinned && (
                                                            <Pin className="h-4 w-4 text-orange-500 fill-orange-500" />
                                                        )}
                                                        <h3 className="font-bold text-neutral-900 text-base">{item.title}</h3>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        {getCategoryBadge(item.category)}
                                                        {getTargetBadge(item.target)}
                                                        <span className="text-xs text-neutral-500 flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {item.date}
                                                        </span>
                                                        <span className="text-xs text-neutral-500 flex items-center gap-1">
                                                            <Eye className="h-3 w-3" />
                                                            {item.views} ครั้ง
                                                        </span>
                                                        {!item.isVisible && (
                                                            <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700 flex items-center gap-1">
                                                                <EyeOff className="h-3 w-3" />
                                                                ซ่อนอยู่
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="text-sm text-neutral-600 line-clamp-2">{item.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-4 mt-4 border-t border-neutral-200">
                                        <button onClick={() => toggleVisibility(item.id)} className={`flex-1 flex items-center justify-center gap-2 border-2 rounded-xl py-2 hover:bg-neutral-50 transition font-medium text-sm ${item.isVisible ? 'border-neutral-300 text-neutral-700' : 'border-green-300 text-green-700'}`}>
                                            {item.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            {item.isVisible ? 'ซ่อน' : 'แสดง'}
                                        </button>

                                        <button onClick={() => togglePin(item.id)} className={`flex-1 flex items-center justify-center gap-2 border-2 rounded-xl py-2 transition font-medium text-sm ${item.isPinned ? 'border-orange-300 text-orange-700 bg-orange-50' : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'}`}>
                                            <Pin className="h-4 w-4" />
                                            {item.isPinned ? 'เลิกปักหมุด' : 'ปักหมุด'}
                                        </button>

                                        <button onClick={() => openEditModal(item)} className="flex-1 flex items-center justify-center gap-2 border-2 border-blue-300 text-blue-700 rounded-xl py-2 hover:bg-blue-50 transition font-medium text-sm">
                                            <Edit className="h-4 w-4" />
                                            แก้ไข
                                        </button>

                                        <button onClick={() => { setSelectedNews(item); setShowDeleteModal(true); }} className="flex-1 flex items-center justify-center gap-2 border-2 border-red-300 text-red-700 rounded-xl py-2 hover:bg-red-50 transition font-medium text-sm">
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 my-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-neutral-900">เพิ่มข่าวใหม่</h3>
                            <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-neutral-400 hover:text-neutral-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                            <div>
                                <label className="text-sm text-neutral-700 font-medium mb-2 block">หัวข้อข่าว</label>
                                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="ระบุหัวข้อข่าว..." className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-neutral-700 font-medium mb-2 block">หมวดหมู่</label>
                                    <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500">
                                        {categories.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm text-neutral-700 font-medium mb-2 block">กลุ่มเป้าหมาย</label>
                                    <select value={formData.target} onChange={(e) => setFormData({ ...formData, target: e.target.value })} className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500">
                                        {targets.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-neutral-700 font-medium mb-2 block">เนื้อหา</label>
                                <textarea rows="4" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="เขียนเนื้อหาข่าว..." className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" />
                            </div>

                            <div>
                                <label className="text-sm text-neutral-700 font-medium mb-2 block">รูปภาพ</label>
                                <div
                                    className="border-2 border-dashed border-neutral-300 rounded-xl p-6 text-center hover:border-orange-400 transition cursor-pointer"
                                    onClick={() => document.getElementById('imageUpload').click()}
                                >
                                    <ImageIcon className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                                    <p className="text-sm text-neutral-500">
                                        คลิกเพื่ออัปโหลดรูปภาพ
                                    </p>
                                    <input
                                        id="imageUpload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                    />
                                </div>

                                {imagePreview && (
                                    <div className="mt-3">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="h-40 w-full object-cover rounded-xl border"
                                        />
                                    </div>
                                )}

                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={formData.isPinned}
                                            onChange={(e) =>
                                                setFormData({ ...formData, isPinned: e.target.checked })
                                            }
                                        />
                                        ปักหมุดข่าว
                                    </label>

                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={formData.isVisible}
                                            onChange={(e) =>
                                                setFormData({ ...formData, isVisible: e.target.checked })
                                            }
                                        />
                                        แสดงข่าว
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowAddModal(false)
                                        resetForm()
                                    }}
                                    className="px-4 py-2 rounded-xl border border-neutral-300 text-sm"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleAdd}
                                    className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition flex items-center gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    บันทึก
                                </button>
                            </div>
                        </div>
                    </div>
                )

                    {/* Edit Modal */}
                    {showEditModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 my-8">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-neutral-900">
                                        แก้ไขข่าว
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setShowEditModal(false)
                                            resetForm()
                                        }}
                                        className="text-neutral-400 hover:text-neutral-600"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) =>
                                            setFormData({ ...formData, title: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm"
                                    />

                                    <textarea
                                        rows="4"
                                        value={formData.content}
                                        onChange={(e) =>
                                            setFormData({ ...formData, content: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={() => {
                                            setShowEditModal(false)
                                            resetForm()
                                        }}
                                        className="px-4 py-2 rounded-xl border border-neutral-300 text-sm"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        onClick={handleEdit}
                                        className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition flex items-center gap-2"
                                    >
                                        <Save className="h-4 w-4" />
                                        บันทึกการแก้ไข
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Delete Modal */}
                    {showDeleteModal && selectedNews && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl max-w-md w-full p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <AlertCircle className="h-6 w-6 text-red-500" />
                                    <h3 className="text-lg font-bold text-neutral-900">
                                        ยืนยันการลบข่าว
                                    </h3>
                                </div>

                                <p className="text-sm text-neutral-600 mb-6">
                                    คุณแน่ใจหรือไม่ว่าต้องการลบข่าว
                                    <span className="font-medium"> “{selectedNews.title}”</span>
                                </p>

                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowDeleteModal(false)}
                                        className="px-4 py-2 rounded-xl border border-neutral-300 text-sm"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition flex items-center gap-2"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        ลบข่าว
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
                    

