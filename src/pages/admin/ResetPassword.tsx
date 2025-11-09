import { useState } from "react";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPassword() {
  const [userId, setUserId] = useState("a4480927-640d-480d-9db9-4c977125335d"); // office@smartsoftweb.com
  const [newPassword, setNewPassword] = useState("QA123456");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleResetPassword = async () => {
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
                placeholder="a4480927-640d-480d-9db9-4c977125335d"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">סיסמה חדשה</Label>
              <Input
                id="newPassword"
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="QA123456"
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
