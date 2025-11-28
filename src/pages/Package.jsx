import React from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function Package() {
  const { openAuthModal } = useAuth()
  const plans = [
    {
      name: 'Starter',
      price: 'Rs.0',
      period: 'Forever',
      features: [
        'Personalized feed',
        'Basic search and filters',
        '2 AI interview sessions/week',
      ],
      cta: 'Get started',
    },
    {
      name: 'Pro',
      price: 'Rs499',
      period: 'per month',
      features: [
        'Unlimited AI interviews',
        'Saved roles and alerts',
        'Advanced feed customizations',
        'Priority support',
      ],
      highlighted: true,
      cta: 'Try Pro',
    },
    {
      name: 'Elite',
      price: 'Rs.999',
      period: 'per month',
      features: [
        'Everything in Pro',
        '1:1 expert resume review',
        'Mock system design deep dives',
        'Application tracker integrations',
      ],
      cta: 'Go Elite',
    },
  ]

  const [checkoutPlan, setCheckoutPlan] = React.useState(null)
  const [method, setMethod] = React.useState('card')
  const [email, setEmail] = React.useState('')

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Try Premium</h1>
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.name} className={`card flex flex-col ${p.highlighted ? 'ring-2 ring-startx-400' : ''}`}>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">{p.name}</h3>
              <div className="mt-2 flex items-end gap-1">
                <span className="text-3xl font-bold text-slate-900">{p.price}</span>
                <span className="text-sm text-slate-500">{p.period}</span>
              </div>
            </div>
            <ul className="mb-4 space-y-2 text-slate-700">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2"><span>✔</span> {f}</li>
              ))}
            </ul>
            <button
              className={`mt-auto ${p.highlighted ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                if (p.name === 'Starter') {
                  openAuthModal('signin')
                  return
                }
                setCheckoutPlan(p)
              }}
            >
              {p.cta}
            </button>
          </div>
        ))}
      </div>

      {checkoutPlan && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setCheckoutPlan(null)} />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Checkout — {checkoutPlan.name}</h2>
                  <p className="text-sm text-slate-600">{checkoutPlan.price} {checkoutPlan.period}</p>
                </div>
                <button className="btn-outline" onClick={() => setCheckoutPlan(null)}>Close</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label">Email for receipt</label>
                  <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>

                <div>
                  <label className="label">Payment method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'card', label: 'Card' },
                      { id: 'upi', label: 'UPI' },
                      { id: 'paypal', label: 'PayPal' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className={`rounded-lg border px-3 py-2 text-sm ${method === m.id ? 'border-startx-500 bg-startx-50 text-startx-700' : 'border-slate-300 hover:bg-slate-50'}`}
                        onClick={() => setMethod(m.id)}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {method === 'card' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="label">Card number</label>
                      <input className="input" placeholder="4242 4242 4242 4242" />
                    </div>
                    <div>
                      <label className="label">Expiry</label>
                      <input className="input" placeholder="MM/YY" />
                    </div>
                    <div>
                      <label className="label">CVC</label>
                      <input className="input" placeholder="123" />
                    </div>
                  </div>
                )}

                {method === 'upi' && (
                  <div>
                    <label className="label">UPI ID</label>
                    <input className="input" placeholder="name@bank" />
                  </div>
                )}

                {method === 'paypal' && (
                  <div className="rounded-lg border border-slate-300 p-3 text-sm text-slate-600">
                    You will be redirected to PayPal to complete the purchase.
                  </div>
                )}

                <button className="btn-primary w-full">Pay {checkoutPlan.price}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



