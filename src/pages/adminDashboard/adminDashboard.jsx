import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, UserCheck } from "lucide-react";

export default function AdminDashboard() {
  // ⭐ ADDED: toggle between staff & students
  const [activeTab, setActiveTab] = useState("students");

  // ⭐ ADDED: search
  const [search, setSearch] = useState("");

  // ⭐ ADDED: dummy data (replace with API later)
  const students = [
    { id: 1, name: "Rahul", class: "MCA", email: "rahul@gmail.com" },
    { id: 2, name: "Priya", class: "B.Tech", email: "priya@gmail.com" },
    { id: 3, name: "Arjun", class: "B.Sc", email: "arjun@gmail.com" },
  ];

  const staffs = [
    {
      id: 1,
      name: "Dr. Kumar",
      department: "CSE",
      designation: "Professor",
      email: "kumar@gmail.com",
    },
    {
      id: 2,
      name: "Ms. Meena",
      department: "IT",
      designation: "Assistant Professor",
      email: "meena@gmail.com",
    },
  ];

  // ⭐ ADDED: filter logic
  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredStaffs = staffs.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 space-y-6 bg-muted/40 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage Students & Staff Details</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4">
        <Button
          onClick={() => setActiveTab("students")}
          variant={activeTab === "students" ? "default" : "outline"}
          className="flex gap-2"
        >
          <Users size={16} />
          Students
        </Button>

        <Button
          onClick={() => setActiveTab("staff")}
          variant={activeTab === "staff" ? "default" : "outline"}
          className="flex gap-2"
        >
          <UserCheck size={16} />
          Staff
        </Button>
      </div>

      {/* Search */}
      <div className="flex justify-end">
        <Input
          placeholder="Search by name..."
          className="max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Students Table */}
      {activeTab === "students" && (
        <Card>
          <CardHeader>
            <CardTitle>All Students</CardTitle>
          </CardHeader>

          <CardContent>
            <table className="w-full border">
              <thead>
                <tr className="bg-muted text-left">
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Class</th>
                  <th className="p-2 border">Email</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="p-2 border">{student.name}</td>
                    <td className="p-2 border">{student.class}</td>
                    <td className="p-2 border">{student.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Staff Table */}
      {activeTab === "staff" && (
        <Card>
          <CardHeader>
            <CardTitle>All Staff</CardTitle>
          </CardHeader>

          <CardContent>
            <table className="w-full border">
              <thead>
                <tr className="bg-muted text-left">
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Department</th>
                  <th className="p-2 border">Designation</th>
                  <th className="p-2 border">Email</th>
                </tr>
              </thead>

              <tbody>
                {filteredStaffs.map((staff) => (
                  <tr key={staff.id}>
                    <td className="p-2 border">{staff.name}</td>
                    <td className="p-2 border">{staff.department}</td>
                    <td className="p-2 border">{staff.designation}</td>
                    <td className="p-2 border">{staff.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
