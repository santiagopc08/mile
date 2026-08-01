#include "engine/ui/MainMenuScreen.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void MainMenuScreen::SelectOption(MainMenuOption option, GameplayStateMachine &stateMachine)
    {
        m_selection = option;
        switch (option)
        {
        case MainMenuOption::Start:
            m_active = false;
            stateMachine.TransitionTo(MatchState::Loading);
            LOG_INFO("[MainMenuScreen] Selected Start. Transitioning to Loading.");
            break;
        case MainMenuOption::Settings:
            LOG_INFO("[MainMenuScreen] Selected Settings.");
            break;
        case MainMenuOption::Exit:
            m_active = false;
            stateMachine.TransitionTo(MatchState::Exiting);
            LOG_INFO("[MainMenuScreen] Selected Exit. Exiting application.");
            break;
        }
    }
}
