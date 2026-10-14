namespace MeetingRoom.Api.DTOs;

public record CreateBookingRequest(
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime
);
