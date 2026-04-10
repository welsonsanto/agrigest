# AgriGest - TODO

- [x] Executar webdev_add_feature para web-db-user
- [x] Criar tabelas no banco: fazenda, clientes, transportadoras, fornecedores, caminhoes, motoristas, contratos, insumos, estoqueInsumos, recebimentoInsumos, romaneiosEntrada, romaneiosSaida, expedicoes, classificacaoParams, talhoes, talhoesCulturas
- [x] Criar helpers de banco de dados (server/db.ts) para CRUD de todas as entidades
- [x] Criar procedures tRPC (server/routers.ts) para expor CRUD de todas as entidades
- [x] Resolver conflitos do upgrade (App.tsx com Router/Switch)
- [x] Migrar frontend Home.tsx para usar tRPC ao invés de localStorage
- [x] Autenticação via Manus OAuth (substituir login/senha local)
- [x] Rodar pnpm db:push para sincronizar schema
- [x] Escrever testes vitest para validar procedures (26 testes passando)
- [x] Testar CRUD no navegador (Fazenda e Clientes verificados)
- [x] Salvar checkpoint
