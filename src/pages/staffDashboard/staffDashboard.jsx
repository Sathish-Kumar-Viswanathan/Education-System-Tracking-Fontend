import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  X,
  Plus,
  Trash2,
  Edit2,
  Users,
  BookOpen,
  FileText,
  Send,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { jwtDecode } from "jwt-decode";

import { getAllStudents } from "../../services/students/students.axios";
import { getAllUsers } from "../../services/users/users.axios";
import { getAllSubjects } from "../../services/subjects/subjects.axios";
import {
  getAllAssignments,
  createAssignment,
  updateAssignment,
  softDeleteAssignment,
  getAllSubmissions,
} from "../../services/assignments/assignments.axios";
import {
  createBatchAttendance,
  getAttendanceByStaff,
  updateAttendance,
  deleteAttendance,
} from "../../services/attendance/attendance.axios";

const assignmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  dueDate: z
    .string()
    .refine(
      (date) => new Date(date) > new Date(),
      "Due date must be in the future",
    ),
  department: z.string().min(1, "Department is required"),
  yearOfStudy: z.string().min(1, "Year of study is required"),
  subject: z.string().min(1, "Subject is required"),
});

export default function StaffDashboard() {
  const ALL_FILTER = "all";
  const assignmentDepartments = ["MCA"];
  const assignmentYears = ["First Year", "Second Year"];
  const navigate = useNavigate();
  const [staffId, setStaffId] = useState(null);

  // State Management
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [studentDeptFilter, setStudentDeptFilter] = useState(ALL_FILTER);
  const [studentYearFilter, setStudentYearFilter] = useState(ALL_FILTER);
  const [assignmentDeptFilter, setAssignmentDeptFilter] = useState(ALL_FILTER);
  const [assignmentYearFilter, setAssignmentYearFilter] = useState(ALL_FILTER);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  // UI States
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [editAttendanceStatus, setEditAttendanceStatus] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [attendanceSubject, setAttendanceSubject] = useState("");
  const [attendanceYear, setAttendanceYear] = useState("");
  const [attendancePeriod, setAttendancePeriod] = useState("");
  const [studentAttendanceData, setStudentAttendanceData] = useState({});
  const itemsPerPage = 5;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(assignmentSchema),
  });

  // Get unique departments and years
  const normalizeFilterValue = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase();

  const formatStudentUsers = (users = []) =>
    users
      .filter((user) => normalizeFilterValue(user.role) === "student")
      .map((user) => {
        const nameParts = String(user.name ?? "")
          .trim()
          .split(/\s+/)
          .filter(Boolean);
        const firstName = nameParts[0] || "Unknown";
        const lastName = nameParts.slice(1).join(" ");

        return {
          _id: user._id,
          userId: user._id,
          firstName,
          lastName,
          department: user.department || "",
          yearOfStudy: user.yearOfStudy || "",
          rollNumber: user.rollNumber || "",
          isDelete: user.isDelete,
        };
      });

  const departments = [
    ...new Set(
      students
        .map((s) => s.department)
        .filter(Boolean)
        .map((department) => String(department).trim()),
    ),
  ];
  const years = [
    ...new Set(
      students
        .map((s) => s.yearOfStudy)
        .filter(Boolean)
        .map((year) => String(year).trim()),
    ),
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setStaffId(decoded.id);
    } catch {
      navigate("/");
    }
  }, []);

  useEffect(() => {
    if (!staffId) return;
    fetchData(staffId);
  }, [staffId]);

  const fetchData = async (currentStaffId = staffId) => {
    try {
      setLoading(true);

      // Fetch all students
      try {
        const studentsData = await getAllStudents();
        const studentList = Array.isArray(studentsData)
          ? studentsData
          : studentsData?.students || [];

        if (studentList.length > 0) {
          setStudents(studentList);
        } else {
          const usersData = await getAllUsers();
          setStudents(formatStudentUsers(usersData));
        }
      } catch (err) {
        console.error("Error fetching students:", err);
        try {
          const usersData = await getAllUsers();
          setStudents(formatStudentUsers(usersData));
        } catch (usersError) {
          console.error("Error fetching users as fallback:", usersError);
          toast.error("Failed to fetch students");
          setStudents([]);
        }
      }

      // Fetch all subjects
      try {
        const subjectsData = await getAllSubjects();
        setSubjects(subjectsData.subjects || subjectsData);
      } catch (err) {
        console.error("Error fetching subjects:", err);
        toast.error("Failed to fetch subjects");
        setSubjects([]);
      }

      // Fetch assignments for this staff
      try {
        if (currentStaffId) {
          const assignmentsData = await getAllAssignments({
            staffId: currentStaffId,
          });
          setAssignments(assignmentsData.assignments || []);
        } else {
          setAssignments([]);
        }
      } catch (err) {
        console.error("Error fetching assignments:", err);
        setAssignments([]);
      }

      // Fetch submissions
      try {
        if (currentStaffId) {
          const submissionsData = await getAllSubmissions({
            staffId: currentStaffId,
          });
          setSubmissions(submissionsData.submissions || []);
        } else {
          setSubmissions([]);
        }
      } catch (err) {
        console.error("Error fetching submissions:", err);
        setSubmissions([]);
      }

      // Fetch attendance
      try {
        if (currentStaffId) {
          const attendanceData = await getAttendanceByStaff(currentStaffId);
          setAttendance(attendanceData.attendance || []);
        } else {
          setAttendance([]);
        }
      } catch (err) {
        console.error("Error fetching attendance:", err);
        setAttendance([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    toast.success("Logged out successfully");
    navigate("/");
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      if (editingAssignment) {
        await updateAssignment(editingAssignment._id, {
          ...data,
          staffId,
        });
        toast.success("Assignment updated successfully");
      } else {
        await createAssignment({
          ...data,
          staffId,
        });
        toast.success("Assignment created successfully");
      }

      reset();
      setEditingAssignment(null);
      setShowAssignmentForm(false);
      await fetchData();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to save assignment",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setValue("title", assignment.title);
    setValue("description", assignment.description);
    setValue("dueDate", assignment.dueDate.split("T")[0]);
    setValue("department", assignment.department);
    setValue("yearOfStudy", assignment.yearOfStudy);
    setValue("subject", assignment.subject);
    setShowAssignmentForm(true);
  };

  const handleDeleteAssignment = async (id) => {
    if (window.confirm("Are you sure you want to delete this assignment?")) {
      try {
        setLoading(true);
        await softDeleteAssignment(id);
        toast.success("Assignment deleted successfully");
        await fetchData();
      } catch (error) {
        toast.error("Failed to delete assignment");
      } finally {
        setLoading(false);
      }
    }
  };

  const closeForm = () => {
    setShowAssignmentForm(false);
    setEditingAssignment(null);
    reset();
  };

  const handleAttendanceStatusChange = (studentId, status) => {
    setStudentAttendanceData((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAttendance = async () => {
    if (!attendanceDate || !attendanceSubject || !attendanceYear || !attendancePeriod) {
      toast.error("Please select date, year, subject, and period");
      return;
    }

    try {
      setLoading(true);
      // Filter students by year for attendance marking
      const yearFilteredStudents = filteredStudents.filter(
        (student) =>
          normalizeFilterValue(student.yearOfStudy) ===
          normalizeFilterValue(attendanceYear),
      );

      const records = yearFilteredStudents
        .filter((student) => studentAttendanceData[student._id])
        .map((student) => ({
          studentId: student._id,
          staffId: staffId,
          subject: attendanceSubject,
          date: new Date(attendanceDate),
          period: Number(attendancePeriod),
          status: studentAttendanceData[student._id],
        }));

      if (records.length === 0) {
        toast.error("Please mark attendance for at least one student");
        return;
      }

      await createBatchAttendance(records);

      toast.success(`Attendance marked for ${records.length} students`);
      setStudentAttendanceData({});
      setShowAttendanceForm(false);
      await fetchData();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to mark attendance",
      );
    } finally {
      setLoading(false);
    }
  };

  const closeAttendanceForm = () => {
    setShowAttendanceForm(false);
    setStudentAttendanceData({});
    setAttendanceDate(new Date().toISOString().split("T")[0]);
    setAttendanceSubject("");
    setAttendanceYear("");
    setAttendancePeriod("");
  };

  const handleEditAttendance = (record) => {
    setEditingAttendance(record);
    setEditAttendanceStatus(record.status || "");
  };

  const closeEditAttendance = () => {
    setEditingAttendance(null);
    setEditAttendanceStatus("");
  };

  const handleUpdateAttendance = async () => {
    if (!editingAttendance || !editAttendanceStatus) {
      toast.error("Please select attendance status");
      return;
    }

    try {
      setLoading(true);
      await updateAttendance(editingAttendance._id, {
        status: editAttendanceStatus,
      });
      toast.success("Attendance updated successfully");
      closeEditAttendance();
      await fetchData();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to update attendance",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudentDetails = (student) => {
    setSelectedStudent(student);
    setShowStudentDetails(true);
  };

  const closeStudentDetails = () => {
    setShowStudentDetails(false);
    setSelectedStudent(null);
  };

  // Calculate student marks and attendance
  const calculateStudentStats = (student) => {
    const studentSubmissions = submissions.filter(
      (submission) => String(submission.studentId._id) === String(student._id),
    );

    // Get marks for different education levels
    const tenthMarks = student.tenthMarkPercentage || 0;
    const twelfthMarks = student.twelfthMarkPercentage || 0;
    const ugMarks = student.ugMarkPercentage || 0;

    // Calculate attendance (based on submission percentage)
    const totalAssignments = assignments.filter(
      (assignment) =>
        assignment.department === student.department &&
        assignment.yearOfStudy === student.yearOfStudy,
    ).length;

    const submissionPercentage =
      totalAssignments > 0
        ? ((studentSubmissions.length / totalAssignments) * 100).toFixed(2)
        : 0;

    return {
      tenthMarks: parseFloat(tenthMarks),
      twelfthMarks: parseFloat(twelfthMarks),
      ugMarks: parseFloat(ugMarks),
      attendancePercentage: parseFloat(submissionPercentage),
      totalSubmissions: studentSubmissions.length,
    };
  };

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesDepartment =
      studentDeptFilter === ALL_FILTER ||
      normalizeFilterValue(student.department) ===
        normalizeFilterValue(studentDeptFilter);
    const matchesYear =
      studentYearFilter === ALL_FILTER ||
      normalizeFilterValue(student.yearOfStudy) ===
        normalizeFilterValue(studentYearFilter);

    // Search filter by name or roll number
    const searchLower = studentSearchQuery.toLowerCase().trim();
    const studentName =
      `${student.firstName} ${student.lastName}`.toLowerCase();
    const rollNumber = (student.rollNumber || "").toLowerCase();
    const matchesSearch =
      searchLower === "" ||
      studentName.includes(searchLower) ||
      rollNumber.includes(searchLower);

    if (!matchesDepartment) return false;
    if (!matchesYear) return false;
    if (!matchesSearch) return false;
    return true;
  });

  // Filter assignments
  const filteredAssignments = assignments.filter((assignment) => {
    const matchesDepartment =
      assignmentDeptFilter === ALL_FILTER ||
      normalizeFilterValue(assignment.department) ===
        normalizeFilterValue(assignmentDeptFilter);
    const matchesYear =
      assignmentYearFilter === ALL_FILTER ||
      normalizeFilterValue(assignment.yearOfStudy) ===
        normalizeFilterValue(assignmentYearFilter);

    if (!matchesDepartment) return false;
    if (!matchesYear) return false;
    return true;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [assignmentDeptFilter, assignmentYearFilter]);

  useEffect(() => {
    setStudentDeptFilter((currentValue) =>
      currentValue !== ALL_FILTER && !departments.includes(currentValue)
        ? ALL_FILTER
        : currentValue,
    );
    setStudentYearFilter((currentValue) =>
      currentValue !== ALL_FILTER && !years.includes(currentValue)
        ? ALL_FILTER
        : currentValue,
    );
    setAssignmentDeptFilter((currentValue) =>
      currentValue !== ALL_FILTER && !departments.includes(currentValue)
        ? ALL_FILTER
        : currentValue,
    );
    setAssignmentYearFilter((currentValue) =>
      currentValue !== ALL_FILTER && !years.includes(currentValue)
        ? ALL_FILTER
        : currentValue,
    );
  }, [departments, years]);

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAssignments = filteredAssignments.slice(
    startIndex,
    startIndex + itemsPerPage,
  );
  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);

  return (
    <>
      <Toaster position="top-right" closeButton richColors />

      <div className="p-6 space-y-6 bg-muted/40 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Staff Dashboard</h1>
            <p className="text-muted-foreground">
              Manage students, assignments, and submissions
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut size={16} /> Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="hover:-translate-y-1 transition shadow-md hover:shadow-xl">
            <CardHeader className="flex justify-between flex-row items-center">
              <CardTitle className="text-sm">Total Students</CardTitle>
              <Users size={18} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{students.length}</p>
              <p className="text-xs text-muted-foreground">Active students</p>
            </CardContent>
          </Card>

          <Card className="hover:-translate-y-1 transition shadow-md hover:shadow-xl">
            <CardHeader className="flex justify-between flex-row items-center">
              <CardTitle className="text-sm">Subjects</CardTitle>
              <BookOpen size={18} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{subjects.length}</p>
              <p className="text-xs text-muted-foreground">
                Available subjects
              </p>
            </CardContent>
          </Card>

          <Card className="hover:-translate-y-1 transition shadow-md hover:shadow-xl">
            <CardHeader className="flex justify-between flex-row items-center">
              <CardTitle className="text-sm">Assignments</CardTitle>
              <FileText size={18} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{assignments.length}</p>
              <p className="text-xs text-muted-foreground">Total assignments</p>
            </CardContent>
          </Card>

          <Card className="hover:-translate-y-1 transition shadow-md hover:shadow-xl">
            <CardHeader className="flex justify-between flex-row items-center">
              <CardTitle className="text-sm">Submissions</CardTitle>
              <Send size={18} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{submissions.length}</p>
              <p className="text-xs text-muted-foreground">
                Student submissions
              </p>
            </CardContent>
          </Card>

          <Card className="hover:-translate-y-1 transition shadow-md hover:shadow-xl">
            <CardHeader className="flex justify-between flex-row items-center">
              <CardTitle className="text-sm">Attendance Records</CardTitle>
              <Users size={18} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{attendance.length}</p>
              <p className="text-xs text-muted-foreground">Total records</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Students Section */}
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Box */}
              <div>
                <Input
                  placeholder="Search by name or roll number..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex gap-2">
                  <Select
                    value={studentDeptFilter}
                    onValueChange={setStudentDeptFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_FILTER}>
                        All Departments
                      </SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {studentDeptFilter !== ALL_FILTER && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStudentDeptFilter(ALL_FILTER)}
                    >
                      Clear
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Select
                    value={studentYearFilter}
                    onValueChange={setStudentYearFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_FILTER}>All Years</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          Year {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {studentYearFilter !== ALL_FILTER && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStudentYearFilter(ALL_FILTER)}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Student List */}
              <div className="max-h-96 overflow-y-auto">
                {filteredStudents.length > 0 ? (
                  <div className="space-y-2">
                    {filteredStudents.map((student) => (
                      <div
                        key={student._id}
                        className="p-3 bg-muted rounded-lg flex justify-between items-start"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {[student.firstName, student.lastName]
                              .filter(Boolean)
                              .join(" ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {student.department || "Department not set"} - Year{" "}
                            {student.yearOfStudy || "Not set"} | Roll:{" "}
                            {student.rollNumber || "Not set"}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewStudentDetails(student)}
                          className="ml-2"
                        >
                          <Eye size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">
                    No students found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subjects Section */}
          <Card>
            <CardHeader>
              <CardTitle>Available Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                {subjects.length > 0 ? (
                  <div className="space-y-2">
                    {subjects.map((subject) => (
                      <div
                        key={subject._id}
                        className="p-3 bg-muted rounded-lg"
                      >
                        <p className="font-medium">{subject.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Subjects: {subject.subjectName}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">
                    No subjects available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignment Form and List */}
        <div className="space-y-6">
          {/* Create Assignment Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Assignments</h2>
            <Button
              onClick={() => setShowAssignmentForm(true)}
              className="flex gap-2"
            >
              <Plus size={18} /> Create Assignment
            </Button>
          </div>

          {/* Assignment Form Modal */}
          {showAssignmentForm && (
            <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 backdrop-blur-sm p-4">
              <Card className="w-full max-w-xl relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-4"
                  onClick={closeForm}
                >
                  <X size={18} />
                </Button>

                <CardHeader>
                  <CardTitle>
                    {editingAssignment
                      ? "Edit Assignment"
                      : "Create Assignment"}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Title */}
                    <div className="space-y-1">
                      <Label>Title</Label>
                      <Input
                        placeholder="Assignment Title"
                        {...register("title")}
                        className={errors.title ? "border-red-500" : ""}
                      />
                      {errors.title && (
                        <p className="text-sm text-red-500">
                          {errors.title.message}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <Label>Description</Label>
                      <textarea
                        placeholder="Assignment Description"
                        {...register("description")}
                        className={`w-full p-2 border rounded-md ${
                          errors.description ? "border-red-500" : ""
                        }`}
                        rows="3"
                      />
                      {errors.description && (
                        <p className="text-sm text-red-500">
                          {errors.description.message}
                        </p>
                      )}
                    </div>

                    {/* Due Date */}
                    <div className="space-y-1">
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        {...register("dueDate")}
                        className={errors.dueDate ? "border-red-500" : ""}
                      />
                      {errors.dueDate && (
                        <p className="text-sm text-red-500">
                          {errors.dueDate.message}
                        </p>
                      )}
                    </div>

                    {/* Subject */}
                    <div className="space-y-1">
                      <Label>Subject</Label>
                      <Select
                        value={watch("subject") || ""}
                        onValueChange={(value) =>
                          setValue("subject", value, { shouldValidate: true })
                        }
                      >
                        <SelectTrigger
                          className={errors.subject ? "border-red-500" : ""}
                        >
                          <SelectValue placeholder="Select Subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem
                              key={subject._id}
                              value={subject.subjectName}
                            >
                              {subject.subjectName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.subject && (
                        <p className="text-sm text-red-500">
                          {errors.subject.message}
                        </p>
                      )}
                    </div>

                    {/* Department */}
                    <div className="space-y-1">
                      <Label>Department</Label>
                      <Select
                        value={watch("department") || ""}
                        onValueChange={(value) =>
                          setValue("department", value, {
                            shouldValidate: true,
                          })
                        }
                      >
                        <SelectTrigger
                          className={errors.department ? "border-red-500" : ""}
                        >
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                          {assignmentDepartments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.department && (
                        <p className="text-sm text-red-500">
                          {errors.department.message}
                        </p>
                      )}
                    </div>

                    {/* Year of Study */}
                    <div className="space-y-1">
                      <Label>Year of Study</Label>
                      <Select
                        value={watch("yearOfStudy") || ""}
                        onValueChange={(value) =>
                          setValue("yearOfStudy", value, {
                            shouldValidate: true,
                          })
                        }
                      >
                        <SelectTrigger
                          className={errors.yearOfStudy ? "border-red-500" : ""}
                        >
                          <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {assignmentYears.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.yearOfStudy && (
                        <p className="text-sm text-red-500">
                          {errors.yearOfStudy.message}
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading
                        ? "Saving..."
                        : editingAssignment
                          ? "Update"
                          : "Create"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Student Details Modal */}
          {showStudentDetails && selectedStudent && (
            <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 backdrop-blur-sm p-4">
              <Card className="w-full max-w-xl relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-4"
                  onClick={closeStudentDetails}
                >
                  <X size={18} />
                </Button>

                <CardHeader>
                  <CardTitle>Student Details</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        First Name
                      </Label>
                      <p className="text-lg font-medium">
                        {selectedStudent.firstName}
                      </p>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Last Name
                      </Label>
                      <p className="text-lg font-medium">
                        {selectedStudent.lastName}
                      </p>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Roll Number
                      </Label>
                      <p className="text-lg font-medium">
                        {selectedStudent.rollNumber || "Not set"}
                      </p>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Department
                      </Label>
                      <p className="text-lg font-medium">
                        {selectedStudent.department || "Not set"}
                      </p>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Year of Study
                      </Label>
                      <p className="text-lg font-medium">
                        {selectedStudent.yearOfStudy || "Not set"}
                      </p>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Status
                      </Label>
                      <p className="text-lg font-medium">
                        {selectedStudent.isDelete ? "Deleted" : "Active"}
                      </p>
                    </div>

                    {/* Marks Section */}
                    {(() => {
                      const stats = calculateStudentStats(selectedStudent);
                      return (
                        <>
                          <div className="border-t pt-3">
                            <Label className="text-xs text-muted-foreground font-semibold">
                              Academic Performance
                            </Label>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                10th Mark %
                              </Label>
                              <p className="text-lg font-medium">
                                {stats.tenthMarks}%
                              </p>
                            </div>

                            <div>
                              <Label className="text-xs text-muted-foreground">
                                12th Mark %
                              </Label>
                              <p className="text-lg font-medium">
                                {stats.twelfthMarks}%
                              </p>
                            </div>

                            <div>
                              <Label className="text-xs text-muted-foreground">
                                UG Mark %
                              </Label>
                              <p className="text-lg font-medium">
                                {stats.ugMarks}%
                              </p>
                            </div>

                            <div className="col-span-2">
                              <Label className="text-xs text-muted-foreground">
                                Attendance: {stats.attendancePercentage}%
                              </Label>
                              <Progress
                                value={stats.attendancePercentage}
                                className="mt-2"
                              />
                            </div>

                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Assignments Submitted
                              </Label>
                              <p className="text-lg font-medium">
                                {stats.totalSubmissions}
                              </p>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="flex justify-end">
                    <Button variant="outline" onClick={closeStudentDetails}>
                      Close
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Assignment Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <Select
                    value={assignmentDeptFilter}
                    onValueChange={setAssignmentDeptFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_FILTER}>
                        All Departments
                      </SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {assignmentDeptFilter !== ALL_FILTER && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAssignmentDeptFilter(ALL_FILTER)}
                    >
                      Clear
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  <Select
                    value={assignmentYearFilter}
                    onValueChange={setAssignmentYearFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_FILTER}>All Years</SelectItem>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          Year {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {assignmentYearFilter !== ALL_FILTER && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAssignmentYearFilter(ALL_FILTER)}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignments List */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment List</CardTitle>
            </CardHeader>
            <CardContent>
              {paginatedAssignments.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Year</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedAssignments.map((assignment) => (
                          <TableRow key={assignment._id}>
                            <TableCell className="font-medium">
                              {assignment.title}
                            </TableCell>
                            <TableCell>{assignment.subject}</TableCell>
                            <TableCell>{assignment.department}</TableCell>
                            <TableCell>Year {assignment.yearOfStudy}</TableCell>
                            <TableCell>
                              {new Date(
                                assignment.dueDate,
                              ).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditAssignment(assignment)}
                              >
                                <Edit2 size={14} />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  handleDeleteAssignment(assignment._id)
                                }
                              >
                                <Trash2 size={14} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground">
                  No assignments found
                </p>
              )}
            </CardContent>
          </Card>

          {/* Submissions Section */}
          <Card>
            <CardHeader>
              <CardTitle>Student Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Assignment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submission Date</TableHead>
                        <TableHead>Marks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((submission) => (
                        <TableRow key={submission._id}>
                          <TableCell className="font-medium">
                            {submission.studentId.firstName}{" "}
                            {submission.studentId.lastName}
                          </TableCell>
                          <TableCell>{submission.assignmentId.title}</TableCell>
                          <TableCell>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                submission.status === "graded"
                                  ? "bg-green-100 text-green-800"
                                  : submission.status === "submitted"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {submission.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(
                              submission.submissionDate,
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {submission.marks !== null ? submission.marks : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground">
                  No submissions yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Attendance Section */}
          <Card>
            <CardHeader className="flex justify-between flex-row items-center">
              <CardTitle>Mark Attendance</CardTitle>
              <Button
                onClick={() => setShowAttendanceForm(true)}
                className="flex gap-2"
              >
                <Plus size={18} /> Mark Attendance
              </Button>
            </CardHeader>
            <CardContent>
              {showAttendanceForm && (
                <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 backdrop-blur-sm p-4">
                  <Card className="w-full max-w-2xl relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-4"
                      onClick={closeAttendanceForm}
                    >
                      <X size={18} />
                    </Button>

                    <CardHeader>
                      <CardTitle>Mark Student Attendance</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <Label>Date</Label>
                          <Input
                            type="date"
                            value={attendanceDate}
                            onChange={(e) => setAttendanceDate(e.target.value)}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label>Year</Label>
                          <Select
                            value={attendanceYear}
                            onValueChange={setAttendanceYear}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Year" />
                            </SelectTrigger>
                            <SelectContent>
                              {years.map((year) => (
                                <SelectItem key={year} value={year}>
                                  Year {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label>Period</Label>
                          <Select
                            value={attendancePeriod}
                            onValueChange={setAttendancePeriod}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Period" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7].map((period) => (
                                <SelectItem
                                  key={period}
                                  value={String(period)}
                                >
                                  Period {period}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label>Subject</Label>
                          <Select
                            value={attendanceSubject}
                            onValueChange={setAttendanceSubject}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {subjects.map((subject) => (
                                <SelectItem
                                  key={subject._id}
                                  value={subject.subjectName}
                                >
                                  {subject.subjectName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-3 max-h-96 overflow-y-auto border rounded p-4">
                        <Label className="font-semibold">
                          Select Student Status
                        </Label>
                        {attendanceYear ? (
                          filteredStudents.filter(
                            (student) =>
                              normalizeFilterValue(student.yearOfStudy) ===
                              normalizeFilterValue(attendanceYear),
                          ).length > 0 ? (
                            filteredStudents
                              .filter(
                                (student) =>
                                  normalizeFilterValue(student.yearOfStudy) ===
                                  normalizeFilterValue(attendanceYear),
                              )
                              .map((student) => (
                                <div
                                  key={student._id}
                                  className="flex items-center justify-between p-2 bg-muted rounded"
                                >
                                  <span className="text-sm font-medium">
                                    {student.firstName} {student.lastName} (
                                    {student.rollNumber})
                                  </span>
                                  <Select
                                    value={
                                      studentAttendanceData[student._id] || ""
                                    }
                                    onValueChange={(value) =>
                                      handleAttendanceStatusChange(
                                        student._id,
                                        value,
                                      )
                                    }
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="present">
                                        Present
                                      </SelectItem>
                                      <SelectItem value="absent">
                                        Absent
                                      </SelectItem>
                                      <SelectItem value="leave">
                                        Leave
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              ))
                          ) : (
                            <p className="text-center text-muted-foreground">
                              No students found for selected year
                            </p>
                          )
                        ) : (
                          <p className="text-center text-muted-foreground">
                            Please select a year first
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={closeAttendanceForm}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleMarkAttendance}
                          disabled={loading}
                        >
                          {loading ? "Marking..." : "Mark Attendance"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {editingAttendance && (
                <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 backdrop-blur-sm p-4">
                  <Card className="w-full max-w-md relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-4"
                      onClick={closeEditAttendance}
                    >
                      <X size={18} />
                    </Button>

                    <CardHeader>
                      <CardTitle>Edit Attendance</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-1">
                        <Label>Student</Label>
                        <p className="text-sm font-medium">
                          {editingAttendance.studentId?.firstName}{" "}
                          {editingAttendance.studentId?.lastName}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Subject
                          </Label>
                          <p className="font-medium">
                            {editingAttendance.subject}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Period
                          </Label>
                          <p className="font-medium">
                            Period {editingAttendance.period || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label>Status</Label>
                        <Select
                          value={editAttendanceStatus}
                          onValueChange={setEditAttendanceStatus}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="leave">Leave</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={closeEditAttendance}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleUpdateAttendance}
                          disabled={loading}
                        >
                          {loading ? "Updating..." : "Update"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {attendance.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.slice(0, 10).map((record) => (
                        <TableRow key={record._id}>
                          <TableCell className="font-medium">
                            {record.studentId.firstName}{" "}
                            {record.studentId.lastName}
                          </TableCell>
                          <TableCell>{record.subject}</TableCell>
                          <TableCell>
                            {new Date(record.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>Period {record.period || "-"}</TableCell>
                          <TableCell>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                record.status === "present"
                                  ? "bg-green-100 text-green-800"
                                  : record.status === "absent"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {record.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditAttendance(record)}
                            >
                              <Edit2 size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground">
                  No attendance records yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
