'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function logCallStart(callId, calleeId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // 1. Create call record
  const { error: callError } = await supabase
    .from('calls')
    .insert({
      id: callId,
      caller_id: user.id,
      callee_id: calleeId,
      status: 'dialing',
      started_at: new Date().toISOString()
    })

  if (callError) {
    if (callError.code === '23505') return { success: true }; // Already logged
    console.error('logCallStart error', callError)
    return { error: 'Could not create call log' }
  }

  // 2. Add caller as participant
  await supabase
    .from('call_participants')
    .insert({
      call_id: callId,
      user_id: user.id,
      joined_at: new Date().toISOString()
    })

  return { success: true }
}

export async function updateCallStatus(callId, status) {
  const supabase = await createClient()
  
  const updateData = { status }
  
  const { error } = await supabase
    .from('calls')
    .update(updateData)
    .eq('id', callId)

  if (error) {
    console.error('updateCallStatus error', error)
    return { error: 'Could not update call status' }
  }

  // If status is connected, we might want to add the callee as participant too
  // although usually it's better to do that when THEY accept.
  return { success: true }
}

export async function logParticipantJoined(callId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('call_participants')
    .insert({
      call_id: callId,
      user_id: user.id,
      joined_at: new Date().toISOString()
    })
    
  return { success: !error }
}

export async function logCallEnd(callId, finalStatus = 'ended') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // 1. Update call record
  await supabase
    .from('calls')
    .update({
      status: finalStatus,
      ended_at: new Date().toISOString()
    })
    .eq('id', callId)

  // 2. Mark participant as left
  if (user) {
    await supabase
      .from('call_participants')
      .update({ left_at: new Date().toISOString() })
      .match({ call_id: callId, user_id: user.id })
  }

  return { success: true }
}

export async function getCallHistory() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('calls')
    .select(`
      id,
      status,
      started_at,
      caller_id,
      callee_id,
      caller:profile!calls_caller_id_fkey(display_name, username, avatar_url),
      callee:profile!calls_callee_id_fkey(display_name, username, avatar_url)
    `)
    .or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`)
    .order('started_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('getCallHistory error', error)
    return []
  }

  return data.map(call => {
    const isCaller = call.caller_id === user.id
    const other = isCaller ? call.callee : call.caller
    
    let displayStatus = call.status
    if (call.status === 'missed') {
      displayStatus = isCaller ? 'Not answered' : 'Missed call'
    } else if (call.status === 'ended' || call.status === 'answered') {
      displayStatus = 'Completed'
    } else if (call.status === 'dialing' || call.status === 'ringing') {
      displayStatus = 'Canceled' // Assuming if it stayed in this state and ended, it was canceled
    }

    return {
      id: call.id,
      status: displayStatus,
      rawStatus: call.status,
      date: call.started_at,
      direction: isCaller ? 'outbound' : 'inbound',
      other
    }
  })
}

export async function getContacts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('contacts')
    .select(`
      contact_id,
      profile:contact_id(id, display_name, username, avatar_url, status)
    `)
    .eq('user_id', user.id)

  if (error) {
    console.error('getContacts error', error)
    return []
  }

  return data.map(d => d.profile)
}

export async function searchUsers(query) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!query || query.length < 2) return []

  const { data, error } = await supabase
    .from('profile')
    .select('id, display_name, username, avatar_url, status')
    .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
    .neq('id', user?.id) // Don't show self
    .limit(10)

  if (error) {
    console.error('searchUsers error', error)
    return []
  }

  return data
}

export async function addContact(contactId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('contacts')
    .insert({
      user_id: user.id,
      contact_id: contactId
    })

  if (error) {
    // ignore duplicate key error usually
    if (error.code === '23505') return { success: true }
    console.error('addContact error', error)
    return { error: 'Could not add contact' }
  }

  revalidatePath('/app')
  return { success: true }
}
