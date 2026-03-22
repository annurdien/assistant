import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Loader2, QrCode, Smartphone, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ConnectionStatus = 'loading' | 'qr_ready' | 'connected' | 'error';

export function WhatsAppConnection() {
  const [status, setStatus] = useState<ConnectionStatus>('loading');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Poll the status every 3 seconds while not connected
    const checkStatus = async () => {
      try {
        const data = await api.whatsapp.status();
        setStatus(data.status);
        if (data.status === 'qr_ready' && data.qr) {
          setQrCode(data.qr);
        } else if (data.status === 'connected') {
          setUser(data.user);
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Unable to connect to service');
      }
    };

    checkStatus();
    
    // Setup polling interval
    const intervalId = setInterval(() => {
      if (status !== 'connected') {
        checkStatus();
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [status]);

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6 text-center border rounded-lg bg-card text-card-foreground shadow-sm max-w-sm w-full mx-auto">
      {status === 'loading' && (
        <div className="flex flex-col items-center space-y-4 py-8">
          <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Connecting to WhatsApp engine...
          </p>
        </div>
      )}

      {status === 'qr_ready' && qrCode && (
        <div className="flex flex-col items-center space-y-4 animate-in fade-in-50 duration-500">
          <div className="p-4 bg-white rounded-xl shadow-sm border">
            <img 
              src={qrCode} 
              alt="WhatsApp QR Code" 
              className="w-48 h-48 object-contain"
            />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold flex items-center justify-center gap-2">
              <QrCode className="h-4 w-4" /> Scan to Authenticate
            </h3>
            <p className="text-sm text-muted-foreground">
              Open WhatsApp on your phone &gt; Linked Devices &gt; Link a Device.
            </p>
          </div>
        </div>
      )}

      {status === 'connected' && (
        <div className="flex flex-col items-center space-y-4 py-6 animate-in zoom-in-95 duration-500">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              Connected
            </h3>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5 font-medium">
              <Smartphone className="h-4 w-4" /> 
              {user?.id ? user.id.split(':')[0] : 'Device Active'}
            </p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center space-y-4 py-6">
          <div className="h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center">
            <Smartphone className="h-6 w-6 text-destructive" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-destructive">Connection Error</h3>
            <p className="text-sm text-foreground/80">{errorMessage}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setStatus('loading')} className="mt-2">
            Retry Connection
          </Button>
        </div>
      )}
    </div>
  );
}
