#ifndef PLATFORM_ENGINE_GAMEPLAY_UI_GAMEPLAY_HUD_HPP
#define PLATFORM_ENGINE_GAMEPLAY_UI_GAMEPLAY_HUD_HPP

#include "engine/gameplay/ui/GameplayHUDViewModel.hpp"

namespace platform
{
    class GameplayHUD
    {
    public:
        GameplayHUD() = default;

        void Render(const GameplayHUDViewModel &vm)
        {
            (void)vm;
            // HUD rendering logic consuming ViewModels exclusively
        }
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_UI_GAMEPLAY_HUD_HPP
