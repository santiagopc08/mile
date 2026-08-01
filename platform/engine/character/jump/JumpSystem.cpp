#include "engine/character/jump/JumpSystem.hpp"
#include "engine/character/CharacterRuntimeComponent.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/physics/components/RigidBodyComponent.hpp"
#include "engine/core/Logger.hpp"
#include <algorithm>

namespace platform
{
    void JumpSystem::requestJump(Registry &registry, EntityID characterEntity)
    {
        auto *runtime = registry.GetComponent<JumpRuntimeComponent>(characterEntity);
        auto *settings = registry.GetComponent<JumpSettingsComponent>(characterEntity);
        if (!runtime) runtime = &registry.AddComponent<JumpRuntimeComponent>(characterEntity);
        if (!settings) settings = &registry.AddComponent<JumpSettingsComponent>(characterEntity);

        if (canJump(registry, characterEntity))
        {
            auto *rb = registry.GetComponent<RigidBodyComponent>(characterEntity);
            if (rb)
            {
                rb->LinearVelocity.y = settings->jumpForce;
            }
            runtime->jumping = true;
            runtime->state = JumpState::Jumping;
            runtime->coyoteTimer = 0.0f;
            runtime->bufferTimer = 0.0f;
            runtime->bufferedJump = false;
            LOG_INFO("[JumpSystem] Executed jump on entity #{} (Force: {:.1f}).", characterEntity, settings->jumpForce);
        }
        else
        {
            runtime->bufferedJump = true;
            runtime->bufferTimer = settings->jumpBuffer;
            runtime->state = JumpState::Buffered;
            LOG_INFO("[JumpSystem] Buffered jump request for entity #{}.", characterEntity);
        }
    }

    void JumpSystem::cancelJump(Registry &registry, EntityID characterEntity)
    {
        auto *runtime = registry.GetComponent<JumpRuntimeComponent>(characterEntity);
        auto *settings = registry.GetComponent<JumpSettingsComponent>(characterEntity);
        auto *rb = registry.GetComponent<RigidBodyComponent>(characterEntity);

        if (runtime && settings && rb && runtime->jumping && settings->variableJumpHeight)
        {
            if (rb->LinearVelocity.y > 0.0f)
            {
                rb->LinearVelocity.y *= 0.5f; // Shorten jump height when released early
                LOG_INFO("[JumpSystem] Early jump release - cut vertical velocity on entity #{}.", characterEntity);
            }
        }
    }

    void JumpSystem::resetJump(Registry &registry, EntityID characterEntity)
    {
        auto *runtime = registry.GetComponent<JumpRuntimeComponent>(characterEntity);
        if (runtime)
        {
            runtime->jumping = false;
            runtime->bufferedJump = false;
            runtime->bufferTimer = 0.0f;
            runtime->coyoteTimer = 0.0f;
            runtime->state = JumpState::Ready;
        }
    }

    bool JumpSystem::canJump(Registry &registry, EntityID characterEntity) const
    {
        auto *charRuntime = registry.GetComponent<CharacterRuntimeComponent>(characterEntity);
        auto *jumpRuntime = registry.GetComponent<JumpRuntimeComponent>(characterEntity);

        bool grounded = charRuntime ? charRuntime->grounded : true;
        bool hasCoyote = jumpRuntime ? (jumpRuntime->coyoteTimer > 0.0f) : false;

        return grounded || hasCoyote;
    }

    bool JumpSystem::isJumping(Registry &registry, EntityID characterEntity) const
    {
        auto *runtime = registry.GetComponent<JumpRuntimeComponent>(characterEntity);
        return runtime ? runtime->jumping : false;
    }

    void JumpSystem::Update(Registry &registry, double dt)
    {
        float delta = static_cast<float>(dt);
        auto view = registry.GetView<JumpSettingsComponent, JumpRuntimeComponent>();

        view.Each([delta, &registry, this](EntityID entity, JumpSettingsComponent &settings, JumpRuntimeComponent &runtime) {
            auto *charRuntime = registry.GetComponent<CharacterRuntimeComponent>(entity);
            auto *rb = registry.GetComponent<RigidBodyComponent>(entity);

            bool grounded = charRuntime ? charRuntime->grounded : true;

            // Handle Coyote Time
            if (grounded)
            {
                runtime.coyoteTimer = settings.coyoteTime;
            }
            else if (runtime.coyoteTimer > 0.0f)
            {
                runtime.coyoteTimer -= delta;
            }

            // Handle Jump Buffer
            if (runtime.bufferedJump)
            {
                runtime.bufferTimer -= delta;
                if (runtime.bufferTimer <= 0.0f)
                {
                    runtime.bufferedJump = false;
                    if (runtime.state == JumpState::Buffered) runtime.state = JumpState::Ready;
                }
                else if (canJump(registry, entity))
                {
                    requestJump(registry, entity);
                }
            }

            // Update Gravity & Jump States
            if (rb)
            {
                if (rb->LinearVelocity.y > 0.1f)
                {
                    runtime.state = JumpState::Ascending;
                    rb->GravityScale = settings.gravityScaleUp;
                }
                else if (rb->LinearVelocity.y < -0.1f)
                {
                    runtime.state = JumpState::Falling;
                    rb->GravityScale = settings.gravityScaleDown;
                }
                else if (grounded)
                {
                    if (runtime.jumping)
                    {
                        runtime.jumping = false;
                        runtime.state = JumpState::Landing;
                    }
                    else
                    {
                        runtime.state = JumpState::Ready;
                    }
                    rb->GravityScale = 1.0f;
                }
            }
        });
    }

    JumpState JumpSystem::jumpState(Registry &registry, EntityID characterEntity) const
    {
        auto *runtime = registry.GetComponent<JumpRuntimeComponent>(characterEntity);
        return runtime ? runtime->state : JumpState::Ready;
    }

    float JumpSystem::jumpHeight(Registry &registry, EntityID characterEntity) const
    {
        auto *settings = registry.GetComponent<JumpSettingsComponent>(characterEntity);
        return settings ? settings->jumpHeight : 0.0f;
    }

    float JumpSystem::jumpTime(Registry &registry, EntityID characterEntity) const
    {
        auto *runtime = registry.GetComponent<JumpRuntimeComponent>(characterEntity);
        return runtime ? static_cast<float>(runtime->jumpStartTime) : 0.0f;
    }

    float JumpSystem::remainingCoyoteTime(Registry &registry, EntityID characterEntity) const
    {
        auto *runtime = registry.GetComponent<JumpRuntimeComponent>(characterEntity);
        return runtime ? runtime->coyoteTimer : 0.0f;
    }

    float JumpSystem::bufferTimeRemaining(Registry &registry, EntityID characterEntity) const
    {
        auto *runtime = registry.GetComponent<JumpRuntimeComponent>(characterEntity);
        return runtime ? runtime->bufferTimer : 0.0f;
    }

    SubsystemProfilerMetrics JumpSystem::GetProfilerMetrics() const
    {
        SubsystemProfilerMetrics metrics;
        metrics.currentState = "Active";
        metrics.cpuTimeMs = 0.05;
        metrics.memoryUsageBytes = sizeof(JumpRuntimeComponent);
        metrics.peakMemoryBytes = metrics.memoryUsageBytes;
        metrics.activeObjects = 1;
        metrics.lifetimeObjectsCreated = 1;
        return metrics;
    }
}
