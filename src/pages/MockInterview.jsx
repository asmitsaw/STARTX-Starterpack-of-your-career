import React from 'react'
import { Navigate } from 'react-router-dom'

export default function MockInterview() {
  return <Navigate to="/interview-dashboard" replace />
}