using SmashScheduler.Presentation.ViewModels.Analytics;

namespace SmashScheduler.Presentation.Views.Analytics;

public partial class SessionAnalyticsPage : ContentPage
{
    public SessionAnalyticsPage(SessionAnalyticsViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
