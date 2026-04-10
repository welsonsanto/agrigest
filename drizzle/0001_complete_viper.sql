CREATE TABLE `appConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configKey` varchar(100) NOT NULL,
	`configValue` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `appConfig_configKey_unique` UNIQUE(`configKey`)
);
--> statement-breakpoint
CREATE TABLE `caminhoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`placa` varchar(20) NOT NULL,
	`uf` varchar(5),
	`arquivoUrl` text,
	`arquivoName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `caminhoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classificacaoParams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`grao` varchar(50) NOT NULL,
	`umRef` varchar(20),
	`umDesc` varchar(20),
	`umDescPesado` varchar(20),
	`impRef` varchar(20),
	`impDesc` varchar(20),
	`avRef` varchar(20),
	`avDesc` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `classificacaoParams_id` PRIMARY KEY(`id`),
	CONSTRAINT `classificacaoParams_grao_unique` UNIQUE(`grao`)
);
--> statement-breakpoint
CREATE TABLE `clientes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`cpfCnpj` varchar(30),
	`contato` varchar(100),
	`email` varchar(320),
	`cidade` varchar(255),
	`estado` varchar(5),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clientes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contratos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numero` varchar(30) NOT NULL,
	`cliente` varchar(255),
	`grao` varchar(50),
	`quantidade` varchar(30),
	`preco` varchar(30),
	`vencimento` varchar(20),
	`status` varchar(30) DEFAULT 'Ativo',
	`obs` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contratos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `estoqueInsumos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`insumoId` int NOT NULL,
	`insumoNome` varchar(255),
	`qtd` varchar(30) DEFAULT '0',
	`unidade` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `estoqueInsumos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expedicoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numero` varchar(20) NOT NULL,
	`data` varchar(20),
	`contrato` varchar(50),
	`cliente` varchar(255),
	`grao` varchar(50),
	`status` varchar(30) DEFAULT 'Pendente',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expedicoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fazendas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`produtor` varchar(255),
	`cpfCnpj` varchar(30),
	`ie` varchar(30),
	`cep` varchar(15),
	`endereco` varchar(500),
	`numero` varchar(20),
	`bairro` varchar(255),
	`cidade` varchar(255),
	`estado` varchar(5),
	`graos` json DEFAULT ('[]'),
	`logoUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fazendas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fornecedores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`cnpj` varchar(30),
	`segmento` varchar(100),
	`contato` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fornecedores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insumos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`unidade` varchar(20),
	`categoria` varchar(100),
	`fornecedor` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `insumos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `motoristas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`cnh` varchar(30),
	`arquivoUrl` text,
	`arquivoName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `motoristas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recebimentoInsumos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`produto` varchar(255),
	`nf` varchar(50),
	`recebidoPor` varchar(255),
	`data` varchar(20),
	`fotoNFUrl` text,
	`fotoNFName` varchar(255),
	`fotoProdutoUrl` text,
	`fotoProdutoName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recebimentoInsumos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `romaneiosEntrada` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numero` varchar(20) NOT NULL,
	`tipo` varchar(20) DEFAULT 'Entrada',
	`data` varchar(20),
	`grao` varchar(50),
	`safra` varchar(20),
	`talhao` varchar(255),
	`placa` varchar(20),
	`motorista` varchar(255),
	`transportadora` varchar(255),
	`pesoBruto` varchar(30),
	`pesoTara` varchar(30),
	`liq` varchar(30),
	`umidade` varchar(20),
	`impureza` varchar(20),
	`avariado` varchar(20),
	`dUm` varchar(20),
	`dImp` varchar(20),
	`dAv` varchar(20),
	`totalDesc` varchar(20),
	`faixaUmidade` varchar(20),
	`pesoFinal` varchar(30),
	`obs` text,
	`deletedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `romaneiosEntrada_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `romaneiosSaida` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numero` varchar(20) NOT NULL,
	`tipo` varchar(20) DEFAULT 'Saída',
	`data` varchar(20),
	`grao` varchar(50),
	`safra` varchar(20),
	`cliente` varchar(255),
	`contrato` varchar(50),
	`placa` varchar(20),
	`motorista` varchar(255),
	`transportadora` varchar(255),
	`pesoBruto` varchar(30),
	`pesoTara` varchar(30),
	`liq` varchar(30),
	`umidade` varchar(20),
	`impureza` varchar(20),
	`avariado` varchar(20),
	`dUm` varchar(20),
	`dImp` varchar(20),
	`dAv` varchar(20),
	`totalDesc` varchar(20),
	`faixaUmidade` varchar(20),
	`pesoFinal` varchar(30),
	`obs` text,
	`deletedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `romaneiosSaida_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `talhoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `talhoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `talhoesCulturas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`talhaoId` int NOT NULL,
	`grao` varchar(50) NOT NULL,
	`area` varchar(30),
	`obs` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `talhoesCulturas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transportadoras` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`cnpj` varchar(30),
	`contato` varchar(100),
	`cidade` varchar(255),
	`estado` varchar(5),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transportadoras_id` PRIMARY KEY(`id`)
);
