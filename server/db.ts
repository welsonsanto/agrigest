import { eq, isNull, isNotNull, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  fazendas, InsertFazenda,
  clientes, InsertCliente,
  transportadoras, InsertTransportadora,
  fornecedores, InsertFornecedor,
  caminhoes, InsertCaminhao,
  motoristas, InsertMotorista,
  contratos, InsertContrato,
  insumos, InsertInsumo,
  estoqueInsumos, InsertEstoqueInsumo,
  recebimentoInsumos, InsertRecebimentoInsumo,
  romaneiosEntrada, InsertRomaneioEntrada,
  romaneiosSaida, InsertRomaneioSaida,
  expedicoes, InsertExpedicao,
  classificacaoParams, InsertClassificacaoParam,
  talhoes, InsertTalhao,
  talhoesCulturas, InsertTalhaoCultura,
  appConfig,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── USERS ──────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── FAZENDA ────────────────────────────────────────────────────────────────
export async function getFazenda() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(fazendas).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertFazenda(data: Omit<InsertFazenda, "id">) {
  const db = await getDb();
  if (!db) return null;
  const existing = await getFazenda();
  if (existing) {
    await db.update(fazendas).set(data).where(eq(fazendas.id, existing.id));
    return { ...existing, ...data };
  } else {
    const result = await db.insert(fazendas).values(data);
    return { id: Number(result[0].insertId), ...data };
  }
}

// ─── GENERIC CRUD HELPERS ───────────────────────────────────────────────────
function createCrudHelpers<T extends { id: number }, I>(table: any) {
  return {
    async list() {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(table);
    },
    async getById(id: number) {
      const db = await getDb();
      if (!db) return null;
      const result = await db.select().from(table).where(eq(table.id, id)).limit(1);
      return result.length > 0 ? result[0] : null;
    },
    async create(data: Omit<I, "id" | "createdAt" | "updatedAt">) {
      const db = await getDb();
      if (!db) return null;
      const result = await db.insert(table).values(data as any);
      return { id: Number(result[0].insertId), ...data };
    },
    async update(id: number, data: Partial<I>) {
      const db = await getDb();
      if (!db) return null;
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = data as any;
      await db.update(table).set(rest).where(eq(table.id, id));
      return { id, ...rest };
    },
    async remove(id: number) {
      const db = await getDb();
      if (!db) return false;
      await db.delete(table).where(eq(table.id, id));
      return true;
    },
  };
}

export const clientesCrud = createCrudHelpers(clientes);
export const transportadorasCrud = createCrudHelpers(transportadoras);
export const fornecedoresCrud = createCrudHelpers(fornecedores);
export const caminhoesCrud = createCrudHelpers(caminhoes);
export const motoristasCrud = createCrudHelpers(motoristas);
export const contratosCrud = createCrudHelpers(contratos);
export const insumosCrud = createCrudHelpers(insumos);
export const estoqueInsumosCrud = createCrudHelpers(estoqueInsumos);
export const recebimentoInsumosCrud = createCrudHelpers(recebimentoInsumos);
export const expedicoesCrud = createCrudHelpers(expedicoes);
export const talhoesCrud = createCrudHelpers(talhoes);
export const talhoesCulturasCrud = createCrudHelpers(talhoesCulturas);

// ─── ROMANEIOS (with soft delete) ──────────────────────────────────────────
export async function listRomaneiosEntrada() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(romaneiosEntrada).where(isNull(romaneiosEntrada.deletedAt));
}

export async function listRomaneiosEntradaLixeira() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(romaneiosEntrada).where(isNotNull(romaneiosEntrada.deletedAt));
}

export async function createRomaneioEntrada(data: Omit<InsertRomaneioEntrada, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(romaneiosEntrada).values(data as any);
  return { id: Number(result[0].insertId), ...data };
}

export async function updateRomaneioEntrada(id: number, data: Partial<InsertRomaneioEntrada>) {
  const db = await getDb();
  if (!db) return null;
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = data as any;
  await db.update(romaneiosEntrada).set(rest).where(eq(romaneiosEntrada.id, id));
  return { id, ...rest };
}

export async function softDeleteRomaneioEntrada(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(romaneiosEntrada).set({ deletedAt: new Date() }).where(eq(romaneiosEntrada.id, id));
  return true;
}

export async function restoreRomaneioEntrada(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(romaneiosEntrada).set({ deletedAt: null }).where(eq(romaneiosEntrada.id, id));
  return true;
}

export async function hardDeleteRomaneioEntrada(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(romaneiosEntrada).where(eq(romaneiosEntrada.id, id));
  return true;
}

// Romaneios Saída
export async function listRomaneiosSaida() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(romaneiosSaida).where(isNull(romaneiosSaida.deletedAt));
}

export async function listRomaneiosSaidaLixeira() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(romaneiosSaida).where(isNotNull(romaneiosSaida.deletedAt));
}

export async function createRomaneioSaida(data: Omit<InsertRomaneioSaida, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(romaneiosSaida).values(data as any);
  return { id: Number(result[0].insertId), ...data };
}

