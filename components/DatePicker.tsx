"use client";

import { useState } from "react";
import { playSound } from "@/lib/sounds";
import { Modal } from "./Modal";
import { useUIStore } from "@/lib/store/ui-store";
import { formatDateCompact } from "@/lib/date-utils";
import styles from "./DatePicker.module.css";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  id: string;
}

export function DatePicker({ value, onChange, id }: DatePickerProps) {
  const { setOpenModal } = useUIStore();
  const [localDate, setLocalDate] = useState(value || "");

  const handleOpen = () => {
    setLocalDate(value || "");
    setOpenModal(`datepicker-${id}`);
    playSound("open");
  };

  const handleSelect = (date: string) => {
    setLocalDate(date);
    onChange(date);
    playSound("whoosh");
    setOpenModal(null);
  };

  const handleClose = () => {
    setOpenModal(null);
    playSound("close");
  };

  // Format date for display
  const displayDate = value ? formatDateCompact(value) : "Select date";

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={styles.dateInput}
        aria-label="Select date"
      >
        {displayDate} ▼
      </button>

      <Modal id={`datepicker-${id}`} title="Select Date" onClose={handleClose}>
        <div className={styles.datePickerContent}>
          {/* Native date input for mobile, calendar for desktop */}
          <input
            type="date"
            value={localDate}
            onChange={(e) => {
              const newDate = e.target.value;
              setLocalDate(newDate);
              handleSelect(newDate);
            }}
            className={styles.dateInputField}
            min={new Date().toISOString().split("T")[0]}
          />
        </div>
      </Modal>
    </>
  );
}
