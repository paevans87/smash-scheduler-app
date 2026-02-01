using SmashScheduler.Presentation.ViewModels.Player;

namespace SmashScheduler.Presentation.Views.Player;

public partial class PlayerEditPage : ContentPage
{
    public PlayerEditPage(PlayerEditViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
