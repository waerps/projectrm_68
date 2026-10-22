export function logout() {
  // ทุก role ใช้ข้อมูลล็อกอินใน localStorage ชุดเดียวกัน
  localStorage.clear();
  sessionStorage.clear();
  window.location.replace("/login");
}
