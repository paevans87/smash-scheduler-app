using SmashScheduler.Presentation.ViewModels.Session;

namespace SmashScheduler.Presentation.Views.Session;

public partial class SessionListPage : ContentPage
{
    public SessionListPage(SessionListViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();

        if (BindingContext is SessionListViewModel viewModel)
        {
            await viewModel.LoadSessionsCommand.ExecuteAsync(null);
        }
    }
}
