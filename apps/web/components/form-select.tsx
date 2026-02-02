"use client";

import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface FormSelectProps {
  id?: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: string[] | { id: string; name: string }[];
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export function FormSelect({
  id,
  label,
  value,
  onValueChange,
  options,
  required = false,
  className = "",
  placeholder = "Select option",
}: FormSelectProps) {
  const isInvalid = required && !value;
  
  return (
    <div className={`grid gap-2 ${className}`}>
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={isInvalid ? "border-destructive" : ""}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => {
            // Handle both string and object options
            const isObject = typeof option === 'object' && option !== null && 'id' in option;
            const optionKey = isObject ? (option as { id: string; name: string }).id : option;
            const optionText = isObject ? (option as { id: string; name: string }).name : option;
            
            return (
              <SelectItem key={String(optionKey)} value={String(optionKey)}>
                {String(optionText)}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
