#include "engine/gameplay/GameplayStateMachine.hpp"
#include "engine/gameplay/GameplayEvents.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    GameplayStateMachine::GameplayStateMachine() = default;

    void GameplayStateMachine::TransitionTo(MatchState newState, EventQueue *eventQueue)
    {
        if (m_metrics.CurrentState == newState)
        {
            return;
        }

        m_metrics.CurrentState = newState;

        if (eventQueue)
        {
            switch (newState)
            {
            case MatchState::Playing:
                eventQueue->Push(std::make_shared<GameStartedEvent>());
                break;
            case MatchState::Paused:
                eventQueue->Push(std::make_shared<GamePausedEvent>());
                break;
            case MatchState::Respawning:
                eventQueue->Push(std::make_shared<PlayerRespawnedEvent>());
                break;
            case MatchState::Completed:
                eventQueue->Push(std::make_shared<GameCompletedEvent>());
                break;
            default:
                break;
            }
        }
    }
}
