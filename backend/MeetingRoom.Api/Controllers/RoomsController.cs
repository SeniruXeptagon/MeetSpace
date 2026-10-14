using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MeetingRoom.Api.DTOs;
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

    [HttpPost("{roomId:int}/bookings")]
    public async Task<IActionResult> CreateBooking(
        int roomId,
        [FromBody] CreateBookingRequest request)
    {
        if (request.StartTime >= request.EndTime)
        {
            return BadRequest(new { message = "EndTime must be later than StartTime." });
        }

        var rooms = await _roomService.GetAllRoomsAsync();

        if (rooms.All(room => room.Id != roomId))
        {
            return NotFound(new { message = $"Room {roomId} was not found." });
        }

        var keycloakUserId = User.FindFirst("sub")?.Value;
        var userName = User.FindFirst("preferred_username")?.Value
            ?? User.Identity?.Name;
        var email = User.FindFirst("email")?.Value;

        if (string.IsNullOrWhiteSpace(keycloakUserId) || string.IsNullOrWhiteSpace(userName))
        {
            return Unauthorized(new { message = "The authenticated Keycloak user claims are missing." });
        }

        var booking = await _roomService.CreateBookingAsync(
            roomId,
            request,
            keycloakUserId,
            userName,
            email
        );

        if (booking is null)
        {
            return Conflict(new
            {
                message = "The room is already booked during the requested time."
            });
        }

        return CreatedAtAction(
            nameof(GetRoomBookings),
            new { roomId },
            booking
        );
    }
}
