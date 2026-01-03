"use client";

import React from "react";
import styles from "./FormField.module.css";

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  helperText?: string;
  error?: string;
}

export function FormField({ label, required, children, helperText, error }: FormFieldProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        {label}
        {required && " *"}
      </label>
      {children}
      {helperText && <div className={styles.helperText}>{helperText}</div>}
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
