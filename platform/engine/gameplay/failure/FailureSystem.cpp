#include "engine/gameplay/failure/FailureSystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void FailureSystem::fail(Registry &registry, EntityID entity, FailureType reason, GameplayStateMachine &stateMachine)
    {
        auto *runtime = registry.GetComponent<FailureRuntimeComponent>(entity);
        if (!runtime)
        {
            runtime = &registry.AddComponent<FailureRuntimeComponent>(entity);
        }

        runtime->failed = true;
        runtime->reason = reason;

        stateMachine.TransitionTo(MatchState::Failed);
        LOG_INFO("[FailureSystem] Entity #{} failed due to reason code {}. State transitioned to Failed.",
                 entity, static_cast<int>(reason));
    }

    void FailureSystem::resetFailure(Registry &registry, EntityID entity)
    {
        auto *runtime = registry.GetComponent<FailureRuntimeComponent>(entity);
        if (runtime)
        {
            runtime->failed = false;
        }
    }

    FailureType FailureSystem::failureReason(Registry &registry, EntityID entity) const
    {
        auto *runtime = registry.GetComponent<FailureRuntimeComponent>(entity);
        return runtime ? runtime->reason : FailureType::FuelDepletion;
    }
}
