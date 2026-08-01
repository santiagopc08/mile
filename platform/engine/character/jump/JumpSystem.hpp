#ifndef PLATFORM_ENGINE_CHARACTER_JUMP_JUMP_SYSTEM_HPP
#define PLATFORM_ENGINE_CHARACTER_JUMP_JUMP_SYSTEM_HPP

#include "engine/character/jump/JumpSettingsComponent.hpp"
#include "engine/character/jump/JumpRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"
#include "engine/diagnostics/IRuntimeProfiler.hpp"

namespace platform
{
    class JumpSystem : public IRuntimeProfiler
    {
    public:
        JumpSystem() = default;

        void requestJump(Registry &registry, EntityID characterEntity);
        void cancelJump(Registry &registry, EntityID characterEntity);
        void resetJump(Registry &registry, EntityID characterEntity);

        void Update(Registry &registry, double dt);

        [[nodiscard]] bool canJump(Registry &registry, EntityID characterEntity) const;
        [[nodiscard]] bool isJumping(Registry &registry, EntityID characterEntity) const;

        [[nodiscard]] JumpState jumpState(Registry &registry, EntityID characterEntity) const;
        [[nodiscard]] float jumpHeight(Registry &registry, EntityID characterEntity) const;
        [[nodiscard]] float jumpTime(Registry &registry, EntityID characterEntity) const;
        [[nodiscard]] float remainingCoyoteTime(Registry &registry, EntityID characterEntity) const;
        [[nodiscard]] float bufferTimeRemaining(Registry &registry, EntityID characterEntity) const;

        [[nodiscard]] SubsystemProfilerMetrics GetProfilerMetrics() const override;
    };
}

#endif // PLATFORM_ENGINE_CHARACTER_JUMP_JUMP_SYSTEM_HPP
