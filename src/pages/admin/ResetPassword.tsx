import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ResetPassword() {
  const [userId, setUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // בדיקה אם המשתמש הוא admin
    if (!authLoading && !isAdmin) {
      toast({
        variant: "destructive",
        title: "אין הרשאה",
        description: "רק מנהלי מערכת יכולים לאפס סיסמאות",
      });
      navigate("/");
    }
  }, [isAdmin, authLoading, navigate, toast]);

  const handleResetPassword = async () => {
    if (!isAdmin) {
      toast({
        variant: "destructive",
        title: "אין הרשאה",
        description: "רק מנהלי מערכת יכולים לאפס סיסמאות",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-user-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ userId, newPassword }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reset password");
      }

      const result = await response.json();
      
      toast({
        title: "הסיסמה אופסה בהצלחה",
        description: `הסיסמה החדשה: ${newPassword}`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Shell>
        <div className="container max-w-2xl py-8 text-center">
          <p>טוען...</p>
        </div>
      </Shell>
    );
  }

  if (!isAdmin) {
    return (
      <Shell>
        <div className="container max-w-2xl py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>אין הרשאה</AlertTitle>
            <AlertDescription>
              רק מנהלי מערכת יכולים לגשת לעמוד זה
            </AlertDescription>
          </Alert>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="container max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>איפוס סיסמה</CardTitle>
            <CardDescription>
              אפשר לאפס סיסמה למשתמש (רק למנהלי מערכת)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">מזהה משתמש (User ID)</Label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="הכנס UUID של המשתמש"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">סיסמה חדשה</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="הכנס סיסמה חדשה (לפחות 6 תווים)"
              />
            </div>

            <Button
              onClick={handleResetPassword}
              disabled={loading || !userId || !newPassword}
              className="w-full"
            >
              {loading ? "מאפס..." : "אפס סיסמה"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
