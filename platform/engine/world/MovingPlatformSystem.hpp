#ifndef PLATFORM_ENGINE_WORLD_MOVING_PLATFORM_SYSTEM_HPP
#define PLATFORM_ENGINE_WORLD_MOVING_PLATFORM_SYSTEM_HPP

#include "engine/world/PlatformSettingsComponent.hpp"
#include "engine/world/PlatformRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"

namespace platform
{
    class MovingPlatformSystem
    {
    public:
        MovingPlatformSystem() = default;

        void Update(Registry &registry, double dt);

        [[nodiscard]] glm::vec2 position(Registry &registry, EntityID platformEntity) const;
    };
}

#endif // PLATFORM_ENGINE_WORLD_MOVING_PLATFORM_SYSTEM_HPP
