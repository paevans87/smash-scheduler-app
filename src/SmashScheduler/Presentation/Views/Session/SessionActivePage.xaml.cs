using SmashScheduler.Presentation.ViewModels.Session;

namespace SmashScheduler.Presentation.Views.Session;

public partial class SessionActivePage : ContentPage
{
    public SessionActivePage(SessionActiveViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
