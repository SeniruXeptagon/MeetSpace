using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MeetingRoom.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingCancellation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CancelledAtUtc",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS btree_gist;");
            migrationBuilder.Sql(@"
                ALTER TABLE ""Bookings""
                ADD CONSTRAINT ""EX_Bookings_Room_Time_Active""
                EXCLUDE USING gist (
                    ""RoomId"" WITH =,
                    tstzrange(""StartTime"", ""EndTime"", '[)') WITH &&
                ) WHERE (""CancelledAtUtc"" IS NULL);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"ALTER TABLE ""Bookings"" DROP CONSTRAINT ""EX_Bookings_Room_Time_Active"";");
            migrationBuilder.DropColumn(
                name: "CancelledAtUtc",
                table: "Bookings");
        }
    }
}
