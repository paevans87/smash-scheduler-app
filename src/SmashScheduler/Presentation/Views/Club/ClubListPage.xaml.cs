using SmashScheduler.Presentation.ViewModels.Club;

namespace SmashScheduler.Presentation.Views.Club;

public partial class ClubListPage : ContentPage
{
    public ClubListPage(ClubListViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();

        if (BindingContext is ClubListViewModel viewModel)
        {
            await viewModel.LoadClubsCommand.ExecuteAsync(null);
        }
    }
}
