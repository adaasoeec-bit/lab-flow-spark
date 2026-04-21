import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";

interface RowActionsProps {
  table:
    | "equipment"
    | "consumables"
    | "lab_sessions"
    | "maintenance_logs"
    | "safety_inspections"
    | "technician_activities";
  id: string;
  invalidateKey: string;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: () => void;
  itemLabel?: string;
}

export function RowActions({
  table,
  id,
  invalidateKey,
  canEdit,
  canDelete,
  onEdit,
  itemLabel = "record",
}: RowActionsProps) {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from(table).delete().eq("id", id);
    setDeleting(false);
    if (error) return toast.error(error.message);
    toast.success(`${itemLabel} deleted`);
    queryClient.invalidateQueries({ queryKey: [invalidateKey] });
  };

  if (!canEdit && !canDelete) return null;

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {canEdit && (
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}
      {canDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {itemLabel}?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The {itemLabel} will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
