using Microsoft.EntityFrameworkCore;
using MeetingRoom.Api.Data;
using MeetingRoom.Api.Interfaces;
using MeetingRoom.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Register controllers
builder.Services.AddControllers();

// Register PostgreSQL DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("Default")
    )
);

// Services
builder.Services.AddScoped<IRoomService, RoomService>();

var app = builder.Build();

app.MapControllers();

app.Run();
