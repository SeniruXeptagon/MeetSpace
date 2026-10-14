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
}