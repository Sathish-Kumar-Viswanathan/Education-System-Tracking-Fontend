import axiosInstance from "../config/axios.config";

export const getAllUsers = async () => {
  const response = await axiosInstance.get("/users");
  return response.data;
};
