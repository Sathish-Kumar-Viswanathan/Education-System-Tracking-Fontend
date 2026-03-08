import React, { useState } from "react";
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
} from "lucide-react";
import { Input } from "@/components/ui/input";

import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token"); // remove auth token
    navigate("/"); // redirect to login page
  };

  const [showProfile, setShowProfile] = useState(false);
  const [step, setStep] = useState(1);

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  return (
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
              {step === 1 && (
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="First Name" />
                  <Input placeholder="Last Name" />
                  <Input type="date" />
                  <Input placeholder="Phone Number" />
                  <Input placeholder="Email" />
                  <Input placeholder="Address" />
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Father Name" />
                  <Input placeholder="Mother Name" />
                  <Input placeholder="Father Phone" />
                  <Input placeholder="Mother Phone" />
                  <Input placeholder="Father Occupation" />
                  <Input placeholder="Mother Occupation" />
                </div>
              )}

              {step === 3 && (
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="10th Mark" />
                  <Input placeholder="12th Mark" />
                  <Input placeholder="UG Mark" />
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
                  <Button onClick={() => setShowProfile(false)}>Submit</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Attendance</CardTitle>
            <ClipboardList size={18} />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">85%</p>
            <Progress value={85} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Courses</CardTitle>
            <BookOpen size={18} />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">6</p>
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
    </div>
  );
}
