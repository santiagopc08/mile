#include "engine/scene/systems/TransformSystem.hpp"

namespace platform
{
    TransformSystem::TransformSystem() = default;

    void TransformSystem::Update(Registry &registry, double dt)
    {
        (void)dt;
        m_updatedCount = 0;

        auto view = registry.GetView<TransformComponent, ActiveComponent>();
        view.Each([this](EntityID entity, TransformComponent &transform, ActiveComponent &active) {
            (void)entity;
            if (!active.Enabled)
            {
                return;
            }

            if (transform.IsDirty)
            {
                m_updatedCount++;
                // In future hierarchy systems, matrix computation will occur here
            }
        });
    }

    void TransformSystem::PrepareRenderTransforms(Registry &registry)
    {
        auto view = registry.GetView<TransformComponent, ActiveComponent>();
        view.Each([](EntityID entity, TransformComponent &transform, ActiveComponent &active) {
            (void)entity;
            if (active.Enabled && active.Visible)
            {
                // Mark clean after render data preparation
                transform.MarkClean();
            }
        });
    }
}
