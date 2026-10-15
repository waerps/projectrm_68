import axios from "axios";
import { API_URL } from "../config";
import { publicListRequest } from "./publicListRequest";

export function getPublicNews({ role = "public", token, signal } = {}) {
  return publicListRequest(async () => {
    const response = await axios.get(`${API_URL}/api/news`, {
      params: { role },
      signal,
      timeout: 20000,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  }, { signal });
}
