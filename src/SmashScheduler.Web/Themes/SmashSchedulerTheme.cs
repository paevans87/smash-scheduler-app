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
        },

        Shadows = new Shadow
        {
            Elevation = new[]
            {
                "none",
                "0 2px 4px rgba(0,0,0,0.08)",
                "0 4px 8px rgba(0,0,0,0.1)",
                "0 6px 12px rgba(0,0,0,0.1)",
                "0 8px 16px rgba(0,0,0,0.12)",
                "0 10px 20px rgba(0,0,0,0.12)",
                "0 12px 24px rgba(0,0,0,0.14)",
                "0 14px 28px rgba(0,0,0,0.14)",
                "0 16px 32px rgba(0,0,0,0.16)",
                "0 18px 36px rgba(0,0,0,0.16)",
                "0 20px 40px rgba(0,0,0,0.18)",
                "0 22px 44px rgba(0,0,0,0.18)",
                "0 24px 48px rgba(0,0,0,0.2)",
                "0 26px 52px rgba(0,0,0,0.2)",
                "0 28px 56px rgba(0,0,0,0.22)",
                "0 30px 60px rgba(0,0,0,0.22)",
                "0 32px 64px rgba(0,0,0,0.24)",
                "0 34px 68px rgba(0,0,0,0.24)",
                "0 36px 72px rgba(0,0,0,0.26)",
                "0 38px 76px rgba(0,0,0,0.26)",
                "0 40px 80px rgba(0,0,0,0.28)",
                "0 42px 84px rgba(0,0,0,0.28)",
                "0 44px 88px rgba(0,0,0,0.3)",
                "0 46px 92px rgba(0,0,0,0.3)",
                "0 48px 96px rgba(0,0,0,0.32)"
            }
        }
    };
}
