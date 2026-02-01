using System.Globalization;

namespace SmashScheduler.Presentation.Converters;

public class SkillLevelToColourConverter : IValueConverter
{
    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is int skillLevel)
        {
            return skillLevel switch
            {
                >= 1 and <= 3 => Color.FromArgb("#E74C3C"),
                >= 4 and <= 6 => Color.FromArgb("#F39C12"),
                >= 7 and <= 10 => Color.FromArgb("#27AE60"),
                _ => Color.FromArgb("#BDC3C7")
            };
        }

        return Color.FromArgb("#BDC3C7");
    }

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}
