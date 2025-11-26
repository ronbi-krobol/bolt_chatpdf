import { supabase } from '../lib/supabase';
import { getCurrentUser, getUserProfile } from './authService';

const MAX_ANONYMOUS_PDFS_PER_DAY = 3;
const MAX_ANONYMOUS_MESSAGES_PER_DAY = 50;

const MAX_FREE_PDFS_PER_MONTH = 10;
const MAX_FREE_MESSAGES_PER_DAY = 120;

function getSessionId(): string {
  let sessionId = localStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('session_id', sessionId);
  }
  return sessionId;
}

export async function checkPDFUploadLimit(): Promise<{ allowed: boolean; remaining: number }> {
  const user = await getCurrentUser();

  if (user) {
    const profile = await getUserProfile(user.id);

    if (profile?.tier === 'plus') {
      return { allowed: true, remaining: 999999 };
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('pdf_files')
      .select('id')
      .eq('user_id', user.id)
      .gte('upload_date', startOfMonth.toISOString());

    if (error) throw error;

    const uploadedThisMonth = data?.length || 0;
    const allowed = uploadedThisMonth < MAX_FREE_PDFS_PER_MONTH;
    const remaining = MAX_FREE_PDFS_PER_MONTH - uploadedThisMonth;

    return { allowed, remaining };
  }

  const sessionId = getSessionId();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('usage_limits')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    await supabase.from('usage_limits').insert({
      session_id: sessionId,
      pdfs_uploaded_today: 0,
      messages_sent_today: 0,
      last_reset_date: today,
      user_tier: 'anonymous',
    });
    return { allowed: true, remaining: MAX_ANONYMOUS_PDFS_PER_DAY };
  }

  if (data.last_reset_date !== today) {
    await supabase
      .from('usage_limits')
      .update({
        pdfs_uploaded_today: 0,
        messages_sent_today: 0,
        last_reset_date: today,
      })
      .eq('session_id', sessionId);
    return { allowed: true, remaining: MAX_ANONYMOUS_PDFS_PER_DAY };
  }

  const allowed = data.pdfs_uploaded_today < MAX_ANONYMOUS_PDFS_PER_DAY;
  const remaining = MAX_ANONYMOUS_PDFS_PER_DAY - data.pdfs_uploaded_today;

  return { allowed, remaining };
}

export async function incrementPDFUpload(): Promise<void> {
  const user = await getCurrentUser();

  if (user) {
    return;
  }

  const sessionId = getSessionId();
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('usage_limits')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (!data) {
    await supabase.from('usage_limits').insert({
      session_id: sessionId,
      pdfs_uploaded_today: 1,
      messages_sent_today: 0,
      last_reset_date: today,
      user_tier: 'anonymous',
    });
  } else {
    await supabase
      .from('usage_limits')
      .update({
        pdfs_uploaded_today: data.pdfs_uploaded_today + 1,
      })
      .eq('session_id', sessionId);
  }
}

export async function checkMessageLimit(): Promise<{ allowed: boolean; remaining: number }> {
  const user = await getCurrentUser();

  if (user) {
    const profile = await getUserProfile(user.id);

    if (profile?.tier === 'plus') {
      return { allowed: true, remaining: 999999 };
    }

    const sessionId = `user_${user.id}`;
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('usage_limits')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      await supabase.from('usage_limits').insert({
        user_id: user.id,
        session_id: sessionId,
        pdfs_uploaded_today: 0,
        messages_sent_today: 0,
        last_reset_date: today,
        user_tier: profile?.tier || 'free',
      });
      return { allowed: true, remaining: MAX_FREE_MESSAGES_PER_DAY };
    }

    if (data.last_reset_date !== today) {
      await supabase
        .from('usage_limits')
        .update({
          messages_sent_today: 0,
          last_reset_date: today,
        })
        .eq('session_id', sessionId);
      return { allowed: true, remaining: MAX_FREE_MESSAGES_PER_DAY };
    }

    const allowed = data.messages_sent_today < MAX_FREE_MESSAGES_PER_DAY;
    const remaining = MAX_FREE_MESSAGES_PER_DAY - data.messages_sent_today;

    return { allowed, remaining };
  }

  const sessionId = getSessionId();
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('usage_limits')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    await supabase.from('usage_limits').insert({
      session_id: sessionId,
      pdfs_uploaded_today: 0,
      messages_sent_today: 0,
      last_reset_date: today,
      user_tier: 'anonymous',
    });
    return { allowed: true, remaining: MAX_ANONYMOUS_MESSAGES_PER_DAY };
  }

  if (data.last_reset_date !== today) {
    await supabase
      .from('usage_limits')
      .update({
        pdfs_uploaded_today: 0,
        messages_sent_today: 0,
        last_reset_date: today,
      })
      .eq('session_id', sessionId);
    return { allowed: true, remaining: MAX_ANONYMOUS_MESSAGES_PER_DAY };
  }

  const allowed = data.messages_sent_today < MAX_ANONYMOUS_MESSAGES_PER_DAY;
  const remaining = MAX_ANONYMOUS_MESSAGES_PER_DAY - data.messages_sent_today;

  return { allowed, remaining };
}

export async function incrementMessageCount(): Promise<void> {
  const user = await getCurrentUser();

  if (user) {
    const sessionId = `user_${user.id}`;
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('usage_limits')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (!data) {
      const profile = await getUserProfile(user.id);
      await supabase.from('usage_limits').insert({
        user_id: user.id,
        session_id: sessionId,
        pdfs_uploaded_today: 0,
        messages_sent_today: 1,
        last_reset_date: today,
        user_tier: profile?.tier || 'free',
      });
    } else {
      await supabase
        .from('usage_limits')
        .update({
          messages_sent_today: data.messages_sent_today + 1,
        })
        .eq('session_id', sessionId);
    }
    return;
  }

  const sessionId = getSessionId();
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('usage_limits')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (!data) {
    await supabase.from('usage_limits').insert({
      session_id: sessionId,
      pdfs_uploaded_today: 0,
      messages_sent_today: 1,
      last_reset_date: today,
      user_tier: 'anonymous',
    });
  } else {
    await supabase
      .from('usage_limits')
      .update({
        messages_sent_today: data.messages_sent_today + 1,
      })
      .eq('session_id', sessionId);
  }
}
