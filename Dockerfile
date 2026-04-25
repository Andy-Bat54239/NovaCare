# Build stage — context is the repo root
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src

COPY NovaCare.API/NovaCare.API.csproj NovaCare.API/
RUN dotnet restore NovaCare.API/NovaCare.API.csproj

COPY NovaCare.API/ NovaCare.API/
RUN dotnet publish NovaCare.API/NovaCare.API.csproj -c Release -o /app/publish

# Runtime stage — alpine is ~150MB lighter than the full image
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS final
WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080

# Memory optimisations for free-tier containers (512MB RAM)
ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=true
ENV DOTNET_gcServer=0
ENV DOTNET_GCConserveMemory=9

ENTRYPOINT ["dotnet", "NovaCare.API.dll"]