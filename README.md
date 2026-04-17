# Dashboard Gestao Casal React

Versao React do produto de gestao financeira pessoal, com dashboard, OCR de comprovantes e separacao de fluxos pessoais e de negocio.

## Stack

- Frontend em React + Vite + Tailwind CSS
- Backend em ASP.NET Core Web API
- Persistencia com Entity Framework Core
- OCR com Azure AI Vision

## Estrutura

- `MinhaVidaFront`: aplicacao React
- `MinhaVidaAPI`: API principal
- `Dashboard_Gestao_Casal_Local`: copia de trabalho antiga, mantida temporariamente para consolidacao

## Como rodar

1. Configure credenciais apenas no ambiente local.
2. Ajuste a conexao do backend em `MinhaVidaAPI/appsettings.Development.json` ou User Secrets.
3. Instale dependencias do frontend com `npm install`.
4. Rode a API e depois o frontend.

## Seguranca

As credenciais reais foram removidas do repositorio.
Nao armazene senhas, tokens ou chaves de servicos em arquivos versionados.

## Proximo passo recomendado

Este repositorio deve virar a versao principal do projeto.
A pasta `Dashboard_Gestao_Casal_Local` ainda precisa ser consolidada ou removida em uma segunda rodada de limpeza.
