FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
# O Render define a porta automaticamente, mas o ASP.NET 8 ouve a 8080 por padrão
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["MinhaVidaAPI.csproj", "./"]
RUN dotnet restore "./MinhaVidaAPI.csproj"
COPY . .
RUN dotnet build "MinhaVidaAPI.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "MinhaVidaAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Criar a pasta do banco de dados para persistência no Render
RUN mkdir -p /app/data

ENTRYPOINT ["dotnet", "MinhaVidaAPI.dll"]