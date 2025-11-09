import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { Card } from "@/components/ui/card";

interface AuditFiltersProps {
  tableName: string;
  setTableName: (value: string) => void;
  action: string;
  setAction: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  userEmail: string;
  setUserEmail: (value: string) => void;
  onReset: () => void;
}

const TABLES = [
  { value: 'stores', label: 'Stores (Critical)' },
  { value: 'user_roles', label: 'User Roles (Critical)' },
  { value: 'orders', label: 'Orders (High)' },
  { value: 'store_users', label: 'Store Users (High)' },
  { value: 'webhooks', label: 'Webhooks (High)' },
  { value: 'bug_reports', label: 'Bug Reports (High)' },
  { value: 'products', label: 'Products (Medium)' },
  { value: 'deployments', label: 'Deployments (Medium)' },
  { value: 'profiles', label: 'Profiles (Medium)' },
  { value: 'store_categories', label: 'Categories (Low)' },
  { value: 'store_brands', label: 'Brands (Low)' },
  { value: 'store_tags', label: 'Tags (Low)' },
];

const ACTIONS = [
  { value: 'INSERT', label: 'Insert' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
];

export function AuditFilters({
  tableName,
  setTableName,
  action,
  setAction,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  userEmail,
  setUserEmail,
  onReset,
}: AuditFiltersProps) {
  const hasFilters = tableName || action || startDate || endDate || userEmail;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Filters</h3>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Table Filter */}
        <div className="space-y-2">
          <Label htmlFor="table-filter">Table</Label>
          <Select value={tableName} onValueChange={setTableName}>
            <SelectTrigger id="table-filter">
              <SelectValue placeholder="All tables" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tables</SelectItem>
              {TABLES.map((table) => (
                <SelectItem key={table.value} value={table.value}>
                  {table.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action Filter */}
        <div className="space-y-2">
          <Label htmlFor="action-filter">Action</Label>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger id="action-filter">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {ACTIONS.map((act) => (
                <SelectItem key={act.value} value={act.value}>
                  {act.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* User Email Filter */}
        <div className="space-y-2">
          <Label htmlFor="user-email">User Email</Label>
          <Input
            id="user-email"
            placeholder="user@example.com"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
          />
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <Label htmlFor="start-date">Start Date</Label>
          <Input
            id="start-date"
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label htmlFor="end-date">End Date</Label>
          <Input
            id="end-date"
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
    </Card>
  );
}
