using MeetingRoom.Api.DTOs;

namespace MeetingRoom.Api.Interfaces;

public interface IRoomService
{
    Task<List<RoomResponse>> GetAllRoomsAsync();

    Task<List<BookingResponse>> GetRoomBookingsAsync(int roomId, DateOnly date);
}
