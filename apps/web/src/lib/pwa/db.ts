import Dexie, { type EntityTable } from "dexie";

export type LogSyncState =
  | "queued"
  | "meta_synced"
  | "synced"
  | "verified"
  | "revision_required"
  | "failed";

export interface OfflineLog {
  clientLogUuid: string; // Primary key (UUID v4)
  placementId: string;
  logDate: string; // YYYY-MM-DD
  durationJp: number; // 1 - 12 JP (BR-002)
  autonomyLevel: 1 | 2 | 3; // 1: Observasi, 2: Terbimbing, 3: Mandiri (BR-009)
  jobCardIds: string[];
  jobCardTitle?: string;
  isNonCompetency: boolean;
  nonCompetencyCategory?: string;
  shortNote?: string;
  clientCreatedAt: string; // ISO string (BR-003 backdate validation base)
  state: LogSyncState;
  serverLogId?: string;
  verifiedAt?: string;
  mentorNotes?: string;
  retryCount: number;
  nextAttemptAt?: string;
  lastError?: string;
}

export interface OfflinePhoto {
  clientLogUuid: string; // Primary key (1-to-1 with OfflineLog)
  blob: Blob;
  sha256: string; // SHA-256 hex digest for server verification
  sizeBytes: number; // Max 150 KB
  mimeType: string; // image/webp or fallback image/jpeg
  createdAt: string;
}

export interface OfflineRefData {
  key: string; // Primary key (e.g. 'active_placement', 'job_cards_rpl')
  data: unknown;
  cachedAt: number;
  expiresAt?: number;
}

export class VokaLinkDexieDB extends Dexie {
  logs!: EntityTable<OfflineLog, "clientLogUuid">;
  photos!: EntityTable<OfflinePhoto, "clientLogUuid">;
  refData!: EntityTable<OfflineRefData, "key">;

  constructor() {
    super("VokaLinkOfflineDB");

    // Version 1 Schema (sesuai DESIGN.md 7.2)
    this.version(1).stores({
      logs: "clientLogUuid, placementId, logDate, state, nextAttemptAt",
      photos: "clientLogUuid",
      refData: "key",
    });
  }
}

// Singleton database instance
export const db = new VokaLinkDexieDB();
