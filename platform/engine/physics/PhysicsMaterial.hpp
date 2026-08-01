#ifndef PLATFORM_ENGINE_PHYSICS_PHYSICS_MATERIAL_HPP
#define PLATFORM_ENGINE_PHYSICS_PHYSICS_MATERIAL_HPP

namespace platform
{
    struct PhysicsMaterial
    {
        float Density{1.0f};
        float Friction{0.3f};
        float Restitution{0.2f};
    };
}

#endif // PLATFORM_ENGINE_PHYSICS_PHYSICS_MATERIAL_HPP
