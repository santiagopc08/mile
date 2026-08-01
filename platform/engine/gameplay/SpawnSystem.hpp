#ifndef PLATFORM_ENGINE_GAMEPLAY_SPAWN_SYSTEM_HPP
#define PLATFORM_ENGINE_GAMEPLAY_SPAWN_SYSTEM_HPP

#include "engine/scene/Registry.hpp"
#include "engine/physics/PhysicsWorld.hpp"
#include <glm/glm.hpp>

namespace platform
{
    class SpawnSystem
    {
    public:
        SpawnSystem();

        void RespawnVehicle(Registry &registry, PhysicsWorld &physicsWorld, EntityID vehicleEntity, const glm::vec2 &spawnPosition);
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_SPAWN_SYSTEM_HPP
