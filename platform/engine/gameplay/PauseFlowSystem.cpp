#include "engine/gameplay/PauseFlowSystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void PauseFlowSystem::pause(GameplayStateMachine &stateMachine)
    {
        if (stateMachine.GetCurrentState() == MatchState::Playing)
        {
            stateMachine.TransitionTo(MatchState::Paused);
            LOG_INFO("[PauseFlowSystem] Gameplay paused. Physics & gameplay simulation suspended.");
        }
    }

    void PauseFlowSystem::resume(GameplayStateMachine &stateMachine)
    {
        if (stateMachine.GetCurrentState() == MatchState::Paused)
        {
            stateMachine.TransitionTo(MatchState::Playing);
            LOG_INFO("[PauseFlowSystem] Gameplay resumed. Simulation active.");
        }
    }

    bool PauseFlowSystem::isPaused(const GameplayStateMachine &stateMachine) const
    {
        return stateMachine.GetCurrentState() == MatchState::Paused;
    }
}
