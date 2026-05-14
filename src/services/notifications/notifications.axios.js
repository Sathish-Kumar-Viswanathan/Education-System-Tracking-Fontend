import axiosInstance from "../config/axios.config";

export const getStudentNotificationsByUserId = async (userId) => {
  const response = await axiosInstance.get(
    `/notifications/student/user/${userId}`,
  );
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await axiosInstance.put(`/notifications/read/${id}`);
  return response.data;
};
