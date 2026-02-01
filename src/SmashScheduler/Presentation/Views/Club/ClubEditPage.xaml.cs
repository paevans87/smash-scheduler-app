using SmashScheduler.Presentation.ViewModels.Club;

namespace SmashScheduler.Presentation.Views.Club;

public partial class ClubEditPage : ContentPage
{
    public ClubEditPage(ClubEditViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
