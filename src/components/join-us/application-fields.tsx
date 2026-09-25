"use client";

import { COUNTRY_CODES, TEXT_LIMIT, type Option } from "@/lib/careers/catalog";
import type { PhoneValue } from "@/lib/careers/application";

function describedBy(id: string, hint?: React.ReactNode, error?: string) {
  return [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
}

export function RequiredMark() {
  return (
    <span className="join-us-form__required" aria-hidden>
      {" "}
      *
    </span>
  );
}

export function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <span id={`${id}-error`} className="join-us-form__error" role="alert">
      {error}
    </span>
  );
}

export function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="join-us-form__field">
      <label htmlFor={id} className="join-us-form__label">
        {label}
        {required && <RequiredMark />}
      </label>
      {hint && (
        <span id={`${id}-hint`} className="join-us-form__hint">
          {hint}
        </span>
      )}
      {children}
      <FieldError id={id} error={error} />
    </div>
  );
}

export function inputProps(id: string, error?: string, hint?: React.ReactNode) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy(id, hint, error),
  } as const;
}

export function ChoiceGroup({
  id,
  legend,
  required,
  hint,
  error,
  options,
  value,
  onChange,
}: {
  id: string;
  legend: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  error?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset
      id={id}
      tabIndex={-1}
      className="join-us-form__fieldset"
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, hint, error)}
    >
      <legend className="join-us-form__label">
        {legend}
        {required ? <RequiredMark /> : null}
      </legend>
      {hint && (
        <span id={`${id}-hint`} className="join-us-form__hint">
          {hint}
        </span>
      )}
      <div className="join-us-form__choices">
        {options.map((option) => (
          <label
            key={option.value}
            className={`join-us-form__choice${value === option.value ? " is-checked" : ""}`}
          >
            <input
              type="radio"
              name={id}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      <FieldError id={id} error={error} />
    </fieldset>
  );
}

export function MultiChoiceGroup({
  id,
  legend,
  required,
  hint,
  error,
  options,
  values,
  onChange,
}: {
  id: string;
  legend: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  error?: string;
  options: Option[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <fieldset
      id={id}
      tabIndex={-1}
      className="join-us-form__fieldset"
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, hint, error)}
    >
      <legend className="join-us-form__label">
        {legend}
        {required ? <RequiredMark /> : null}
      </legend>
      <span id={`${id}-hint`} className="join-us-form__hint">
        {hint ?? "Choose all that apply."}
      </span>
      <div className="join-us-form__choices">
        {options.map((option) => {
          const checked = values.includes(option.value);
          return (
            <label
              key={option.value}
              className={`join-us-form__choice${checked ? " is-checked" : ""}`}
            >
              <input
                type="checkbox"
                value={option.value}
                checked={checked}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? options.filter((o) => o.value === option.value || values.includes(o.value)).map((o) => o.value)
                      : values.filter((v) => v !== option.value)
                  )
                }
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
      <FieldError id={id} error={error} />
    </fieldset>
  );
}

export function CountedTextarea({
  id,
  label,
  required,
  hint,
  error,
  value,
  onChange,
  max = TEXT_LIMIT,
  rows = 3,
}: {
  id: string;
  label: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  max?: number;
  rows?: number;
}) {
  return (
    <Field id={id} label={label} required={required} hint={hint} error={error}>
      <textarea
        {...inputProps(id, error, hint)}
        rows={rows}
        maxLength={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="join-us-form__textarea join-us-form__textarea--short"
      />
      <span className="join-us-form__counter" aria-live="polite">
        {value.length}/{max}
      </span>
    </Field>
  );
}

export function PhoneInput({
  id,
  value,
  onChange,
  error,
  hint,
  required,
}: {
  id: string;
  value: PhoneValue;
  onChange: (value: PhoneValue) => void;
  error?: string;
  hint?: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="join-us-form__phone">
      <select
        aria-label="Country code"
        value={value.code}
        onChange={(e) => onChange({ ...value, code: e.target.value })}
        className="join-us-form__select join-us-form__phone-code"
      >
        {COUNTRY_CODES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <input
        {...inputProps(id, error, hint)}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        required={required}
        placeholder={value.code === "+92" ? "3XX XXXXXXX" : "Phone number"}
        value={value.number}
        onChange={(e) => onChange({ ...value, number: e.target.value })}
        className="join-us-form__input"
      />
    </div>
  );
}
