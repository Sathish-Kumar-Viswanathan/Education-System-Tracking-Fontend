import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "sonner";
import {
  Plus,
  Calendar,
  Users,
  X,
  LogOut,
  BookOpenCheck,
  UserCheck,
  UserMinus,
} from "lucide-react";
import TimetableForm from "./timeTableForm";
import TimetableList from "./TimetableList";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Label } from "@/components/ui/label";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, UserX, RotateCcw, Edit2 } from "lucide-react";
import { jwtDecode } from "jwt-decode";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registerUser } from "../../services/registration/registration.axios";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  getAllUsers,
  getStaffUsers,
  softDeleteUser,
  restoreUser,
  updateUser,
  assignSubjectToStaff,
  updateAssignedSubjectForStaff,
} from "../../services/users/users.axios";
import {
  getAllSubjects,
  createSubject,
  deleteSubject,
  restoreSubject,
  updateSubject,
} from "../../services/subjects/subjects.axios";
import {
  approveStudentProfileUpdateRequest,
  getAllStudents,
  getStudentProfileUpdateRequests,
  rejectStudentProfileUpdateRequest,
} from "../../services/students/students.axios";
import { getAttendanceByStudent } from "../../services/attendance/attendance.axios";
import { getAssignmentFileUrl } from "../../services/assignments/assignments.axios";

const profileFileFields = new Set([
  "tenthMarksheetUrl",
  "twelfthMarksheetUrl",
  "ugMarksheetUrl",
]);
const MAX_SUBJECTS_PER_STAFF = 2;
const subjectAssignYears = ["1", "2"];
const subjectAssignSemesters = ["1", "2", "3", "4"];
const subjectYears = subjectAssignYears;
const subjectSemesters = subjectAssignSemesters;

const userSchema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    email: z.string().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(16, "Password must be at most 16 characters")
      .regex(/[A-Z]/, "Must contain at least 1 uppercase letter")
      .regex(/[0-9]/, "Must contain at least 1 number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least 1 special character")
      .optional()
      .or(z.literal("")),
    role: z.enum(["student", "staff", "admin", "coordinator"], {
      required_error: "Role is required",
    }),
    rollNumber: z.string().optional(),
    yearOfStudy: z.string().optional(),
    department: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "student" && !data.rollNumber?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "This field is required for students",
        path: ["rollNumber"],
      });
    }

    if (data.role === "student" && !data.yearOfStudy?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "This field is required for students",
        path: ["yearOfStudy"],
      });
    }

    if (
      (data.role === "student" ||
        data.role === "staff" ||
        data.role === "coordinator") &&
      !data.department?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Department is required",
        path: ["department"],
      });
    }
  });

