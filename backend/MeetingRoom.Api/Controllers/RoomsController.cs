using Microsoft.AspNetCore.Mvc;
using MeetingRoom.Api.Interfaces;

namespace MeetingRoom.Api.Controllers;

[ApiController]
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
}