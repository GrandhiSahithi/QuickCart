import { useState } from "react";

export default function PasswordInput({ value, onChange, onBlur, placeholder, required }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
      />
      <button
        type="button"
        className="password-toggle"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
