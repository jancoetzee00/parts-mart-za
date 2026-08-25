import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Tablet,
  Download,
  X,
  Sparkles,
  CheckCircle2,
  Share,
  PlusSquare,
  ArrowRight
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface MobileInstallBannerProps {
  onOpenDownloadModal: () => void;
}

export const MobileInstallBanner: React.FC<MobileInstallBannerProps> = ({
  onOpenDownloadModal
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [isIos, setIsIos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installStatus, setInstallStatus] = useState<'idle' | 'prompting' | 'installed'>('idle');
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('partsmart_mobile_banner_dismissed');

    // Check if already running in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setInstallStatus('installed');
      return;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isTouch = navigator.maxTouchPoints > 1;
    const width = window.innerWidth;

    const detectedIsIos =
      ua.includes('iphone') ||
      ua.includes('ipad') ||
      ua.includes('ipod') ||
      (ua.includes('mac') && isTouch && width >= 768);

    setIsIos(detectedIsIos);

    const isTablet = width >= 768 && width <= 1024 && isTouch;
    const isMobile = width < 768 || ua.includes('iphone') || (ua.includes('android') && !ua.includes('tablet'));

    if (isTablet) {
      setDeviceType('tablet');
    } else if (isMobile) {
      setDeviceType('mobile');
    } else {
      setDeviceType('desktop');
    }

    // Show banner by default on mobile/tablet if not dismissed
    if (!isDismissed && (isMobile || isTablet)) {
      setIsVisible(true);
    }

    // Capture the browser's native beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Make the banner visible if not dismissed
      if (!isDismissed) {
        setIsVisible(true);
      }
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      setInstallStatus('installed');
      setDeferredPrompt(null);
      setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Handler for custom "Install App" action
  const handleInstallClick = async () => {
    // If native prompt event is available, trigger it directly
    if (deferredPrompt) {
      try {
        setInstallStatus('prompting');
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;

        if (choiceResult.outcome === 'accepted') {
          setInstallStatus('installed');
          setDeferredPrompt(null);
          setTimeout(() => {
            setIsVisible(false);
          }, 3500);
        } else {
          setInstallStatus('idle');
        }
      } catch (err) {
        console.error('Error invoking beforeinstallprompt:', err);
        setInstallStatus('idle');
        onOpenDownloadModal();
      }
    } else if (isIos) {
      // For iOS Safari, toggle the step-by-step Add to Home Screen visual tip
      setShowIosGuide((prev) => !prev);
    } else {
      // Fallback: open comprehensive multi-device download/shortcut modal
      onOpenDownloadModal();
    }
  };

  const handleDismiss = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsVisible(false);
    sessionStorage.setItem('partsmart_mobile_banner_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Mobile and Tablet App Installation Banner"
      className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 px-3.5 py-2.5 shadow-lg flex flex-col gap-2 text-xs sticky top-0 z-30 transition-all border-b border-amber-400"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Banner Left: App Icon & Copy */}
        <div
          onClick={handleInstallClick}
          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleInstallClick()}
        >
          <div className="w-9 h-9 rounded-xl bg-slate-950/20 flex items-center justify-center text-slate-950 shrink-0 font-black shadow-inner">
            {installStatus === 'installed' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-950" />
            ) : deviceType === 'tablet' ? (
              <Tablet className="w-5 h-5" />
            ) : (
              <Smartphone className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap leading-tight">
              <strong className="font-black text-slate-950 text-xs sm:text-sm">
                {installStatus === 'installed'
                  ? 'Part-Smart ZA Installed!'
                  : `Install Part-Smart ZA ${deviceType === 'tablet' ? 'Tablet App' : 'App'}`}
              </strong>
              {deferredPrompt && installStatus !== 'installed' ? (
                <span className="bg-slate-950 text-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase flex items-center gap-0.5 shadow-xs">
                  <Sparkles className="w-2.5 h-2.5 fill-amber-300" />
                  1-Tap Install
                </span>
              ) : (
                <span className="bg-slate-950 text-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                  Home Screen
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-900 line-clamp-1 font-medium mt-0.5">
              {installStatus === 'installed'
                ? 'App is ready on your home screen for quick offline access.'
                : isIos
                ? 'Fast offline search, scrap yard dialer & home screen icon.'
                : 'Instant spares search, offline yard directory & zero browser bar.'}
            </p>
          </div>
        </div>

        {/* Banner Right: Custom Install App Button & Close */}
        <div className="flex items-center gap-2 shrink-0">
          {installStatus === 'installed' ? (
            <span className="px-3 py-1.5 bg-emerald-950/20 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Installed</span>
            </span>
          ) : (
            <button
              onClick={handleInstallClick}
              disabled={installStatus === 'prompting'}
              className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 text-amber-400 hover:text-amber-300 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 border border-slate-900/50"
              title="Install Part-Smart ZA app to your device"
            >
              {installStatus === 'prompting' ? (
                <span>Prompting...</span>
              ) : deferredPrompt ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
                  <span>Install App</span>
                </>
              ) : isIos ? (
                <>
                  <PlusSquare className="w-3.5 h-3.5" />
                  <span>Install App</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Install App</span>
                </>
              )}
            </button>
          )}

          {/* More options button (opens all download formats modal) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDownloadModal();
            }}
            className="hidden sm:flex px-2 py-1.5 text-slate-950/80 hover:text-slate-950 hover:bg-slate-950/10 font-bold text-[11px] rounded-lg transition-colors cursor-pointer items-center gap-1"
            title="View all download options"
          >
            <span>Options</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="p-1.5 text-slate-950/75 hover:text-slate-950 hover:bg-slate-950/15 rounded-lg transition-colors cursor-pointer"
            title="Dismiss banner"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Safari Interactive Guidance Dropdown */}
      {showIosGuide && (
        <div className="bg-slate-950 text-slate-100 rounded-xl p-3 text-xs space-y-2 border border-slate-800 animate-in fade-in slide-in-from-top-1 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-black text-amber-400 flex items-center gap-1.5 text-xs">
              <Share className="w-3.5 h-3.5 text-sky-400" />
              How to Install on iPhone / iPad:
            </span>
            <button
              onClick={() => setShowIosGuide(false)}
              className="text-slate-400 hover:text-white text-[10px] underline cursor-pointer"
            >
              Close
            </button>
          </div>

          <ol className="space-y-1.5 text-[11px] text-slate-300 list-decimal list-inside">
            <li>
              Tap the <strong className="text-sky-300">Share button</strong> (
              <Share className="w-3 h-3 inline text-sky-300 mx-0.5" />
              box with arrow up) at the bottom of Safari.
            </li>
            <li>
              Scroll down and tap <strong className="text-amber-300">"Add to Home Screen"</strong> (
              <PlusSquare className="w-3 h-3 inline text-amber-300 mx-0.5" />
              ).
            </li>
            <li>
              Tap <strong className="text-emerald-300">"Add"</strong> in the top right corner to install Part-Smart ZA.
            </li>
          </ol>

          <div className="pt-1 flex items-center justify-between">
            <button
              onClick={onOpenDownloadModal}
              className="text-[11px] text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Download Apple Configuration Profile (.mobileconfig) instead</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
