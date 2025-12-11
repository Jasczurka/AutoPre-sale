FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["ProjectService.csproj", "./"]
RUN dotnet restore "./ProjectService.csproj"

COPY . .

RUN dotnet build "ProjectService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ProjectService.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "ProjectService.dll"]
