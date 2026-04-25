# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src

COPY NovaCare.API.csproj .
RUN dotnet restore

COPY . .
RUN dotnet publish -c Release -o /app/publish

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
