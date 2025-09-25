import React from 'react'

export default function Modal({ title, children, onClose, onSave, saveLabel = 'Save', widthClass = 'max-w-2xl' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative w-full ${widthClass} bg-white rounded-lg shadow-xl overflow-hidden`}>
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>
        <div className="p-5">
          {children}
        </div>
        <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50">
          <button onClick={onClose} className="btn-outline">Cancel</button>
          {onSave && <button onClick={onSave} className="btn">{saveLabel}</button>}
        </div>
      </div>
    </div>
  )
}


