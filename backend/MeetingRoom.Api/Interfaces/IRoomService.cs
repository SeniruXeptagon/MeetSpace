using MeetingRoom.Api.DTOs;

namespace MeetingRoom.Api.Interfaces;

public interface IRoomService
{
    Task<List<RoomResponse>> GetAllRoomsAsync();

    Task<List<BookingResponse>> GetRoomBookingsAsync(int roomId, DateOnly date);

    Task<BookingResponse?> CreateBookingAsync(
        int roomId,
        CreateBookingRequest request,
        string keycloakUserId,
        string userName,
        string? email
    );
}
