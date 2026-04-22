using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NovaCare.API.Migrations
{
    /// <inheritdoc />
    public partial class AddBranchToChat : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BranchId",
                table: "ChatConversations",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_ChatConversations_BranchId",
                table: "ChatConversations",
                column: "BranchId");

            // Assign existing conversations (BranchId = 0) to branch 1 so the FK constraint can be applied
            migrationBuilder.Sql("UPDATE [ChatConversations] SET [BranchId] = 1 WHERE [BranchId] = 0");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatConversations_Branches_BranchId",
                table: "ChatConversations",
                column: "BranchId",
                principalTable: "Branches",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatConversations_Branches_BranchId",
                table: "ChatConversations");

            migrationBuilder.DropIndex(
                name: "IX_ChatConversations_BranchId",
                table: "ChatConversations");

            migrationBuilder.DropColumn(
                name: "BranchId",
                table: "ChatConversations");
        }
    }
}
