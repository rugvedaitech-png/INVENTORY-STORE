'use client'

import { useState } from 'react'
import ChangePasswordButton from '@/components/ChangePasswordButton'

export default function QuickActions() {
  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
      <div className="space-y-3">
        <ChangePasswordButton />
        <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm font-medium text-gray-900">Notification Settings</p>
          <p className="text-xs text-gray-600">Manage your preferences</p>
        </button>
        <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm font-medium text-gray-900">Download Data</p>
          <p className="text-xs text-gray-600">Export your account data</p>
        </button>
      </div>
    </div>
  )
}

