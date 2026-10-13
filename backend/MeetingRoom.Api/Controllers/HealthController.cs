using Microsoft.AspNetCore.Mvc;

namespace MeetingRoom.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "healthy",
            message = "Meeting Room Booking API is running"
        });
    }
}
