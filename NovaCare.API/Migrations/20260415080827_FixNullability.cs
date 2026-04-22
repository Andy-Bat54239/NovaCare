using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaCare.API.Migrations
{
    /// <inheritdoc />
    public partial class FixNullability : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "Sales",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Notes",
                table: "Sales");
        }
    }
}
