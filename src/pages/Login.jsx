import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import bg from '../assets/mountains.svg'

export default function Login() {
  const navigate = useNavigate()
  const onSubmit = (e) => {
    e.preventDefault()
    navigate('/')
  }
  return (
    <div className="relative min-h-[calc(100vh-64px-64px)]">
      <img src={bg} alt="mountains" className="absolute inset-0 h-full w-full object-cover opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-b from-startx-200/40 via-startx-600/20 to-startx-900/40" />

      <div className="relative mx-auto grid max-w-7xl place-items-center px-4 py-12 sm:px-6">
        <div className="glass w-full max-w-md overflow-hidden rounded-3xl p-0">
          <div className="bg-gradient-to-tr from-startx-600 via-accent-500 to-startx-500 p-6 sm:p-8 text-white">
            <h2 className="text-2xl font-extrabold">Welcome back</h2>
            <p className="mt-1 text-sm text-white/90">Log in to continue to STARTX</p>
          </div>
          <div className="p-6 sm:p-8">
            <h1 className="mb-2 text-center text-sm font-semibold text-slate-600">LOG IN</h1>

            <form className="mt-2 space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input type="email" className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-500 focus:border-startx-300 focus:outline-none focus:ring-2 focus:ring-startx-200" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <input type="password" className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-500 focus:border-startx-300 focus:outline-none focus:ring-2 focus:ring-startx-200" placeholder="••••••••" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 text-slate-600">
                  <input type="checkbox" className="rounded border-slate-300 text-startx-600 focus:ring-startx-300" />
                  Remember me
                </label>
                <a href="#" className="text-startx-700 hover:underline">Forgot password?</a>
              </div>
              <button type="submit" className="btn-primary w-full">Login</button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-600">
              Don’t have an account? <Link to="/register" className="font-semibold text-startx-700">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