export async function updateRomaneioSaida(id: number, data: Partial<InsertRomaneioSaida>) {
  const db = await getDb();
  if (!db) return null;
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = data as any;
  await db.update(romaneiosSaida).set(rest).where(eq(romaneiosSaida.id, id));
  return { id, ...rest };
}

export async function softDeleteRomaneioSaida(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(romaneiosSaida).set({ deletedAt: new Date() }).where(eq(romaneiosSaida.id, id));
  return true;
}

export async function restoreRomaneioSaida(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(romaneiosSaida).set({ deletedAt: null }).where(eq(romaneiosSaida.id, id));
  return true;
}

export async function hardDeleteRomaneioSaida(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(romaneiosSaida).where(eq(romaneiosSaida.id, id));
  return true;
}

// ─── CLASSIFICAÇÃO PARAMS ───────────────────────────────────────────────────
export async function getClassificacaoParams() {
  const db = await getDb();
  if (!db) return {};
  const rows = await db.select().from(classificacaoParams);
  const result: Record<string, any> = {};
  for (const row of rows) {
    result[row.grao] = row;
  }
  return result;
}

export async function upsertClassificacaoParam(grao: string, data: Omit<InsertClassificacaoParam, "id" | "grao" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(classificacaoParams).where(eq(classificacaoParams.grao, grao)).limit(1);
  if (existing.length > 0) {
    await db.update(classificacaoParams).set(data).where(eq(classificacaoParams.grao, grao));
    return { ...existing[0], ...data };
  } else {
    const result = await db.insert(classificacaoParams).values({ grao, ...data } as any);
    return { id: Number(result[0].insertId), grao, ...data };
  }
}

// ─── TALHÕES WITH CULTURAS ──────────────────────────────────────────────────
export async function listTalhoesWithCulturas() {
  const db = await getDb();
  if (!db) return [];
  const allTalhoes = await db.select().from(talhoes);
  const allCulturas = await db.select().from(talhoesCulturas);
  return allTalhoes.map(t => ({
    ...t,
    culturas: allCulturas.filter(c => c.talhaoId === t.id),
  }));
}

export async function createTalhaoWithCulturas(nome: string, culturas: Array<{ grao: string; area: string; obs?: string }>) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(talhoes).values({ nome });
  const talhaoId = Number(result[0].insertId);
  if (culturas.length > 0) {
    await db.insert(talhoesCulturas).values(culturas.map(c => ({ talhaoId, grao: c.grao, area: c.area, obs: c.obs || null })));
  }
  return { id: talhaoId, nome, culturas };
}

export async function updateTalhaoWithCulturas(id: number, nome: string, culturas: Array<{ grao: string; area: string; obs?: string }>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(talhoes).set({ nome }).where(eq(talhoes.id, id));
  // Delete old culturas and re-insert
  await db.delete(talhoesCulturas).where(eq(talhoesCulturas.talhaoId, id));
  if (culturas.length > 0) {
    await db.insert(talhoesCulturas).values(culturas.map(c => ({ talhaoId: id, grao: c.grao, area: c.area, obs: c.obs || null })));
  }
  return { id, nome, culturas };
}

export async function deleteTalhao(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(talhoesCulturas).where(eq(talhoesCulturas.talhaoId, id));
  await db.delete(talhoes).where(eq(talhoes.id, id));
  return true;
}

// ─── ESTOQUE MOVIMENTAÇÃO ───────────────────────────────────────────────────
export async function movimentarEstoque(insumoId: number, insumoNome: string, unidade: string, tipo: string, qtd: number) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(estoqueInsumos).where(eq(estoqueInsumos.insumoId, insumoId)).limit(1);
  const delta = tipo === "Saída" ? -qtd : qtd;
  if (existing.length > 0) {
    const newQtd = ((parseFloat(existing[0].qtd || "0")) + delta).toFixed(2);
    await db.update(estoqueInsumos).set({ qtd: newQtd }).where(eq(estoqueInsumos.id, existing[0].id));
    return { ...existing[0], qtd: newQtd };
  } else {
    const result = await db.insert(estoqueInsumos).values({ insumoId, insumoNome, qtd: delta.toFixed(2), unidade });
    return { id: Number(result[0].insertId), insumoId, insumoNome, qtd: delta.toFixed(2), unidade };
  }
}

// ─── APP CONFIG (romaneio counter) ──────────────────────────────────────────
export async function getConfig(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(appConfig).where(eq(appConfig.key, key)).limit(1);
  return result.length > 0 ? (result[0].value ?? null) : null;
}

export async function setConfig(key: string, value: string) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(appConfig).where(eq(appConfig.key, key)).limit(1);
  if (existing.length > 0) {
    await db.update(appConfig).set({ value }).where(eq(appConfig.key, key));
  } else {
    await db.insert(appConfig).values({ key, value });
  }
}

export async function getNextRomaneioNumber(): Promise<string> {
  const current = await getConfig("romaneioCounter");
  const num = current ? parseInt(current) : 1;
  const next = num + 1;
  await setConfig("romaneioCounter", String(next));
  return String(num).padStart(5, "0");
}
