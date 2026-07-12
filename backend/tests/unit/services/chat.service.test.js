import { startChat, listChatsForUser, getMessages, sendMessage } from '../../../src/services/chat.service.js';
import * as chatRepo from '../../../src/repositories/chat.repository.js';
import { supabaseAdmin } from '../../../src/config/supabase.js';
import { createRealUser, cleanupCreatedUsers } from '../../helpers/testData.js';

const createdListingIds = [];
const createdChatIds = [];

afterAll(async () => {
  for (const id of createdChatIds.splice(0)) {
    await supabaseAdmin.from('chats').delete().eq('id', id).catch?.(() => {});
  }
  for (const id of createdListingIds.splice(0)) {
    await supabaseAdmin.from('housing_listings').delete().eq('id', id).catch?.(() => {});
  }
  await cleanupCreatedUsers();
});

async function createListing(landlordId) {
  const { data } = await supabaseAdmin
    .from('housing_listings')
    .insert({
      landlord_id: landlordId,
      title: 'Habitacion para chat de prueba',
      price_pen: 250,
      distance_to_unsch_minutes: 5,
      neighborhood: 'San Blas',
      address: 'Jr. Chat 1',
      contact_phone: '900000000',
      status: 'approved'
    })
    .select()
    .single();
  createdListingIds.push(data.id);
  return data;
}

