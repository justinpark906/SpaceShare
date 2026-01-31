'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminPanelProps {
  onSimulateArrival?: () => void;
  onSimulateDeparture?: () => void;
  onReset?: () => void;
}

export function AdminPanel({ onSimulateArrival, onSimulateDeparture, onReset }: AdminPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  const handleSimulateArrival = async () => {
    addLog('Simulating geofence ENTER event...');

    try {
      // Call the mock location update
      const response = await fetch('/api/simulate/arrival', {
        method: 'POST',
      });

      if (response.ok) {
        addLog('✅ Geofence ENTER triggered!');
        addLog('📡 Lambda publishing to IoT...');
        setTimeout(() => {
          addLog('🔓 UNLOCK command sent to Bollard_01');
        }, 500);
      }
    } catch (error) {
      addLog('Using local simulation...');
    }

    onSimulateArrival?.();
  };

  const handleSimulateDeparture = async () => {
    addLog('Simulating geofence EXIT event...');

    try {
      const response = await fetch('/api/simulate/departure', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        addLog('✅ Geofence EXIT triggered!');
        addLog('🔒 Gate locked');
        addLog(`💳 Visa Direct payout initiated`);
        addLog(`🏦 Capital One sweep: 20% to savings`);
      }
    } catch (error) {
      addLog('Using local simulation...');
    }

    onSimulateDeparture?.();
  };

  const handleReset = async () => {
    addLog('Resetting demo state...');

    try {
      await fetch('/api/simulate/reset', { method: 'POST' });
    } catch (error) {
      // Ignore
    }

    addLog('✅ Demo reset complete');
    onReset?.();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        title="Open Admin Panel"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="shadow-2xl border-purple-200">
        <CardHeader className="pb-2 bg-purple-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="text-purple-600">⚙️</span>
              Demo Admin Panel
            </CardTitle>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {/* Simulation Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleSimulateArrival}
              className="w-full bg-green-600 hover:bg-green-700"
              size="sm"
            >
              🚗 Simulate Arrival
            </Button>
            <Button
              onClick={handleSimulateDeparture}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              👋 Simulate Departure
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full"
              size="sm"
            >
              🔄 Reset Demo
            </Button>
          </div>

          {/* Event Log */}
          <div className="border-t pt-3">
            <p className="text-xs font-medium text-gray-500 mb-2">Event Log</p>
            <div className="bg-gray-900 rounded-lg p-2 h-32 overflow-y-auto font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-gray-500">No events yet...</p>
              ) : (
                logs.map((log, i) => (
                  <p key={i} className="text-green-400">{log}</p>
                ))
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="border-t pt-3 flex gap-2">
            <a
              href="/dashboard"
              className="flex-1 text-center text-xs py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              Sarah's Dashboard
            </a>
            <a
              href="/"
              className="flex-1 text-center text-xs py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              Marcus's Map
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
