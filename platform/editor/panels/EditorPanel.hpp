#ifndef PLATFORM_EDITOR_PANELS_EDITOR_PANEL_HPP
#define PLATFORM_EDITOR_PANELS_EDITOR_PANEL_HPP

#include "editor/app/EditorContext.hpp"
#include "editor/ui/EditorUI.hpp"
#include <string>

namespace platform
{
    class EditorPanel
    {
    public:
        virtual ~EditorPanel() = default;

        virtual void OnInitialize(EditorContext &context) { (void)context; }
        virtual void OnUpdate(EditorContext &context, double dt) { (void)context; (void)dt; }
        virtual void OnRender(EditorContext &context) = 0;

        [[nodiscard]] virtual const std::string &GetName() const = 0;

        void SetVisible(bool visible) { m_visible = visible; }
        [[nodiscard]] bool IsVisible() const { return m_visible; }

        /// Screen rectangle assigned by the workspace layout each frame.
        void SetBounds(const UIRect &bounds) { m_bounds = bounds; }
        [[nodiscard]] const UIRect &GetBounds() const { return m_bounds; }

    protected:
        bool m_visible{true};
        UIRect m_bounds{};
    };
}

#endif // PLATFORM_EDITOR_PANELS_EDITOR_PANEL_HPP
