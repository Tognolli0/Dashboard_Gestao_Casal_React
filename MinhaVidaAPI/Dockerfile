# Estágio 1: Runtime (Base para rodar a aplicação)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

# Estágio 2: SDK (Base para compilar o código)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# 1. Copia apenas o arquivo de projeto primeiro para otimizar o cache
COPY ["MinhaVidaAPI.csproj", "./"]

# 2. Restaura os pacotes NuGet de forma limpa
RUN dotnet restore "MinhaVidaAPI.csproj"

# 3. Copia o restante dos arquivos (agora ignorando o lixo local pelo .dockerignore)
COPY . .

# 4. Compila o projeto SEM tentar restaurar novamente (evita o erro MSB4018)
RUN dotnet build "MinhaVidaAPI.csproj" -c Release -o /app/build --no-restore

# Estágio 3: Publish
FROM build AS publish
RUN dotnet publish "MinhaVidaAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false --no-restore

# Estágio 4: Final (Imagem de execução)
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "MinhaVidaAPI.dll"]