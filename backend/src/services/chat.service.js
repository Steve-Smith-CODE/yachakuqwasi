import { NotFoundError, ForbiddenError, AppError } from '../errors/AppError.js';
import {
  findChatByParticipants,
  insertChat,
  findChatsForUser,
  findChatById,
  updateChatLastMessage,
  findMessagesByChat,
  insertMessage
} from '../repositories/chat.repository.js';

async function assertParticipant(chat, userId) {
  if (chat.student_id !== userId && chat.landlord_id !== userId) {
    throw new ForbiddenError('No participas en esta conversacion');
  }
}

export async function startChat(studentId, { landlordId, listingId }) {
  const { data: existing } = await findChatByParticipants(studentId, landlordId, listingId);
  if (existing) return existing;

  const { data, error } = await insertChat({ studentId, landlordId, listingId });

  if (error) {
    throw new AppError(error.message, 400, 'CHAT_CREATE_FAILED');
  }

  return data;
}

export async function listChatsForUser(userId, role) {
  const { data, error } = await findChatsForUser(userId, role);

  if (error) {
    throw new AppError(error.message, 500, 'CHAT_LIST_FAILED');
  }

  return data;
}

export async function getMessages(chatId, user) {
  const { data: chat, error } = await findChatById(chatId);

  if (error || !chat) {
    throw new NotFoundError('Chat');
  }

  await assertParticipant(chat, user.id);

  const { data, error: msgError } = await findMessagesByChat(chatId);

  if (msgError) {
    throw new AppError(msgError.message, 500, 'CHAT_MESSAGES_FAILED');
  }

  return data;
}

export async function sendMessage(chatId, user, text) {
  const { data: chat, error } = await findChatById(chatId);

  if (error || !chat) {
    throw new NotFoundError('Chat');
  }

  await assertParticipant(chat, user.id);

  if (user.role !== 'student' && user.role !== 'landlord') {
    throw new ForbiddenError('Solo estudiantes y arrendadores pueden enviar mensajes');
  }

  const { data: message, error: msgError } = await insertMessage({ chatId, sender: user.role, text });

  if (msgError) {
    throw new AppError(msgError.message, 400, 'MESSAGE_SEND_FAILED');
  }

  await updateChatLastMessage(chatId, text);

  return message;
}
