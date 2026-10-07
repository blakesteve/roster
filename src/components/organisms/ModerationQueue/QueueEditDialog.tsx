import { Dialog } from "../Dialog/Dialog";
import type { QueueSurfaceProps } from "./queue-actions";

/**
 * Shows a queue's edit step in a Dialog, for a form with more than a field or
 * two. Pass it as the edit's `surface`. A separate export, so a queue that
 * never edits in a Dialog never ships one.
 */
function QueueEditDialog({
  open,
  title,
  description,
  busy,
  onCancel,
  onAfterClose,
  children,
  submitButton,
  cancelButton,
}: QueueSurfaceProps) {
  return (
    <Dialog
      isOpen={open}
      /* Not while a decision is in flight: closing then would leave its
         outcome with nowhere to show. */
      onClose={busy ? () => {} : onCancel}
      title={title}
      description={description}
      size="lg"
      onAfterClose={onAfterClose}
    >
      <div className="rst:flex rst:flex-col rst:gap-6">
        {children}
        <div className="rst:flex rst:flex-wrap rst:justify-end rst:gap-2">
          {cancelButton}
          {submitButton}
        </div>
      </div>
    </Dialog>
  );
}

export { QueueEditDialog };
