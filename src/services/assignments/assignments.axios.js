import axiosInstance from "../config/axios.config";

export const getAssignmentFileUrl = (fileUrl) => {
  if (!fileUrl) return "";
  if (fileUrl.startsWith("http") || fileUrl.startsWith("data:")) {
    return fileUrl;
  }

  const apiBaseUrl = axiosInstance.defaults.baseURL || "";
  const serverBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");

  return `${serverBaseUrl}${fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`}`;
};

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

export const getStudentAssignmentsByUserId = async (userId, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status);

  const queryString = params.toString();
  const response = await axiosInstance.get(
    queryString
      ? `/assignments/student/user/${userId}?${queryString}`
      : `/assignments/student/user/${userId}`
  );
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

export const submitAssignment = async (submissionData) => {
  const response = await axiosInstance.post(
    "/assignments/submissions/submit",
    submissionData
  );
  return response.data;
};

export const gradeSubmission = async (submissionId, gradeData) => {
  const response = await axiosInstance.put(
    `/assignments/submissions/grade/${submissionId}`,
    gradeData
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
