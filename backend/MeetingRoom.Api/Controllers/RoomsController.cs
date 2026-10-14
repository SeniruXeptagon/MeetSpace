using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MeetingRoom.Api.Interfaces;

namespace MeetingRoom.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/rooms")]
[Produces("application/json")]
public class RoomsController : ControllerBase
{
    private readonly IRoomService _roomService;

    public RoomsController(IRoomService roomService)
    {
        _roomService = roomService;
    }

    [HttpGet]
    public async Task<IActionResult> GetRooms()
    {
        var rooms = await _roomService.GetAllRoomsAsync();

        return Ok(rooms);
    }

    [HttpGet("{roomId:int}/bookings")]
    [AllowAnonymous]
    public async Task<IActionResult> GetRoomBookings(
        int roomId,
        [FromQuery] DateOnly date)
    {
        var rooms = await _roomService.GetAllRoomsAsync();

        if (rooms.All(room => room.Id != roomId))
        {
            return NotFound(new { message = $"Room {roomId} was not found." });
        }

        var bookings = await _roomService.GetRoomBookingsAsync(roomId, date);

        return Ok(bookings);
    }
}
