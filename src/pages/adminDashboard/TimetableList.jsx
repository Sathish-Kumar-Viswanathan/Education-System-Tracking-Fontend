import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllTimetables } from "../../services/timeTable/timeTable.axios";

export default function TimetableList({ onClose }) {
  const [timetables, setTimetables] = useState([]);
  const [filteredTimetables, setFilteredTimetables] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Get unique values for filters
  const departments = [
    ...new Set(timetables.map((t) => t.department).filter(Boolean)),
  ];
  const years = [
    ...new Set(timetables.map((t) => t.yearOfStudy).filter(Boolean)),
  ];
  const semesters = [
    ...new Set(timetables.map((t) => t.semester).filter(Boolean)),
  ];

  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  // Sort timetables by department, then sort weekDays by day order
  const processedTimetables = filteredTimetables.map((timetable) => ({
    ...timetable,
    weekDays: [...timetable.weekDays].sort(
      (a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day),
    ),
  }));

  useEffect(() => {
    const loadTimetables = async () => {
      try {
        const data = await getAllTimetables();
        setTimetables(data);
        setFilteredTimetables(data);
      } catch (error) {
        console.error("Failed to load timetables:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTimetables();
  }, []);

  useEffect(() => {
    let filtered = timetables;

    // Apply filters
    if (departmentFilter !== "all") {
      filtered = filtered.filter((t) => t.department === departmentFilter);
    }
    if (yearFilter !== "all") {
      filtered = filtered.filter((t) => t.yearOfStudy === yearFilter);
    }
    if (semesterFilter !== "all") {
      filtered = filtered.filter((t) => t.semester === semesterFilter);
    }
    if (search.trim()) {
      filtered = filtered.filter(
        (t) =>
          t.department?.toLowerCase().includes(search.toLowerCase()) ||
          t.yearOfStudy?.toLowerCase().includes(search.toLowerCase()) ||
          t.semester?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    setFilteredTimetables(filtered);
  }, [timetables, departmentFilter, yearFilter, semesterFilter, search]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Loading timetables...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 w-full">
      <CardHeader className="px-0">
        <CardTitle>All Timetables</CardTitle>
      </CardHeader>

      <CardContent className="px-0 space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={semesterFilter} onValueChange={setSemesterFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              {semesters.map((sem) => (
                <SelectItem key={sem} value={sem}>
                  {sem}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Timetable Grid */}
        <div className="grid grid-cols-1 gap-6">
          {processedTimetables.map((timetable, index) => (
            <Card key={timetable._id || index} className="p-6">
              <div className="space-y-6">
                {/* Timetable Header */}
                <div className="border-b pb-4">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Department
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {timetable.department}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Year
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {timetable.yearOfStudy}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Semester
                      </label>
                      <p className="text-lg font-semibold text-gray-900">
                        {timetable.semester}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Duration
                      </label>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {timetable.duration} weeks
                      </span>
                    </div>
                  </div>
                </div>

                {/* Days and Periods */}
                <div className="space-y-4">
                  {timetable.weekDays?.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <h4 className="font-semibold text-base mb-3 text-gray-800">
                        {day.day}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4  gap-3">
                        {day.periods?.map((period, periodIndex) => (
                          <div
                            key={periodIndex}
                            className="bg-white p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="space-y-2">
                              <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Subject
                                </label>
                                <p className="font-medium text-gray-900">
                                  {period.subjectName || "Free Period"}
                                </p>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Staff
                                </label>
                                <p className="text-sm text-gray-700">
                                  {period.staffName || "Not Assigned"}
                                </p>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  Time
                                </label>
                                <p className="text-sm text-gray-600 font-mono">
                                  {period.startTime} - {period.endTime}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {processedTimetables.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No timetables found matching the filters.
          </div>
        )}
      </CardContent>
    </div>
  );
}
