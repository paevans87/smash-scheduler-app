using SmashScheduler.Domain.Enums;
using System.Globalization;

namespace SmashScheduler.Presentation.Converters;

public class SessionStateToColourConverter : IValueConverter
{
    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is SessionState state)
        {
            return state switch
            {
                SessionState.Draft => Color.FromArgb("#F39C12"),
                SessionState.Active => Color.FromArgb("#27AE60"),
                SessionState.Complete => Color.FromArgb("#7F8C8D"),
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
