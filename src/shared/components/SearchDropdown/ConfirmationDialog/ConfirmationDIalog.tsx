type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmationDialog({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="customer-modal">
        <h2>{title}</h2>

        <p
          style={{
            marginTop: 15,
            color: "#64748B",
          }}
        >
          {description}
        </p>

        <div className="modal-buttons">
          <button onClick={onCancel}>
            {cancelText}
          </button>

          <button onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}