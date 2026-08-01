#ifndef PLATFORM_EDITOR_PANELS_HIERARCHY_PANEL_HPP
#define PLATFORM_EDITOR_PANELS_HIERARCHY_PANEL_HPP

#include "editor/panels/EditorPanel.hpp"
#include <string>

namespace platform
{
    class HierarchyPanel : public EditorPanel
    {
    public:
        HierarchyPanel();

        void OnRender(EditorContext &context) override;
        [[nodiscard]] const std::string &GetName() const override { return m_name; }

        void SelectEntity(EditorContext &context, EntityID entity);
        void CreateEntity(EditorContext &context, const std::string &name);
        void DeleteEntity(EditorContext &context, EntityID entity);

        void SetParent(EditorContext &context, EntityID child, EntityID parent);
        void Unparent(EditorContext &context, EntityID child);

        void SetSearchFilter(const std::string &filter) { m_searchFilter = filter; }
        [[nodiscard]] const std::string &GetSearchFilter() const { return m_searchFilter; }

        /// Human readable label for an entity row ("#12  Player").
        [[nodiscard]] static std::string EntityLabel(EditorContext &context, EntityID entity);

    private:
        std::string m_name{"Hierarchy"};
        std::string m_searchFilter;
        float m_scroll{0.0f};
    };
}

#endif // PLATFORM_EDITOR_PANELS_HIERARCHY_PANEL_HPP
