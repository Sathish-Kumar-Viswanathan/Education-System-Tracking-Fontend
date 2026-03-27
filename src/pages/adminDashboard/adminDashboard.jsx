import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "sonner";
import { Plus, Calendar, Users, X } from "lucide-react";

export default function AdminDashboard() {
  // ⭐ STATE
  const [showUserForm, setShowUserForm] = useState(false);
  const [showTimetableForm, setShowTimetableForm] = useState(false);

  // ⭐ HANDLERS
  const handleCreateUser = () => {
    toast.success("User Created Successfully");
    setShowUserForm(false);
  };

  const handleCreateTimetable = () => {
    toast.success("Timetable Created Successfully");
    setShowTimetableForm(false);
  };

  return (
    <>
      <Toaster position="top-right" />

      <div className="p-6 space-y-6 bg-muted/40 min-h-screen">
        {/* HEADER */}
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        {/* ACTION CARDS */}
        <div className="grid md:grid-cols-2 gap-6">
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
        </div>

        {/* ================= CREATE USER POPUP ================= */}
        {showUserForm && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
            <Card className="w-full max-w-xl relative">
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

              <CardContent className="space-y-4">
                <Input placeholder="Name" />
                <Input placeholder="Email" />
                <Input placeholder="Phone" />

                <select className="border p-2 rounded-md w-full">
                  <option value="">Select Role</option>
                  <option>Student</option>
                  <option>Staff</option>
                </select>

                <select className="border p-2 rounded-md w-full">
                  <option value="">Select Department</option>
                  <option>CSE</option>
                  <option>IT</option>
                  <option>ECE</option>
                  <option>EEE</option>
                  <option>MECH</option>
                  <option>CIVIL</option>
                </select>

                <Button className="w-full" onClick={handleCreateUser}>
                  Create User
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ================= TIMETABLE POPUP ================= */}
        {showTimetableForm && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
            <Card className="w-full max-w-2xl relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={() => setShowTimetableForm(false)}
              >
                <X size={18} />
              </Button>

              <CardHeader>
                <CardTitle>Create Timetable</CardTitle>
              </CardHeader>

              <CardContent className="grid grid-cols-2 gap-4">
                <select className="border p-2 rounded-md">
                  <option>Select Class</option>
                  <option>MCA</option>
                  <option>B.Tech</option>
                  <option>B.Sc</option>
                </select>

                <select className="border p-2 rounded-md">
                  <option>Select Subject</option>
                  <option>DBMS</option>
                  <option>AI</option>
                  <option>Web Dev</option>
                </select>

                <select className="border p-2 rounded-md">
                  <option>Select Staff</option>
                  <option>Professor</option>
                  <option>Assistant Professor</option>
                </select>

                <select className="border p-2 rounded-md">
                  <option>Select Day</option>
                  <option>Monday</option>
                  <option>Tuesday</option>
                  <option>Wednesday</option>
                </select>

                <Input type="time" />
                <Input type="time" />

                <Button className="col-span-2" onClick={handleCreateTimetable}>
                  Create Timetable
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
