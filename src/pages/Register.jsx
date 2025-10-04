import React from 'react'
import { Link } from 'react-router-dom'
import bg from '../assets/mountains.svg'

export default function Register() {
  return (
    <div className="relative min-h-[calc(100vh-64px-64px)]">
      <img src={bg} alt="mountains" className="absolute inset-0 h-full w-full object-cover opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-b from-startx-200/40 via-startx-600/20 to-startx-900/40" />

      <div className="relative mx-auto grid max-w-7xl place-items-center px-4 py-12 sm:px-6">
        <div className="glass w-full max-w-md rounded-3xl p-6 sm:p-8">
          <h1 className="text-center text-2xl font-bold text-white drop-shadow">Create account</h1>

          <form className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/90">Full name</label>
              <input type="text" className="mt-1 w-full rounded-xl border border-white/40 bg-white/80 px-3 py-2 text-slate-900 placeholder-slate-500 focus:border-startx-300 focus:outline-none focus:ring-2 focus:ring-startx-200" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90">Email</label>
              <input type="email" className="mt-1 w-full rounded-xl border border-white/40 bg-white/80 px-3 py-2 text-slate-900 placeholder-slate-500 focus:border-startx-300 focus:outline-none focus:ring-2 focus:ring-startx-200" placeholder="you@example.com" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-white/90">Password</label>
                <input type="password" className="mt-1 w-full rounded-xl border border-white/40 bg-white/80 px-3 py-2 text-slate-900 placeholder-slate-500 focus:border-startx-300 focus:outline-none focus:ring-2 focus:ring-startx-200" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90">Confirm</label>
                <input type="password" className="mt-1 w-full rounded-xl border border-white/40 bg-white/80 px-3 py-2 text-slate-900 placeholder-slate-500 focus:border-startx-300 focus:outline-none focus:ring-2 focus:ring-startx-200" placeholder="••••••••" />
              </div>
            </div>
            <button type="button" className="btn-primary w-full bg-white text-startx-700 hover:bg-slate-100">Create account</button>
          </form>

          <p className="mt-4 text-center text-sm text-white/90">
            Already have an account? <Link to="/login" className="font-semibold text-white">Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}


