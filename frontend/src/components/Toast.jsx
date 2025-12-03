import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
    useEffect(() => {
        if (duration) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-500" />,
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
        warning: <AlertCircle className="w-5 h-5 text-yellow-500" />
    };

    const bgColors = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        info: 'bg-blue-50 border-blue-200',
        warning: 'bg-yellow-50 border-yellow-200'
    };

    return (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg transition-all transform animate-slide-up ${bgColors[type] || bgColors.info}`}>
            {icons[type] || icons.info}
            <p className="text-sm font-medium text-slate-800">{message}</p>
            <button
                onClick={onClose}
                className="p-1 hover:bg-black/5 rounded-full transition-colors"
            >
                <X className="w-4 h-4 text-slate-500" />
            </button>
        </div>
    );
};

export default Toast;
