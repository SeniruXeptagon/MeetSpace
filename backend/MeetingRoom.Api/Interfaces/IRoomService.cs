using MeetingRoom.Api.DTOs;

namespace MeetingRoom.Api.Interfaces;

public interface IRoomService
{
    Task<List<RoomResponse>> GetAllRoomsAsync();

    Task<List<BookingResponse>> GetRoomBookingsAsync(int roomId, DateOnly date, string keycloakUserId);

    Task<List<BookingResponse>> GetMyBookingsAsync(string keycloakUserId);

    Task<bool> CancelBookingAsync(int bookingId, string keycloakUserId);

    Task<BookingResponse?> CreateBookingAsync(
        int roomId,
        CreateBookingRequest request,
        string keycloakUserId,
        string userName,
        string? email
    );
}
