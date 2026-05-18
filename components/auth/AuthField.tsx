type AuthFieldProps = {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  placeholder: string;
};

export function AuthField({
  id,
  label,
  type,
  autoComplete,
  value,
  onChange,
  disabled,
  placeholder,
}: AuthFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-body text-sm text-ivory/70">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="glass-input min-h-11 w-full rounded-xl px-4 py-2.5 font-body text-base text-lily placeholder:text-lily/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-glow/50 disabled:opacity-60"
      />
    </div>
  );
}
