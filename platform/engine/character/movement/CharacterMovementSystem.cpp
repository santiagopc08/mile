#include "engine/character/movement/CharacterMovementSystem.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/physics/components/RigidBodyComponent.hpp"
#include "engine/core/Logger.hpp"
#include <algorithm>
#include <cmath>

namespace platform
{
    void CharacterMovementSystem::moveLeft(Registry &registry, EntityID characterEntity, float intensity)
    {
        auto *runtime = registry.GetComponent<CharacterMovementRuntimeComponent>(characterEntity);
        auto *settings = registry.GetComponent<CharacterMovementSettingsComponent>(characterEntity);

        if (!runtime) runtime = &registry.AddComponent<CharacterMovementRuntimeComponent>(characterEntity);
        if (!settings) settings = &registry.AddComponent<CharacterMovementSettingsComponent>(characterEntity);

        float topSpeed = runtime->runningEnabled ? settings->maxRunSpeed : settings->maxWalkSpeed;
        runtime->desiredSpeed = -topSpeed * std::clamp(intensity, 0.0f, 1.0f);
        runtime->direction = MovementDirection::Left;
    }

    void CharacterMovementSystem::moveRight(Registry &registry, EntityID characterEntity, float intensity)
    {
        auto *runtime = registry.GetComponent<CharacterMovementRuntimeComponent>(characterEntity);
        auto *settings = registry.GetComponent<CharacterMovementSettingsComponent>(characterEntity);

        if (!runtime) runtime = &registry.AddComponent<CharacterMovementRuntimeComponent>(characterEntity);
        if (!settings) settings = &registry.AddComponent<CharacterMovementSettingsComponent>(characterEntity);

        float topSpeed = runtime->runningEnabled ? settings->maxRunSpeed : settings->maxWalkSpeed;
        runtime->desiredSpeed = topSpeed * std::clamp(intensity, 0.0f, 1.0f);
        runtime->direction = MovementDirection::Right;
    }

    void CharacterMovementSystem::stop(Registry &registry, EntityID characterEntity)
    {
        auto *runtime = registry.GetComponent<CharacterMovementRuntimeComponent>(characterEntity);
        if (runtime)
        {
            runtime->desiredSpeed = 0.0f;
        }
    }

    void CharacterMovementSystem::setDesiredSpeed(Registry &registry, EntityID characterEntity, float speed)
    {
        auto *runtime = registry.GetComponent<CharacterMovementRuntimeComponent>(characterEntity);
        if (!runtime) runtime = &registry.AddComponent<CharacterMovementRuntimeComponent>(characterEntity);

        runtime->desiredSpeed = speed;
        if (speed < 0.0f) runtime->direction = MovementDirection::Left;
        else if (speed > 0.0f) runtime->direction = MovementDirection::Right;
    }

    void CharacterMovementSystem::enableRunning(Registry &registry, EntityID characterEntity, bool enabled)
    {
        auto *runtime = registry.GetComponent<CharacterMovementRuntimeComponent>(characterEntity);
        if (!runtime) runtime = &registry.AddComponent<CharacterMovementRuntimeComponent>(characterEntity);

        runtime->runningEnabled = enabled;
    }

    void CharacterMovementSystem::resetMovement(Registry &registry, EntityID characterEntity)
    {
        auto *runtime = registry.GetComponent<CharacterMovementRuntimeComponent>(characterEntity);
        if (runtime)
        {
            runtime->desiredSpeed = 0.0f;
            runtime->currentSpeed = 0.0f;
            runtime->mode = MovementMode::Idle;
        }
    }

    void CharacterMovementSystem::Update(Registry &registry, double dt)
    {
        float delta = static_cast<float>(dt);
        auto view = registry.GetView<CharacterMovementSettingsComponent, CharacterMovementRuntimeComponent>();

        view.Each([delta, &registry](EntityID entity, CharacterMovementSettingsComponent &settings, CharacterMovementRuntimeComponent &runtime) {
            float accel = (runtime.desiredSpeed != 0.0f) ? settings.acceleration : settings.deceleration;

            if (runtime.desiredSpeed > runtime.currentSpeed)
            {
                runtime.currentSpeed = std::min(runtime.desiredSpeed, runtime.currentSpeed + accel * delta);
            }
            else if (runtime.desiredSpeed < runtime.currentSpeed)
            {
                runtime.currentSpeed = std::max(runtime.desiredSpeed, runtime.currentSpeed - accel * delta);
            }

            // Update mode
            float speedAbs = std::abs(runtime.currentSpeed);
            if (speedAbs < 0.1f)
            {
                runtime.mode = MovementMode::Idle;
            }
            else if (runtime.runningEnabled && speedAbs > (settings.maxWalkSpeed + 0.5f))
            {
                runtime.mode = MovementMode::Running;
            }
            else
            {
                runtime.mode = MovementMode::Walking;
            }

            // Sync with rigid body
            auto *rb = registry.GetComponent<RigidBodyComponent>(entity);
            if (rb)
            {
                rb->LinearVelocity.x = runtime.currentSpeed;
            }
            auto *transform = registry.GetComponent<TransformComponent>(entity);
            if (transform)
            {
                transform->Position.x += runtime.currentSpeed * delta;
            }
        });
    }

    MovementMode CharacterMovementSystem::movementMode(Registry &registry, EntityID characterEntity) const
    {
        auto *runtime = registry.GetComponent<CharacterMovementRuntimeComponent>(characterEntity);
        return runtime ? runtime->mode : MovementMode::Idle;
    }

    MovementDirection CharacterMovementSystem::direction(Registry &registry, EntityID characterEntity) const
    {
        auto *runtime = registry.GetComponent<CharacterMovementRuntimeComponent>(characterEntity);
        return runtime ? runtime->direction : MovementDirection::Right;
    }

    float CharacterMovementSystem::currentSpeed(Registry &registry, EntityID characterEntity) const
    {
        auto *runtime = registry.GetComponent<CharacterMovementRuntimeComponent>(characterEntity);
        return runtime ? runtime->currentSpeed : 0.0f;
    }

    float CharacterMovementSystem::desiredSpeed(Registry &registry, EntityID characterEntity) const
    {
        auto *runtime = registry.GetComponent<CharacterMovementRuntimeComponent>(characterEntity);
        return runtime ? runtime->desiredSpeed : 0.0f;
    }

    bool CharacterMovementSystem::isMoving(Registry &registry, EntityID characterEntity) const
    {
        auto *runtime = registry.GetComponent<CharacterMovementRuntimeComponent>(characterEntity);
        return runtime ? (std::abs(runtime->currentSpeed) > 0.1f) : false;
    }

    SubsystemProfilerMetrics CharacterMovementSystem::GetProfilerMetrics() const
    {
        SubsystemProfilerMetrics metrics;
        metrics.currentState = "Active";
        metrics.cpuTimeMs = 0.05;
        metrics.memoryUsageBytes = sizeof(CharacterMovementRuntimeComponent);
        metrics.peakMemoryBytes = metrics.memoryUsageBytes;
        metrics.activeObjects = 1;
        metrics.lifetimeObjectsCreated = 1;
        return metrics;
    }
}
