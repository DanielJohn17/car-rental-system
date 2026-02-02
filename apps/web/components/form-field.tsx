"use client";

import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export function FormField({
  id,
  label,
  type = "text",
  value,
  onChange,
  required = false,
  className = "",
  placeholder,
}: FormFieldProps) {
  const isInvalid = required && !value;
  
  return (
    <div className={`grid gap-2 ${className}`}>
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={isInvalid ? "border-destructive" : ""}
      />
    </div>
  );
}
