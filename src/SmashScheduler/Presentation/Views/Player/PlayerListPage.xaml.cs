using SmashScheduler.Presentation.ViewModels.Player;

namespace SmashScheduler.Presentation.Views.Player;

public partial class PlayerListPage : ContentPage
{
    public PlayerListPage(PlayerListViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();

        if (BindingContext is PlayerListViewModel viewModel)
        {
            await viewModel.LoadPlayersCommand.ExecuteAsync(null);
        }
    }
}
