import axiosInstance from "../config/axios.config";

export const getAllCourses = async () => {
  const response = await axiosInstance.get("/courses");
  return response.data;
};

export const getStudentCoursesByUserId = async (userId) => {
  const response = await axiosInstance.get(`/courses/student/user/${userId}`);
  return response.data;
};
