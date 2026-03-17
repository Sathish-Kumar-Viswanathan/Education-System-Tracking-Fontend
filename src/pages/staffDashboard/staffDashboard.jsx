import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { useNavigate } from "react-router-dom";
import { LogOut, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Users,
  BookOpen,
  ClipboardList,
  Calendar,
  Bell,
  Plus,
  User,
} from "lucide-react";

import { useForm } from "react-hook-form";

export default function StaffDashboard() {
  const [showProfile, setShowProfile] = useState(false);
  const [step, setStep] = useState(1);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm();

  const nextStep = async () => {
    const valid = await trigger([
      "firstName",
      "lastName",
      "dob",
      "phone",
      "gender",
      "address",
      "email",
    ]);

    if (valid) {
      setStep(2);
    }
  };

  const prevStep = () => setStep(1);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/");
  };

  const onSubmit = (data) => {
    console.log(data);
    toast.success("Staff Added Successfully");
    setShowProfile(false);
  };

  return (
    <>
      <Toaster position="top-right" closeButton richColors />

      <div className="p-6 space-y-6 bg-muted/40 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Staff Dashboard</h1>
            <p className="text-muted-foreground">Welcome back 👋</p>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => setShowProfile(true)} className="flex gap-2">
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
        <div className="grid md:grid-cols-4 gap-4">
          {" "}
          <Card className="hover:-translate-y-1 transition shadow-md hover:shadow-xl cursor-pointer">
            {" "}
            <CardHeader className="flex justify-between flex-row items-center">
              {" "}
              <CardTitle className="text-sm">Total Students</CardTitle>{" "}
              <Users size={18} />{" "}
            </CardHeader>{" "}
            <CardContent>
              {" "}
              <p className="text-3xl font-bold">320</p>{" "}
              <p className="text-xs text-muted-foreground">
                Active students
              </p>{" "}
            </CardContent>{" "}
          </Card>{" "}
          <Card className="hover:-translate-y-1 transition shadow-md hover:shadow-xl cursor-pointer">
            {" "}
            <CardHeader className="flex justify-between flex-row items-center">
              {" "}
              <CardTitle className="text-sm">Courses</CardTitle>{" "}
              <BookOpen size={18} />{" "}
            </CardHeader>{" "}
            <CardContent>
              {" "}
              <p className="text-3xl font-bold">8</p>{" "}
              <p className="text-xs text-muted-foreground">
                Assigned courses
              </p>{" "}
            </CardContent>{" "}
          </Card>{" "}
          <Card className="hover:-translate-y-1 transition shadow-md hover:shadow-xl cursor-pointer">
            {" "}
            <CardHeader className="flex justify-between flex-row items-center">
              {" "}
              <CardTitle className="text-sm">Assignments</CardTitle>{" "}
              <ClipboardList size={18} />{" "}
            </CardHeader>{" "}
            <CardContent>
              {" "}
              <p className="text-3xl font-bold">14</p>{" "}
              <p className="text-xs text-muted-foreground">
                Pending reviews
              </p>{" "}
            </CardContent>{" "}
          </Card>{" "}
          <Card className="hover:-translate-y-1 transition shadow-md hover:shadow-xl cursor-pointer">
            {" "}
            <CardHeader className="flex justify-between flex-row items-center">
              {" "}
              <CardTitle className="text-sm">Notifications</CardTitle>{" "}
              <Bell size={18} />{" "}
            </CardHeader>{" "}
            <CardContent>
              {" "}
              <p className="text-3xl font-bold">5</p>{" "}
              <p className="text-xs text-muted-foreground">
                Unread alerts
              </p>{" "}
            </CardContent>{" "}
          </Card>{" "}
        </div>{" "}
        {/* Quick Actions */}{" "}
        <div>
          {" "}
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>{" "}
          <div className="grid md:grid-cols-4 gap-4">
            {" "}
            <Card className="cursor-pointer hover:bg-primary hover:text-white transition">
              {" "}
              <CardContent className="flex flex-col items-center justify-center p-6">
                {" "}
                <Plus size={30} />{" "}
                <p className="mt-2 font-medium">Add Student</p>{" "}
              </CardContent>{" "}
            </Card>{" "}
            <Card className="cursor-pointer hover:bg-primary hover:text-white transition">
              {" "}
              <CardContent className="flex flex-col items-center justify-center p-6">
                {" "}
                <ClipboardList size={30} />{" "}
                <p className="mt-2 font-medium">Mark Attendance</p>{" "}
              </CardContent>{" "}
            </Card>{" "}
            <Card className="cursor-pointer hover:bg-primary hover:text-white transition">
              {" "}
              <CardContent className="flex flex-col items-center justify-center p-6">
                {" "}
                <BookOpen size={30} />{" "}
                <p className="mt-2 font-medium">Upload Assignment</p>{" "}
              </CardContent>{" "}
            </Card>{" "}
            <Card className="cursor-pointer hover:bg-primary hover:text-white transition">
              {" "}
              <CardContent className="flex flex-col items-center justify-center p-6">
                {" "}
                <Calendar size={30} />{" "}
                <p className="mt-2 font-medium">Schedule Class</p>{" "}
              </CardContent>{" "}
            </Card>{" "}
          </div>{" "}
        </div>{" "}
        {/* Bottom Section */}{" "}
        <div className="grid md:grid-cols-2 gap-4">
          {" "}
          {/* Today's Schedule */}{" "}
          <Card>
            {" "}
            <CardHeader>
              {" "}
              <CardTitle>Today's Schedule</CardTitle>{" "}
            </CardHeader>{" "}
            <CardContent className="space-y-3">
              {" "}
              <div className="flex justify-between p-3 rounded-lg bg-muted">
                {" "}
                <span>Database Systems</span>{" "}
                <span className="text-muted-foreground">10:00 AM</span>{" "}
              </div>{" "}
              <div className="flex justify-between p-3 rounded-lg bg-muted">
                {" "}
                <span>Web Development</span>{" "}
                <span className="text-muted-foreground">1:00 PM</span>{" "}
              </div>{" "}
              <div className="flex justify-between p-3 rounded-lg bg-muted">
                {" "}
                <span>AI Fundamentals</span>{" "}
                <span className="text-muted-foreground">3:00 PM</span>{" "}
              </div>{" "}
            </CardContent>{" "}
          </Card>{" "}
          {/* Recent Activity */}{" "}
          <Card>
            {" "}
            <CardHeader>
              {" "}
              <CardTitle>Recent Student Activity</CardTitle>{" "}
            </CardHeader>{" "}
            <CardContent className="space-y-3">
              {" "}
              <div className="p-3 bg-muted rounded-lg">
                {" "}
                Rahul submitted **Assignment 2**{" "}
              </div>{" "}
              <div className="p-3 bg-muted rounded-lg">
                {" "}
                Priya uploaded **Project Proposal**{" "}
              </div>{" "}
              <div className="p-3 bg-muted rounded-lg">
                {" "}
                Arjun requested **Leave Approval**{" "}
              </div>{" "}
            </CardContent>{" "}
          </Card>{" "}
        </div>
        {showProfile && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <Card className="w-full max-w-4xl shadow-2xl relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={() => setShowProfile(false)}
              >
                <X size={18} />
              </Button>

              <CardHeader>
                <CardTitle>Add Staff</CardTitle>

                <div className="flex gap-3 text-sm mt-2">
                  <span
                    className={
                      step === 1 ? "font-bold" : "text-muted-foreground"
                    }
                  >
                    Step 1: Personal
                  </span>

                  <span>→</span>

                  <span
                    className={
                      step === 2 ? "font-bold" : "text-muted-foreground"
                    }
                  >
                    Step 2: Academic
                  </span>
                </div>
              </CardHeader>

              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                  {/* STEP 1 */}

                  {step === 1 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Input
                          placeholder="First Name"
                          {...register("firstName", {
                            required: "First Name required",
                          })}
                          className={errors.firstName ? "border-red-500" : ""} // ⭐ CHANGED
                        />
                        {errors.firstName && (
                          <p className="text-red-500 text-sm">
                            {errors.firstName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Input
                          placeholder="Last Name"
                          {...register("lastName", {
                            required: "Last Name required",
                          })}
                          className={errors.lastName ? "border-red-500" : ""} // ⭐ CHANGED
                        />
                        {errors.lastName && (
                          <p className="text-red-500 text-sm">
                            {errors.lastName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Input
                          type="date"
                          {...register("dob", {
                            required: "Date of birth required",
                          })}
                          className={errors.dob ? "border-red-500" : ""} // ⭐ CHANGED
                        />
                        {errors.dob && (
                          <p className="text-red-500 text-sm">
                            {errors.dob.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Input
                          placeholder="Phone No"
                          {...register("phone", {
                            required: "Phone number required",
                          })}
                          className={errors.phone ? "border-red-500" : ""} // ⭐ CHANGED
                        />
                        {errors.phone && (
                          <p className="text-red-500 text-sm">
                            {errors.phone.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <select
                          {...register("gender", {
                            required: "Gender required",
                          })}
                          className={`border rounded-md p-2 w-full ${
                            errors.gender ? "border-red-500" : ""
                          }`} // ⭐ CHANGED
                        >
                          <option value="">Select Gender</option>
                          <option>Male</option>
                          <option>Female</option>
                        </select>

                        {errors.gender && (
                          <p className="text-red-500 text-sm">
                            {errors.gender.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Input
                          placeholder="Address"
                          {...register("address", {
                            required: "Address required",
                          })}
                          className={errors.address ? "border-red-500" : ""} // ⭐ CHANGED
                        />
                        {errors.address && (
                          <p className="text-red-500 text-sm">
                            {errors.address.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Input
                          placeholder="Email ID"
                          {...register("email", { required: "Email required" })}
                          className={errors.email ? "border-red-500" : ""} // ⭐ CHANGED
                        />
                        {errors.email && (
                          <p className="text-red-500 text-sm">
                            {errors.email.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 2 */}

                  {step === 2 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <select
                          {...register("department", {
                            required: "Department required",
                          })}
                          className={`border rounded-md p-2 w-full ${
                            errors.department ? "border-red-500" : ""
                          }`} // ⭐ CHANGED
                        >
                          <option value="">Select Department</option>
                          <option>CSE</option>
                          <option>IT</option>
                          <option>ECE</option>
                          <option>EEE</option>
                          <option>MECH</option>
                          <option>CIVIL</option>
                        </select>

                        {errors.department && (
                          <p className="text-red-500 text-sm">
                            {errors.department.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <select
                          {...register("designation", {
                            required: "Designation required",
                          })}
                          className={`border rounded-md p-2 w-full ${
                            errors.designation ? "border-red-500" : ""
                          }`} // ⭐ CHANGED
                        >
                          <option value="">Select Designation</option>
                          <option>Professor</option>
                          <option>Assistant Professor</option>
                          <option>HOD</option>
                          <option>Trainee</option>
                          <option>Lab Assistant</option>
                        </select>

                        {errors.designation && (
                          <p className="text-red-500 text-sm">
                            {errors.designation.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Input
                          placeholder="Qualification"
                          {...register("qualification", {
                            required: "Qualification required",
                          })}
                          className={
                            errors.qualification ? "border-red-500" : ""
                          } // ⭐ CHANGED
                        />

                        {errors.qualification && (
                          <p className="text-red-500 text-sm">
                            {errors.qualification.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Input
                          placeholder="Experience"
                          {...register("experience", {
                            required: "Experience required",
                          })}
                          className={errors.experience ? "border-red-500" : ""} // ⭐ CHANGED
                        />

                        {errors.experience && (
                          <p className="text-red-500 text-sm">
                            {errors.experience.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      disabled={step === 1}
                    >
                      Back
                    </Button>

                    {step === 1 ? (
                      <Button type="button" onClick={nextStep}>
                        Next
                      </Button>
                    ) : (
                      <Button type="submit">Submit</Button>
                    )}
                  </div>
                </CardContent>
              </form>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
