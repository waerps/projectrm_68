// ต้นทางที่กดเข้าหน้า "ภาพรวมพัฒนาการ" ได้ ใช้ทำ breadcrumb ให้กลับไปที่เดิม
//
// แยกไฟล์ไว้ต่างหากเพราะกฎ react-refresh ของโปรเจกต์ไม่ให้ไฟล์ที่ export component
// export ค่าคงที่ปนออกมาด้วย (จะทำให้ hot reload ทำงานเพี้ยน)
//
// คีย์ตรงกับค่าที่ต้นทางส่งมาใน ?from=
export const PROGRESS_ORIGINS = {
  courses: { label: "จัดการคอร์ส", to: "/admin/courses" },
  tutors: { label: "จัดการติวเตอร์", to: "/admin/tutors" },
  dashboard: { label: "แดชบอร์ด", to: "/admin/dashboard" },
};
