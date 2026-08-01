#ifndef PLATFORM_ENGINE_GAMEPLAY_FAILURE_FAILURE_SYSTEM_HPP
#define PLATFORM_ENGINE_GAMEPLAY_FAILURE_FAILURE_SYSTEM_HPP

#include "engine/gameplay/failure/FailureSettingsComponent.hpp"
#include "engine/gameplay/failure/FailureRuntimeComponent.hpp"
#include "engine/gameplay/GameplayStateMachine.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"

namespace platform
{
    class FailureSystem
    {
    public:
        FailureSystem() = default;

        void fail(Registry &registry, EntityID entity, FailureType reason, GameplayStateMachine &stateMachine);
        void resetFailure(Registry &registry, EntityID entity);

        [[nodiscard]] FailureType failureReason(Registry &registry, EntityID entity) const;
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_FAILURE_FAILURE_SYSTEM_HPP
