using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace MeetingRoom.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    [HttpGet("me")]
    public IActionResult Me()
    {
        return Ok(new
        {
            id = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub"),
            name = User.FindFirstValue("name") ?? User.FindFirstValue("preferred_username"),
            email = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email")
        });
    }
}
