'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { logCallStart, updateCallStatus, logParticipantJoined, logCallEnd, savePushSubscription } from '@/app/app/calls/actions';

const CallContext = createContext(null);

export const CALL_STATES = {
  DIALING: 'dialing',
  RINGING: 'ringing',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  UNAVAILABLE: 'unavailable',
  DECLINED: 'declined',
  ENDED: 'ended',
  IDLE: 'idle'
};

const WS_SERVER_URL = process.env.WS_SERVER_URL || 'wss:clair.onrender.com';  

export function CallProvider({ children }) {
  const router = useRouter();
  
  // 1. State declarations
  const [callState, setCallState] = useState(CALL_STATES.IDLE);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callerName, setCallerName] = useState('John Doe');
  const [activeCallId, setActiveCallId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  // 2. Ref declarations
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const candidatesBuffer = useRef([]);
  const initiationRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const remoteUserIdRef = useRef(null);

  // 3. Basic helpers
  const sendMessage = useCallback((msg) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log(`[CallContext] Sending: ${msg.type}`, msg.payload);
      socketRef.current.send(JSON.stringify(msg));
    } else {
      console.warn(`[CallContext] Cannot send ${msg.type}. Socket state: ${socketRef.current?.readyState}`);
    }
  }, []);

  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop());
      remoteStreamRef.current = null;
    }
  }, []);

  const endCall = useCallback((signal = true) => {
    console.log('Ending call. State:', callState, 'ID:', activeCallId, 'Duration:', callDuration, 'Remote:', remoteUserIdRef.current);
    
    if (signal && remoteUserIdRef.current) {
      sendMessage({
        type: 'call_ended',
        payload: { targetUserId: remoteUserIdRef.current, callId: activeCallId }
      });
    }

    // DB Log: "answered" if duration > 1s, otherwise "missed" (or "canceled")
    if (activeCallId) {
      const finalStatus = (callState === CALL_STATES.CONNECTED && callDuration > 1) ? 'answered' : 'missed';
      logCallEnd(activeCallId, finalStatus);
    }

    setCallState(CALL_STATES.ENDED);
    stopLocalStream();
    remoteUserIdRef.current = null;
    
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    setTimeout(() => {
      // Only clear if we are still in ENDED state (haven't started a new call)
      setCallState(prev => {
        if (prev === CALL_STATES.ENDED) {
          setActiveCallId(null);
          initiationRef.current = null;
          return CALL_STATES.IDLE;
        }
        return prev;
      });
    }, 4000); // 4 seconds to allow UI to redirect
  }, [stopLocalStream, activeCallId, callState, sendMessage, callDuration]);

  // 4. WebRTC helpers
  const createPeerConnection = useCallback((targetUserId) => {
    if (pcRef.current) return pcRef.current;

    console.log('[CallContext] Creating new RTCPeerConnection');
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage({
          type: 'ice_candidate',
          payload: { candidate: event.candidate, targetUserId }
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('[CallContext] Remote track received');
      remoteStreamRef.current = event.streams[0];
      setCallState(prev => prev); // trigger re-render
    };

    pc.onconnectionstatechange = () => {
      console.log('[CallContext] WebRTC Connection State:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallState(CALL_STATES.CONNECTED);
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        endCall();
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pcRef.current = pc;
    return pc;
  }, [sendMessage, endCall]);

  const processBufferedCandidates = async () => {
    if (!pcRef.current || !pcRef.current.remoteDescription) return;
    console.log(`[CallContext] Processing ${candidatesBuffer.current.length} buffered candidates`);
    while (candidatesBuffer.current.length > 0) {
      const candidate = candidatesBuffer.current.shift();
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('[CallContext] Error adding buffered candidate', e);
      }
    }
  };

  // 5. Signaling logic
  const handleSignalingMessage = useCallback(async (msg) => {
    const { type, payload } = msg;
    console.log(`[CallContext] Received: ${type}`, payload);
    
    switch (type) {
      case 'registered':
        console.log('[CallContext] Registered with signaling server');
        break;
      case 'incoming_call':
        console.log('[CallContext] Incoming call from:', payload.callerName);
        remoteUserIdRef.current = payload.callerId;

        // Browser Notification if tab is hidden
        if (document.visibilityState === 'hidden') {
          if (Notification.permission === 'granted') {
            new Notification(`Incoming Clair Call`, {
              body: `${payload.callerName} is calling you`,
              icon: payload.avatar_url || '/favicon.ico',
              tag: payload.callId
            });
          }
        }

        setIncomingCall({ 
          id: payload.callId, 
          name: payload.callerName,
          callerId: payload.callerId,
          avatar_url: payload.avatar_url
        });
        setCallState(CALL_STATES.RINGING);
        break;
      case 'call_response':
        if (payload.accepted) {
          console.log('[CallContext] Call accepted by:', payload.responderId);
          remoteUserIdRef.current = payload.responderId;
          setCallState(CALL_STATES.CONNECTING);
          
          const pc = createPeerConnection(payload.responderId);
          console.log('[CallContext] PeerConnection created, creating offer...');
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          
          sendMessage({
            type: 'session_description',
            payload: { sdp: offer, targetUserId: payload.responderId }
          });
          console.log('[CallContext] Offer sent');
        } else {
          console.log('[CallContext] Call rejected');
          if (activeCallId) logCallEnd(activeCallId, 'missed');
          setCallState(CALL_STATES.DECLINED);
          setTimeout(() => {
             setCallState(prev => prev === CALL_STATES.DECLINED ? CALL_STATES.IDLE : prev);
             setActiveCallId(prev => prev === payload.callId ? null : prev);
          }, 4000);
        }
        break;
      case 'session_description':
        console.log(`[CallContext] Received SDP: ${payload.sdp.type} from ${payload.senderUserId || payload.callerId}`);
        const remoteId = payload.senderUserId || payload.callerId;
        const pc = createPeerConnection(remoteId);
        
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          console.log('[CallContext] Remote description set');
          await processBufferedCandidates();

          if (payload.sdp.type === 'offer') {
            console.log('[CallContext] Creating answer...');
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendMessage({
              type: 'session_description',
              payload: { sdp: answer, targetUserId: remoteId }
            });
            console.log('[CallContext] Answer sent');
          }
        } catch (e) {
          console.error('[CallContext] SDP Error:', e);
        }
        break;
      case 'ice_candidate':
        if (pcRef.current && pcRef.current.remoteDescription) {
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
            console.log('[CallContext] ICE candidate added');
          } catch (e) {
            console.error('[CallContext] ICE Error:', e);
          }
        } else {
          console.log('[CallContext] Buffering ICE candidate');
          candidatesBuffer.current.push(payload.candidate);
        }
        break;
      case 'call_timeout':
        console.log('[CallContext] Call timeout');
        if (activeCallId) logCallEnd(activeCallId, 'missed');
        setIncomingCall(null);
        setCallState(CALL_STATES.UNAVAILABLE);
        if (pcRef.current) {
          pcRef.current.close();
          pcRef.current = null;
        }
        setTimeout(() => {
          setCallState(prev => prev === CALL_STATES.UNAVAILABLE ? CALL_STATES.IDLE : prev);
          setActiveCallId(null);
          initiationRef.current = null;
        }, 8000); // 8s buffer
        break;
      case 'call_ended':
        console.log('[CallContext] Call ended by peer');
        endCall(false);
        break;
      case 'call_failed':
        console.log('[CallContext] Call failed:', payload.reason);
        if (activeCallId) logCallEnd(activeCallId, 'missed');
        setCallState(CALL_STATES.UNAVAILABLE);
        setTimeout(() => {
          setCallState(prev => prev === CALL_STATES.UNAVAILABLE ? CALL_STATES.IDLE : prev);
          setActiveCallId(null);
          initiationRef.current = null;
        }, 8000); // 8s buffer
        break;
    }
  }, [createPeerConnection, sendMessage, endCall, activeCallId]);

  // Stable ref for the signaling handler to avoid socket churn
  const handlerRef = useRef(handleSignalingMessage);
  useEffect(() => {
    handlerRef.current = handleSignalingMessage;
  }, [handleSignalingMessage]);

  const connectSocket = useCallback((userId) => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return; 
    }

    const ws = new WebSocket(WS_SERVER_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('[CallContext] Socket connected');
      ws.send(JSON.stringify({ type: 'register', payload: { userId } }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (handlerRef.current) handlerRef.current(msg);
      } catch (e) {
        console.error('[CallContext] Failed to parse message', e);
      }
    };
    
    ws.onclose = () => {
      console.log('[CallContext] Socket disconnected');
      socketRef.current = null;
    };
  }, []); // No dependencies! Stable.

  // 6. Effects
  useEffect(() => {
    const supabase = createClient();
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profile')
          .select('display_name, avatar_url')
          .eq('id', user.id)
          .single();

        setCurrentUser({ ...user, profile: profile || {} });
        connectSocket(user.id);

        // Request notification permission & Register SW
        if (Notification.permission === 'default') {
          Notification.requestPermission();
        }

        if ('serviceWorker' in navigator && Notification.permission === 'granted') {
          registerAndSubscribePush();
        }
      }
    };
    initUser();
    return () => {
      if (socketRef.current) socketRef.current.close();
      if (pcRef.current) pcRef.current.close();
    };
  }, [connectSocket]);

  const registerAndSubscribePush = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[CallContext] Service Worker registered');

      const publicVapidKey = 'BD-nQp7h93xiIx4QsndwrN0I1RXvCbuEkt7nS7VF1TqLyvjOSVA3GJxPJXEOXItheQ3PCUzC8Wu_qkXl48mDOuQ';
      
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });
        console.log('[CallContext] Push Subscription created');
      }

      await savePushSubscription(JSON.parse(JSON.stringify(subscription)));
      console.log('[CallContext] Push Subscription saved to DB');
    } catch (err) {
      console.error('[CallContext] Push registration failed:', err);
    }
  };

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
   
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
   
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
  
  useEffect(() => {
    let interval;
    if (callState === CALL_STATES.CONNECTED) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else if (callState === CALL_STATES.IDLE) {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [callState]);

  // 7. Media actions
  const startLocalStream = useCallback(async () => {
    try {
      if (localStreamRef.current) return localStreamRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error('Error accessing media', err);
      return null;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newState = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = !newState;
        });
      }
      return newState;
    });
  }, []);

  const toggleVideo = useCallback(() => {
    setIsVideoOff(prev => {
      const newState = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(track => {
          track.enabled = !newState;
        });
      }
      return newState;
    });
  }, []);

  // 8. Public Call actions
  const startCall = useCallback(async (calleeId, name = 'User', existingCallId = null) => {
    if (callState !== CALL_STATES.IDLE && activeCallId === (existingCallId || activeCallId)) return;
    if (initiationRef.current === (existingCallId || 'new')) return;
    
    initiationRef.current = existingCallId || 'new';
    remoteUserIdRef.current = calleeId;

    const callId = existingCallId || crypto.randomUUID();
    const avatar = currentUser?.profile?.avatar_url || currentUser?.user_metadata?.avatar_url;
    const displayName = currentUser?.profile?.display_name || currentUser?.user_metadata?.display_name || 'Anonymous';
    
    setActiveCallId(callId);
    setCallerName(name);
    setCallState(CALL_STATES.DIALING);
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);
    
    await startLocalStream();
    
    // DB Log
    logCallStart(callId, calleeId);
    
    if (currentUser) {
      sendMessage({
        type: 'call_request',
        payload: {
          callId,
          calleeId,
          callerId: currentUser.id,
          callerName: displayName,
          avatar_url: avatar
        }
      });
    }

    if (!existingCallId) {
      router.push(`/app/call/${callId}?callee=${calleeId}&initiator=true&name=${encodeURIComponent(name)}${avatar ? `&avatar=${encodeURIComponent(avatar)}` : ''}`);
    }
  }, [startLocalStream, currentUser, router, callState, activeCallId, sendMessage]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    const { id, name, callerId } = incomingCall;
    
    remoteUserIdRef.current = callerId;
    setCallState(CALL_STATES.CONNECTING);
    await startLocalStream();

    // DB Log
    logParticipantJoined(id);
    updateCallStatus(id, 'connected');

    sendMessage({
      type: 'call_response',
      payload: {
        callId: id, accepted: true, callerId: callerId, responderId: currentUser?.id
      }
    });

    setIncomingCall(null);
    setActiveCallId(id);
    setCallerName(name);
    router.push(`/app/call/${id}`);
  }, [incomingCall, router, startLocalStream, sendMessage, currentUser]);

  const declineCall = useCallback(() => {
    if (incomingCall) {
       sendMessage({
        type: 'call_response',
        payload: {
          callId: incomingCall.id, accepted: false, callerId: incomingCall.callerId
        }
      });
    }
    setIncomingCall(null);
  }, [incomingCall, sendMessage]);

  return (
    <CallContext.Provider value={{
      callState, activeCallId, callerName, callDuration, isMuted, isVideoOff, incomingCall,
      localStreamRef, remoteStreamRef, startCall, endCall, acceptCall, declineCall,
      toggleMute, toggleVideo, sendMessage,
      setIncomingCall, setCallState, remoteUserIdRef // Exposed for initialization
    }}>
      <Suspense fallback={null}>
        <CallContextURLHandler />
      </Suspense>
      {children}
    </CallContext.Provider>
  );
}

function CallContextURLHandler() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { callState, setIncomingCall, setCallState, remoteUserIdRef } = useCall();

  useEffect(() => {
    const answering = searchParams.get('answering') === 'true';
    const calleeId = searchParams.get('callee');
    const callerId = searchParams.get('callerId');
    const callerNameParam = searchParams.get('callerName');
    const callerAvatar = searchParams.get('callerAvatar');

    // Only auto-initialize if we are landing on the call page and no active call is present
    if (answering && calleeId && callerId && callState === CALL_STATES.IDLE) {
      const match = pathname.match(/\/app\/call\/([^/?#]+)/);
      const callId = match ? match[1] : null;

      if (callId) {
        console.log('[CallContext] Auto-initializing incoming call from URL:', { callId, callerNameParam });
        setIncomingCall({
          id: callId,
          name: callerNameParam || 'User',
          callerId: callerId,
          avatar_url: callerAvatar
        });
        setCallState(CALL_STATES.RINGING);
        remoteUserIdRef.current = callerId;
      }
    }
  }, [searchParams, pathname, callState]);

  return null;
}

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within a CallProvider');
  return context;
};
