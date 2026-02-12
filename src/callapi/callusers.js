import axios from "axios";

const BASE_URL = import.meta?.env?.VITE_API_URL || "http://localhost:3000";


const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});


function withAuth(token) {
  return token
    ? { headers: { Authorization: `Bearer ${token}` } }
    : {};
}


function throwNiceError(error) {
  console.error("API Error:", error);
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "เกิดข้อผิดพลาดขณะส่งข้อมูล";
  throw message;
}


export async function GetLogin(email, password) {
  try {
    const res = await apiClient.post("/api/login-admin", { email, password });
    // คืนเฉพาะ data
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

export async function GetDataprojectUserByYear(token, id_year, page = 1, per_page = 10) {
  try {
    const res = await apiClient.post(
      `/api/v1/admin/projectuserallbyidyear`,
      { id_year },
      {
        ...withAuth(token),
        params: { page, per_page },
      }
    );
    return res.data?.data ?? [];
  } catch (error) {
    throwNiceError(error);
  }
}


export async function getCourses({ termId, statusId, availabilityId } = {}) {
  try {
    const res = await apiClient.get("/courses", {
      params: {
        termId,
        statusId,
        availabilityId,
      },
    });
    return res.data ?? [];
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
    throwNiceError(error);
  }
}

// POST /courses
export async function createCourse(payload) {
  try {
    const res = await apiClient.post("/courses", payload);
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

// PUT /courses/:id
export async function updateCourse(courseId, payload) {
  try {
    const res = await apiClient.put(`/courses/${courseId}`, payload);
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

// DELETE /courses/:id
export async function deleteCourse(courseId) {
  try {
    const res = await apiClient.delete(`/courses/${courseId}`);
    return res.data;
  } catch (error) {
    throwNiceError(error);
  }
}

export async function getdataProducts() {
  return getCourses();
}
