#ifndef PLATFORM_ENGINE_SCENE_ENTITY_HPP
#define PLATFORM_ENGINE_SCENE_ENTITY_HPP

#include <cstdint>

namespace platform
{
    using EntityID = uint64_t;
    constexpr EntityID kNullEntity = 0;

    enum class EntityState : uint8_t
    {
        Created = 0,
        Alive,
        PendingDestroy,
        Destroyed
    };
}

#endif // PLATFORM_ENGINE_SCENE_ENTITY_HPP
