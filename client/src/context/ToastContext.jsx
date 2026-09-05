import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const ToastContext = createContext(null);

// Unique ID for this browser tab instance to prevent self-broadcast loops
const TAB_INSTANCE_ID = Math.random().toString(36).substring(2, 9);

// Web Audio API chime synthesizer (crisp Slack-style double tone chime)
const playChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;
    
    // Note 1 (higher tone)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.10, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.18);

    // Note 2 (soothing high tone chime)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.09); // A5
    gain2.gain.setValueAtTime(0.12, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.35);
  } catch (e) {
    // AudioContext autoplay restriction handled silently
  }
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [permission, setPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  // Deduplication cache ref to strictly prevent double toast popups
  const lastToastRef = useRef({ key: '', timestamp: 0 });

  // Request browser desktop notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((perm) => {
          setPermission(perm);
        });
      }
    }
  }, []);

  // Multi-tab BroadcastChannel listener with tab instance deduplication
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const channel = new BroadcastChannel('peoplepay360_channel');

    channel.onmessage = (event) => {
      const data = event.data;
      // Only process if from a DIFFERENT tab and not duplicate
      if (data && data.type === 'POPUP_NOTIFICATION' && data.originTab !== TAB_INSTANCE_ID) {
        displayToastInternal(data.payload, false);
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  const displayToastInternal = useCallback((payload, shouldBroadcast = true) => {
    const rawMessage = typeof payload === 'string' ? payload : (payload.message || payload.desc || '');
    const rawType = typeof payload === 'string' ? 'info' : (payload.type || 'info');
    const toastKey = `${rawMessage}_${rawType}`.toLowerCase().trim();
    const now = Date.now();

    // 1. Strict Deduplication Check: Ignore identical toast within 1500ms
    if (lastToastRef.current.key === toastKey && now - lastToastRef.current.timestamp < 1500) {
      return;
    }
    lastToastRef.current = { key: toastKey, timestamp: now };

    const id = now + Math.random();
    
    // Normalize string vs object payloads
    const toastItem = typeof payload === 'string' 
      ? { id, title: 'Notification', message: payload, type: 'info', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      : { 
          id, 
          title: payload.title || (payload.type === 'success' ? 'Success' : payload.type === 'error' ? 'Alert' : 'Update'), 
          message: payload.message || payload.desc || 'New update available', 
          type: payload.type || 'info',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          link: payload.link || payload.path || null
        };

    // 2. Play Slack-style sound chime
    playChime();

    // 3. Add to in-app Toast popup stack
    setToasts((prev) => [toastItem, ...prev.slice(0, 3)]);

    // 4. Trigger OS/Desktop native notification if tab is in background or minimized
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted' &&
      document.visibilityState === 'hidden'
    ) {
      try {
        new Notification(`Staffora — ${toastItem.title}`, {
          body: toastItem.message,
          icon: '/favicon.ico',
          tag: `staffora-${id}`
        });
      } catch (e) {}
    }

    // 5. Broadcast to other open browser tabs
    if (shouldBroadcast && typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('peoplepay360_channel');
        channel.postMessage({
          type: 'POPUP_NOTIFICATION',
          originTab: TAB_INSTANCE_ID,
          payload: toastItem
        });
        channel.close();
      } catch (e) {}
    }

    // Auto remove after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const showToast = useCallback((msgOrObj, type = 'info') => {
    if (typeof msgOrObj === 'string') {
      displayToastInternal({ message: msgOrObj, type }, true);
    } else {
      displayToastInternal(msgOrObj, true);
    }
  }, [displayToastInternal]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm === 'granted') {
        showToast({ title: 'Notifications Enabled', message: 'You will now receive desktop popups even in other tabs!', type: 'success' });
      }
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast, requestBrowserPermission, notificationPermission: permission }}>
      {children}
      
      {/* Slack-Style Floating Popup Toaster (Top-Right Stack) */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full font-sans">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-[#17171B] border border-white/15 rounded-xl shadow-2xl overflow-hidden p-3.5 flex items-start gap-3 backdrop-blur-xl animate-in slide-in-from-top-3 fade-in duration-200 transition-all hover:border-[#FF6B3D]/50"
          >
            {/* Status Avatar Badge */}
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                toast.type === 'success'
                  ? 'bg-[#39D98A]/10 text-[#39D98A] border-[#39D98A]/20'
                  : toast.type === 'error'
                  ? 'bg-[#FF5C5C]/10 text-[#FF5C5C] border-[#FF5C5C]/20'
                  : toast.type === 'warning'
                  ? 'bg-[#F5B942]/10 text-[#F5B942] border-[#F5B942]/20'
                  : 'bg-[#FF6B3D]/10 text-[#FF8A65] border-[#FF6B3D]/20'
              }`}
            >
              <span className="material-symbols-outlined text-lg">
                {toast.type === 'success'
                  ? 'check_circle'
                  : toast.type === 'error'
                  ? 'error'
                  : toast.type === 'warning'
                  ? 'warning'
                  : 'notifications_active'}
              </span>
            </div>

            {/* Content Body */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-[#F5F2EA] truncate tracking-wide font-display">
                  {toast.title}
                </span>
                <span className="text-[10px] text-[#6F6C69] font-mono shrink-0">
                  {toast.timestamp}
                </span>
              </div>
              
              <p className="text-xs text-[#A6A3A0] mt-0.5 leading-snug break-words">
                {toast.message}
              </p>

              {toast.link && (
                <div className="mt-2">
                  <a
                    href={toast.link}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FF8A65] hover:text-[#FF6B3D] transition-colors"
                  >
                    View Details
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </a>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#6F6C69] hover:text-[#F5F2EA] p-0.5 rounded transition-colors shrink-0"
              title="Dismiss"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
