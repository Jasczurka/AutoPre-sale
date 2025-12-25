using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BacklogService.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueIndexOnWorkNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add unique index on ProjectId and WorkNumber combination
            // This prevents duplicate works with the same WorkNumber within a project
            migrationBuilder.CreateIndex(
                name: "IX_Works_ProjectId_WorkNumber",
                table: "Works",
                columns: new[] { "ProjectId", "WorkNumber" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Works_ProjectId_WorkNumber",
                table: "Works");
        }
    }
}
