'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const CallContext = createContext(null);

export const CALL_STATES = {
  DIALING: 'dialing',
  RINGING: 'ringing',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  UNAVAILABLE: 'unavailable',
  ENDED: 'ended',
  IDLE: 'idle'
};

export function CallProvider({ children }) {
  const router = useRouter();
  const [callState, setCallState] = useState(CALL_STATES.IDLE);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callerName, setCallerName] = useState('John Doe');
  const [activeCallId, setActiveCallId] = useState(null);
  
  // Media references that need to persist
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  
  // Minimal "driver" for the call logic
  // In a real app, this would handle WebRTC/Socket connections
  useEffect(() => {
    let timer;
    if (callState === CALL_STATES.DIALING) {
      timer = setTimeout(() => setCallState(CALL_STATES.RINGING), 1000);
    } else if (callState === CALL_STATES.RINGING) {
      timer = setTimeout(() => setCallState(CALL_STATES.CONNECTING), 2000);
    } else if (callState === CALL_STATES.CONNECTING) {
      timer = setTimeout(() => setCallState(CALL_STATES.CONNECTED), 1500);
    }
    return () => clearTimeout(timer);
  }, [callState]);

  // Call timer
  useEffect(() => {
    let interval;
    if (callState === CALL_STATES.CONNECTED) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const startLocalStream = useCallback(async () => {
    try {
      if (localStreamRef.current) return localStreamRef.current;
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      
      // For demo: Use the same stream for remote to simulate a connection
      remoteStreamRef.current = stream.clone(); 
      
      return stream;
    } catch (err) {
      console.error('Error accessing media', err);
      return null;
    }
  }, []);

  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      // remoteStreamRef.current.getTracks().forEach(track => track.stop()); // Don't stop remote if it's a clone for demo? or do? 
      // For clowned stream it's fine.
      remoteStreamRef.current = null;
    }
  }, []);

  const startCall = useCallback(async (id, name = 'John Doe') => {
    setActiveCallId(id);
    setCallerName(name);
    setCallState(CALL_STATES.DIALING);
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);
    
    await startLocalStream();
    
    // We don't navigate here automatically; the UI calling this should navigate
  }, [startLocalStream]);

  const endCall = useCallback(() => {
    setCallState(CALL_STATES.ENDED);
    stopLocalStream();
    setTimeout(() => {
      setCallState(CALL_STATES.IDLE);
      setActiveCallId(null);
      // Optional: Logic to navigate away if on call page? 
      // Unclear where we want to handle navigation.
    }, 1000);
  }, [stopLocalStream]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled; // Toggle actual track
      });
    }
  }, []);

  const toggleVideo = useCallback(() => {
    setIsVideoOff(prev => !prev);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
  }, []);

  const [incomingCall, setIncomingCall] = useState(null); // { id, name, photo? }

  // ... (previous effects)

  // Simulation effect
  useEffect(() => {
    // expose for debug
    window.simulateCall = (name = 'Alice') => {
      const id = Math.random().toString(36).substr(2, 9);
      
      // If tab is hidden, send notification
      if (document.visibilityState === 'hidden' && Notification.permission === 'granted') {
         new Notification('Incoming Video Call', {
          body: `${name} is calling you...`,
          icon: '/android-chrome-192x192.png' // fallback if exists, or standard icon
        });
      }

      setIncomingCall({ id, name });
    };
    
    // Request notification permission on mount
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const acceptCall = useCallback(() => {
    if (!incomingCall) return;
    const { id, name } = incomingCall;
    setIncomingCall(null);
    startCall(id, name);
    router.push(`/app/call/${id}`);
  }, [incomingCall, router, startCall]);

  const declineCall = useCallback(() => {
    setIncomingCall(null);
  }, []);

  return (
    <CallContext.Provider value={{
      callState,
      activeCallId,
      callerName,
      callDuration,
      isMuted,
      isVideoOff,
      incomingCall,
      localStreamRef,
      remoteStreamRef,
      startCall,
      endCall,
      acceptCall,
      declineCall,
      toggleMute,
      toggleVideo
    }}>
      {children}
    </CallContext.Provider>
  );
}

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
