var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

app.MapGet("/api/health", () =>
{
    return Results.Ok(new
    {
        status = "healthy",
        message = "Meeting Room Booking API is running"
    });
});



app.Run();