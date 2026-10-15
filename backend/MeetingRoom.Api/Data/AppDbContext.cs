using Microsoft.EntityFrameworkCore;
using MeetingRoom.Api.Models;

namespace MeetingRoom.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    public DbSet<Room> Rooms => Set<Room>();

    public DbSet<Booking> Bookings => Set<Booking>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Prevent duplicate usernames
        modelBuilder.Entity<User>()
            .HasIndex(u => u.UserName)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.KeycloakUserId)
            .IsUnique();

        // Seed two meeting rooms
        modelBuilder.Entity<Room>().HasData(
            new Room { Id = 1, Name = "Room A" },
            new Room { Id = 2, Name = "Room B" }
        );

        // EndTime must be greater than StartTime
        modelBuilder.Entity<Booking>()
            .ToTable(t => t.HasCheckConstraint(
                "CK_Booking_ValidTime",
                "\"EndTime\" > \"StartTime\""
            ));
    }
}
