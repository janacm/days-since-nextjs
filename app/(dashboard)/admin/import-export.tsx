'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ImportExportEvents() {
  const [file, setFile] = useState<File | null>(null);

  const handleExport = async () => {
    const res = await fetch('/api/events/export');
    if (!res.ok) return alert('Failed to export events');
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data.events, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'events.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!file) return;
    try {
      const text = await file.text();
      const events = JSON.parse(text);
      const res = await fetch('/api/events/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
      if (!res.ok) throw new Error('Import failed');
      setFile(null);
      window.location.reload();
    } catch {
      alert('Invalid file');
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={handleExport}>Export Events</Button>
      <Input
        type="file"
        accept="application/json"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <Button onClick={handleImport} disabled={!file}>
        Import Events
      </Button>
    </div>
  );
}
