import React, { useState, useRef, useEffect, useCallback } from 'react'

const Modal = React.forwardRef(function Modal(
  { 
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    className = '',
    closeOnBackdrop = true,
    ...props 
  },
  ref
) {
  const modalRef = useRef(null)
  const previousActiveElement = useRef(null)

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full',
  }

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape' && closeOnBackdrop) {
      onClose?.()
    }
  }, [onClose, closeOnBackdrop])

  useEffect(() => {
    if (isOpen && modalRef.current) {
      previousActiveElement.current = document.activeElement
      modalRef.current.focus()
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      if (previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  const handleBackdropClick = (event) => {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      onClose?.()
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      {...props}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
      
      <div
        ref={modalRef}
        tabIndex={-1}
        className={"relative bg-surface-container-high/40 backdrop-blur-2xl border border-outline-variant/30 rounded-2xl shadow-glass w-full " + sizes[size] + " focus:outline-none " + className}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between gap-4 p-6 border-b border-outline-variant/30">
            <h2 className="text-xl font-semibold text-on-surface meta-label">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}
        
        <div className="p-6">
          {children}
        </div>
        
        {footer && (
          <div className="flex justify-end gap-3 p-6 border-t border-outline-variant/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
})

export default Modal
