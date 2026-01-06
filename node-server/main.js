const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Setup Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const port = process.env.PORT || 3001;

// Setup Web Push
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const wss = new WebSocket.Server({ port });

// Map userId -> WebSocket
const clients = new Map();
// Map callId -> TimeoutId
const callTimeouts = new Map();
// Map userId -> Array of queued messages
const messageQueues = new Map();

console.log(`Signaling server running on port ${port}`);

wss.on('connection', (ws) => {
  ws.id = uuidv4();
  console.log(`Client connected: ${ws.id}`);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(ws, data);
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  });

  ws.on('error', (err) => {
    console.error(`Client error: ${err.message}`);
  });

  ws.on('close', () => {
    console.log(`Client disconnected: ${ws.userId || ws.id}`);
    if (ws.userId) {
      // Don't delete from queues, they might re-register shortly
      clients.delete(ws.userId);
    }
  });
});

function handleMessage(ws, data) {
  const { type, payload } = data;
  console.log(`[Server] Received message: "${type}" from ${ws.userId || ws.id}`);

  switch (type) {
    case 'register':
      handleRegister(ws, payload);
      break;
    case 'call_request':
      handleCallRequest(ws, payload);
      break;
    case 'call_response':
      handleCallResponse(ws, payload);
      break;
    case 'ice_candidate':
    case 'session_description':
    case 'call_ended':
      handleSignaling(ws, ws.userId, type, payload);
      break;
    default:
      console.warn(`Unknown message type: ${type}`);
  }
}

function handleRegister(ws, payload) {
  const { userId } = payload;
  if (!userId) return;
  
  ws.userId = userId;
  clients.set(userId, ws);
  console.log(`User registered: ${userId}`);
  
  sendMessage(ws, 'registered', { userId });

  // Check for queued messages
  const queue = messageQueues.get(userId);
  if (queue && queue.length > 0) {
    console.log(`Delivering ${queue.length} queued messages to ${userId}`);
    while (queue.length > 0) {
      const msg = queue.shift();
      ws.send(JSON.stringify(msg));
    }
  }
}

async function sendPushNotification(userId, data) {
  try {
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId);

    if (error) throw error;
    if (!subs || subs.length === 0) {
      console.log(`[Push] No subscriptions found for ${userId}`);
      return;
    }

    console.log(`[Push] Sending to ${subs.length} subscriptions for ${userId}`);
    
    const payload = JSON.stringify({
      title: data.title || 'Incoming Clair Call',
      body: data.body || 'Someone is calling you',
      icon: data.icon || '/favicon.ico',
      url: `/app/call/${data.callId}?callee=${userId}`
    });

    const promises = subs.map(s => 
      webpush.sendNotification(s.subscription, payload)
        .catch(err => {
          console.error('[Push] Single subscription failed:', err.statusCode);
        })
    );
    
    await Promise.all(promises);
    console.log('[Push] Finished sending all pushes');
  } catch (err) {
    console.error('[Push] Error fetching/sending:', err);
  }
}

function handleCallRequest(ws, payload) {
  const { calleeId, callerName, callerId, callId } = payload;
  
  console.log(`Call request from ${callerId} to ${calleeId} with ID ${callId}`);

  // Send Push Notification
  sendPushNotification(calleeId, {
    callId,
    title: 'Incoming Call',
    body: `${callerName} is calling you`,
    avatar_url: payload.avatar_url
  });

  const calleeWs = clients.get(calleeId);
  if (calleeWs) {
    // Forward request to callee via websocket
    sendMessage(calleeWs, 'incoming_call', {
      callId,
      callerId,
      callerName,
      avatar_url: payload.avatar_url
    });
  } else {
    console.log(`Callee ${calleeId} not online, push sent.`);
  }

  // Set 30s timeout
  const timeoutId = setTimeout(() => {
    console.log(`Call ${callId} timed out`);
    if (callTimeouts.has(callId)) {
      callTimeouts.delete(callId);
      
      // Notify both parties
      sendMessage(ws, 'call_timeout', { callId });
      const cWs = clients.get(calleeId);
      if (cWs) sendMessage(cWs, 'call_timeout', { callId });
    }
  }, 30000);

  callTimeouts.set(callId, timeoutId);
}

function handleCallResponse(ws, payload) {
  const { callId, accepted, callerId } = payload;
  
  console.log(`Call response for ${callId}: ${accepted ? 'Accepted' : 'Rejected'}`);

  // Clear timeout
  if (callTimeouts.has(callId)) {
    clearTimeout(callTimeouts.get(callId));
    callTimeouts.delete(callId);
  }

  const callerWs = clients.get(callerId);
  if (callerWs) {
    sendMessage(callerWs, 'call_response', {
      callId,
      accepted,
      responderId: ws.userId
    });
  } else {
    console.log(`Caller ${callerId} disconnected, queuing call_response`);
    queueMessage(callerId, {
      type: 'call_response',
      payload: { callId, accepted, responderId: ws.userId }
    });
  }
}

function handleSignaling(ws, userId, type, payload) {
  const targetUserId = payload.targetUserId || payload.calleeId;
  console.log(`[Signaling] ${type} from ${userId} to ${targetUserId}`);
  
  const targetWs = clients.get(targetUserId);
  if (targetWs && targetWs.readyState === WebSocket.OPEN) {
    targetWs.send(JSON.stringify({
      type,
      payload: {
        ...payload,
        senderUserId: userId
      }
    }));
    console.log(`[Signaling] Forwarded ${type} to ${targetUserId}`);
  } else {
    console.warn(`[Signaling] Target ${targetUserId} offline, queuing ${type}`);
    queueMessage(targetUserId, {
      type,
      payload: { ...payload, senderUserId: userId }
    });
  }
}

function queueMessage(userId, message) {
  if (!messageQueues.has(userId)) {
    messageQueues.set(userId, []);
  }
  const queue = messageQueues.get(userId);
  queue.push(message);

  // Keep queue size reasonable
  if (queue.length > 50) queue.shift();

  // Clear queue after 10 seconds if not delivered
  setTimeout(() => {
    const q = messageQueues.get(userId);
    if (q) {
      const idx = q.indexOf(message);
      if (idx > -1) q.splice(idx, 1);
    }
  }, 10000);
}

function sendMessage(ws, type, payload) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, payload }));
  }
}