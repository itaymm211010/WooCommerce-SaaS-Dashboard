import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, KeyRound, Shield } from "lucide-react";
import { EditUserDialog } from "./EditUserDialog";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
import { ChangeRoleDialog } from "./ChangeRoleDialog";

interface User {
  id: string;
  email: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
  user_roles: Array<{
    role: string;
  }>;
}

interface UsersTableProps {
  users: User[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function UsersTable({ users, isLoading, onRefresh }: UsersTableProps) {
  const [editUser, setEditUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [changeRoleUser, setChangeRoleUser] = useState<User | null>(null);

  if (isLoading) {
    return <div className="text-center py-8">טוען...</div>;
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם מלא</TableHead>
              <TableHead>אימייל</TableHead>
              <TableHead>טלפון</TableHead>
              <TableHead>תפקידים</TableHead>
              <TableHead className="text-left">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  אין משתמשים
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    {user.profiles?.first_name || user.profiles?.last_name
                      ? `${user.profiles.first_name || ""} ${user.profiles.last_name || ""}`
                      : "-"}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.profiles?.phone || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {user.user_roles.length > 0 ? (
                        user.user_roles.map((role, idx) => (
                          <Badge key={idx} variant="secondary">
                            {role.role}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline">אין תפקיד</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditUser(user)}
                        title="ערוך פרטים"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setResetPasswordUser(user)}
                        title="אפס סיסמה"
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setChangeRoleUser(user)}
                        title="שנה תפקיד"
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditUserDialog
        user={editUser}
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
        onSuccess={onRefresh}
      />

      <ResetPasswordDialog
        user={resetPasswordUser}
        open={!!resetPasswordUser}
        onOpenChange={(open) => !open && setResetPasswordUser(null)}
      />

      <ChangeRoleDialog
        user={changeRoleUser}
        open={!!changeRoleUser}
        onOpenChange={(open) => !open && setChangeRoleUser(null)}
        onSuccess={onRefresh}
      />
    </>
  );
}
