
import React from "react";
import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function StatusField() {
  const form = useFormContext();
  
  return (
    <FormField
      control={form.control}
      name="status"
      render={({ field }) => (
        <FormItem>
          <FormLabel>סטטוס מוצר</FormLabel>
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="בחר סטטוס" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="publish">מפורסם</SelectItem>
              <SelectItem value="draft">טיוטה</SelectItem>
              <SelectItem value="pending">ממתין לאישור</SelectItem>
              <SelectItem value="private">פרטי</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