describe('Chat Service (Supabase local real)', () => {
  it('crea un chat real entre estudiante y arrendador, y reutiliza el mismo si ya existe', async () => {
    const student = await createRealUser({ role: 'student' });
    const landlord = await createRealUser({ role: 'landlord' });
    const listing = await createListing(landlord.id);

    const chat = await startChat(student.id, { landlordId: landlord.id, listingId: listing.id });
    createdChatIds.push(chat.id);

    expect(chat.student_id).toBe(student.id);
    expect(chat.landlord_id).toBe(landlord.id);

    const sameChat = await startChat(student.id, { landlordId: landlord.id, listingId: listing.id });
    expect(sameChat.id).toBe(chat.id);
  });

  it('lista los chats reales de un estudiante y de un arrendador', async () => {
    const student = await createRealUser({ role: 'student' });
    const landlord = await createRealUser({ role: 'landlord' });
    const listing = await createListing(landlord.id);
    const chat = await startChat(student.id, { landlordId: landlord.id, listingId: listing.id });
    createdChatIds.push(chat.id);

    const studentChats = await listChatsForUser(student.id, 'student');
    expect(studentChats.map((c) => c.id)).toContain(chat.id);

    const landlordChats = await listChatsForUser(landlord.id, 'landlord');
    expect(landlordChats.map((c) => c.id)).toContain(chat.id);
  });

  it('cada chat trae el perfil (nombre/avatar) de ambos participantes para mostrar "con quien hablo"', async () => {
    const student = await createRealUser({ role: 'student', name: 'Estudiante Del Chat' });
    const landlord = await createRealUser({ role: 'landlord', name: 'Arrendador Del Chat' });
    const listing = await createListing(landlord.id);
    const chat = await startChat(student.id, { landlordId: landlord.id, listingId: listing.id });
    createdChatIds.push(chat.id);

    const [studentChats] = [await listChatsForUser(student.id, 'student')];
    const found = studentChats.find((c) => c.id === chat.id);

    expect(found.student.name).toBe('Estudiante Del Chat');
    expect(found.landlord.name).toBe('Arrendador Del Chat');
  });

  it('envia un mensaje real y lo puede leer cualquiera de los dos participantes', async () => {
    const student = await createRealUser({ role: 'student' });
    const landlord = await createRealUser({ role: 'landlord' });
    const listing = await createListing(landlord.id);
    const chat = await startChat(student.id, { landlordId: landlord.id, listingId: listing.id });
    createdChatIds.push(chat.id);

    const message = await sendMessage(chat.id, { id: student.id, role: 'student' }, 'Hola, sigue disponible?');
    expect(message.sender).toBe('student');
    expect(message.text).toBe('Hola, sigue disponible?');

    const messagesForLandlord = await getMessages(chat.id, { id: landlord.id, role: 'landlord' });
    expect(messagesForLandlord.map((m) => m.id)).toContain(message.id);
  });

  it('lanza 403 si un usuario que no participa intenta leer los mensajes', async () => {
    const student = await createRealUser({ role: 'student' });
    const landlord = await createRealUser({ role: 'landlord' });
    const intruso = await createRealUser({ role: 'student' });
    const listing = await createListing(landlord.id);
    const chat = await startChat(student.id, { landlordId: landlord.id, listingId: listing.id });
    createdChatIds.push(chat.id);

    await expect(getMessages(chat.id, { id: intruso.id, role: 'student' })).rejects.toMatchObject({
      statusCode: 403
    });
  });

  it('lanza 404 si el chat no existe', async () => {
    await expect(
      getMessages('00000000-0000-0000-0000-000000000000', { id: 'x', role: 'student' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('sendMessage tambien lanza 404 si el chat no existe', async () => {
    await expect(
      sendMessage('00000000-0000-0000-0000-000000000000', { id: 'x', role: 'student' }, 'hola')
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('lanza 400 real si landlordId no existe (violacion de FK en Postgres)', async () => {
    const student = await createRealUser({ role: 'student' });
    const landlord = await createRealUser({ role: 'landlord' });
    const listing = await createListing(landlord.id);

    await expect(
      startChat(student.id, { landlordId: '00000000-0000-0000-0000-000000000000', listingId: listing.id })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rechaza el envio de mensaje si el participante no es student ni landlord (ej. admin colado como landlordId)', async () => {
    const student = await createRealUser({ role: 'student' });
    const admin = await createRealUser({ role: 'admin' });
    const otherLandlord = await createRealUser({ role: 'landlord' });
    const listing = await createListing(otherLandlord.id);

    // Se fuerza un chat cuyo "landlord_id" en realidad apunta a un admin,
    // para ejercitar la validacion de rol en sendMessage (linea normalmente
    // inalcanzable si solo se usan landlords reales).
    const chat = await startChat(student.id, { landlordId: admin.id, listingId: listing.id });
    createdChatIds.push(chat.id);

    await expect(sendMessage(chat.id, { id: admin.id, role: 'admin' }, 'hola')).rejects.toMatchObject({
      statusCode: 403
    });
  });

  it('lista chats vacio para un usuario sin chats', async () => {
    const newStudent = await createRealUser({ role: 'student' });
    const chats = await listChatsForUser(newStudent.id, 'student');
    expect(Array.isArray(chats)).toBe(true);
  });

  it('envia mensaje y actualiza el last_message del chat', async () => {
    const student = await createRealUser({ role: 'student' });
    const landlord = await createRealUser({ role: 'landlord' });
    const listing = await createListing(landlord.id);
    const chat = await startChat(student.id, { landlordId: landlord.id, listingId: listing.id });
    createdChatIds.push(chat.id);

    const messageText = 'Mensaje de prueba';
    await sendMessage(chat.id, { id: student.id, role: 'student' }, messageText);

    const { data: updatedChat } = await supabaseAdmin
      .from('chats')
      .select('last_message')
      .eq('id', chat.id)
      .single();

    expect(updatedChat.last_message).toBe(messageText);
  });

  it('lanza 403 Forbidden si usuario intenta enviar mensaje en chat donde no participa', async () => {
    const student = await createRealUser({ role: 'student' });
    const landlord = await createRealUser({ role: 'landlord' });
    const intruso = await createRealUser({ role: 'student' });
    const listing = await createListing(landlord.id);
    const chat = await startChat(student.id, { landlordId: landlord.id, listingId: listing.id });
    createdChatIds.push(chat.id);

    await expect(
      sendMessage(chat.id, { id: intruso.id, role: 'student' }, 'Soy intruso')
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('lanza error 500 cuando listChatsForUser falla', async () => {
    const originalFn = chatRepo.findChatsForUser;
    chatRepo.findChatsForUser = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database error' }
    });

    try {
      await expect(listChatsForUser('test-user-id', 'student')).rejects.toMatchObject({
        statusCode: 500
      });
    } finally {
      chatRepo.findChatsForUser = originalFn;
    }
  });

  it('lanza error 500 cuando getMessages falla al buscar los mensajes', async () => {
    const student = await createRealUser({ role: 'student' });
    const landlord = await createRealUser({ role: 'landlord' });
    const listing = await createListing(landlord.id);
    const chat = await startChat(student.id, { landlordId: landlord.id, listingId: listing.id });
    createdChatIds.push(chat.id);

    const originalFn = chatRepo.findMessagesByChat;
    chatRepo.findMessagesByChat = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database error' }
    });

    try {
      await expect(getMessages(chat.id, { id: student.id, role: 'student' })).rejects.toMatchObject({
        statusCode: 500
      });
    } finally {
      chatRepo.findMessagesByChat = originalFn;
    }
  });

  it('lanza error 400 cuando sendMessage falla al insertar el mensaje', async () => {
    const student = await createRealUser({ role: 'student' });
    const landlord = await createRealUser({ role: 'landlord' });
    const listing = await createListing(landlord.id);
    const chat = await startChat(student.id, { landlordId: landlord.id, listingId: listing.id });
    createdChatIds.push(chat.id);

    const originalFn = chatRepo.insertMessage;
    chatRepo.insertMessage = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Storage limit exceeded' }
    });

    try {
      await expect(sendMessage(chat.id, { id: student.id, role: 'student' }, 'test')).rejects.toMatchObject({
        statusCode: 400
      });
    } finally {
      chatRepo.insertMessage = originalFn;
    }
  });
});
