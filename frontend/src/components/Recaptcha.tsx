import { useEffect } from 'react';

export default function Recaptcha({ onToken }: { onToken: (token: string) => void }) {
  // Auto-provide a dummy token in dev so users don't have to click
  useEffect(() => {
    onToken('dev-captcha-token');
  }, [onToken]);

  // Keep the button as a manual fallback
  return (
    <button type="button" onClick={() => onToken('dev-captcha-token')} className="button small">
      I'm not a robot (dev)
    </button>
  );
}
