#ifndef PLATFORM_ENGINE_CHARACTER_MOVEMENT_CHARACTER_MOVEMENT_SYSTEM_HPP
#define PLATFORM_ENGINE_CHARACTER_MOVEMENT_CHARACTER_MOVEMENT_SYSTEM_HPP

#include "engine/character/movement/CharacterMovementSettingsComponent.hpp"
#include "engine/character/movement/CharacterMovementRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"
#include "engine/diagnostics/IRuntimeProfiler.hpp"

namespace platform
{
    class CharacterMovementSystem : public IRuntimeProfiler
    {
    public:
        CharacterMovementSystem() = default;

        void moveLeft(Registry &registry, EntityID characterEntity, float intensity = 1.0f);
        void moveRight(Registry &registry, EntityID characterEntity, float intensity = 1.0f);
        void stop(Registry &registry, EntityID characterEntity);

        void setDesiredSpeed(Registry &registry, EntityID characterEntity, float speed);
        void enableRunning(Registry &registry, EntityID characterEntity, bool enabled);
        void resetMovement(Registry &registry, EntityID characterEntity);

        void Update(Registry &registry, double dt);

        [[nodiscard]] MovementMode movementMode(Registry &registry, EntityID characterEntity) const;
        [[nodiscard]] MovementDirection direction(Registry &registry, EntityID characterEntity) const;
        [[nodiscard]] float currentSpeed(Registry &registry, EntityID characterEntity) const;
        [[nodiscard]] float desiredSpeed(Registry &registry, EntityID characterEntity) const;
        [[nodiscard]] bool isMoving(Registry &registry, EntityID characterEntity) const;

        [[nodiscard]] SubsystemProfilerMetrics GetProfilerMetrics() const override;
    };
}

#endif // PLATFORM_ENGINE_CHARACTER_MOVEMENT_CHARACTER_MOVEMENT_SYSTEM_HPP
