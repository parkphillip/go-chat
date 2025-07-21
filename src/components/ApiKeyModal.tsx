import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (apiKey: string) => void;
  onClose: () => void;
}

export function ApiKeyModal({ isOpen, onSave, onClose }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!apiKey.trim()) {
      setError('Please enter your OpenAI API key');
      return;
    }
    
    if (!apiKey.startsWith('sk-')) {
      setError('OpenAI API keys should start with "sk-"');
      return;
    }

    localStorage.setItem('openai_api_key', apiKey.trim());
    onSave(apiKey.trim());
    setApiKey('');
    setError('');
  };

  const handleClose = () => {
    setApiKey('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            OpenAI API Key Required
          </DialogTitle>
          <DialogDescription>
            Enter your OpenAI API key to start chatting with William Go's AI assistant.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your API key is stored locally in your browser and never sent to our servers.
              Get your API key from{' '}
              <a 
                href="https://platform.openai.com/account/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline text-primary"
              >
                OpenAI Platform
              </a>
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label htmlFor="apikey">OpenAI API Key</Label>
            <Input
              id="apikey"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save API Key
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}