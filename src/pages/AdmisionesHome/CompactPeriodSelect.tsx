import { useEffect, useId, useRef, useState } from "react";

interface PeriodOption {
  label: string;
  value: string;
}

interface CompactPeriodSelectProps {
  id: string;
  options: PeriodOption[];
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export const CompactPeriodSelect = ({
  id,
  options,
  placeholder,
  value,
  onChange,
}: CompactPeriodSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [isOpen]);

  return (
    <div
      className="compact-period-select"
      ref={containerRef}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setIsOpen(false);
          document.getElementById(id)?.focus();
        }
      }}
    >
      <button
        id={id}
        type="button"
        className="compact-period-select__trigger"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{selectedOption?.label ?? placeholder}</span>
        <span className="compact-period-select__chevron" aria-hidden="true">⌄</span>
      </button>

      {isOpen ? (
        <div
          id={listboxId}
          className="compact-period-select__list"
          role="listbox"
          aria-labelledby={id}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className="compact-period-select__option"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                setIsOpen(false);
                onChange(option.value);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
