# Estágio 1: Base para rodar a aplicação
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

# Estágio 2: SDK para compilar o código
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copia o arquivo de projeto e restaura as dependências
COPY ["MinhaVidaAPI.csproj", "./"]
RUN dotnet restore "MinhaVidaAPI.csproj"

# Copia todo o restante do código e compila
COPY . .
RUN dotnet build "MinhaVidaAPI.csproj" -c Release -o /app/build

# Estágio 3: Publicação
FROM build AS publish
RUN dotnet publish "MinhaVidaAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Estágio 4: Final - Monta a imagem que vai pro ar
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "MinhaVidaAPI.dll"]