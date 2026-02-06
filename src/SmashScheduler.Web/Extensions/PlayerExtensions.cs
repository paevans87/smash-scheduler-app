using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Web.Extensions;

public static class PlayerExtensions
{
    public static string GetPlayerInitialsForAvatar(this Player player)
    {
        if (string.IsNullOrWhiteSpace(player.Name))
        {
            return "?";
        }

        var parts = player.Name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var initials = parts.Select(p => p[0]);

        return string.Concat(initials.Take(3)).ToUpper();
    }
    
    public static string GetGenderedAvatarCssStyle(this Player player)
    {
        return player.Gender switch
        {
            Gender.Female => "background-color: var(--smash-gender-female);",
            Gender.Male => "background-color: var(--smash-gender-male);",
            _ => "background-color: var(--smash-gender-other);"
        };
    }
}