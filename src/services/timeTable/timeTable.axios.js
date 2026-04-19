import axiosInstance from "../config/axios.config";

export const getAllTimetables = async () => {
  const response = await axiosInstance.get("/time-table");
  return response.data;
};
