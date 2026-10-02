import { randomUUID } from "node:crypto";
import { documentStoreContract } from "../../tests/support/storage-contract.ts";
import { createMemoryStorage } from "./memory.ts";

// The storage contract, run against the in-memory storage.
documentStoreContract("in-memory storage", async () => ({
  store: createMemoryStorage().documents,
  userId: randomUUID(),
  otherUserId: randomUUID(),
}));
