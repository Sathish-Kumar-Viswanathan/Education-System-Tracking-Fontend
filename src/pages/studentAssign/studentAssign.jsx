import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function StudentAssign() {
  // ⭐ ADDED: student state
  const [students, setStudents] = useState([
    { id: 1, name: "Rahul", class: "MCA", selected: false },
    { id: 2, name: "Priya", class: "MCA", selected: false },
    { id: 3, name: "Arjun", class: "B.Tech", selected: false },
    { id: 4, name: "Sneha", class: "B.Sc", selected: false },
  ]);

  // ⭐ ADDED: filters
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");

  // ⭐ ADDED: filtered logic
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) &&
      (filterClass ? s.class === filterClass : true),
  );

  // ⭐ ADDED: toggle single
  const toggleStudent = (id) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s)),
    );
  };

  // ⭐ ADDED: select all (filter based)
  const toggleSelectAll = () => {
    const allSelected = filteredStudents.every((s) => s.selected);

    setStudents((prev) =>
      prev.map((s) =>
        filteredStudents.find((fs) => fs.id === s.id)
          ? { ...s, selected: !allSelected }
          : s,
      ),
    );
  };

  // ⭐ ADDED: assign action
  const assignStudents = () => {
    const selected = students.filter((s) => s.selected);
    console.log("Assigned:", selected);
    toast.success("Students Assigned Successfully");
  };

  // ⭐ CHANGED: check if at least one student is selected
  const isAnySelected = students.some((s) => s.selected);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Assign Students</h2>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border rounded-md p-2"
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
        >
          <option value="">All Classes</option>
          <option>MCA</option>
          <option>B.Tech</option>
          <option>B.Sc</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
        </CardHeader>

        <CardContent>
          <table className="w-full border">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 border">
                  <input
                    type="checkbox"
                    onChange={toggleSelectAll}
                    checked={
                      filteredStudents.length > 0 &&
                      filteredStudents.every((s) => s.selected)
                    }
                  />
                </th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Class</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="text-center">
                  <td className="border p-2">
                    <input
                      type="checkbox"
                      checked={student.selected}
                      onChange={() => toggleStudent(student.id)}
                    />
                  </td>
                  <td className="border p-2">{student.name}</td>
                  <td className="border p-2">{student.class}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mt-4">
            <Button
              onClick={assignStudents}
              disabled={!isAnySelected} // ⭐ CHANGED
            >
              Assign Selected Students
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
