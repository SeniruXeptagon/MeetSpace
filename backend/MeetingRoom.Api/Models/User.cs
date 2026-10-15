namespace MeetingRoom.Api.Models;

public class User
{
    public int Id{get; set;}
    public string? KeycloakUserId { get; set; }
    public string UserName{get; set;} = string.Empty;
    public string? Email { get; set; }
    public string PasswordHash{get; set;} = string.Empty;

    public List<Booking> Bookings {get; set;} = new();

}
