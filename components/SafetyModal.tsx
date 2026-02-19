/**
 * Safety Modal Component
 * Phase 5: Fat Finger Protection
 * 
 * Implements three levels of protection:
 * - Level 1: Standard confirmation
 * - Level 2: High risk with delay
 * - Level 3: Nuclear option with text verification
 */

'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export type SafetyLevel = 'standard' | 'high-risk' | 'nuclear';

interface SafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  level: SafetyLevel;
  title: string;
  message: string;
  confirmText?: string;
  verificationWord?: string; // For nuclear level
  warningDetails?: string;
}

export default function SafetyModal({
  isOpen,
  onClose,
  onConfirm,
  level,
  title,
  message,
  confirmText = 'Confirm',
  verificationWord = '',
  warningDetails,
}: SafetyModalProps) {
  const [countdown, setCountdown] = useState(level === 'high-risk' ? 3 : 0);
  const [verificationInput, setVerificationInput] = useState('');
  const [canConfirm, setCanConfirm] = useState(level === 'standard');

  useEffect(() => {
    if (!isOpen) {
      setCountdown(level === 'high-risk' ? 3 : 0);
      setVerificationInput('');
      setCanConfirm(level === 'standard');
      return;
    }

    if (level === 'high-risk' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
        if (countdown === 1) {
          setCanConfirm(true);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, level, countdown]);

  useEffect(() => {
    if (level === 'nuclear' && verificationInput.toUpperCase() === verificationWord.toUpperCase()) {
      setCanConfirm(true);
    } else if (level === 'nuclear') {
      setCanConfirm(false);
    }
  }, [verificationInput, verificationWord, level]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm();
      onClose();
    }
  };

  const getBorderColor = () => {
    switch (level) {
      case 'high-risk':
        return 'border-red-500';
      case 'nuclear':
        return 'border-red-600';
      default:
        return 'border-gray-700';
    }
  };

  const getBackgroundColor = () => {
    switch (level) {
      case 'nuclear':
        return 'bg-red-900/20';
      default:
        return 'bg-gray-900';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className={`${getBackgroundColor()} border ${getBorderColor()} rounded-lg p-6 w-full max-w-md space-y-4 shadow-2xl ${
          level === 'nuclear' ? 'animate-pulse-slow' : ''
        }`}
      >
        {/* Icon */}
        <div className="flex items-center gap-3">
          {level !== 'standard' && (
            <div className={`${level === 'nuclear' ? 'text-red-500' : 'text-yellow-500'}`}>
              <AlertTriangle className="w-8 h-8" />
            </div>
          )}
          <h2
            className={`text-xl font-bold ${
              level === 'nuclear' ? 'text-red-400' : level === 'high-risk' ? 'text-yellow-400' : 'text-white'
            }`}
          >
            {title}
          </h2>
        </div>

        {/* Message */}
        <p className="text-gray-300 text-sm whitespace-pre-line">{message}</p>

        {/* Warning Details */}
        {warningDetails && (
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3 text-xs text-yellow-300">
            {warningDetails}
          </div>
        )}

        {/* Nuclear Level - Text Verification */}
        {level === 'nuclear' && verificationWord && (
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Type <span className="font-mono text-red-400 font-bold">{verificationWord}</span> to confirm:
            </p>
            <input
              type="text"
              value={verificationInput}
              onChange={(e) => setVerificationInput(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder={`Type ${verificationWord}...`}
              autoFocus
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
              canConfirm
                ? level === 'nuclear'
                  ? 'bg-red-600 border border-red-500 text-white hover:bg-red-500'
                  : 'bg-blue-600 border border-blue-500 text-white hover:bg-blue-500'
                : 'bg-gray-700 border border-gray-600 text-gray-500 cursor-not-allowed'
            } ${!canConfirm && level === 'high-risk' ? 'flex items-center gap-2' : ''}`}
          >
            {!canConfirm && level === 'high-risk' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Wait {countdown}s
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
