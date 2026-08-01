#include "engine/ui/widgets/Widget.hpp"
#include <algorithm>

namespace platform
{
    Widget::Widget() = default;

    Widget::Widget(std::string name)
        : m_name(std::move(name))
    {
    }

    void Widget::Update(double dt)
    {
        if (!IsVisible())
        {
            return;
        }

        OnUpdate(dt);

        for (auto &child : m_children)
        {
            child->Update(dt);
        }
    }

    void Widget::Render(Renderer &renderer)
    {
        if (!IsVisible())
        {
            return;
        }

        OnRender(renderer);

        for (auto &child : m_children)
        {
            child->Render(renderer);
        }
    }

    void Widget::UpdateLayout()
    {
        OnLayoutUpdate();

        for (auto &child : m_children)
        {
            child->UpdateLayout();
        }
    }

    void Widget::AddChild(std::shared_ptr<Widget> child)
    {
        if (!child || child.get() == this)
        {
            return;
        }

        if (child->m_parent)
        {
            child->m_parent->RemoveChild(child);
        }

        child->m_parent = this;
        m_children.push_back(std::move(child));
        UpdateLayout();
    }

    void Widget::RemoveChild(const std::shared_ptr<Widget> &child)
    {
        auto it = std::find(m_children.begin(), m_children.end(), child);
        if (it != m_children.end())
        {
            (*it)->m_parent = nullptr;
            m_children.erase(it);
            UpdateLayout();
        }
    }

    std::shared_ptr<Widget> Widget::FindChild(const std::string &name)
    {
        for (auto &child : m_children)
        {
            if (child->GetName() == name)
            {
                return child;
            }
            auto found = child->FindChild(name);
            if (found)
            {
                return found;
            }
        }
        return nullptr;
    }

    glm::vec2 Widget::GetAbsolutePosition() const
    {
        if (m_parent)
        {
            return m_parent->GetAbsolutePosition() + m_position;
        }
        return m_position;
    }

    bool Widget::IsVisible() const
    {
        if (!m_visible || m_state == WidgetState::Hidden)
        {
            return false;
        }

        if (m_parent)
        {
            return m_parent->IsVisible();
        }

        return true;
    }
}
