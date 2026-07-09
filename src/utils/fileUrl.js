import { API_URL } from "../config";

export const getFileUrl = (path) => {
  if (!path) return null;
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:')
  ) {
    return path;
  }
  return `${API_URL}${path}`;
};
