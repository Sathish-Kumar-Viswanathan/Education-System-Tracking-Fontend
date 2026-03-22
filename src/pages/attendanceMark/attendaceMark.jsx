import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";

export default function AttendanceMark({ isOpen, onClose }) {
  const [students, setStudents] = useState([
    { id: 1, name: "Rahul", class: "MCA", status: "" },
    { id: 2, name: "Priya", class: "MCA", status: "" },
    { id: 3, name: "Arjun", class: "B.Tech", status: "" },
  ]);

  // ⭐ CHANGED: current date + time
  const currentDateTime = new Date().toLocaleString();

  const markAttendance = (id, value) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: value } : s)),
    );
  };

  const submitAttendance = () => {
    const notMarked = students.some((s) => !s.status);

    if (notMarked) {
      toast.error("Please mark all students attendance");
      return;
    }

    console.log("Attendance Data:", students);
    toast.success("Attendance submitted successfully");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <Card className="w-full max-w-3xl shadow-2xl relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          onClick={onClose}
        >
          <X size={18} />
        </Button>

        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
        </CardHeader>

        <CardContent>
          {/* ⭐ CHANGED: Date field added */}
          <div className="mb-4">
            <label className="text-sm font-medium">Date & Time</label>
            <input
              type="text"
              value={currentDateTime}
              disabled
              className="w-full border rounded-md p-2 mt-1 bg-muted cursor-not-allowed"
            />
          </div>

          <table className="w-full border">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Class</th>
                <th className="p-2 border">Status</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="text-center">
                  <td className="border p-2">{student.name}</td>
                  <td className="border p-2">{student.class}</td>

                  <td className="border p-2">
                    <div className="flex justify-center gap-4">
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name={`att-${student.id}`}
                          onChange={() => markAttendance(student.id, "Present")}
                        />
                        Present
                      </label>

                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name={`att-${student.id}`}
                          onChange={() => markAttendance(student.id, "Absent")}
                        />
                        Absent
                      </label>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mt-4">
            <Button onClick={submitAttendance}>Submit Attendance</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
