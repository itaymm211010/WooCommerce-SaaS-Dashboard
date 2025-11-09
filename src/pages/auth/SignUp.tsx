
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function SignUp() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // בדיקת תקינות סיסמה
    if (password !== confirmPassword) {
      toast.error("הסיסמאות אינן תואמות");
      return;
    }
    
    if (password.length < 6) {
      toast.error("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }
    
    setLoading(true);

    try {
      // הרשמת המשתמש
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      });

      if (error) throw error;

      // בדיקה אם נדרש אימות מייל
      // אם user קיים ו-session קיים, אימות מייל לא נדרש
      if (data.user && data.session) {
        toast.success("נרשמת בהצלחה! מעביר אותך לדף הבית...");
        setTimeout(() => navigate("/"), 1500);
      } else if (data.user && !data.session) {
        // המשתמש נוצר אך נדרש אימות מייל
        toast.info("נשלח אימייל אימות לכתובת שהזנת");
        toast.info("אנא לחץ על הקישור באימייל כדי להשלים את ההרשמה", {
          duration: 8000,
        });
      } else {
        toast.info("נשלח אימייל אימות, אנא בדוק את תיבת הדואר שלך");
      }
    } catch (error: any) {
      let errorMessage = "שגיאה בהרשמה";
      if (error.message) {
        if (error.message.includes("already registered")) {
          errorMessage = "כתובת האימייל כבר רשומה במערכת";
        } else {
          errorMessage = error.message;
        }
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">הרשמה</CardTitle>
          <CardDescription>
            צור חשבון חדש למערכת
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">שם פרטי</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">שם משפחה</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">אימות סיסמה</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "מבצע רישום..." : "הרשם"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p>
              כבר יש לך חשבון?{" "}
              <Link to="/auth/signin" className="text-primary underline underline-offset-4">
                התחברות
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
