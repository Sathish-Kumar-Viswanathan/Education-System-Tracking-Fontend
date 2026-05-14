import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import { getAllStudents } from "../../services/students/students.axios";
import { getAllSubjects } from "../../services/subjects/subjects.axios";
import { createBatchAttendance } from "../../services/attendance/attendance.axios";

export default function AttendanceMark({ isOpen, onClose }) {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [staffId, setStaffId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [studentAttendanceData, setStudentAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);

  const yearOptions = ["Year 1", "Year 2"];
  const semesterOptions = ["1", "2", "3", "4"];

  // Get staff ID from token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setStaffId(decoded.id);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  // Fetch all students once on mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const data = await getAllStudents();
        const studentList = Array.isArray(data) ? data : data?.students || [];

        const activeStudents = studentList.filter((s) => !s.isDelete);
        setStudents(activeStudents);

        // Extract unique departments
        const uniqueDepts = [
          ...new Set(activeStudents.map((s) => s.department).filter(Boolean)),
        ];

        setDepartments(uniqueDepts);
      } catch (error) {
        toast.error("Failed to fetch students");
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen]);

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await getAllSubjects();
        const subjectList = Array.isArray(data) ? data : data?.subjects || [];
        setSubjects(subjectList.filter((s) => !s.isDelete));
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    };

    if (isOpen) {
      fetchSubjects();
    }
  }, [isOpen]);

  // Filter students based on selected department and year
  const filteredStudents = students.filter((student) => {
    if (selectedDepartment && student.department !== selectedDepartment) {
      return false;
    }
    if (selectedYear && student.yearOfStudy !== selectedYear) {
      return false;
    }
    return true;
  });

  const markAttendance = (studentId, status) => {
    setStudentAttendanceData((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const submitAttendance = async () => {
    // Validation
    if (!selectedSubject) {
      toast.error("Please select a subject");
      return;
    }

    if (!selectedSemester) {
      toast.error("Please select a semester");
      return;
    }

    if (!selectedDepartment) {
      toast.error("Please select a department");
      return;
    }

    if (!selectedYear) {
      toast.error("Please select a year");
      return;
    }

    if (!selectedPeriod) {
      toast.error("Please select a period");
      return;
    }

    const notMarked = filteredStudents.some(
      (s) => !studentAttendanceData[s._id],
    );

    if (notMarked) {
      toast.error("Please mark attendance for all students");
      return;
    }

    if (!staffId) {
      toast.error("Staff information not found");
      return;
    }

    try {
      setSubmitting(true);

      // Create batch attendance records
      const attendanceRecords = filteredStudents.map((student) => ({
        studentId: student._id,
        staffId: staffId,
        subject: selectedSubject,
        semester: selectedSemester,
        date: new Date(selectedDate),
        period: Number(selectedPeriod),
        status: studentAttendanceData[student._id],
        remarks: "",
      }));

      await createBatchAttendance(attendanceRecords);

      toast.success(
        `Attendance submitted for ${filteredStudents.length} students`,
      );

      // Reset form
      setStudentAttendanceData({});
      setSelectedSubject("");
      setSelectedSemester("");
      setSelectedDepartment("");
      setSelectedYear("");
      setSelectedPeriod("");
      setSelectedDate(new Date().toISOString().split("T")[0]);

      onClose();
    } catch (error) {
      console.error("Error submitting attendance:", error);
      toast.error("Failed to submit attendance");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto">
      <Card className="w-full max-w-4xl shadow-2xl relative my-8">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 hover:bg-red-100"
          onClick={onClose}
        >
          <X size={18} />
        </Button>

        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Mark Attendance</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select filters and mark attendance for students
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Filters Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 p-4 bg-muted/50 rounded-lg">
            {/* Semester Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Semester *</label>
              <Select
                value={selectedSemester}
                onValueChange={setSelectedSemester}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sem" />
                </SelectTrigger>
                <SelectContent>
                  {semesterOptions.map((semester) => (
                    <SelectItem key={semester} value={semester}>
                      Sem {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Subject Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject *</label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.length > 0 ? (
                    subjects.map((subject) => (
                      <SelectItem key={subject._id} value={subject._id}>
                        {subject.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      No subjects available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Period Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Period *</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7].map((period) => (
                    <SelectItem key={period} value={String(period)}>
                      Period {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Department *</label>
              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dept" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Year *</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Info */}
            <div className="flex items-end">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle size={16} />
                <span>
                  {filteredStudents.length} student
                  {filteredStudents.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Students List with Side-by-Side Layout */}
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No students found. Please select department and year.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {filteredStudents.map((student) => (
                <div
                  key={student._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  {/* Left Side - Student Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Roll: {student.rollNumber}
                    </p>
                  </div>

                  {/* Right Side - Attendance Radio Buttons */}
                  <div className="flex items-center gap-6 ml-4">
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-green-50 px-3 py-1 rounded">
                      <input
                        type="radio"
                        name={`attendance-${student._id}`}
                        value="present"
                        checked={
                          studentAttendanceData[student._id] === "present"
                        }
                        onChange={() => markAttendance(student._id, "present")}
                        className="w-4 h-4 cursor-pointer accent-green-600"
                      />
                      <span className="text-sm font-medium text-green-700">
                        Present
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer hover:bg-red-50 px-3 py-1 rounded">
                      <input
                        type="radio"
                        name={`attendance-${student._id}`}
                        value="absent"
                        checked={
                          studentAttendanceData[student._id] === "absent"
                        }
                        onChange={() => markAttendance(student._id, "absent")}
                        className="w-4 h-4 cursor-pointer accent-red-600"
                      />
                      <span className="text-sm font-medium text-red-700">
                        Absent
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 px-3 py-1 rounded">
                      <input
                        type="radio"
                        name={`attendance-${student._id}`}
                        value="leave"
                        checked={studentAttendanceData[student._id] === "leave"}
                        onChange={() => markAttendance(student._id, "leave")}
                        className="w-4 h-4 cursor-pointer accent-blue-600"
                      />
                      <span className="text-sm font-medium text-blue-700">
                        OD
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={submitAttendance}
              disabled={submitting || loading || filteredStudents.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? "Submitting..." : "Submit Attendance"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
