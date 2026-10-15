namespace MeetingRoom.Api.DTOs;

public record BookingResponse(
    int Id,
    int RoomId,
    DateTime StartTime,
    DateTime EndTime,
    bool IsMine,
    bool IsCancelled
);
