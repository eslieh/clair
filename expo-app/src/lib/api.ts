import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  email?: string;
  display_name: string;
  username: string;
  status: string;
  avatar_url: string;
};

export async function getProfile(): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profile')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return {
      id: user.id,
      email: user.email,
      display_name: user.user_metadata?.full_name || '',
      username: '',
      status: '',
      avatar_url: '',
    };
  }

  return { ...profile, email: user.email };
}

export async function updateProfile(fields: {
  displayName: string;
  username: string;
  status: string;
  avatarUrl: string;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.from('profile').upsert({
    id: user.id,
    display_name: fields.displayName,
    username: fields.username,
    status: fields.status,
    avatar_url: fields.avatarUrl,
  });

  if (error) {
    console.error('updateProfile error', error);
    return { error: 'Could not update profile' };
  }

  return { success: true };
}

export async function logCallStart(callId: string, calleeId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error: callError } = await supabase.from('calls').insert({
    id: callId,
    caller_id: user.id,
    callee_id: calleeId,
    status: 'dialing',
    started_at: new Date().toISOString(),
  });

  if (callError) {
    if (callError.code === '23505') return { success: true };
    console.error('logCallStart error', callError);
    return { error: 'Could not create call log' };
  }

  await supabase.from('call_participants').insert({
    call_id: callId,
    user_id: user.id,
    joined_at: new Date().toISOString(),
  });

  return { success: true };
}

export async function updateCallStatus(callId: string, status: string) {
  const { error } = await supabase.from('calls').update({ status }).eq('id', callId);

  if (error) {
    console.error('updateCallStatus error', error);
    return { error: 'Could not update call status' };
  }

  return { success: true };
}

export async function logParticipantJoined(callId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.from('call_participants').insert({
    call_id: callId,
    user_id: user.id,
    joined_at: new Date().toISOString(),
  });

  return { success: !error };
}

export async function logCallEnd(callId: string, finalStatus = 'ended') {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase
    .from('calls')
    .update({ status: finalStatus, ended_at: new Date().toISOString() })
    .eq('id', callId);

  if (user) {
    await supabase
      .from('call_participants')
      .update({ left_at: new Date().toISOString() })
      .match({ call_id: callId, user_id: user.id });
  }

  return { success: true };
}

export type CallHistoryItem = {
  id: string;
  status: string;
  rawStatus: string;
  date: string;
  direction: 'outbound' | 'inbound';
  other: {
    id: string;
    display_name: string;
    username: string;
    avatar_url: string;
  } | null;
};

export async function getCallHistory(): Promise<CallHistoryItem[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('calls')
    .select(
      `
      id,
      status,
      started_at,
      caller_id,
      callee_id,
      caller:profile!calls_caller_id_fkey(id, display_name, username, avatar_url),
      callee:profile!calls_callee_id_fkey(id, display_name, username, avatar_url)
    `,
    )
    .or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`)
    .order('started_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('getCallHistory error', error);
    return [];
  }

  return (data as any[]).map((call) => {
    const isCaller = call.caller_id === user.id;
    const other = isCaller ? call.callee : call.caller;

    let displayStatus = call.status;
    if (call.status === 'missed') {
      displayStatus = isCaller ? 'Not answered' : 'Missed call';
    } else if (call.status === 'ended' || call.status === 'answered') {
      displayStatus = 'Completed';
    } else if (call.status === 'dialing' || call.status === 'ringing') {
      displayStatus = 'Canceled';
    }

    return {
      id: call.id,
      status: displayStatus,
      rawStatus: call.status,
      date: call.started_at,
      direction: isCaller ? 'outbound' : 'inbound',
      other,
    };
  });
}

export async function getContacts() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('contacts')
    .select('contact_id, profile:contact_id(id, display_name, username, avatar_url, status)')
    .eq('user_id', user.id);

  if (error) {
    console.error('getContacts error', error);
    return [];
  }

  return (data as any[]).map((d) => d.profile);
}

export async function searchUsers(query: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!query || query.length < 2) return [];

  const { data, error } = await supabase
    .from('profile')
    .select('id, display_name, username, avatar_url, status')
    .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
    .neq('id', user?.id ?? '')
    .limit(10);

  if (error) {
    console.error('searchUsers error', error);
    return [];
  }

  return data;
}

export async function addContact(contactId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.from('contacts').insert({
    user_id: user.id,
    contact_id: contactId,
  });

  if (error) {
    if (error.code === '23505') return { success: true };
    console.error('addContact error', error);
    return { error: 'Could not add contact' };
  }

  return { success: true };
}

export async function savePushSubscription(expoPushToken: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      platform: 'expo',
      subscription: { token: expoPushToken },
    },
    { onConflict: 'user_id,platform' },
  );

  if (error) {
    console.error('savePushSubscription error', error);
    return { error: 'Could not save subscription' };
  }

  return { success: true };
}
