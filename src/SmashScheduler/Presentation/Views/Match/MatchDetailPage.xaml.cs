using SmashScheduler.Presentation.ViewModels.Match;

namespace SmashScheduler.Presentation.Views.Match;

public partial class MatchDetailPage : ContentPage
{
    public MatchDetailPage(MatchDetailViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
