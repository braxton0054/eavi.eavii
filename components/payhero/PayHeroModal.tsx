'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'

interface PayHeroModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  applicationId: string
  installmentId?: string
  amount: number
  studentName: string
  paybillNo: string
}

type PayHeroStatus = 'idle' | 'initiating' | 'waiting' | 'completed' | 'failed' | 'cancelled' | 'error'

export default function PayHeroModal({
  isOpen,
  onClose,
  onSuccess,
  applicationId,
  installmentId,
  amount,
  studentName,
  paybillNo,
}: PayHeroModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [status, setStatus] = useState<PayHeroStatus>('idle')
  const [error, setError] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhoneNumber('')
      setStatus('idle')
      setError('')
      setTransactionId('')
      setElapsed(0)
    }
  }, [isOpen])

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Stop polling helper
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Poll for transaction status
  const startPolling = useCallback((txId: string) => {
    stopPolling()

    // Start elapsed timer
    setElapsed(0)
    timerRef.current = setInterval(() => {
      setElapsed(prev => prev + 1)
    }, 1000)

    // Poll every 5 seconds
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/payhero/status?id=${txId}`)
        const data = await res.json()

        if (!data.success) {
          console.error('[Pay Hero] Status poll error:', data.error)
          return
        }

        const txStatus = data.transaction?.status

        if (txStatus === 'completed') {
          stopPolling()
          setStatus('completed')
          onSuccess()
        } else if (txStatus === 'failed') {
          stopPolling()
          setStatus('failed')
          setError('Payment failed. The transaction was not completed.')
        } else if (txStatus === 'cancelled') {
          stopPolling()
          setStatus('cancelled')
          setError('Payment was cancelled.')
        }
        // If still pending, keep polling
      } catch (err: any) {
        console.error('[Pay Hero] Poll error:', err)
      }
    }, 5000)
  }, [stopPolling, onSuccess])

  // Initiate STK push
  const handleInitiate = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number (e.g., 0712345678)')
      return
    }

    setStatus('initiating')
    setError('')

    try {
      const res = await fetch('/api/payments/payhero/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicationId,
          installment_id: installmentId || null,
          phone_number: phoneNumber,
          amount: amount,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setStatus('error')
        setError(data.error || 'Failed to initiate payment')
        return
      }

      setTransactionId(data.transaction_id)
      setStatus('waiting')
      startPolling(data.transaction_id)
    } catch (err: any) {
      setStatus('error')
      setError(err?.message || 'Failed to connect to payment server')
    }
  }

  // Handle modal close
  const handleClose = () => {
    stopPolling()
    onClose()
  }

  // Format elapsed time
  const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#1a1a2e',
        borderRadius: 20,
        padding: 32,
        width: '100%',
        maxWidth: 480,
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 700 }}>
            Pay via M-Pesa
          </h3>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              fontSize: 24,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            ×
          </button>
        </div>

        {/* Student info */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 12,
          padding: 14,
          marginBottom: 20,
        }}>
          <div style={{ color: '#aaa', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            Student
          </div>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{studentName}</div>
          <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
            KES {amount.toLocaleString()}
          </div>
        </div>

        {/* Paybill info */}
        <div style={{
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 12,
          padding: 14,
          marginBottom: 20,
        }}>
          <div style={{ color: '#22c55e', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            Paybill Number
          </div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 22, fontFamily: 'monospace' }}>
            {paybillNo}
          </div>
          <div style={{ color: '#888', fontSize: 11, marginTop: 4 }}>
            Funds will be received at this till number
          </div>
        </div>

        {/* Phone number input (only show when idle) */}
        {status === 'idle' && (
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              color: '#aaa',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 8,
            }}>
              Phone Number (M-Pesa)
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="0712345678"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.07)',
                border: '1.5px solid rgba(255,255,255,0.12)',
                borderRadius: 12,
                padding: '14px 16px',
                color: '#fff',
                fontSize: 16,
                fontFamily: 'monospace',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleInitiate()
              }}
            />
            <div style={{ color: '#666', fontSize: 11, marginTop: 6 }}>
              Enter the phone number to receive the M-Pesa STK push
            </div>
          </div>
        )}

        {/* Waiting state */}
        {status === 'waiting' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              border: '3px solid rgba(99,102,241,0.3)',
              borderTopColor: '#6366f1',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }} />
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
              Waiting for M-Pesa confirmation...
            </div>
            <div style={{ color: '#888', fontSize: 13 }}>
              Check your phone ({phoneNumber}) for the STK push prompt
            </div>
            <div style={{ color: '#666', fontSize: 12, marginTop: 12 }}>
              Elapsed: {formatElapsed(elapsed)}
            </div>
            <div style={{ color: '#555', fontSize: 11, marginTop: 8 }}>
              Transaction ID: {transactionId.slice(0, 8)}...
            </div>
          </div>
        )}

        {/* Initiating state */}
        {status === 'initiating' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '3px solid rgba(99,102,241,0.3)',
              borderTopColor: '#6366f1',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 12px',
            }} />
            <div style={{ color: '#aaa', fontSize: 14 }}>Sending STK push...</div>
          </div>
        )}

        {/* Success state */}
        {status === 'completed' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'rgba(34,197,94,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 28,
            }}>✓</div>
            <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              Payment Successful!
            </div>
            <div style={{ color: '#888', fontSize: 13 }}>
              KES {amount.toLocaleString()} received via M-Pesa
            </div>
          </div>
        )}

        {/* Failed / Cancelled / Error state */}
        {(status === 'failed' || status === 'cancelled' || status === 'error') && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(239,68,68,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              fontSize: 24,
            }}>✕</div>
            <div style={{ color: '#ef4444', fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
              {status === 'cancelled' ? 'Payment Cancelled' : 'Payment Failed'}
            </div>
            {error && (
              <div style={{ color: '#f87171', fontSize: 12, marginBottom: 12 }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {error && status === 'idle' && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
            color: '#f87171',
            fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          {status === 'idle' && (
            <>
              <button
                onClick={handleClose}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#aaa',
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleInitiate}
                style={{
                  flex: 2,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Send STK Push
              </button>
            </>
          )}

          {status === 'waiting' && (
            <button
              onClick={handleClose}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#aaa',
                borderRadius: 12,
                padding: 14,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close (Keep Waiting)
            </button>
          )}

          {(status === 'completed' || status === 'failed' || status === 'cancelled' || status === 'error') && (
            <>
              {(status === 'failed' || status === 'cancelled' || status === 'error') && (
                <button
                  onClick={() => {
                    setStatus('idle')
                    setError('')
                    setTransactionId('')
                  }}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: 12,
                    padding: 14,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              )}
              <button
                onClick={handleClose}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#aaa',
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {status === 'completed' ? 'Done' : 'Close'}
              </button>
            </>
          )}
        </div>

        {/* CSS animation for spinner */}
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}
