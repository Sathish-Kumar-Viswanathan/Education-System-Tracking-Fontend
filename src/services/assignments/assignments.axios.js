import axiosInstance from "../config/axios.config";

export const createAssignment = async (assignmentData) => {
  const response = await axiosInstance.post(
    "/assignments/create-assignment",
    assignmentData
  );
  return response.data;
};

export const getAllAssignments = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.department) params.append("department", filters.department);
  if (filters.yearOfStudy) params.append("yearOfStudy", filters.yearOfStudy);
  if (filters.staffId) params.append("staffId", filters.staffId);

  const response = await axiosInstance.get(
    `/assignments?${params.toString()}`
  );
  return response.data;
};

export const getAssignmentById = async (id) => {
  const response = await axiosInstance.get(`/assignments/${id}`);
  return response.data;
};

export const updateAssignment = async (id, assignmentData) => {
  const response = await axiosInstance.put(
    `/assignments/update/${id}`,
    assignmentData
  );
  return response.data;
};

export const softDeleteAssignment = async (id) => {
  const response = await axiosInstance.put(`/assignments/soft-delete/${id}`);
  return response.data;
};

export const restoreAssignment = async (id) => {
  const response = await axiosInstance.put(`/assignments/restore/${id}`);
  return response.data;
};

export const getAssignmentSubmissions = async (assignmentId) => {
  const response = await axiosInstance.get(
    `/assignments/submissions/${assignmentId}`
  );
  return response.data;
};

export const getAllSubmissions = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.staffId) params.append("staffId", filters.staffId);
  if (filters.status) params.append("status", filters.status);

  const response = await axiosInstance.get(
    `/assignments/submissions/staff/all?${params.toString()}`
  );
  return response.data;
};
