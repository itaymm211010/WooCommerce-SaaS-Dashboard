
import { cn } from "@/lib/utils";

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-[#F97316] text-white';
    case 'processing':
      return 'bg-[#0EA5E9] text-white';
    case 'completed':
      return 'bg-[#22C55E] text-white';
    case 'on-hold':
      return 'bg-[#EAB308] text-white';
    case 'cancelled':
    case 'failed':
      return 'bg-[#EA384C] text-white';
    case 'refunded':
      return 'bg-[#A855F7] text-white';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      'px-2 py-1 rounded-full text-xs font-medium',
      getStatusColor(status)
    )}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