export default function AdminDashboard() {
  // ⭐ HOOKS
  const navigate = useNavigate();

  // ⭐ STATE
  const [showUserForm, setShowUserForm] = useState(false);
  const [showTimetableForm, setShowTimetableForm] = useState(false);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [subjectName, setSubjectName] = useState("");
  const [subjectYearOfStudy, setSubjectYearOfStudy] = useState("");
  const [subjectSemester, setSubjectSemester] = useState("");
  const [showUsersList, setShowUsersList] = useState(false);
  const [showStaffDetails, setShowStaffDetails] = useState(false);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [showSubjectAssign, setShowSubjectAssign] = useState(false);
  const [showSubjectsList, setShowSubjectsList] = useState(false);
  const [showTimetableList, setShowTimetableList] = useState(false);
  const [showProfileRequests, setShowProfileRequests] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [users, setUsers] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
  const [selectedStudentAttendance, setSelectedStudentAttendance] =
    useState(null);
  const [showStudentSubjectMarks, setShowStudentSubjectMarks] = useState(false);
  const [selectedStudentMarksSemester, setSelectedStudentMarksSemester] =
    useState("all");
  const [studentDetailsLoading, setStudentDetailsLoading] = useState(false);
  const [profileRequests, setProfileRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectStatusFilter, setSubjectStatusFilter] = useState("all");
  const [staffSearch, setStaffSearch] = useState("");
  const [staffStatusFilter, setStaffStatusFilter] = useState("all");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentStatusFilter, setStudentStatusFilter] = useState("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [userIdToRestore, setUserIdToRestore] = useState(null);
  const [showSubjectDeleteConfirm, setShowSubjectDeleteConfirm] =
    useState(false);
  const [subjectIdToDelete, setSubjectIdToDelete] = useState(null);
  const [showSubjectRestoreConfirm, setShowSubjectRestoreConfirm] =
    useState(false);
  const [subjectIdToRestore, setSubjectIdToRestore] = useState(null);
  const [staffToPromote, setStaffToPromote] = useState(null);
  const [staffToDemote, setStaffToDemote] = useState(null);
  const [selectedCoordinatorYear, setSelectedCoordinatorYear] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedAssignYear, setSelectedAssignYear] = useState("");
  const [selectedAssignSemester, setSelectedAssignSemester] = useState("");
  const [editingAssignedSubject, setEditingAssignedSubject] = useState(null);

  const [error, setError] = useState({});
  const [isValid, setIsValid] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "",
      rollNumber: "",
      yearOfStudy: "",
      department: "",
    },
  });

  const subjectSchema = z.object({
    subjectName: z
      .string()
      .min(3, "Subject must be at least 3 characters")
      .max(50, "Too long"),
  });

  const validateField = (value) => {
    const result = subjectSchema.safeParse({ subjectName: value });

    if (!result.success) {
      const fieldError = result.error.format().subjectName?._errors[0];
      setError({ subjectName: fieldError });
      setIsValid(false);
    } else {
      setError({});
      setIsValid(true);
    }
  };

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  const paginate = (data) => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  };

  // ⭐ HANDLERS

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      if (editingUser) {
        // Update existing user
        const { password, ...updateData } = data;
        await updateUser(editingUser._id, updateData);
        toast.success("User updated successfully");
      } else {
        // Create new user
        await registerUser(data);
        toast.success("User created successfully");
      }
      setShowUserForm(false);
      setEditingUser(null);
      reset();
      // Refresh the users list
      const updatedUsers = await getAllUsers();
      setUsers(updatedUsers);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTimetable = () => {
    toast.success("Timetable Created Successfully");
    setShowTimetableForm(false);
  };

  const handleCreateSubject = async () => {
    if (!subjectName || !subjectYearOfStudy || !subjectSemester) {
      toast.error("Please enter subject name, year, and semester");
      return;
    }

    try {
      // 🔐 Get token
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("User not authenticated");
        return;
      }

      // 🔓 Decode token
      const decoded = jwtDecode(token);

      // 🧠 Extract userId (depends on your backend)
      const userId = decoded.id || decoded._id || decoded.userId;

      // 📦 Create subject object
      const newSubject = {
        name: subjectName,
        yearOfStudy: subjectYearOfStudy,
        semester: subjectSemester,
        createdBy: userId,
      };

      // 🗂️ Update state
      

      // 📦 Call the API to create the subject
      const addSubject = await createSubject(newSubject);
      if (addSubject) {
        toast.success(
          addSubject.updated
            ? "Subject already exists. Year and semester updated"
            : "Subject added",
        );
        setSubjectName("");
        setSubjectYearOfStudy("");
        setSubjectSemester("");
        setShowSubjectForm(false);
        const updatedSubjects = await getAllSubjects();
        setSubjects(updatedSubjects);
      } else {
        toast.error("Failed to add subject");
      }
    } catch {
      toast.error("Invalid token");
    }
  };

  const handleOpenUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
      setShowUsersList(true);
    } catch {
      toast.error("Failed to fetch users");
    }
  };

  const handleOpenStaffDetails = async () => {
    try {
      setLoading(true);
      const data = await getStaffUsers();
      setStaffUsers(data || []);
      setCurrentPage(1);
      setShowStaffDetails(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStudentDetails = async () => {
    try {
      setLoading(true);
      const data = await getAllStudents();
      setStudents(data?.students || []);
      setCurrentPage(1);
      setShowStudentDetails(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudentDetails = async (student) => {
    setSelectedStudentDetails(student);
    setSelectedStudentAttendance(null);
    setShowStudentSubjectMarks(false);
    setSelectedStudentMarksSemester("all");

    try {
      setStudentDetailsLoading(true);
      const data = await getAttendanceByStudent(student._id);
      setSelectedStudentAttendance(data || null);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to fetch student attendance",
      );
    } finally {
      setStudentDetailsLoading(false);
    }
  };

  const closeSelectedStudentDetails = () => {
    setSelectedStudentDetails(null);
    setSelectedStudentAttendance(null);
    setShowStudentSubjectMarks(false);
    setSelectedStudentMarksSemester("all");
  };

  const handleOpenSubjectAssign = async () => {
    try {
      setLoading(true);
      const [staffData, subjectData] = await Promise.all([
        getStaffUsers(),
        getAllSubjects(),
      ]);
      setStaffUsers(staffData || []);
      setSubjects(Array.isArray(subjectData) ? subjectData : subjectData || []);
      setSelectedStaffId("");
      setSelectedSubjectId("");
      setSelectedAssignYear("");
      setSelectedAssignSemester("");
      setEditingAssignedSubject(null);
      setShowSubjectAssign(true);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to load staff and subjects",
      );
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentSubjectId = (assignment) => {
    if (assignment?.subject) {
      return assignment.subject._id || assignment.subject;
    }

    return assignment?._id || assignment;
  };

  const isSameAssignedSubject = (assignment, target) =>
    assignment &&
    target &&
    getAssignmentSubjectId(assignment) === target.subjectId &&
    assignment.yearOfStudy === target.yearOfStudy &&
    assignment.semester === target.semester;

  const getAssignedSubjectIds = (
    staff,
    yearOfStudy,
    semester,
    excludedAssignment,
  ) =>
    staff?.assignedSubjects
      ?.filter(Boolean)
      ?.filter(
        (assignment) => !isSameAssignedSubject(assignment, excludedAssignment),
      )
      ?.filter((assignment) => {
        if (!yearOfStudy || !semester) return true;

        return (
          assignment.yearOfStudy === yearOfStudy &&
          assignment.semester === semester
        );
      })
      .map(getAssignmentSubjectId) || [];

  const getSubjectAssignmentOwner = (
    subjectId,
    yearOfStudy,
    semester,
    excludedAssignment,
  ) =>
    staffUsers.find((staff) =>
      (staff.assignedSubjects || []).filter(Boolean).some((assignment) => {
        if (isSameAssignedSubject(assignment, excludedAssignment)) {
          return false;
        }

        return (
          getAssignmentSubjectId(assignment) === subjectId &&
          assignment.yearOfStudy === yearOfStudy &&
          assignment.semester === semester
        );
      }),
    );

  const isSubjectAvailableForAssignment = (subject) => {
    if (!selectedAssignYear || !selectedAssignSemester) {
      return false;
    }

    if (
      subject.yearOfStudy &&
      String(subject.yearOfStudy) !== String(selectedAssignYear)
    ) {
      return false;
    }

    if (
      subject.semester &&
      String(subject.semester) !== String(selectedAssignSemester)
    ) {
      return false;
    }

    return !getSubjectAssignmentOwner(
      subject._id,
      selectedAssignYear,
      selectedAssignSemester,
      editingAssignedSubject,
    );
  };

  const handleEditAssignedSubject = (staff, assignment) => {
    const subjectId = getAssignmentSubjectId(assignment);

    setSelectedStaffId(staff._id);
    setSelectedAssignYear(assignment.yearOfStudy || "");
    setSelectedAssignSemester(assignment.semester || "");
    setSelectedSubjectId(subjectId || "");
    setEditingAssignedSubject({
      staffId: staff._id,
      subjectId,
      yearOfStudy: assignment.yearOfStudy || "",
      semester: assignment.semester || "",
    });
  };

  const clearAssignedSubjectEdit = () => {
    setEditingAssignedSubject(null);
    setSelectedSubjectId("");
  };

  const handleAssignSubject = async () => {
    if (
      !selectedAssignYear ||
      !selectedAssignSemester ||
      !selectedStaffId ||
      !selectedSubjectId
    ) {
      toast.error("Please select year, semester, staff, and subject");
      return;
    }

    const selectedStaff = staffUsers.find(
      (staff) => staff._id === selectedStaffId,
    );
    const assignedSubjectIds = getAssignedSubjectIds(
      selectedStaff,
      selectedAssignYear,
      selectedAssignSemester,
      editingAssignedSubject?.staffId === selectedStaffId
        ? editingAssignedSubject
        : null,
    );
    const isAlreadyAssigned = assignedSubjectIds.includes(selectedSubjectId);
    const assignmentOwner = getSubjectAssignmentOwner(
      selectedSubjectId,
      selectedAssignYear,
      selectedAssignSemester,
      editingAssignedSubject,
    );

    if (assignmentOwner) {
      toast.error(
        `This subject is already assigned to ${assignmentOwner.name} for Year ${selectedAssignYear}, Sem ${selectedAssignSemester}`,
      );
      return;
    }

    if (
      !isAlreadyAssigned &&
      assignedSubjectIds.length >= MAX_SUBJECTS_PER_STAFF
    ) {
      toast.error(
        "A staff member can handle a maximum of 2 subjects per year and semester",
      );
      return;
    }

    try {
      setLoading(true);
      if (editingAssignedSubject) {
        await updateAssignedSubjectForStaff(selectedStaffId, {
          currentSubjectId: editingAssignedSubject.subjectId,
          currentYearOfStudy: editingAssignedSubject.yearOfStudy,
          currentSemester: editingAssignedSubject.semester,
          subjectId: selectedSubjectId,
          yearOfStudy: selectedAssignYear,
          semester: selectedAssignSemester,
        });
        toast.success("Assigned subject updated");
      } else {
        await assignSubjectToStaff(
          selectedStaffId,
          selectedSubjectId,
          selectedAssignYear,
          selectedAssignSemester,
        );
        toast.success("Subject assigned to staff");
      }
      const staffData = await getStaffUsers();
      setStaffUsers(staffData || []);
      setSelectedSubjectId("");
      setEditingAssignedSubject(null);
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          `Failed to ${editingAssignedSubject ? "update" : "assign"} subject`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSubjects = async () => {
    try {
      const data = await getAllSubjects();

      setSubjects(data);
      setShowSubjectsList(true);
    } catch {
      toast.error("Failed to fetch subjects");
    }
  };

  const getAdminId = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      return decoded.id || decoded._id || decoded.userId || null;
    } catch {
      return null;
    }
  };

  const handleOpenProfileRequests = async () => {
    try {
      setLoading(true);
      const data = await getStudentProfileUpdateRequests({ status: "pending" });
      setProfileRequests(data.requests || []);
      setShowProfileRequests(true);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to fetch profile requests",
      );
    } finally {
      setLoading(false);
    }
  };

  const refreshProfileRequests = async () => {
    const data = await getStudentProfileUpdateRequests({ status: "pending" });
    setProfileRequests(data.requests || []);
  };

  const handleApproveProfileRequest = async (requestId) => {
    try {
      setLoading(true);
      await approveStudentProfileUpdateRequest(requestId, getAdminId());
      toast.success("Profile request approved");
      await refreshProfileRequests();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to approve profile request",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRejectProfileRequest = async (requestId) => {
    try {
      setLoading(true);
      await rejectStudentProfileUpdateRequest(requestId, getAdminId());
      toast.success("Profile request rejected");
      await refreshProfileRequests();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to reject profile request",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = (id) => {
    setSubjectIdToDelete(id);
    setShowSubjectDeleteConfirm(true);
  };

  const confirmDeleteSubject = async () => {
    try {
      setLoading(true);
      await deleteSubject(subjectIdToDelete);
      toast.success("Subject deleted successfully");
      setShowSubjectDeleteConfirm(false);
      setSubjectIdToDelete(null);
      // Refresh the list
      const data = await getAllSubjects();
      setSubjects(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete subject");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreSubject = (id) => {
    setSubjectIdToRestore(id);
    setShowSubjectRestoreConfirm(true);
  };

  const confirmRestoreSubject = async () => {
    try {
      setLoading(true);
      await restoreSubject(subjectIdToRestore);
      toast.success("Subject restored successfully");
      setShowSubjectRestoreConfirm(false);
      setSubjectIdToRestore(null);
      // Refresh the list
      const data = await getAllSubjects();
      setSubjects(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to restore subject");
    } finally {
      setLoading(false);
    }
  };

  const handleSoftDelete = (userId) => {
    setUserIdToDelete(userId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await softDeleteUser(userIdToDelete);
      toast.success("User deleted successfully");
      setShowDeleteConfirm(false);
      setUserIdToDelete(null);
      // Refresh the users list
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (userId) => {
    setUserIdToRestore(userId);
    setShowRestoreConfirm(true);
  };

  const confirmRestore = async () => {
    try {
      setLoading(true);
      await restoreUser(userIdToRestore);
      toast.success("User restored successfully");
      setShowRestoreConfirm(false);
      setUserIdToRestore(null);
      // Refresh the users list
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to restore user");
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToCoordinator = (staff) => {
    setStaffToPromote(staff);
    setSelectedCoordinatorYear("");
  };

  const confirmPromoteToCoordinator = async () => {
    if (!staffToPromote) return;
    if (!selectedCoordinatorYear) {
      toast.error("Please select coordinator year");
      return;
    }

    const existingCoordinator = staffUsers.find(
      (staff) =>
        staff._id !== staffToPromote._id &&
        staff.role === "coordinator" &&
        staff.coordinatorYear === selectedCoordinatorYear &&
        staff.isDelete === false,
    );

    if (existingCoordinator) {
      toast.error(
        `Year ${selectedCoordinatorYear} already has ${existingCoordinator.name} as coordinator`,
      );
      return;
    }

    try {
      setLoading(true);
      await updateUser(staffToPromote._id, {
        name: staffToPromote.name,
        email: staffToPromote.email,
        role: "coordinator",
        department: staffToPromote.department || "MCA",
        coordinatorYear: selectedCoordinatorYear,
      });
      toast.success("Staff promoted to coordinator successfully");
      setStaffToPromote(null);
      setSelectedCoordinatorYear("");

      const [updatedStaff, updatedUsers] = await Promise.all([
        getStaffUsers(),
        getAllUsers(),
      ]);
      setStaffUsers(updatedStaff || []);
      setUsers(updatedUsers || []);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to promote coordinator",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoteCoordinator = (staff) => {
    setStaffToDemote(staff);
  };

  const confirmDemoteCoordinator = async () => {
    if (!staffToDemote) return;

    try {
      setLoading(true);
      await updateUser(staffToDemote._id, {
        name: staffToDemote.name,
        email: staffToDemote.email,
        role: "staff",
        department: staffToDemote.department || "MCA",
      });
      toast.success("Coordinator demoted to staff successfully");
      setStaffToDemote(null);

      const [updatedStaff, updatedUsers] = await Promise.all([
        getStaffUsers(),
        getAllUsers(),
      ]);
      setStaffUsers(updatedStaff || []);
      setUsers(updatedUsers || []);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to demote coordinator",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/");
  };

  const filteredStaffUsers = staffUsers
    .filter((staff) =>
      [staff.name, staff.email]
        .filter(Boolean)
        .some((value) =>
          value.toLowerCase().includes(staffSearch.toLowerCase()),
        ),
    )
    .filter((staff) =>
      staffStatusFilter === "all"
        ? true
        : staffStatusFilter === "active"
          ? staff.isDelete === false
          : staff.isDelete === true,
    );

  const filteredStudents = students
    .filter((student) => {
      const studentName = [student.firstName, student.lastName, student.name]
        .filter(Boolean)
        .join(" ");

      return [studentName, student.email, student.rollNumber, student.department]
        .filter(Boolean)
        .some((value) =>
          value.toLowerCase().includes(studentSearch.toLowerCase()),
        );
    })
    .filter((student) =>
      studentStatusFilter === "all"
        ? true
        : studentStatusFilter === "active"
          ? student.isDelete === false
          : student.isDelete === true,
    );

  const formatMarkValue = (value) =>
    value !== null && value !== undefined && value !== "" ? value : "-";

  const formatSemesterLabel = (semester) => {
    if (!semester) return "Not set";

    const semesterValue = String(semester);
    return semesterValue.toLowerCase().includes("sem")
      ? semesterValue
      : `Sem ${semesterValue}`;
  };

  const getTotalMark = (mark) => {
    const values = [
      mark.internalOneMark,
      mark.internalTwoMark,
      mark.internalThreeMark,
      mark.semesterMark,
    ];

    return values.some(
      (value) => value !== null && value !== undefined && value !== "",
    )
      ? values.reduce((total, value) => total + (Number(value) || 0), 0)
      : "-";
  };

  const selectedStudentSubjectMarks = selectedStudentDetails
    ? (selectedStudentDetails.academicMarks || []).length > 0
      ? selectedStudentDetails.academicMarks
      : [
          {
            subject: "Overall Marks",
            semester: selectedStudentDetails.semester,
            internalOneMark: selectedStudentDetails.internalOneMark,
            internalTwoMark: selectedStudentDetails.internalTwoMark,
            internalThreeMark: selectedStudentDetails.internalThreeMark,
            semesterMark: selectedStudentDetails.semesterMark,
          },
        ]
    : [];

  const selectedStudentMarksSemesters = [
    ...new Set(
      selectedStudentSubjectMarks.map((mark) =>
        mark.semester ? String(mark.semester) : "not-set",
      ),
    ),
  ];

  const filteredStudentSubjectMarks =
    selectedStudentMarksSemester === "all"
      ? selectedStudentSubjectMarks
      : selectedStudentSubjectMarks.filter(
          (mark) =>
            (mark.semester ? String(mark.semester) : "not-set") ===
            selectedStudentMarksSemester,
        );

  const selectedSubjectAssignStaff = staffUsers.find(
    (staff) => staff._id === selectedStaffId,
  );
  const selectedStaffSubjectCount = getAssignedSubjectIds(
    selectedSubjectAssignStaff,
    selectedAssignYear,
    selectedAssignSemester,
  ).length;
  const selectedStaffAtSubjectLimit =
    selectedAssignYear &&
    selectedAssignSemester &&
    selectedStaffSubjectCount >= MAX_SUBJECTS_PER_STAFF;

  return (
    <>
      <Toaster position="top-right" richColors="true" closeButton="true" />

      <div className="p-6 space-y-6 bg-muted/40 min-h-screen">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <LogOut size={18} />
            Logout
          </Button>
        </div>

        {/* ACTION CARDS */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* CREATE USER */}
          <Card
            className="cursor-pointer hover:bg-primary hover:text-white transition"
            onClick={() => setShowUserForm(true)}
          >
            <CardContent className="flex flex-col items-center justify-center p-10">
              <Users size={40} />
              <p className="mt-3 text-lg font-semibold">Create Users</p>
            </CardContent>
          </Card>

          {/* CREATE TIMETABLE */}
          <Card
            className="cursor-pointer hover:bg-primary hover:text-white transition"
            onClick={() => setShowTimetableForm(true)}
          >
            <CardContent className="flex flex-col items-center justify-center p-10">
              <Calendar size={40} />
              <p className="mt-3 text-lg font-semibold">Create Timetable</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-primary hover:text-white transition"
            onClick={() => setShowSubjectForm(true)}
          >
            <CardContent className="flex flex-col items-center justify-center p-10">
              <Plus size={40} />
              <p className="mt-3 text-lg font-semibold">Add Subjects</p>
            </CardContent>
          </Card>

          {/* VIEW USERS */}
          <Card
            className="cursor-pointer hover:bg-primary hover:text-white transition "
            onClick={handleOpenUsers}
          >
            <CardContent className="flex flex-col items-center justify-center p-10">
              <Users size={40} />
              <p className="mt-3 text-lg font-semibold">View Users</p>
            </CardContent>
          </Card>

          {/* STAFF DETAILS */}
          <Card
            className="cursor-pointer hover:bg-primary hover:text-white transition"
            onClick={handleOpenStaffDetails}
          >
            <CardContent className="flex flex-col items-center justify-center p-10">
              <Users size={40} />
              <p className="mt-3 text-lg font-semibold">Staff Details</p>
            </CardContent>
          </Card>

          {/* STUDENT DETAILS */}
          <Card
            className="cursor-pointer hover:bg-primary hover:text-white transition"
            onClick={handleOpenStudentDetails}
          >
            <CardContent className="flex flex-col items-center justify-center p-10">
              <Users size={40} />
              <p className="mt-3 text-lg font-semibold">Student Details</p>
            </CardContent>
          </Card>

          {/* VIEW SUBJECTS */}
          <Card
            className="cursor-pointer hover:bg-primary hover:text-white transition"
            onClick={handleOpenSubjects}
          >
            <CardContent className="flex flex-col items-center justify-center p-10">
              <Plus size={40} />
              <p className="mt-3 text-lg font-semibold">View Subjects</p>
            </CardContent>
          </Card>

          {/* VIEW TIMETABLE */}
          <Card
            className="cursor-pointer hover:bg-primary hover:text-white transition"
            onClick={() => setShowTimetableList(true)}
          >
            <CardContent className="flex flex-col items-center justify-center p-10">
              <Calendar size={40} />
              <p className="mt-3 text-lg font-semibold">View Timetables</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-primary hover:text-white transition"
            onClick={handleOpenProfileRequests}
          >
            <CardContent className="flex flex-col items-center justify-center p-10">
              <Users size={40} />
              <p className="mt-3 text-lg font-semibold">Profile Requests</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:bg-primary hover:text-white transition"
            onClick={handleOpenSubjectAssign}
          >
            <CardContent className="flex flex-col items-center justify-center p-10">
              <BookOpenCheck size={40} />
              <p className="mt-3 text-lg font-semibold">Subject Assign</p>
            </CardContent>
          </Card>
        </div>

        {/* ================= CREATE USER POPUP ================= */}
        {showUserForm && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-xl relative">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={() => setShowUserForm(false)}
              >
                <X size={18} />
              </Button>

              <CardHeader>
                <CardTitle>Create User</CardTitle>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Name */}
                  <div className="space-y-1">
                    <Label>Name</Label>
                    <Input
                      placeholder="Enter name"
                      {...register("name")}
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input
                      placeholder="Enter email"
                      {...register("email")}
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 text-left">
                    <Label>Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        {...register("password")}
                        className={`pr-10 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-500 text-left">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Role */}
                  <div className="space-y-1">
                    <Label>Role</Label>
                    <Select
                      onValueChange={(value) => {
                        setValue("role", value, { shouldValidate: true });
                        // Auto-set department to MCA for students, staff, and coordinators
                        if (
                          value === "student" ||
                          value === "staff" ||
                          value === "coordinator"
                        ) {
                          setValue("department", "MCA", {
                            shouldValidate: true,
                          });
                        } else {
                          setValue("department", "", {
                            shouldValidate: true,
                          });
                        }
                      }}
                    >
                      <SelectTrigger
                        className={`w-full ${errors.role ? "border-red-500 focus:ring-red-500" : ""}`}
                      >
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.role && (
                      <p className="text-sm text-red-500">
                        {errors.role.message}
                      </p>
                    )}
                  </div>

                  {/* Department - Only for Students and Staff */}
                  {(watch("role") === "student" ||
                    watch("role") === "staff" ||
                    watch("role") === "coordinator") && (
                    <div className="space-y-1">
                      <Label>Department *</Label>
                      <Select
                        value={watch("department") || ""}
                        onValueChange={(value) =>
                          setValue("department", value, {
                            shouldValidate: true,
                          })
                        }
                      >
                        <SelectTrigger
                          className={`w-full ${errors.department ? "border-red-500 focus:ring-red-500" : ""}`}
                        >
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MCA">MCA</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.department && (
                        <p className="text-sm text-red-500">
                          {errors.department.message}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Roll Number - Only for Students */}
                  {watch("role") === "student" && (
                    <div className="space-y-1">
                      <Label>Roll Number *</Label>
                      <Input
                        placeholder="Enter roll number"
                        {...register("rollNumber")}
                        className={errors.rollNumber ? "border-red-500" : ""}
                      />
                      {errors.rollNumber && (
                        <p className="text-sm text-red-500">
                          {errors.rollNumber.message}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Year of Study - Only for Students */}
                  {watch("role") === "student" && (
                    <div className="space-y-1">
                      <Label>Year of Study *</Label>
                      <Select
                        onValueChange={(value) =>
                          setValue("yearOfStudy", value)
                        }
                      >
                        <SelectTrigger
                          className={`w-full ${errors.yearOfStudy ? "border-red-500 focus:ring-red-500" : ""}`}
                        >
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="First Year">First Year</SelectItem>
                          <SelectItem value="Second Year">
                            Second Year
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.yearOfStudy && (
                        <p className="text-sm text-red-500">
                          {errors.yearOfStudy.message}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Submit */}
                  <Button type="submit" className="w-full">
                    Create User
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
        {/* ================= TIMETABLE POPUP ================= */}
        {showTimetableForm && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50  backdrop-blur-sm p-4">
            <Card className="w-full max-w-5xl relative max-h-[90vh] overflow-auto">
              {/* ❌ CLOSE BUTTON */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={() => setShowTimetableForm(false)}
              >
                <X size={18} />
              </Button>

              {/* HEADER */}
              <CardHeader>
                <CardTitle>Create Timetable</CardTitle>
              </CardHeader>

              {/* FORM */}
              <CardContent>
                <TimetableForm />
              </CardContent>
            </Card>
          </div>
        )}

        {showSubjectForm && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md relative">
              {/* CLOSE */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={() => {
                  setShowSubjectForm(false);
                  setSubjectYearOfStudy("");
                  setSubjectSemester("");
                }}
              >
                <X size={18} />
              </Button>

              {/* HEADER */}
              <CardHeader>
                <CardTitle>Add Subject</CardTitle>
              </CardHeader>

              {/* FORM */}
              <CardContent className="space-y-4">
                <div>
                  <Input
                    placeholder="Enter Subject Name"
                    value={subjectName}
                    onChange={(e) => {
                      setSubjectName(e.target.value);
                      validateField(e.target.value);
                    }}
                    className={
                      errors.subjectName
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                  />

                  {/* ERROR MESSAGE */}
                  {errors.subjectName && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.subjectName}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select
                      value={subjectYearOfStudy}
                      onValueChange={setSubjectYearOfStudy}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjectYears.map((year) => (
                          <SelectItem key={year} value={year}>
                            Year {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select
                      value={subjectSemester}
                      onValueChange={setSubjectSemester}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjectSemesters.map((semester) => (
                          <SelectItem key={semester} value={semester}>
                            Sem {semester}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleCreateSubject}
                  disabled={!isValid || !subjectYearOfStudy || !subjectSemester}
                >
                  Add Subject
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {showUsersList && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
            <Card className="w-full max-w-3xl relative shadow-xl rounded-2xl">
              {/* CLOSE BUTTON */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={() => setShowUsersList(false)}
              >
                <X size={18} />
              </Button>

              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  All Users
                </CardTitle>
              </CardHeader>

              <CardContent>
                {/* SEARCH */}
                <div className="flex gap-3 mb-4 flex-wrap">
                  {/* SEARCH */}
                  <Input
                    placeholder="Search user..."
                    className="flex-1"
                    onChange={(e) => setSearch(e.target.value)}
                  />

                  {/* ROLE FILTER */}
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-35">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* STATUS FILTER */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-35">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* TABLE */}
                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {paginate(
                        users
                          .filter((u) =>
                            u.name
                              ?.toLowerCase()
                              .includes(search.toLowerCase()),
                          )
                          .filter((u) =>
                            roleFilter === "all" ? true : u.role === roleFilter,
                          )
                          .filter((u) =>
                            statusFilter === "all"
                              ? true
                              : statusFilter === "active"
                                ? u.isDelete === false
                                : u.isDelete === true,
                          ),
                      ).map((u, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">
                            {u.name}
                          </TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{u.role}</TableCell>
                          <TableCell>
                            {u.isDelete === true ? (
                              <span className="text-red-500">Inactive</span>
                            ) : (
                              <span className="text-green-500">Active</span>
                            )}
                          </TableCell>

                          {/* ACTION BUTTONS */}
                          <TableCell className="flex justify-center gap-2">
                            {u.isDelete === false ? (
                              /* SOFT DELETE - for active users */
                              <Button
                                size="icon"
                                variant="destructive"
                                onClick={() => handleSoftDelete(u._id)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            ) : (
                              /* RESTORE - for deleted users */
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleRestore(u._id)}
                              >
                                <RotateCcw size={16} />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* PAGINATION */}
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    Prev
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showStaffDetails && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
            <Card className="w-full max-w-4xl relative shadow-xl rounded-2xl max-h-[90vh] overflow-auto">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={() => setShowStaffDetails(false)}
              >
                <X size={18} />
              </Button>

              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Staff Details
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3 mb-4">
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">
                      Total Staff
                    </p>
                    <p className="text-2xl font-semibold">
                      {staffUsers.length}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-semibold text-green-600">
                      {
                        staffUsers.filter((staff) => staff.isDelete === false)
                          .length
                      }
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">Inactive</p>
                    <p className="text-2xl font-semibold text-red-600">
                      {
                        staffUsers.filter((staff) => staff.isDelete === true)
                          .length
                      }
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mb-4 flex-wrap">
                  <Input
                    placeholder="Search staff..."
                    className="flex-1"
                    value={staffSearch}
                    onChange={(e) => {
                      setStaffSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                  />

                  <Select
                    value={staffStatusFilter}
                    onValueChange={(value) => {
                      setStaffStatusFilter(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-35">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Handled Subjects</TableHead>
                        <TableHead>Joined On</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {paginate(filteredStaffUsers).map((staff) => (
                        <TableRow key={staff._id}>
                          <TableCell className="font-medium">
                            {staff.name}
                          </TableCell>
                          <TableCell>{staff.email}</TableCell>
                          <TableCell>
                            {staff.department || "Not assigned"}
                          </TableCell>
                          <TableCell>
                            {staff.assignedSubjects?.filter(Boolean).length >
                            0 ? (
                              <div className="space-y-2">
                                {staff.assignedSubjects
                                  .filter(Boolean)
                                  .map((assignment, index) => {
                                    const subjectName =
                                      assignment.subject?.subjectName ||
                                      assignment.subjectName ||
                                      "Unnamed Subject";
                                    const year = assignment.yearOfStudy
                                      ? `Year ${assignment.yearOfStudy}`
                                      : "Year not set";
                                    const semester = assignment.semester
                                      ? `Sem ${assignment.semester}`
                                      : "Sem not set";

                                    return (
                                      <div
                                        key={`${staff._id}-handled-${index}`}
                                        className="leading-tight"
                                      >
                                        <p className="font-medium text-slate-900">
                                          {subjectName}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {year}, {semester}
                                        </p>
                                      </div>
                                    );
                                  })}
                              </div>
                            ) : (
                              "Not assigned"
                            )}
                          </TableCell>
                          <TableCell>
                            {staff.createdAt
                              ? new Date(staff.createdAt).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {staff.isDelete === true ? (
                              <span className="text-red-500">Inactive</span>
                            ) : (
                              <span className="text-green-500">Active</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {staff.role === "coordinator" ? (
                              <div className="flex flex-col items-end gap-2">
                                <span className="text-xs font-medium text-green-600">
                                  Coordinator
                                  {staff.coordinatorYear
                                    ? ` - Year ${staff.coordinatorYear}`
                                    : ""}
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDemoteCoordinator(staff)}
                                  disabled={staff.isDelete === true}
                                >
                                  <UserMinus size={16} className="mr-2" />
                                  Demote
                                </Button>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handlePromoteToCoordinator(staff)
                                }
                                disabled={staff.isDelete === true}
                              >
                                <UserCheck size={16} className="mr-2" />
                                Promote to Coordinator
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredStaffUsers.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No staff details found
                  </p>
                )}

                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Prev
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={
                      currentPage * itemsPerPage >= filteredStaffUsers.length
                    }
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showProfileRequests && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
            <Card className="w-full max-w-5xl relative shadow-xl rounded-2xl max-h-[90vh] overflow-auto">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={() => setShowProfileRequests(false)}
              >
                <X size={18} />
              </Button>

              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Student Profile Update Requests
                </CardTitle>
              </CardHeader>

              <CardContent>
                {profileRequests.length > 0 ? (
                  <div className="border rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Requested Changes</TableHead>
                          <TableHead>Requested On</TableHead>
                          <TableHead className="text-center">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profileRequests.map((request) => (
                          <TableRow key={request._id}>
                            <TableCell className="font-medium">
                              <div>
                                <p>
                                  {[
                                    request.studentId?.firstName,
                                    request.studentId?.lastName,
                                  ]
                                    .filter(Boolean)
                                    .join(" ") || request.userId?.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Roll:{" "}
                                  {request.studentId?.rollNumber || "Not set"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-h-40 overflow-y-auto space-y-1 text-sm">
                                {Object.entries(
                                  request.requestedProfile || {},
                                ).map(([key, value]) => (
                                  <p key={key}>
                                    <span className="font-medium">{key}:</span>{" "}
                                    {profileFileFields.has(key) && value ? (
                                      <a
                                        href={getAssignmentFileUrl(value)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="font-medium text-blue-600 hover:underline"
                                      >
                                        View PDF
                                      </a>
                                    ) : value === null || value === "" ? (
                                      "-"
                                    ) : (
                                      String(value)
                                    )}
                                  </p>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(request.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleApproveProfileRequest(request._id)
                                  }
                                  disabled={loading}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    handleRejectProfileRequest(request._id)
                                  }
                                  disabled={loading}
                                >
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No pending profile update requests
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {showStudentDetails && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
            <Card className="w-full max-w-5xl relative shadow-xl rounded-2xl max-h-[90vh] overflow-auto">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={() => {
                  setShowStudentDetails(false);
                  closeSelectedStudentDetails();
                }}
              >
                <X size={18} />
              </Button>

              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Student Details
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3 mb-4">
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">
                      Total Students
                    </p>
                    <p className="text-2xl font-semibold">
                      {students.length}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-semibold text-green-600">
                      {
                        students.filter((student) => student.isDelete === false)
                          .length
                      }
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">Inactive</p>
                    <p className="text-2xl font-semibold text-red-600">
                      {
                        students.filter((student) => student.isDelete === true)
                          .length
                      }
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mb-4 flex-wrap">
                  <Input
                    placeholder="Search student..."
                    className="flex-1"
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                  />

                  <Select
                    value={studentStatusFilter}
                    onValueChange={(value) => {
                      setStudentStatusFilter(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-35">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Roll No</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {paginate(filteredStudents).map((student) => {
                        const studentName =
                          [student.firstName, student.lastName]
                            .filter(Boolean)
                            .join(" ") ||
                          student.name ||
                          "Unnamed Student";

                        return (
                          <TableRow key={student._id}>
                            <TableCell className="font-medium">
                              {studentName}
                            </TableCell>
                            <TableCell>
                              {student.rollNumber || "Not set"}
                            </TableCell>
                            <TableCell>{student.email || "Not set"}</TableCell>
                            <TableCell>
                              {student.department || "Not assigned"}
                            </TableCell>
                            <TableCell>
                              {student.yearOfStudy
                                ? `Year ${student.yearOfStudy}`
                                : "Not set"}
                            </TableCell>
                            <TableCell>
                              {student.semester
                                ? `Sem ${student.semester}`
                                : "Not set"}
                            </TableCell>
                            <TableCell>
                              {student.isDelete === true ? (
                                <span className="text-red-500">Inactive</span>
                              ) : (
                                <span className="text-green-500">Active</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewStudentDetails(student)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {filteredStudents.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No student details found
                  </p>
                )}

                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Prev
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={
                      currentPage * itemsPerPage >= filteredStudents.length
                    }
                  >
                    Next
                  </Button>
                </div>

                {selectedStudentDetails && (
                  <div className="mt-6 rounded-xl border bg-white p-4">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {[selectedStudentDetails.firstName, selectedStudentDetails.lastName]
                            .filter(Boolean)
                            .join(" ") ||
                            selectedStudentDetails.name ||
                            "Student Details"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Roll No:{" "}
                          {selectedStudentDetails.rollNumber || "Not set"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={closeSelectedStudentDetails}
                      >
                        Close
                      </Button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-4">
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">
                          10th Mark
                        </p>
                        <p className="text-xl font-semibold">
                          {selectedStudentDetails.tenthMarkPercentage ?? 0}%
                        </p>
                      </div>
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">
                          12th Mark
                        </p>
                        <p className="text-xl font-semibold">
                          {selectedStudentDetails.twelfthMarkPercentage ?? 0}%
                        </p>
                      </div>
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">
                          UG Mark
                        </p>
                        <p className="text-xl font-semibold">
                          {selectedStudentDetails.ugMarkPercentage ?? 0}%
                        </p>
                      </div>
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">
                          Attendance
                        </p>
                        <p className="text-xl font-semibold">
                          {studentDetailsLoading
                            ? "Loading"
                            : `${selectedStudentAttendance?.stats?.attendancePercentage ?? 0}%`}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">
                          Internal 1
                        </p>
                        <p className="text-lg font-semibold">
                          {selectedStudentDetails.internalOneMark ?? "Not set"}
                        </p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">
                          Internal 2
                        </p>
                        <p className="text-lg font-semibold">
                          {selectedStudentDetails.internalTwoMark ?? "Not set"}
                        </p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">
                          Internal 3
                        </p>
                        <p className="text-lg font-semibold">
                          {selectedStudentDetails.internalThreeMark ??
                            "Not set"}
                        </p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">
                          Semester Mark
                        </p>
                        <p className="text-lg font-semibold">
                          {selectedStudentDetails.semesterMark ?? "Not set"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() =>
                          setShowStudentSubjectMarks((current) => !current)
                        }
                      >
                        <BookOpenCheck size={16} />
                        {showStudentSubjectMarks
                          ? "Hide Subject Marks"
                          : "View Subject Marks"}
                      </Button>
                    </div>

                    {showStudentSubjectMarks && (
                      <div className="mt-4 rounded-lg border">
                        <div className="flex flex-col gap-3 border-b bg-muted/30 px-3 py-2 md:flex-row md:items-center md:justify-between">
                          <p className="font-semibold">Subject Wise Marks</p>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant={
                                selectedStudentMarksSemester === "all"
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() =>
                                setSelectedStudentMarksSemester("all")
                              }
                            >
                              All Semesters
                            </Button>
                            {selectedStudentMarksSemesters.map((semester) => (
                              <Button
                                key={semester}
                                type="button"
                                size="sm"
                                variant={
                                  selectedStudentMarksSemester === semester
                                    ? "default"
                                    : "outline"
                                }
                                onClick={() =>
                                  setSelectedStudentMarksSemester(semester)
                                }
                              >
                                {formatSemesterLabel(
                                  semester === "not-set" ? "" : semester,
                                )}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Semester</TableHead>
                                <TableHead>Subject Name</TableHead>
                                <TableHead>Internal 1</TableHead>
                                <TableHead>Internal 2</TableHead>
                                <TableHead>Internal 3</TableHead>
                                <TableHead>Semester Mark</TableHead>
                                <TableHead>Total Mark</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredStudentSubjectMarks.map((mark, index) => (
                                <TableRow
                                  key={`${mark.semester || "sem"}-${mark.subject || "marks"}-${index}`}
                                >
                                  <TableCell>
                                    {formatSemesterLabel(mark.semester)}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {mark.subject ||
                                      mark.subjectName ||
                                      "Not assigned"}
                                  </TableCell>
                                  <TableCell>
                                    {formatMarkValue(mark.internalOneMark)}
                                  </TableCell>
                                  <TableCell>
                                    {formatMarkValue(mark.internalTwoMark)}
                                  </TableCell>
                                  <TableCell>
                                    {formatMarkValue(mark.internalThreeMark)}
                                  </TableCell>
                                  <TableCell>
                                    {formatMarkValue(mark.semesterMark)}
                                  </TableCell>
                                  <TableCell className="font-semibold">
                                    {getTotalMark(mark)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">
                          Total Attendance
                        </p>
                        <p className="text-lg font-semibold">
                          {studentDetailsLoading
                            ? "Loading"
                            : selectedStudentAttendance?.stats?.total ?? 0}
                        </p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">
                          Present
                        </p>
                        <p className="text-lg font-semibold text-green-600">
                          {studentDetailsLoading
                            ? "Loading"
                            : selectedStudentAttendance?.stats?.present ?? 0}
                        </p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">Absent</p>
                        <p className="text-lg font-semibold text-red-600">
                          {studentDetailsLoading
                            ? "Loading"
                            : selectedStudentAttendance?.stats?.absent ?? 0}
                        </p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-muted-foreground">Leave</p>
                        <p className="text-lg font-semibold">
                          {studentDetailsLoading
                            ? "Loading"
                            : selectedStudentAttendance?.stats?.leave ?? 0}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg border">
                      <div className="border-b bg-muted/30 px-3 py-2">
                        <p className="font-semibold">
                          Subject Wise Attendance
                        </p>
                      </div>
                      {studentDetailsLoading ? (
                        <p className="p-3 text-sm text-muted-foreground">
                          Loading subject attendance...
                        </p>
                      ) : selectedStudentAttendance?.subjectWiseAttendance
                          ?.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Subject</TableHead>
                              <TableHead>Total</TableHead>
                              <TableHead>Present</TableHead>
                              <TableHead>Absent</TableHead>
                              <TableHead>Leave</TableHead>
                              <TableHead>Attendance</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedStudentAttendance.subjectWiseAttendance.map(
                              (subjectAttendance) => (
                                <TableRow key={subjectAttendance.subject}>
                                  <TableCell className="font-medium">
                                    {subjectAttendance.subject}
                                  </TableCell>
                                  <TableCell>
                                    {subjectAttendance.total}
                                  </TableCell>
                                  <TableCell className="text-green-600">
                                    {subjectAttendance.present}
                                  </TableCell>
                                  <TableCell className="text-red-600">
                                    {subjectAttendance.absent}
                                  </TableCell>
                                  <TableCell>
                                    {subjectAttendance.leave}
                                  </TableCell>
                                  <TableCell className="font-semibold">
                                    {subjectAttendance.attendancePercentage}%
                                  </TableCell>
                                </TableRow>
                              ),
                            )}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="p-3 text-sm text-muted-foreground">
                          No subject attendance found.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {showSubjectAssign && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
            <Card className="w-full max-w-3xl relative shadow-xl rounded-2xl max-h-[90vh] overflow-auto">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={() => setShowSubjectAssign(false)}
              >
                <X size={18} />
              </Button>

              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Assign Subject to Staff
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select
                      value={selectedAssignYear}
                      onValueChange={(value) => {
                        setSelectedAssignYear(value);
                        setSelectedSubjectId("");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjectAssignYears.map((year) => (
                          <SelectItem key={year} value={year}>
                            Year {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Semester</Label>
                    <Select
                      value={selectedAssignSemester}
                      onValueChange={(value) => {
                        setSelectedAssignSemester(value);
                        setSelectedSubjectId("");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjectAssignSemesters.map((semester) => (
                          <SelectItem key={semester} value={semester}>
                            Sem {semester}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Staff</Label>
                    <Select
                      value={selectedStaffId}
                      onValueChange={(value) => {
                        setSelectedStaffId(value);
                        setSelectedSubjectId("");
                        setEditingAssignedSubject(null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffUsers
                          .filter((staff) => staff.isDelete === false)
                          .map((staff) => (
                            <SelectItem key={staff._id} value={staff._id}>
                              {staff.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {selectedStaffId && (
                      <p
                        className={`text-xs ${
                          selectedStaffAtSubjectLimit
                            ? "text-red-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        {selectedAssignYear && selectedAssignSemester
                          ? `${selectedStaffSubjectCount}/2 subjects assigned for Year ${selectedAssignYear}, Sem ${selectedAssignSemester}`
                          : "Select year and semester to view subject count"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-slate-900">
                      Subject
                    </h3>
                    <Select
                      value={selectedSubjectId}
                      onValueChange={setSelectedSubjectId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects
                          .filter(
                            (subject) =>
                              subject.isDelete === false &&
                              isSubjectAvailableForAssignment(subject),
                          )
                          .map((subject) => (
                            <SelectItem key={subject._id} value={subject._id}>
                              {subject.subjectName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {selectedAssignYear && selectedAssignSemester ? (
                      <p className="text-xs text-muted-foreground">
                        Showing unassigned subjects for Year{" "}
                        {selectedAssignYear}, Sem {selectedAssignSemester}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Select year and semester to view available subjects
                      </p>
                    )}
                  </div>
                </div>

                {selectedStaffAtSubjectLimit && (
                  <p className="text-sm text-red-500">
                    A staff member can handle a maximum of 2 subjects per year
                    and semester.
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleAssignSubject} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingAssignedSubject ? "Updating" : "Assigning"}
                      </>
                    ) : editingAssignedSubject ? (
                      "Update Subject"
                    ) : (
                      "Assign Subject"
                    )}
                  </Button>
                  {editingAssignedSubject && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearAssignedSubjectEdit}
                      disabled={loading}
                    >
                      Cancel Update
                    </Button>
                  )}
                </div>

                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Assigned Subjects</TableHead>
                        <TableHead>Edit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {staffUsers.flatMap((staff) => {
                        const assignedSubjects =
                          staff.assignedSubjects?.filter(Boolean) || [];

                        if (assignedSubjects.length === 0) {
                          return (
                            <TableRow key={staff._id}>
                              <TableCell className="font-medium">
                                {staff.name}
                              </TableCell>
                              <TableCell>{staff.email}</TableCell>
                              <TableCell>Not assigned</TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground">
                                  -
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        }

                        return assignedSubjects.map((assignment, index) => {
                          const subjectName =
                            assignment.subject?.subjectName ||
                            assignment.subjectName ||
                            "Unnamed Subject";
                          const year = assignment.yearOfStudy
                            ? `Year ${assignment.yearOfStudy}`
                            : "Year not set";
                          const semester = assignment.semester
                            ? `Sem ${assignment.semester}`
                            : "Sem not set";

                          return (
                            <TableRow
                              key={`${staff._id}-${subjectName}-${index}`}
                            >
                              <TableCell className="font-medium">
                                {staff.name}
                              </TableCell>
                              <TableCell>{staff.email}</TableCell>
                              <TableCell>
                                <div className="leading-tight">
                                  <p className="font-semibold text-slate-900">
                                    {subjectName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {year}, {semester}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleEditAssignedSubject(
                                      staff,
                                      assignment,
                                    )
                                  }
                                >
                                  Edit
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        });
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showSubjectsList && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
            <Card className="w-full max-w-3xl relative shadow-xl rounded-2xl">
              {/* CLOSE BUTTON */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={() => setShowSubjectsList(false)}
              >
                <X size={18} />
              </Button>

              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  All Subjects
                </CardTitle>
              </CardHeader>

              <CardContent>
                {/* SEARCH */}
                <div className="flex gap-3 mb-4 flex-wrap">
                  <Input
                    placeholder="Search subject..."
                    className="flex-1"
                    onChange={(e) => setSearch(e.target.value)}
                  />

                  {/* STATUS FILTER */}
                  <Select
                    value={subjectStatusFilter}
                    onValueChange={setSubjectStatusFilter}
                  >
                    <SelectTrigger className="w-35">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* TABLE */}
                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject Name</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {paginate(
                        subjects
                          .filter((s) =>
                            s.subjectName
                              ?.toLowerCase()
                              .includes(search.toLowerCase()),
                          )
                          .filter((s) =>
                            subjectStatusFilter === "all"
                              ? true
                              : subjectStatusFilter === "active"
                                ? s.isDelete === false
                                : s.isDelete === true,
                          ),
                      ).map((s, i) => (
                        <TableRow key={s._id || i}>
                          <TableCell className="font-medium">
                            {s.subjectName}
                          </TableCell>
                          <TableCell>
                            {s.yearOfStudy ? `Year ${s.yearOfStudy}` : "-"}
                          </TableCell>
                          <TableCell>
                            {s.semester ? `Sem ${s.semester}` : "-"}
                          </TableCell>
                          <TableCell>{s.creatorName || "Unknown"}</TableCell>
                          <TableCell>
                            {s.isDelete === true ? (
                              <span className="text-red-500">Inactive</span>
                            ) : (
                              <span className="text-green-500">Active</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {s.isDelete === false ? (
                              /* DELETE - for active subjects */
                              <Button
                                size="icon"
                                variant="destructive"
                                onClick={() => handleDeleteSubject(s._id)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            ) : (
                              /* RESTORE - for deleted subjects */
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleRestoreSubject(s._id)}
                              >
                                <RotateCcw size={16} />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* PAGINATION */}
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Prev
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={
                      currentPage * itemsPerPage >=
                      subjects
                        .filter((s) =>
                          s.subjectName
                            ?.toLowerCase()
                            .includes(search.toLowerCase()),
                        )
                        .filter((s) =>
                          subjectStatusFilter === "all"
                            ? true
                            : subjectStatusFilter === "active"
                              ? s.isDelete === false
                              : s.isDelete === true,
                        ).length
                    }
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showTimetableList && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-2 z-50">
            <Card className="w-full h-full max-w-none relative shadow-xl rounded-none max-h-none overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 z-10"
                onClick={() => setShowTimetableList(false)}
              >
                <X size={18} />
              </Button>

              <TimetableList onClose={() => setShowTimetableList(false)} />
            </Card>
          </div>
        )}

        {/* PROMOTE COORDINATOR CONFIRMATION DIALOG */}
        {staffToPromote && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-center">
                  Promote to Coordinator
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  Are you sure you want to promote {staffToPromote.name} to
                  coordinator?
                </p>
                <div className="space-y-2 text-left mb-6">
                  <Label>Coordinator Year</Label>
                  <Select
                    value={selectedCoordinatorYear}
                    onValueChange={setSelectedCoordinatorYear}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectAssignYears.map((year) => {
                        const existingCoordinator = staffUsers.find(
                          (staff) =>
                            staff.role === "coordinator" &&
                            staff.coordinatorYear === year &&
                            staff.isDelete === false,
                        );

                        return (
                          <SelectItem
                            key={year}
                            value={year}
                            disabled={Boolean(existingCoordinator)}
                          >
                            Year {year}
                            {existingCoordinator
                              ? ` - ${existingCoordinator.name}`
                              : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStaffToPromote(null);
                      setSelectedCoordinatorYear("");
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    onClick={confirmPromoteToCoordinator}
                    disabled={loading || !selectedCoordinatorYear}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Promoting...
                      </>
                    ) : (
                      "Promote"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* DEMOTE COORDINATOR CONFIRMATION DIALOG */}
        {staffToDemote && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-center">
                  Demote Coordinator
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  Are you sure you want to demote {staffToDemote.name} to staff?
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setStaffToDemote(null)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    onClick={confirmDemoteCoordinator}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Demoting...
                      </>
                    ) : (
                      "Demote"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* DELETE CONFIRMATION DIALOG */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-center">
                  Delete User
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  Are you sure you want to delete this user? This action cannot
                  be undone.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setUserIdToDelete(null);
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmDelete}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* RESTORE CONFIRMATION DIALOG */}
        {showRestoreConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-center">
                  Restore User
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  Are you sure you want to restore this user to active status?
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRestoreConfirm(false);
                      setUserIdToRestore(null);
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    onClick={confirmRestore}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Restoring...
                      </>
                    ) : (
                      "Restore"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SUBJECT DELETE CONFIRMATION DIALOG */}
        {showSubjectDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-center">
                  Delete Subject
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  Are you sure you want to delete this subject? This action
                  cannot be undone.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSubjectDeleteConfirm(false);
                      setSubjectIdToDelete(null);
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmDeleteSubject}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SUBJECT RESTORE CONFIRMATION DIALOG */}
        {showSubjectRestoreConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-center">
                  Restore Subject
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  Are you sure you want to restore this subject to active
                  status?
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSubjectRestoreConfirm(false);
                      setSubjectIdToRestore(null);
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    onClick={confirmRestoreSubject}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Restoring...
                      </>
                    ) : (
                      "Restore"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
