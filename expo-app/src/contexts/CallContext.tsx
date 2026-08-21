import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { router } from 'expo-router';
import * as Crypto from 'expo-crypto';
import {
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
  mediaDevices,
} from 'react-native-webrtc';

import { supabase } from '@/lib/supabase';
import { registerForPushNotificationsAsync } from '@/lib/notifications';
import {
  getProfile,
  logCallEnd,
  logCallStart,
  logParticipantJoined,
  savePushSubscription,
  updateCallStatus,
} from '@/lib/api';

const CallContext = createContext<CallContextValue | null>(null);

export const CALL_STATES = {
  DIALING: 'dialing',
  RINGING: 'ringing',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  UNAVAILABLE: 'unavailable',
  DECLINED: 'declined',
  ENDED: 'ended',
  IDLE: 'idle',
} as const;

export type CallState = (typeof CALL_STATES)[keyof typeof CALL_STATES];

type IncomingCall = {
  id: string;
  name: string;
  callerId: string;
  avatar_url?: string;
};

type SignalingMessage = { type: string; payload: any };

type CallContextValue = {
  callState: CallState;
  activeCallId: string | null;
  callerName: string;
  callDuration: number;
  isMuted: boolean;
  isVideoOff: boolean;
  incomingCall: IncomingCall | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startCall: (calleeId: string, name?: string, existingCallId?: string | null) => Promise<void>;
  endCall: (signal?: boolean) => void;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  currentUser: any;
  socketConnected: boolean;
};

const WS_SERVER_URL = process.env.EXPO_PUBLIC_WS_SERVER_URL || 'wss://clair.onrender.com';

