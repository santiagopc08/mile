#ifndef PLATFORM_ENGINE_UI_CANVAS_HPP
#define PLATFORM_ENGINE_UI_CANVAS_HPP

#include "engine/ui/UITypes.hpp"
#include "engine/ui/widgets/Widget.hpp"
#include "engine/graphics/Renderer.hpp"
#include <vector>
#include <memory>
#include <string>

namespace platform
{
    class Canvas
    {
    public:
        Canvas();
        explicit Canvas(std::string name, UILayer layer = UILayer::HUD);

        void Update(double dt);
        void Render(Renderer &renderer);
        void UpdateLayout();

        void AddWidget(std::shared_ptr<Widget> widget);
        void RemoveWidget(const std::shared_ptr<Widget> &widget);
        std::shared_ptr<Widget> FindWidget(const std::string &name);

        void SetName(std::string name) { m_name = std::move(name); }
        [[nodiscard]] const std::string &GetName() const { return m_name; }

        void SetLayer(UILayer layer) { m_layer = layer; }
        [[nodiscard]] UILayer GetLayer() const { return m_layer; }

        void SetVisible(bool visible) { m_visible = visible; }
        [[nodiscard]] bool IsVisible() const { return m_visible; }

        void SetSize(const glm::vec2 &size) { m_size = size; UpdateLayout(); }
        [[nodiscard]] const glm::vec2 &GetSize() const { return m_size; }

        [[nodiscard]] const std::vector<std::shared_ptr<Widget>> &GetRootWidgets() const { return m_rootWidgets; }
        [[nodiscard]] size_t GetTotalWidgetCount() const;

    private:
        size_t CountWidgetsRecursive(const std::shared_ptr<Widget> &widget) const;

        std::string m_name{"Canvas"};
        UILayer m_layer{UILayer::HUD};
        glm::vec2 m_size{1280.0f, 720.0f};
        bool m_visible{true};
        std::vector<std::shared_ptr<Widget>> m_rootWidgets;
    };
}

#endif // PLATFORM_ENGINE_UI_CANVAS_HPP
