import { Button } from "@/components/ui/button";

interface ApprovalFooterProps {
  loading: boolean;
  isLocked: boolean;
  onCancel: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  status?: string;
}

/**
 * Standard footer for ARA submission dialogs.
 * Shows Cancel + Save Draft + Submit for Approval, unless the record is
 * locked (already submitted/approved and current user can't edit).
 */
export function ApprovalFooter({ loading, isLocked, onCancel, onSaveDraft, onSubmit }: ApprovalFooterProps) {
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      {!isLocked && (
        <>
          <Button type="button" variant="secondary" disabled={loading} onClick={onSaveDraft}>
            {loading ? "Saving..." : "Save Draft"}
          </Button>
          <Button type="button" disabled={loading} onClick={onSubmit}>
            {loading ? "Submitting..." : "Submit for Approval"}
          </Button>
        </>
      )}
    </div>
  );
}

export function StatusBanner({ status, rejection_reason }: { status?: string; rejection_reason?: string | null }) {
  if (!status || status === "draft") return null;
  if (status === "rejected" && rejection_reason) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
        <span className="font-medium text-destructive">Rejected:</span> {rejection_reason}
      </div>
    );
  }
  const styles: Record<string, string> = {
    submitted: "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    approved: "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400",
  };
  return (
    <div className={`rounded-md border p-3 text-sm font-mono uppercase text-xs ${styles[status] ?? ""}`}>
      Status: {status}
    </div>
  );
}
