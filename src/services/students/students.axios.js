import axiosInstance from "../config/axios.config";

export const getAllStudents = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.department) params.append("department", filters.department);
  if (filters.yearOfStudy) params.append("yearOfStudy", filters.yearOfStudy);

  const queryString = params.toString();
  const response = await axiosInstance.get(
    queryString ? `/students?${queryString}` : "/students",
  );

  return response.data;
};

export const createStudent = async (studentData) => {
  const response = await axiosInstance.post(
    "/students/create-student",
    studentData,
  );
  return response.data;
};

export const getStudentById = async (id) => {
  const response = await axiosInstance.get(`/students/${id}`);
  return response.data;
};

export const updateStudent = async (id, studentData) => {
  const response = await axiosInstance.put(`/students/${id}`, studentData);
  return response.data;
};

export const deleteStudent = async (id) => {
  const response = await axiosInstance.delete(`/students/${id}`);
  return response.data;
};

// Dashboard endpoints
export const getStudentDashboardData = async (studentId) => {
  const response = await axiosInstance.get(`/students/${studentId}/dashboard`);
  return response.data;
};

export const getStudentProfile = async (studentId) => {
  const response = await axiosInstance.get(`/students/${studentId}/profile`);
  return response.data;
};

export const updateStudentProfile = async (studentId, profileData) => {
  const response = await axiosInstance.put(
    `/students/${studentId}/profile`,
    profileData,
  );
  return response.data;
};

// Get student by UserId (for logged-in student)
export const getStudentByUserId = async (userId) => {
  const response = await axiosInstance.get(`/students/user/${userId}`);
  return response.data;
};

// Get student profile by UserId (for logged-in students) - Direct endpoint
export const getStudentProfileByUserId = async (userId) => {
  const response = await axiosInstance.get(`/students/user/${userId}/profile`);
  return response.data;
};

// Update student profile by UserId (for logged-in students) - Direct endpoint
export const updateStudentProfileByUserId = async (userId, profileData) => {
  const response = await axiosInstance.put(
    `/students/user/${userId}/profile`,
    profileData,
  );
  return response.data;
};

export const getStudentProfileUpdateRequests = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status);

  const queryString = params.toString();
  const response = await axiosInstance.get(
    queryString
      ? `/students/profile-update-requests?${queryString}`
      : "/students/profile-update-requests",
  );
  return response.data;
};

export const approveStudentProfileUpdateRequest = async (
  requestId,
  adminId,
) => {
  const response = await axiosInstance.put(
    `/students/profile-update-requests/${requestId}/approve`,
    { adminId },
  );
  return response.data;
};

export const rejectStudentProfileUpdateRequest = async (requestId, adminId) => {
  const response = await axiosInstance.put(
    `/students/profile-update-requests/${requestId}/reject`,
    { adminId },
  );
  return response.data;
};

// Get student attendance details
export const getStudentAttendanceDetails = async (studentId, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.month) params.append("month", filters.month);
  if (filters.year) params.append("year", filters.year);

  const queryString = params.toString();
  const response = await axiosInstance.get(
    queryString
      ? `/students/${studentId}/attendance?${queryString}`
      : `/students/${studentId}/attendance`,
  );
  return response.data;
};
