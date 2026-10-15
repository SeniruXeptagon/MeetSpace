using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MeetingRoom.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddKeycloakUserIdentity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "KeycloakUserId",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_KeycloakUserId",
                table: "Users",
                column: "KeycloakUserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_KeycloakUserId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "KeycloakUserId",
                table: "Users");
        }
    }
}
