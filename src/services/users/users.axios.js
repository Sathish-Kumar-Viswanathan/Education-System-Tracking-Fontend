import axiosInstance from "../config/axios.config";

export const getAllUsers = async () => {
  const response = await axiosInstance.get("/users");
  return response.data.users;
};

export const getStaffUsers = async () => {
  const response = await axiosInstance.get("/users/staff");
  return response.data.users;
};
