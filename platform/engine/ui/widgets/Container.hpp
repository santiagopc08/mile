#ifndef PLATFORM_ENGINE_UI_WIDGETS_CONTAINER_HPP
#define PLATFORM_ENGINE_UI_WIDGETS_CONTAINER_HPP

#include "engine/ui/widgets/Widget.hpp"

namespace platform
{
    class Container : public Widget
    {
    public:
        Container() : Widget("Container") {}
        explicit Container(std::string name) : Widget(std::move(name)) {}

        void SetLayoutMode(LayoutMode mode) { m_layoutMode = mode; UpdateLayout(); }
        [[nodiscard]] LayoutMode GetLayoutMode() const { return m_layoutMode; }

        void SetPadding(float padding) { m_padding = padding; UpdateLayout(); }
        [[nodiscard]] float GetPadding() const { return m_padding; }

        void SetSpacing(float spacing) { m_spacing = spacing; UpdateLayout(); }
        [[nodiscard]] float GetSpacing() const { return m_spacing; }

    protected:
        void OnLayoutUpdate() override
        {
            if (m_layoutMode == LayoutMode::Absolute || m_children.empty())
            {
                return;
            }

            float currentOffset = m_padding;

            for (auto &child : m_children)
            {
                if (!child->IsVisible())
                {
                    continue;
                }

                if (m_layoutMode == LayoutMode::Vertical)
                {
                    child->SetPosition(glm::vec2(m_padding, currentOffset));
                    currentOffset += child->GetSize().y + m_spacing;
                }
                else if (m_layoutMode == LayoutMode::Horizontal)
                {
                    child->SetPosition(glm::vec2(currentOffset, m_padding));
                    currentOffset += child->GetSize().x + m_spacing;
                }
                else if (m_layoutMode == LayoutMode::Anchor)
                {
                    glm::vec2 pos(m_padding, m_padding);
                    switch (child->GetAnchor())
                    {
                    case AnchorPoint::TopLeft: pos = glm::vec2(m_padding, m_padding); break;
                    case AnchorPoint::TopCenter: pos = glm::vec2((m_size.x - child->GetSize().x) * 0.5f, m_padding); break;
                    case AnchorPoint::TopRight: pos = glm::vec2(m_size.x - child->GetSize().x - m_padding, m_padding); break;
                    case AnchorPoint::CenterLeft: pos = glm::vec2(m_padding, (m_size.y - child->GetSize().y) * 0.5f); break;
                    case AnchorPoint::Center: pos = (m_size - child->GetSize()) * 0.5f; break;
                    case AnchorPoint::CenterRight: pos = glm::vec2(m_size.x - child->GetSize().x - m_padding, (m_size.y - child->GetSize().y) * 0.5f); break;
                    case AnchorPoint::BottomLeft: pos = glm::vec2(m_padding, m_size.y - child->GetSize().y - m_padding); break;
                    case AnchorPoint::BottomCenter: pos = glm::vec2((m_size.x - child->GetSize().x) * 0.5f, m_size.y - child->GetSize().y - m_padding); break;
                    case AnchorPoint::BottomRight: pos = m_size - child->GetSize() - glm::vec2(m_padding); break;
                    }
                    child->SetPosition(pos);
                }
            }
        }

    private:
        LayoutMode m_layoutMode{LayoutMode::Absolute};
        float m_padding{0.0f};
        float m_spacing{5.0f};
    };
}

#endif // PLATFORM_ENGINE_UI_WIDGETS_CONTAINER_HPP
