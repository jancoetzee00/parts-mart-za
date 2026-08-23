import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Tablet,
  Monitor,
  Download,
  Copy,
  Check,
  X,
  ExternalLink,
  Laptop,
  Sparkles,
  Share2,
  Bookmark,
  ShieldCheck,
  Compass,
  Layers,
  ArrowRight,
  Info,
  HelpCircle,
  QrCode,
  Apple,
  Chrome,
  Zap,
  Globe,
  Radio,
  WifiOff,
  Maximize,
  HardHat,
  FolderDown
} from 'lucide-react';
import QRCode from 'qrcode';

interface DesktopShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'all' | 'mobile' | 'tablet' | 'desktop' | 'qr';
}

export const DesktopShortcutModal: React.FC<DesktopShortcutModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'all'
}) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [detectedPlatform, setDetectedPlatform] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [detectedOS, setDetectedOS] = useState<'android' | 'ios' | 'windows' | 'mac' | 'linux' | 'other'>('android');
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'mobile' | 'tablet' | 'desktop' | 'qr'>('all');
  const [activeMobileOS, setActiveMobileOS] = useState<'android' | 'ios'>('android');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Detect Device, Platform and OS
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ua = window.navigator.userAgent.toLowerCase();
    const width = window.innerWidth;
    const isTouch = navigator.maxTouchPoints > 1;

    // Detect OS & Platform
    let os: 'android' | 'ios' | 'windows' | 'mac' | 'linux' | 'other' = 'android';
    let platform: 'mobile' | 'tablet' | 'desktop' = 'mobile';

    if (ua.includes('ipad') || (ua.includes('mac') && isTouch && width >= 768)) {
      os = 'ios';
      platform = 'tablet';
      setActiveMobileOS('ios');
    } else if (ua.includes('iphone') || ua.includes('ipod')) {
      os = 'ios';
      platform = 'mobile';
      setActiveMobileOS('ios');
    } else if (ua.includes('android')) {
      os = 'android';
      platform = width >= 768 || ua.includes('tablet') ? 'tablet' : 'mobile';
      setActiveMobileOS('android');
    } else if (ua.includes('win')) {
      os = 'windows';
      platform = 'desktop';
    } else if (ua.includes('mac')) {
      os = 'mac';
      platform = 'desktop';
    } else if (ua.includes('linux')) {
      os = 'linux';
      platform = 'desktop';
    }

    setDetectedOS(os);
    setDetectedPlatform(platform);

    if (defaultTab) {
      setActiveTab(defaultTab);
    } else {
      setActiveTab('all');
    }

    // Check if running in standalone mode (PWA installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) {
      setIsInstalled(true);
    }

    // Listen for PWA beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [defaultTab]);

  // Generate QR Code for Mobile and Tablet scanning
  useEffect(() => {
    if (!isOpen) return;

    const currentUrl = typeof window !== 'undefined'
      ? window.location.origin + window.location.pathname
      : 'https://partsmart.co.za';

    QRCode.toDataURL(currentUrl, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#020617',
        light: '#ffffff'
      }
    })
      .then((url) => {
        setQrCodeDataUrl(url);
      })
      .catch((err) => {
        console.error('QR code generation error:', err);
      });
  }, [isOpen]);

  const getTargetUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin + window.location.pathname;
    }
    return 'https://partsmart.co.za';
  };

  const currentUrl = getTargetUrl();

  // 1. Native PWA Install Trigger
  const handlePwaInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  };

  // 2. Download Apple iOS / iPadOS WebClip Configuration Profile (.mobileconfig)
  const handleDownloadAppleProfile = () => {
    const mobileconfig = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>PayloadDisplayName</key>
	<string>Part-Smart ZA Mobile App</string>
	<key>PayloadIdentifier</key>
	<string>za.co.partsmart.webclip</string>
	<key>PayloadOrganization</key>
	<string>Part-Smart South Africa</string>
	<key>PayloadRemovalDisallowed</key>
	<false/>
	<key>PayloadType</key>
	<string>Configuration</string>
	<key>PayloadUUID</key>
	<string>4F234C58-12A4-4B8D-9E9C-1F5E12E55D01</string>
	<key>PayloadVersion</key>
	<integer>1</integer>
	<key>PayloadContent</key>
	<array>
		<dict>
			<key>FullScreen</key>
			<true/>
			<key>IsRemovable</key>
			<true/>
			<key>Icon</key>
			<data>
			</data>
			<key>Label</key>
			<string>Part-Smart ZA</string>
			<key>PayloadDescription</key>
			<string>Configures Part-Smart ZA heavy machinery and truck spares home screen shortcut.</string>
			<key>PayloadDisplayName</key>
			<string>Part-Smart ZA</string>
			<key>PayloadIdentifier</key>
			<string>za.co.partsmart.webclip.entry</string>
			<key>PayloadOrganization</key>
			<string>Part-Smart South Africa</string>
			<key>PayloadType</key>
			<string>com.apple.webClip.managed</string>
			<key>PayloadUUID</key>
			<string>9B34A31C-8D1F-433E-9411-C73E43831822</string>
			<key>PayloadVersion</key>
			<integer>1</integer>
			<key>Precomposed</key>
			<true/>
			<key>URL</key>
			<string>${currentUrl}</string>
		</dict>
	</array>
</dict>
</plist>`;

    const blob = new Blob([mobileconfig], { type: 'application/x-apple-aspen-config;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Part-Smart-ZA-iOS.mobileconfig';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    setDownloadSuccess('ios');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  // 3. Download Android Quick-Launch Shortcut file (.html / bookmark)
  const handleDownloadAndroidLauncher = () => {
    const htmlLauncher = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Part-Smart ZA | Heavy Spares</title>
  <meta name="theme-color" content="#0f172a">
  <meta http-equiv="refresh" content="0; url=${currentUrl}">
  <style>
    body {
      background: #020617;
      color: #f8fafc;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      text-align: center;
      padding: 20px;
    }
    .logo {
      width: 72px;
      height: 72px;
      background: #f59e0b;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      color: #0f172a;
      font-size: 28px;
      margin-bottom: 20px;
    }
    a {
      background: #f59e0b;
      color: #0f172a;
      padding: 12px 24px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: bold;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="logo">PS</div>
  <h2>Opening Part-Smart ZA...</h2>
  <p>Connecting to South Africa's Heavy Machinery & Truck Spares Network</p>
  <a href="${currentUrl}">Tap here if not redirected</a>
  <script>window.location.href = "${currentUrl}";</script>
</body>
</html>`;

    const blob = new Blob([htmlLauncher], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Part-Smart-ZA-Mobile.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    setDownloadSuccess('android');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  // 4. Download Windows .url Shortcut
  const handleDownloadWindowsShortcut = () => {
    const urlContent = `[InternetShortcut]\r\nURL=${currentUrl}\r\nIconIndex=0\r\nHotKey=0\r\n[{000214A0-0000-0000-C000-000000000046}]\r\nProp3=19,0\r\n`;
    const blob = new Blob([urlContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Part-Smart-ZA.url';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    setDownloadSuccess('windows');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  // 5. Download Mac .webloc Shortcut
  const handleDownloadMacShortcut = () => {
    const weblocContent = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n\t<key>URL</key>\n\t<string>${currentUrl}</string>\n</dict>\n</plist>`;
    const blob = new Blob([weblocContent], { type: 'application/xml;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Part-Smart-ZA.webloc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    setDownloadSuccess('mac');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  // 6. Download Linux .desktop Launcher
  const handleDownloadLinuxShortcut = () => {
    const desktopContent = `[Desktop Entry]\nVersion=1.0\nType=Application\nName=Part-Smart ZA\nGenericName=Heavy Machinery & Truck Parts Marketplace\nComment=Search & advertise CAT, Scania, Mercedes and earthmoving spares in South Africa\nExec=xdg-open "${currentUrl}"\nIcon=applications-internet\nTerminal=false\nCategories=Network;WebBrowser;Commercial;\nStartupNotify=true\n`;
    const blob = new Blob([desktopContent], { type: 'application/x-desktop;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Part-Smart-ZA.desktop';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    setDownloadSuccess('linux');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  // 7. Copy Link to Clipboard
  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // 8. Native Mobile Web Share API
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Part-Smart ZA | Heavy Machinery & Truck Spares',
          text: 'South Africa\'s dedicated heavy equipment, truck parts, and scrap yard search engine app.',
          url: currentUrl
        });
        setShared(true);
        setTimeout(() => setShared(false), 3000);
      } catch (err) {
        // User cancelled or not supported
      }
    } else {
      handleCopyLink();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="app-download-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-4 sm:my-8 relative text-slate-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/50 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
              <Download className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Download Part-Smart ZA App
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-amber-500 text-slate-950 uppercase">
                  All Devices & Platforms
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Download buttons for Android, iPhone, iPad, Windows, Mac, and Linux all in one place.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation: "All Downloads" is the primary unified tab */}
        <div className="flex items-center gap-1.5 p-2.5 bg-slate-950 border-b border-slate-800 overflow-x-auto scrollbar-none">
          {/* Main Unified "All Downloads" Tab */}
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-900 bg-slate-900/50'
            }`}
          >
            <FolderDown className="w-4 h-4" />
            <span>All Downloads</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
              activeTab === 'all' ? 'bg-slate-950 text-amber-300' : 'bg-amber-500/20 text-amber-300'
            }`}>
              Full Suite
            </span>
          </button>

          {/* Filter: Mobile Tab */}
          <button
            onClick={() => setActiveTab('mobile')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'mobile'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Mobile Phone</span>
            {detectedPlatform === 'mobile' && (
              <span className="bg-slate-950 text-amber-300 text-[8px] px-1 rounded-full uppercase font-black">
                Detected
              </span>
            )}
          </button>

          {/* Filter: Tablet Tab */}
          <button
            onClick={() => setActiveTab('tablet')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'tablet'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Tablet className="w-4 h-4" />
            <span>Tablet / iPad</span>
            {detectedPlatform === 'tablet' && (
              <span className="bg-slate-950 text-amber-300 text-[8px] px-1 rounded-full uppercase font-black">
                Detected
              </span>
            )}
          </button>

          {/* Filter: Desktop Tab */}
          <button
            onClick={() => setActiveTab('desktop')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'desktop'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Desktop / PC</span>
            {detectedPlatform === 'desktop' && (
              <span className="bg-slate-950 text-amber-300 text-[8px] px-1 rounded-full uppercase font-black">
                Detected
              </span>
            )}
          </button>

          {/* Filter: QR Code Scan Tab */}
          <button
            onClick={() => setActiveTab('qr')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ml-auto ${
              activeTab === 'qr'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Scan QR</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm">

          {/* ======================================================== */}
          {/* UNIFIED TAB: ALL DOWNLOAD BUTTONS UNDER ONE TAB */}
          {/* ======================================================== */}
          {activeTab === 'all' && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* Native PWA Banner if browser supports 1-tap install */}
              {installPrompt && !isInstalled && (
                <div className="bg-gradient-to-r from-amber-500/25 via-orange-500/20 to-amber-600/25 border-2 border-amber-500/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
                      <Sparkles className="w-5 h-5 fill-slate-950" />
                    </div>
                    <div>
                      <h3 className="font-black text-amber-300 text-sm flex items-center gap-2">
                        <span>1-Tap Instant Native App Install Ready</span>
                        <span className="bg-slate-950 text-amber-300 text-[9px] px-2 py-0.5 rounded-full uppercase">
                          Recommended
                        </span>
                      </h3>
                      <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                        Add Part-Smart ZA directly to your device. Works offline with fast search and zero browser address bar!
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handlePwaInstall}
                    className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-amber-500/30 shrink-0 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install Native App Now</span>
                  </button>
                </div>
              )}

              {/* 1. MOBILE & TABLET DOWNLOAD BUTTONS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    <span>1. Mobile & Tablet App Downloads (Android & Apple iOS)</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Detected: <strong className="text-amber-300 capitalize">{detectedOS} ({detectedPlatform})</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Button 1: Android PWA / Direct App */}
                  <div className="p-4 bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl flex flex-col justify-between gap-3 group transition-all">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs flex items-center gap-1.5">
                          <Chrome className="w-4 h-4 text-emerald-400" />
                          Android App (PWA)
                        </span>
                        <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-1.5 py-0.2 rounded font-black uppercase">
                          Android
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                        Installs Part-Smart ZA with home screen icon for Samsung, Xiaomi, Huawei, etc.
                      </p>
                    </div>

                    <button
                      onClick={installPrompt ? handlePwaInstall : undefined}
                      className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        installPrompt
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
                      }`}
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{installPrompt ? 'Install Android App' : 'Install via Browser (⋮)'}</span>
                    </button>
                  </div>

                  {/* Button 2: Android Offline HTML Launcher */}
                  <div className="p-4 bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 rounded-2xl flex flex-col justify-between gap-3 group transition-all">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs flex items-center gap-1.5">
                          <Download className="w-4 h-4 text-amber-400" />
                          Android Web Launcher
                        </span>
                        <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1.5 py-0.2 rounded font-black uppercase">
                          .HTML File
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                        Downloads an offline <code className="text-amber-300">.html</code> launcher file to your phone files/downloads.
                      </p>
                    </div>

                    <button
                      onClick={handleDownloadAndroidLauncher}
                      className="w-full py-2.5 px-3 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                    >
                      {downloadSuccess === 'android' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Launcher Downloaded!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Android Launcher</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Button 3: Apple iOS Profile (.mobileconfig) */}
                  <div className="p-4 bg-slate-950/80 border border-slate-800 hover:border-blue-500/50 rounded-2xl flex flex-col justify-between gap-3 group transition-all">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs flex items-center gap-1.5">
                          <Apple className="w-4 h-4 text-blue-400" />
                          Apple iOS & iPad Profile
                        </span>
                        <span className="bg-blue-500/20 text-blue-300 text-[9px] px-1.5 py-0.2 rounded font-black uppercase">
                          iOS 14-18+
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                        Downloads official Apple WebClip configuration profile for iPhone & iPad home screen.
                      </p>
                    </div>

                    <button
                      onClick={handleDownloadAppleProfile}
                      className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                    >
                      {downloadSuccess === 'ios' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Profile Downloaded!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Download iOS Profile</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. DESKTOP & LAPTOP DOWNLOAD BUTTONS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    <span>2. Desktop & Laptop Downloads (Windows, Mac & Linux)</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    1-Click Direct Desktop Launchers
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Windows .url */}
                  <div
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      detectedOS === 'windows'
                        ? 'bg-slate-950/90 border-cyan-500/50 shadow-md shadow-cyan-950/30'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs flex items-center gap-1.5">
                          <Laptop className="w-4 h-4 text-blue-400" />
                          Windows 10 / 11
                        </span>
                        <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-black uppercase">
                          .URL
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                        Ready-to-use <code className="text-cyan-300">Part-Smart-ZA.url</code> desktop shortcut.
                      </p>
                    </div>

                    <button
                      onClick={handleDownloadWindowsShortcut}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      {downloadSuccess === 'windows' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Downloaded!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Download for Windows</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Mac .webloc */}
                  <div
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      detectedOS === 'mac'
                        ? 'bg-slate-950/90 border-cyan-500/50 shadow-md shadow-cyan-950/30'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs flex items-center gap-1.5">
                          <Laptop className="w-4 h-4 text-slate-300" />
                          Apple macOS
                        </span>
                        <span className="text-[9px] bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded font-black uppercase">
                          .WEBLOC
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                        Native Finder Desktop & Dock shortcut link for MacBooks and iMacs.
                      </p>
                    </div>

                    <button
                      onClick={handleDownloadMacShortcut}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      {downloadSuccess === 'mac' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Downloaded!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Download for Mac</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Linux .desktop */}
                  <div
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      detectedOS === 'linux'
                        ? 'bg-slate-950/90 border-cyan-500/50 shadow-md shadow-cyan-950/30'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs flex items-center gap-1.5">
                          <Monitor className="w-4 h-4 text-orange-400" />
                          Linux Launcher
                        </span>
                        <span className="text-[9px] bg-orange-500/20 text-orange-300 px-1.5 py-0.2 rounded font-black uppercase">
                          .DESKTOP
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                        App launcher for Ubuntu, Fedora, Debian, and Linux Mint desktops.
                      </p>
                    </div>

                    <button
                      onClick={handleDownloadLinuxShortcut}
                      className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      {downloadSuccess === 'linux' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Downloaded!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Download for Linux</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. INSTANT PHONE/TABLET QR CODE & SHARING BAR */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                {/* QR Code Card */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-between text-center gap-3">
                  <div>
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-white mb-1">
                      <QrCode className="w-4 h-4 text-amber-400" />
                      <span>Scan with Phone Camera</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Instantly opens Part-Smart ZA on your smartphone or tablet.
                    </p>
                  </div>

                  {qrCodeDataUrl ? (
                    <div className="p-2 bg-white rounded-xl shadow-md border-2 border-amber-500/40 inline-block">
                      <img
                        src={qrCodeDataUrl}
                        alt="Part-Smart ZA QR Code"
                        className="w-28 h-28 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-28 h-28 bg-slate-900 rounded-xl flex items-center justify-center text-[10px] text-slate-500">
                      Loading QR...
                    </div>
                  )}

                  <button
                    onClick={() => setActiveTab('qr')}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                  >
                    View Large QR Code
                  </button>
                </div>

                {/* Drag & Drop Shortcut Card */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1">
                      <Bookmark className="w-4 h-4 text-amber-400" />
                      <span>Drag & Drop Instant Shortcut</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Click and drag the yellow button directly onto your desktop or browser bookmarks bar.
                    </p>
                  </div>

                  <a
                    href={currentUrl}
                    title="Drag this button to your Desktop or Bookmarks Bar"
                    draggable="true"
                    onClick={(e) => e.preventDefault()}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-grab active:cursor-grabbing shadow-md select-none"
                  >
                    <Monitor className="w-4 h-4" />
                    <span>Drag Me To Desktop / Bookmarks</span>
                  </a>

                  <p className="text-[10px] text-slate-500 text-center">
                    Instant zero-download browser shortcut
                  </p>
                </div>

                {/* Universal Web App Link & Sharing */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <span>Universal Web Link</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Share the app link with mechanics, plant operators, or scrap yard team members.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleCopyLink}
                      className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy Web App Link</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleNativeShare}
                      className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-750 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{shared ? 'Shared!' : 'Share via WhatsApp / Email'}</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: MOBILE PHONES (ANDROID & IPHONE) */}
          {/* ======================================================== */}
          {activeTab === 'mobile' && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* Native PWA Banner if browser supports install prompt */}
              {installPrompt && !isInstalled && (
                <div className="bg-gradient-to-r from-amber-500/25 via-orange-500/20 to-amber-600/25 border-2 border-amber-500/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
                      <Sparkles className="w-5 h-5 fill-slate-950" />
                    </div>
                    <div>
                      <h3 className="font-black text-amber-300 text-sm">
                        1-Tap Instant Mobile Install Ready
                      </h3>
                      <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                        Add Part-Smart ZA directly to your phone screen. Works offline with fast search and zero browser address bar!
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handlePwaInstall}
                    className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-amber-500/30 shrink-0 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install Mobile App</span>
                  </button>
                </div>
              )}

              {/* Mobile OS Switcher (Android vs iPhone) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    <span>Select Your Mobile Device</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Detected: <strong className="text-amber-400 capitalize">{detectedOS}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setActiveMobileOS('android')}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                      activeMobileOS === 'android'
                        ? 'bg-slate-800/90 border-emerald-500/60 shadow-lg shadow-emerald-950/30'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-850'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <Chrome className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-black text-white text-xs flex items-center gap-1.5">
                        <span>Android Phone</span>
                        {detectedOS === 'android' && (
                          <span className="bg-emerald-500/20 text-emerald-300 text-[8px] px-1.5 py-0.2 rounded font-black uppercase">
                            Your Phone
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">Samsung, Xiaomi, Huawei, etc.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveMobileOS('ios')}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                      activeMobileOS === 'ios'
                        ? 'bg-slate-800/90 border-blue-500/60 shadow-lg shadow-blue-950/30'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-850'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                      <Apple className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-black text-white text-xs flex items-center gap-1.5">
                        <span>Apple iPhone (iOS)</span>
                        {detectedOS === 'ios' && (
                          <span className="bg-blue-500/20 text-blue-300 text-[8px] px-1.5 py-0.2 rounded font-black uppercase">
                            Your iPhone
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">iOS 14 - 18+ Safari</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* ANDROID INSTRUCTIONS & DOWNLOAD */}
              {activeMobileOS === 'android' && (
                <div className="space-y-4 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <Chrome className="w-4 h-4 text-emerald-400" />
                        <span>Android App Installation & Downloads</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Install directly via Google Chrome, Samsung Internet, Brave, or download quick launcher.
                      </p>
                    </div>
                  </div>

                  {/* Android Quick Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Method 1: WebAPK / PWA */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                          Recommended Method
                        </span>
                        <h5 className="font-bold text-white text-xs mt-1">
                          Native PWA / WebAPK Installer
                        </h5>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          Launches without browser URL bars, caches offline machinery listings, and integrates with Android notifications.
                        </p>
                      </div>

                      <button
                        onClick={installPrompt ? handlePwaInstall : undefined}
                        className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                          installPrompt
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        <Download className="w-4 h-4" />
                        <span>{installPrompt ? 'Install App to Phone' : 'Install via Browser Menu (⋮)'}</span>
                      </button>
                    </div>

                    {/* Method 2: Android HTML Launcher Bundle */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          Offline File Launcher
                        </span>
                        <h5 className="font-bold text-white text-xs mt-1">
                          Download Android Web Launcher File
                        </h5>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          Saves a lightweight <code className="text-amber-300">.html</code> launcher file to your phone's downloads folder.
                        </p>
                      </div>

                      <button
                        onClick={handleDownloadAndroidLauncher}
                        className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                      >
                        {downloadSuccess === 'android' ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400">Launcher Downloaded!</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 text-amber-400" />
                            <span>Download Android Launcher</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Android Step-by-Step Visual Walkthrough */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>How to Install on Android in 3 Simple Steps:</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-300">
                      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-xs">
                          1
                        </div>
                        <p className="font-bold text-white">Tap Menu (⋮)</p>
                        <p className="text-[11px] text-slate-400">Tap the three vertical dots in the top-right corner of Chrome.</p>
                      </div>

                      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-xs">
                          2
                        </div>
                        <p className="font-bold text-white">Select "Install App"</p>
                        <p className="text-[11px] text-slate-400">Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</p>
                      </div>

                      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-xs">
                          3
                        </div>
                        <p className="font-bold text-white">Tap "Install"</p>
                        <p className="text-[11px] text-slate-400">Confirm in the dialog. The Part-Smart icon will appear on your phone!</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* IPHONE (IOS) INSTRUCTIONS & DOWNLOAD */}
              {activeMobileOS === 'ios' && (
                <div className="space-y-4 bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <Apple className="w-4 h-4 text-slate-200" />
                        <span>iPhone (iOS) Installation Options</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Add Part-Smart ZA to your iPhone Home Screen with custom icon and standalone app view.
                      </p>
                    </div>
                  </div>

                  {/* iOS Quick Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Option 1: Safari Add to Home Screen */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">
                          Easiest Method (Safari)
                        </span>
                        <h5 className="font-bold text-white text-xs mt-1">
                          Safari "Add to Home Screen"
                        </h5>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          Tap the Safari Share icon <strong className="text-white">[↑]</strong> and tap <strong>"Add to Home Screen"</strong> for instant 1-tap launcher.
                        </p>
                      </div>

                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2 text-xs text-slate-300">
                        <Share2 className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>Tap <strong>Share [↑]</strong> in Safari toolbar below</span>
                      </div>
                    </div>

                    {/* Option 2: 1-Click Apple WebClip Configuration Profile */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                          1-Click Profile Installer
                        </span>
                        <h5 className="font-bold text-white text-xs mt-1">
                          Download Apple WebClip Profile (.mobileconfig)
                        </h5>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          Downloads an official Apple iOS configuration file that adds the Part-Smart ZA web app icon to Settings with 1 tap.
                        </p>
                      </div>

                      <button
                        onClick={handleDownloadAppleProfile}
                        className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-950/40"
                      >
                        {downloadSuccess === 'ios' ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-300" />
                            <span>Profile Downloaded!</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>Download iOS Profile (.mobileconfig)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* iOS Safari Step-by-Step Visual Walkthrough */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <h5 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                      <span>How to Add to iPhone Home Screen:</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-300">
                      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-black flex items-center justify-center text-xs">
                          1
                        </div>
                        <p className="font-bold text-white">Tap Share [↑]</p>
                        <p className="text-[11px] text-slate-400">In Safari, tap the Share icon in the bottom center bar.</p>
                      </div>

                      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-black flex items-center justify-center text-xs">
                          2
                        </div>
                        <p className="font-bold text-white">"Add to Home Screen"</p>
                        <p className="text-[11px] text-slate-400">Scroll down the share sheet and tap <strong>"Add to Home Screen"</strong>.</p>
                      </div>

                      <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-black flex items-center justify-center text-xs">
                          3
                        </div>
                        <p className="font-bold text-white">Tap "Add"</p>
                        <p className="text-[11px] text-slate-400">Tap <strong>Add</strong> in the top right. Part-Smart ZA is now on your home screen!</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: TABLETS & IPADS */}
          {/* ======================================================== */}
          {activeTab === 'tablet' && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* Tablet Hero Feature Highlights */}
              <div className="bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Tablet className="w-6 h-6 text-amber-400" />
                    <div>
                      <h3 className="font-black text-white text-base">
                        Tablet & iPad Optimized Experience
                      </h3>
                      <p className="text-xs text-slate-300">
                        Designed for wide tablet screens, plant yard managers, and on-site mechanics.
                      </p>
                    </div>
                  </div>
                  <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                    Tablet Mode
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
                    <Maximize className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-white text-xs">Split-Screen Ready</h4>
                      <p className="text-[11px] text-slate-400">View part diagrams alongside WhatsApp scrap yard conversations.</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
                    <WifiOff className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-white text-xs">Offline Catalog</h4>
                      <p className="text-[11px] text-slate-400">Browse saved machinery spares even in remote South African mine/farm zones.</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
                    <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-white text-xs">Instant 1-Tap Leads</h4>
                      <p className="text-[11px] text-slate-400">Direct WhatsApp quotes and phone inquiries with pre-filled part codes.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tablet Download Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* iPad / iPadOS Install */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-white text-xs flex items-center gap-1.5">
                        <Apple className="w-4 h-4 text-slate-300" />
                        Apple iPad (iPadOS)
                      </span>
                      <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-black uppercase">
                        iPad Air / Pro / Mini
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Download the Apple WebClip profile or use Safari <strong>"Add to Home Screen"</strong> for full-screen iPad mode.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleDownloadAppleProfile}
                      className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download iPad Profile (.mobileconfig)</span>
                    </button>
                    <p className="text-[10px] text-slate-500 text-center">
                      Or tap Safari Share [↑] &rarr; "Add to Home Screen"
                    </p>
                  </div>
                </div>

                {/* Android Tablet Install */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-white text-xs flex items-center gap-1.5">
                        <Tablet className="w-4 h-4 text-emerald-400" />
                        Android Tablets
                      </span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-black uppercase">
                        Galaxy Tab / Lenovo
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Install native WebAPK or download the tablet quick launcher file for offline scrap yard browsing.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={installPrompt ? handlePwaInstall : handleDownloadAndroidLauncher}
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{installPrompt ? 'Install App on Tablet' : 'Download Tablet Launcher'}</span>
                    </button>
                    <p className="text-[10px] text-slate-500 text-center">
                      Supports landscape & portrait screen orientation
                    </p>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: DESKTOP & LAPTOP (WINDOWS / MAC / LINUX) */}
          {/* ======================================================== */}
          {activeTab === 'desktop' && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* Native PWA Banner if supported */}
              {installPrompt && !isInstalled && (
                <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-600/20 border border-amber-500/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-amber-950/20">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <h3 className="font-bold text-amber-300 text-sm">
                        Install Standalone Desktop App (Recommended)
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Launch Part-Smart ZA in its own clean window without browser tabs, address bar, or distractions.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handlePwaInstall}
                    className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install App Now</span>
                  </button>
                </div>
              )}

              {/* 1-Click Desktop Shortcuts Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>1-Click Desktop Shortcut Downloaders</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Detected OS: <span className="text-amber-400 font-bold capitalize">{detectedOS}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Windows Option */}
                  <div
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                      detectedOS === 'windows'
                        ? 'bg-slate-800/90 border-amber-500/50 shadow-md shadow-amber-500/10'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs flex items-center gap-1.5">
                          <Laptop className="w-4 h-4 text-blue-400" />
                          Windows 10 / 11
                        </span>
                        {detectedOS === 'windows' && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-black">
                            YOUR OS
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                        Downloads a ready-to-use <code className="text-amber-300">Part-Smart-ZA.url</code> desktop shortcut file.
                      </p>
                    </div>

                    <button
                      onClick={handleDownloadWindowsShortcut}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      {downloadSuccess === 'windows' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Downloaded!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Download for Windows</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Mac Option */}
                  <div
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                      detectedOS === 'mac'
                        ? 'bg-slate-800/90 border-amber-500/50 shadow-md shadow-amber-500/10'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs flex items-center gap-1.5">
                          <Laptop className="w-4 h-4 text-slate-300" />
                          Apple macOS
                        </span>
                        {detectedOS === 'mac' && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-black">
                            YOUR OS
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                        Downloads a native <code className="text-amber-300">.webloc</code> link for your Finder Desktop & Dock.
                      </p>
                    </div>

                    <button
                      onClick={handleDownloadMacShortcut}
                      className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      {downloadSuccess === 'mac' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Downloaded!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Download for Mac</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Linux Option */}
                  <div
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                      detectedOS === 'linux'
                        ? 'bg-slate-800/90 border-amber-500/50 shadow-md shadow-amber-500/10'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs flex items-center gap-1.5">
                          <Monitor className="w-4 h-4 text-orange-400" />
                          Linux Desktop
                        </span>
                        {detectedOS === 'linux' && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-black">
                            YOUR OS
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                        Downloads a standard <code className="text-amber-300">.desktop</code> app launcher for Ubuntu / Fedora.
                      </p>
                    </div>

                    <button
                      onClick={handleDownloadLinuxShortcut}
                      className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      {downloadSuccess === 'linux' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Downloaded!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Download for Linux</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Drag to Desktop or Bookmark Bar */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                    <span>Drag & Drop Instant Shortcut</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Fastest method</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <a
                    href={currentUrl}
                    title="Drag this button to your Desktop or Bookmarks Bar"
                    draggable="true"
                    onClick={(e) => e.preventDefault()}
                    className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-grab active:cursor-grabbing shadow-md select-none"
                  >
                    <Monitor className="w-4 h-4" />
                    <span>Drag Me To Desktop / Bookmarks</span>
                  </a>

                  <p className="text-[11px] text-slate-400 text-center sm:text-left leading-relaxed">
                    Click and drag the yellow badge directly onto your computer desktop, folder, or browser bookmarks bar.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: SCAN QR CODE FOR MOBILE & TABLET */}
          {/* ======================================================== */}
          {activeTab === 'qr' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <QrCode className="w-6 h-6" />
                </div>

                <div className="max-w-md">
                  <h3 className="text-base font-black text-white">
                    Scan with Phone or Tablet Camera
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Open your smartphone or tablet camera and point it at the QR code below to immediately open and install Part-Smart ZA on your mobile device.
                  </p>
                </div>

                {/* QR Code Container */}
                {qrCodeDataUrl ? (
                  <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-amber-500/40 inline-block">
                    <img
                      src={qrCodeDataUrl}
                      alt="Part-Smart ZA Mobile QR Code"
                      className="w-56 h-56 object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="w-56 h-56 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-500 text-xs">
                    Generating QR Code...
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Mobile Link</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleNativeShare}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{shared ? 'Shared!' : 'Share App'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Direct Link Share Footer Box */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Direct Mobile Web App URL</span>
              <span className="text-[10px] text-slate-500">Universal Link for all devices</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-mono focus:outline-none select-all"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px]">Safe, verified official Part-Smart ZA app downloaders.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
