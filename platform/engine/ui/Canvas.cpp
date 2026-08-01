#include "engine/ui/Canvas.hpp"
#include <algorithm>

namespace platform
{
    Canvas::Canvas() = default;

    Canvas::Canvas(std::string name, UILayer layer)
        : m_name(std::move(name)), m_layer(layer)
    {
    }

    void Canvas::Update(double dt)
    {
        if (!m_visible)
        {
            return;
        }

        for (auto &widget : m_rootWidgets)
        {
            widget->Update(dt);
        }
    }

    void Canvas::Render(Renderer &renderer)
    {
        if (!m_visible)
        {
            return;
        }

        for (auto &widget : m_rootWidgets)
        {
            widget->Render(renderer);
        }
    }

    void Canvas::UpdateLayout()
    {
        for (auto &widget : m_rootWidgets)
        {
            widget->UpdateLayout();
        }
    }

    void Canvas::AddWidget(std::shared_ptr<Widget> widget)
    {
        if (!widget)
        {
            return;
        }

        m_rootWidgets.push_back(widget);
        widget->UpdateLayout();
    }

    void Canvas::RemoveWidget(const std::shared_ptr<Widget> &widget)
    {
        auto it = std::find(m_rootWidgets.begin(), m_rootWidgets.end(), widget);
        if (it != m_rootWidgets.end())
        {
            m_rootWidgets.erase(it);
        }
    }

    std::shared_ptr<Widget> Canvas::FindWidget(const std::string &name)
    {
        for (auto &widget : m_rootWidgets)
        {
            if (widget->GetName() == name)
            {
                return widget;
            }
            auto found = widget->FindChild(name);
            if (found)
            {
                return found;
            }
        }
        return nullptr;
    }

    size_t Canvas::GetTotalWidgetCount() const
    {
        size_t count = 0;
        for (const auto &widget : m_rootWidgets)
        {
            count += CountWidgetsRecursive(widget);
        }
        return count;
    }

    size_t Canvas::CountWidgetsRecursive(const std::shared_ptr<Widget> &widget) const
    {
        if (!widget)
        {
            return 0;
        }

        size_t count = 1;
        for (const auto &child : widget->GetChildren())
        {
            count += CountWidgetsRecursive(child);
        }
        return count;
    }
}
