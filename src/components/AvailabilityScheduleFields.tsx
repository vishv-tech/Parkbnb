"use client";

import { WEEKDAYS } from "@/lib/types";
import type { AvailabilityFields } from "@/lib/availability";
import type { AvailabilityType } from "@/lib/types";

type AvailabilityScheduleFieldsProps = AvailabilityFields & {
  onChange: (patch: Partial<AvailabilityFields>) => void;
};

const availabilityOptions: { label: string; value: AvailabilityType }[] = [
  { label: "Always Available", value: "ALWAYS" },
  { label: "Daily Schedule", value: "DAILY" },
  { label: "One-Time Schedule", value: "ONE_TIME" },
];

export function AvailabilityScheduleFields({
  availabilityType,
  availableDays,
  dailyStartTime,
  dailyEndTime,
  oneTimeStartDate,
  oneTimeStartTime,
  oneTimeEndDate,
  oneTimeEndTime,
  onChange,
}: AvailabilityScheduleFieldsProps) {
  function toggleDay(day: string) {
    const nextDays = availableDays.includes(day)
      ? availableDays.filter((availableDay) => availableDay !== day)
      : [...availableDays, day];

    onChange({ availableDays: nextDays });
  }

  return (
    <section className="card p-5">
      <h2 className="text-xl font-black">Availability Schedule</h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {availabilityOptions.map((option) => (
          <label
            className={`rounded-lg border p-4 text-sm font-black ${
              availabilityType === option.value
                ? "border-[#28a58b] bg-[#e9f7f2] text-[#11312c]"
                : "border-[#dbe3df] bg-white text-[#40514b]"
            }`}
            key={option.value}
          >
            <input
              checked={availabilityType === option.value}
              className="sr-only"
              name="availabilityType"
              type="radio"
              value={option.value}
              onChange={() => onChange({ availabilityType: option.value })}
            />
            {option.label}
          </label>
        ))}
      </div>

      {availabilityType === "ALWAYS" && (
        <p className="mt-4 rounded-lg bg-[#f8fbfa] p-4 text-sm font-bold text-[#6b7772]">
          This parking spot will be available 24/7 unless you take it down or it becomes occupied.
        </p>
      )}

      {availabilityType === "DAILY" && (
        <div className="mt-4 grid gap-4">
          <div>
            <span className="label">Available days</span>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {WEEKDAYS.map((day) => (
                <label
                  className="flex items-center gap-2 rounded-lg border border-[#dbe3df] bg-white p-3 text-sm font-bold text-[#40514b]"
                  key={day}
                >
                  <input
                    checked={availableDays.includes(day)}
                    type="checkbox"
                    onChange={() => toggleDay(day)}
                  />
                  {day}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="label">Start Time</span>
              <input
                className="field"
                type="time"
                value={dailyStartTime ?? ""}
                onChange={(event) => onChange({ dailyStartTime: event.target.value })}
              />
            </label>
            <label>
              <span className="label">End Time</span>
              <input
                className="field"
                type="time"
                value={dailyEndTime ?? ""}
                onChange={(event) => onChange({ dailyEndTime: event.target.value })}
              />
            </label>
          </div>
        </div>
      )}

      {availabilityType === "ONE_TIME" && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label>
            <span className="label">Start Date</span>
            <input
              className="field"
              type="date"
              value={oneTimeStartDate ?? ""}
              onChange={(event) => onChange({ oneTimeStartDate: event.target.value })}
            />
          </label>
          <label>
            <span className="label">Start Time</span>
            <input
              className="field"
              type="time"
              value={oneTimeStartTime ?? ""}
              onChange={(event) => onChange({ oneTimeStartTime: event.target.value })}
            />
          </label>
          <label>
            <span className="label">End Date</span>
            <input
              className="field"
              type="date"
              value={oneTimeEndDate ?? ""}
              onChange={(event) => onChange({ oneTimeEndDate: event.target.value })}
            />
          </label>
          <label>
            <span className="label">End Time</span>
            <input
              className="field"
              type="time"
              value={oneTimeEndTime ?? ""}
              onChange={(event) => onChange({ oneTimeEndTime: event.target.value })}
            />
          </label>
        </div>
      )}
    </section>
  );
}
