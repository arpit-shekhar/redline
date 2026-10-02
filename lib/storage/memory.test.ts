import { randomUUID } from "node:crypto";
import {
  documentStoreContract,
  redLineStoreContract,
} from "../../tests/support/storage-contract.ts";
import { createMemoryStorage } from "./memory.ts";

// The storage contract, run against the in-memory storage.
documentStoreContract("in-memory storage", async () => ({
  store: createMemoryStorage().documents,
  userId: randomUUID(),
  otherUserId: randomUUID(),
}));

redLineStoreContract("in-memory storage: red lines and leverage", async () => ({
  store: createMemoryStorage().redLines,
  userId: randomUUID(),
  otherUserId: randomUUID(),
}));
