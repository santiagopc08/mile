#ifndef PLATFORM_ENGINE_GAMEPLAY_GAMEPLAY_STATE_MACHINE_HPP
#define PLATFORM_ENGINE_GAMEPLAY_GAMEPLAY_STATE_MACHINE_HPP

#include "engine/gameplay/GameState.hpp"
#include "engine/events/EventQueue.hpp"

namespace platform
{
    class GameplayStateMachine
    {
    public:
        GameplayStateMachine();

        void TransitionTo(MatchState newState, EventQueue *eventQueue = nullptr);

        [[nodiscard]] MatchState GetCurrentState() const { return m_metrics.CurrentState; }
        [[nodiscard]] GameStateMetrics &GetMetrics() { return m_metrics; }
        [[nodiscard]] const GameStateMetrics &GetMetrics() const { return m_metrics; }

    private:
        GameStateMetrics m_metrics;
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_GAMEPLAY_STATE_MACHINE_HPP
