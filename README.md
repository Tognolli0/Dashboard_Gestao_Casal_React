💰 Dashboard Gestão Casal - MinhaVida v3.0
Um ecossistema financeiro completo para casais e empreendedores, focado na separação inteligente de fluxos pessoais e empresariais. O sistema utiliza Inteligência Artificial (OCR) para automatizar o lançamento de gastos a partir de fotos de comprovantes.

🌟 Diferenciais do Projeto
Arquitetura Moderna: Frontend de alto desempenho em React integrado a uma robusta API ASP.NET Core.

IA com Azure Vision: Leitura automática de valor, data e descrição de comprovantes Pix e boletos via OCR.

Gestão 4-em-1: Monitoramento de caixas distintos (Diogo Pessoal, Bia Pessoal, Pekus Consultoria, Secret Studio).

Dashboards de Alto Contraste: Interface tecnológica com visão de Metas, Bucket List e Evolução Patrimonial.

Cálculo Inteligente: Lógica que consolida entradas e saídas automaticamente, oferecendo saldo líquido em tempo real.

🛠️ Tecnologias e Ferramentas
Frontend
Framework: React + Vite

Estilização: Tailwind CSS (Alto Contraste)

Componentes: UI Customizada (Cards, StatCards, Modais)

Ícones: Lucide React

Backend
Framework: ASP.NET Core 8.0 (Web API)

Banco de Dados: SQLite (com suporte para migração PostgreSQL)

ORM: Entity Framework Core

Cloud/IA: Azure Computer Vision SDK (OCR)

🧠 Lógica de Funcionamento
Lançamento Inteligente: O usuário envia uma imagem; a API processa via Azure e devolve os dados estruturados para conferência.

Mapeamento de Categorias: Sistema de análise que identifica para onde o dinheiro está indo (Lazer, Moradia, Alimentação, etc).

Gestão de Sonhos: Aba de Bucket List para gerenciar desejos de consumo e viagens do casal.

Evolução Patrimonial: Comparação visual entre ganhos pessoais e faturamentos de empreendimentos.

⚙️ Como Rodar Localmente
Pré-requisitos
Node.js (para o Frontend)

SDK .NET 8.0

Chave de API da Azure (Vision OCR)

Passo a Passo
Clone o repositório:

Bash
git clone https://github.com/Tognolli0/Dashboard_Gestao_Casal.git
Configuração do Backend:

Navegue até MinhaVidaAPI/appsettings.json.

Configure sua AzureAPIKey e AzureEndpoint.

Execute as migrações:

Bash
dotnet ef database update
Configuração do Frontend:

Navegue até a pasta do Front.

Instale as dependências: npm install.

Inicie o projeto: npm run dev.

🛡️ Segurança de Dados
Este projeto utiliza tratamento rigoroso de segredos. As chaves de API devem ser gerenciadas preferencialmente via User Secrets no ambiente de desenvolvimento para evitar a exposição acidental em repositórios públicos.

Desenvolvido por Diogo Tognolli 🚀