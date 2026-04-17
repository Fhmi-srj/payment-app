import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';

/**
 * Shared Modal component rendered via React Portal (outside component tree).
 * Features smooth pop-in and pop-out animations.
 *
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {function} onClose - Called when backdrop is clicked or close is triggered
 * @param {string} [maxWidth='max-w-lg'] - Tailwind max-width class
 * @param {React.ReactNode} children - Modal content
 */
function Modal({ isOpen, onClose, children, maxWidth = 'max-w-lg' }) {
    const [visible, setVisible] = useState(false);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setVisible(true);
            requestAnimationFrame(() => setAnimating(true));
        } else if (visible) {
            // Trigger close animation
            setAnimating(false);
            const timer = setTimeout(() => setVisible(false), 250);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleClose = useCallback(() => {
        setAnimating(false);
        setTimeout(() => {
            onClose();
        }, 250);
    }, [onClose]);

    if (!visible) return null;

    return ReactDOM.createPortal(
        <div
            className={`modal-portal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-250 ${animating ? 'bg-black/50 opacity-100' : 'bg-black/0 opacity-0'}`}
            style={{ transitionDuration: '250ms' }}
            onClick={handleClose}
        >
            <div
                className={`bg-white rounded-xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto shadow-2xl transition-all ${animating ? 'modal-pop-in' : 'modal-pop-out'}`}
                onClick={e => e.stopPropagation()}
            >
                {children}
            </div>
        </div>,
        document.body
    );
}

export default Modal;
