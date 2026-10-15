namespace MeetingRoom.Api.DTOs;

public record BookingResponse(
    int Id,
    int UserId,
    int RoomId,
    UserResponse User,
    DateTime StartTime,
    DateTime EndTime
);
