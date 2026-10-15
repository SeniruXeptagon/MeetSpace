using Microsoft.EntityFrameworkCore;
using MeetingRoom.Api.Data;
using MeetingRoom.Api.DTOs;
using MeetingRoom.Api.Interfaces;
using MeetingRoom.Api.Models;

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
                new UserResponse(
                    booking.User.Id,
                    booking.User.KeycloakUserId ?? string.Empty,
                    booking.User.UserName,
                    booking.User.Email
                ),
                booking.StartTime,
                booking.EndTime
            ))
            .ToListAsync();
    }

    public async Task<BookingResponse?> CreateBookingAsync(
        int roomId,
        CreateBookingRequest request,
        string keycloakUserId,
        string userName,
        string? email)
    {
        var dayStart = DateTime.SpecifyKind(
            request.Date.ToDateTime(request.StartTime),
            DateTimeKind.Utc
        );
        var dayEnd = DateTime.SpecifyKind(
            request.Date.ToDateTime(request.EndTime),
            DateTimeKind.Utc
        );

        var hasConflict = await _dbContext.Bookings.AnyAsync(booking =>
            booking.RoomId == roomId &&
            booking.StartTime < dayEnd &&
            booking.EndTime > dayStart);

        if (hasConflict)
        {
            return null;
        }

        var user = await _dbContext.Users
            .SingleOrDefaultAsync(existingUser =>
                existingUser.KeycloakUserId == keycloakUserId);

        if (user is null)
        {
            // Match an existing legacy user once, then associate it with Keycloak.
            user = await _dbContext.Users
                .SingleOrDefaultAsync(existingUser => existingUser.UserName == userName);
        }

        if (user is null)
        {
            user = new User
            {
                KeycloakUserId = keycloakUserId,
                UserName = userName,
                Email = email,
                PasswordHash = string.Empty
            };

            _dbContext.Users.Add(user);
        }
        else
        {
            user.KeycloakUserId = keycloakUserId;
            user.UserName = userName;
            user.Email = email;
        }

        var booking = new Booking
        {
            User = user,
            RoomId = roomId,
            StartTime = dayStart,
            EndTime = dayEnd
        };

        _dbContext.Bookings.Add(booking);
        await _dbContext.SaveChangesAsync();

        return new BookingResponse(
            booking.Id,
            booking.UserId,
            booking.RoomId,
            new UserResponse(
                user.Id,
                user.KeycloakUserId ?? string.Empty,
                user.UserName,
                user.Email
            ),
            booking.StartTime,
            booking.EndTime
        );
    }
}
