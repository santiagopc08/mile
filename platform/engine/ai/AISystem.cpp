#include "engine/ai/AISystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void AISystem::setBehavior(Registry &registry, EntityID entity, AIState state)
    {
        auto *runtime = registry.GetComponent<AIRuntimeComponent>(entity);
        if (!runtime) runtime = &registry.AddComponent<AIRuntimeComponent>(entity);

        runtime->currentState = state;
        LOG_INFO("[AISystem] Entity #{} changed AI behavior state to {}.", entity, static_cast<int>(state));
    }

    void AISystem::setTarget(Registry &registry, EntityID entity, EntityID targetEntity)
    {
        auto *runtime = registry.GetComponent<AIRuntimeComponent>(entity);
        if (!runtime) runtime = &registry.AddComponent<AIRuntimeComponent>(entity);

        runtime->target = targetEntity;
        if (targetEntity != kNullEntity)
        {
            runtime->currentState = AIState::Follow;
        }
    }

    void AISystem::clearTarget(Registry &registry, EntityID entity)
    {
        auto *runtime = registry.GetComponent<AIRuntimeComponent>(entity);
        if (runtime)
        {
            runtime->target = kNullEntity;
            runtime->currentState = AIState::Return;
        }
    }

    void AISystem::pauseAI(Registry &registry, EntityID entity)
    {
        auto *runtime = registry.GetComponent<AIRuntimeComponent>(entity);
        if (runtime) runtime->paused = true;
    }

    void AISystem::resumeAI(Registry &registry, EntityID entity)
    {
        auto *runtime = registry.GetComponent<AIRuntimeComponent>(entity);
        if (runtime) runtime->paused = false;
    }

    AIState AISystem::currentState(Registry &registry, EntityID entity) const
    {
        auto *runtime = registry.GetComponent<AIRuntimeComponent>(entity);
        return runtime ? runtime->currentState : AIState::Idle;
    }

    EntityID AISystem::target(Registry &registry, EntityID entity) const
    {
        auto *runtime = registry.GetComponent<AIRuntimeComponent>(entity);
        return runtime ? runtime->target : kNullEntity;
    }

    bool AISystem::isPaused(Registry &registry, EntityID entity) const
    {
        auto *runtime = registry.GetComponent<AIRuntimeComponent>(entity);
        return runtime ? runtime->paused : false;
    }
}
