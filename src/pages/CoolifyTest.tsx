import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { coolifyService } from '@/services/CoolifyService';
import type { CoolifyApplication } from '@/services/CoolifyService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';

export default function CoolifyTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    data?: CoolifyApplication[];
    error?: string;
  } | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setResult(null);

    console.log('🔍 Testing Coolify API connection...');
    console.log('📍 Config:', coolifyService.getConfigStatus());

    try {
      const response = await coolifyService.getApplications();

      console.log('📦 Raw Response:', response);

      if (response.success) {
        console.log('✅ Success! Applications:', response.data);
        setResult({
          success: true,
          data: response.data
        });
      } else {
        console.error('❌ Error:', response.error);
        setResult({
          success: false,
          error: response.error
        });
      }
    } catch (error) {
      console.error('💥 Exception:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const testHealthCheck = async () => {
    setLoading(true);
    console.log('🏥 Testing Coolify health check...');

    try {
      const isHealthy = await coolifyService.healthCheck();
      console.log('Health Check Result:', isHealthy);

      setResult({
        success: isHealthy,
        error: isHealthy ? undefined : 'Health check failed'
      });
    } catch (error) {
      console.error('💥 Health check exception:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Coolify API Test</CardTitle>
          <CardDescription>
            Test the connection to your Coolify instance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuration Status */}
          <div className="space-y-2">
            <h3 className="font-semibold">Configuration</h3>
            <div className="bg-muted p-3 rounded-md font-mono text-sm">
              <div>URL: {import.meta.env.VITE_COOLIFY_URL || 'Not configured'}</div>
              <div>Token: {import.meta.env.VITE_COOLIFY_TOKEN ? '✓ Set' : '✗ Not set'}</div>
              <div>Status: {coolifyService.getConfigStatus().configured ? '✓ Configured' : '✗ Not configured'}</div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={testHealthCheck}
              disabled={loading}
              variant="outline"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Health Check
            </Button>
            <Button
              onClick={testConnection}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Test API Connection
            </Button>
          </div>

          {/* Results */}
          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              {result.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {result.success ? 'Success!' : 'Error'}
              </AlertTitle>
              <AlertDescription>
                {result.success ? (
                  <div className="space-y-2">
                    <p>Successfully connected to Coolify API!</p>
                    {result.data && (
                      <div className="mt-3">
                        <p className="font-semibold">Found {result.data.length} application(s):</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          {result.data.map((app) => (
                            <li key={app.uuid} className="text-sm">
                              <span className="font-mono">{app.name || app.uuid}</span>
                              {app.status && <span className="ml-2 text-muted-foreground">({app.status})</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p>Failed to connect to Coolify API</p>
                    <p className="font-mono text-sm bg-destructive/10 p-2 rounded">
                      {result.error}
                    </p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-md">
            <h4 className="font-semibold mb-2">💡 Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Make sure your <code className="bg-muted px-1 rounded">.env.local</code> file has the correct Coolify URL and token</li>
              <li>Click "Health Check" to verify basic connectivity</li>
              <li>Click "Test API Connection" to fetch applications</li>
              <li>Check the browser console (F12) for detailed logs</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
