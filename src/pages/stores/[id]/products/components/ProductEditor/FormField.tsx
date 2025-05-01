
import React from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField as UIFormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type FieldOption = {
  label: string;
  value: string;
};

interface FormFieldProps {
  name: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "checkbox" | "radio" | "price";
  placeholder?: string;
  options?: FieldOption[];
  rows?: number;
  direction?: "row" | "column";
}

export function FormField({ 
  name, 
  label, 
  type = "text",
  placeholder,
  options = [],
  rows = 3,
  direction = "column"
}: FormFieldProps) {
  const form = useFormContext();
  
  return (
    <UIFormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={direction === "row" ? "flex flex-row items-center gap-2" : ""}>
          <FormLabel className={direction === "row" ? "min-w-32" : ""}>
            {label}
          </FormLabel>
          <FormControl>
            {type === "textarea" && (
              <Textarea
                {...field}
                placeholder={placeholder}
                rows={rows}
                value={field.value || ""}
              />
            )}
            {type === "select" && (
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <SelectTrigger>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {type === "checkbox" && (
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
            {type === "radio" && (
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex flex-col space-y-1"
              >
                {options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2 rtl:space-x-reverse">
                    <RadioGroupItem value={option.value} id={`${name}-${option.value}`} />
                    <Label htmlFor={`${name}-${option.value}`}>{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}
            {type === "price" && (
              <div className="relative">
                <span className="absolute left-3 top-2.5">₪</span>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  className="pl-8"
                  placeholder={placeholder}
                  value={field.value || ""}
                />
              </div>
            )}
            {(type === "text" || type === "number") && (
              <Input
                {...field}
                type={type}
                placeholder={placeholder}
                value={field.value || ""}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