export function CallProvider({ children }: { children: ReactNode }) {
  const [callState, setCallState] = useState<CallState>(CALL_STATES.IDLE);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callerName, setCallerName] = useState('Loading...');
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<any>(null);
  const candidatesBuffer = useRef<any[]>([]);
  const initiationRef = useRef<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const remoteUserIdRef = useRef<string | null>(null);

  const sendMessage = useCallback((msg: SignalingMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log(`[CallContext] Sending: ${msg.type}`, msg.payload);
      socketRef.current.send(JSON.stringify(msg));
    } else {
      console.warn(`[CallContext] Cannot send ${msg.type}. Socket state: ${socketRef.current?.readyState}`);
    }
  }, []);

  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
      setRemoteStream(null);
    }
  }, []);

  const endCall = useCallback(
    (signal = true) => {
      console.log('Ending call. State:', callState, 'ID:', activeCallId, 'Remote:', remoteUserIdRef.current);

      if (signal && remoteUserIdRef.current) {
        sendMessage({
          type: 'call_ended',
          payload: { targetUserId: remoteUserIdRef.current, callId: activeCallId },
        });
      }

      if (activeCallId) {
        const finalStatus = callState === CALL_STATES.CONNECTED && callDuration > 1 ? 'answered' : 'missed';
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
        setCallState((prev) => {
          if (prev === CALL_STATES.ENDED) {
            setActiveCallId(null);
            initiationRef.current = null;
            return CALL_STATES.IDLE;
          }
          return prev;
        });
      }, 4000);
    },
    [stopLocalStream, activeCallId, callState, sendMessage, callDuration],
  );

  const createPeerConnection = useCallback(
    (targetUserId: string) => {
      if (pcRef.current) return pcRef.current;

      console.log('[CallContext] Creating new RTCPeerConnection');
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      pc.onicecandidate = (event: any) => {
        if (event.candidate) {
          sendMessage({
            type: 'ice_candidate',
            payload: { candidate: event.candidate, targetUserId },
          });
        }
      };

      pc.ontrack = (event: any) => {
        console.log('[CallContext] Remote track received');
        remoteStreamRef.current = event.streams[0];
        setRemoteStream(event.streams[0]);
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
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      pcRef.current = pc;
      return pc;
    },
    [sendMessage, endCall],
  );

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

  const handleSignalingMessage = useCallback(
    async (msg: SignalingMessage) => {
      const { type, payload } = msg;
      console.log(`[CallContext] Received: ${type}`, payload);

      switch (type) {
        case 'registered':
          console.log('[CallContext] Registered with signaling server');
          break;
        case 'incoming_call':
          console.log('[CallContext] Incoming call from:', payload.callerName);
          remoteUserIdRef.current = payload.callerId;
          setIncomingCall({
            id: payload.callId,
            name: payload.callerName,
            callerId: payload.callerId,
            avatar_url: payload.avatar_url,
          });
          setCallState(CALL_STATES.RINGING);
          break;
        case 'call_response':
          if (payload.accepted) {
            console.log('[CallContext] Call accepted by:', payload.responderId);
            remoteUserIdRef.current = payload.responderId;
            setCallState(CALL_STATES.CONNECTING);

            const pc = createPeerConnection(payload.responderId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            sendMessage({
              type: 'session_description',
              payload: { sdp: offer, targetUserId: payload.responderId },
            });
          } else {
            console.log('[CallContext] Call rejected');
            if (activeCallId) logCallEnd(activeCallId, 'missed');
            setCallState(CALL_STATES.DECLINED);
            setTimeout(() => {
              setCallState((prev) => (prev === CALL_STATES.DECLINED ? CALL_STATES.IDLE : prev));
              setActiveCallId((prev) => (prev === payload.callId ? null : prev));
            }, 4000);
          }
          break;
        case 'session_description': {
          const remoteId = payload.senderUserId || payload.callerId;
          const pc = createPeerConnection(remoteId);

          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            await processBufferedCandidates();

            if (payload.sdp.type === 'offer') {
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              sendMessage({
                type: 'session_description',
                payload: { sdp: answer, targetUserId: remoteId },
              });
            }
          } catch (e) {
            console.error('[CallContext] SDP Error:', e);
          }
          break;
        }
        case 'ice_candidate':
          if (pcRef.current && pcRef.current.remoteDescription) {
            try {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch (e) {
              console.error('[CallContext] ICE Error:', e);
            }
          } else {
            candidatesBuffer.current.push(payload.candidate);
          }
          break;
        case 'call_timeout':
          if (activeCallId) logCallEnd(activeCallId, 'missed');
          setIncomingCall(null);
          setCallState(CALL_STATES.UNAVAILABLE);
          if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
          }
          setTimeout(() => {
            setCallState((prev) => (prev === CALL_STATES.UNAVAILABLE ? CALL_STATES.IDLE : prev));
            setActiveCallId(null);
            initiationRef.current = null;
          }, 8000);
          break;
        case 'call_ended':
          endCall(false);
          break;
        case 'call_failed':
          if (activeCallId) logCallEnd(activeCallId, 'missed');
          setCallState(CALL_STATES.UNAVAILABLE);
          setTimeout(() => {
            setCallState((prev) => (prev === CALL_STATES.UNAVAILABLE ? CALL_STATES.IDLE : prev));
            setActiveCallId(null);
            initiationRef.current = null;
          }, 8000);
          break;
      }
    },
    [createPeerConnection, sendMessage, endCall, activeCallId],
  );

  const handlerRef = useRef(handleSignalingMessage);
  useEffect(() => {
    handlerRef.current = handleSignalingMessage;
  }, [handleSignalingMessage]);

  const connectSocket = useCallback((userId: string) => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const ws = new WebSocket(WS_SERVER_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('[CallContext] Socket connected');
      setSocketConnected(true);
      ws.send(JSON.stringify({ type: 'register', payload: { userId } }));
    };

    ws.onmessage = (event: any) => {
      try {
        const msg = JSON.parse(event.data);
        if (handlerRef.current) handlerRef.current(msg);
      } catch (e) {
        console.error('[CallContext] Failed to parse message', e);
      }
    };

    ws.onclose = () => {
      console.log('[CallContext] Socket disconnected');
      setSocketConnected(false);
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    const initUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const profile = await getProfile();
        setCurrentUser({ ...user, profile: profile || {} });
        connectSocket(user.id);

        const token = await registerForPushNotificationsAsync();
        if (token) {
          await savePushSubscription(token);
          console.log('[CallContext] Push token saved');
        }
      }
    };
    initUser();
    return () => {
      if (socketRef.current) socketRef.current.close();
      if (pcRef.current) pcRef.current.close();
    };
  }, [connectSocket]);

  useEffect(() => {
    if (callState !== CALL_STATES.CONNECTED) return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callState]);

  const startLocalStream = useCallback(async () => {
    try {
      if (localStreamRef.current) return localStreamRef.current;
      const stream = (await mediaDevices.getUserMedia({ video: true, audio: true })) as unknown as MediaStream;
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Error accessing media', err);
      return null;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newState = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !newState;
        });
      }
      return newState;
    });
  }, []);

  const toggleVideo = useCallback(() => {
    setIsVideoOff((prev) => {
      const newState = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = !newState;
        });
      }
      return newState;
    });
  }, []);

  const startCall = useCallback(
    async (calleeId: string, name = 'User', existingCallId: string | null = null) => {
      if (callState !== CALL_STATES.IDLE && activeCallId === (existingCallId || activeCallId)) return;
      if (initiationRef.current === (existingCallId || 'new')) return;

      initiationRef.current = existingCallId || 'new';
      remoteUserIdRef.current = calleeId;

      const callId = existingCallId || Crypto.randomUUID();
      const avatar = currentUser?.profile?.avatar_url || currentUser?.user_metadata?.avatar_url;
      const displayName = currentUser?.profile?.display_name || currentUser?.user_metadata?.display_name || 'Anonymous';

      setActiveCallId(callId);
      setCallerName(name);
      setCallState(CALL_STATES.DIALING);
      setCallDuration(0);
      setIsMuted(false);
      setIsVideoOff(false);

      await startLocalStream();

      logCallStart(callId, calleeId);

      if (currentUser) {
        sendMessage({
          type: 'call_request',
          payload: {
            callId,
            calleeId,
            callerId: currentUser.id,
            callerName: displayName,
            avatar_url: avatar,
          },
        });
      }

      if (!existingCallId) {
        router.push({
          pathname: '/(app)/call/[id]',
          params: { id: callId, callee: calleeId, initiator: 'true', name, avatar: avatar || '' },
        });
      }
    },
    [startLocalStream, currentUser, callState, activeCallId, sendMessage],
  );

  const performAcceptCall = useCallback(
    async (callData: IncomingCall) => {
      const { id, name, callerId } = callData;

      remoteUserIdRef.current = callerId;
      setCallState(CALL_STATES.CONNECTING);
      await startLocalStream();

      logParticipantJoined(id);
      updateCallStatus(id, 'connected');

      sendMessage({
        type: 'call_response',
        payload: { callId: id, accepted: true, callerId, responderId: currentUser?.id },
      });

      setIncomingCall(null);
      setActiveCallId(id);
      setCallerName(name);
      router.push({ pathname: '/(app)/call/[id]', params: { id } });
    },
    [startLocalStream, sendMessage, currentUser],
  );

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    await performAcceptCall(incomingCall);
  }, [incomingCall, performAcceptCall]);

  const declineCall = useCallback(() => {
    if (incomingCall) {
      sendMessage({
        type: 'call_response',
        payload: { callId: incomingCall.id, accepted: false, callerId: incomingCall.callerId },
      });
    }
    setIncomingCall(null);
  }, [incomingCall, sendMessage]);

  return (
    <CallContext.Provider
      value={{
        callState,
        activeCallId,
        callerName,
        callDuration,
        isMuted,
        isVideoOff,
        incomingCall,
        localStream,
        remoteStream,
        startCall,
        endCall,
        acceptCall,
        declineCall,
        toggleMute,
        toggleVideo,
        currentUser,
        socketConnected,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within a CallProvider');
  return context;
};
