import * as chatService from '../services/chat.service.js';

export async function startChat(req, res) {
  const chat = await chatService.startChat(req.user.id, req.body);
  res.status(201).json(chat);
}

export async function listChats(req, res) {
  const chats = await chatService.listChatsForUser(req.user.id, req.user.role);
  res.json(chats);
}

export async function getMessages(req, res) {
  const messages = await chatService.getMessages(req.params.id, req.user);
  res.json(messages);
}

export async function sendMessage(req, res) {
  const message = await chatService.sendMessage(req.params.id, req.user, req.body.text);
  res.status(201).json(message);
}
