import axiosInstance from "../config/axios.config";

export const loginUser = async (payload) => {
  const response = await axiosInstance.post("/auth/login", payload);
  return response.data;
};

