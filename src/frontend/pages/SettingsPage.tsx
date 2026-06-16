import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner, ErrorMessage } from '@/components/common';
import { api, SettingsResponse } from '@/services/api';
import { Save } from 'lucide-react';

export function SettingsPage() {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [compilationsDirectory, setCompilationsDirectory] = useState('');
  const [maxLibrarySizeGb, setMaxLibrarySizeGb] = useState('');

  useEffect(() => {
    api
      .getSettings()
      .then((s: SettingsResponse) => {
        setSettings(s);
        setCompilationsDirectory(s.compilationsDirectory);
        setMaxLibrarySizeGb(String(s.maxLibrarySizeGb));
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const updated = await api.updateSettings({
        compilationsDirectory,
        maxLibrarySizeGb: parseInt(maxLibrarySizeGb, 10),
      });
      setSettings(updated);
      setMessage('Settings saved successfully');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      <div className="max-w-lg space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Compilation Directory</CardTitle>
            <CardDescription>
              First-level directory name that contains compilations in the destination library.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={compilationsDirectory}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCompilationsDirectory(e.target.value)
              }
              placeholder="e.g. Compilations"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capacity Limit</CardTitle>
            <CardDescription>
              Maximum allowed size of the destination library in gigabytes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              min="1"
              value={maxLibrarySizeGb}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setMaxLibrarySizeGb(e.target.value)
              }
            />
          </CardContent>
        </Card>

        {error && <ErrorMessage message={error} />}
        {message && (
          <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
            {message}
          </div>
        )}

        <Button onClick={handleSave} disabled={saving}>
          {saving ? <LoadingSpinner size={16} /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
