import { Sheet } from "../Sheet/Sheet";
import type { QueueSurfaceProps } from "./queue-actions";

/**
 * Shows a queue's edit step in a Sheet, for a long form that wants the room
 * on a phone. Pass it as the edit's `surface`. A separate export, so a queue
 * that never edits in a Sheet never ships one.
 *
 * The submit button goes in the Sheet's header, where its actions sit, and
 * Cancel is the Sheet's own close button, so there's one way out rather than
 * two side by side.
 */
function QueueEditSheet({
  open,
  title,
  description,
  busy,
  onCancel,
  onAfterClose,
  children,
  submitButton,
}: QueueSurfaceProps) {
  return (
    <Sheet
      isOpen={open}
      /* Not while a decision is in flight: closing then would leave its
         outcome with nowhere to show. (Sheet's own `busy` means its content
         is loading, which this isn't.) */
      onClose={busy ? () => {} : onCancel}
      title={title}
      description={description}
      actions={submitButton}
      onAfterClose={onAfterClose}
    >
      {children}
    </Sheet>
  );
}

export { QueueEditSheet };
