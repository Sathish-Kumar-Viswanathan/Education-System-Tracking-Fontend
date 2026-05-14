import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  BookOpen,
  Bell,
  User,
  ClipboardList,
  BarChart3,
  X,
  LogOut,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast, Toaster } from "sonner";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  getStudentProfileByUserId,
  updateStudentProfileByUserId,
} from "../../services/students/students.axios";
import { getStudentDashboardAttendance } from "../../services/attendance/attendance.axios";
import { getStudentCoursesByUserId } from "../../services/courses/courses.axios";
import {
  getAssignmentFileUrl,
  getStudentAssignmentsByUserId,
  submitAssignment,
} from "../../services/assignments/assignments.axios";
import { getStudentNotificationsByUserId } from "../../services/notifications/notifications.axios";

export default function StudentDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token"); // remove auth token
    navigate("/"); // redirect to login page
  };

  const [showProfile, setShowProfile] = useState(false);
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showCourses, setShowCourses] = useState(false);
  const [showAssignments, setShowAssignments] = useState(false);
  const [showMarks, setShowMarks] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedMarksSemester, setSelectedMarksSemester] = useState("Sem 1");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileUpdateRequest, setProfileUpdateRequest] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    leave: 0,
    attendancePercentage: 0,
  });
  const [subjectWiseAttendance, setSubjectWiseAttendance] = useState([]);
  const [courses, setCourses] = useState([]);
  const [coursesCount, setCoursesCount] = useState(0);
  const [assignments, setAssignments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [assignmentFiles, setAssignmentFiles] = useState({});
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState(null);

  // Profile form state
  const [profile, setProfile] = useState({
    // Personal
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    phoneNumber: "",
    email: "",
    address: "",
    // Family
    fatherName: "",
    motherName: "",
    fatherPhone: "",
    motherPhone: "",
    fatherOccupation: "",
    motherOccupation: "",
    // Education
    tenthMarkPercentage: "",
    tenthMarksheetUrl: "",
    tenthMarksheetFileName: "",
    twelfthMarkPercentage: "",
    twelfthMarksheetUrl: "",
    twelfthMarksheetFileName: "",
    ugMarkPercentage: "",
    ugMarksheetUrl: "",
    ugMarksheetFileName: "",
    internalOneMark: null,
    internalTwoMark: null,
    internalThreeMark: null,
    semesterMark: null,
    academicMarks: [],
  });

  // Extract userId from token on component mount
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = jwtDecode(token);
        setUserId(decoded.id);
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      toast.error("Session error, please login again");
    }
  }, []);

  // Fetch student profile when profile modal opens
  useEffect(() => {
    if (showProfile && userId) {
      fetchStudentProfile();
    }
  }, [showProfile, userId]);

  useEffect(() => {
    if (userId) {
      fetchStudentProfile();
      fetchAttendanceStats();
      fetchCourses();
      fetchAssignments();
      fetchNotifications();
    }
  }, [userId]);

  const fetchStudentProfile = async () => {
    try {
      setProfileLoading(true);
      const response = await getStudentProfileByUserId(userId);
      if (response.profile) {
        setProfile(response.profile);
      }
      setProfileUpdateRequest(response.profileUpdateRequest || null);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      setAttendanceLoading(true);
      const response = await getStudentDashboardAttendance(userId);
      setAttendanceStats(
        response.stats || {
          total: 0,
          present: 0,
          absent: 0,
          leave: 0,
          attendancePercentage: 0,
        },
      );
      setSubjectWiseAttendance(response.subjectWiseAttendance || []);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      const response = await getStudentCoursesByUserId(userId);
      setCourses(response.courses || []);
      setCoursesCount(response.count || 0);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCourses([]);
      setCoursesCount(0);
    } finally {
      setCoursesLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      setAssignmentsLoading(true);
      const response = await getStudentAssignmentsByUserId(userId);
      setAssignments(response.assignments || []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const response = await getStudentNotificationsByUserId(userId);
      setNotifications(response.notifications || []);
      setUnreadNotificationsCount(response.unreadCount || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
      setUnreadNotificationsCount(0);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMarksheetFileChange = async (
    urlField,
    fileNameField,
    file,
  ) => {
    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      toast.error("Please attach a PDF marksheet");
      return;
    }

    const fileDataUrl = await readFileAsDataUrl(file);

    setProfile((prev) => ({
      ...prev,
      [urlField]: fileDataUrl,
      [fileNameField]: file.name,
    }));
  };

  const handleProfileSubmit = async () => {
    const requiredMarksheets = [
      {
        markField: "tenthMarkPercentage",
        fileField: "tenthMarksheetUrl",
        label: "10th",
      },
      {
        markField: "twelfthMarkPercentage",
        fileField: "twelfthMarksheetUrl",
        label: "12th",
      },
      {
        markField: "ugMarkPercentage",
        fileField: "ugMarksheetUrl",
        label: "UG",
      },
    ];
    const missingMarksheet = requiredMarksheets.find(
      ({ markField, fileField }) =>
        Number(profile[markField]) > 0 && !profile[fileField],
    );

    if (missingMarksheet) {
      toast.error(`Please attach the ${missingMarksheet.label} marksheet PDF`);
      return;
    }

    try {
      setLoading(true);
      const response = await updateStudentProfileByUserId(userId, profile);
      setProfileUpdateRequest(response.request || null);
      toast.success(
        response?.message || "Profile update request sent to admin",
      );
      setShowProfile(false);
      setProfileEditMode(false);
      setStep(1);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentFileChange = (assignmentId, file) => {
    if (!file) {
      setAssignmentFiles((prev) => {
        const updatedFiles = { ...prev };
        delete updatedFiles[assignmentId];
        return updatedFiles;
      });
      return;
    }

    if (file.type !== "application/pdf") {
      toast.error("Please attach a PDF file");
      return;
    }

    setAssignmentFiles((prev) => ({
      ...prev,
      [assignmentId]: file,
    }));
  };

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleAssignmentSubmit = async (assignmentId) => {
    const file = assignmentFiles[assignmentId];

    if (!file) {
      toast.error("Please attach your assignment PDF");
      return;
    }

    try {
      setSubmittingAssignmentId(assignmentId);
      const submissionUrl = await readFileAsDataUrl(file);

      await submitAssignment({
        assignmentId,
        userId,
        submissionUrl,
        submissionFileName: file.name,
        submissionMimeType: file.type,
      });

      toast.success("Assignment submitted successfully");
      setAssignmentFiles((prev) => {
        const updatedFiles = { ...prev };
        delete updatedFiles[assignmentId];
        return updatedFiles;
      });
      await fetchAssignments();
    } catch (error) {
      console.error("Error submitting assignment:", error);
      toast.error(
        error?.response?.data?.message || "Failed to submit assignment",
      );
    } finally {
      setSubmittingAssignmentId(null);
    }
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));
  const profileDetails = [
    ["First Name", profile.firstName],
    ["Last Name", profile.lastName],
    [
      "Date of Birth",
      profile.dateOfBirth
        ? new Date(profile.dateOfBirth).toLocaleDateString()
        : "",
    ],
    ["Phone Number", profile.phoneNumber],
    ["Email", profile.email],
    ["Address", profile.address],
    ["Father Name", profile.fatherName],
    ["Father Phone", profile.fatherPhone],
    ["Father Occupation", profile.fatherOccupation],
    ["Mother Name", profile.motherName],
    ["Mother Phone", profile.motherPhone],
    ["Mother Occupation", profile.motherOccupation],
    ["10th Percentage", profile.tenthMarkPercentage],
    ["10th Marksheet", profile.tenthMarksheetUrl, "file"],
    ["12th Percentage", profile.twelfthMarkPercentage],
    ["12th Marksheet", profile.twelfthMarksheetUrl, "file"],
    ["UG Percentage", profile.ugMarkPercentage],
    ["UG Marksheet", profile.ugMarksheetUrl, "file"],
  ];
  const pendingAssignmentsCount = useMemo(
    () =>
      assignments.filter(
        (assignment) => assignment.submissionStatus === "pending",
      ).length,
    [assignments],
  );
  const assignmentMarks = useMemo(() => {
    const gradedAssignments = assignments
      .filter(
        (assignment) =>
          assignment.submission?.marks !== null &&
          assignment.submission?.marks !== undefined,
      )
      .sort((a, b) => {
        const firstDate = new Date(a.dueDate || a.createdAt || 0);
        const secondDate = new Date(b.dueDate || b.createdAt || 0);
        return firstDate - secondDate;
      });

    return [0, 1, 2].map((index) => {
      const assignment = gradedAssignments[index];

      return {
        label: `Assignment ${index + 1}`,
        title: assignment?.title || "",
        subject: assignment?.subject || "",
        marks: assignment?.submission?.marks ?? null,
      };
    });
  }, [assignments]);
  const internalMarkLabels = ["Internal 1", "Internal 2", "Internal 3"];
  const awardedAssignmentMarks = assignmentMarks.filter(
    (assignment) => assignment.marks !== null,
  ).length;
  const formatSemester = (semester) => {
    if (!semester) return "";

    const semesterText = String(semester).trim();

    if (!semesterText) return "";
    if (/^sem/i.test(semesterText)) return semesterText;

    return `Sem ${semesterText}`;
  };
  const normalizeSemester = (semester) =>
    formatSemester(semester).toLowerCase().replace(/\s+/g, " ").trim();
  const subjectWiseMarks = useMemo(() => {
    const semesterAcademicMarks = (profile.academicMarks || []).filter(
      (mark) =>
        normalizeSemester(mark.semester) ===
        normalizeSemester(selectedMarksSemester),
    );
    const subjectNames = [
      ...new Set(
        [
          ...assignments.map((assignment) => assignment.subject),
          ...semesterAcademicMarks.map((mark) => mark.subject),
        ].filter(Boolean),
      ),
    ];

    return (subjectNames.length > 0 ? subjectNames : ["Not set"]).map(
      (subject) => {
        const academicMark = semesterAcademicMarks.find(
          (mark) => mark.subject === subject,
        );
        const subjectAssignments = assignments
          .filter(
            (assignment) =>
              assignment.subject === subject &&
              assignment.submission?.marks !== null &&
              assignment.submission?.marks !== undefined,
          )
          .sort((a, b) => {
            const firstDate = new Date(a.dueDate || a.createdAt || 0);
            const secondDate = new Date(b.dueDate || b.createdAt || 0);
            return firstDate - secondDate;
          });

        return {
          subject,
          internalMarks: [
            ["Internal 1", academicMark?.internalOneMark],
            ["Internal 2", academicMark?.internalTwoMark],
            ["Internal 3", academicMark?.internalThreeMark],
          ],
          semesterMark: academicMark?.semesterMark,
          assignmentMarks: [0, 1, 2].map((index) => {
            const assignment = subjectAssignments[index];

            return {
              label: `Assignment ${index + 1}`,
              title: assignment?.title || "",
              marks: assignment?.submission?.marks ?? null,
            };
          }),
        };
      },
    );
  }, [assignments, profile.academicMarks, selectedMarksSemester]);

  const hasSubjectAcademicMarks = (profile.academicMarks || []).length > 0;
  const fallbackInternalMarks = [
    ["Internal 1", profile.internalOneMark],
    ["Internal 2", profile.internalTwoMark],
    ["Internal 3", profile.internalThreeMark],
  ];
  const fallbackSemesterMark = profile.semesterMark;
  const currentSemester =
    profile.semester || profile.currentSemester || profile.yearOfStudy || "";
  const currentSemesterLabel = formatSemester(currentSemester);
  const marksSemesters = useMemo(() => {
    const semesters = new Set(["Sem 1", "Sem 2"]);

    if (currentSemesterLabel) {
      semesters.add(currentSemesterLabel);
    }

    (profile.academicMarks || []).forEach((mark) => {
      const semesterLabel = formatSemester(mark.semester);

      if (semesterLabel) {
        semesters.add(semesterLabel);
      }
    });

    return Array.from(semesters).sort((a, b) => {
      const semesterA = Number(String(a).replace(/\D/g, ""));
      const semesterB = Number(String(b).replace(/\D/g, ""));

      if (Number.isNaN(semesterA)) return 1;
      if (Number.isNaN(semesterB)) return -1;
      return semesterA - semesterB;
    });
  }, [currentSemesterLabel, profile.academicMarks]);
  useEffect(() => {
    if (currentSemesterLabel) {
      setSelectedMarksSemester(currentSemesterLabel);
    }
  }, [currentSemesterLabel]);
  const profileRequestStatus = profileUpdateRequest?.status || null;
  const hasPendingProfileRequest = profileRequestStatus === "pending";
  const profileStatusConfig = {
    pending: {
      label: "Pending Approval",
      title: "Profile Update Pending Approval",
      message:
        "Your profile update request is waiting for admin review. Changes will appear after approval.",
      className: "border-yellow-200 bg-yellow-50 text-yellow-800",
    },
    approved: {
      label: "Approved",
      title: "Profile Update Approved",
      message: "Your latest profile update request was approved.",
      className: "border-green-200 bg-green-50 text-green-800",
    },
    rejected: {
      label: "Rejected",
      title: "Profile Update Rejected",
      message:
        profileUpdateRequest?.rejectionReason ||
        "Your latest profile update request was rejected.",
      className: "border-red-200 bg-red-50 text-red-800",
    },
  };
  const profileStatus = profileStatusConfig[profileRequestStatus];
  const dailyAttendance = useMemo(() => {
    const groupedAttendance = {};

    subjectWiseAttendance.forEach((item) => {
      (item.periodWiseAttendance || []).forEach((periodItem, index) => {
        const rawDate = periodItem.date;
        const dateKey = rawDate
          ? new Date(rawDate).toISOString().split("T")[0]
          : "Date not set";
        const displayDate = rawDate
          ? new Date(rawDate).toLocaleDateString()
          : "Date not set";

        if (!groupedAttendance[dateKey]) {
          groupedAttendance[dateKey] = {
            dateKey,
            displayDate,
            records: [],
          };
        }

        groupedAttendance[dateKey].records.push({
          subject: item.subject,
          period: periodItem.period,
          status: periodItem.status || "absent",
          key: `${item.subject}-${dateKey}-${periodItem.period}-${index}`,
        });
      });
    });

    return Object.values(groupedAttendance).sort((a, b) => {
      if (a.dateKey === "Date not set") return 1;
      if (b.dateKey === "Date not set") return -1;
      return new Date(b.dateKey) - new Date(a.dateKey);
    });
  }, [subjectWiseAttendance]);

  return (
    <>
      <Toaster position="top-right" closeButton richColors />
      <div className="p-6 space-y-6 bg-muted/40 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome back 👋</p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => {
              setProfileEditMode(false);
              setStep(1);
              setShowProfile(!showProfile);
            }}
            className="flex items-center gap-2"
          >
            <User size={16} /> Profile
          </Button>

          <Button
            variant="destructive"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut size={16} /> Logout
          </Button>
        </div>
      </div>

      {/* Profile Stepper Form Popup */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[85vh] shadow-2xl relative flex flex-col">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 hover:text-red-500"
              onClick={() => {
                setShowProfile(false);
                setProfileEditMode(false);
                setStep(1);
              }}
            >
              <X size={18} />
            </Button>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3 pr-10">
                <CardTitle>
                  {profileEditMode
                    ? "Update Profile"
                    : "Student Basic Details"}
                </CardTitle>
                {profileStatus && (
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${profileStatus.className}`}
                  >
                    {profileStatus.label}
                  </span>
                )}
              </div>
              {profileEditMode && (
              <div className="flex gap-2 text-sm mt-2">
                <div
                  className={step === 1 ? "font-bold" : "text-muted-foreground"}
                >
                  Step 1: Personal
                </div>
                <div>→</div>
                <div
                  className={step === 2 ? "font-bold" : "text-muted-foreground"}
                >
                  Step 2: Family
                </div>
                <div>→</div>
                <div
                  className={step === 3 ? "font-bold" : "text-muted-foreground"}
                >
                  Step 3: Education
                </div>
              </div>
              )}
            </CardHeader>

            <CardContent className="space-y-4 overflow-y-auto pr-6">
              {profileLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="animate-spin" size={30} />
                </div>
              ) : !profileEditMode ? (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {profileDetails.map(([label, value, type]) => (
                      <div key={label} className="rounded-lg border p-3">
                        <p className="text-xs font-medium text-muted-foreground">
                          {label}
                        </p>
                        {type === "file" && value ? (
                          <a
                            href={getAssignmentFileUrl(value)}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex font-medium text-blue-600 hover:underline"
                          >
                            View PDF
                          </a>
                        ) : (
                          <p className="mt-1 font-medium">
                            {value || "Not set"}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowProfile(false);
                        setProfileEditMode(false);
                        setStep(1);
                      }}
                    >
                      Close
                    </Button>
                    <Button
                      disabled={hasPendingProfileRequest}
                      onClick={() => {
                        setProfileEditMode(true);
                        setStep(1);
                      }}
                    >
                      {hasPendingProfileRequest
                        ? "Awaiting Approval"
                        : "Update Profile"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {step === 1 && (
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="First Name"
                        name="firstName"
                        value={profile.firstName}
                        onChange={handleProfileChange}
                      />
                      <Input
                        placeholder="Last Name"
                        name="lastName"
                        value={profile.lastName}
                        onChange={handleProfileChange}
                      />
                      <Input
                        type="date"
                        name="dateOfBirth"
                        value={profile.dateOfBirth ? profile.dateOfBirth.split("T")[0] : ""}
                        onChange={handleProfileChange}
                      />
                      <Input
                        placeholder="Phone Number"
                        name="phoneNumber"
                        value={profile.phoneNumber}
                        onChange={handleProfileChange}
                      />
                      <Input
                        placeholder="Email"
                        name="email"
                        type="email"
                        value={profile.email}
                        onChange={handleProfileChange}
                      />
                      <Input
                        placeholder="Address"
                        name="address"
                        value={profile.address}
                        onChange={handleProfileChange}
                      />
                    </div>
                  )}

                  {step === 2 && (
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="Father Name"
                        name="fatherName"
                        value={profile.fatherName}
                        onChange={handleProfileChange}
                      />
                      <Input
                        placeholder="Mother Name"
                        name="motherName"
                        value={profile.motherName}
                        onChange={handleProfileChange}
                      />
                      <Input
                        placeholder="Father Phone"
                        name="fatherPhone"
                        value={profile.fatherPhone}
                        onChange={handleProfileChange}
                      />
                      <Input
                        placeholder="Mother Phone"
                        name="motherPhone"
                        value={profile.motherPhone}
                        onChange={handleProfileChange}
                      />
                      <Input
                        placeholder="Father Occupation"
                        name="fatherOccupation"
                        value={profile.fatherOccupation}
                        onChange={handleProfileChange}
                      />
                      <Input
                        placeholder="Mother Occupation"
                        name="motherOccupation"
                        value={profile.motherOccupation}
                        onChange={handleProfileChange}
                      />
                    </div>
                  )}

                  {step === 3 && (
                    <div className="grid grid-cols-1 gap-4">
                      <div className="grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-2">
                        <Input
                          placeholder="10th Percentage"
                          name="tenthMarkPercentage"
                          type="number"
                          value={profile.tenthMarkPercentage}
                          onChange={handleProfileChange}
                        />
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={(e) =>
                              handleMarksheetFileChange(
                                "tenthMarksheetUrl",
                                "tenthMarksheetFileName",
                                e.target.files?.[0],
                              )
                            }
                          />
                          {profile.tenthMarksheetUrl && (
                            <a
                              href={getAssignmentFileUrl(
                                profile.tenthMarksheetUrl,
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-medium text-blue-600 hover:underline"
                            >
                              View 10th marksheet PDF
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-2">
                        <Input
                          placeholder="12th Percentage"
                          name="twelfthMarkPercentage"
                          type="number"
                          value={profile.twelfthMarkPercentage}
                          onChange={handleProfileChange}
                        />
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={(e) =>
                              handleMarksheetFileChange(
                                "twelfthMarksheetUrl",
                                "twelfthMarksheetFileName",
                                e.target.files?.[0],
                              )
                            }
                          />
                          {profile.twelfthMarksheetUrl && (
                            <a
                              href={getAssignmentFileUrl(
                                profile.twelfthMarksheetUrl,
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-medium text-blue-600 hover:underline"
                            >
                              View 12th marksheet PDF
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-2">
                        <Input
                          placeholder="UG Percentage"
                          name="ugMarkPercentage"
                          type="number"
                          value={profile.ugMarkPercentage}
                          onChange={handleProfileChange}
                        />
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={(e) =>
                              handleMarksheetFileChange(
                                "ugMarksheetUrl",
                                "ugMarksheetFileName",
                                e.target.files?.[0],
                              )
                            }
                          />
                          {profile.ugMarksheetUrl && (
                            <a
                              href={getAssignmentFileUrl(profile.ugMarksheetUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-medium text-blue-600 hover:underline"
                            >
                              View UG marksheet PDF
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setProfileEditMode(false);
                          setStep(1);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="outline"
                        onClick={prevStep}
                        disabled={step === 1}
                      >
                        Back
                      </Button>
                    </div>

                    {step < 3 ? (
                      <Button onClick={nextStep}>Next</Button>
                    ) : (
                      <Button
                        onClick={handleProfileSubmit}
                        disabled={loading || hasPendingProfileRequest}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 animate-spin" size={16} />
                            Submitting...
                          </>
                        ) : hasPendingProfileRequest ? (
                          "Awaiting Approval"
                        ) : (
                          "Submit"
                        )}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
          <button
            type="button"
            className="w-full text-left"
            onClick={() => setShowAttendance(true)}
          >
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Attendance</CardTitle>
            <ClipboardList size={18} />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {attendanceLoading
                ? "Loading..."
                : `${attendanceStats.attendancePercentage}%`}
            </p>
            {currentSemesterLabel && (
              <p className="text-xs font-medium text-muted-foreground">
                {currentSemesterLabel} attendance
              </p>
            )}
            <Progress
              value={attendanceStats.attendancePercentage}
              className="mt-2"
            />
          </CardContent>
          </button>
        </Card>

        <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
          <button
            type="button"
            className="w-full text-left"
            onClick={() => setShowCourses(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Courses</CardTitle>
              <BookOpen size={18} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {coursesLoading ? "Loading..." : coursesCount}
              </p>
              <p className="text-xs text-muted-foreground">Enrolled subjects</p>
            </CardContent>
          </button>
        </Card>

        <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
          <button
            type="button"
            className="w-full text-left"
            onClick={() => setShowAssignments(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Assignments</CardTitle>
              <ClipboardList size={18} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {assignmentsLoading ? "Loading..." : pendingAssignmentsCount}
              </p>
              <p className="text-xs text-muted-foreground">Pending tasks</p>
            </CardContent>
          </button>
        </Card>

        <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
          <button
            type="button"
            className="w-full text-left"
            onClick={() => setShowMarks(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Marks</CardTitle>
              <BarChart3 size={18} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {assignmentsLoading ? "Loading..." : awardedAssignmentMarks}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentSemesterLabel
                  ? `${currentSemesterLabel} marks`
                  : "Marks published"}
              </p>
            </CardContent>
          </button>
        </Card>

        <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
          <button
            type="button"
            className="w-full text-left"
            onClick={() => setShowNotifications(true)}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Notifications</CardTitle>
              <Bell size={18} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {notificationsLoading
                  ? "Loading..."
                  : unreadNotificationsCount + (profileStatus ? 1 : 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                {profileStatus ? profileStatus.label : "New updates"}
              </p>
            </CardContent>
          </button>
        </Card>
      </div>

      {showCourses && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-xl max-h-[85vh] shadow-2xl relative flex flex-col">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 hover:text-red-500"
              onClick={() => setShowCourses(false)}
            >
              <X size={18} />
            </Button>

            <CardHeader>
              <CardTitle>All Courses</CardTitle>
            </CardHeader>

            <CardContent className="overflow-hidden flex flex-col">
              <div className="overflow-y-auto pr-2 space-y-3 max-h-[60vh]">
                {coursesLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="animate-spin" size={30} />
                  </div>
                ) : courses.length > 0 ? (
                  courses.map((course, index) => (
                    <div
                      key={course.courseId || course.courseName || index}
                      className="flex items-center gap-3 rounded-lg border bg-background p-4"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                        <BookOpen size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {course.courseName || "Untitled Course"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Enrolled subject
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No courses found.
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => setShowCourses(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showAssignments && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[85vh] shadow-2xl relative flex flex-col">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 hover:text-red-500"
              onClick={() => setShowAssignments(false)}
            >
              <X size={18} />
            </Button>

            <CardHeader>
              <CardTitle>Assignments</CardTitle>
            </CardHeader>

            <CardContent className="overflow-hidden flex flex-col">
              <div className="overflow-y-auto pr-2 space-y-3 max-h-[60vh]">
                {assignmentsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="animate-spin" size={30} />
                  </div>
                ) : assignments.length > 0 ? (
                  assignments.map((assignment) => {
                    const dueDate = assignment.dueDate
                      ? new Date(assignment.dueDate).toLocaleDateString()
                      : "No due date";
                    const status = assignment.submissionStatus || "pending";
                    const statusClass =
                      status === "graded"
                        ? "bg-green-100 text-green-800"
                        : status === "submitted"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800";

                    return (
                      <div
                        key={assignment._id}
                        className="rounded-lg border bg-background p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="font-semibold">
                              {assignment.title}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {assignment.subject}
                            </p>
                            <p className="mt-2 line-clamp-2 text-sm">
                              {assignment.description}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize ${statusClass}`}
                          >
                            {status}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar size={15} />
                            <span>Due {dueDate}</span>
                          </div>
                          {assignment.submission?.marks !== null &&
                            assignment.submission?.marks !== undefined && (
                              <span className="font-medium text-foreground">
                                Marks: {assignment.submission.marks}
                              </span>
                            )}
                        </div>

                        {assignment.submission?.submissionUrl && (
                          <div className="mt-4">
                            <a
                              href={getAssignmentFileUrl(
                                assignment.submission.submissionUrl,
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-medium text-blue-600 hover:underline"
                            >
                              View submitted PDF
                            </a>
                          </div>
                        )}

                        {status !== "graded" && (
                          <div className="mt-4 flex flex-col gap-3 rounded-md bg-muted/40 p-3 sm:flex-row sm:items-center">
                            <Input
                              type="file"
                              accept="application/pdf,.pdf"
                              onChange={(e) =>
                                handleAssignmentFileChange(
                                  assignment._id,
                                  e.target.files?.[0],
                                )
                              }
                            />
                            <Button
                              className="shrink-0"
                              disabled={
                                submittingAssignmentId === assignment._id
                              }
                              onClick={() =>
                                handleAssignmentSubmit(assignment._id)
                              }
                            >
                              {submittingAssignmentId === assignment._id ? (
                                <>
                                  <Loader2
                                    className="mr-2 animate-spin"
                                    size={16}
                                  />
                                  Submitting...
                                </>
                              ) : assignment.isSubmitted ? (
                                "Resubmit PDF"
                              ) : (
                                "Submit PDF"
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No assignments found.
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAssignments(false)}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showMarks && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[85vh] shadow-2xl relative flex flex-col">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 hover:text-red-500"
              onClick={() => setShowMarks(false)}
            >
              <X size={18} />
            </Button>

            <CardHeader>
              <CardTitle>
                Marks{selectedMarksSemester ? ` - ${selectedMarksSemester}` : ""}
              </CardTitle>
            </CardHeader>

            <CardContent className="overflow-hidden flex flex-col">
              <div className="mb-4 flex flex-wrap gap-2">
                {marksSemesters.map((semester) => (
                  <Button
                    key={semester}
                    variant={
                      selectedMarksSemester === semester ? "default" : "outline"
                    }
                    type="button"
                    onClick={() => setSelectedMarksSemester(semester)}
                  >
                    {semester}
                  </Button>
                ))}
                {currentSemester && (
                  <span className="self-center text-xs text-muted-foreground">
                    Current: {currentSemesterLabel || currentSemester}
                  </span>
                )}
              </div>

              <div className="overflow-x-auto pr-2 max-h-[60vh]">
                <div className="min-w-[860px] rounded-lg border bg-background">
                  <div className="grid grid-cols-8 border-b bg-muted/40 text-center text-xs font-semibold text-muted-foreground">
                    <div className="border-r p-3 text-left">Subject</div>
                    {assignmentMarks.map((assignment) => (
                      <div key={assignment.label} className="p-3">
                        {assignment.label}
                      </div>
                    ))}
                    {internalMarkLabels.map((label) => (
                      <div key={label} className="p-3">
                        {label}
                      </div>
                    ))}
                    <div className="p-3">Semester</div>
                  </div>

                  {subjectWiseMarks.map((row) => (
                    <div
                      key={row.subject}
                      className="grid grid-cols-8 border-b text-center last:border-b-0"
                    >
                      <div className="min-h-24 border-r p-3 text-left">
                        <p className="font-semibold">{row.subject}</p>
                      </div>
                      {row.assignmentMarks.map((assignment) => (
                        <div
                          key={`${row.subject}-${assignment.label}`}
                          className="min-h-24 border-r p-3"
                        >
                          <p className="text-2xl font-bold">
                            {assignment.marks !== null
                              ? assignment.marks
                              : "-"}
                          </p>
                          <p className="mt-2 truncate text-xs text-muted-foreground">
                            {assignment.title || "Not graded"}
                          </p>
                        </div>
                      ))}
                      {(hasSubjectAcademicMarks
                        ? row.internalMarks
                        : fallbackInternalMarks
                      ).map(([label, value]) => (
                        <div
                          key={`${row.subject}-${label}`}
                          className="min-h-24 border-r p-3"
                        >
                          <p className="text-2xl font-bold">
                            {value !== null &&
                            value !== undefined &&
                            value !== ""
                              ? value
                              : "-"}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Internal mark
                          </p>
                        </div>
                      ))}
                      <div className="min-h-24 p-3">
                        <p className="text-2xl font-bold">
                          {(hasSubjectAcademicMarks
                            ? row.semesterMark
                            : fallbackSemesterMark) !== null &&
                          (hasSubjectAcademicMarks
                            ? row.semesterMark
                            : fallbackSemesterMark) !== undefined &&
                          (hasSubjectAcademicMarks
                            ? row.semesterMark
                            : fallbackSemesterMark) !== ""
                            ? hasSubjectAcademicMarks
                              ? row.semesterMark
                              : fallbackSemesterMark
                            : "-"}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Sem mark
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button variant="outline" onClick={() => setShowMarks(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showNotifications && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-xl max-h-[85vh] shadow-2xl relative flex flex-col">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 hover:text-red-500"
              onClick={() => setShowNotifications(false)}
            >
              <X size={18} />
            </Button>

            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>

            <CardContent className="overflow-hidden flex flex-col">
              <div className="overflow-y-auto pr-2 space-y-3 max-h-[60vh]">
                {notificationsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="animate-spin" size={30} />
                  </div>
                ) : (
                  <>
                    {profileStatus && (
                      <div
                        className={`rounded-lg border p-4 ${profileStatus.className}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background/60">
                            <Bell size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-semibold">
                                {profileStatus.title}
                              </p>
                              <span className="rounded-full bg-background/70 px-2 py-1 text-xs font-medium">
                                {profileStatus.label}
                              </span>
                            </div>
                            <p className="mt-1 text-sm">
                              {profileStatus.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification._id}
                          className="rounded-lg border bg-background p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                              <Bell size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <p className="font-semibold">
                                  {notification.title}
                                </p>
                                {!notification.isRead && (
                                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                                    New
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                              <p className="mt-2 text-xs text-muted-foreground">
                                {notification.createdAt
                                  ? new Date(
                                      notification.createdAt,
                                    ).toLocaleString()
                                  : ""}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      !profileStatus && (
                        <p className="text-sm text-muted-foreground py-6 text-center">
                          No notifications found.
                        </p>
                      )
                    )}
                  </>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowNotifications(false)}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showAttendance && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[85vh] shadow-2xl relative flex flex-col">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 hover:text-red-500"
              onClick={() => setShowAttendance(false)}
            >
              <X size={18} />
            </Button>

            <CardHeader>
              <CardTitle>
                Attendance Breakdown
                {currentSemesterLabel ? ` - ${currentSemesterLabel}` : ""}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 overflow-hidden flex flex-col">
              <div className="overflow-y-auto pr-2 space-y-4 max-h-[60vh]">
                {attendanceLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="animate-spin" size={30} />
                  </div>
                ) : dailyAttendance.length > 0 ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Overall Attendance
                            {currentSemesterLabel
                              ? ` (${currentSemesterLabel})`
                              : ""}
                          </p>
                          <p className="text-2xl font-bold">
                            {attendanceStats.attendancePercentage}%
                          </p>
                        </div>
                        <Progress
                          value={attendanceStats.attendancePercentage}
                          className="w-full sm:w-64"
                        />
                      </div>
                    </div>

                    {dailyAttendance.map((day) => (
                      <div
                        key={day.dateKey}
                        className="rounded-lg border bg-background p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                          <div className="shrink-0 sm:w-28">
                            <p className="text-xs font-medium uppercase text-muted-foreground">
                              Date
                            </p>
                            <p className="font-semibold">{day.displayDate}</p>
                            {currentSemesterLabel && (
                              <p className="text-xs text-muted-foreground">
                                {currentSemesterLabel}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-3 overflow-x-auto pb-1">
                            {day.records.map((record) => {
                              const status = record.status;
                              const statusClass =
                                status === "present"
                                  ? "bg-green-100 text-green-800"
                                  : status === "absent"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800";

                              return (
                                <div
                                  key={record.key}
                                  className="min-w-56 rounded-md bg-muted/50 p-3"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold">
                                        {record.subject}
                                      </p>
                                      <p className="text-sm font-medium">
                                        {record.period === "Not Set"
                                          ? "Period not set"
                                          : `Period ${record.period}`}
                                      </p>
                                    </div>
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusClass}`}
                                    >
                                      {status}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="rounded-lg border bg-background p-4">
                      <p className="mb-3 font-semibold">
                        Subject Wise Attendance
                        {currentSemesterLabel ? ` - ${currentSemesterLabel}` : ""}
                      </p>
                      <div className="space-y-3">
                        {subjectWiseAttendance.map((item) => (
                          <div key={item.subject}>
                            <div className="mb-2 flex items-center justify-between gap-4">
                              <p className="text-sm font-medium">
                                {item.subject}
                              </p>
                              <p className="text-sm font-bold">
                                {item.attendancePercentage}%
                              </p>
                            </div>
                            <Progress value={item.attendancePercentage} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No attendance records found.
                  </p>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAttendance(false)}
                >
                  Close
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
