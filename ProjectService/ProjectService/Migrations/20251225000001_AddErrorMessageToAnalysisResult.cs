using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectService.Migrations
{
    /// <inheritdoc />
    public partial class AddErrorMessageToAnalysisResult : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ErrorMessage",
                table: "AnalysisResults",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ErrorMessage",
                table: "AnalysisResults");
        }
    }
}
