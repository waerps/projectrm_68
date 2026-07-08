import { useState, useEffect, useCallback } from 'react';
import {
    Megaphone, Plus, Search, Filter, Edit2, Trash2, Eye,
    Image as ImageIcon, Calendar, Users, X, Save,
    TrendingUp, Bell, BookOpen, PartyPopper, AlertCircle,
    ChevronLeft, ChevronRight, Loader2, Inbox, Images,
} from 'lucide-react';

const API_BASE = 'http://localhost:3000/api/admin/news';
const SERVER_URL = 'http://localhost:3000';
const ITEMS_PER_PAGE = 10;

const CATEGORIES = [
    { value: 'ข่าวประชาสัมพันธ์', icon: Megaphone, color: 'bg-blue-100 text-blue-700' },
    { value: 'รีวิวจากนักเรียน', icon: Users, color: 'bg-purple-100 text-purple-700' },
    { value: 'ประกาศภายใน', icon: Bell, color: 'bg-orange-100 text-orange-700' },
    { value: 'ข่าวกิจกรรม', icon: PartyPopper, color: 'bg-pink-100 text-pink-700' },
];

const TARGETS = [
    { value: 'public', label: 'ทุกคน (นักเรียน + ติวเตอร์)', icon: BookOpen },
    { value: 'tutor', label: 'ติวเตอร์เท่านั้น', icon: Users },
];

const EMPTY_FORM = {
    title: '',
    category: 'ข่าวประชาสัมพันธ์',
    target: 'public',
    content: '',
    // รูปหน้าปก
    coverImage: null,          // File | null
    coverPreview: null,        // blob URL | server URL | null
    // รูปเพิ่มเติม (ใหม่)
    newExtraFiles: [],         // File[]
    newExtraPreviews: [],      // blob URL[]
    // รูปเพิ่มเติม (มีอยู่แล้ว — กรณีแก้ไข)
    existingExtras: [],        // [{ImageId, ImagePath}]
    removedExtraIds: [],       // ImageId[] ที่จะลบ
};

// ─── helpers ─────────────────────────────────────────────────────────────────
function imgSrc(image) {
    if (!image) return null;
    if (image.startsWith('blob:') || image.startsWith('data:')) return image;
    if (image.startsWith('/')) return `${SERVER_URL}${image}`;
    return image;
}

function formatThaiDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
}

