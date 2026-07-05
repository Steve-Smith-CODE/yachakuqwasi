import { supabaseAdmin } from '../config/supabase.js';

export function findChatByParticipants(studentId, landlordId, listingId) {
  return supabaseAdmin
    .from('chats')
    .select('*')
    .eq('student_id', studentId)
    .eq('landlord_id', landlordId)
    .eq('listing_id', listingId)
    .maybeSingle();
}

export function insertChat({ studentId, landlordId, listingId }) {
  return supabaseAdmin
    .from('chats')
    .insert({ student_id: studentId, landlord_id: landlordId, listing_id: listingId })
    .select()
    .single();
}

export function findChatsForUser(userId, role) {
  const column = role === 'landlord' ? 'landlord_id' : 'student_id';
  return supabaseAdmin
    .from('chats')
    .select('*, housing_listings(title)')
    .eq(column, userId)
    .order('updated_at', { ascending: false });
}

export function findChatById(chatId) {
  return supabaseAdmin.from('chats').select('*').eq('id', chatId).single();
}

export function updateChatLastMessage(chatId, lastMessage) {
  return supabaseAdmin.from('chats').update({ last_message: lastMessage, unread: true }).eq('id', chatId);
}

export function findMessagesByChat(chatId) {
  return supabaseAdmin
    .from('chat_messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
}

export function insertMessage({ chatId, sender, text }) {
  return supabaseAdmin.from('chat_messages').insert({ chat_id: chatId, sender, text }).select().single();
}
