import axiosInstance from "../config/axios.config";

export const registerUser = async (payload) => {
  const response = await axiosInstance.post("/users/create-user", payload);
  return response.data;
};

export const loginUser = async (payload) => {
  const response = await axiosInstance.post("/auth/login", payload);
  return response.data;
};
