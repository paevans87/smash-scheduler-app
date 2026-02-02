using MudBlazor;

namespace SmashScheduler.Web.Themes;

public static class SmashSchedulerTheme
{
    public static MudTheme Theme => new()
    {
        PaletteLight = new PaletteLight
        {
            Primary = "#2ECC71",
            PrimaryDarken = "#229954",
            PrimaryLighten = "#58D68D",
            PrimaryContrastText = "#FFFFFF",

            Secondary = "#3498DB",
            SecondaryDarken = "#2471A3",
            SecondaryLighten = "#5DADE2",
            SecondaryContrastText = "#FFFFFF",

            Tertiary = "#9B59B6",
            TertiaryDarken = "#7D3C98",
            TertiaryLighten = "#AF7AC5",
            TertiaryContrastText = "#FFFFFF",

            Info = "#3498DB",
            InfoDarken = "#2980B9",
            InfoLighten = "#5DADE2",
            InfoContrastText = "#FFFFFF",

            Success = "#27AE60",
            SuccessDarken = "#1E8449",
            SuccessLighten = "#52BE80",
            SuccessContrastText = "#FFFFFF",

            Warning = "#F39C12",
            WarningDarken = "#D68910",
            WarningLighten = "#F8C471",
            WarningContrastText = "#FFFFFF",

            Error = "#E74C3C",
            ErrorDarken = "#C0392B",
            ErrorLighten = "#EC7063",
            ErrorContrastText = "#FFFFFF",

            Dark = "#2C3E50",
            DarkDarken = "#1A252F",
            DarkLighten = "#34495E",
            DarkContrastText = "#FFFFFF",

            TextPrimary = "#2C3E50",
            TextSecondary = "#7F8C8D",
            TextDisabled = "#BDC3C7",

            Background = "#F8F9FA",
            BackgroundGray = "#ECF0F1",
            Surface = "#FFFFFF",

            DrawerBackground = "#FFFFFF",
            DrawerText = "#2C3E50",
            DrawerIcon = "#7F8C8D",

            AppbarBackground = "#FFFFFF",
            AppbarText = "#2C3E50",

            LinesDefault = "#E8ECEF",
            LinesInputs = "#BDC3C7",

            Divider = "#E8ECEF",
            DividerLight = "#F4F6F7",

            HoverOpacity = 0.06,
            RippleOpacity = 0.1,

            ActionDefault = "#7F8C8D",
            ActionDisabled = "#BDC3C7",
            ActionDisabledBackground = "#E8ECEF"
        },

        LayoutProperties = new LayoutProperties
        {
            DefaultBorderRadius = "12px",
            DrawerWidthLeft = "260px",
            DrawerWidthRight = "260px"
        }
    };
}
