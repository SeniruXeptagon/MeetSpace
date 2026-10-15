using System.Security.Claims;
using MeetingRoom.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MeetingRoom.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/bookings")]
public class BookingsController(IRoomService roomService) : ControllerBase
{
    [HttpGet("mine")]
    public async Task<IActionResult> GetMine()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();
        return Ok(await roomService.GetMyBookingsAsync(userId));
    }

    [HttpDelete("{bookingId:int}")]
    public async Task<IActionResult> Cancel(int bookingId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();
        return await roomService.CancelBookingAsync(bookingId, userId)
            ? NoContent()
            : NotFound();
    }
}
