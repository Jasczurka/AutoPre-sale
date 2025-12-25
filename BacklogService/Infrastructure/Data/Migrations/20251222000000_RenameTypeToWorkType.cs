using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BacklogService.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class RenameTypeToWorkType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Type",
                table: "Works",
                newName: "WorkType");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "WorkType",
                table: "Works",
                newName: "Type");
        }
    }
}
