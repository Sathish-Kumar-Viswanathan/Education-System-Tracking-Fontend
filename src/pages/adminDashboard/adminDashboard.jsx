import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "sonner";
import { Plus, Calendar, Users, X, LogOut } from "lucide-react";
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
  softDeleteUser,
  restoreUser,
  updateUser,
} from "../../services/users/users.axios";
import {
  getAllSubjects,
  createSubject,
  deleteSubject,
  restoreSubject,
  updateSubject,
} from "../../services/subjects/subjects.axios";

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
    role: z.enum(["student", "staff", "admin"], {
      required_error: "Role is required",
    }),
    rollNumber: z.string().optional(),
    yearOfStudy: z.string().optional(),
    department: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.role === "student" && !data.rollNumber?.trim()) {
        return false;
      }
      if (data.role === "student" && !data.yearOfStudy?.trim()) {
        return false;
      }
      return true;
    },
    {
      message: "This field is required for students",
      path: ["yearOfStudy"],
    },
  );

export default function AdminDashboard() {
  // ⭐ HOOKS
  const navigate = useNavigate();

  // ⭐ STATE
  const [showUserForm, setShowUserForm] = useState(false);
  const [showTimetableForm, setShowTimetableForm] = useState(false);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [subjectName, setSubjectName] = useState("");
  const [showUsersList, setShowUsersList] = useState(false);
  const [showSubjectsList, setShowSubjectsList] = useState(false);
  const [showTimetableList, setShowTimetableList] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectStatusFilter, setSubjectStatusFilter] = useState("all");
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
  const [editingUser, setEditingUser] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);

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
    if (!subjectName) return;

    try {
      // 🔐 Get token
      const token = localStorage.getItem("token");
      console.log(token);

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
        createdBy: userId,
      };

      // 🗂️ Update state
      setSubjects([...subjects, newSubject]);

      // 📦 Call the API to create the subject
      const addSubject = await createSubject(newSubject);
      if (addSubject) {
        toast.success("Subject Added");
        setSubjectName("");
        setShowSubjectForm(false);
      } else {
        toast.error("Failed to add subject");
      }
    } catch (error) {
      console.error(error);
      toast.error("Invalid token");
    }
  };

  const handleOpenUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
      setShowUsersList(true);
    } catch (err) {
      toast.error("Failed to fetch users");
    }
  };

  const handleOpenSubjects = async () => {
    try {
      const data = await getAllSubjects();
      console.log(data);

      setSubjects(data);
      setShowSubjectsList(true);
    } catch (err) {
      toast.error("Failed to fetch subjects");
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/");
  };

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
                        setValue("role", value);
                        // Auto-set department to MCA for students
                        if (value === "student") {
                          setValue("department", "MCA");
                        } else {
                          setValue("department", "");
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

                  {/* Department - Only for Students */}
                  {watch("role") === "student" && (
                    <div className="space-y-1">
                      <Label>Department *</Label>
                      <Select
                        value={watch("department") || ""}
                        onValueChange={(value) => setValue("department", value)}
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
                onClick={() => setShowSubjectForm(false)}
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

                <Button
                  className="w-full"
                  onClick={handleCreateSubject}
                  disabled={!isValid}
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
