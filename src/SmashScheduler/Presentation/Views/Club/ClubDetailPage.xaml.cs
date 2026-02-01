using SmashScheduler.Presentation.ViewModels.Club;

namespace SmashScheduler.Presentation.Views.Club;

public partial class ClubDetailPage : ContentPage
{
    public ClubDetailPage(ClubDetailViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
