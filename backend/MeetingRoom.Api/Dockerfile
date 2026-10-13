# Stage 1: Build the application
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

# Copy project file and restore dependencies
COPY *.csproj ./
RUN dotnet restore MeetingRoom.Api.csproj

# Copy source code
COPY . .

# Publish application
RUN dotnet publish MeetingRoom.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore


# Stage 2: Run the application
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

# Install curl for the container health check.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy published files
COPY --from=build /app/publish .

# Configure HTTP port
ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080

# Start the application
ENTRYPOINT ["dotnet", "MeetingRoom.Api.dll"]