
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

interface PriceFieldProps {
  name: "price" | "sale_price";
  label: string;
  placeholder?: string;
  disabled?: boolean;
  helpText?: string;
}

export function PriceField({ name, label, placeholder, disabled, helpText }: PriceFieldProps) {
  const form = useFormContext();
  
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">₪</span>
              <Input
                type="number"
                step="0.01"
                {...field}
                className="pl-8"
                placeholder={placeholder}
                disabled={disabled}
              />
            </div>
          </FormControl>
          {helpText && disabled && (
            <p className="text-sm text-muted-foreground">{helpText}</p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
