#include "engine/graphics/VFXSystem.hpp"
#include "engine/core/Logger.hpp"
#include <algorithm>

namespace platform
{
    void VFXSystem::SpawnEffect(VFXType type, const glm::vec2 &position)
    {
        m_particles.push_back({type, position, 1.0f});
        LOG_INFO("[VFXSystem] Spawned effect code {} at ({:.1f}, {:.1f}).",
                 static_cast<int>(type), position.x, position.y);
    }

    bool VFXSystem::HasEffect(VFXType type) const
    {
        return std::any_of(m_particles.begin(), m_particles.end(), [type](const ParticleInstance &p) {
            return p.type == type;
        });
    }
}
