import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export type DropdownOption = {
  value: string;
  label: string;
};

type Props = {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  icon?: React.ReactNode;
};

export default function Dropdown({ value, options, onChange, disabled, placeholder, icon }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <div className={`custom-dropdown${open ? " open" : ""}${disabled ? " disabled" : ""}`} ref={ref}>
      <button
        type="button"
        className="dropdown-trigger"
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        {icon && <span className="dropdown-icon">{icon}</span>}
        <span className="dropdown-label">{selected?.label ?? placeholder ?? "Select"}</span>
        <ChevronDown size={14} className="dropdown-chevron" />
      </button>

      {open && (
        <div className="dropdown-panel" role="listbox">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              className={`dropdown-item${opt.value === value ? " selected" : ""}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              <span>{opt.label}</span>
              {opt.value === value && <Check size={13} className="dropdown-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
