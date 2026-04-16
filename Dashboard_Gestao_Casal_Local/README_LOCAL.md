# Dashboard Gestao Casal - Versao Local

Esta pasta contem uma versao local do projeto para rodar em qualquer computador com banco SQLite.

## O que mudou

- A API usa SQLite por padrao.
- O banco e criado automaticamente no arquivo `MinhaVidaAPI/minhavida-local.db`.
- O frontend aponta para `http://localhost:5163`.
- Nao depende de Supabase ou Render para funcionar localmente.

## Como rodar

### Opcao 1

Execute:

```powershell
.\iniciar-local.ps1
```

ou clique duas vezes em:

```bat
iniciar-local.bat
```

### Opcao 2

Rode manualmente em dois terminais.

API:

```powershell
cd MinhaVidaAPI
dotnet run
```

Frontend:

```powershell
cd MinhaVidaFront
npm install
npm run dev
```

## Enderecos

- Frontend: `http://localhost:5173`
- API: `http://localhost:5163`
- Swagger: `http://localhost:5163/swagger`

## Observacoes

- Recursos como Twilio e OCR continuam opcionais. Sem configuracao, o sistema segue funcionando.
- O banco local fica salvo na propria pasta da API.
- Se quiser zerar os dados, apague o arquivo `MinhaVidaAPI/minhavida-local.db`.
