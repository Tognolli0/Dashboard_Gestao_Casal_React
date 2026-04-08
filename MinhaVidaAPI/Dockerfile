# Estágio 1: Build (Compilação)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# 1. Copia apenas o arquivo de projeto
COPY ["MinhaVidaAPI.csproj", "./"]

# 2. Restaura os pacotes (Isso gera o project.assets.json dentro do Linux)
RUN dotnet restore "MinhaVidaAPI.csproj"

# 3. Copia o restante dos arquivos (Atenção: Garanta que tem o .dockerignore)
COPY . .

# 4. Publica o projeto (O publish já faz o build automaticamente)
# Usamos o --no-restore para forçar o uso do que foi gerado no passo 2
RUN dotnet publish "MinhaVidaAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false --no-restore

# Estágio 2: Final (Imagem leve apenas para rodar)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Copia apenas os binários compilados do estágio anterior
COPY --from=build /app/publish .

# Define a porta que o Render costuma usar
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "MinhaVidaAPI.dll"]