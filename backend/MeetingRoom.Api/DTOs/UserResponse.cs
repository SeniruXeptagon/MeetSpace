namespace MeetingRoom.Api.DTOs;

public record UserResponse(
    int Id,
    string KeycloakUserId,
    string UserName,
    string? Email
);
