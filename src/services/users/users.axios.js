import axiosInstance from "../config/axios.config";

export const getAllUsers = async () => {
  const response = await axiosInstance.get("/users");
  return response.data.users;
};

export const getStaffUsers = async () => {
  const response = await axiosInstance.get("/users/staff");
  return response.data.users;
};

export const softDeleteUser = async (userId) => {
  const response = await axiosInstance.put(`/users/soft-delete/${userId}`);
  return response.data;
};

export const restoreUser = async (userId) => {
  const response = await axiosInstance.put(`/users/restore/${userId}`);
  return response.data;
};

export const updateUser = async (userId, userData) => {
  const response = await axiosInstance.put(`/users/update/${userId}`, userData);
  return response.data;
};
