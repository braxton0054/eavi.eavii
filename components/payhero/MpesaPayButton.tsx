'use client'

import React, { useState } from 'react'
import PayHeroModal from './PayHeroModal'

interface MpesaPayButtonProps {
  applicationId: string
  installmentId?: string
  amount: number
  studentName: string
  paybillNo: string
  disabled?: boolean
  onPaymentSuccess?: () => void
}

export default function MpesaPayButton({
  applicationId,
  installmentId,
  amount,
  studentName,
  paybillNo,
  disabled = false,
  onPaymentSuccess,
}: MpesaPayButtonProps) {
  const [showModal, setShowModal] = useState(false)

  const handleSuccess = () => {
    setShowModal(false)
    if (onPaymentSuccess) {
      onPaymentSuccess()
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={disabled}
        style={{
          background: disabled
            ? 'rgba(99,102,241,0.3)'
            : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          padding: '10px 18px',
          fontSize: 13,
          fontWeight: 700,
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          whiteSpace: 'nowrap',
        }}
      >
        📱 Pay via M-Pesa
      </button>

      <PayHeroModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
        applicationId={applicationId}
        installmentId={installmentId}
        amount={amount}
        studentName={studentName}
        paybillNo={paybillNo}
      />
    </>
  )
}
