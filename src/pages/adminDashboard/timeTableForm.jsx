import React, { useState } from "react";
import axios from "axios";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const periods = Array.from({ length: 8 }, (_, i) => i);

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

  // ⭐ HANDLE CHANGE
  const handleChange = (dayIndex, periodIndex, field, value) => {
    const updated = [...form.weekDays];

    updated[dayIndex].periods[periodIndex] = {
      ...updated[dayIndex].periods[periodIndex],
      [field]: value,
    };

    setForm({ ...form, weekDays: updated });
  };

  // ⭐ SUBMIT
  const handleSubmit = async () => {
    await axios.post(
      "http://localhost:3000/api/time-table/create-time-table",
      form,
    );
    alert("Timetable Created");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Create Timetable</h1>

      {/* TOP FIELDS */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <input
          placeholder="Department"
          onChange={(e) => setForm({ ...form, department: e.target.value })}
        />

        <input
          placeholder="Year"
          onChange={(e) => setForm({ ...form, yearOfStudy: e.target.value })}
        />

        <input
          placeholder="Semester"
          onChange={(e) => setForm({ ...form, semester: e.target.value })}
        />

        <input
          type="number"
          placeholder="Duration"
          onChange={(e) => setForm({ ...form, duration: e.target.value })}
        />
      </div>

      {/* TIMETABLE GRID */}
      <div className="overflow-auto">
        <table className="border w-full text-center">
          <thead>
            <tr>
              <th className="border p-2">Day</th>
              {periods.map((p) => (
                <th key={p} className="border p-2">
                  Hour {p + 1}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {form.weekDays.map((dayObj, dayIndex) => (
              <tr key={dayObj.day}>
                <td className="border p-2 font-bold">{dayObj.day}</td>

                {dayObj.periods.map((period, periodIndex) => (
                  <td key={periodIndex} className="border p-1">
                    <input
                      placeholder="Subject"
                      className="w-full mb-1"
                      onChange={(e) =>
                        handleChange(
                          dayIndex,
                          periodIndex,
                          "subject",
                          e.target.value,
                        )
                      }
                    />

                    <input
                      placeholder="Staff"
                      className="w-full mb-1"
                      onChange={(e) =>
                        handleChange(
                          dayIndex,
                          periodIndex,
                          "staff",
                          e.target.value,
                        )
                      }
                    />

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
                    />

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
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SUBMIT */}
      <button
        onClick={handleSubmit}
        className="mt-6 bg-blue-500 text-white px-6 py-2 rounded"
      >
        Create Timetable
      </button>
    </div>
  );
}
