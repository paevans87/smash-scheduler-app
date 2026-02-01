using SmashScheduler.Presentation.ViewModels.Session;

namespace SmashScheduler.Presentation.Views.Session;

public partial class SessionDraftPage : ContentPage
{
    public SessionDraftPage(SessionDraftViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
