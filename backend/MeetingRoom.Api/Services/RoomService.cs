using Microsoft.EntityFrameworkCore;
using MeetingRoom.Api.Data;
using MeetingRoom.Api.DTOs;
using MeetingRoom.Api.Interfaces;
using MeetingRoom.Api.Models;
using Npgsql;

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

    public async Task<List<BookingResponse>> GetRoomBookingsAsync(int roomId, DateOnly date, string keycloakUserId)
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
                booking.CancelledAtUtc == null &&
                booking.StartTime < dayEnd &&
                booking.EndTime > dayStart)
            .OrderBy(booking => booking.StartTime)
            .Select(booking => new BookingResponse(
                booking.Id,
                booking.RoomId,
                booking.StartTime,
                booking.EndTime,
                booking.User.KeycloakUserId == keycloakUserId,
                false
            ))
            .ToListAsync();
    }

    public async Task<List<BookingResponse>> GetMyBookingsAsync(string keycloakUserId)
    {
        return await _dbContext.Bookings
            .AsNoTracking()
            .Where(booking => booking.User.KeycloakUserId == keycloakUserId)
            .OrderBy(booking => booking.StartTime)
            .Select(booking => new BookingResponse(
                booking.Id,
                booking.RoomId,
                booking.StartTime,
                booking.EndTime,
                true,
                booking.CancelledAtUtc != null
            ))
            .ToListAsync();
    }

    public async Task<bool> CancelBookingAsync(int bookingId, string keycloakUserId)
    {
        var booking = await _dbContext.Bookings
            .SingleOrDefaultAsync(existing => existing.Id == bookingId
                && existing.User.KeycloakUserId == keycloakUserId);
        if (booking is null) return false;
        if (booking.CancelledAtUtc is null)
        {
            booking.CancelledAtUtc = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();
        }
        return true;
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
            booking.CancelledAtUtc == null &&
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
                .SingleOrDefaultAsync(existingUser => existingUser.UserName == userName
                    && existingUser.KeycloakUserId == null);
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
        try
        {
            await _dbContext.SaveChangesAsync();
        }
        catch (DbUpdateException exception) when (
            exception.InnerException is PostgresException postgres
            && postgres.SqlState == PostgresErrorCodes.ExclusionViolation)
        {
            // The database constraint resolves races between simultaneous requests.
            return null;
        }

        return new BookingResponse(
            booking.Id,
            booking.RoomId,
            booking.StartTime,
            booking.EndTime,
            true,
            false
        );
    }
}
