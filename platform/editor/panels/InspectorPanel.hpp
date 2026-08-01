#ifndef PLATFORM_EDITOR_PANELS_INSPECTOR_PANEL_HPP
#define PLATFORM_EDITOR_PANELS_INSPECTOR_PANEL_HPP

#include "editor/panels/EditorPanel.hpp"
#include "engine/scene/prefab/PrefabManager.hpp"

namespace platform
{
    class InspectorPanel : public EditorPanel
    {
    public:
        InspectorPanel();

        void OnRender(EditorContext &context) override;
        [[nodiscard]] const std::string &GetName() const override { return m_name; }

        void ApplyPrefabOverrides(EditorContext &context, EntityID entity);
        void RevertPrefabOverrides(EditorContext &context, EntityID entity);

        [[nodiscard]] PrefabManager &GetPrefabManager() { return m_prefabManager; }

        /// Step applied by the inspector's +/- buttons.
        void SetNudgeStep(float step) { m_step = step; }
        [[nodiscard]] float GetNudgeStep() const { return m_step; }

    private:
        /// Draws "label [-] value [+]". Returns true when the value was edited.
        bool DrawStepper(EditorContext &context, const UIRect &row, const std::string &label, float &value, float step);

        std::string m_name{"Inspector"};
        PrefabManager m_prefabManager;
        float m_step{10.0f};
    };
}

#endif // PLATFORM_EDITOR_PANELS_INSPECTOR_PANEL_HPP
