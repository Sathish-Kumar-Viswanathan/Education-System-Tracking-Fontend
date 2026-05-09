import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  BookOpen,
  Bell,
  User,
  ClipboardList,
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

export default function StudentDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token"); // remove auth token
    navigate("/"); // redirect to login page
  };

  const [showProfile, setShowProfile] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    leave: 0,
    attendancePercentage: 0,
  });
  const [subjectWiseAttendance, setSubjectWiseAttendance] = useState([]);
  const [coursesCount, setCoursesCount] = useState(0);

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
    twelfthMarkPercentage: "",
    ugMarkPercentage: "",
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
      fetchAttendanceStats();
      fetchCourses();
    }
  }, [userId]);

  const fetchStudentProfile = async () => {
    try {
      setProfileLoading(true);
      const response = await getStudentProfileByUserId(userId);
      if (response.profile) {
        setProfile(response.profile);
      }
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
      setCoursesCount(response.count || 0);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCoursesCount(0);
    } finally {
      setCoursesLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async () => {
    try {
      setLoading(true);
      await updateStudentProfileByUserId(userId, profile);
      toast.success("Profile updated successfully");
      setShowProfile(false);
      setStep(1);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

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
            onClick={() => setShowProfile(!showProfile)}
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl shadow-2xl relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 hover:text-red-500"
              onClick={() => setShowProfile(false)}
            >
              <X size={18} />
            </Button>
            <CardHeader>
              <CardTitle>Student Basic Details</CardTitle>
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
            </CardHeader>

            <CardContent className="space-y-4">
              {profileLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="animate-spin" size={30} />
                </div>
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
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="10th Percentage"
                        name="tenthMarkPercentage"
                        type="number"
                        value={profile.tenthMarkPercentage}
                        onChange={handleProfileChange}
                      />
                      <Input
                        placeholder="12th Percentage"
                        name="twelfthMarkPercentage"
                        type="number"
                        value={profile.twelfthMarkPercentage}
                        onChange={handleProfileChange}
                      />
                      <Input
                        placeholder="UG Percentage"
                        name="ugMarkPercentage"
                        type="number"
                        value={profile.ugMarkPercentage}
                        onChange={handleProfileChange}
                      />
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={prevStep}
                      disabled={step === 1}
                    >
                      Back
                    </Button>

                    {step < 3 ? (
                      <Button onClick={nextStep}>Next</Button>
                    ) : (
                      <Button onClick={handleProfileSubmit} disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 animate-spin" size={16} />
                            Submitting...
                          </>
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
      <div className="grid md:grid-cols-4 gap-4">
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
            <Progress
              value={attendanceStats.attendancePercentage}
              className="mt-2"
            />
          </CardContent>
          </button>
        </Card>

        <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
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
        </Card>

        <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Assignments</CardTitle>
            <ClipboardList size={18} />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">3</p>
            <p className="text-xs text-muted-foreground">Pending tasks</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Notifications</CardTitle>
            <Bell size={18} />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">5</p>
            <p className="text-xs text-muted-foreground">New updates</p>
          </CardContent>
        </Card>
      </div>

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
              <CardTitle>Attendance Breakdown</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 overflow-hidden flex flex-col">
              <div className="overflow-y-auto pr-2 space-y-4 max-h-[60vh]">
                {attendanceLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="animate-spin" size={30} />
                  </div>
                ) : subjectWiseAttendance.length > 0 ? (
                  <div className="space-y-4">
                    {subjectWiseAttendance.map((item) => (
                      <div key={item.subject} className="border rounded-lg p-4">
                        <div className="flex justify-between gap-4">
                          <p className="font-semibold">{item.subject}</p>
                          <p className="text-lg font-bold">
                            {item.attendancePercentage}%
                          </p>
                        </div>
                        <Progress
                          value={item.attendancePercentage}
                          className="mt-3"
                        />

                        <div className="mt-4 space-y-2">
                          {(item.periodWiseAttendance || []).map(
                            (periodItem) => {
                              const status = periodItem.status || "absent";
                              const periodDate = periodItem.date
                                ? new Date(periodItem.date).toLocaleDateString()
                                : "Date not set";
                              const statusClass =
                                status === "present"
                                  ? "bg-green-100 text-green-800"
                                  : status === "absent"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800";

                              return (
                                <div
                                  key={`${item.subject}-${periodItem.period}`}
                                  className="rounded-md bg-muted/50 p-3"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-medium">
                                        {periodItem.period === "Not Set"
                                          ? "Period not set"
                                          : `Period ${periodItem.period}`}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {periodDate}
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
                            },
                          )}
                        </div>
                      </div>
                    ))}
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
