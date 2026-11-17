'use client';

import React from 'react';
import { RotateCcw, Trash2, AlertCircle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Lanjutkan',
  cancelText = 'Batal',
  type = 'warning',
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      badgeBg: 'bg-rose-500 text-white',
      icon: Trash2,
      btnBg: 'bg-rose-500 hover:bg-rose-600 text-white',
    },
    warning: {
      badgeBg: 'bg-pastel-butter text-brutal',
      icon: RotateCcw,
      btnBg: 'bg-pastel-butter hover:bg-yellow-300 text-brutal',
    },
    info: {
      badgeBg: 'bg-pastel-matcha text-brutal',
      icon: AlertCircle,
      btnBg: 'bg-pastel-matcha hover:bg-emerald-300 text-brutal',
    },
  }[type];

  const Icon = typeConfig.icon;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl border-3 border-brutal p-5 sm:p-6 shadow-neo-xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl border-2 border-brutal ${typeConfig.badgeBg} shadow-neo-sm shrink-0`}>
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="pill-badge bg-brutal text-white text-[9px] mb-1">
                🏛️ ATR/BPN MEDAN
              </span>
              <h3 className="text-sm sm:text-base font-black text-brutal leading-tight">
                {title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl border-2 border-brutal bg-gray-100 hover:bg-gray-200 text-brutal transition shrink-0"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs sm:text-sm font-bold text-gray-700 mb-6 leading-relaxed bg-canvas p-3 sm:p-3.5 rounded-2xl border-2 border-brutal/20">
          {message}
        </p>

        <div className="flex items-center gap-2.5 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="neo-btn bg-white hover:bg-gray-100 text-brutal px-4 py-2 text-xs font-black flex-1 sm:flex-none justify-center"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`neo-btn ${typeConfig.btnBg} px-5 py-2 text-xs font-black flex-1 sm:flex-none justify-center shadow-neo-sm`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
