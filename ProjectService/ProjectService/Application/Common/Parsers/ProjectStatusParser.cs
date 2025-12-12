using ProjectService.Domain.Enums;

namespace ProjectService.Application.Common.Parsers;

public static class ProjectStatusParser
{
    public static ProjectStatus Default => ProjectStatus.Active;

    public static bool TryParse(string? raw, out ProjectStatus status)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            status = Default;
            return true;
        }

        var cleaned = raw.Trim();
        foreach (var name in Enum.GetNames(typeof(ProjectStatus)))
        {
            if (string.Equals(name, cleaned, StringComparison.OrdinalIgnoreCase))
            {
                status = Enum.Parse<ProjectStatus>(name);
                return true;
            }
        }

        status = default;
        return false;
    }
}

