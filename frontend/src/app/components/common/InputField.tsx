"use client";

import type { FC, ChangeEvent } from "react";
import styles from "./FormFields.module.css";

type InputFieldProps = {
  label: string;
  type?: string;
  name?: string;
  placeholder?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
};

const InputField: FC<InputFieldProps> = ({
  label,
  type = "text",
  name,
  placeholder,
  value,
  onChange,
  autoComplete,
}) => {
  return (
    <div className={styles.FormGroup}>
      <label className={styles.FormLabel} htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        className={styles.FormInput}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
      />
    </div>
  );
};

export default InputField;