#ifndef PLATFORM_ENGINE_GAMEPLAY_PAUSE_FLOW_SYSTEM_HPP
#define PLATFORM_ENGINE_GAMEPLAY_PAUSE_FLOW_SYSTEM_HPP

#include "engine/gameplay/GameplayStateMachine.hpp"

namespace platform
{
    class PauseFlowSystem
    {
    public:
        PauseFlowSystem() = default;

        void pause(GameplayStateMachine &stateMachine);
        void resume(GameplayStateMachine &stateMachine);

        [[nodiscard]] bool isPaused(const GameplayStateMachine &stateMachine) const;
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_PAUSE_FLOW_SYSTEM_HPP
