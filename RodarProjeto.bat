@echo off
title Iniciando Dashboard do Casal
echo ===================================================
echo    PREPARANDO O AMBIENTE FINANCEIRO...
echo ===================================================

:: 1. Entra na pasta da API e atualiza o Banco de Dados
echo [1/3] Atualizando banco de dados SQLite...
cd MinhaVidaAPI
dotnet ef database update
if %errorlevel% neq 0 (
    echo ERRO: Falha ao atualizar o banco de dados. Verifique o EF Core.
    pause
    exit
)

:: 2. Inicia a API em uma nova janela
echo [2/3] Iniciando o Servidor (API)...
start "API Financeira" dotnet run

:: 3. Volta e entra na pasta do Dashboard
echo [3/3] Iniciando o Dashboard (Blazor)...
cd ..
cd MinhaVidaDashboard
start "Dashboard Casal" dotnet watch run

echo ===================================================
echo    TUDO PRONTO! AGUARDE O NAVEGADOR ABRIR.
echo ===================================================
pause