import axiosInstance from "../config/axios.config";

export const createAttendance = async (attendanceData) => {
  const response = await axiosInstance.post(
    "/attendance/create",
    attendanceData,
  );
  return response.data;
};

export const createBatchAttendance = async (attendanceRecords) => {
  const response = await axiosInstance.post("/attendance/batch", {
    attendanceRecords,
  });
  return response.data;
};

export const getAttendanceByStudent = async (studentId) => {
  const response = await axiosInstance.get(`/attendance/student/${studentId}`);
  return response.data;
};

export const getStudentDashboardAttendance = async (userId, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.date) params.append("date", filters.date);
  if (filters.month) params.append("month", filters.month);
  if (filters.year) params.append("year", filters.year);

  const queryString = params.toString();
  const response = await axiosInstance.get(
    queryString
      ? `/attendance/student-dashboard/user/${userId}?${queryString}`
      : `/attendance/student-dashboard/user/${userId}`,
  );
  return response.data;
};

export const getAttendanceByStaff = async (staffId, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.date) params.append("date", filters.date);
  if (filters.studentId) params.append("studentId", filters.studentId);
  if (filters.subject) params.append("subject", filters.subject);
  if (filters.semester) params.append("semester", filters.semester);

  const queryString = params.toString();
  const response = await axiosInstance.get(
    queryString
      ? `/attendance/staff/${staffId}?${queryString}`
      : `/attendance/staff/${staffId}`,
  );
  return response.data;
};

export const updateAttendance = async (id, attendanceData) => {
  const response = await axiosInstance.put(
    `/attendance/update/${id}`,
    attendanceData,
  );
  return response.data;
};

export const deleteAttendance = async (id) => {
  const response = await axiosInstance.delete(`/attendance/delete/${id}`);
  return response.data;
};

export const getAttendanceStats = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.studentId) params.append("studentId", filters.studentId);
  if (filters.staffId) params.append("staffId", filters.staffId);

  const queryString = params.toString();
  const response = await axiosInstance.get(
    queryString ? `/attendance/stats?${queryString}` : "/attendance/stats",
  );
  return response.data;
};
