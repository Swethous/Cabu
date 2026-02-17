"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import styles from "./FormFields.module.css";

import EyeOpenIcon from "@/assets/icons/eye-open.png";
import EyeClosedIcon from "@/assets/icons/eye-closed.png";

type PasswordFieldProps = {
  label: string;
  name?: string;
  placeholder?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  disabled?: boolean;
};

export default function PasswordField({
  label,
  name = "password",
  placeholder,
  value,
  onChange,
  autoComplete = "current-password",
  disabled,
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <div className={styles.FormGroup}>
      <label className={styles.FormLabel} htmlFor={name}>
        {label}
      </label>

      <div className={styles.PasswordField__wrapper}>
        <input
          id={name}
          name={name}
          type={show ? "text" : "password"}
          className={`${styles.FormInput} ${styles.PasswordField__input}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          disabled={disabled}
        />

        <button
          type="button"
          className={styles.PasswordField__toggle}
          onClick={() => setShow((prev) => !prev)}
          aria-label={show ? "パスワードを隠す" : "パスワードを表示"}
          disabled={disabled}
        >
          <Image
            src={show ? EyeOpenIcon : EyeClosedIcon}
            alt=""
            width={20}
            height={20}
            className={styles.PasswordField__icon}
          />
        </button>
      </div>
    </div>
  );
}