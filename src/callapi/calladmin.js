import axios from "axios";
let api = "http://localhost:3000";
export async function GetLogin(email, password) {
  // console.log(id_strategic.data)
  try {
    const response = await axios.post(
      `${api}/api/login-admin`,
      { email, password },
      {
        headers: {
          "Content-Type": `application/json`, // ส่ง Token ผ่าน Header
        },
      }
    );

    // const json = await response.json();
    console.log("data : ", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    const message =
      error.response?.data?.message || "เกิดข้อผิดพลาดขณะส่งข้อมูล";

    throw message; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}
export async function GetDataprojectUserByYear(token, id_year, page, per_page) {
  //   console.log(id_actionplan);
  try {
    console.log("token : ", token);
    const response = await axios.post(
      `${api}/api/v1/admin/projectuserallbyidyear?page=${page}&per_page=${per_page}`,
      { id_year },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // const json = await response.json();
    console.log("data : ", response.data?.data);
    return response.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    throw error; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}
export async function getdataProducts() {
  //   console.log(id_actionplan);
  try {
    // console.log("token : ", token);
    const response = await axios.get(
      `${api}/products`,
    //   { id_year },
      {
        headers: {
        //   Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // const json = await response.json();
    console.log("data : ", response);
    return response;
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    throw error; // ส่ง Error ออกไปให้จัดการในที่เรียกใช้
  }
}