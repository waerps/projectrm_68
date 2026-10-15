import { API_URL } from "../config";
import axios from "axios";
import { publicListRequest } from "../utils/publicListRequest";

const BASE_URL = import.meta?.env?.VITE_API_URL || API_URL;

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

function throwNiceError(error) {
  console.error("API Error:", error);
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "เกิดข้อผิดพลาดขณะส่งข้อมูล";
  throw message;
}

export async function getCourses({ termId, statusId, availabilityId } = {}) {
  try {
    return await publicListRequest(async () => {
      const res = await apiClient.get("/courses", {
        params: { termId, statusId, availabilityId },
        timeout: 20000,
      });
      return res.data;
    });
  } catch (error) {
    throwNiceError(error);
  }
}

// GET /courses/:id
export async function getCourseById(courseId) {
  try {
    const res = await apiClient.get(`/courses/${courseId}`);
    return res.data;
  } catch (error) {
    // แนบ status ไปด้วย ให้หน้าคอร์สแยก "ไม่พบคอร์ส (404)" ออกจาก "โหลดไม่สำเร็จ" ได้
    const err = new Error(error?.response?.data?.message || error?.message || "โหลดข้อมูลคอร์สไม่สำเร็จ");
    err.status = error?.response?.status;
    throw err;
  }
}

// ★ เพิ่มใหม่ — GET /courses/:id/subjects (วิชา+ติวเตอร์+ชั่วโมงในคอร์สนี้)
export async function getCourseSubjects(courseId) {
  try {
    const res = await apiClient.get(`/courses/${courseId}/subjects`);
    return res.data ?? [];
  } catch (error) {
    throwNiceError(error);
  }
}

// ★ เพิ่มใหม่ — GET /courses/:id/preview-videos (คลิปตัวอย่างของคอร์ส)
export async function getCoursePreviewVideos(courseId) {
  try {
    const res = await apiClient.get(`/courses/${courseId}/preview-videos`);
    return res.data ?? [];
  } catch (error) {
    throwNiceError(error);
  }
}

// ★ เพิ่มใหม่ — GET /courses/:id/schedule (วัน-เวลาเรียนของแต่ละวิชา)
export async function getCourseSchedule(courseId) {
  try {
    const res = await apiClient.get(`/courses/${courseId}/schedule`);
    return res.data ?? [];
  } catch (error) {
    throwNiceError(error);
  }
}

export async function applyTutor(formData) {
  try {
    const res = await apiClient.post("/api/tutorapply", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

