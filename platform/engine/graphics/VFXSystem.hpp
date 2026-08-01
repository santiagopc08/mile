#ifndef PLATFORM_ENGINE_GRAPHICS_VFX_SYSTEM_HPP
#define PLATFORM_ENGINE_GRAPHICS_VFX_SYSTEM_HPP

#include <glm/glm.hpp>
#include <vector>

namespace platform
{
    enum class VFXType
    {
        Dust,
        Landing,
        CoinPickup,
        FuelPickup,
        Smoke
    };

    struct ParticleInstance
    {
        VFXType type;
        glm::vec2 position;
        float lifetime;
    };

    class VFXSystem
    {
    public:
        VFXSystem() = default;

        void SpawnEffect(VFXType type, const glm::vec2 &position);

        [[nodiscard]] size_t GetActiveParticleCount() const { return m_particles.size(); }
        [[nodiscard]] bool HasEffect(VFXType type) const;

    private:
        std::vector<ParticleInstance> m_particles;
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_VFX_SYSTEM_HPP
