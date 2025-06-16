"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Button from "@/components/button"
import { X, Send, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Address, Hash, parseEther } from "viem"

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (transaction: {
    to: Address
    value?: bigint
    data?: `0x${string}`
  }) => Promise<Hash>
  walletAddress: Address
  balance: string
}

interface TransactionStatus {
  step: 'input' | 'confirming' | 'pending' | 'success' | 'error'
  message: string
  hash?: Hash
}

export default function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  walletAddress,
  balance
}: TransactionModalProps) {
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [data, setData] = useState("")
  const [status, setStatus] = useState<TransactionStatus>({
    step: 'input',
    message: 'Enter transaction details'
  })

  const resetForm = () => {
    setRecipient("")
    setAmount("")
    setData("")
    setStatus({ step: 'input', message: 'Enter transaction details' })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const validateForm = () => {
    if (!recipient) {
      throw new Error('Recipient address is required')
    }
    if (!recipient.startsWith('0x') || recipient.length !== 42) {
      throw new Error('Invalid recipient address format')
    }
    if (amount && amount.trim() !== '') {
      const amountNumber = parseFloat(amount)
      if (isNaN(amountNumber) || amountNumber <= 0) {
        throw new Error('Amount must be a valid number greater than 0')
      }
      if (amountNumber > parseFloat(balance)) {
        throw new Error('Insufficient balance')
      }
    }
  }

  const handleSubmit = async () => {
    try {
      setStatus({ step: 'confirming', message: 'Validating transaction...' })
      
      validateForm()

      const transaction = {
        to: recipient as Address,
        value: amount && amount.trim() !== '' ? parseEther(amount) : undefined,
        data: data && data.trim() !== '' ? (data as `0x${string}`) : undefined,
      }

      setStatus({ step: 'pending', message: 'Submitting transaction...' })

      const hash = await onSubmit(transaction)

      setStatus({ 
        step: 'success', 
        message: 'Transaction successful!',
        hash 
      })

      // Auto-close after 3 seconds
      setTimeout(() => {
        handleClose()
      }, 3000)

    } catch (error) {
      console.error('Transaction failed:', error)
      setStatus({ 
        step: 'error', 
        message: error instanceof Error ? error.message : 'Transaction failed'
      })
    }
  }

  const getStatusIcon = () => {
    switch (status.step) {
      case 'confirming':
      case 'pending':
        return <Loader2 className="w-6 h-6 animate-spin text-[var(--gradient-start)]" />
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />
      default:
        return <Send className="w-6 h-6 text-[var(--gradient-start)]" />
    }
  }

  const isFormDisabled = status.step !== 'input'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-panel p-6 w-full max-w-md mx-4 relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <h2 className="text-xl font-bold text-white/90">Send Transaction</h2>
              </div>
              <button
                onClick={handleClose}
                disabled={status.step === 'pending'}
                className="p-1 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Status Message */}
            <div className="mb-4 p-3 bg-white/5 rounded-lg">
              <p className="text-sm text-white/70">{status.message}</p>
              {status.hash && (
                <p className="text-xs text-[var(--gradient-start)] mt-1 font-mono break-all">
                  {status.hash}
                </p>
              )}
            </div>

            {/* Form */}
            <div className="space-y-4 mb-6">
              {/* From Address */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  From
                </label>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-sm font-mono text-white/70 break-all">
                    {walletAddress}
                  </p>
                </div>
              </div>

              {/* Recipient */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  To Address *
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                  disabled={isFormDisabled}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[var(--gradient-start)] transition-colors disabled:opacity-50 font-mono text-sm"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Amount (IP)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    step="0.000001"
                    min="0"
                    disabled={isFormDisabled}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[var(--gradient-start)] transition-colors disabled:opacity-50"
                  />
                  <button
                    onClick={() => setAmount(balance)}
                    disabled={isFormDisabled}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-[var(--gradient-start)] hover:text-white/80 transition-colors disabled:opacity-50"
                  >
                    Max
                  </button>
                </div>
                <p className="text-xs text-white/50 mt-1">
                  Balance: {balance} IP
                </p>
              </div>

              {/* Data (Advanced) */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Data (Optional)
                </label>
                <textarea
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  placeholder="0x... (for contract interactions)"
                  disabled={isFormDisabled}
                  rows={3}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[var(--gradient-start)] transition-colors disabled:opacity-50 font-mono text-xs resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleClose}
                disabled={status.step === 'pending'}
                className="flex-1"
              >
                {status.step === 'success' ? 'Close' : 'Cancel'}
              </Button>
              {status.step !== 'success' && (
                <Button
                  onClick={handleSubmit}
                  disabled={isFormDisabled || !recipient}
                  className="flex-1"
                >
                  {status.step === 'pending' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}