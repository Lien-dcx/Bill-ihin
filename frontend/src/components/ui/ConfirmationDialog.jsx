import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  children,
  confirmDisabled = false,
}) {
  const isDanger = variant === 'danger';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white text-sm font-medium text-[#1E293B] hover:bg-[#F8FAFC] transition-colors whitespace-nowrap shrink-0"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-[#00DCE5] hover:bg-[#00c4cc] text-[#1E293B]'
            }`}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${
            isDanger
              ? 'bg-red-50 border-red-200 text-red-600'
              : 'bg-[#E6FBFC] border-[#00DCE5]/40 text-[#0E7490]'
          }`}
          aria-hidden="true"
        >
          {isDanger ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <CheckCircle2 className="w-5 h-5" />
          )}
        </div>
        <div className="space-y-2 flex-1 min-w-0">
          <p className="text-sm text-[#1E293B] leading-relaxed">{message}</p>
          {children}
        </div>
      </div>
    </Modal>
  );
}
