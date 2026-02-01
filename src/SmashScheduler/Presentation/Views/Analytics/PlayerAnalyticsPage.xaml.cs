using SmashScheduler.Presentation.ViewModels.Analytics;

namespace SmashScheduler.Presentation.Views.Analytics;

public partial class PlayerAnalyticsPage : ContentPage
{
    public PlayerAnalyticsPage(PlayerAnalyticsViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
