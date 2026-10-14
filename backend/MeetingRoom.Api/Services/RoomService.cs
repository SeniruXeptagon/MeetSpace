using Microsoft.EntityFrameworkCore;
using MeetingRoom.Api.Data;
using MeetingRoom.Api.DTOs;
using MeetingRoom.Api.Interfaces;

namespace MeetingRoom.Api.Services;

public class RoomService : IRoomService
{
    private readonly AppDbContext _dbContext;

    public RoomService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<RoomResponse>> GetAllRoomsAsync()
    {
        return await _dbContext.Rooms
            .AsNoTracking()
            .OrderBy(room => room.Id)
            .Select(room => new RoomResponse(
                room.Id,
                room.Name
            ))
            .ToListAsync();
    }

    public async Task<List<BookingResponse>> GetRoomBookingsAsync(int roomId, DateOnly date)
    {
        var dayStart = DateTime.SpecifyKind(
            date.ToDateTime(TimeOnly.MinValue),
            DateTimeKind.Utc
        );
        var dayEnd = dayStart.AddDays(1);

        return await _dbContext.Bookings
            .AsNoTracking()
            .Where(booking =>
                booking.RoomId == roomId &&
                booking.StartTime < dayEnd &&
                booking.EndTime > dayStart)
            .OrderBy(booking => booking.StartTime)
            .Select(booking => new BookingResponse(
                booking.Id,
                booking.UserId,
                booking.RoomId,
                booking.StartTime,
                booking.EndTime
            ))
            .ToListAsync();
    }
}
