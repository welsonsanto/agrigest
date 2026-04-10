import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Helpers ────────────────────────────────────────────────────────────────

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createCaller() {
  const ctx = createAuthContext();
  return appRouter.createCaller(ctx);
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("AgriGest tRPC Procedures", () => {
  const caller = createCaller();

  // ─── FAZENDA ──────────────────────────────────────────────────────────────
  describe("fazenda", () => {
    it("should upsert and retrieve fazenda", async () => {
      const fazendaData = {
        nome: "Fazenda Vitest",
        produtor: "Produtor Teste",
        cpfCnpj: "12.345.678/0001-99",
        ie: "123456789",
        cep: "01000-000",
        endereco: "Rua Teste",
        numero: "100",
        bairro: "Centro",
        cidade: "Goiânia",
        estado: "GO",
        graos: ["Soja", "Milho"],
        logoUrl: null,
      };

      await caller.fazenda.upsert(fazendaData);
      const result = await caller.fazenda.get();

      expect(result).toBeTruthy();
      expect(result!.nome).toBe("Fazenda Vitest");
      expect(result!.produtor).toBe("Produtor Teste");
      expect(result!.graos).toContain("Soja");
      expect(result!.graos).toContain("Milho");
    });

    it("should update existing fazenda on second upsert", async () => {
      await caller.fazenda.upsert({
        nome: "Fazenda Vitest Atualizada",
        produtor: "Produtor Atualizado",
        graos: ["Soja", "Milho", "Sorgo"],
      });

      const result = await caller.fazenda.get();
      expect(result!.nome).toBe("Fazenda Vitest Atualizada");
      expect(result!.graos).toHaveLength(3);
    });
  });

  // ─── CLIENTES CRUD ────────────────────────────────────────────────────────
  describe("clientes", () => {
    let clienteId: number;

    it("should create a cliente", async () => {
      const result = await caller.clientes.create({
        data: {
          nome: "Cliente Vitest",
          cpfCnpj: "11.111.111/0001-11",
          contato: "(62) 99999-0000",
          email: "vitest@test.com",
          cidade: "Goiânia",
          estado: "GO",
        },
      });
      expect(result).toBeTruthy();
      expect(result.id).toBeDefined();
      clienteId = result.id;
    });

    it("should list clientes", async () => {
      const list = await caller.clientes.list();
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThanOrEqual(1);
      const found = list.find((c: any) => c.nome === "Cliente Vitest");
      expect(found).toBeTruthy();
    });

    it("should update a cliente", async () => {
      await caller.clientes.update({
        id: clienteId,
        data: { nome: "Cliente Vitest Atualizado" },
      });
      const item = await caller.clientes.getById({ id: clienteId });
      expect(item!.nome).toBe("Cliente Vitest Atualizado");
    });

    it("should delete a cliente", async () => {
      await caller.clientes.remove({ id: clienteId });
      const item = await caller.clientes.getById({ id: clienteId });
      expect(item).toBeFalsy();
    });
  });

  // ─── MOTORISTAS CRUD ──────────────────────────────────────────────────────
  describe("motoristas", () => {
    let motoristaId: number;

    it("should create a motorista", async () => {
      const result = await caller.motoristas.create({
        data: { nome: "Motorista Vitest", cnh: "12345678900" },
      });
      expect(result.id).toBeDefined();
      motoristaId = result.id;
    });

    it("should list motoristas", async () => {
      const list = await caller.motoristas.list();
      expect(list.length).toBeGreaterThanOrEqual(1);
    });

    it("should delete a motorista", async () => {
      await caller.motoristas.remove({ id: motoristaId });
      const item = await caller.motoristas.getById({ id: motoristaId });
      expect(item).toBeFalsy();
    });
  });

  // ─── CLASSIFICAÇÃO ────────────────────────────────────────────────────────
  describe("classificacao", () => {
    it("should upsert and retrieve classificacao params", async () => {
      await caller.classificacao.upsert({
        grao: "Soja",
        umRef: "14.00",
        umDesc: "1.50",
        umDescPesado: "2.00",
        impRef: "1.00",
        impDesc: "1.00",
        avRef: "8.00",
        avDesc: "1.00",
      });

      const params = await caller.classificacao.getAll();
      expect(params).toBeTruthy();
      expect(params["Soja"]).toBeTruthy();
      expect(params["Soja"].umRef).toBe("14.00");
      expect(params["Soja"].umDesc).toBe("1.50");
    });

    it("should update existing classificacao params", async () => {
      await caller.classificacao.upsert({
        grao: "Soja",
        umRef: "13.50",
      });

      const params = await caller.classificacao.getAll();
      expect(params["Soja"].umRef).toBe("13.50");
    });
  });

  // ─── TALHÕES ──────────────────────────────────────────────────────────────
  describe("talhoes", () => {
    let talhaoId: number;

    it("should create a talhão with culturas", async () => {
      const result = await caller.talhoes.create({
        nome: "Talhão A",
        culturas: [
          { grao: "Soja", area: "150.5", obs: "Plantio direto" },
          { grao: "Milho", area: "80.0" },
        ],
      });
      expect(result).toBeTruthy();
      expect(result.id).toBeDefined();
      talhaoId = result.id;
    });

    it("should list talhões with culturas", async () => {
      const list = await caller.talhoes.list();
      expect(list.length).toBeGreaterThanOrEqual(1);
      const found = list.find((t: any) => t.nome === "Talhão A");
      expect(found).toBeTruthy();
      expect(found!.culturas).toBeTruthy();
      expect(found!.culturas.length).toBe(2);
    });

    it("should update a talhão", async () => {
      await caller.talhoes.update({
        id: talhaoId,
        nome: "Talhão A Atualizado",
        culturas: [{ grao: "Soja", area: "200.0", obs: "Área expandida" }],
      });
      const list = await caller.talhoes.list();
      const found = list.find((t: any) => t.id === talhaoId);
      expect(found!.nome).toBe("Talhão A Atualizado");
      expect(found!.culturas.length).toBe(1);
    });

    it("should delete a talhão", async () => {
      await caller.talhoes.remove({ id: talhaoId });
      const list = await caller.talhoes.list();
      const found = list.find((t: any) => t.id === talhaoId);
      expect(found).toBeUndefined();
    });
  });

  // ─── CONTRATOS ────────────────────────────────────────────────────────────
  describe("contratos", () => {
    let contratoId: number;

    it("should create a contrato", async () => {
      const result = await caller.contratos.create({
        data: {
          numero: "CT-00001",
          cliente: "Cliente Teste",
          grao: "Soja",
          quantidade: "1000",
          preco: "130.00",
          status: "Ativo",
          vencimento: "2025-12-31",
        },
      });
      expect(result.id).toBeDefined();
      contratoId = result.id;
    });

    it("should list contratos", async () => {
      const list = await caller.contratos.list();
      expect(list.length).toBeGreaterThanOrEqual(1);
    });

    it("should delete a contrato", async () => {
      await caller.contratos.remove({ id: contratoId });
      const item = await caller.contratos.getById({ id: contratoId });
      expect(item).toBeFalsy();
    });
  });

  // ─── ROMANEIOS ENTRADA ────────────────────────────────────────────────────
  describe("romaneiosEntrada", () => {
    let romaneioId: number;

    it("should create a romaneio de entrada", async () => {
      const result = await caller.romaneiosEntrada.create({
        data: {
          numero: "00001",
          tipo: "Entrada",
          data: "2025-06-15",
          grao: "Soja",
          safra: "2024/2025",
          placa: "ABC-1234",
          motorista: "Motorista Teste",
          transportadora: "Transportadora Teste",
          pesoBruto: "30000",
          pesoTara: "12000",
          liq: 18000,
          umidade: "14.5",
          impureza: "1.2",
          avariado: "0.5",
          dUm: "0.75",
          dImp: "0.20",
          dAv: "0.00",
          totalDesc: "0.95",
          pesoFinal: "17829",
          talhao: "Talhão A",
        },
      });
      expect(result.id).toBeDefined();
      romaneioId = result.id;
    });

    it("should list romaneios de entrada", async () => {
      const list = await caller.romaneiosEntrada.list();
      expect(list.length).toBeGreaterThanOrEqual(1);
    });

    it("should soft delete a romaneio de entrada", async () => {
      await caller.romaneiosEntrada.softDelete({ id: romaneioId });
      const list = await caller.romaneiosEntrada.list();
      const found = list.find((r: any) => r.id === romaneioId);
      expect(found).toBeUndefined();
    });

    it("should list romaneio in lixeira", async () => {
      const lixeira = await caller.romaneiosEntrada.listLixeira();
      const found = lixeira.find((r: any) => r.id === romaneioId);
      expect(found).toBeTruthy();
    });

    it("should restore a romaneio from lixeira", async () => {
      await caller.romaneiosEntrada.restore({ id: romaneioId });
      const list = await caller.romaneiosEntrada.list();
      const found = list.find((r: any) => r.id === romaneioId);
      expect(found).toBeTruthy();
    });

    it("should hard delete a romaneio", async () => {
      await caller.romaneiosEntrada.softDelete({ id: romaneioId });
      await caller.romaneiosEntrada.hardDelete({ id: romaneioId });
      const lixeira = await caller.romaneiosEntrada.listLixeira();
      const found = lixeira.find((r: any) => r.id === romaneioId);
      expect(found).toBeUndefined();
    });
  });

  // ─── CONFIG ───────────────────────────────────────────────────────────────
  describe("config", () => {
    it("should get next romaneio number", async () => {
      const num = await caller.config.getNextRomaneioNumber();
      expect(num).toBeTruthy();
      expect(Number(num)).toBeGreaterThanOrEqual(1);
    });
  });
});
