import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── FAZENDA ────────────────────────────────────────────────────────────────
export const fazendas = mysqlTable("fazendas", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  produtor: varchar("produtor", { length: 255 }),
  cpfCnpj: varchar("cpfCnpj", { length: 30 }),
  ie: varchar("ie", { length: 30 }),
  cep: varchar("cep", { length: 15 }),
  endereco: varchar("endereco", { length: 500 }),
  numero: varchar("numero", { length: 20 }),
  bairro: varchar("bairro", { length: 255 }),
  cidade: varchar("cidade", { length: 255 }),
  estado: varchar("estado", { length: 5 }),
  graos: json("graos").$type<string[]>(),
  logoUrl: text("logoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Fazenda = typeof fazendas.$inferSelect;
export type InsertFazenda = typeof fazendas.$inferInsert;

// ─── CLIENTES ───────────────────────────────────────────────────────────────
export const clientes = mysqlTable("clientes", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  cpfCnpj: varchar("cpfCnpj", { length: 30 }),
  contato: varchar("contato", { length: 100 }),
  email: varchar("email", { length: 320 }),
  cidade: varchar("cidade", { length: 255 }),
  estado: varchar("estado", { length: 5 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = typeof clientes.$inferInsert;

// ─── TRANSPORTADORAS ────────────────────────────────────────────────────────
export const transportadoras = mysqlTable("transportadoras", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 30 }),
  contato: varchar("contato", { length: 100 }),
  cidade: varchar("cidade", { length: 255 }),
  estado: varchar("estado", { length: 5 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transportadora = typeof transportadoras.$inferSelect;
export type InsertTransportadora = typeof transportadoras.$inferInsert;

// ─── FORNECEDORES ───────────────────────────────────────────────────────────
export const fornecedores = mysqlTable("fornecedores", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 30 }),
  segmento: varchar("segmento", { length: 100 }),
  contato: varchar("contato", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Fornecedor = typeof fornecedores.$inferSelect;
export type InsertFornecedor = typeof fornecedores.$inferInsert;

// ─── CAMINHÕES ──────────────────────────────────────────────────────────────
export const caminhoes = mysqlTable("caminhoes", {
  id: int("id").autoincrement().primaryKey(),
  placa: varchar("placa", { length: 20 }).notNull(),
  uf: varchar("uf", { length: 5 }),
  arquivoUrl: text("arquivoUrl"),
  arquivoName: varchar("arquivoName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Caminhao = typeof caminhoes.$inferSelect;
export type InsertCaminhao = typeof caminhoes.$inferInsert;

// ─── MOTORISTAS ─────────────────────────────────────────────────────────────
export const motoristas = mysqlTable("motoristas", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  cnh: varchar("cnh", { length: 30 }),
  arquivoUrl: text("arquivoUrl"),
  arquivoName: varchar("arquivoName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Motorista = typeof motoristas.$inferSelect;
export type InsertMotorista = typeof motoristas.$inferInsert;

// ─── CONTRATOS ──────────────────────────────────────────────────────────────
export const contratos = mysqlTable("contratos", {
  id: int("id").autoincrement().primaryKey(),
  numero: varchar("numero", { length: 30 }).notNull(),
  cliente: varchar("cliente", { length: 255 }),
  grao: varchar("grao", { length: 50 }),
  quantidade: varchar("quantidade", { length: 30 }),
  preco: varchar("preco", { length: 30 }),
  vencimento: varchar("vencimento", { length: 20 }),
  status: varchar("status", { length: 30 }).default("Ativo"),
  obs: text("obs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contrato = typeof contratos.$inferSelect;
export type InsertContrato = typeof contratos.$inferInsert;

// ─── INSUMOS ────────────────────────────────────────────────────────────────
export const insumos = mysqlTable("insumos", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  unidade: varchar("unidade", { length: 20 }),
  categoria: varchar("categoria", { length: 100 }),
  fornecedor: varchar("fornecedor", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Insumo = typeof insumos.$inferSelect;
export type InsertInsumo = typeof insumos.$inferInsert;

// ─── ESTOQUE INSUMOS ────────────────────────────────────────────────────────
export const estoqueInsumos = mysqlTable("estoqueInsumos", {
  id: int("id").autoincrement().primaryKey(),
  insumoId: int("insumoId").notNull(),
  insumoNome: varchar("insumoNome", { length: 255 }),
  qtd: varchar("qtd", { length: 30 }).default("0"),
  unidade: varchar("unidade", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EstoqueInsumo = typeof estoqueInsumos.$inferSelect;
export type InsertEstoqueInsumo = typeof estoqueInsumos.$inferInsert;

// ─── RECEBIMENTO INSUMOS ────────────────────────────────────────────────────
export const recebimentoInsumos = mysqlTable("recebimentoInsumos", {
  id: int("id").autoincrement().primaryKey(),
  produto: varchar("produto", { length: 255 }),
  nf: varchar("nf", { length: 50 }),
  recebidoPor: varchar("recebidoPor", { length: 255 }),
  data: varchar("data", { length: 20 }),
  fotoNFUrl: text("fotoNFUrl"),
  fotoNFName: varchar("fotoNFName", { length: 255 }),
  fotoProdutoUrl: text("fotoProdutoUrl"),
  fotoProdutoName: varchar("fotoProdutoName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RecebimentoInsumo = typeof recebimentoInsumos.$inferSelect;
export type InsertRecebimentoInsumo = typeof recebimentoInsumos.$inferInsert;

// ─── ROMANEIOS ENTRADA ──────────────────────────────────────────────────────
export const romaneiosEntrada = mysqlTable("romaneiosEntrada", {
  id: int("id").autoincrement().primaryKey(),
  numero: varchar("numero", { length: 20 }).notNull(),
  tipo: varchar("tipo", { length: 20 }).default("Entrada"),
  data: varchar("data", { length: 20 }),
  grao: varchar("grao", { length: 50 }),
  safra: varchar("safra", { length: 20 }),
  talhao: varchar("talhao", { length: 255 }),
  placa: varchar("placa", { length: 20 }),
  motorista: varchar("motorista", { length: 255 }),
  transportadora: varchar("transportadora", { length: 255 }),
  pesoBruto: varchar("pesoBruto", { length: 30 }),
  pesoTara: varchar("pesoTara", { length: 30 }),
  liq: varchar("liq", { length: 30 }),
  umidade: varchar("umidade", { length: 20 }),
  impureza: varchar("impureza", { length: 20 }),
  avariado: varchar("avariado", { length: 20 }),
  dUm: varchar("dUm", { length: 20 }),
  dImp: varchar("dImp", { length: 20 }),
  dAv: varchar("dAv", { length: 20 }),
  totalDesc: varchar("totalDesc", { length: 20 }),
  faixaUmidade: varchar("faixaUmidade", { length: 20 }),
  pesoFinal: varchar("pesoFinal", { length: 30 }),
  obs: text("obs"),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RomaneioEntrada = typeof romaneiosEntrada.$inferSelect;
export type InsertRomaneioEntrada = typeof romaneiosEntrada.$inferInsert;

// ─── ROMANEIOS SAÍDA ────────────────────────────────────────────────────────
export const romaneiosSaida = mysqlTable("romaneiosSaida", {
  id: int("id").autoincrement().primaryKey(),
  numero: varchar("numero", { length: 20 }).notNull(),
  tipo: varchar("tipo", { length: 20 }).default("Saída"),
  data: varchar("data", { length: 20 }),
  grao: varchar("grao", { length: 50 }),
  safra: varchar("safra", { length: 20 }),
  cliente: varchar("cliente", { length: 255 }),
  contrato: varchar("contrato", { length: 50 }),
  placa: varchar("placa", { length: 20 }),
  motorista: varchar("motorista", { length: 255 }),
  transportadora: varchar("transportadora", { length: 255 }),
  pesoBruto: varchar("pesoBruto", { length: 30 }),
  pesoTara: varchar("pesoTara", { length: 30 }),
  liq: varchar("liq", { length: 30 }),
  umidade: varchar("umidade", { length: 20 }),
  impureza: varchar("impureza", { length: 20 }),
  avariado: varchar("avariado", { length: 20 }),
  dUm: varchar("dUm", { length: 20 }),
  dImp: varchar("dImp", { length: 20 }),
  dAv: varchar("dAv", { length: 20 }),
  totalDesc: varchar("totalDesc", { length: 20 }),
  faixaUmidade: varchar("faixaUmidade", { length: 20 }),
  pesoFinal: varchar("pesoFinal", { length: 30 }),
  obs: text("obs"),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RomaneioSaida = typeof romaneiosSaida.$inferSelect;
export type InsertRomaneioSaida = typeof romaneiosSaida.$inferInsert;

// ─── EXPEDIÇÕES / AGENDAMENTOS ──────────────────────────────────────────────
export const expedicoes = mysqlTable("expedicoes", {
  id: int("id").autoincrement().primaryKey(),
  numero: varchar("numero", { length: 20 }).notNull(),
  data: varchar("data", { length: 20 }),
  contrato: varchar("contrato", { length: 50 }),
  cliente: varchar("cliente", { length: 255 }),
  grao: varchar("grao", { length: 50 }),
  status: varchar("status", { length: 30 }).default("Pendente"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expedicao = typeof expedicoes.$inferSelect;
export type InsertExpedicao = typeof expedicoes.$inferInsert;

// ─── CLASSIFICAÇÃO PARAMS ───────────────────────────────────────────────────
export const classificacaoParams = mysqlTable("classificacaoParams", {
  id: int("id").autoincrement().primaryKey(),
  grao: varchar("grao", { length: 50 }).notNull().unique(),
  umRef: varchar("umRef", { length: 20 }),
  umDesc: varchar("umDesc", { length: 20 }),
  umDescPesado: varchar("umDescPesado", { length: 20 }),
  impRef: varchar("impRef", { length: 20 }),
  impDesc: varchar("impDesc", { length: 20 }),
  avRef: varchar("avRef", { length: 20 }),
  avDesc: varchar("avDesc", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClassificacaoParam = typeof classificacaoParams.$inferSelect;
export type InsertClassificacaoParam = typeof classificacaoParams.$inferInsert;

// ─── TALHÕES ────────────────────────────────────────────────────────────────
export const talhoes = mysqlTable("talhoes", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Talhao = typeof talhoes.$inferSelect;
export type InsertTalhao = typeof talhoes.$inferInsert;

// ─── TALHÕES CULTURAS ───────────────────────────────────────────────────────
export const talhoesCulturas = mysqlTable("talhoesCulturas", {
  id: int("id").autoincrement().primaryKey(),
  talhaoId: int("talhaoId").notNull(),
  grao: varchar("grao", { length: 50 }).notNull(),
  area: varchar("area", { length: 30 }),
  obs: text("obs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TalhaoCultura = typeof talhoesCulturas.$inferSelect;
export type InsertTalhaoCultura = typeof talhoesCulturas.$inferInsert;

// ─── ROMANEIO COUNTER ───────────────────────────────────────────────────────
export const appConfig = mysqlTable("appConfig", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("configKey", { length: 100 }).notNull().unique(),
  value: text("configValue"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AppConfig = typeof appConfig.$inferSelect;
export type InsertAppConfig = typeof appConfig.$inferInsert;
