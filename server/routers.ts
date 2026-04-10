import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getFazenda, upsertFazenda,
  clientesCrud, transportadorasCrud, fornecedoresCrud, caminhoesCrud, motoristasCrud,
  contratosCrud, insumosCrud, estoqueInsumosCrud, recebimentoInsumosCrud, expedicoesCrud,
  listRomaneiosEntrada, listRomaneiosEntradaLixeira, createRomaneioEntrada, updateRomaneioEntrada,
  softDeleteRomaneioEntrada, restoreRomaneioEntrada, hardDeleteRomaneioEntrada,
  listRomaneiosSaida, listRomaneiosSaidaLixeira, createRomaneioSaida, updateRomaneioSaida,
  softDeleteRomaneioSaida, restoreRomaneioSaida, hardDeleteRomaneioSaida,
  getClassificacaoParams, upsertClassificacaoParam,
  listTalhoesWithCulturas, createTalhaoWithCulturas, updateTalhaoWithCulturas, deleteTalhao,
  movimentarEstoque, getNextRomaneioNumber,
} from "./db";

// Helper to create CRUD router for simple entities
function createCrudRouter(crud: any) {
  return router({
    list: protectedProcedure.query(() => crud.list()),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(({ input }) => crud.getById(input.id)),
    create: protectedProcedure.input(z.object({ data: z.any() })).mutation(({ input }) => crud.create(input.data)),
    update: protectedProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(({ input }) => crud.update(input.id, input.data)),
    remove: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => crud.remove(input.id)),
  });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── FAZENDA ────────────────────────────────────────────────────────────
  fazenda: router({
    get: protectedProcedure.query(() => getFazenda()),
    upsert: protectedProcedure
      .input(z.object({
        nome: z.string(),
        produtor: z.string().optional(),
        cpfCnpj: z.string().optional(),
        ie: z.string().optional(),
        cep: z.string().optional(),
        endereco: z.string().optional(),
        numero: z.string().optional(),
        bairro: z.string().optional(),
        cidade: z.string().optional(),
        estado: z.string().optional(),
        graos: z.array(z.string()).optional(),
        logoUrl: z.string().nullable().optional(),
      }))
      .mutation(({ input }) => upsertFazenda(input)),
  }),

  // ─── CADASTROS SIMPLES ─────────────────────────────────────────────────
  clientes: createCrudRouter(clientesCrud),
  transportadoras: createCrudRouter(transportadorasCrud),
  fornecedores: createCrudRouter(fornecedoresCrud),
  caminhoes: createCrudRouter(caminhoesCrud),
  motoristas: createCrudRouter(motoristasCrud),
  contratos: createCrudRouter(contratosCrud),
  insumos: createCrudRouter(insumosCrud),
  recebimentoInsumos: createCrudRouter(recebimentoInsumosCrud),
  expedicoes: createCrudRouter(expedicoesCrud),

  // ─── ESTOQUE ────────────────────────────────────────────────────────────
  estoque: router({
    list: protectedProcedure.query(() => estoqueInsumosCrud.list()),
    movimentar: protectedProcedure
      .input(z.object({
        insumoId: z.number(),
        insumoNome: z.string(),
        unidade: z.string(),
        tipo: z.string(),
        qtd: z.number(),
      }))
      .mutation(({ input }) => movimentarEstoque(input.insumoId, input.insumoNome, input.unidade, input.tipo, input.qtd)),
  }),

  // ─── ROMANEIOS ENTRADA ─────────────────────────────────────────────────
  romaneiosEntrada: router({
    list: protectedProcedure.query(() => listRomaneiosEntrada()),
    listLixeira: protectedProcedure.query(() => listRomaneiosEntradaLixeira()),
    create: protectedProcedure.input(z.object({ data: z.any() })).mutation(({ input }) => createRomaneioEntrada(input.data)),
    update: protectedProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(({ input }) => updateRomaneioEntrada(input.id, input.data)),
    softDelete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => softDeleteRomaneioEntrada(input.id)),
    restore: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => restoreRomaneioEntrada(input.id)),
    hardDelete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => hardDeleteRomaneioEntrada(input.id)),
  }),

  // ─── ROMANEIOS SAÍDA ───────────────────────────────────────────────────
  romaneiosSaida: router({
    list: protectedProcedure.query(() => listRomaneiosSaida()),
    listLixeira: protectedProcedure.query(() => listRomaneiosSaidaLixeira()),
    create: protectedProcedure.input(z.object({ data: z.any() })).mutation(({ input }) => createRomaneioSaida(input.data)),
    update: protectedProcedure.input(z.object({ id: z.number(), data: z.any() })).mutation(({ input }) => updateRomaneioSaida(input.id, input.data)),
    softDelete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => softDeleteRomaneioSaida(input.id)),
    restore: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => restoreRomaneioSaida(input.id)),
    hardDelete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => hardDeleteRomaneioSaida(input.id)),
  }),

  // ─── CLASSIFICAÇÃO ─────────────────────────────────────────────────────
  classificacao: router({
    getAll: protectedProcedure.query(() => getClassificacaoParams()),
    upsert: protectedProcedure
      .input(z.object({
        grao: z.string(),
        umRef: z.string().optional(),
        umDesc: z.string().optional(),
        umDescPesado: z.string().optional(),
        impRef: z.string().optional(),
        impDesc: z.string().optional(),
        avRef: z.string().optional(),
        avDesc: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const { grao, ...rest } = input;
        return upsertClassificacaoParam(grao, rest);
      }),
  }),

  // ─── TALHÕES ───────────────────────────────────────────────────────────
  talhoes: router({
    list: protectedProcedure.query(() => listTalhoesWithCulturas()),
    create: protectedProcedure
      .input(z.object({
        nome: z.string(),
        culturas: z.array(z.object({ grao: z.string(), area: z.string(), obs: z.string().optional() })),
      }))
      .mutation(({ input }) => createTalhaoWithCulturas(input.nome, input.culturas)),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string(),
        culturas: z.array(z.object({ grao: z.string(), area: z.string(), obs: z.string().optional() })),
      }))
      .mutation(({ input }) => updateTalhaoWithCulturas(input.id, input.nome, input.culturas)),
    remove: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => deleteTalhao(input.id)),
  }),

  // ─── ROMANEIO COUNTER ─────────────────────────────────────────────────
  config: router({
    getNextRomaneioNumber: protectedProcedure.query(() => getNextRomaneioNumber()),
  }),
});

export type AppRouter = typeof appRouter;
