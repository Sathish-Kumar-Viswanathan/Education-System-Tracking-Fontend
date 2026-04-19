import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { getAllSubjects } from "../../services/subjects/subjects.axios";
import { getStaffUsers } from "../../services/users/users.axios";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const periods = Array.from({ length: 8 }, (_, i) => i);

const inputClass =
  "w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-primary focus:ring-2 focus:ring-primary/20";
const errorInputClass =
  "w-full min-w-0 rounded-md border border-red-500 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20";

export default function TimetableForm() {
  const defaultTimes = [
    { startTime: "09:00", endTime: "10:00" },
    { startTime: "10:00", endTime: "11:00" },
    { startTime: "11:30", endTime: "12:30" },
    { startTime: "12:30", endTime: "01:30" },
    { startTime: "02:00", endTime: "03:00" },
    { startTime: "04:00", endTime: "05:00" },
    { startTime: "05:30", endTime: "06:30" },
    { startTime: "06:30", endTime: "07:30" },
  ];

  const [form, setForm] = useState({
    department: "",
    yearOfStudy: "",
    semester: "",
    duration: 1,
    weekDays: days.map((day) => ({
      day,
      periods: defaultTimes.map((time) => ({
        subject: "",
        staff: "",
        startTime: time.startTime,
        endTime: time.endTime,
      })),
    })),
  });

  const [subjects, setSubjects] = useState([]);
  const [staff, setStaff] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [subjectData, staffData] = await Promise.all([
          getAllSubjects(),
          getStaffUsers(),
        ]);
        setSubjects(subjectData);
        setStaff(staffData);
      } catch (err) {
        toast.error("Failed to load subjects or staff");
      }
    };

    loadData();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!form.department.trim()) {
      newErrors.department = "Department is required";
    }
    if (!form.yearOfStudy.trim()) {
      newErrors.yearOfStudy = "Year of study is required";
    }
    if (!form.semester.trim()) {
      newErrors.semester = "Semester is required";
    }
    if (!form.duration || Number(form.duration) < 1) {
      newErrors.duration = "Duration must be at least 1";
    }

    form.weekDays.forEach((dayObj, dayIndex) => {
      dayObj.periods.forEach((period, periodIndex) => {
        if (!period.subject) {
          newErrors[`subject-${dayIndex}-${periodIndex}`] =
            "Subject is required";
        }
        if (!period.staff) {
          newErrors[`staff-${dayIndex}-${periodIndex}`] = "Staff is required";
        }
        if (!period.startTime || !period.endTime) {
          newErrors[`time-${dayIndex}-${periodIndex}`] =
            "Both start and end time are required";
        }
      });
    });

    return newErrors;
  };

  const handleChange = (dayIndex, periodIndex, field, value) => {
    const updatedWeekDays = [...form.weekDays];
    updatedWeekDays[dayIndex].periods[periodIndex] = {
      ...updatedWeekDays[dayIndex].periods[periodIndex],
      [field]: value,
    };
    setForm({ ...form, weekDays: updatedWeekDays });

    const nextErrors = { ...errors };
    delete nextErrors[`${field}-${dayIndex}-${periodIndex}`];
    setErrors(nextErrors);
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix validation errors before submitting");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        "http://localhost:3000/api/time-table/create-time-table",
        form,
      );
      toast.success("Timetable Created");
      setForm({
        department: "",
        yearOfStudy: "",
        semester: "",
        duration: 1,
        weekDays: days.map((day) => ({
          day,
          periods: defaultTimes.map((time) => ({
            subject: "",
            staff: "",
            startTime: time.startTime,
            endTime: time.endTime,
          })),
        })),
      });
      setErrors({});
    } catch (err) {
      toast.error("Could not create timetable");
    } finally {
      setLoading(false);
    }
  };

  const subjectOptions = subjects.map((subject) => ({
    value: subject._id || subject.subjectName,
    label: subject.subjectName || subject.name || "Unnamed Subject",
  }));

  const staffOptions = staff.map((member) => ({
    value: member._id || member.email,
    label: member.name || member.email || "Unnamed Staff",
  }));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Create Timetable</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="space-y-1">
          <label className="text-sm font-medium">Department</label>
          <input
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            placeholder="Department"
            className={errors.department ? errorInputClass : `${inputClass}`}
          />
          {errors.department && (
            <p className="text-xs text-red-500">{errors.department}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Year</label>
          <input
            value={form.yearOfStudy}
            onChange={(e) => setForm({ ...form, yearOfStudy: e.target.value })}
            placeholder="Year"
            className={errors.yearOfStudy ? errorInputClass : `${inputClass}`}
          />
          {errors.yearOfStudy && (
            <p className="text-xs text-red-500">{errors.yearOfStudy}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Semester</label>
          <input
            value={form.semester}
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
            placeholder="Semester"
            className={errors.semester ? errorInputClass : `${inputClass}`}
          />
          {errors.semester && (
            <p className="text-xs text-red-500">{errors.semester}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Duration</label>
          <input
            type="number"
            min="1"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
            placeholder="Duration"
            className={errors.duration ? errorInputClass : `${inputClass}`}
          />
          {errors.duration && (
            <p className="text-xs text-red-500">{errors.duration}</p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {form.weekDays.map((dayObj, dayIndex) => (
          <div
            key={dayObj.day}
            className="border rounded-lg p-4 bg-white shadow-sm"
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              {dayObj.day}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {dayObj.periods.map((period, periodIndex) => {
                const subjectError =
                  errors[`subject-${dayIndex}-${periodIndex}`];
                const staffError = errors[`staff-${dayIndex}-${periodIndex}`];
                const timeError = errors[`time-${dayIndex}-${periodIndex}`];
                return (
                  <div
                    key={periodIndex}
                    className="border rounded-md p-3 bg-gray-50 space-y-3"
                  >
                    <div className="text-sm font-medium text-gray-700">
                      Period {periodIndex + 1}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Subject
                      </label>
                      <select
                        value={period.subject}
                        onChange={(e) =>
                          handleChange(
                            dayIndex,
                            periodIndex,
                            "subject",
                            e.target.value,
                          )
                        }
                        className={subjectError ? errorInputClass : inputClass}
                      >
                        <option value="">Select subject</option>
                        {subjectOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {subjectError && (
                        <p className="text-xs text-red-500 mt-1">
                          {subjectError}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Staff
                      </label>
                      <select
                        value={period.staff}
                        onChange={(e) =>
                          handleChange(
                            dayIndex,
                            periodIndex,
                            "staff",
                            e.target.value,
                          )
                        }
                        className={staffError ? errorInputClass : inputClass}
                      >
                        <option value="">Select staff</option>
                        {staffOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {staffError && (
                        <p className="text-xs text-red-500 mt-1">
                          {staffError}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Start
                        </label>
                        <input
                          type="time"
                          value={period.startTime}
                          onChange={(e) =>
                            handleChange(
                              dayIndex,
                              periodIndex,
                              "startTime",
                              e.target.value,
                            )
                          }
                          className={timeError ? errorInputClass : inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          End
                        </label>
                        <input
                          type="time"
                          value={period.endTime}
                          onChange={(e) =>
                            handleChange(
                              dayIndex,
                              periodIndex,
                              "endTime",
                              e.target.value,
                            )
                          }
                          className={timeError ? errorInputClass : inputClass}
                        />
                      </div>
                    </div>
                    {timeError && (
                      <p className="text-xs text-red-500">{timeError}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="mt-6 inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        {loading ? "Saving..." : "Create Timetable"}
      </button>
    </div>
  );
}
