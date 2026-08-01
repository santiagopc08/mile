#ifndef PLATFORM_ENGINE_UI_MAIN_MENU_SCREEN_HPP
#define PLATFORM_ENGINE_UI_MAIN_MENU_SCREEN_HPP

#include "engine/gameplay/GameplayStateMachine.hpp"
#include <string>

namespace platform
{
    enum class MainMenuOption
    {
        Start,
        Settings,
        Exit
    };

    class MainMenuScreen
    {
    public:
        MainMenuScreen() = default;

        void SelectOption(MainMenuOption option, GameplayStateMachine &stateMachine);

        [[nodiscard]] MainMenuOption GetCurrentSelection() const { return m_selection; }
        [[nodiscard]] bool IsActive() const { return m_active; }

    private:
        MainMenuOption m_selection{MainMenuOption::Start};
        bool m_active{true};
    };
}

#endif // PLATFORM_ENGINE_UI_MAIN_MENU_SCREEN_HPP
