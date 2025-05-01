
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";

interface ProductNotSavedAlertProps {
  title?: string;
  description?: string;
  variant?: "warning" | "info";
}

export function ProductNotSavedAlert({
  title = "יש לשמור את המוצר תחילה",
  description = "לפני עדכון פרטי מלאי, יש לשמור את המוצר בלשונית \"פרטים כלליים\".",
  variant = "warning"
}: ProductNotSavedAlertProps) {
  return (
    <Alert variant={variant === "info" ? "default" : "destructive"} className="mb-4">
      {variant === "warning" ? (
        <AlertCircle className="h-4 w-4" />
      ) : (
        <Info className="h-4 w-4" />
      )}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {description}
      </AlertDescription>
    </Alert>
  );
}
