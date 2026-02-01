using SmashScheduler.Infrastructure.Persistence;

namespace SmashScheduler;

public partial class App : Microsoft.Maui.Controls.Application
{
    private readonly DatabaseInitialiser _databaseInitialiser;

    public App(DatabaseInitialiser databaseInitialiser)
    {
        InitializeComponent();
        _databaseInitialiser = databaseInitialiser;
    }

    protected override Window CreateWindow(IActivationState? activationState)
    {
        // 1. Create the root Window with AppShell
        var window = new Window(new AppShell());

        // 2. Hook into the Created event for safe async initialisation
        window.Created += async (s, e) =>
        {
            await InitialiseDatabaseAsync();
        };

        return window;
    }

    private async Task InitialiseDatabaseAsync()
    {
        try 
        {
            // Use ConfigureAwait(false) if this logic doesn't touch UI elements
            await _databaseInitialiser.InitialiseAsync().ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"[CRITICAL] DB Init Error: {ex.Message}");
        }
    }
}