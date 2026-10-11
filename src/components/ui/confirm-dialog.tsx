import { Dialog } from './dialog';
import { Button } from './button';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) => {
  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const variantStyles = {
    danger: 'bg-error hover:bg-error-hover',
    warning: 'bg-warning hover:bg-warning-hover',
    info: 'bg-primary hover:bg-primary-hover',
  };

  return (
    <Dialog open={open} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isLoading}
            className={variantStyles[variant]}
          >
            {isLoading ? 'İşleniyor...' : confirmText}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export { ConfirmDialog };
