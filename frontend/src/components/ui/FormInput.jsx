
export default function FormInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  hint,
  options = [],
  rows = 3,
  disabled = false,
  min,
  max,
  step,
  className = '',
}) {
  const inputId = `field-${name}`;
  const baseClass = `w-full min-h-12 rounded-lg border bg-white px-4 py-3 text-base text-[#1E293B] placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 ${
    error
      ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
      : 'border-[#E2E8F0] focus:border-[#00DCE5] focus:ring-[#00DCE5]/20'
  } ${disabled ? 'bg-[#F8FAFC] text-[#64748B] cursor-not-allowed' : ''}`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-[#24352F]"
        >
          {label}
          {required && <span className="text-red-600 ml-0.5">*</span>}
        </label>
      )}

      {type === 'select' ? (
        <select
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={baseClass}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          className={baseClass}
        />
      ) : (
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={baseClass}
        />
      )}

      {error && (
        <p className="text-sm text-red-700 font-semibold" role="alert">
          {error}
        </p>
      )}
      {!error && hint && <p className="text-sm text-[#64748B]">{hint}</p>}
    </div>
  );
}