function CategoryBadge({ category }) {
    const cat = CATEGORIES.find(c => c.value === category);
    if (!cat) return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{category}</span>;
    const Icon = cat.icon;
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${cat.color} inline-flex items-center gap-1`}>
            <Icon className="h-3 w-3" />{category}
        </span>
    );
}

function TargetBadge({ target }) {
    const t = TARGETS.find(t => t.value === target);
    if (!t) return null;
    const Icon = t.icon;
    return (
        <span className="px-2 py-1 rounded-full text-xs bg-neutral-100 text-neutral-700 inline-flex items-center gap-1">
            <Icon className="h-3 w-3" />{t.label}
        </span>
    );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────
function Modal({ children, onClose }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 my-8 relative">
                {children}
            </div>
        </div>
    );
}

// ─── NewsForm ─────────────────────────────────────────────────────────────────
function NewsForm({ formData, setFormData, onSubmit, onCancel, submitLabel, submitClass }) {

    // ── หน้าปก ──
    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // revoke ตัวเก่าถ้าเป็น blob
        if (formData.coverPreview?.startsWith('blob:')) URL.revokeObjectURL(formData.coverPreview);
        setFormData(f => ({ ...f, coverImage: file, coverPreview: URL.createObjectURL(file) }));
    };

    const removeCover = () => {
        if (formData.coverPreview?.startsWith('blob:')) URL.revokeObjectURL(formData.coverPreview);
        setFormData(f => ({ ...f, coverImage: null, coverPreview: null }));
    };

    // ── รูปเพิ่มเติม (ใหม่) ──
    const handleExtraChange = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        const previews = files.map(f => URL.createObjectURL(f));
        setFormData(f => ({
            ...f,
            newExtraFiles: [...f.newExtraFiles, ...files],
            newExtraPreviews: [...f.newExtraPreviews, ...previews],
        }));
        e.target.value = ''; // reset input เพื่อเลือกซ้ำได้
    };

    const removeNewExtra = (idx) => {
        setFormData(f => {
            URL.revokeObjectURL(f.newExtraPreviews[idx]);
            return {
                ...f,
                newExtraFiles: f.newExtraFiles.filter((_, i) => i !== idx),
                newExtraPreviews: f.newExtraPreviews.filter((_, i) => i !== idx),
            };
        });
    };

    // ── รูปเพิ่มเติม (เดิม) — กดลบ ──
    const removeExistingExtra = (imageId) => {
        setFormData(f => ({
            ...f,
            existingExtras: f.existingExtras.filter(img => img.ImageId !== imageId),
            removedExtraIds: [...f.removedExtraIds, imageId],
        }));
    };

    const inp = "w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";
    const lbl = "text-sm text-neutral-700 font-medium mb-1 block";
    const totalExtras = formData.existingExtras.length + formData.newExtraPreviews.length;

    return (
        <div className="space-y-5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">

            {/* หัวข้อ */}
            <div>
                <label className={lbl}>หัวข้อข่าว <span className="text-red-500">*</span></label>
                <input type="text" className={inp}
                    value={formData.title}
                    onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                    placeholder="ระบุหัวข้อข่าว..." />
            </div>

            {/* Category + Target */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={lbl}>หมวดหมู่</label>
                    <select className={inp} value={formData.category}
                        onChange={e => setFormData(f => ({ ...f, category: e.target.value }))}>
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
                    </select>
                </div>
                <div>
                    <label className={lbl}>กลุ่มเป้าหมาย</label>
                    <select className={inp} value={formData.target}
                        onChange={e => setFormData(f => ({ ...f, target: e.target.value }))}>
                        {TARGETS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>
            </div>

            {/* เนื้อหา */}
            <div>
                <label className={lbl}>เนื้อหา</label>
                <textarea rows={4} className={inp + " resize-none"}
                    value={formData.content}
                    onChange={e => setFormData(f => ({ ...f, content: e.target.value }))}
                    placeholder="เขียนเนื้อหาข่าว..." />
            </div>

            {/* ══ รูปหน้าปก ══ */}
            <div>
                <label className={lbl}>
                    <span className="flex items-center gap-1.5">
                        <ImageIcon className="h-4 w-4 text-orange-500" />
                        รูปหน้าปก
                        <span className="text-xs text-neutral-400 font-normal">(1 รูป)</span>
                    </span>
                </label>

                {formData.coverPreview ? (
                    <div className="relative mt-1">
                        <img src={formData.coverPreview} alt="cover"
                            className="h-44 w-full object-cover rounded-xl border border-neutral-200" />
                        <button onClick={removeCover}
                            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-50 transition">
                            <X className="h-4 w-4 text-red-500" />
                        </button>
                        <span className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            หน้าปก
                        </span>
                    </div>
                ) : (
                    <div onClick={() => document.getElementById('coverImageInput').click()}
                        className="border-2 border-dashed border-neutral-300 rounded-xl p-6 text-center hover:border-orange-400 transition cursor-pointer mt-1">
                        <ImageIcon className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                        <p className="text-sm text-neutral-500">คลิกเพื่ออัปโหลดรูปหน้าปก</p>
                        <p className="text-xs text-neutral-400 mt-0.5">PNG, JPG ขนาดไม่เกิน 5MB</p>
                    </div>
                )}
                <input id="coverImageInput" type="file" accept="image/*"
                    className="hidden" onChange={handleCoverChange} />
            </div>

            {/* ══ รูปภาพอื่นๆ ══ */}
            <div>
                <label className={lbl}>
                    <span className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                            <Images className="h-4 w-4 text-orange-500" />
                            รูปภาพอื่นๆ
                            <span className="text-xs text-neutral-400 font-normal">(เพิ่มได้หลายรูป สูงสุด 10 รูป)</span>
                        </span>
                        {totalExtras > 0 && (
                            <span className="text-xs font-semibold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                                {totalExtras} รูป
                            </span>
                        )}
                    </span>
                </label>

                {/* Grid รูปที่มีอยู่แล้ว (กรณีแก้ไข) */}
                {formData.existingExtras.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-2 mt-1">
                        {formData.existingExtras.map(img => (
                            <div key={img.ImageId} className="relative group">
                                <img src={imgSrc(img.ImagePath)} alt=""
                                    className="h-24 w-full object-cover rounded-xl border border-neutral-200" />
                                <button
                                    onClick={() => removeExistingExtra(img.ImageId)}
                                    className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow
                                               opacity-0 group-hover:opacity-100 transition hover:bg-red-50">
                                    <X className="h-3.5 w-3.5 text-red-500" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Grid รูปใหม่ที่เพิ่ง upload */}
                {formData.newExtraPreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-2 mt-1">
                        {formData.newExtraPreviews.map((url, idx) => (
                            <div key={idx} className="relative group">
                                <img src={url} alt=""
                                    className="h-24 w-full object-cover rounded-xl border border-orange-200" />
                                <button onClick={() => removeNewExtra(idx)}
                                    className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow
                                               opacity-0 group-hover:opacity-100 transition hover:bg-red-50">
                                    <X className="h-3.5 w-3.5 text-red-500" />
                                </button>
                                <span className="absolute bottom-1 left-1 bg-orange-500 text-white
                                                 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                    ใหม่
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* ปุ่มเพิ่มรูป */}
                {totalExtras < 10 && (
                    <div onClick={() => document.getElementById('extraImagesInput').click()}
                        className="border-2 border-dashed border-neutral-300 rounded-xl p-4 text-center
                                   hover:border-orange-400 transition cursor-pointer mt-1">
                        <Plus className="h-5 w-5 text-neutral-400 mx-auto mb-1" />
                        <p className="text-sm text-neutral-500">เพิ่มรูปภาพ</p>
                        <p className="text-xs text-neutral-400 mt-0.5">เลือกได้หลายรูปพร้อมกัน</p>
                    </div>
                )}
                <input id="extraImagesInput" type="file" accept="image/*"
                    multiple className="hidden" onChange={handleExtraChange} />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-2">
                <button onClick={onCancel}
                    className="px-4 py-2 rounded-xl border border-neutral-300 text-sm hover:bg-neutral-50 transition">
                    ยกเลิก
                </button>
                <button onClick={onSubmit}
                    className={`px-4 py-2 rounded-xl text-white text-sm font-medium transition flex items-center gap-2 ${submitClass}`}>
                    <Save className="h-4 w-4" />{submitLabel}
                </button>
            </div>
        </div>
    );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ currentPage, totalPages, onChange }) {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
        .reduce((acc, p, idx, arr) => {
            if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
            acc.push(p);
            return acc;
        }, []);
    return (
        <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
            <button onClick={() => onChange(currentPage - 1)} disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-neutral-300 text-sm disabled:opacity-40 hover:bg-neutral-50 transition">
                <ChevronLeft className="h-4 w-4" /> ก่อนหน้า
            </button>
            {pages.map((p, idx) => p === '...' ? (
                <span key={`e${idx}`} className="px-2 text-neutral-400 text-sm">…</span>
            ) : (
                <button key={p} onClick={() => onChange(p)}
                    className={`w-9 h-9 rounded-lg border text-sm transition ${p === currentPage
                        ? 'bg-orange-500 text-white border-orange-500 font-semibold'
                        : 'border-neutral-300 hover:bg-neutral-50'}`}>
                    {p}
                </button>
            ))}
            <button onClick={() => onChange(currentPage + 1)} disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-neutral-300 text-sm disabled:opacity-40 hover:bg-neutral-50 transition">
                ถัดไป <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminAnnouncements() {
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [targetFilter, setTargetFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [announcements, setAnnouncements] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [stats, setStats] = useState({ total: 0, tutorCount: 0, studentCount: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedNews, setSelectedNews] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState(EMPTY_FORM);

    // ── fetch ──────────────────────────────────────────────────────────────────
    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE}/stats`);
            if (!res.ok) return;
            setStats(await res.json());
        } catch (err) { console.error('fetchStats:', err); }
    };

    const fetchAnnouncements = useCallback(async (page = 1) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: ITEMS_PER_PAGE });
            if (searchQuery) params.set('search', searchQuery);
            if (categoryFilter !== 'all') params.set('category', categoryFilter);
            if (targetFilter !== 'all') params.set('target', targetFilter);
            const json = await (await fetch(`${API_BASE}?${params}`)).json();
            setAnnouncements(json.data ?? []);
            setTotalCount(json.pagination?.total ?? 0);
        } catch (err) {
            console.error(err);
            setAnnouncements([]);
        } finally { setIsLoading(false); }
    }, [searchQuery, categoryFilter, targetFilter]);

    useEffect(() => {
        fetchAnnouncements(currentPage);
        fetchStats();
    }, [fetchAnnouncements, currentPage]);

    useEffect(() => { setCurrentPage(1); }, [searchQuery, categoryFilter, targetFilter, statusFilter]);

    // ── helpers ────────────────────────────────────────────────────────────────
    const resetForm = () => setFormData(EMPTY_FORM);

    const displayed = statusFilter === 'all' ? announcements
        : statusFilter === 'visible' ? announcements.filter(a => a.IsVisible === 1)
            : announcements.filter(a => a.IsVisible !== 1);

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    // ── buildFormData (shared สำหรับ POST/PUT) ────────────────────────────────
    const buildMultipart = () => {
        const body = new FormData();
        body.append('title', formData.title.trim());
        body.append('detail', formData.content);
        body.append('category', formData.category);
        body.append('targetAudience', formData.target);
        if (formData.coverImage instanceof File) body.append('coverImage', formData.coverImage);
        formData.newExtraFiles.forEach(f => body.append('extraImages', f));
        if (formData.removedExtraIds.length > 0) {
            body.append('removedExtraImages', JSON.stringify(formData.removedExtraIds));
        }
        return body;
    };

    // ── CRUD ───────────────────────────────────────────────────────────────────
    const handleAdd = async () => {
        if (!formData.title.trim()) return alert('กรุณาระบุหัวข้อข่าว');
        setSubmitting(true);
        try {
            const res = await fetch(API_BASE, { method: 'POST', body: buildMultipart() });
            if (!res.ok) throw new Error(await res.text());
            await fetchAnnouncements(1);
            await fetchStats();
            setCurrentPage(1);
            resetForm();
            setShowAddModal(false);
        } catch (err) { console.error(err); alert('เกิดข้อผิดพลาด ไม่สามารถเพิ่มข่าวได้'); }
        finally { setSubmitting(false); }
    };

    const handleEdit = async () => {
        if (!formData.title.trim()) return alert('กรุณาระบุหัวข้อข่าว');
        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/${selectedNews.NewsId}`, { method: 'PUT', body: buildMultipart() });
            if (!res.ok) throw new Error(await res.text());
            await fetchAnnouncements(currentPage);
            await fetchStats();
            resetForm();
            setShowEditModal(false);
        } catch (err) { console.error(err); alert('เกิดข้อผิดพลาด ไม่สามารถแก้ไขข่าวได้'); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/${selectedNews.NewsId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error(await res.text());
            const newTotal = totalCount - 1;
            const maxPage = Math.max(1, Math.ceil(newTotal / ITEMS_PER_PAGE));
            const goTo = currentPage > maxPage ? maxPage : currentPage;
            await fetchAnnouncements(goTo);
            await fetchStats();
            setCurrentPage(goTo);
            setShowDeleteModal(false);
            setSelectedNews(null);
        } catch (err) { console.error(err); alert('เกิดข้อผิดพลาด ไม่สามารถลบข่าวได้'); }
        finally { setSubmitting(false); }
    };

    const openEditModal = (item) => {
        setSelectedNews(item);
        setFormData({
            ...EMPTY_FORM,
            title: item.Title ?? '',
            category: item.Category ?? 'ข่าวประชาสัมพันธ์',
            target: ['tutor', 'public'].includes(item.TargetAudience) ? item.TargetAudience : 'public',
            content: item.Detail ?? '',
            coverPreview: item.Image ? imgSrc(item.Image) : null,
            existingExtras: item.ExtraImages ?? [],
        });
        setShowEditModal(true);
    };

    // ── render ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 mt-[90px]">

            {/* Header */}
            <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">จัดการข่าวประชาสัมพันธ์</h1>
                    <p className="mt-1 text-sm text-neutral-500">จัดการข่าวสารและประกาศทั้งหมดในระบบ</p>
                </div>
                <button onClick={() => { resetForm(); setShowAddModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition font-medium">
                    <Plus className="h-4 w-4" /> เพิ่มข่าวใหม่
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'ข่าวทั้งหมด', value: stats.total, color: 'bg-blue-600', Icon: Megaphone },
                    { label: 'ติวเตอร์', value: stats.tutorCount ?? 0, color: 'bg-green-500', Icon: Eye },
                    { label: 'นักเรียน', value: stats.studentCount ?? 0, color: 'bg-purple-500', Icon: TrendingUp },
                ].map(({ label, value, color, Icon }) => (
                    <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition p-4 flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                            <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">{label}</p>
                            <p className="text-xl font-black text-slate-900">{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="bg-white border-2 border-neutral-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-3">
                    <Filter className="h-4 w-4 text-orange-500" /> กรองข้อมูล
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <input type="text" placeholder="ค้นหาข่าว..." value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                        className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                        <option value="all">ทุกหมวดหมู่</option>
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.value}</option>)}
                    </select>
                    <select value={targetFilter} onChange={e => setTargetFilter(e.target.value)}
                        className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                        <option value="all">ทุกกลุ่มเป้าหมาย</option>
                        {TARGETS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <button onClick={() => { setSearchQuery(''); setCategoryFilter('all'); setTargetFilter('all'); setStatusFilter('all'); }}
                        className="px-4 py-2 border border-neutral-300 rounded-lg text-sm hover:bg-neutral-50 transition text-neutral-600">
                        ล้างตัวกรอง
                    </button>
                </div>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="flex justify-center items-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
                </div>
            ) : displayed.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-neutral-200">
                    <Inbox className="h-14 w-14 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500 font-medium">ยังไม่มีข่าวในระบบ</p>
                    <p className="text-sm text-neutral-400 mt-1">กด "เพิ่มข่าวใหม่" เพื่อเริ่มต้น</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {displayed.map(item => (
                        <div key={item.NewsId} className="bg-white rounded-2xl border-2 border-neutral-200 transition overflow-hidden hover:border-orange-300">
                            <div className="p-5">
                                <div className="flex flex-col md:flex-row gap-4">
                                    {/* รูปหน้าปก */}
                                    <div className="md:w-[180px] shrink-0">
                                        {item.Image ? (
                                            <img src={imgSrc(item.Image)} alt={item.Title}
                                                onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=400'; }}
                                                className="h-32 w-full rounded-xl object-cover" />
                                        ) : (
                                            <div className="h-32 w-full rounded-xl bg-neutral-100 flex items-center justify-center">
                                                <ImageIcon className="h-8 w-8 text-neutral-300" />
                                            </div>
                                        )}
                                        {/* แสดงจำนวนรูปเพิ่มเติม */}
                                        {item.ExtraImages?.length > 0 && (
                                            <div className="flex items-center gap-1 mt-1.5">
                                                <Images className="h-3.5 w-3.5 text-neutral-400" />
                                                <span className="text-xs text-neutral-500">
                                                    +{item.ExtraImages.length} รูปเพิ่มเติม
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h3 className="font-bold text-neutral-900 text-base leading-snug line-clamp-2">
                                                {item.Title}
                                            </h3>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button onClick={() => openEditModal(item)}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 transition">
                                                    <Edit2 className="h-3.5 w-3.5" /> แก้ไข
                                                </button>
                                                <button onClick={() => { setSelectedNews(item); setShowDeleteModal(true); }}
                                                    className="p-1.5 rounded-lg border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 transition" title="ลบ">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <CategoryBadge category={item.Category} />
                                            <TargetBadge target={item.TargetAudience} />
                                            <span className="text-xs text-neutral-500 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />{formatThaiDate(item.Created_at)}
                                            </span>
                                            <span className="text-xs text-neutral-500 flex items-center gap-1">
                                                <Eye className="h-3 w-3" />{item.Views ?? 0} ครั้ง
                                            </span>
                                        </div>

                                        {item.Detail && (
                                            <p className="text-sm text-neutral-600 line-clamp-2">{item.Detail}</p>
                                        )}

                                        {/* Preview รูปเพิ่มเติม (thumbnail strip) */}
                                        {item.ExtraImages?.length > 0 && (
                                            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
                                                {item.ExtraImages.slice(0, 5).map(img => (
                                                    <img key={img.ImageId}
                                                        src={imgSrc(img.ImagePath)}
                                                        alt=""
                                                        className="h-10 w-10 rounded-lg object-cover border border-neutral-200 shrink-0" />
                                                ))}
                                                {item.ExtraImages.length > 5 && (
                                                    <div className="h-10 w-10 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
                                                        <span className="text-[10px] font-bold text-neutral-500">
                                                            +{item.ExtraImages.length - 5}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />

            {/* ADD MODAL */}
            {showAddModal && (
                <Modal onClose={() => { setShowAddModal(false); resetForm(); }}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-neutral-900">เพิ่มข่าวใหม่</h3>
                        <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-neutral-400 hover:text-neutral-600">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <NewsForm formData={formData} setFormData={setFormData}
                        onSubmit={handleAdd}
                        onCancel={() => { setShowAddModal(false); resetForm(); }}
                        submitLabel={submitting ? 'กำลังบันทึก...' : 'บันทึก'}
                        submitClass="bg-orange-500 hover:bg-orange-600" />
                </Modal>
            )}

            {/* EDIT MODAL */}
            {showEditModal && (
                <Modal onClose={() => { setShowEditModal(false); resetForm(); }}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-neutral-900">แก้ไขข่าว</h3>
                        <button onClick={() => { setShowEditModal(false); resetForm(); }} className="text-neutral-400 hover:text-neutral-600">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <NewsForm formData={formData} setFormData={setFormData}
                        onSubmit={handleEdit}
                        onCancel={() => { setShowEditModal(false); resetForm(); }}
                        submitLabel={submitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                        submitClass="bg-blue-500 hover:bg-blue-600" />
                </Modal>
            )}

            {/* DELETE MODAL */}
            {showDeleteModal && selectedNews && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-red-100 rounded-xl">
                                <AlertCircle className="h-6 w-6 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-neutral-900">ยืนยันการลบข่าว</h3>
                        </div>
                        <p className="text-sm text-neutral-600 mb-6">
                            คุณแน่ใจหรือไม่ว่าต้องการลบข่าว{' '}
                            <span className="font-semibold text-neutral-900">"{selectedNews.Title}"</span>
                            {' '}การลบนี้ไม่สามารถกู้คืนได้
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => { setShowDeleteModal(false); setSelectedNews(null); }}
                                disabled={submitting}
                                className="px-4 py-2 rounded-xl border border-neutral-300 text-sm hover:bg-neutral-50 transition disabled:opacity-50">
                                ยกเลิก
                            </button>
                            <button onClick={handleDelete} disabled={submitting}
                                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition flex items-center gap-2 disabled:opacity-50">
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                {submitting ? 'กำลังลบ...' : 'ลบข่าว'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}