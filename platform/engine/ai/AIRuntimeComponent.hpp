#ifndef PLATFORM_ENGINE_AI_AI_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_AI_AI_RUNTIME_COMPONENT_HPP

#include "engine/scene/Entity.hpp"

namespace platform
{
    enum class AIState
    {
        Idle,
        Patrol,
        Follow,
        Attack,
        Return,
        Dead
    };

    struct AIRuntimeComponent
    {
        AIState currentState{AIState::Idle};
        EntityID target{kNullEntity};
        float stateTime{0.0f};
        bool paused{false};
    };
}

#endif // PLATFORM_ENGINE_AI_AI_RUNTIME_COMPONENT_HPP
