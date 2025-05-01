
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function ProductNotSavedAlert() {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>יש לשמור את המוצר תחילה</AlertTitle>
      <AlertDescription>
        לפני עדכון פרטי מלאי, יש לשמור את המוצר בלשונית "פרטים כלליים".
      </AlertDescription>
    </Alert>
  );
}
