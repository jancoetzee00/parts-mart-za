import React, { useState, useEffect } from 'react';
import { Smartphone, Tablet, Download, X, Sparkles } from 'lucide-react';

interface MobileInstallBannerProps {
  onOpenDownloadModal: () => void;
}

export const MobileInstallBanner: React.FC<MobileInstallBannerProps> = ({
  onOpenDownloadModal
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet'>('mobile');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('partsmart_mobile_banner_dismissed');
    if (isDismissed) return;

    // Check if already in standalone PWA mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const isTouch = navigator.maxTouchPoints > 1;
    const width = window.innerWidth;

    const isTablet = width >= 768 && width <= 1024 && isTouch;
    const isMobile = width < 768 || ua.includes('iphone') || (ua.includes('android') && !ua.includes('tablet'));

    if (isTablet) {
      setDeviceType('tablet');
      setIsVisible(true);
    } else if (isMobile) {
      setDeviceType('mobile');
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('partsmart_mobile_banner_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Mobile and Tablet App Installation Banner"
      className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 px-3.5 py-2.5 shadow-lg flex items-center justify-between gap-3 text-xs sticky top-0 z-30 transition-all border-b border-amber-400"
    >
      <div
        onClick={onOpenDownloadModal}
        className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer group"
      >
        <div className="w-8 h-8 rounded-lg bg-slate-950/20 flex items-center justify-center text-slate-950 shrink-0 font-bold">
          {deviceType === 'tablet' ? (
            <Tablet className="w-4 h-4" />
          ) : (
            <Smartphone className="w-4 h-4" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap leading-tight">
            <strong className="font-black text-slate-950 text-xs">
              Install Part-Smart ZA {deviceType === 'tablet' ? 'Tablet App' : 'Mobile App'}
            </strong>
            <span className="bg-slate-950 text-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
              1-Tap
            </span>
          </div>
          <p className="text-[11px] text-slate-900 line-clamp-1 font-medium mt-0.5">
            Instant spares search, offline yard listings & direct WhatsApp dialer.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenDownloadModal}
          className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-amber-400 hover:text-amber-300 font-black text-xs rounded-lg shadow-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download</span>
        </button>

        <button
          onClick={handleDismiss}
          className="p-1.5 text-slate-950/70 hover:text-slate-950 hover:bg-slate-950/10 rounded-lg transition-colors cursor-pointer"
          title="Dismiss banner"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
