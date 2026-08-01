#ifndef PLATFORM_ENGINE_UI_WIDGETS_WIDGET_HPP
#define PLATFORM_ENGINE_UI_WIDGETS_WIDGET_HPP

#include "engine/ui/UITypes.hpp"
#include "engine/graphics/Renderer.hpp"
#include <glm/glm.hpp>
#include <string>
#include <vector>
#include <memory>
#include <functional>

namespace platform
{
    class Widget : public std::enable_shared_from_this<Widget>
    {
    public:
        Widget();
        explicit Widget(std::string name);
        virtual ~Widget() = default;

        // Lifecycle & Render
        void Update(double dt);
        void Render(Renderer &renderer);
        void UpdateLayout();

        // Hierarchy
        void AddChild(std::shared_ptr<Widget> child);
        void RemoveChild(const std::shared_ptr<Widget> &child);
        std::shared_ptr<Widget> FindChild(const std::string &name);

        // Getters & Setters
        void SetName(std::string name) { m_name = std::move(name); }
        [[nodiscard]] const std::string &GetName() const { return m_name; }

        void SetPosition(const glm::vec2 &position) { m_position = position; }
        [[nodiscard]] const glm::vec2 &GetPosition() const { return m_position; }
        [[nodiscard]] glm::vec2 GetAbsolutePosition() const;

        void SetSize(const glm::vec2 &size) { m_size = size; }
        [[nodiscard]] const glm::vec2 &GetSize() const { return m_size; }

        void SetAnchor(AnchorPoint anchor) { m_anchor = anchor; }
        [[nodiscard]] AnchorPoint GetAnchor() const { return m_anchor; }

        void SetState(WidgetState state) { m_state = state; }
        [[nodiscard]] WidgetState GetState() const { return m_state; }

        void SetVisible(bool visible) { m_visible = visible; }
        [[nodiscard]] bool IsVisible() const; // Checks parent visibility hierarchy

        void SetEnabled(bool enabled) { m_enabled = enabled; }
        [[nodiscard]] bool IsEnabled() const { return m_enabled; }

        Widget *GetParent() const { return m_parent; }
        const std::vector<std::shared_ptr<Widget>> &GetChildren() const { return m_children; }

    protected:
        virtual void OnUpdate(double dt) { (void)dt; }
        virtual void OnRender(Renderer &renderer) { (void)renderer; }
        virtual void OnLayoutUpdate() {}

        std::string m_name{"Widget"};
        glm::vec2 m_position{0.0f, 0.0f};
        glm::vec2 m_size{100.0f, 30.0f};
        AnchorPoint m_anchor{AnchorPoint::TopLeft};
        WidgetState m_state{WidgetState::Visible};
        bool m_visible{true};
        bool m_enabled{true};

        Widget *m_parent{nullptr};
        std::vector<std::shared_ptr<Widget>> m_children;
    };
}

#endif // PLATFORM_ENGINE_UI_WIDGETS_WIDGET_HPP
