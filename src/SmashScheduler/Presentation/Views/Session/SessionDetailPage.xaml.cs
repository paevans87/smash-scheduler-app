using SmashScheduler.Presentation.ViewModels.Session;

namespace SmashScheduler.Presentation.Views.Session;

public partial class SessionDetailPage : ContentPage
{
    public SessionDetailPage(SessionDetailViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
