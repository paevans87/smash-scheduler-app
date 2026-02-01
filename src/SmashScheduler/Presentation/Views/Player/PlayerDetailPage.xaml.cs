using SmashScheduler.Presentation.ViewModels.Player;

namespace SmashScheduler.Presentation.Views.Player;

public partial class PlayerDetailPage : ContentPage
{
    public PlayerDetailPage(PlayerDetailViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
