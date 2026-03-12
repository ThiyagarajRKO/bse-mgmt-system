import {
  CreateJournalEntry,
  PostJournalEntry,
  ReverseJournalEntry,
  GetJournalEntry,
  GetAllJournalEntries,
} from "../../../controllers/accounting/journal";

export const Create = async (params, session, fastify) => {
  return await CreateJournalEntry(params, session, fastify);
};

export const Post = async (params, session, fastify) => {
  return await PostJournalEntry(params, session, fastify);
};

export const Reverse = async (params, session, fastify) => {
  return await ReverseJournalEntry(params, session, fastify);
};

export const Get = async (params, session, fastify) => {
  return await GetJournalEntry(params, session, fastify);
};

export const GetAll = async (params, session, fastify) => {
  return await GetAllJournalEntries(params, session, fastify);
};
