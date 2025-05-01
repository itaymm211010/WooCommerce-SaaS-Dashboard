
import React from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface TextFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}

export function TextField({ 
  name, 
  label, 
  placeholder,
  multiline = false,
  rows = 2 
}: TextFieldProps) {
  const form = useFormContext();
  
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {multiline ? (
              <Textarea
                {...field}
                placeholder={placeholder}
                rows={rows}
              />
            ) : (
              <Input {...field} placeholder={placeholder} />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
