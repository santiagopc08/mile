#ifndef PLATFORM_ENGINE_GRAPHICS_RENDER_SYSTEM_HPP
#define PLATFORM_ENGINE_GRAPHICS_RENDER_SYSTEM_HPP

#include "engine/scene/Registry.hpp"
#include "engine/graphics/Renderer.hpp"
#include "engine/graphics/Camera2D.hpp"
#include "engine/graphics/components/ShapeComponent.hpp"
#include <vector>

namespace platform
{
    struct RenderItem
    {
        EntityID Entity{0};
        glm::vec2 WorldPosition{0.0f, 0.0f};
        float Rotation{0.0f};
        glm::vec2 Scale{1.0f, 1.0f};
        ShapeComponent Shape{};
        int LayerID{0};
        int OrderInLayer{0};
    };

    class RenderSystem
    {
    public:
        RenderSystem();

        void RenderScene(Registry &registry, Renderer &renderer, const Camera2D &camera);

        [[nodiscard]] size_t GetRenderedItemCount() const { return m_renderedCount; }

    private:
        void BuildQueue(Registry &registry);
        void SortQueue();
        void SubmitCommands(Renderer &renderer, const Camera2D &camera);

        std::vector<RenderItem> m_renderQueue;
        size_t m_renderedCount{0};
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_RENDER_SYSTEM_HPP
