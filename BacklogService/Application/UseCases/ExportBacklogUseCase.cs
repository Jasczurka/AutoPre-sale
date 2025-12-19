using BacklogService.Application.Common;
using BacklogService.Application.Errors;
using BacklogService.Application.DTOs;
using CsvHelper;
using CsvHelper.Configuration;
using ClosedXML.Excel;
using System.Globalization;
using System.Collections.Generic;

namespace BacklogService.Application.UseCases;

public class ExportBacklogUseCase
{
    private readonly GetBacklogUseCase _getBacklogUseCase;

    public ExportBacklogUseCase(GetBacklogUseCase getBacklogUseCase)
    {
        _getBacklogUseCase = getBacklogUseCase;
    }

    public async Task<Result<(Stream stream, string fileName, string contentType), ExportBacklogError>> Execute(Guid projectId, ExportType type)
    {
        var getResult = await _getBacklogUseCase.Execute(projectId);
        if (!getResult.IsSuccess)
        {
            if (getResult.Error == GetBacklogError.ProjectNotFound)
                return Result<(Stream stream, string fileName, string contentType), ExportBacklogError>.Fail(ExportBacklogError.ProjectNotFound);
            else
                return Result<(Stream stream, string fileName, string contentType), ExportBacklogError>.Fail(ExportBacklogError.FileGenerationFailed);
        }

        var flatWorks = Flatten(getResult.Value);

        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var extension = type == ExportType.Csv ? "csv" : "xlsx";
        var fileName = $"backlog_{projectId}_{timestamp}.{extension}";

        try
        {
            Stream stream;
            string contentType;
            if (type == ExportType.Csv)
            {
                (stream, contentType) = await GenerateCsv(flatWorks);
            }
            else
            {
                (stream, contentType) = GenerateXlsx(flatWorks);
            }

            return Result<(Stream stream, string fileName, string contentType), ExportBacklogError>.Success((stream, fileName, contentType));
        }
        catch
        {
            return Result<(Stream stream, string fileName, string contentType), ExportBacklogError>.Fail(ExportBacklogError.FileGenerationFailed);
        }
    }

    private List<WorkDto> Flatten(List<WorkDto> dtos)
    {
        var result = new List<WorkDto>();
        foreach (var dto in dtos)
        {
            result.Add(new WorkDto
            {
                Id = dto.Id,
                WorkNumber = dto.WorkNumber,
                Level = dto.Level,
                Type = dto.Type,
                AcceptanceCriteria = dto.AcceptanceCriteria,
                ChildWorks = null
            });
            if (dto.ChildWorks != null)
            {
                result.AddRange(Flatten(dto.ChildWorks));
            }
        }
        return result;
    }

    private async Task<(Stream stream, string contentType)> GenerateCsv(List<WorkDto> works)
    {
        var memoryStream = new MemoryStream();
        using var writer = new StreamWriter(memoryStream, leaveOpen: true);
        using var csv = new CsvWriter(writer, new CsvConfiguration(CultureInfo.InvariantCulture));

        csv.WriteRecords(works.Select(w => new
        {
            w.WorkNumber,
            w.Level,
            w.Type,
            w.AcceptanceCriteria
        }));

        await writer.FlushAsync();
        memoryStream.Position = 0;

        return (memoryStream, "text/csv");
    }

    private (Stream stream, string contentType) GenerateXlsx(List<WorkDto> works)
    {
        var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Backlog");

        worksheet.Cell(1, 1).Value = "WorkNumber";
        worksheet.Cell(1, 2).Value = "Level";
        worksheet.Cell(1, 3).Value = "Type";
        worksheet.Cell(1, 4).Value = "AcceptanceCriteria";

        for (int i = 0; i < works.Count; i++)
        {
            var work = works[i];
            worksheet.Cell(i + 2, 1).Value = work.WorkNumber;
            worksheet.Cell(i + 2, 2).Value = work.Level;
            worksheet.Cell(i + 2, 3).Value = work.Type;
            worksheet.Cell(i + 2, 4).Value = work.AcceptanceCriteria;
        }

        var memoryStream = new MemoryStream();
        workbook.SaveAs(memoryStream);
        memoryStream.Position = 0;

        return (memoryStream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }
}
