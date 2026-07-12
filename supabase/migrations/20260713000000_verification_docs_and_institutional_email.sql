-- ============================================================
-- 1) Verificacion con dos documentos (DNI + carnet/constancia) en vez
--    de uno solo, para que el admin pueda contrastar ambos antes de
--    aprobar - hoy solo se subia una foto y no se sabia si era el DNI
--    o el carnet.
-- 2) Correo institucional autodeclarado (.edu.pe) como señal de
--    confianza complementaria, barata y sin dependencia de terceros -
--    no reemplaza la revision manual de documentos, la acompaña.
-- ============================================================

create type document_type as enum ('dni', 'carnet');

-- default 'dni' solo para no romper filas ya existentes de antes de este
-- cambio (subian un solo documento sin distincion de tipo).
alter table verification_documents add column doc_type document_type not null default 'dni';

alter table profiles add column institutional_email text;
