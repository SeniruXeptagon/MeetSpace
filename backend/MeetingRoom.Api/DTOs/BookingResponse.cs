namespace MeetingRoom.Api.DTOs;

public record BookingResponse(
    int Id,
    int UserId,
    int RoomId,
    DateTime StartTime,
    DateTime EndTime
);
